import { parse, format } from 'date-fns'

export function extractReleaseDateWithLibrary(dateText: string, language: string): string {
  try {
    let parsedDate: string | Date | null = null

    if (language === 'en') {
      // First try to match the "Release date MMM/DD/YYYYY" format
      const dateMatch = dateText.match(/([A-Za-z]{3})\/(\d{1,2})\/(\d{4})/i)

      if (dateMatch) {
        const [_, monthStr, dayStr, yearStr] = dateMatch
        // Construct a date string suitable for parsing, e.g. "Oct 03 2020"
        const formattedDateStr = `${monthStr} ${dayStr} ${yearStr}`
        parsedDate = parse(formattedDateStr, 'MMM dd yyyy', new Date())
      }
    } else if (language === 'ja' || language === 'zh-CN') {
      // Match Japanese/Chinese format
      const dateMatch = dateText.match(/(\d{4})年(\d{2})月(\d{2})日/)
      if (dateMatch) {
        const [_, year, month, day] = dateMatch
        parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
    }

    // If parsed successfully, the ISO format date is returned
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return format(parsedDate, 'yyyy-MM-dd')
    }

    return ''
  } catch (error) {
    console.error('Date parsing error:', error)
    return ''
  }
}

export const dlsiteI18n = {
  // Various text labels that may be needed for selectors
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
}

// Returns a term in the specified language
export function getTerm(category: keyof typeof dlsiteI18n, language: string): string {
  if (!dlsiteI18n[category]) {
    throw new Error(`Unknown term category: ${category}`)
  }

  // Default is Japanese
  return (
    dlsiteI18n[category][language as keyof (typeof dlsiteI18n)[typeof category]] ||
    dlsiteI18n[category].ja
  )
}
