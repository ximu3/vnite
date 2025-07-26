import {
  IpcListener,
  IpcEmitter,
  ExtractArgs,
  ExtractHandler
} from '@electron-toolkit/typed-ipc/main'
import { ipcMain } from 'electron'
import { BrowserWindow } from 'electron'

export class IPCManager {
  private listener: IpcListener<IpcMainEvents>
  private emitter: IpcEmitter<IpcRendererEvents>

  constructor() {
    this.listener = new IpcListener<IpcMainEvents>()
    this.emitter = new IpcEmitter<IpcRendererEvents>()
  }

  on<E extends keyof ExtractArgs<IpcMainEvents>>(
    channel: Extract<E, string>,
    listener: (
      e: Electron.IpcMainEvent,
      ...args: ExtractArgs<IpcMainEvents>[E]
    ) => void | Promise<void>
  ): void {
    this.listener.on(channel, listener)
  }

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

  dispose(): void {
    this.listener.dispose()
  }

  send<E extends keyof IpcRendererEvents>(
    channel: Extract<E, string>,
    ...args: IpcRendererEvents[E]
  ): void {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (!mainWindow) {
      console.warn('No main window found to send IPC message')
      return
    }
    this.emitter.send(mainWindow.webContents, channel, ...args)
  }

  removeHandler<E extends keyof IpcMainEvents>(channel: Extract<E, string>): void {
    ipcMain.removeHandler(channel)
  }
}

export const ipcManager = new IPCManager()
