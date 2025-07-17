import { eventBus } from './RendererEventBus'

/**
 * 初始化渲染进程的 EventBus
 * 应在应用启动时调用
 */
export async function initializeRendererEventBus(): Promise<void> {
  try {
    await eventBus.initialize()
    console.log('[EventBus] Renderer EventBus initialized successfully')
  } catch (error) {
    console.error('[EventBus] Failed to initialize Renderer EventBus:', error)
    throw error
  }
}

/**
 * 清理渲染进程的 EventBus
 * 应在应用关闭时调用
 */
export function cleanupRendererEventBus(): void {
  try {
    eventBus.clearAllListeners()
    console.log('[EventBus] Renderer EventBus cleaned up successfully')
  } catch (error) {
    console.error('[EventBus] Failed to cleanup Renderer EventBus:', error)
  }
}
