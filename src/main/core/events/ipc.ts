import { eventBus } from './EventBus'
import { ipcManager } from '../ipc'
import log from 'electron-log'
import type { EventType } from '@appTypes/event'

export function setupEventBusIPC(): void {
  log.info('[Events] Setting up EventBus IPC handlers')

  ipcManager.handle('events:emit', async (_e, eventType, data, options) => {
    try {
      const result = eventBus.emit(eventType, data, options)
      log.debug(`[Events] Event emitted via IPC: ${eventType}`)
      return result
    } catch (error) {
      log.error(`[Events] Error emitting event ${eventType}:`, error)
      throw error
    }
  })

  ipcManager.handle('events:query-history', async (_e, options) => {
    try {
      const result = eventBus.queryHistory(options)
      log.debug(`[Events] History queried via IPC, found ${result.length} events`)
      return result
    } catch (error) {
      log.error('[Events] Error querying history:', error)
      throw error
    }
  })

  ipcManager.handle('events:get-total-events', async () => {
    try {
      const result = eventBus.getTotalEvents()
      log.debug(`[Events] Total events: ${result}`)
      return result
    } catch (error) {
      log.error('[Events] Error getting total events:', error)
      throw error
    }
  })

  ipcManager.handle('events:get-events-by-type', async () => {
    try {
      const result = eventBus.getEventsByType()
      log.debug('[Events] Events by type retrieved via IPC')
      return result
    } catch (error) {
      log.error('[Events] Error getting events by type:', error)
      throw error
    }
  })

  ipcManager.handle('events:get-recent-events', async (_e, limit) => {
    try {
      const result = eventBus.getRecentEvents(limit)
      log.debug(`[Events] Recent events retrieved via IPC: ${result.length} events`)
      return result
    } catch (error) {
      log.error('[Events] Error getting recent events:', error)
      throw error
    }
  })

  ipcManager.handle('events:clear-history', async () => {
    try {
      eventBus.clearHistory()
      log.info('[Events] History cleared via IPC')
    } catch (error) {
      log.error('[Events] Error clearing history:', error)
      throw error
    }
  })

  ipcManager.handle('events:get-history-stats', async () => {
    try {
      const result = eventBus.getHistoryStats()
      log.debug('[Events] History stats retrieved via IPC')
      return result
    } catch (error) {
      log.error('[Events] Error getting history stats:', error)
      throw error
    }
  })

  // Set up event forwarding to renderer
  setupEventForwarding()

  log.info('[Events] EventBus IPC handlers setup completed')
}

function setupEventForwarding(): void {
  // Listen for all event types and forward them to the renderer process
  const eventTypes: EventType[] = [
    'app:ready',
    'game:added',
    'game:launched',
    'game:stopped',
    'game:deleted',
    'scanner:started',
    'scanner:completed'
  ]

  eventTypes.forEach((eventType) => {
    eventBus.on(eventType, (data) => {
      try {
        // Forward to renderer process
        ipcManager.send('events:event-emitted', eventType, data)
        log.debug(`[Events] Event forwarded to renderer: ${eventType}`)
      } catch (error) {
        log.error(`[Events] Error forwarding event ${eventType}:`, error)
      }
    })
  })

  log.info(`[Events] Event forwarding setup for ${eventTypes.length} event types`)
}
