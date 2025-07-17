import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { ipcManager } from '~/app/ipc'

export async function i18nInit(): Promise<void> {
  const language = await ipcManager.invoke('system:get-language')
  console.warn('[i18n] Language:', language)

  const namespaces = [
    'config',
    'sidebar',
    'game',
    'adder',
    'importer',
    'updater',
    'utils',
    'record',
    'scanner',
    'transformer'
  ]

  const supportedLngs = ['zh-CN', 'zh-TW', 'ja', 'en', 'ru', 'fr', 'ko']

  await i18n
    .use(initReactI18next)
    .use(
      resourcesToBackend(async (language: string, namespace: string) => {
        return import(`@locales/${language}/${namespace}.json`).catch((error) => {
          console.error(`Unable to load translation file: ${language}/${namespace}`, error)
          return {}
        })
      })
    )
    .init({
      lng: language,
      fallbackLng: 'en',
      defaultNS: 'sidebar',
      fallbackNS: 'sidebar',
      ns: namespaces,
      interpolation: {
        escapeValue: false
      },
      partialBundledLanguages: true,
      supportedLngs
    })

  i18n.services.formatter?.add('gameTime', (value, lng, _options) => {
    // Calculation of total hours (with fractional part)
    const totalHours = value / (1000 * 60 * 60)
    const minutes = (value % (1000 * 60 * 60)) / (1000 * 60)

    if (totalHours >= 1) {
      // When more than 1 hour, the display is in decimal form with 1 decimal place retained
      const formattedHours = totalHours.toFixed(1)

      // Returns different formats depending on the language
      if (lng === 'zh-CN') {
        return `${formattedHours} 小时`
      } else if (lng === 'zh-TW') {
        return `${formattedHours} 小時`
      } else if (lng === 'ja') {
        return `${formattedHours} 時間`
      } else if (lng === 'ru') {
        return `${formattedHours} ч`
      } else {
        return `${formattedHours} h`
      }
    } else {
      const formattedMinutes = minutes < 0.5 && minutes > 1e-10 ? '< 1' : `${Math.round(minutes)}`
      // Minutes are still displayed when less than 1 hour has elapsed
      // If it is less than 30s, display '< 1'
      if (lng === 'zh-CN') {
        return `${formattedMinutes} 分钟`
      } else if (lng === 'zh-TW') {
        return `${formattedMinutes} 分鐘`
      } else if (lng === 'ja') {
        return `${formattedMinutes} 分`
      } else if (lng === 'ru') {
        return `${formattedMinutes} мин`
      } else {
        return `${formattedMinutes} m`
      }
    }
  })

  i18n.services.formatter?.add('niceDate', (value, lng, _options) => {
    // Make sure value is a Date object
    const date = value instanceof Date ? value : new Date(value)

    // Access to year, month and day
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() return 0-11
    const day = date.getDate()

    // Returns formatted dates according to language
    if (lng === 'zh-CN') {
      return `${year}年${month}月${day}日`
    } else if (lng === 'zh-TW') {
      return `${year}年${month}月${day}日`
    } else if (lng === 'ja') {
      return `${year}年${month}月${day}日`
    } else if (lng === 'ru') {
      // In Russia usually: dd.mm.yyyy [teosiq]
      return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`
    } else {
      return new Intl.DateTimeFormat(lng, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    }
  })

  i18n.services.formatter?.add('niceISO', (value, _lng, _options) => {
    // Make sure value is a Date object
    const date = value instanceof Date ? value : new Date(value)

    // Access to year, month and day
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() return 0-11
    const day = date.getDate()

    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  })

  i18n.services.formatter?.add('niceDateSeconds', (value, lng, _options) => {
    // Make sure value is a Date object
    const date = value instanceof Date ? value : new Date(value)

    // Get year, month, day, hour, minute, second
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() return 0-11
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')

    // Returns formatted date and time according to language
    if (lng === 'zh-CN') {
      return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
    } else if (lng === 'zh-TW') {
      return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
    } else if (lng === 'ja') {
      return `${year}年${month}月${day}日 ${hours}時${minutes}分${seconds}秒`
    } else if (lng === 'ru') {
      // In Russia: dd.mm.yyyy hh:mm:ss [teosiq]
      return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year} ${hours}:${minutes}:${seconds}`
    } else {
      return new Intl.DateTimeFormat(lng, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: lng?.startsWith('en') // English uses a 12-hour day, most others use a 24-hour day.
      }).format(date)
    }
  })
}
