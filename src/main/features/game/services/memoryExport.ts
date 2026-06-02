import { sanitizeFilenameComponent } from '@appUtils'
import { dialog } from 'electron'
import log from 'electron-log/main'
import fse from 'fs-extra'
import path from 'path'
import { baseDBManager, GameDBManager } from '~/core/database'
import { getAppTempPath } from '~/features/system'
import { formatDate, zipFolder } from '~/utils'

const MARKDOWN_IMAGE_PATTERN =
  /!\[(?<alt>[^\]]*)\]\((?<url><[^>]+>|[^)\s]+)(?<title>\s+"[^"]*")?\)/g
const INLINE_ATTACHMENT_PATTERN = /^images\/memories\/inline\/(?<uuid>[^/]+)\.webp$/i
const INLINE_ATTACHMENT_URL_PATTERN =
  /^attachment:\/\/game\/(?<docId>[^/]+)\/images\/memories\/inline\/(?<uuid>[^/]+)\.webp$/i
export type MemoryExportResult = 'success' | 'empty' | 'canceled'

/**
 * Export all memories of a game as a structured ZIP package.
 * Covers are written into `covers/`, inline attachments are exported into `inline/`
 * with their original UUID filenames, and each memory with note content gets its
 * own Markdown file that references those assets by the same naming convention.
 */
export async function exportAllGameMemories(gameId: string): Promise<MemoryExportResult> {
  const tempRoot = getAppTempPath(`memory-export-${Date.now()}`)

  try {
    const gameName = await GameDBManager.getGameValue(gameId, 'metadata.name')
    const memoryList = await GameDBManager.getGameValue(gameId, 'memory.memoryList')
    const allMemories = Object.values(memoryList)
      .filter((memory) => Boolean(memory && memory.date))
      .sort((a, b) => b.date.localeCompare(a.date))
    const attachmentNames = new Set(await baseDBManager.listAttachmentNames('game', gameId))
    const exportableMemories = allMemories.filter((memory) => {
      return Boolean(
        memory.note?.trim() || attachmentNames.has(`images/memories/${memory._id}.webp`)
      )
    })

    if (exportableMemories.length === 0) {
      return 'empty'
    }

    const defaultName = `${sanitizeFilenameComponent(gameName)}-memories.zip`
    const { filePath: zipPath, canceled } = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: 'ZIP', extensions: ['zip'] }]
    })
    const targetPath =
      canceled || !zipPath
        ? null
        : path.extname(zipPath).toLowerCase() === '.zip'
          ? zipPath
          : `${zipPath}.zip`
    if (!targetPath) {
      return 'canceled'
    }

    const exportDir = path.join(tempRoot, 'bundle')
    const coversDir = path.join(exportDir, 'covers')
    const inlineDir = path.join(exportDir, 'inline')

    await fse.ensureDir(coversDir)
    await fse.ensureDir(inlineDir)

    //* Export inline attachments first so they can be referenced while processing notes *//
    for (const attachmentName of attachmentNames) {
      const inlineMatch = INLINE_ATTACHMENT_PATTERN.exec(attachmentName)
      const inlineUuid = inlineMatch?.groups?.uuid
      if (!inlineUuid) {
        continue
      }

      const buffer = await baseDBManager.getAttachment('game', gameId, attachmentName)
      await fse.writeFile(path.join(inlineDir, `${inlineUuid}.webp`), buffer)
    }

    //* Process each memory and export its note with rewritten image references *//
    for (const memory of exportableMemories) {
      const fileStem = `${memory._id}`
      const hasNote = Boolean(memory.note?.trim())
      const coverBuffer = attachmentNames.has(`images/memories/${memory._id}.webp`)
        ? await GameDBManager.getGameMemoryImage(gameId, memory._id, 'buffer')
        : null
      let coverUrl: string | null = null

      if (coverBuffer) {
        const coverFileName = `${memory._id}.webp`
        await fse.writeFile(path.join(coversDir, coverFileName), coverBuffer)
        coverUrl = `./covers/${coverFileName}`
      }

      if (!hasNote) {
        continue
      }

      const rewrittenNoteParts: string[] = []
      let lastIndex = 0

      for (const match of memory.note.matchAll(MARKDOWN_IMAGE_PATTERN)) {
        const start = match.index
        const end = start + match[0].length
        const alt = match.groups?.alt ?? ''
        const rawUrl = match.groups?.url ?? ''
        const title = match.groups?.title ?? ''
        const normalizedUrl =
          rawUrl.startsWith('<') && rawUrl.endsWith('>') ? rawUrl.slice(1, -1) : rawUrl

        rewrittenNoteParts.push(memory.note.slice(lastIndex, start))

        const inlineUrlMatch = INLINE_ATTACHMENT_URL_PATTERN.exec(normalizedUrl)

        if (!inlineUrlMatch?.groups?.uuid || inlineUrlMatch.groups.docId !== gameId) {
          rewrittenNoteParts.push(match[0])
          lastIndex = end
          continue
        }

        rewrittenNoteParts.push(`![${alt}](./inline/${inlineUrlMatch.groups.uuid}.webp${title})`)
        lastIndex = end
      }

      rewrittenNoteParts.push(memory.note.slice(lastIndex))
      const rewrittenNote = rewrittenNoteParts.join('')
      const sections: string[] = []

      if (coverUrl) {
        sections.push(`![cover](${coverUrl})`)
      }

      sections.push(rewrittenNote.trimEnd())
      sections.push(
        `*${gameName} · ${formatDate(memory.date, 'yyyy-MM-dd HH:mm:ss') || memory.date}*`
      )
      const markdown = `${sections.join('\n\n')}\n`

      await fse.writeFile(path.join(exportDir, `${fileStem}.md`), markdown, 'utf-8')
    }

    await zipFolder(exportDir, path.dirname(targetPath), path.basename(targetPath))
    return 'success'
  } catch (error) {
    log.error('[Game] Error exporting all memories:', error)
    throw error
  } finally {
    await fse.remove(tempRoot).catch(() => undefined)
  }
}
