import i18next from 'i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { formatDateToISO } from '~/utils'

export async function exportMemoryNoteMarkdown({
  gameId,
  memoryId,
  gameName,
  date,
  dateLabel,
  note,
  type
}: {
  gameId: string
  memoryId: string
  gameName: string
  date: string
  dateLabel: string
  note: string
  type: 'clipboard' | 'file'
}): Promise<void> {
  if (!note.trim()) return

  const coverPath = await ipcManager.invoke('game:get-memory-cover-path', gameId, memoryId)
  const markdownSections = [`# ${gameName} - ${dateLabel}`]

  if (coverPath) {
    markdownSections.push(`![cover](${coverPath})`)
  }

  markdownSections.push(note)
  const markdownContent = markdownSections.join('\n\n')

  if (type === 'clipboard') {
    try {
      await navigator.clipboard.writeText(markdownContent)
      toast.success(i18next.t('game:detail.memory.notifications.markdownCopied'))
    } catch (error) {
      toast.error(i18next.t('game:detail.memory.notifications.markdownCopyError', { error }))
    }
    return
  }

  const blob = new Blob([markdownContent], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${gameName}-memory-${formatDateToISO(date)}.md`
  link.click()
  URL.revokeObjectURL(url)
}
