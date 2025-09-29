import { net, session } from 'electron'
import { ConfigDBManager } from '~/core/database'

const proxySessionCache: { [key: string]: Electron.Session } = {}

function getProxySessionKey(protocol: string, host: string, port: number): string {
  return `${protocol}_${host}_${port}`
}

async function getOrCreateProxySession(
  protocol: string,
  host: string,
  port: number
): Promise<Electron.Session> {
  const key = getProxySessionKey(protocol, host, port)
  if (proxySessionCache[key]) {
    return proxySessionCache[key]
  }
  const partition = `persist:scraper-proxy-${key}`
  const proxySession = session.fromPartition(partition)
  const proxyRules = `${protocol}://${host}:${port}`
  await proxySession.setProxy({ proxyRules })
  proxySessionCache[key] = proxySession
  return proxySession
}

export async function fetchProxy(
  scraper: string,
  input: string | GlobalRequest,
  init?: RequestInit & { bypassCustomProtocolHandlers?: boolean }
): Promise<GlobalResponse> {
  const proxyEnable = await ConfigDBManager.getConfigValue('game.scraper.proxy.enable')
  if (!proxyEnable) {
    return net.fetch(input, init)
  }
  const enableScrapers = await ConfigDBManager.getConfigValue('game.scraper.proxy.enableScrapers')
  if (
    enableScrapers == null ||
    !Array.isArray(enableScrapers) ||
    !enableScrapers.includes(scraper)
  ) {
    return net.fetch(input, init)
  }
  const protocol = await ConfigDBManager.getConfigValue('game.scraper.proxy.protocol')
  const host = await ConfigDBManager.getConfigValue('game.scraper.proxy.host')
  const port = await ConfigDBManager.getConfigValue('game.scraper.proxy.port')
  if (!protocol || !host || !port || isNaN(port) || port < 1 || port > 65535) {
    return net.fetch(input, init)
  }
  const proxySession = await getOrCreateProxySession(protocol, host, port)
  return proxySession.fetch(input, init)
}
