import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'
import React from 'react'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { cn } from '~/utils'
import { AttributesDialog } from './AttributesDialog'
import { CollectionMenu } from './CollectionMenu'
import { ManageMenu } from './ManageMenu'
import { NameEditorDialog } from './ManageMenu/NameEditorDialog'
import { PlayingTimeEditorDialog } from './ManageMenu/PlayingTimeEditorDialog'

export function Config({ gameId }: { gameId: string }): JSX.Element {
  const [isAttributesDialogOpen, setIsAttributesDialogOpen] = React.useState(false)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const [isPlayingTimeEditorDialogOpen, setIsPlayingTimeEditorDialogOpen] = React.useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = React.useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={'icon'} className="non-draggable">
            <span className={cn('icon-[mdi--settings-outline] w-4 h-4')}></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44 mr-5">
          <CollectionMenu
            gameId={gameId}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
          />
          <DropdownMenuSeparator />
          <ManageMenu
            gameId={gameId}
            openNameEditorDialog={() => setIsNameEditorDialogOpen(true)}
            openPlayingTimeEditorDialog={() => setIsPlayingTimeEditorDialogOpen(true)}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsAttributesDialogOpen(true)}>
            <div>属性</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isAttributesDialogOpen && (
        <AttributesDialog gameId={gameId} setIsOpen={setIsAttributesDialogOpen} />
      )}
      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameIds={[gameId]} setIsOpen={setIsAddCollectionDialogOpen} />
      )}
      {isNameEditorDialogOpen && (
        <NameEditorDialog gameId={gameId} setIsOpen={setIsNameEditorDialogOpen} />
      )}
      {isPlayingTimeEditorDialogOpen && (
        <PlayingTimeEditorDialog gameId={gameId} setIsOpen={setIsPlayingTimeEditorDialogOpen} />
      )}
    </>
  )
}
