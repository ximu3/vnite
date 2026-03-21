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
 * Format duration to a compact string (e.g. 45m, 2.5h, 12h).
 * Automatically chooses minutes or hours for the most compact display.
 *
 * @param milliseconds The duration in milliseconds.
 * @returns The formatted duration string.
 */
export function formatDurationCompact(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return '0m'
  }

  const minutes = milliseconds / (1000 * 60)

  if (minutes < 99) {
    return `${Math.round(minutes)}m`
  } else {
    const hours = minutes / 60

    if (hours < 100) return `${hours.toFixed(1)}h`
    else return `${Math.round(hours)}h`
  }
}

/**
 * Format bytes to human readable size string
 * @param bytes Size in bytes
 * @param emptyText Text to return when bytes is negative (default: empty string)
 * @param precision Decimal places (default: 1)
 * @returns Formatted size string (e.g. "1.5 GiB")
 */
export function formatStorageSize(bytes: number, emptyText = '', precision = 1): string {
  if (bytes < 0) return emptyText
  if (bytes === 0) return '0 B'

  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  let i = 0
  let size = bytes

  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }

  return `${size.toFixed(precision)} ${units[i]}`
}
