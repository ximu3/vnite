import {
  IpcListener,
  IpcEmitter,
  ExtractArgs,
  ExtractHandler
} from '@electron-toolkit/typed-ipc/renderer'

/**
 * IPC - 包装 @electron-toolkit/typed-ipc 提供更便捷的API
 */
export class IPCManager {
  private listener: IpcListener<IpcRendererEvents>
  private emitter: IpcEmitter<IpcMainEvents>
  private registeredListeners: Record<
    string,
    Map<(e: Electron.IpcRendererEvent, ...args: any[]) => void, () => void>
  > = {}

  constructor() {
    this.listener = new IpcListener<IpcRendererEvents>()
    this.emitter = new IpcEmitter<IpcMainEvents>()
  }

  /**
   * Listen to `channel`.
   */
  on<E extends keyof IpcRendererEvents>(
    channel: Extract<E, string>,
    listener: (e: Electron.IpcRendererEvent, ...args: IpcRendererEvents[E]) => void
  ): () => void {
    return this.listener.on(channel, listener)
  }

  onUnique<E extends keyof IpcRendererEvents>(
    channel: Extract<E, string>,
    listener: (e: Electron.IpcRendererEvent, ...args: IpcRendererEvents[E]) => void
  ): () => void {
    if (!this.registeredListeners[channel]) {
      this.registeredListeners[channel] = new Map()
    }

    if (this.registeredListeners[channel].has(listener)) {
      console.warn(`Listener already registered for channel "${channel}", skipping.`)
      return this.registeredListeners[channel].get(listener)!
    }

    const originalRemoveListener = this.listener.on(channel, listener)

    const removeListener = (): void => {
      originalRemoveListener()
      this.registeredListeners[channel].delete(listener)
      if (this.registeredListeners[channel].size === 0) {
        delete this.registeredListeners[channel]
      }
    }

    this.registeredListeners[channel].set(listener, removeListener)
    return removeListener
  }

  once<E extends keyof IpcRendererEvents>(
    channel: Extract<E, string>,
    listener: (e: Electron.IpcRendererEvent, ...args: IpcRendererEvents[E]) => void | Promise<void>
  ): () => void {
    return this.listener.once(channel, listener)
  }

  send<E extends keyof ExtractArgs<IpcMainEvents>>(
    channel: Extract<E, string>,
    ...args: ExtractArgs<IpcMainEvents>[E]
  ): void {
    this.emitter.send(channel, ...args)
  }

  invoke<E extends keyof ExtractHandler<IpcMainEvents>>(
    channel: Extract<E, string>,
    ...args: Parameters<ExtractHandler<IpcMainEvents>[E]>
  ): Promise<ReturnType<ExtractHandler<IpcMainEvents>[E]>> {
    return this.emitter.invoke(channel, ...args)
  }
}

// 创建单例实例
export const ipcManager = new IPCManager()
