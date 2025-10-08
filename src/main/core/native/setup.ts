import * as native from 'vnite-native'
import log from 'electron-log/main.js'
import { setupNativeMonitor, stopNativeMonitor } from '~/features/monitor'

export async function setupNativeModule(): Promise<void> {
  // setup electron logger for native module
  await native.initLogger(
    (err, msg) => {
      if (err) {
        log.error('failed to log message in native module: ', err)
      }
      log.info(msg)
    },
    (err, msg) => {
      if (err) {
        log.error('failed to log message in native module: ', err)
      }
      log.error(msg)
    }
  )
  // setupNativeMonitor
  await setupNativeMonitor()
}

// Send a termination signal to the native module to shut it down gracefully
export async function nativeCleanup(): Promise<void> {
  await stopNativeMonitor()
  native.stopLogger()
}
