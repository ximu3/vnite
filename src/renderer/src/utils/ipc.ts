import { debounce } from 'lodash'

export const ipcSend = (channel: string, ...args: any[]): void => {
  window.electron.ipcRenderer.send(channel, ...args)
}

export const debouncedIpcSend = debounce(ipcSend, 100)

export const ipcInvoke = async <T>(channel: string, ...args: any[]): Promise<T> => {
  return (await window.electron.ipcRenderer.invoke(channel, ...args)) as T
}

export const debouncedIpcInvoke = debounce(ipcInvoke, 100)

export const ipcOn = (channel: string, listener: (...args: any[]) => void): void => {
  window.electron.ipcRenderer.on(channel, listener)
}

// 用于存储已注册的监听器
const registeredListeners: Record<string, Map<(...args: any[]) => void, () => void>> = {}

export const ipcOnUnique = (channel: string, listener: (...args: any[]) => void): (() => void) => {
  if (!registeredListeners[channel]) {
    registeredListeners[channel] = new Map()
  }

  if (!registeredListeners[channel].has(listener)) {
    const originalRemoveListener = window.electron.ipcRenderer.on(channel, listener)

    const removeListener = (): void => {
      originalRemoveListener()
      registeredListeners[channel].delete(listener)
      if (registeredListeners[channel].size === 0) {
        delete registeredListeners[channel]
      }
    }

    registeredListeners[channel].set(listener, removeListener)
    return removeListener
  } else {
    console.warn(`监听器已经为通道 "${channel}" 注册，跳过重复注册。`)
    return registeredListeners[channel].get(listener)!
  }
}

// 移除监听器的函数
export const ipcOffUnique = (channel: string, listener: (...args: any[]) => void): void => {
  if (registeredListeners[channel] && registeredListeners[channel].has(listener)) {
    const removeListener = registeredListeners[channel].get(listener)
    if (removeListener) {
      removeListener()
    }
  }
}

export const ipcRemoveAllListener = (channel: string): void => {
  window.electron.ipcRenderer.removeAllListeners(channel)
}
