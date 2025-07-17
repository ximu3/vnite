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
