import {
  IpcListener,
  IpcEmitter,
  ExtractArgs,
  ExtractHandler
} from '@electron-toolkit/typed-ipc/main'
import { BrowserWindow } from 'electron'

/**
 * IPC - 包装 @electron-toolkit/typed-ipc 提供更便捷的API
 */
export class IPCManager {
  private listener: IpcListener<IpcMainEvents>
  private emitter: IpcEmitter<IpcRendererEvents>

  constructor() {
    this.listener = new IpcListener<IpcMainEvents>()
    this.emitter = new IpcEmitter<IpcRendererEvents>()
  }

  /**
   * Listen to `channel`.
   */
  on<E extends keyof ExtractArgs<IpcMainEvents>>(
    channel: Extract<E, string>,
    listener: (
      e: Electron.IpcMainEvent,
      ...args: ExtractArgs<IpcMainEvents>[E]
    ) => void | Promise<void>
  ): void {
    this.listener.on(channel, listener)
  }

  /**
   * Handle a renderer invoke request.
   */
  handle<E extends keyof ExtractHandler<IpcMainEvents>>(
    channel: Extract<E, string>,
    listener: (
      e: Electron.IpcMainInvokeEvent,
      ...args: Parameters<ExtractHandler<IpcMainEvents>[E]>
    ) =>
      | ReturnType<ExtractHandler<IpcMainEvents>[E]>
      | Promise<ReturnType<ExtractHandler<IpcMainEvents>[E]>>
  ): void {
    this.listener.handle(channel, listener)
  }

  /**
   * Dispose all listeners and handlers.
   */
  dispose(): void {
    this.listener.dispose()
  }

  send<E extends keyof IpcRendererEvents>(
    channel: Extract<E, string>,
    ...args: IpcRendererEvents[E]
  ): void {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    this.emitter.send(mainWindow.webContents, channel, ...args)
  }
}

// 创建单例实例
export const ipcManager = new IPCManager()
