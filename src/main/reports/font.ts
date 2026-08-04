import reportFontPath from '@resources/fonts/LXGWWenKaiMono-Medium.ttf?asset&asarUnpack'
import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import subsetFont from 'subset-font'

const MAX_FONT_CACHE_ENTRIES = 4
const fontSubsetCache = new Map<string, string>()
let reportFontBuffer: Buffer | null = null

function cacheSubset(key: string, dataUrl: string): void {
  fontSubsetCache.delete(key)
  fontSubsetCache.set(key, dataUrl)

  while (fontSubsetCache.size > MAX_FONT_CACHE_ENTRIES) {
    const oldestKey = fontSubsetCache.keys().next().value
    if (oldestKey) fontSubsetCache.delete(oldestKey)
  }
}

export async function createReportFontSubset(text: string): Promise<{ dataUrl: string }> {
  if (!text.trim()) throw new Error('Cannot create a report font subset without text')

  const characters = Array.from(new Set(`${text}\n 0123456789.-—（）()[]{}，。！？、：；%�`))
    .sort()
    .join('')

  const cacheKey = createHash('sha256').update(characters).digest('hex')
  const cached = fontSubsetCache.get(cacheKey)
  if (cached) {
    cacheSubset(cacheKey, cached)
    return { dataUrl: cached }
  }

  try {
    reportFontBuffer ??= await readFile(reportFontPath)
    const subset = await subsetFont(reportFontBuffer, characters, { targetFormat: 'woff2' })
    const dataUrl = `data:font/woff2;base64,${subset.toString('base64')}`
    cacheSubset(cacheKey, dataUrl)
    return { dataUrl }
  } catch (error) {
    throw new Error(`Failed to create the bundled report font subset: ${String(error)}`)
  }
}
