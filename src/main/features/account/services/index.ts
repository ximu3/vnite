import { AuthManager } from './auth'
import log from 'electron-log/main'

export { AuthManager }

export function handleAuthCallback(url: string): void {
  if (!url.startsWith('vnite://auth/callback')) return

  try {
    // Parsing the URL and getting the authorization code
    const urlObj = new URL(url)
    const code = urlObj.searchParams.get('code')

    if (code) {
      // Pass the authorization code to AuthManager for processing
      AuthManager.handleAuthCode(code)
    } else {
      log.error('Authorization code not found in authorization callback')
    }
  } catch (error) {
    log.error('Failure to process authorization callback URL:', error)
  }
}
