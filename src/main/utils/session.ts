import { session } from 'electron'

export function setupSession(): void {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.hdslb.com/*', '*://*.bilibili.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://www.bilibili.com/'
      details.requestHeaders['Origin'] = 'https://www.bilibili.com'
      callback({ requestHeaders: details.requestHeaders })
    }
  )
}
