/**
 * Format time to HH:MM:SS in Chinese
 * @param time The time in milliseconds.
 * @returns The formatted time.
 */
export function formatTimeToChinese(time: number): string {
  const hours = Math.floor(time / 3600000)
  const minutes = Math.floor((time % 3600000) / 60000)
  const seconds = Math.floor((time % 60000) / 1000)

  if (hours >= 1) {
    const fractionalHours = (time / 3600000).toFixed(1)
    return `${fractionalHours} 小时`
  } else if (minutes >= 1) {
    return `${minutes} 分钟`
  } else {
    return `${seconds} 秒`
  }
}

/**
 * Format date to YYYY年MM月DD日
 * @param dateString The date string.
 * @returns The formatted date.
 */
export function formatDateToChinese(dateString: string): string {
  const date = new Date(dateString)

  // Access to year, month and day
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // Formatting to Chinese date format
  return `${year}年${month}月${day}日`
}

/**
 * Format date to YYYY-MM-DD
 * @param dateString The date string.
 * @returns The formatted date.
 */
export function formatDateToISO(dateString: string): string {
  const date = new Date(dateString)

  // Access to year, month and day
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Format play status to Chinese
 * @param status The play status.
 * @returns The formatted play status.
 */
export function formatPlayStatusToChinese(status: string): string {
  switch (status) {
    case 'unplayed':
      return '未开始'
    case 'playing':
      return '游玩中'
    case 'finished':
      return '已完成'
    case 'multiple':
      return '多周目'
    case 'shelved':
      return '搁置中'
    default:
      return '未知'
  }
}

/**
 * Format score to Chinese
 * @param score The score.
 * @returns The formatted score.
 */
export function formatScoreToChinese(score: number): string {
  if (score === -1) return '未评分'

  // If it is 10 points, return the integer directly
  if (score === 10) return '10 分'

  if (score === 0) return '0 分'

  // Other fractions retain 1 decimal place
  return `${score.toFixed(1)} 分`
}

/**
 * Format date to YYYY年MM月DD日 HH时MM分
 * @param dateString The date string.
 * @returns The formatted date.
 */
export function formatDateToChineseWithSeconds(dateString: string): string {
  const date = new Date(dateString)

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  return `${year}年${month}月${day}日 ${hours}时${minutes}分${seconds}秒`
}
