import { debounce } from 'lodash'

export interface IpcRenderer {
  send: (channel: string, ...args: any[]) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
  on: (channel: string, listener: (...args: any[]) => void) => () => void
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer
    }
  }
}

// Creating an anti-aliasing function that supports asynchrony
function createAsyncDebounce<F extends (...args: any[]) => Promise<any>>(func: F, wait: number) {
  const debounced = debounce(
    (resolve: (value: any) => void, reject: (error: any) => void, args: Parameters<F>) => {
      func(...args)
        .then(resolve)
        .catch(reject)
    },
    wait
  )

  return (...args: Parameters<F>): ReturnType<F> =>
    new Promise((resolve, reject) => {
      debounced(resolve, reject, args)
    }) as ReturnType<F>
}

/**
 * IPC Communications Management Category
 */
class IpcManager {
  private registeredListeners: Record<string, Map<(...args: any[]) => void, () => void>> = {}

  // Change the method definition to an arrow function to keep this binding
  public send = (channel: string, ...args: any[]): void => {
    window.electron.ipcRenderer.send(channel, ...args)
  }

  public debouncedSend = debounce(this.send, 100)

  public invoke = async <T>(channel: string, ...args: any[]): Promise<T> => {
    try {
      return (await window.electron.ipcRenderer.invoke(channel, ...args)) as T
    } catch (error) {
      console.error(`IPC invoke error on channel "${channel}":`, error)
      throw error
    }
  }

  public debouncedInvoke = createAsyncDebounce(this.invoke, 100)

  public on = (channel: string, listener: (...args: any[]) => void): void => {
    window.electron.ipcRenderer.on(channel, listener)
  }

  public onUnique = (channel: string, listener: (...args: any[]) => void): (() => void) => {
    if (!this.registeredListeners[channel]) {
      this.registeredListeners[channel] = new Map()
    }

    if (this.registeredListeners[channel].has(listener)) {
      console.warn(`Listener already registered for channel "${channel}", skipping.`)
      return this.registeredListeners[channel].get(listener)!
    }

    const originalRemoveListener = window.electron.ipcRenderer.on(channel, listener)

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

  public offUnique = (channel: string, listener: (...args: any[]) => void): void => {
    const removeListener = this.registeredListeners[channel]?.get(listener)
    if (removeListener) {
      removeListener()
    }
  }

  public removeAllListeners = (channel: string): void => {
    window.electron.ipcRenderer.removeAllListeners(channel)
    delete this.registeredListeners[channel]
  }
}

// Creating a Single Case
export const ipc = new IpcManager()

// Exporting bindings to instances
export const ipcSend = ipc.send.bind(ipc)
export const debouncedIpcSend = ipc.debouncedSend.bind(ipc)
export const ipcInvoke = ipc.invoke.bind(ipc)
export const debouncedIpcInvoke = ipc.debouncedInvoke.bind(ipc)
export const ipcOn = ipc.on.bind(ipc)
export const ipcOnUnique = ipc.onUnique.bind(ipc)
export const ipcOffUnique = ipc.offUnique.bind(ipc)
export const ipcRemoveAllListener = ipc.removeAllListeners.bind(ipc)
