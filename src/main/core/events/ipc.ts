import { eventBus } from './EventBus'
import { ipcManager } from '../ipc'
import log from 'electron-log'
import type { EventType } from '@appTypes/event'

/**
 * 设置 EventBus 的 IPC 处理器
 * 允许渲染进程通过 IPC 调用主进程的 EventBus 方法
 */
export function setupEventBusIPC(): void {
  log.info('[EventBusIPC] Setting up EventBus IPC handlers')

  // 发射事件
  ipcManager.handle('eventbus:emit', async (_e, eventType, data, options) => {
    try {
      const result = eventBus.emit(eventType, data, options)
      log.debug(`[EventBusIPC] Event emitted via IPC: ${eventType}`)
      return result
    } catch (error) {
      log.error(`[EventBusIPC] Error emitting event ${eventType}:`, error)
      throw error
    }
  })

  // 查询历史事件
  ipcManager.handle('eventbus:query-history', async (_e, options) => {
    try {
      const result = eventBus.queryHistory(options)
      log.debug(`[EventBusIPC] History queried via IPC, found ${result.length} events`)
      return result
    } catch (error) {
      log.error('[EventBusIPC] Error querying history:', error)
      throw error
    }
  })

  // 获取总事件数
  ipcManager.handle('eventbus:get-total-events', async () => {
    try {
      const result = eventBus.getTotalEvents()
      log.debug(`[EventBusIPC] Total events: ${result}`)
      return result
    } catch (error) {
      log.error('[EventBusIPC] Error getting total events:', error)
      throw error
    }
  })

  // 获取按类型分组的事件数
  ipcManager.handle('eventbus:get-events-by-type', async () => {
    try {
      const result = eventBus.getEventsByType()
      log.debug('[EventBusIPC] Events by type retrieved via IPC')
      return result
    } catch (error) {
      log.error('[EventBusIPC] Error getting events by type:', error)
      throw error
    }
  })

  // 获取最近的事件
  ipcManager.handle('eventbus:get-recent-events', async (_e, limit) => {
    try {
      const result = eventBus.getRecentEvents(limit)
      log.debug(`[EventBusIPC] Recent events retrieved via IPC: ${result.length} events`)
      return result
    } catch (error) {
      log.error('[EventBusIPC] Error getting recent events:', error)
      throw error
    }
  })

  // 清空历史
  ipcManager.handle('eventbus:clear-history', async () => {
    try {
      eventBus.clearHistory()
      log.info('[EventBusIPC] History cleared via IPC')
    } catch (error) {
      log.error('[EventBusIPC] Error clearing history:', error)
      throw error
    }
  })

  // 获取历史统计信息
  ipcManager.handle('eventbus:get-history-stats', async () => {
    try {
      const result = eventBus.getHistoryStats()
      log.debug('[EventBusIPC] History stats retrieved via IPC')
      return result
    } catch (error) {
      log.error('[EventBusIPC] Error getting history stats:', error)
      throw error
    }
  })

  // 设置事件转发 - 将主进程的事件转发给渲染进程
  setupEventForwarding()

  log.info('[EventBusIPC] EventBus IPC handlers setup completed')
}

/**
 * 设置事件转发
 * 将主进程的 EventBus 事件转发给渲染进程
 */
function setupEventForwarding(): void {
  // 监听所有事件类型并转发给渲染进程
  const eventTypes: EventType[] = [
    'app:ready',
    'game:added',
    'game:launched',
    'game:stopped',
    'game:deleted',
    'scanner:started',
    'scanner:completed'
    // 添加更多需要转发的事件类型...
  ]

  eventTypes.forEach((eventType) => {
    eventBus.on(eventType, (data) => {
      try {
        // 转发给渲染进程
        ipcManager.send('eventbus:event-emitted', eventType, data)
        log.debug(`[EventBusIPC] Event forwarded to renderer: ${eventType}`)
      } catch (error) {
        log.error(`[EventBusIPC] Error forwarding event ${eventType}:`, error)
      }
    })
  })

  log.info(`[EventBusIPC] Event forwarding setup for ${eventTypes.length} event types`)
}
