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
