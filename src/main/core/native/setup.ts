import * as native from 'vnite-native'
import log from 'electron-log/main.js'

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
}

// Stop native logging after the monitor has released the foreground hook.
export async function nativeCleanup(): Promise<void> {
  native.stopLogger()
}
