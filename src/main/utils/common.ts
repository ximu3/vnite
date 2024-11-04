export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function formatDate(dateString: string): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return ''
    }

    // 格式化为 YYYY-MM-DD
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}
