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
import { CollectionMenu } from './CollectionMenu'
import { ManageMenu } from './ManageMenu'
import { NameEditorDialog } from './ManageMenu/NameEditorDialog'
import { PlayTimeEditorDialog } from './ManageMenu/PlayTimeEditorDialog'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'

export function Config({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const navigate = useNavigate()
  const location = useLocation()

  const goToProperties = (): void => {
    // Make sure there is no slash at the end of the path, then add /properties
    const basePath = location.pathname.endsWith('/')
      ? location.pathname.slice(0, -1)
      : location.pathname
    navigate(`${basePath}/properties`)
  }
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const [isPlayTimeEditorDialogOpen, setIsPlayTimeEditorDialogOpen] = React.useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={'icon'} className="non-draggable">
            <span className={cn('icon-[mdi--settings-outline] w-4 h-4')}></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-5 w-44 bg-popover/[0.7]">
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
          <DropdownMenuItem onSelect={goToProperties}>
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
    </>
  )
}
