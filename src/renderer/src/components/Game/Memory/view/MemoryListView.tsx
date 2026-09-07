import { ContextMenuItem } from '@ui/context-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { MemoryItemContextMenu } from '../components/MemoryItemContextMenu'
import { MemoryPinBadge } from '../components/MemoryPinBadge'
import { useMemoryStore } from '../store'
import type { MemoryViewProps } from '../type'
import { getMemoryNoteDisplay } from '../utils'

export function MemoryListView({ items, runtime }: MemoryViewProps): React.JSX.Element {
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
          {items.map((item) => {
            const { memoryId, note, date, pinned } = item
            const { title, summary } = getMemoryNoteDisplay(note, t('detail.memory.list.untitled'))
            const dateLabel = t('{{date, niceDateSeconds}}', { date })

            return (
              <MemoryItemContextMenu
                key={`memory-list-${memoryId}`}
                item={item}
                runtime={runtime}
                trigger={
                  <TableRow
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                    )}
                    onClick={() => openPreview(memoryId)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      openPreview(memoryId)
                    }}
                  >
                    <TableCell className={cn('relative')}>
                      {pinned && <MemoryPinBadge />}
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
                }
              >
                <ContextMenuItem onSelect={() => openEditor(memoryId)}>
                  {t('detail.memory.actions.editText')}
                </ContextMenuItem>
              </MemoryItemContextMenu>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
