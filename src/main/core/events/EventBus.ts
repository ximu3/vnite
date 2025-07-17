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

    log.info('[EventBus] Initialized')
  }

  // ========== 核心事件方法 ==========

  /**
   * 发射类型安全的事件
   */
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

    // 记录到历史
    this.addToHistory(eventType, enhancedData)

    log.debug(`[EventBus] Emitting: ${eventType}`, enhancedData)

    // 使用内部 emitter 发射事件
    return this.emitter.emit(eventType, enhancedData)
  }

  /**
   * 监听类型安全的事件
   */
  on<T extends EventType>(eventType: T, handler: EventHandler<T>): EventUnsubscribe {
    const wrappedHandler = async (data: EnhancedEventData<T>): Promise<void> => {
      try {
        await handler(data)
        log.debug(`[EventBus] Handler executed successfully for: ${eventType}`)
      } catch (error) {
        log.error(`[EventBus] Handler error for ${eventType}:`, error)
      }
    }

    // 注册监听器
    this.emitter.on(eventType, wrappedHandler)

    log.debug(`[EventBus] Registered handler for: ${eventType}`)

    // 返回取消订阅函数
    return () => {
      this.emitter.off(eventType, wrappedHandler)
      log.debug(`[EventBus] Unregistered handler for: ${eventType}`)
    }
  }

  /**
   * 一次性监听事件
   */
  once<T extends EventType>(eventType: T, handler: EventHandler<T>): EventUnsubscribe {
    const wrappedHandler = async (data: EnhancedEventData<T>): Promise<void> => {
      try {
        await handler(data)
        log.debug(`[EventBus] Once handler executed for: ${eventType}`)
      } catch (error) {
        log.error(`[EventBus] Once handler error for ${eventType}:`, error)
      }
    }

    // 注册一次性监听器
    this.emitter.once(eventType, wrappedHandler)

    log.debug(`[EventBus] Registered once handler for: ${eventType}`)

    return () => {
      this.emitter.off(eventType, wrappedHandler)
      log.debug(`[EventBus] Unregistered once handler for: ${eventType}`)
    }
  }

  /**
   * 等待特定事件
   */
  waitFor<T extends EventType>(
    eventType: T,
    timeout?: number,
    condition?: (data: EnhancedEventData<T>) => boolean
  ): Promise<EnhancedEventData<T>> {
    log.debug(
      `[EventBus] Waiting for event: ${eventType}${timeout ? ` (timeout: ${timeout}ms)` : ''}`
    )

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null

      if (timeout) {
        timer = setTimeout(() => {
          cleanup()
          const error = new Error(`Timeout waiting for event: ${eventType}`)
          log.warn(`[EventBus] ${error.message}`)
          reject(error)
        }, timeout)
      }

      const handler = (data: EnhancedEventData<T>): void => {
        if (condition && !condition(data)) {
          log.debug(`[EventBus] Condition not met for: ${eventType}, continuing to wait`)
          return // 继续等待
        }

        cleanup()
        log.debug(`[EventBus] Event received: ${eventType}`)
        resolve(data)
      }

      const cleanup = (): void => {
        this.emitter.off(eventType, handler)
        if (timer) clearTimeout(timer)
      }

      this.emitter.once(eventType, handler)
    })
  }

  /**
   * 批量发射事件
   */
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
    log.debug(`[EventBus] Emitting batch of ${events.length} events`)

    events.forEach(({ eventType, data, options }) => {
      this.emit(eventType, data, options || { source: 'batch' })
    })
  }

  // ========== 事件历史相关方法 ==========

  /**
   * 添加事件到历史
   */
  private addToHistory(eventType: EventType, data: EnhancedEventData<EventType>): void {
    const entry: EventHistoryEntry = {
      eventType,
      data: JSON.parse(JSON.stringify(data)), // 深拷贝
      timestamp: data.timestamp || Date.now(),
      id: data.id || crypto.randomUUID()
    }

    this.events.push(entry)
    this.eventCounts[eventType] = (this.eventCounts[eventType] || 0) + 1

    // 保持大小限制
    if (this.events.length > this.maxSize) {
      const removed = this.events.splice(0, this.events.length - this.maxSize)

      // 更新计数
      for (const removedEvent of removed) {
        this.eventCounts[removedEvent.eventType]--
        if (this.eventCounts[removedEvent.eventType] <= 0) {
          delete this.eventCounts[removedEvent.eventType]
        }
      }
    }
  }

  /**
   * 查询事件历史
   */
  queryHistory(options: EventHistoryQuery = {}): EventHistoryEntry[] {
    let filtered = this.events

    // 按事件类型过滤
    if (options.eventType) {
      filtered = filtered.filter((event) => event.eventType === options.eventType)
    }

    // 按时间范围过滤
    if (options.fromTimestamp) {
      filtered = filtered.filter((event) => event.timestamp >= options.fromTimestamp!)
    }

    if (options.toTimestamp) {
      filtered = filtered.filter((event) => event.timestamp <= options.toTimestamp!)
    }

    // 按来源过滤
    if (options.source) {
      filtered = filtered.filter((event) => event.data.source === options.source)
    }

    // 按关联ID过滤
    if (options.correlationId) {
      filtered = filtered.filter((event) => event.data.correlationId === options.correlationId)
    }

    // 排序（最新的在前）
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    // 分页
    const offset = options.offset || 0
    const limit = options.limit || filtered.length

    return filtered.slice(offset, offset + limit)
  }

  /**
   * 获取总事件数
   */
  getTotalEvents(): number {
    return this.events.length
  }

  /**
   * 获取按类型分组的事件数
   */
  getEventsByType(): Record<string, number> {
    return { ...this.eventCounts }
  }

  /**
   * 获取最近的事件
   */
  getRecentEvents(limit: number = 10): EventHistoryEntry[] {
    return this.events.slice(-limit).reverse()
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.events = []
    this.eventCounts = {}
  }

  /**
   * 导出历史（用于调试或备份）
   */
  exportHistory(): EventHistoryEntry[] {
    return [...this.events]
  }

  /**
   * 获取统计信息
   */
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

  // ========== 辅助方法 ==========

  /**
   * 清空所有监听器
   */
  clearAllListeners(): void {
    log.info('[EventBus] Clearing all event listeners')
    this.emitter.removeAllListeners()
  }

  /**
   * 获取监听器数量
   */
  listenerCount(eventType: string | symbol): number {
    return this.emitter.listenerCount(eventType)
  }

  /**
   * 获取所有事件名称
   */
  eventNames(): Array<string | symbol> {
    return this.emitter.eventNames()
  }

  // ========== 私有方法 ==========

  private setupErrorHandling(): void {
    this.emitter.on('error', (error) => {
      log.error('[EventBus] Internal error:', error)
    })

    // 处理未捕获的异常
    process.on('unhandledRejection', (reason, _promise) => {
      log.error('[EventBus] Unhandled rejection in event handler:', reason)
    })
  }
}

// 创建并导出单例
export const eventBus = new EventBus()
