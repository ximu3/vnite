export { startMonitor } from './services'
export {
  setupNativeMonitor,
  stopNativeMonitor,
  startPhantomMonitor,
  enableForegroundHook,
  disableForegroundHook,
  changeForegroundWaitTime
} from './services/nativeMonitor'
export { setupNativeMonitorIPC } from './ipc'
