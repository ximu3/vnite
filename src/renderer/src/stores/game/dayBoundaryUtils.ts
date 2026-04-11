import { useConfigStore } from '~/stores/config'

const HOURS_IN_DAY = 24
export const MILLISECONDS_IN_ONE_HOUR = 60 * 60 * 1000
const MAX_BUSINESS_DAY_SPLIT_DAYS = 750
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export interface BusinessDaySegment {
  key: string
  startMs: number
  endMs: number
}

/**
 * Format a local `Date` into `YYYY-MM-DD`.
 *
 * @param date Local date instance.
 * @returns Date key string in `YYYY-MM-DD` format.
 * @remarks Caller should pass a valid `Date`.
 */
export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse a `YYYY-MM-DD` date key as a local date.
 *
 * Why this is needed:
 * - `new Date('YYYY-MM-DD')` is parsed as UTC in JavaScript engines.
 * - In non-UTC timezones, that may shift the calendar day when shown locally.
 *
 * This helper always constructs a `Date` using local year/month/day fields
 * to preserve the expected local calendar date semantics for statistics.
 *
 * @param str Date key string in `YYYY-MM-DD`.
 * @returns Local `Date` at `00:00:00.000`, or `Invalid Date` when input is invalid.
 * @remarks
 * - Strictly validates date format and calendar validity.
 * - Rejects overflow normalization cases like `2026-02-31`.
 */
export function parseLocalDate(str: string): Date {
  if (!DATE_KEY_REGEX.test(str)) {
    return new Date(NaN)
  }

  const [y, m, d] = str.split('-').map(Number)
  const date = new Date(0)
  date.setHours(0, 0, 0, 0)
  date.setFullYear(y, m - 1, d)

  // Reject overflow/underflow normalization (e.g. 2026-02-31 -> 2026-03-03).
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return new Date(NaN)
  }

  return date
}

/**
 * Normalize mixed date input into a `Date` instance.
 *
 * @param value Date input (`Date`, timestamp, or date string).
 * @returns Parsed `Date` instance. May be `Invalid Date`.
 * @remarks `YYYY-MM-DD` strings are parsed via `parseLocalDate` to avoid UTC-shift ambiguity.
 */
function toDateInput(value: Date | number | string): Date {
  if (typeof value === 'string' && DATE_KEY_REGEX.test(value)) {
    return parseLocalDate(value)
  }
  return new Date(value)
}

/**
 * Clamp day-boundary hour to an integer in `[0, 23]`.
 *
 * @param hour Raw boundary hour value.
 * @returns Normalized boundary hour integer.
 * @remarks Non-finite values fall back to `0`.
 */
export function clampDayBoundaryHour(hour: number): number {
  if (!Number.isFinite(hour)) return 0
  const normalized = Math.trunc(hour)

  if (normalized < 0) return 0
  if (normalized >= HOURS_IN_DAY) return HOURS_IN_DAY - 1

  return normalized
}

/**
 * Read configured business-day boundary hour from config store.
 *
 * @returns Normalized boundary hour integer in `[0, 23]`.
 * @remarks Missing or invalid config values are normalized to safe defaults.
 */
export function getConfiguredDayBoundaryHour(): number {
  const value = useConfigStore.getState().getConfigValue('record.dayBoundaryHour')
  return clampDayBoundaryHour(value)
}

/**
 * Convert a timestamp to business date key using local clock boundary comparison.
 *
 * Rule:
 * - If local hour is earlier than `dayBoundaryHour`, it belongs to previous business day.
 * - Otherwise it belongs to current local calendar day.
 *
 * @param value Date input (`Date`, timestamp, or date string).
 * @param dayBoundaryHour Business-day boundary hour. Defaults to configured value.
 * @returns Business date key in `YYYY-MM-DD`, or empty string for invalid input.
 * @remarks `YYYY-MM-DD` string input is treated as local date instead of UTC date parsing.
 */
export function getBusinessDateKey(
  value: Date | number | string,
  dayBoundaryHour = getConfiguredDayBoundaryHour()
): string {
  const date = toDateInput(value)
  if (isNaN(date.getTime())) return ''

  const boundaryHour = clampDayBoundaryHour(dayBoundaryHour)
  const businessDate = new Date(date)

  if (businessDate.getHours() < boundaryHour) {
    businessDate.setDate(businessDate.getDate() - 1)
  }

  return formatLocalDateKey(businessDate)
}

/**
 * Convert an exclusive end timestamp to business date key.
 * Useful when you need the last day that actually has overlap.
 *
 * @param value Exclusive range end input (`Date`, timestamp, or date string).
 * @param dayBoundaryHour Business-day boundary hour. Defaults to configured value.
 * @returns Business date key in `YYYY-MM-DD`, or empty string for invalid input.
 * @remarks Uses `end - 1ms` to preserve `[start, end)` interval semantics.
 */
export function getBusinessDateKeyFromRangeEnd(
  value: Date | number | string,
  dayBoundaryHour = getConfiguredDayBoundaryHour()
): string {
  const endTime = toDateInput(value).getTime()
  if (isNaN(endTime)) return ''

  return getBusinessDateKey(endTime - 1, dayBoundaryHour)
}

/**
 * Get business-day start time for a date key.
 *
 * @param dateKey Business date key in `YYYY-MM-DD`.
 * @param dayBoundaryHour Business-day boundary hour. Defaults to configured value.
 * @returns Local `Date` at the business-day boundary start, or `Invalid Date` for invalid key.
 */
export function getBusinessDayStartFromKey(
  dateKey: string,
  dayBoundaryHour = getConfiguredDayBoundaryHour()
): Date {
  const start = parseLocalDate(dateKey)
  if (isNaN(start.getTime())) return new Date(NaN)
  start.setHours(clampDayBoundaryHour(dayBoundaryHour), 0, 0, 0)
  return start
}

/**
 * Get next business-day start time for a date key.
 *
 * @param dateKey Business date key in `YYYY-MM-DD`.
 * @param dayBoundaryHour Business-day boundary hour. Defaults to configured value.
 * @returns Local `Date` at next business-day boundary start, or `Invalid Date` for invalid key.
 */
export function getNextBusinessDayStartFromKey(
  dateKey: string,
  dayBoundaryHour = getConfiguredDayBoundaryHour()
): Date {
  const next = getBusinessDayStartFromKey(dateKey, dayBoundaryHour)
  if (isNaN(next.getTime())) return new Date(NaN)
  next.setDate(next.getDate() + 1)
  next.setHours(clampDayBoundaryHour(dayBoundaryHour), 0, 0, 0)
  return next
}

/**
 * List date keys between [startKey, endKey], both inclusive.
 *
 * @param startKey Inclusive start date key in `YYYY-MM-DD`.
 * @param endKey Inclusive end date key in `YYYY-MM-DD`.
 * @returns Ordered date keys in `YYYY-MM-DD` (inclusive range). Returns `[]` for invalid input.
 */
export function getDateKeysInRange(startKey: string, endKey: string): string[] {
  const start = parseLocalDate(startKey)
  const end = parseLocalDate(endKey)

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return []
  }

  const keys: string[] = []
  const current = new Date(start)

  while (current <= end) {
    keys.push(formatLocalDateKey(current))
    current.setDate(current.getDate() + 1)
  }

  return keys
}

/**
 * Split [startMs, endMs) by business day.
 *
 * @param startMs Inclusive start timestamp in milliseconds.
 * @param endMs Exclusive end timestamp in milliseconds.
 * @param dayBoundaryHour Business-day boundary hour. Defaults to configured value.
 * @returns Segments keyed by business date. Each segment uses `[startMs, endMs)` semantics.
 * @remarks
 * - Returns `[]` when input is invalid or interval is empty.
 * - Abnormally large spans are dropped and logged.
 */
export function splitTimeRangeByBusinessDay(
  startMs: number,
  endMs: number,
  dayBoundaryHour = getConfiguredDayBoundaryHour()
): BusinessDaySegment[] {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return []
  }

  const boundaryHour = clampDayBoundaryHour(dayBoundaryHour)
  const estimatedSpanDays = Math.ceil((endMs - startMs) / (HOURS_IN_DAY * MILLISECONDS_IN_ONE_HOUR))
  let currentKey = getBusinessDateKey(startMs, boundaryHour)
  if (!currentKey) return []

  const segments: BusinessDaySegment[] = []
  let processedDays = 0

  while (true) {
    if (processedDays >= MAX_BUSINESS_DAY_SPLIT_DAYS) {
      console.warn(
        '[splitTimeRangeByBusinessDay] Abnormal timer span detected. Segment range dropped.',
        {
          startMs,
          endMs,
          estimatedSpanDays,
          maxSpanDays: MAX_BUSINESS_DAY_SPLIT_DAYS
        }
      )
      return []
    }

    const dayStart = getBusinessDayStartFromKey(currentKey, boundaryHour).getTime()
    const nextDayStart = getNextBusinessDayStartFromKey(currentKey, boundaryHour).getTime()
    if (!Number.isFinite(dayStart) || !Number.isFinite(nextDayStart) || nextDayStart <= dayStart) {
      break
    }

    if (dayStart >= endMs) break

    const segmentStart = Math.max(startMs, dayStart)
    const segmentEnd = Math.min(endMs, nextDayStart)

    if (segmentEnd > segmentStart) {
      segments.push({
        key: currentKey,
        startMs: segmentStart,
        endMs: segmentEnd
      })
    }
    processedDays += 1

    if (nextDayStart >= endMs) break

    const nextLabel = parseLocalDate(currentKey)
    nextLabel.setDate(nextLabel.getDate() + 1)
    currentKey = formatLocalDateKey(nextLabel)
  }

  return segments
}

/**
 * Convert business date key to ISO string at business-day boundary start.
 *
 * @param dateKey Business date key in `YYYY-MM-DD`.
 * @param dayBoundaryHour Business-day boundary hour. Defaults to configured value.
 * @returns ISO datetime string (`UTC`) for boundary start, or empty string for invalid input.
 * @remarks `toISOString()` is always UTC output; only the computed boundary uses local rules.
 */
export function toBusinessDateISO(
  dateKey: string,
  dayBoundaryHour = getConfiguredDayBoundaryHour()
): string {
  const businessStart = getBusinessDayStartFromKey(dateKey, dayBoundaryHour)
  if (isNaN(businessStart.getTime())) return ''
  return businessStart.toISOString()
}
