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

export function formatDateToChinese(dateString: string): string {
  const date = new Date(dateString)

  // 获取年、月、日
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 月份从0开始，所以需要加1
  const day = date.getDate()

  // 格式化为中文日期格式
  return `${year}年${month}月${day}日`
}

export function formatDateToISO(dateString: string): string {
  const date = new Date(dateString)

  // 获取年、月、日
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // 补零到两位
  const day = String(date.getDate()).padStart(2, '0') // 补零到两位

  // 格式化为 YYYY-MM-DD 格式
  return `${year}-${month}-${day}`
}

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

export function formatScoreToChinese(score: number): string {
  if (score === -1) return '未评分'

  // 如果是10分，直接返回整数
  if (score === 10) return '10 分'

  // 其他分数保留1位小数
  return `${score.toFixed(1)} 分`
}

export function formatDateToChineseWithSeconds(dateString: string): string {
  const date = new Date(dateString)

  // 获取年、月、日
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 月份从0开始，所以需要加1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  // 格式化为中文日期格式
  return `${year}年${month}月${day}日 ${hours}时${minutes}分${seconds}秒`
}
