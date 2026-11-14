import {
  DEFAULT_CONFIG_VALUES,
  TimerStatus,
  type configDocs,
  type gameLocalDoc,
  type GameTimerStatus
} from '@appTypes/models'
import { Mutex } from 'async-mutex'
import { spawn } from 'child_process'
import { BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log/main.js'
import * as native from 'vnite-native'
import { baseDBManager, ConfigDBManager, GameDBManager } from '~/core/database'
import { eventBus } from '~/core/events'
import { ipcManager } from '~/core/ipc'
import { ActiveGameInfo, backupGameSave } from '~/features/game'
import { updateRecentGamesInTray } from '~/features/system'
import { simulateHotkey } from '~/utils'
import {
  refreshCollector,
  setEnhancedMonitoring,
  startCollector,
  stopCollector,
  type CollectorEvent
} from './connection'
import type { GameEvent } from './gameState'
import * as games from './gameState'

// Monitoring starts with the application and stops during shutdown.
let monitorStarted = false
let unsubscribeChanges: (() => void) | undefined

// Keep one GameSession per running game; multiple processes share its timer.
// Remove it after the last process exits or the game is stopped manually.
const sessions: Map<string, GameSession> = new Map()
const timerStatusMutex = new Mutex()

let foregroundTimer: ReturnType<typeof setTimeout> | undefined
let foregroundWaitTime = DEFAULT_CONFIG_VALUES.general.foregroundWaitTime
let foregroundPid = 0
let foregroundEnabled = false
let foregroundUpdate: Promise<void> = Promise.resolve()

let pendingEvents: GameEvent[] = []
let flushing: Promise<void> | undefined

// Setup monitoring with local game documents and observe later database changes.
// A path can be either a folder or a file depends on `launcher.mode`.
// Normalization is performed by gameState. We can hand over the path as it is.
export async function setupProcessMonitor(): Promise<void> {
  if (monitorStarted) return
  monitorStarted = true

  try {
    const [allLocalGames, general] = await Promise.all([
      GameDBManager.getAllGamesLocal(),
      ConfigDBManager.getConfigValue('general')
    ])

    // Apply the initial snapshot before subscribing to subsequent database changes.
    games.replace(Object.values(allLocalGames))

    foregroundWaitTime =
      general.foregroundWaitTime ?? DEFAULT_CONFIG_VALUES.general.foregroundWaitTime

    await syncForegroundHook(
      general.enableForegroundTimer ?? DEFAULT_CONFIG_VALUES.general.enableForegroundTimer
    )

    const unwatch = baseDBManager.onDocChange((change) => {
      if (change.dbName === 'game-local') {
        const doc = change.data._deleted ? undefined : (change.data as gameLocalDoc)
        games.updateKnownGame(change.docId, doc)
      } else if (change.dbName === 'config' && change.docId === 'general') {
        const config = change.data as configDocs['general']

        foregroundWaitTime =
          config.foregroundWaitTime ?? DEFAULT_CONFIG_VALUES.general.foregroundWaitTime
        void syncForegroundHook(
          config.enableForegroundTimer ?? DEFAULT_CONFIG_VALUES.general.enableForegroundTimer
        ).catch((error) => log.error('[Monitor] Foreground hook update failed', error))

        void setEnhancedMonitoring(config.enhancedProcessMonitoring ?? false).catch((error) =>
          log.error('[Monitor] Monitoring mode update failed', error)
        )
      }
    })

    const removeDeletionListener = eventBus.on('game:deleted', async ({ gameId }) => {
      games.remove(gameId, false)
      pendingEvents = pendingEvents.filter((event) => event.id !== gameId)
      removeGameSession(gameId)
      await refreshTimerStatus()
    })
    unsubscribeChanges = () => {
      unwatch()
      removeDeletionListener()
    }

    await startCollector(general.enhancedProcessMonitoring ?? false, handleCollectorEvent)
  } catch (error) {
    if (monitorStarted) await stopProcessMonitor()
    throw error
  }
}

function handleCollectorEvent(event: CollectorEvent): void {
  switch (event.type) {
    case 'connected':
      applyChanges(games.reconcile(event.processes))
      break
    case 'snapshot':
      applyChanges(games.reconcile(event.processes))
      break
    case 'process':
      applyChanges(games.observeProcess(event))
      break
    case 'disconnected':
      // The foreground hook stays active across collector reconnections.
      // Preserve pending transitions and their original wait time.
      break
  }
}

// Stop the independent collector; timer state is owned by the TypeScript host.
export async function stopProcessMonitor(): Promise<void> {
  monitorStarted = false
  unsubscribeChanges?.()
  unsubscribeChanges = undefined
  invalidateForeground()
  stopCollector()
  await syncForegroundHook(false)
}

// Start recording immediately after a launch; the collector supplies the process details.
export async function startMonitor(gameId: string): Promise<void> {
  if (await startGameSession(gameId)) {
    // immediately update process status for polling monitor
    refreshCollector()
  }
}

// Hook installation is a resource operation. Serialize configuration changes
// and skip pending installations after monitoring stops.
function syncForegroundHook(nextEnabled: boolean): Promise<void> {
  const update = foregroundUpdate.then(async () => {
    if ((!monitorStarted && nextEnabled) || nextEnabled === foregroundEnabled) return
    if (nextEnabled) {
      await native.installForegroundHook((error, pid) => {
        if (!monitorStarted || !foregroundEnabled) return
        if (error) {
          log.error('[Monitor] Foreground hook failed', error)
          return
        }
        observeForeground(pid)
      })
      foregroundEnabled = true
    } else {
      foregroundEnabled = false
      invalidateForeground()
      await native.uninstallForegroundHook()
    }
  })
  // Keep later configuration changes runnable while returning this operation's failure to its caller.
  foregroundUpdate = update.catch(() => {})
  return update
}

function observeForeground(pid: number): void {
  // Same-PID and Magpie observations leave the existing timer running.
  const game = games.find(pid)
  const path = game?.path ?? (pid === 0 ? '' : native.getProcessPath(pid))
  if (path.toLowerCase().endsWith('magpie.exe')) return
  const nextPid = game ? pid : 0
  if (nextPid === foregroundPid) return
  foregroundPid = nextPid
  invalidateForeground()
  foregroundTimer = setTimeout(
    async () => {
      foregroundTimer = undefined
      try {
        for (const [id, session] of sessions) {
          session.pushForegroundChange(game?.id === id ? TimerStatus.Resumed : TimerStatus.Paused)
        }
        await refreshTimerStatus()
      } catch (error) {
        log.error('[Monitor] Foreground handling failed', error)
      }
    },
    Math.max(0, foregroundWaitTime) * 1000
  )
}

function invalidateForeground(): void {
  clearTimeout(foregroundTimer)
  foregroundTimer = undefined
}

// Observation updates are synchronous. Business effects are delivered in order
// separately; a failed event must not block subsequent game events.
function applyChanges(changes: GameEvent[]): void {
  for (const event of changes) {
    // A pending foreground observation takes precedence over process discovery,
    // including processes first reported by a reconnect snapshot.
    if (event.status === 'started' && !foregroundTimer) {
      foregroundPid = event.pid
    }
  }
  pendingEvents.push(...changes)
  if (flushing || !pendingEvents.length) return
  flushing = (async () => {
    while (pendingEvents.length) {
      const event = pendingEvents[0]
      try {
        await handleGameEvent(event)
      } catch (error) {
        log.error('[Monitor] Game event handling failed', error)
      } finally {
        if (pendingEvents[0] === event) pendingEvents.shift()
      }
    }
  })().finally(() => {
    flushing = undefined
  })
}

// Callback function get invoked only when a known game is started or stopped
async function handleGameEvent(event: GameEvent): Promise<void> {
  const gameId = event.id

  switch (event.status) {
    // a known game process is started...
    case 'started': {
      if (!(await GameDBManager.getExistingGame(gameId))) return
      if (pendingEvents[0] !== event) return
      await startGameSession(gameId, event.path, event.pid)
      break
    }
    // a known game process is stopped...
    case 'terminated': {
      await handleProcessExit(gameId, event.pid)
      break
    }
  }
}

// Session registration and IPC ownership stay together in the coordinator.
function removeGameSession(gameId: string, session = sessions.get(gameId)): boolean {
  if (!session || sessions.get(gameId) !== session) return false
  sessions.delete(gameId)
  ipcMain.removeHandler(`stop-game-${gameId}`)
  session.dispose()
  ActiveGameInfo.removeGameInfo(gameId)
  return true
}

function finishGameSession(gameId: string, session: GameSession): void {
  if (!removeGameSession(gameId, session)) return
  // Persistence and backup must not prevent a new session from being registered.
  void session.finish().catch((error) => log.error('[Monitor] Game finalization failed', error))
}

async function handleProcessExit(gameId: string, pid: number): Promise<void> {
  const session = sessions.get(gameId)
  if (session && (await session.processExited(pid))) finishGameSession(gameId, session)
  await refreshTimerStatus()
}

// Record game time from a launch request or a collected process event.
// If the game is being launched from main window, the `path` and `pid` is supposed to be `undefined`,
// if this function is invoked from a process event callback, the `path` and `pid` is supposed to be set.
async function startGameSession(gameId: string, path?: string, pid?: number): Promise<boolean> {
  let session = sessions.get(gameId)
  const created = !session
  if (!session) {
    session = new GameSession(gameId)
    const registered = session
    ipcMain.handle(`stop-game-${gameId}`, async (_event, requestedGameId: string) => {
      if (requestedGameId !== gameId || sessions.get(gameId) !== registered) return
      try {
        if (!(await registered.terminateProcesses())) return
      } catch (error) {
        // Process termination failure must not interrupt the remaining finalization steps.
        // Manual stop is the user's last resort for ending the timer when normal exit handling fails.
        log.warn(`[Monitor] Process termination failed for game ${gameId}`, error)
      }
      finishGameSession(gameId, registered)
      await refreshTimerStatus()
    })
    sessions.set(gameId, session)
  }

  session.begin()
  if (path && pid) await session.processStarted(path, pid)
  // A deleted or stopped session cannot publish a late start notification.
  if (sessions.get(gameId) !== session) return false

  // a new game is just started
  if (created) {
    // send message to notify renderer thread
    ipcManager.send('game:started', gameId)
    // Emit event after launching the game
    eventBus.emit('game:launched', { gameId }, { source: 'monitorCoordinator' })
  }
  await refreshTimerStatus()
  return created
}

async function refreshTimerStatus(): Promise<void> {
  await timerStatusMutex.runExclusive(async () => {
    const gameTimerStatus: GameTimerStatus[] = []
    for (const [gameId, session] of sessions) {
      // Check if game exists before accessing properties.
      const game = await GameDBManager.getExistingGame(gameId)
      if (sessions.get(gameId) !== session) continue
      if (!game) {
        log.warn(`[Monitor] Removing monitor for non-existent game ID: ${gameId}`)
        removeGameSession(gameId, session)
        continue
      }

      gameTimerStatus.push({
        name: game.metadata.name,
        status: session.getTimerStatus()
      })
    }
    ipcManager.send('monitor:timer-status-change', gameTimerStatus)
  })
}

async function checkIfProcessRunning(processName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = spawn('tasklist', ['/FI', `IMAGENAME eq ${processName}`])
    let output = ''

    cmd.stdout.on('data', (data) => {
      output += data.toString()
    })

    cmd.on('close', () => {
      resolve(output.toLowerCase().includes(processName.toLowerCase()))
    })
  })
}

async function startMagpie(): Promise<void> {
  try {
    const magpiePath = await ConfigDBManager.getConfigLocalValue('game.linkage.magpie.path')
    if (magpiePath) {
      const isRunning = await checkIfProcessRunning('Magpie.exe')
      if (isRunning) {
        console.log('Magpie is already running.')
        return
      }
      const magpie = spawn('start', ['""', `"${magpiePath}" -t`], {
        shell: true,
        detached: true,
        stdio: 'ignore'
      })
      magpie.unref()
    }
  } catch (error) {
    console.error('Failed to start Magpie:', error)
  }
}

interface MonitoredProcess {
  path: string
  isRunning: boolean
  pid: number
}

class GameSession {
  private monitoredProcesses: MonitoredProcess[] = []
  private startTime?: string
  private endTime?: string
  private foregroundChanges: { time: string; eventType: TimerStatus }[] = []
  private stopping: boolean = false
  // a mutex for operations which need to write `monitoredProcesses`
  private mutex = new Mutex()

  constructor(private gameId: string) {}

  public begin(): void {
    // When users launch a game from Vnite, the launcher calls this method before
    // the process collector has reported its path and pid, so we record the start
    // time now and wait for processStarted() to register the process details.
    // If the user is unlucky enough to encounter an event loss case, they can still manually
    // stop the game from the Vnite main window to ensure the play time is recorded properly.
    if (!this.startTime) this.startTime = new Date().toISOString()
  }

  public dispose(): void {
    // Prevent unfinished process registration from continuing after removal.
    this.stopping = true
  }

  public async terminateProcesses(): Promise<boolean> {
    if (this.stopping) return false
    this.stopping = true
    // Snapshot under the lock, then release it before the native call can show UAC.
    const paths = await this.mutex.runExclusive(() =>
      this.monitoredProcesses.filter((process) => process.isRunning).map((process) => process.path)
    )
    await native.terminateProcesses([...new Set(paths)])
    return true
  }

  public pushForegroundChange(eventType: TimerStatus): void {
    const time = new Date().toISOString()
    this.foregroundChanges.push({ time, eventType })
  }

  public getTimerStatus(): TimerStatus {
    return this.foregroundChanges.at(-1)?.eventType ?? TimerStatus.Resumed
  }

  // This function may be invoked multiple times in a single GameSession object if the
  // monitoring mode is `folder` and there are more than one executables inside that folder
  // are launched.
  public async processStarted(fullpath: string, pid: number): Promise<void> {
    await this.mutex.runExclusive(async () => {
      if (this.stopping || this.monitoredProcesses.some((process) => process.pid === pid)) {
        return
      }
      const monitoredProcess = {
        path: fullpath,
        pid: pid,
        isRunning: true
      }

      ActiveGameInfo.updateGameInfo(this.gameId, {
        pid: pid,
        path: fullpath
      })
      // Register before asynchronous linkage so a manual stop can still find this process.
      this.monitoredProcesses.push(monitoredProcess)
      try {
        // Check if Magpie scaling is enabled
        const useMagpie = await GameDBManager.getGameLocalValue(this.gameId, 'launcher.useMagpie')
        const magpiePath = await ConfigDBManager.getConfigLocalValue('game.linkage.magpie.path')
        if (this.stopping) return

        if (useMagpie && magpiePath) {
          await startMagpie()
          // Wait a while for the game window to fully load
          await new Promise((resolve) => setTimeout(resolve, 1000))
          // Simulate pressing the Magpie shortcut
          const magpieHotkey = await ConfigDBManager.getConfigLocalValue(
            'game.linkage.magpie.hotkey'
          )
          if (this.stopping) return
          simulateHotkey(magpieHotkey)
        }
      } catch (error) {
        // Optional linkage failure must not undo process registration or interrupt game timing.
        log.error(`[Monitor] Magpie linkage failed for game ${this.gameId}`, error)
      }
    })
  }

  // This function may be invoked multiple times in a single GameSession object if the
  // monitoring mode is `folder` and there are more than one executables inside that folder
  // are terminated.
  // Return `true` if all the processes are stopped, `false` if there are still some processes
  // keep running.
  public async processExited(pid: number): Promise<boolean> {
    const isAllExited = await this.mutex.runExclusive(() => {
      const process = this.monitoredProcesses.find((process) => process.pid === pid)
      if (process) {
        process.isRunning = false
      }
      // if all monitored processes are stopped
      if (
        this.monitoredProcesses.length === 0 ||
        this.monitoredProcesses.every((x) => !x.isRunning)
      ) {
        return true
      }
      return false
    })
    return isAllExited
  }

  private async restoreWindowAfterGameExit(): Promise<void> {
    try {
      const showWindowAfterGameExit = await ConfigDBManager.getConfigValue(
        'general.showWindowAfterGameExit'
      )
      if (!showWindowAfterGameExit) {
        return
      }

      const mainWindow = BrowserWindow.getAllWindows()[0]
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      }
    } catch (error) {
      log.warn('[Monitor] Failed to restore the window after game exit:', error)
    }
  }

  // Finalization runs after removal and does not hold the process mutex during persistence or backup.
  public async finish(): Promise<void> {
    let playTime = 0

    try {
      log.info(`Game ${this.gameId} Exit`)

      // Record end time
      this.endTime = new Date().toISOString()

      // Restore the window in parallel so non-critical config reads do not delay exit handling or playtime persistence.
      void this.restoreWindowAfterGameExit()

      ipcManager.send('game:exiting', this.gameId)

      /**
       * Exit notifications originate from an external process collector and must not be trusted by
       * default, given the complexity of keeping its state synchronized with the application.
       *
       * A past (now fixed) synchronization issue caused it to report exits for games that had
       * already been deleted, allowing subsequent database access to recreate them as partial
       * "ghost" entries.
       *
       * Do not place any database helper that may insert data before this read-only existence check.
       */
      const game = await GameDBManager.getExistingGame(this.gameId)

      if (!game) {
        log.info(`Skip exit persistence for deleted game ${this.gameId}`)
        return
      }

      const timers: { start: string; end: string }[] = []

      let time = this.startTime!
      let stat = TimerStatus.Resumed
      for (const change of this.foregroundChanges) {
        if (change.eventType === stat) {
          continue
        }
        switch (change.eventType) {
          case TimerStatus.Paused: // status changed from 'continue' to 'pause', push this playing period
            timers.push({
              start: time,
              end: change.time
            })
            break
          case TimerStatus.Resumed: // status changed from 'pause' to 'continue', keep the start time (just break)
            break
        }
        stat = change.eventType
        time = change.time
      }
      // after the end of loop, check if we need to record the last playing period
      if (stat === TimerStatus.Resumed) {
        timers.push({
          start: time,
          end: this.endTime
        })
      }

      const breakThreshold =
        (await ConfigDBManager.getConfigValue('general.ignoreShortInterruptions')) * 1000
      const sessionThreshold =
        (await ConfigDBManager.getConfigValue('general.ignoreShortSessions')) * 1000

      let filteredTimers = timers
      if (breakThreshold > 0 && timers.length >= 2) {
        filteredTimers = []
        filteredTimers.push(timers[0])
        for (let i = 1; i < timers.length; i++) {
          const prevEnd = new Date(timers[i - 1].end).getTime()
          const curStart = new Date(timers[i].start).getTime()
          if (curStart - prevEnd < breakThreshold) {
            const prevFiltered = filteredTimers.pop()
            if (prevFiltered) {
              filteredTimers.push({ start: prevFiltered.start, end: timers[i].end })
            } else {
              filteredTimers.push(timers[i])
            }
          } else {
            filteredTimers.push(timers[i])
          }
        }
      }

      if (sessionThreshold > 0) {
        filteredTimers = filteredTimers.filter((timer) => {
          return new Date(timer.end).getTime() - new Date(timer.start).getTime() > sessionThreshold
        })
      }

      const dbTimers = await GameDBManager.getGameValue(this.gameId, 'record.timers')
      playTime = await GameDBManager.getGameValue(this.gameId, 'record.playTime')
      for (const timer of filteredTimers) {
        dbTimers.push(timer)
        playTime += new Date(timer.end).getTime() - new Date(timer.start).getTime()
      }

      await GameDBManager.setGameValue(this.gameId, 'record.timers', dbTimers)
      await GameDBManager.setGameValue(this.gameId, 'record.lastRunDate', this.endTime)
      await GameDBManager.setGameValue(this.gameId, 'record.hideFromRecentGames', false)
      await GameDBManager.setGameValue(this.gameId, 'record.playTime', playTime)

      // The coordinator has already released the IPC handler so a restarted game can be monitored.

      const autoBackupSave = await GameDBManager.getGameValue(this.gameId, 'save.autoBackupSave')
      const savePaths = await GameDBManager.getGameLocalValue(this.gameId, 'path.savePaths')

      if (autoBackupSave && filteredTimers.length > 0 && savePaths.some(Boolean)) {
        await backupGameSave(this.gameId)
      }
    } finally {
      // Finish exit notifications after persistence and backup.

      updateRecentGamesInTray()

      ipcManager.send('game:exited', this.gameId)
      eventBus.emit(
        'game:stopped',
        {
          gameId: this.gameId,
          duration: playTime
        },
        { source: 'monitor' }
      )
    }
  }
}
