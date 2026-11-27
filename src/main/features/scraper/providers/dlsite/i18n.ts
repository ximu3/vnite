import { format, isValid, parse } from 'date-fns'

export function extractReleaseDateWithLibrary(dateText: string, dateHref?: string): string {
  // Prefer the calendar link, then match the Japanese, Chinese, or numeric English display date.
  const numericDate =
    dateHref?.match(/\/year\/(\d{4})\/mon\/(\d{1,2})\/day\/(\d{1,2})\b/) ??
    dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/) ??
    dateText.match(/\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/)

  if (!numericDate) return ''
  const [, year, month, day] = numericDate
  const parsedDate = parse(`${year}-${month}-${day}`, 'yyyy-M-d', new Date())

  // If parsed successfully, the ISO format date is returned
  return isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : ''
}
