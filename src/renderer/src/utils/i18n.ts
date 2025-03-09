import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { ipcInvoke } from './ipc'

// 导入各个模块的翻译文件
// 中文
import zhCNConfig from '@locales/zh-CN/config.json'
import zhCNSidebar from '@locales/zh-CN/sidebar.json'
import zhCNGame from '@locales/zh-CN/game.json'
import zhCNUI from '@locales/zh-CN/ui.json'
import zhCNAdder from '@locales/zh-CN/adder.json'
import zhCNImporter from '@locales/zh-CN/importer.json'
import zhCNUpdater from '@locales/zh-CN/updater.json'
import zhCNUtils from '@locales/zh-CN/utils.json'

// 英文
import enConfig from '@locales/en/config.json'
import enSidebar from '@locales/en/sidebar.json'
import enGame from '@locales/en/game.json'
import enUI from '@locales/en/ui.json'
import enAdder from '@locales/en/adder.json'
import enImporter from '@locales/en/importer.json'
import enUpdater from '@locales/en/updater.json'
import enUtils from '@locales/en/utils.json'

// 日语
import jaConfig from '@locales/ja/config.json'
import jaSidebar from '@locales/ja/sidebar.json'
import jaGame from '@locales/ja/game.json'
import jaUI from '@locales/ja/ui.json'
import jaAdder from '@locales/ja/adder.json'
import jaImporter from '@locales/ja/importer.json'
import jaUpdater from '@locales/ja/updater.json'
import jaUtils from '@locales/ja/utils.json'

// 配置资源对象，按命名空间分组
const resources = {
  'zh-CN': {
    config: zhCNConfig,
    sidebar: zhCNSidebar,
    game: zhCNGame,
    ui: zhCNUI,
    adder: zhCNAdder,
    importer: zhCNImporter,
    updater: zhCNUpdater,
    utils: zhCNUtils
  },
  ja: {
    config: jaConfig,
    sidebar: jaSidebar,
    game: jaGame,
    ui: jaUI,
    adder: jaAdder,
    importer: jaImporter,
    updater: jaUpdater,
    utils: jaUtils
  },
  en: {
    config: enConfig,
    sidebar: enSidebar,
    game: enGame,
    ui: enUI,
    adder: enAdder,
    importer: enImporter,
    updater: enUpdater,
    utils: enUtils
  }
}

export async function i18nInit(): Promise<void> {
  const language = (await ipcInvoke('get-language')) as string
  console.warn('[i18n] Language:', language)

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    defaultNS: 'ui', // 默认命名空间
    fallbackNS: 'ui', // 如果在当前命名空间中找不到键，则回退到这个命名空间
    ns: ['config', 'sidebar', 'ui', 'game', 'adder', 'importer', 'updater', 'utils'], // 声明所有命名空间
    interpolation: {
      escapeValue: false
    }
  })

  i18n.services.formatter?.add('gameTime', (value, lng, _options) => {
    // 计算总小时数（带小数部分）
    const totalHours = value / (1000 * 60 * 60)
    const minutes = Math.floor((value % (1000 * 60 * 60)) / (1000 * 60))

    if (totalHours >= 1) {
      // 当超过1小时时，显示为小数形式，保留1位小数
      const formattedHours = totalHours.toFixed(1)

      // 根据不同语言返回不同格式
      if (lng === 'zh-CN') {
        return `${formattedHours} 小时`
      } else if (lng === 'ja') {
        return `${formattedHours} 時間`
      } else {
        return `${formattedHours} h`
      }
    } else {
      // 不到1小时时，仍然显示分钟
      if (lng === 'zh-CN') {
        return `${minutes} 分钟`
      } else if (lng === 'ja') {
        return `${minutes} 分`
      } else {
        return `${minutes} m`
      }
    }
  })

  i18n.services.formatter?.add('niceDate', (value, lng, _options) => {
    // 确保value是Date对象
    const date = value instanceof Date ? value : new Date(value)

    // 获取年、月、日
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() 返回 0-11
    const day = date.getDate()

    // 根据语言返回格式化的日期
    if (lng === 'zh-CN') {
      // 中文格式: 2004年12月29日
      return `${year}年${month}月${day}日`
    } else if (lng === 'ja') {
      // 日文格式: 2004年12月29日 (与中文相似)
      return `${year}年${month}月${day}日`
    } else {
      // 其他语言使用标准格式 (例如: December 29, 2004)
      return new Intl.DateTimeFormat(lng, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    }
  })

  i18n.services.formatter?.add('niceDateSeconds', (value, lng, _options) => {
    // 确保value是Date对象
    const date = value instanceof Date ? value : new Date(value)

    // 获取年、月、日、时、分、秒
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() 返回 0-11
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')

    // 根据语言返回格式化的日期时间
    if (lng === 'zh-CN') {
      // 中文格式: 2004年12月29日 15:30:45
      return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
    } else if (lng === 'ja') {
      // 日文格式: 2004年12月29日 15時30分45秒
      return `${year}年${month}月${day}日 ${hours}時${minutes}分${seconds}秒`
    } else {
      // 其他语言使用标准格式，精确到秒
      return new Intl.DateTimeFormat(lng, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: lng?.startsWith('en') // 英语使用12小时制，其他大多使用24小时制
      }).format(date)
    }
  })
}
