import { eventBus } from './RendererEventBus'

export async function initializeRendererEventBus(): Promise<void> {
  try {
    await eventBus.initialize()
    console.log('[EventBus] Renderer EventBus initialized successfully')
  } catch (error) {
    console.error('[EventBus] Failed to initialize Renderer EventBus:', error)
    throw error
  }
}

export function cleanupRendererEventBus(): void {
  try {
    eventBus.clearAllListeners()
    console.log('[EventBus] Renderer EventBus cleaned up successfully')
  } catch (error) {
    console.error('[EventBus] Failed to cleanup Renderer EventBus:', error)
  }
}
