import { parse, format } from 'date-fns'

export function extractReleaseDateWithLibrary(dateText: string, language: string): string {
  try {
    let parsedDate: string | Date | null = null

    if (language === 'en') {
      // 首先尝试匹配 "Release dateMMM/DD/YYYY" 格式
      const dateMatch = dateText.match(/([A-Za-z]{3})\/(\d{1,2})\/(\d{4})/i)

      if (dateMatch) {
        const [_, monthStr, dayStr, yearStr] = dateMatch
        // 构建适合解析的日期字符串，如 "Oct 03 2020"
        const formattedDateStr = `${monthStr} ${dayStr} ${yearStr}`
        parsedDate = parse(formattedDateStr, 'MMM dd yyyy', new Date())
      }
    } else if (language === 'ja' || language === 'zh-CN') {
      // 匹配日文/中文格式
      const dateMatch = dateText.match(/(\d{4})年(\d{2})月(\d{2})日/)
      if (dateMatch) {
        const [_, year, month, day] = dateMatch
        parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
    }

    // 如果成功解析，返回ISO格式日期
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return format(parsedDate, 'yyyy-MM-dd')
    }

    return ''
  } catch (error) {
    console.error('日期解析错误:', error)
    return ''
  }
}

export const dlsiteI18n = {
  // 各种可能需要用于选择器的文本标签
  workType: {
    ja: '作品形式',
    'zh-CN': '作品类型',
    en: 'Product format'
  },
  releaseDate: {
    ja: '販売日',
    'zh-CN': '贩卖日',
    en: 'Release date'
  },
  series: {
    ja: 'シリーズ名',
    'zh-CN': '系列名',
    en: 'Series name'
  },
  maker: {
    ja: 'ブランド名',
    'zh-CN': '商标名',
    en: 'Brand'
  }
  // 添加更多需要的标签...
}

// 返回指定语言的术语
export function getTerm(category: keyof typeof dlsiteI18n, language: string): string {
  if (!dlsiteI18n[category]) {
    throw new Error(`Unknown term category: ${category}`)
  }

  // 默认为日语
  return (
    dlsiteI18n[category][language as keyof (typeof dlsiteI18n)[typeof category]] ||
    dlsiteI18n[category].ja
  )
}
