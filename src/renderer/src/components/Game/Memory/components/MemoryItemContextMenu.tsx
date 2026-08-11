import { useTranslation } from 'react-i18next'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@ui/context-menu'
import type { MemoryViewItem, MemoryViewRuntime } from '../type'
import { exportAllMemories } from '../utils'

export function MemoryItemContextMenu({
  item,
  runtime,
  trigger,
  children
}: {
  item: MemoryViewItem
  runtime: MemoryViewRuntime
  trigger: React.ReactElement
  children: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{trigger}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => void runtime.togglePin(item.memoryId)}>
          {t(item.pinned ? 'detail.memory.actions.unpin' : 'detail.memory.actions.pin')}
        </ContextMenuItem>
        {children}
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => void exportAllMemories(runtime.gameId)}>
          {t('detail.memory.export.all')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => void runtime.deleteMemory(item.memoryId)}>
          {t('detail.memory.actions.delete')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
