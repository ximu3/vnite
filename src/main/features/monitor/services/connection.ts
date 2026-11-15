import type { MonitorMode, MonitorStatus } from '@appTypes/monitor'
import { spawn } from 'child_process'
import { randomBytes } from 'crypto'
import { app } from 'electron'
import log from 'electron-log/main.js'
import { once } from 'events'
import { createConnection, Socket } from 'net'
import path from 'path'
import { setTimeout as delay } from 'timers/promises'
import * as native from 'vnite-native'
import { z } from 'zod'
import { ipcManager } from '~/core/ipc'
import type { ProcessObservation } from './gameState'

const PROTOCOL_VERSION = 8
// Snapshots are returned in one frame, including during initialization.
const MAX_FRAME = 16 * 1024 * 1024
const id = z.number().int().nonnegative().max(0xffffffff)
const observation = z.object({ pid: id, path: z.string() })
const serverMessage = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hello'),
    version: z.literal(PROTOCOL_VERSION),
    token: z.string(),
    elevated: z.boolean(),
    processes: z.array(observation)
  }),
  z.object({
    type: z.literal('snapshot'),
    processes: z.array(observation)
  }),
  z.object({
    type: z.literal('process'),
    pid: id,
    path: z.string(),
    status: z.enum(['started', 'terminated'])
  }),
  z.object({
    type: z.literal('log'),
    level: z.enum(['info', 'error', 'debug']),
    message: z.string()
  })
])
type ServerMessage = z.infer<typeof serverMessage>
type MonitorUpdate = Extract<ServerMessage, { type: 'process' | 'snapshot' }>

export type CollectorEvent =
  | MonitorUpdate
  | { type: 'connected'; processes: ProcessObservation[] }
  | { type: 'disconnected' }

class ElevationCancelled extends Error {}

let activeConnection: MonitorConnection | undefined
const pendingConnections = new Set<MonitorConnection>()
// The observer is registered at startup and removed when the collector is stopped.
let observer: ((event: CollectorEvent) => void) | undefined
// Keep the requested preference when the collector falls back to normal mode.
let enhancedPreference = false
let modeChangeTask: Promise<void> | undefined
let recoveryTask: Promise<void> | undefined
let monitorStatus: MonitorStatus = { state: 'stopped', mode: null }

export const getMonitorStatus = (): MonitorStatus => ({ ...monitorStatus })

function updateStatus(change: Partial<MonitorStatus>): void {
  monitorStatus = { ...monitorStatus, ...change }
  ipcManager.send('monitor:status-changed', getMonitorStatus())
}

export async function startCollector(
  enhanced: boolean,
  onEvent: (event: CollectorEvent) => void
): Promise<void> {
  if (monitorStatus.state !== 'stopped') return
  observer = onEvent
  enhancedPreference = enhanced
  updateStatus({ state: 'starting' })
  // Start the preferred mode; fall back to normal if elevated startup fails.
  await applyRequestedMode()
}

export async function setEnhancedMonitoring(enabled: boolean): Promise<void> {
  if (enabled === enhancedPreference) return modeChangeTask
  enhancedPreference = enabled
  await applyRequestedMode()
}

function applyRequestedMode(): Promise<void> {
  if (modeChangeTask) return modeChangeTask

  // Serialize startup and preference changes, retaining the latest request
  // while a connection is opening or the user is responding to UAC.
  const task = Promise.resolve().then(async () => {
    try {
      while (modeChangeTask === task) {
        const requested = enhancedPreference
        await requestMode(requested ? 'enhanced' : 'normal')
        if (requested === enhancedPreference) break
      }
    } finally {
      if (modeChangeTask === task) modeChangeTask = undefined
    }
  })
  modeChangeTask = task
  return task
}

async function requestMode(mode: MonitorMode): Promise<void> {
  try {
    await replaceConnection(mode)
  } catch (error) {
    if (monitorStatus.state === 'stopped') return
    if (!(error instanceof ElevationCancelled)) log.error('[Monitor] Mode change failed', error)
    if (mode === 'enhanced' && !activeConnection) {
      await requestMode('normal')
      return
    }
    updateStatus({
      state: activeConnection ? 'ready' : 'unavailable',
      mode: activeConnection?.mode ?? null
    })
  }
}

async function replaceConnection(mode: MonitorMode, recovering = false): Promise<void> {
  if (activeConnection?.mode === mode) {
    updateStatus({ state: 'ready' })
    return
  }
  const connection = new MonitorConnection(mode)
  pendingConnections.add(connection)
  if (!recovering) updateStatus({ state: 'starting' })

  try {
    // No lifecycle lock is held while the user responds to UAC. Ordinary
    // recovery may prepare another connection in parallel.
    const initialSnapshot = await connection.open()
    if (recovering && activeConnection) {
      connection.close()
      return
    }

    // Handoff is synchronous: observation callbacks must not await business
    // effects. Retain the old connection if activation fails.
    const old = activeConnection
    activeConnection = connection
    try {
      observer?.({ type: 'connected', processes: initialSnapshot })
      connection.activate(
        (update) => {
          if (activeConnection !== connection) return
          try {
            observer?.(update)
          } catch (error) {
            log.error('[Monitor] State update failed', error)
          }
        },
        () => {
          if (activeConnection !== connection) return
          activeConnection = undefined
          observer?.({ type: 'disconnected' })
          recover()
        }
      )
    } catch (error) {
      activeConnection = old
      observer?.({ type: 'disconnected' })
      throw error
    }
    updateStatus({ state: 'ready', mode })
    old?.close()
  } catch (error) {
    connection.close()
    throw error
  } finally {
    pendingConnections.delete(connection)
  }
}

function recover(): void {
  if (recoveryTask) return
  updateStatus({ state: 'recovering', mode: null })
  recoveryTask = replaceConnection('normal', true)
    .catch((error) => {
      log.warn('[Monitor] Recovery attempt failed', error)
      if (!activeConnection) updateStatus({ state: 'unavailable', mode: null })
    })
    .finally(() => {
      recoveryTask = undefined
    })
}

export function stopCollector(): void {
  observer = undefined
  modeChangeTask = undefined
  recoveryTask = undefined
  const connections = new Set([activeConnection, ...pendingConnections])
  activeConnection = undefined
  pendingConnections.clear()
  for (const connection of connections) connection?.close()
  updateStatus({ state: 'stopped', mode: null })
}

export function refreshCollector(): void {
  try {
    activeConnection?.refresh()
  } catch (error) {
    log.warn('[Monitor] Refresh failed', error)
  }
}

class MonitorConnection {
  private socket?: Socket
  private closed = false
  private ready = false
  private backlog: MonitorUpdate[] = []
  private onUpdate?: (update: MonitorUpdate) => void
  private onDisconnect?: () => void

  constructor(readonly mode: MonitorMode) {}

  async open(): Promise<ProcessObservation[]> {
    const token = randomBytes(32).toString('hex')
    const pipe = `\\\\.\\pipe\\vnite-monitor-${randomBytes(16).toString('hex')}`
    await launchMonitor(pipe, token, this.mode === 'enhanced')
    if (this.closed) {
      // A launch superseded during UAC will exit when its connection deadline expires.
      throw new Error('Monitor launch superseded')
    }

    try {
      const deadline = Date.now() + 10000
      while (!this.socket && Date.now() < deadline && !this.closed) {
        const socket = createConnection(pipe)
        try {
          await once(socket, 'connect')
          if (this.closed) socket.destroy()
          else this.socket = socket
        } catch {
          socket.destroy()
          await delay(50)
        }
      }
      if (!this.socket || this.closed) throw new Error('Monitor connection timed out')

      const socket = this.socket
      const decoder = new FrameDecoder()
      return await new Promise<ProcessObservation[]>((resolve, reject) => {
        // One failure path settles initialization and releases the connection.
        const fail = (error: Error): void => {
          clearTimeout(timer)
          reject(error)
          this.fail()
        }
        const timer = setTimeout(() => fail(new Error('Monitor initialization timed out')), 10000)

        socket.on('error', fail)
        socket.on('close', () => fail(new Error('Monitor disconnected')))
        socket.on('data', (chunk: Buffer) => {
          try {
            for (const message of decoder.push(chunk)) {
              if (message.type === 'hello') {
                if (this.ready || message.token !== token)
                  throw new Error('Invalid monitor handshake')
                if (this.mode === 'enhanced' && !message.elevated)
                  throw new Error('Monitor is not elevated')

                this.ready = true

                clearTimeout(timer)
                resolve(message.processes)
              } else {
                if (!this.ready) throw new Error('Missing monitor handshake')
                this.receive(message)
              }
            }
          } catch (error) {
            fail(error instanceof Error ? error : new Error(String(error)))
          }
        })

        this.send({ type: 'hello', version: PROTOCOL_VERSION, token, mode: this.mode })
      })
    } catch (error) {
      this.close()
      throw error
    }
  }

  activate(update: (update: MonitorUpdate) => void, disconnected: () => void): void {
    if (this.closed) throw new Error('Monitor disconnected before activation')
    this.onUpdate = update
    this.onDisconnect = disconnected
    for (const message of this.backlog) update(message)
    this.backlog = []
  }

  private receive(message: Exclude<ServerMessage, { type: 'hello' }>): void {
    if (message.type === 'log') {
      log[message.level](`[Process monitor] ${message.message}`)
      return
    }

    // Enqueue snapshots and events at the frame boundary, preserving their
    // order even when several arrive in the same socket data chunk.
    if (this.onUpdate) this.onUpdate(message)
    else {
      if (this.backlog.length >= 8192) throw new Error('Monitor initialization backlog exceeded')
      this.backlog.push(message)
    }
  }

  private send(message: unknown): void {
    if (this.closed || !this.socket) throw new Error('Monitor is not connected')
    if (this.socket.writableLength > 1024 * 1024) throw new Error('Monitor command queue exceeded')
    this.socket.write(encodeFrame(message))
  }

  refresh(): void {
    this.send({ type: 'refresh' })
  }

  private fail(): void {
    if (this.closed) return
    this.closed = true

    this.socket?.destroy()
    this.onDisconnect?.()
  }

  close(): void {
    this.onDisconnect = undefined
    this.fail()
  }
}

async function launchMonitor(pipe: string, token: string, enhanced: boolean): Promise<void> {
  if (process.platform !== 'win32') throw new Error('Process monitoring requires Windows')
  const exe = app.isPackaged
    ? path.join(process.resourcesPath, 'monitor', 'vnite-process-monitor.exe')
    : path.join(app.getAppPath(), 'native', 'dist', 'vnite-process-monitor.exe')

  const args = [pipe, token, String(process.pid)]
  if (!enhanced) {
    return new Promise((resolve, reject) => {
      const child = spawn(exe, args, { windowsHide: true, stdio: 'ignore' })
      child.once('spawn', () => {
        child.unref()
        resolve()
      })
      child.once('error', () => reject(new Error('Failed to launch the process collector')))
    })
  } else {
    try {
      await native.launchElevated(exe, args)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'Cancelled') {
        throw new ElevationCancelled('Elevation cancelled')
      }
      throw error
    }
  }
}

function encodeFrame(message: unknown): Uint8Array {
  const body = new TextEncoder().encode(JSON.stringify(message))
  if (!body.length || body.length > MAX_FRAME) throw new Error('Invalid monitor frame length')

  const frame = new Uint8Array(body.length + 4)
  new DataView(frame.buffer).setUint32(0, body.length, true)
  frame.set(body, 4)
  return frame
}

class FrameDecoder {
  private readonly header = Buffer.allocUnsafe(4)
  private buffer = this.header
  private offset = 0
  private readonly decoder = new TextDecoder('utf-8', { fatal: true })

  push(chunk: Buffer): ServerMessage[] {
    const messages: ServerMessage[] = []
    let consumed = 0
    while (consumed < chunk.length) {
      const length = Math.min(this.buffer.length - this.offset, chunk.length - consumed)
      chunk.copy(this.buffer, this.offset, consumed, consumed + length)
      this.offset += length
      consumed += length
      if (this.offset < this.buffer.length) continue

      if (this.buffer === this.header) {
        const size = this.header.readUInt32LE(0)
        if (!size || size > MAX_FRAME) throw new Error('Invalid monitor frame length')
        // Allocate once per frame; fragmented input never recopies the accumulated body.
        this.buffer = Buffer.allocUnsafe(size)
      } else {
        messages.push(serverMessage.parse(JSON.parse(this.decoder.decode(this.buffer))))
        this.buffer = this.header
      }
      this.offset = 0
    }
    return messages
  }
}
