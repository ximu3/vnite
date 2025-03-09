import { getLanguage } from '~/utils'

// config/language.ts
export interface SteamLanguageConfig {
  // Steam API使用的语言代码
  apiLanguageCode: string
  // Steam URL查询参数使用的语言代码
  urlLanguageCode: string
  // Accept-Language头值
  acceptLanguageHeader: string
  // Steam区域代码
  countryCode: string
  // UI显示的翻译
  translations: {
    officialWebsite: string
    steamStore: string
  }
}

// 支持的语言配置
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
  // 可以继续添加其他语言...
}

// 当前语言配置

// 获取当前语言配置
export async function getSteamLanguageConfig(): Promise<SteamLanguageConfig> {
  const language = await getLanguage()
  return supportedLanguages[language] || supportedLanguages['en-US']
}

export async function getTranslation(
  key: keyof SteamLanguageConfig['translations']
): Promise<string> {
  return (await getSteamLanguageConfig()).translations[key]
}
