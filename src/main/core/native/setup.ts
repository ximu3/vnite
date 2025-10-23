import * as native from 'vnite-native'
import log from 'electron-log/main.js'
import {
  setupNativeMonitor,
  stopNativeMonitor,
  enableForegroundHook,
  disableForegroundHook
} from '~/features/monitor'
import { ConfigDBManager } from '~/core/database'

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
  try {
    // setupNativeMonitor
    const mode = await ConfigDBManager.getConfigValue('general.processMonitor')
    if (mode === 'new') {
      await setupNativeMonitor()
      // install foreground hook
      const isEnableForegroundHook = await ConfigDBManager.getConfigValue(
        'general.enableForegroundTimer'
      )
      if (isEnableForegroundHook) {
        await enableForegroundHook()
      }
    } else if (mode === 'legacy') {
      const isEnableForegroundHook = await ConfigDBManager.getConfigValue(
        'general.enableForegroundTimer'
      )
      if (isEnableForegroundHook) {
        await ConfigDBManager.setConfigValue('general.enableForegroundTimer', false)
      }
    }
  } catch (err) {
    log.error('failed to setup native process monitor', err)
  }
}

// Send a termination signal to the native module to shut it down gracefully
export async function nativeCleanup(): Promise<void> {
  await disableForegroundHook()
  await stopNativeMonitor()
  native.stopLogger()
}
