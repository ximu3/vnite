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

/**
 * 浏览器兼容的简单 EventEmitter 实现
 */
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

    // 检查是否超过最大监听器数量
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
      // 创建副本以避免在执行过程中修改数组
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

/**
 * 渲染进程的 EventBus
 * 通过 IPC 与主进程的 EventBus 进行通信
 */
export class RendererEventBus {
  private emitter = new SimpleEventEmitter()
  private isInitialized = false
  private pendingSubscriptions: Array<{
    eventType: EventType
    handler: EventHandler<any>
    resolve: (unsubscribe: EventUnsubscribe) => void
  }> = []

  constructor() {
    this.emitter.setMaxListeners(100)
    this.setupMainProcessEventForwarding()
    console.log('[RendererEventBus] Initialized')
  }

  /**
   * 初始化 EventBus（等待主进程准备就绪）
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 这里可以添加一些初始化检查
      this.isInitialized = true

      // 处理所有待处理的订阅
      this.pendingSubscriptions.forEach(({ eventType, handler, resolve }) => {
        const unsubscribe = this.setupLocalHandler(eventType, handler)
        resolve(unsubscribe)
      })
      this.pendingSubscriptions = []

      console.log('[RendererEventBus] Initialization completed')
    } catch (error) {
      console.error('[RendererEventBus] Initialization failed:', error)
      throw error
    }
  }

  // ========== 核心事件方法 ==========

  /**
   * 发射事件到主进程
   */
  async emit<T extends EventType>(
    eventType: T,
    data: EventData<T>,
    options: {
      source: string
      correlationId?: string
    }
  ): Promise<boolean> {
    try {
      const result = await ipcManager.invoke('eventbus:emit', eventType, data, {
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

  /**
   * 监听事件（本地监听 + 主进程事件转发）
   */
  on<T extends EventType>(eventType: T, handler: EventHandler<T>): EventUnsubscribe {
    if (!this.isInitialized) {
      // 如果还未初始化，将订阅请求加入队列
      return new Promise<EventUnsubscribe>((resolve) => {
        this.pendingSubscriptions.push({
          eventType,
          handler,
          resolve
        })
      }) as any // 这里类型转换是为了兼容同步接口
    }

    return this.setupLocalHandler(eventType, handler)
  }

  /**
   * 设置本地事件处理器
   */
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

    // 注册本地监听器
    this.emitter.on(eventType, wrappedHandler)

    console.debug(`[RendererEventBus] Registered handler for: ${eventType}`)

    // 返回取消订阅函数
    return () => {
      this.emitter.off(eventType, wrappedHandler)
      console.debug(`[RendererEventBus] Unregistered handler for: ${eventType}`)
    }
  }

  /**
   * 一次性监听事件
   */
  once<T extends EventType>(eventType: T, handler: EventHandler<T>): EventUnsubscribe {
    const wrappedHandler = async (data: EnhancedEventData<T>): Promise<void> => {
      try {
        await handler(data)
        console.debug(`[RendererEventBus] Once handler executed for: ${eventType}`)
      } catch (error) {
        console.error(`[RendererEventBus] Once handler error for ${eventType}:`, error)
      }
    }

    // 注册一次性监听器
    this.emitter.once(eventType, wrappedHandler)

    console.debug(`[RendererEventBus] Registered once handler for: ${eventType}`)

    return () => {
      this.emitter.off(eventType, wrappedHandler)
      console.debug(`[RendererEventBus] Unregistered once handler for: ${eventType}`)
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
          return // 继续等待
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

  // ========== 事件历史查询方法（通过 IPC 调用主进程） ==========

  /**
   * 查询事件历史
   */
  async queryHistory(options?: EventHistoryQuery): Promise<EventHistoryEntry[]> {
    try {
      const result = await ipcManager.invoke('eventbus:query-history', options)
      console.debug(`[RendererEventBus] History queried, found ${result.length} events`)
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error querying history:', error)
      throw error
    }
  }

  /**
   * 获取总事件数
   */
  async getTotalEvents(): Promise<number> {
    try {
      const result = await ipcManager.invoke('eventbus:get-total-events')
      console.debug(`[RendererEventBus] Total events: ${result}`)
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error getting total events:', error)
      throw error
    }
  }

  /**
   * 获取按类型分组的事件数
   */
  async getEventsByType(): Promise<Record<string, number>> {
    try {
      const result = await ipcManager.invoke('eventbus:get-events-by-type')
      console.debug('[RendererEventBus] Events by type retrieved')
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error getting events by type:', error)
      throw error
    }
  }

  /**
   * 获取最近的事件
   */
  async getRecentEvents(limit: number = 10): Promise<EventHistoryEntry[]> {
    try {
      const result = await ipcManager.invoke('eventbus:get-recent-events', limit)
      console.debug(`[RendererEventBus] Recent events retrieved: ${result.length} events`)
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error getting recent events:', error)
      throw error
    }
  }

  /**
   * 清空历史
   */
  async clearHistory(): Promise<void> {
    try {
      await ipcManager.invoke('eventbus:clear-history')
      console.info('[RendererEventBus] History cleared')
    } catch (error) {
      console.error('[RendererEventBus] Error clearing history:', error)
      throw error
    }
  }

  /**
   * 获取历史统计信息
   */
  async getHistoryStats(): Promise<{
    totalEvents: number
    uniqueEventTypes: number
    oldestEvent?: EventHistoryEntry
    newestEvent?: EventHistoryEntry
    averageEventsPerMinute: number
  }> {
    try {
      const result = await ipcManager.invoke('eventbus:get-history-stats')
      console.debug('[RendererEventBus] History stats retrieved')
      return result
    } catch (error) {
      console.error('[RendererEventBus] Error getting history stats:', error)
      throw error
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 清空所有本地监听器
   */
  clearAllListeners(): void {
    console.info('[RendererEventBus] Clearing all local event listeners')
    this.emitter.removeAllListeners()
  }

  /**
   * 获取本地监听器数量
   */
  listenerCount(eventType: string | symbol): number {
    return this.emitter.listenerCount(eventType)
  }

  /**
   * 获取所有本地事件名称
   */
  eventNames(): Array<string | symbol> {
    return this.emitter.eventNames()
  }

  // ========== 私有方法 ==========

  /**
   * 设置主进程事件转发
   */
  private setupMainProcessEventForwarding(): void {
    // 监听来自主进程的事件转发
    ipcManager.on('eventbus:event-emitted', (_e, eventType, data) => {
      try {
        // 在本地 EventEmitter 中触发事件
        this.emitter.emit(eventType, data)
        console.debug(`[RendererEventBus] Event received from main process: ${eventType}`)
      } catch (error) {
        console.error(`[RendererEventBus] Error processing forwarded event ${eventType}:`, error)
      }
    })

    console.info('[RendererEventBus] Main process event forwarding setup completed')
  }
}

// 创建并导出单例
export const eventBus = new RendererEventBus()
