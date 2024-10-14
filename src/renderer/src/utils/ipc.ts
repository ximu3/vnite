import { debounce } from 'lodash'

export const ipcSend = (channel: string, ...args: any[]): void => {
  window.electron.ipcRenderer.send(channel, ...args)
}

export const debouncedIpcSend = debounce(ipcSend, 100)

export const ipcInvoke = async (channel: string, ...args: any[]): Promise<any> => {
  return await window.electron.ipcRenderer.invoke(channel, ...args)
}

export const debouncedIpcInvoke = debounce(ipcInvoke, 100)

export const ipcOn = (channel: string, listener: (...args: any[]) => void): void => {
  window.electron.ipcRenderer.on(channel, listener)
}
