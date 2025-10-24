import * as native from 'vnite-native'
import log from 'electron-log/main.js'
import { eventBus } from '~/core/events'
import { GameDBManager, ConfigDBManager } from '~/core/database'
import { GameMonitor } from './monitor'
import { ipcManager } from '~/core/ipc'
import { Mutex } from 'async-mutex'
import { GameTimerStatus, TimerStatus } from '@appTypes/models'

// A static monitor {gameId - GameMonitor} hash map that keeps a stub of all running
// game processes, preventing GC from reclaiming memory.
// When a known process is terminated, it is designed to be removed from this hash map.
const monitors: Map<string, GameMonitor> = new Map()
const mutex: Mutex = new Mutex()

// The TypeScript configuration "isolatedModules" is enabled, which prohibits the use
// of enum values directly. This const mirrors `native.Process.ProcessEventType`.
const ProcessEventType = {
  Creation: 0,
  Termination: 1
}

// Setup native monitor by giving it a full list of path-id pairs of local games.
// A path can be either a folder or a file depends on `launcher.mode`.
// Normalization will be performed within the native module. We can simply hand over the path as it is.
export async function setupNativeMonitor(): Promise<void> {
  const allLocalGames = await GameDBManager.getAllGamesLocal()
  const pathes: string[] = []
  const ids: string[] = []
  Object.values(allLocalGames).forEach((doc) => {
    const mode = doc.launcher.mode
    const path = doc.launcher[`${mode}Config`].monitorPath
    pathes.push(path)
    ids.push(doc._id)
  })
  await native.startMonitoring(pathes, ids, processEventCallback)
}

// Send a termination signal to native monitor.
export async function stopNativeMonitor(): Promise<void> {
  await native.stopMonitoring()
}

// Callback function get invoked only when a known game is started or stopped
export async function processEventCallback(
  err: Error | null,
  arg: native.ProcessEvent
): Promise<void> {
  if (err) {
    log.error('failed to invoke process event callback from native module: ', err.message)
    return
  }
  const gameId = arg.id

  switch (arg.eventType) {
    // a known game process is started...
    case ProcessEventType.Creation: {
      startPhantomMonitor(gameId, arg.fullPath, arg.pid)
      break
    }
    // a known game process is stopped...
    case ProcessEventType.Termination: {
      await stopPhantomMonitor(gameId, arg.pid)
      break
    }
  }
}

export async function removeMonitorStub(gameId: string): Promise<void> {
  await mutex.runExclusive(() => {
    monitors.delete(gameId)
  })
  await refreshTimerStatus()
}

// Update known game list
export async function updateKnownGames(): Promise<void> {
  const allLocalGames = await GameDBManager.getAllGamesLocal()
  const pathes: string[] = []
  const ids: string[] = []
  Object.values(allLocalGames).forEach((doc) => {
    const mode = doc.launcher.mode
    const path = doc.launcher[`${mode}Config`].monitorPath
    pathes.push(path)
    ids.push(doc._id)
  })
  await native.replaceKnownGames(pathes, ids)
}

async function stopPhantomMonitor(gameId: string, pid?: number): Promise<void> {
  await mutex.runExclusive(async () => {
    const monitor = monitors.get(gameId)
    if (!monitor) {
      await refreshTimerStatus()
      return
    }
    if (pid) {
      if (await monitor.phantomStop(pid)) {
        // if game was stopped, remove corresponding monitor from hash map
        monitors.delete(gameId)
      }
    } else {
      monitors.delete(gameId)
    }
    await refreshTimerStatus()
  })
}

// Start monitor without really monitoring the game for compatibility reasons
export async function startPhantomMonitor(
  gameId: string,
  path?: string,
  pid?: number
): Promise<void> {
  await mutex.runExclusive(async () => {
    let notFound = false
    let monitor = monitors.get(gameId)
    // if not found, spawn a new one
    if (!monitor) {
      notFound = true
      monitor = await spawnLegacyMonitor(gameId)
      // if spawning failed, do nothing and returns
      if (!monitor) {
        return
      }
    }

    // imitate monitoring
    await monitor.phantomStart(gameId, path, pid)

    // a new game is just started
    if (notFound) {
      monitors.set(gameId, monitor)
      // send message to notify renderer thread
      ipcManager.send('game:started', gameId)
      // Emit event after launching the game
      eventBus.emit(
        'game:launched',
        {
          gameId
        },
        { source: 'nativeMonitor' }
      )
    }
    await refreshTimerStatus()
  })
}

// Spawn a legacy monitor without really monitoring the game for compatibility reasons
async function spawnLegacyMonitor(gameId: string): Promise<GameMonitor | undefined> {
  try {
    const launcherMode = await GameDBManager.getGameLocalValue(gameId, 'launcher.mode')
    const monitorMode = await GameDBManager.getGameLocalValue(
      gameId,
      `launcher.${launcherMode}Config.monitorMode`
    )
    const monitorPath = await GameDBManager.getGameLocalValue(
      gameId,
      `launcher.${launcherMode}Config.monitorPath`
    )
    const monitor = new GameMonitor({
      gameId,
      config: {
        mode: monitorMode,
        path: monitorPath
      }
    })
    return monitor
  } catch (error) {
    log.error(`[Monitor] Failed to start monitor ${gameId}`, error)
    return undefined
  }
}

async function foregroundEventCallback(err: Error | null, gameId: string): Promise<void> {
  if (err) {
    log.error('failed to invoke foreground event callback from native module: ', err.message)
    return
  }
  await mutex.runExclusive(async () => {
    for (const [id, monitor] of monitors) {
      if (gameId !== id) {
        monitor.pushForegroundChange(TimerStatus.Paused)
      } else {
        monitor.pushForegroundChange(TimerStatus.Resumed)
      }
    }
    await refreshTimerStatus()
  })
}

export async function refreshTimerStatus(): Promise<void> {
  if (monitors.size === 0) {
    ipcManager.send('monitor:timer-status-change', [])
    return
  }
  const gameTimerStatus: GameTimerStatus[] = []
  for (const [gameId, monitor] of monitors) {
    gameTimerStatus.push({
      name: (await GameDBManager.getGame(gameId)).metadata.name,
      status: monitor.getTimerStatus()
    })
  }
  ipcManager.send('monitor:timer-status-change', gameTimerStatus)
}

export async function enableForegroundHook(): Promise<void> {
  const waitTime = await ConfigDBManager.getConfigValue('general.foregroundWaitTime')
  await native.installForegroundHook(foregroundEventCallback, waitTime)
}

export async function disableForegroundHook(): Promise<void> {
  await native.uninstallForegroundHook()
}

export function changeForegroundWaitTime(waitTime: number): void {
  native.setForegroundWaitTime(waitTime)
}
