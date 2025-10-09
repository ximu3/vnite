import { session } from 'electron'
import { ConfigDBManager } from '~/core/database'

export async function setupProxy(): Promise<void> {
  try {
    const proxyEnable = await ConfigDBManager.getConfigLocalValue('network.proxy.enable')
    const protocol = await ConfigDBManager.getConfigLocalValue('network.proxy.protocol')
    const host = await ConfigDBManager.getConfigLocalValue('network.proxy.host')
    const port = await ConfigDBManager.getConfigLocalValue('network.proxy.port')
    if (!proxyEnable || !protocol || !host || !port || isNaN(port) || port < 1 || port > 65535) {
      await session.defaultSession.setProxy({ mode: 'system' })
      await session.defaultSession.closeAllConnections()
      return
    }
    const bypassRules = await ConfigDBManager.getConfigLocalValue('network.proxy.bypassRules')
    const proxyRules = `${protocol}://${host}:${port}`
    const proxyConfig: Electron.ProxyConfig = {
      proxyRules
    }
    if (bypassRules && bypassRules.trim().length > 0) {
      proxyConfig.proxyBypassRules = bypassRules
    }
    await session.defaultSession.setProxy(proxyConfig)
    await session.defaultSession.closeAllConnections()
  } catch (error) {
    console.error('Error setting up proxy:', error)
  }
}
