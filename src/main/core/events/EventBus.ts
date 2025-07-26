import { EventEmitter } from 'events'
import log from 'electron-log'
import {
  EventType,
  EventData,
  EnhancedEventData,
  EventMetadata,
  EventHandler,
  EventUnsubscribe,
  EventHistoryEntry,
  EventHistoryQuery
} from '@appTypes/event'

export class EventBus {
  private emitter = new EventEmitter()
  private events: EventHistoryEntry[] = []
  private readonly maxSize: number
  private eventCounts: Record<string, number> = {}

  constructor(maxSize: number = 10000) {
    this.emitter.setMaxListeners(100)
    this.setupErrorHandling()
    this.maxSize = maxSize

    log.info('[Events] Initialized')
  }

  emit<T extends EventType>(
    eventType: T,
    data: EventData<T>,
    options: {
      source: string
      correlationId?: string
    }
  ): boolean {
    const metadata: EventMetadata = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      source: options.source,
      correlationId: options.correlationId
    }

    const enhancedData: EnhancedEventData<T> = {
      ...data,
      ...metadata
    }

    this.addToHistory(eventType, enhancedData)

    log.debug(`[Events] Emitting: ${eventType}`, enhancedData)

    return this.emitter.emit(eventType, enhancedData)
  }

  on<T extends EventType>(eventType: T, handler: EventHandler<T>): EventUnsubscribe {
    const wrappedHandler = async (data: EnhancedEventData<T>): Promise<void> => {
      try {
        await handler(data)
        log.debug(`[Events] Handler executed successfully for: ${eventType}`)
      } catch (error) {
        log.error(`[Events] Handler error for ${eventType}:`, error)
      }
    }

    this.emitter.on(eventType, wrappedHandler)

    log.debug(`[Events] Registered handler for: ${eventType}`)

    // Return unsubscribe function
    return () => {
      this.emitter.off(eventType, wrappedHandler)
      log.debug(`[Events] Unregistered handler for: ${eventType}`)
    }
  }

  once<T extends EventType>(eventType: T, handler: EventHandler<T>): EventUnsubscribe {
    const wrappedHandler = async (data: EnhancedEventData<T>): Promise<void> => {
      try {
        await handler(data)
        log.debug(`[Events] Once handler executed for: ${eventType}`)
      } catch (error) {
        log.error(`[Events] Once handler error for ${eventType}:`, error)
      }
    }

    this.emitter.once(eventType, wrappedHandler)

    log.debug(`[Events] Registered once handler for: ${eventType}`)

    // Return unsubscribe function
    return () => {
      this.emitter.off(eventType, wrappedHandler)
      log.debug(`[Events] Unregistered once handler for: ${eventType}`)
    }
  }

  waitFor<T extends EventType>(
    eventType: T,
    timeout?: number,
    condition?: (data: EnhancedEventData<T>) => boolean
  ): Promise<EnhancedEventData<T>> {
    log.debug(
      `[Events] Waiting for event: ${eventType}${timeout ? ` (timeout: ${timeout}ms)` : ''}`
    )

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null

      if (timeout) {
        timer = setTimeout(() => {
          cleanup()
          const error = new Error(`Timeout waiting for event: ${eventType}`)
          log.warn(`[Events] ${error.message}`)
          reject(error)
        }, timeout)
      }

      const handler = (data: EnhancedEventData<T>): void => {
        if (condition && !condition(data)) {
          log.debug(`[Events] Condition not met for: ${eventType}, continuing to wait`)
          return // Continue waiting
        }

        cleanup()
        log.debug(`[Events] Event received: ${eventType}`)
        resolve(data)
      }

      const cleanup = (): void => {
        this.emitter.off(eventType, handler)
        if (timer) clearTimeout(timer)
      }

      this.emitter.once(eventType, handler)
    })
  }

  emitBatch<T extends EventType>(
    events: Array<{
      eventType: T
      data: EventData<T>
      options?: {
        source: string
        correlationId?: string
      }
    }>
  ): void {
    log.debug(`[Events] Emitting batch of ${events.length} events`)

    events.forEach(({ eventType, data, options }) => {
      this.emit(eventType, data, options || { source: 'batch' })
    })
  }

  private addToHistory(eventType: EventType, data: EnhancedEventData<EventType>): void {
    const entry: EventHistoryEntry = {
      eventType,
      data: JSON.parse(JSON.stringify(data)), // Deep copy
      timestamp: data.timestamp || Date.now(),
      id: data.id || crypto.randomUUID()
    }

    this.events.push(entry)
    this.eventCounts[eventType] = (this.eventCounts[eventType] || 0) + 1

    // Maintain size limit
    if (this.events.length > this.maxSize) {
      const removed = this.events.splice(0, this.events.length - this.maxSize)

      // Update counts
      for (const removedEvent of removed) {
        this.eventCounts[removedEvent.eventType]--
        if (this.eventCounts[removedEvent.eventType] <= 0) {
          delete this.eventCounts[removedEvent.eventType]
        }
      }
    }
  }

  queryHistory(options: EventHistoryQuery = {}): EventHistoryEntry[] {
    let filtered = this.events

    // Filter by event type
    if (options.eventType) {
      filtered = filtered.filter((event) => event.eventType === options.eventType)
    }

    // Filter by time range
    if (options.fromTimestamp) {
      filtered = filtered.filter((event) => event.timestamp >= options.fromTimestamp!)
    }
    if (options.toTimestamp) {
      filtered = filtered.filter((event) => event.timestamp <= options.toTimestamp!)
    }

    // Filter by source
    if (options.source) {
      filtered = filtered.filter((event) => event.data.source === options.source)
    }

    // Filter by correlation ID
    if (options.correlationId) {
      filtered = filtered.filter((event) => event.data.correlationId === options.correlationId)
    }

    // Sort (latest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    // Pagination
    const offset = options.offset || 0
    const limit = options.limit || filtered.length

    return filtered.slice(offset, offset + limit)
  }

  getTotalEvents(): number {
    return this.events.length
  }

  getEventsByType(): Record<string, number> {
    return { ...this.eventCounts }
  }

  getRecentEvents(limit: number = 10): EventHistoryEntry[] {
    return this.events.slice(-limit).reverse()
  }

  clearHistory(): void {
    this.events = []
    this.eventCounts = {}
  }

  exportHistory(): EventHistoryEntry[] {
    return [...this.events]
  }

  getHistoryStats(): {
    totalEvents: number
    uniqueEventTypes: number
    oldestEvent?: EventHistoryEntry
    newestEvent?: EventHistoryEntry
    averageEventsPerMinute: number
  } {
    if (this.events.length === 0) {
      return {
        totalEvents: 0,
        uniqueEventTypes: 0,
        averageEventsPerMinute: 0
      }
    }

    const oldest = this.events[0]
    const newest = this.events[this.events.length - 1]
    const timeSpanMinutes = (newest.timestamp - oldest.timestamp) / (1000 * 60)

    return {
      totalEvents: this.events.length,
      uniqueEventTypes: Object.keys(this.eventCounts).length,
      oldestEvent: oldest,
      newestEvent: newest,
      averageEventsPerMinute: timeSpanMinutes > 0 ? this.events.length / timeSpanMinutes : 0
    }
  }

  clearAllListeners(): void {
    log.info('[Events] Clearing all event listeners')
    this.emitter.removeAllListeners()
  }

  listenerCount(eventType: string | symbol): number {
    return this.emitter.listenerCount(eventType)
  }

  eventNames(): Array<string | symbol> {
    return this.emitter.eventNames()
  }

  private setupErrorHandling(): void {
    this.emitter.on('error', (error) => {
      log.error('[Events] Internal error:', error)
    })

    // Handle uncaught exceptions
    process.on('unhandledRejection', (reason, _promise) => {
      log.error('[Events] Unhandled rejection in event handler:', reason)
    })
  }
}

export const eventBus = new EventBus()
