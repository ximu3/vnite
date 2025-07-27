import { ipcManager } from '../ipc'
import type {
  EventType,
  EventData,
  EnhancedEventData,
  EventHandler,
  EventUnsubscribe,
  EventHistoryEntry,
  EventHistoryQuery
} from '@appTypes/event'

class SimpleEventEmitter {
  private listeners: Map<string | symbol, Array<(...args: any[]) => void>> = new Map()
  private maxListeners = 10

  setMaxListeners(max: number): void {
    this.maxListeners = max
  }

  on(event: string | symbol, listener: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    const eventListeners = this.listeners.get(event)!

    // Check if the listener already exists
    if (eventListeners.length >= this.maxListeners) {
      console.warn(
        `[SimpleEventEmitter] Max listeners (${this.maxListeners}) exceeded for event: ${String(event)}`
      )
    }

    eventListeners.push(listener)
  }

  once(event: string | symbol, listener: (...args: any[]) => void): void {
    const onceWrapper = (...args: any[]): void => {
      this.off(event, onceWrapper)
      listener(...args)
    }
    this.on(event, onceWrapper)
  }

  off(event: string | symbol, listener: (...args: any[]) => void): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(listener)
      if (index !== -1) {
        eventListeners.splice(index, 1)
      }
      if (eventListeners.length === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    const eventListeners = this.listeners.get(event)
    if (eventListeners && eventListeners.length > 0) {
      // Create a copy to avoid modifying the array during execution
      const listenersToCall = [...eventListeners]
      listenersToCall.forEach((listener) => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`[SimpleEventEmitter] Error in listener for event ${String(event)}:`, error)
        }
      })
      return true
    }
    return false
  }

  removeAllListeners(event?: string | symbol): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  listenerCount(event: string | symbol): number {
    const eventListeners = this.listeners.get(event)
    return eventListeners ? eventListeners.length : 0
  }

  eventNames(): Array<string | symbol> {
    return Array.from(this.listeners.keys())
  }
}

export class RendererEventBus {
  private emitter = new SimpleEventEmitter()
  private isInitialized = false

  constructor() {
    this.emitter.setMaxListeners(100)
    this.setupMainProcessEventForwarding()
    console.log('[RendererEventBus] Initialized')
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.isInitialized = true

      console.log('[RendererEventBus] Initialization completed')
    } catch (error) {
      console.error('[RendererEventBus] Initialization failed:', error)
      throw error
    }
  }

  async emit<T extends EventType>(
    eventType: T,
    data: EventData<T>,
    options: {
      source: string
      correlationId?: string
    }
  ): Promise<boolean> {
    try {
      const result = await ipcManager.invoke('events:emit', eventType, data, {
        source: `renderer:${options.source}`,
        correlationId: options.correlationId
      })
      console.debug(`[RendererEventBus] Event emitted to main process: ${eventType}`)
      return result
    } catch (error) {
      console.error(`[RendererEventBus] Error emitting event ${eventType}:`, error)
      throw error
    }
  }

  on<T extends EventType>(eventType: T, handler: EventHandler<T>): EventUnsubscribe {
    return this.setupLocalHandler(eventType, handler)
  }

  private setupLocalHandler<T extends EventType>(
    eventType: T,
    handler: EventHandler<T>
  ): EventUnsubscribe {
    const wrappedHandler = async (data: EnhancedEventData<T>): Promise<void> => {
      try {
        await handler(data)
        console.debug(`[RendererEventBus] Handler executed successfully for: ${eventType}`)
      } catch (error) {
        console.error(`[RendererEventBus] Handler error for ${eventType}:`, error)
      }
    }

    this.emitter.on(eventType, wrappedHandler)

    console.debug(`[RendererEventBus] Registered handler for: ${eventType}`)
    // Return unsubscribe function
    return () => {
      this.emitter.off(eventType, wrappedHandler)
      console.debug(`[RendererEventBus] Unregistered handler for: ${eventType}`)
    }
  }

  once<T extends EventType>(eventType: T, handler: EventHandler<T>): EventUnsubscribe {
    const wrappedHandler = async (data: EnhancedEventData<T>): Promise<void> => {
      try {
        await handler(data)
        console.debug(`[RendererEventBus] Once handler executed for: ${eventType}`)
      } catch (error) {
        console.error(`[RendererEventBus] Once handler error for ${eventType}:`, error)
      }
    }

    this.emitter.once(eventType, wrappedHandler)

    console.debug(`[RendererEventBus] Registered once handler for: ${eventType}`)
    return () => {
      this.emitter.off(eventType, wrappedHandler)
      console.debug(`[RendererEventBus] Unregistered once handler for: ${eventType}`)
    }
  }

  waitFor<T extends EventType>(
    eventType: T,
    timeout?: number,
    condition?: (data: EnhancedEventData<T>) => boolean
  ): Promise<EnhancedEventData<T>> {
    console.debug(
      `[RendererEventBus] Waiting for event: ${eventType}${timeout ? ` (timeout: ${timeout}ms)` : ''}`
    )

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null

      if (timeout) {
        timer = setTimeout(() => {
          cleanup()
          const error = new Error(`Timeout waiting for event: ${eventType}`)
          console.warn(`[RendererEventBus] ${error.message}`)
          reject(error)
        }, timeout)
      }

      const handler = (data: EnhancedEventData<T>): void => {
        if (condition && !condition(data)) {
          console.debug(
            `[RendererEventBus] Condition not met for: ${eventType}, continuing to wait`
          )
          return // Continue waiting
        }

        cleanup()
        console.debug(`[RendererEventBus] Event received: ${eventType}`)
        resolve(data)
      }

      const cleanup = (): void => {
        this.emitter.off(eventType, handler)
        if (timer) clearTimeout(timer)
      }

      this.emitter.once(eventType, handler)
    })
  }

  async queryHistory(options?: EventHistoryQuery): Promise<EventHistoryEntry[]> {
    try {
      const result = await ipcManager.invoke('events:query-history', options)
      console.debug(`[RendererEventBus] History queried, found ${result.length} events`)
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error querying history:', error)
      throw error
    }
  }

  async getTotalEvents(): Promise<number> {
    try {
      const result = await ipcManager.invoke('events:get-total-events')
      console.debug(`[RendererEventBus] Total events: ${result}`)
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error getting total events:', error)
      throw error
    }
  }

  async getEventsByType(): Promise<Record<string, number>> {
    try {
      const result = await ipcManager.invoke('events:get-events-by-type')
      console.debug('[RendererEventBus] Events by type retrieved')
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error getting events by type:', error)
      throw error
    }
  }

  async getRecentEvents(limit: number = 10): Promise<EventHistoryEntry[]> {
    try {
      const result = await ipcManager.invoke('events:get-recent-events', limit)
      console.debug(`[RendererEventBus] Recent events retrieved: ${result.length} events`)
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error getting recent events:', error)
      throw error
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await ipcManager.invoke('events:clear-history')
      console.info('[RendererEventBus] History cleared')
    } catch (error) {
      console.error('[RendererEventBus] Error clearing history:', error)
      throw error
    }
  }

  async getHistoryStats(): Promise<{
    totalEvents: number
    uniqueEventTypes: number
    oldestEvent?: EventHistoryEntry
    newestEvent?: EventHistoryEntry
    averageEventsPerMinute: number
  }> {
    try {
      const result = await ipcManager.invoke('events:get-history-stats')
      console.debug('[RendererEventBus] History stats retrieved')
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error getting history stats:', error)
      throw error
    }
  }

  clearAllListeners(): void {
    console.info('[RendererEventBus] Clearing all local event listeners')
    this.emitter.removeAllListeners()
  }

  listenerCount(eventType: string | symbol): number {
    return this.emitter.listenerCount(eventType)
  }

  eventNames(): Array<string | symbol> {
    return this.emitter.eventNames()
  }

  private setupMainProcessEventForwarding(): void {
    // Listen for events from the main process
    ipcManager.on('events:event-emitted', (_e, eventType, data) => {
      try {
        // Trigger the event in the local EventEmitter
        this.emitter.emit(eventType, data)
        console.debug(`[RendererEventBus] Event received from main process: ${eventType}`)
      } catch (error) {
        console.error(`[RendererEventBus] Error processing forwarded event ${eventType}:`, error)
      }
    })

    console.info('[RendererEventBus] Main process event forwarding setup completed')
  }
}

export const eventBus = new RendererEventBus()
