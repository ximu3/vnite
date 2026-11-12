import type { gameLocalDoc } from '@appTypes/models'
import log from 'electron-log/main.js'

export interface ProcessObservation {
  pid: number
  path: string
}

export interface GameEvent {
  id: string
  pid: number
  path: string
  status: 'started' | 'terminated'
}

function normalizeGamePath(path: string): string {
  return path
    .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
    .replace(/[\\/]+$/, '')
    .replaceAll('/', '\\')
}

// normalized monitor path (directory, executable path, or filename) -> game ID.
const known = new Map<string, string>()
const running = new Map<string, { id: string; pid: number; path: string }>()

// Setup the path index from local game documents; running records survive replacement.
export function replace(docs: gameLocalDoc[]): void {
  known.clear()
  for (const doc of docs) updateKnownGame(doc._id, doc)
}

// Update known game list directly from the database change, without a second read.
export function updateKnownGame(gameId: string, doc?: gameLocalDoc): void {
  remove(gameId, true)
  if (!doc) return
  const pair = getLocalGamePair(doc)
  if (pair) add(pair[1], pair[0])
}

function getLocalGamePair(doc: gameLocalDoc): [string, string] | undefined {
  const mode = doc.launcher?.mode
  if (!mode) {
    log.warn(
      `[Monitor] Detected an undefined local game launcher mode, database may be corrupt. Local doc id: ${doc._id}, path: ${doc?.path?.gamePath}`
    )
    return undefined
  }
  const monitorPath = doc.launcher[`${mode}Config`]?.monitorPath
  if (!monitorPath) {
    log.warn(
      `[Monitor] Detected an undefined monitorPath. Local doc id: ${doc._id}, mode: ${mode}, game path: ${doc?.path?.gamePath}`
    )
    return undefined
  }
  return [doc._id, monitorPath]
}

function add(path: string, id: string): void {
  known.set(normalizeGamePath(path), id)
}

export function remove(id: string, preserveRunning: boolean): void {
  for (const [path, gameId] of known) if (gameId === id) known.delete(path)
  if (!preserveRunning) for (const [key, game] of running) if (game.id === id) running.delete(key)
}

function match(path: string): string | undefined {
  const split = path.lastIndexOf('\\')
  if (split < 0) return known.get(path)
  return known.get(path.slice(0, split)) ?? known.get(path) ?? known.get(path.slice(split + 1))
}

export function find(pid: number): { id: string; pid: number; path: string } | undefined {
  return [...running.values()].find((game) => game.pid === pid)
}

export function observeProcess(message: {
  pid: number
  path: string
  status: 'started' | 'terminated'
}): GameEvent[] {
  const changes: GameEvent[] = []
  if (message.status === 'started') {
    const path = normalizeGamePath(message.path)
    const id = match(path)
    const key = `${path}-${message.pid}`
    if (!id || running.has(key)) return changes
    const game = { id, path, pid: message.pid }
    running.set(key, game)
    changes.push({ ...game, status: 'started' })
  } else {
    for (const [key, game] of running) {
      if (game.pid !== message.pid) continue
      running.delete(key)
      changes.push({ ...game, status: 'terminated' })
    }
  }
  return changes
}

export function reconcile(processes: ProcessObservation[]): GameEvent[] {
  const changes: GameEvent[] = []
  const alive = new Set(processes.map((process) => process.pid))
  for (const pid of new Set([...running.values()].map((game) => game.pid))) {
    if (!alive.has(pid)) changes.push(...observeProcess({ pid, path: '', status: 'terminated' }))
  }
  for (const process of processes) {
    // Inaccessible paths are still evidence that a known PID is alive.
    if (process.path) changes.push(...observeProcess({ ...process, status: 'started' }))
  }
  return changes
}
