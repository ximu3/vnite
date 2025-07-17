import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import React from 'react'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { cn } from '~/utils'
import { CollectionMenu } from './CollectionMenu'
import { ManageMenu } from './ManageMenu'
import { NameEditorDialog } from './ManageMenu/NameEditorDialog'
import { PlayTimeEditorDialog } from './ManageMenu/PlayTimeEditorDialog'
import { GamePropertiesDialog } from './Properties'
import { useTranslation } from 'react-i18next'

export function Config({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')

  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const [isPlayTimeEditorDialogOpen, setIsPlayTimeEditorDialogOpen] = React.useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = React.useState(false)
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="thirdary" size={'icon'} className="non-draggable w-[40px] h-[40px]">
            <span className={cn('icon-[mdi--settings-outline] w-4 h-4')}></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-5 w-44">
          <CollectionMenu
            gameId={gameId}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
          />
          {/* <DropdownMenuSeparator /> */}
          <ManageMenu
            gameId={gameId}
            openNameEditorDialog={() => setIsNameEditorDialogOpen(true)}
            openPlayingTimeEditorDialog={() => setIsPlayTimeEditorDialogOpen(true)}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsPropertiesDialogOpen(true)}>
            <div>{t('detail.config.properties')}</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameIds={[gameId]} setIsOpen={setIsAddCollectionDialogOpen} />
      )}
      {isNameEditorDialogOpen && (
        <NameEditorDialog gameId={gameId} setIsOpen={setIsNameEditorDialogOpen} />
      )}
      {isPlayTimeEditorDialogOpen && (
        <PlayTimeEditorDialog gameId={gameId} setIsOpen={setIsPlayTimeEditorDialogOpen} />
      )}
      {isPropertiesDialogOpen && (
        <GamePropertiesDialog
          gameId={gameId}
          isOpen={isPropertiesDialogOpen}
          setIsOpen={setIsPropertiesDialogOpen}
        />
      )}
    </>
  )
}
