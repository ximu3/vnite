import { getLanguage } from '~/utils'

export interface SteamLanguageConfig {
  // Language code used by Steam API
  apiLanguageCode: string
  // Language code used for Steam URL query parameters
  urlLanguageCode: string
  // Accept-Language header value
  acceptLanguageHeader: string
  // Steam Region Code
  countryCode: string
  // Translation of UI display
  translations: {
    officialWebsite: string
    steamStore: string
  }
}

export const supportedLanguages: Record<string, SteamLanguageConfig> = {
  'zh-CN': {
    apiLanguageCode: 'schinese',
    urlLanguageCode: 'zh-cn',
    acceptLanguageHeader: 'zh-CN,zh;q=0.9,en;q=0.8',
    countryCode: 'CN',
    translations: {
      officialWebsite: '官方网站',
      steamStore: 'Steam商店'
    }
  },
  ja: {
    apiLanguageCode: 'japanese',
    urlLanguageCode: 'ja-jp',
    acceptLanguageHeader: 'ja-JP,ja;q=0.9,en;q=0.8',
    countryCode: 'JP',
    translations: {
      officialWebsite: '公式サイト',
      steamStore: 'Steamストア'
    }
  },
  en: {
    apiLanguageCode: 'english',
    urlLanguageCode: 'en-us',
    acceptLanguageHeader: 'en-US,en;q=0.9',
    countryCode: 'US',
    translations: {
      officialWebsite: 'Official Website',
      steamStore: 'Steam Store'
    }
  }
}

// Get current language configuration
export async function getSteamLanguageConfig(): Promise<SteamLanguageConfig> {
  const language = await getLanguage()
  return supportedLanguages[language] || supportedLanguages['en-US']
}

export async function getTranslation(
  key: keyof SteamLanguageConfig['translations']
): Promise<string> {
  return (await getSteamLanguageConfig()).translations[key]
}
