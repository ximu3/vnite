import type { gameDoc } from '@appTypes/models/game'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '@ui/context-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { getMemoryNoteDisplay } from './memoryNoteDisplay'
import { exportMemoryNoteMarkdown } from './memoryNoteExport'
import { useMemoryStore } from './store'

type MemoryList = gameDoc['memory']['memoryList']

export function MemoryListView({
  gameId,
  gameName,
  memoryIds,
  memoryList,
  onDelete
}: {
  gameId: string
  gameName: string
  memoryIds: string[]
  memoryList: MemoryList
  onDelete: (memoryId: string) => Promise<void>
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const openNoteDialog = useMemoryStore((state) => state.openNoteDialog)

  function openPreview(memoryId: string): void {
    openNoteDialog({ memoryId, initialMode: 'preview' })
  }

  function openEditor(memoryId: string): void {
    openNoteDialog({ memoryId, initialMode: 'edit' })
  }

  return (
    <div className={cn('w-full')}>
      <Table className={cn('table-fixed')}>
        <TableHeader>
          <TableRow>
            <TableHead>{t('detail.memory.list.table.note')}</TableHead>
            <TableHead className={cn('w-[12rem]')}>{t('detail.memory.list.table.date')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memoryIds.map((id) => {
            const memory = memoryList[id]

            if (!memory) {
              return null
            }

            const { title, summary } = getMemoryNoteDisplay(
              memory.note,
              t('detail.memory.list.untitled')
            )
            const dateLabel = t('{{date, niceDateSeconds}}', { date: memory.date })

            return (
              <ContextMenu key={`memory-list-${id}`}>
                <ContextMenuTrigger asChild>
                  <TableRow
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                    )}
                    onClick={() => openPreview(id)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      openPreview(id)
                    }}
                  >
                    <TableCell>
                      <div className={cn('flex min-w-0 items-baseline gap-3 overflow-hidden')}>
                        <span className={cn('shrink-0 text-sm font-semibold text-foreground')}>
                          {title}
                        </span>
                        {summary && (
                          <span
                            className={cn('min-w-0 flex-1 truncate text-xs text-muted-foreground')}
                          >
                            {summary}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={cn('w-[12rem] text-xs text-muted-foreground')}>
                      {dateLabel}
                    </TableCell>
                  </TableRow>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => openEditor(id)}>
                    {t('detail.memory.actions.editText')}
                  </ContextMenuItem>
                  <ContextMenuGroup>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>
                        {t('detail.memory.export.exportAs')}
                      </ContextMenuSubTrigger>
                      <ContextMenuPortal>
                        <ContextMenuSubContent>
                          <ContextMenuSub>
                            <ContextMenuSubTrigger>
                              {t('detail.memory.export.markdown')}
                            </ContextMenuSubTrigger>
                            <ContextMenuPortal>
                              <ContextMenuSubContent>
                                <ContextMenuItem
                                  onSelect={() =>
                                    void exportMemoryNoteMarkdown({
                                      gameId,
                                      memoryId: id,
                                      gameName,
                                      date: memory.date,
                                      dateLabel,
                                      note: memory.note,
                                      type: 'clipboard'
                                    })
                                  }
                                >
                                  {t('detail.memory.export.toClipboard')}
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onSelect={() =>
                                    void exportMemoryNoteMarkdown({
                                      gameId,
                                      memoryId: id,
                                      gameName,
                                      date: memory.date,
                                      dateLabel,
                                      note: memory.note,
                                      type: 'file'
                                    })
                                  }
                                >
                                  {t('detail.memory.export.saveAs')}
                                </ContextMenuItem>
                              </ContextMenuSubContent>
                            </ContextMenuPortal>
                          </ContextMenuSub>
                        </ContextMenuSubContent>
                      </ContextMenuPortal>
                    </ContextMenuSub>
                  </ContextMenuGroup>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => void onDelete(id)}>
                    {t('detail.memory.actions.delete')}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
