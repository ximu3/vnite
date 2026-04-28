export type MemoryNoteDisplay = {
  title: string
  summary: string
}

/**
 * Builds a compact single-line display model from a raw Markdown note.
 *
 * The first non-empty cleaned line becomes the title. Remaining cleaned lines are flattened into
 * a single summary string so list views can show a concise preview without Markdown noise.
 *
 * @param note - The raw Markdown note content.
 * @param fallbackTitle - The title used when the note has no visible text after cleaning.
 * @returns A title and summary pair suitable for compact list rendering.
 */
export function getMemoryNoteDisplay(note: string, fallbackTitle: string): MemoryNoteDisplay {
  const lines = note.split(/\r?\n/).map(cleanMarkdownLine).filter(Boolean)

  if (lines.length === 0) {
    return {
      title: fallbackTitle,
      summary: ''
    }
  }

  const [title, ...rest] = lines

  return {
    title,
    summary: rest.join(' ')
  }
}

function cleanMarkdownLine(line: string): string {
  if (!line.trim() || /^```/.test(line.trim())) return ''

  let next = line.trim()
  let previous = ''

  while (next !== previous) {
    previous = next
    next = next
      .replace(/^#{1,6}(?:\s+|$)/, '')
      .replace(/^>\s?/, '')
      .replace(/^[-*+]\s+\[[ xX]\](?:\s+|$)/, '')
      .replace(/^[-*+](?:\s+|$)/, '')
      .replace(/^\d+\.(?:\s+|$)/, '')
      .trim()
  }

  return next
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<u>(.*?)<\/u>/gi, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
