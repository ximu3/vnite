import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { GameImage } from '~/components/ui/game-image'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useGameState } from '~/hooks'
import { useLightStore } from '~/pages/Light'
import { cn } from '~/utils'
import { CropDialog } from './CropDialog'
import { SearchMediaDialog } from './SearchMediaDialog'
import { UrlDialog } from './UrlDialog'

export function Media({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const refreshLight = useLightStore((state) => state.refresh)

  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState({
    icon: false,
    cover: false,
    background: false,
    logo: false
  })

  const [cropDialogState, setCropDialogState] = useState<{
    isOpen: boolean
    type: 'cover' | 'background' | 'icon' | 'logo'
    imagePath: string | null
    isResizing: boolean
  }>({
    isOpen: false,
    type: 'cover',
    imagePath: null,
    isResizing: false
  })

  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [searchType, setSearchType] = useState<'cover' | 'background' | 'icon' | 'logo'>('cover')

  const [originalName] = useGameState(gameId, 'metadata.originalName')

  async function handleFileSelect(type: 'cover' | 'background' | 'icon' | 'logo'): Promise<void> {
    try {
      const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!filePath) return

      // If the selected file is an executable and the type is icon, set it directly, will get the icon from the executable
      if (filePath.endsWith('.exe') && type == 'icon') {
        await ipcManager.invoke('game:set-image', gameId, type, filePath)
        return
      }

      setCropDialogState({
        isOpen: true,
        type,
        imagePath: filePath,
        isResizing: false
      })
    } catch (error) {
      toast.error(t('detail.properties.media.notifications.fileSelectError', { error }))
    }
  }

  async function handleClipboardImport(
    type: 'cover' | 'background' | 'icon' | 'logo'
  ): Promise<void> {
    try {
      const filePath = await ipcManager.invoke('utils:save-clipboard-image')
      if (!filePath) {
        toast.warning(t('detail.properties.media.notifications.noImageInClipboard'))
        return
      }

      setCropDialogState({
        isOpen: true,
        type,
        imagePath: filePath,
        isResizing: false
      })
    } catch (error) {
      toast.error(t('detail.properties.media.notifications.clipboardImportError', { error }))
    }
  }

  async function handleResize(type: 'cover' | 'background' | 'icon' | 'logo'): Promise<void> {
    try {
      // Get current image path
      const currentPath = await ipcManager.invoke('game:get-media-path', gameId, type)
      if (!currentPath) {
        toast.error(t('detail.properties.media.notifications.imageNotFound'))
        return
      }

      setCropDialogState({
        isOpen: true,
        type,
        imagePath: currentPath,
        isResizing: true
      })
    } catch (error) {
      toast.error(t('detail.properties.media.notifications.getImageError', { error }))
    }
  }

  function setMediaWithUrl(type: 'cover' | 'background' | 'icon' | 'logo', URL: string): void {
    toast.promise(
      async () => {
        setIsUrlDialogOpen({ ...isUrlDialogOpen, [type]: false })
        if (!URL.trim()) return

        const tempFilePath = await ipcManager.invoke('utils:download-temp-image', URL.trim())
        setCropDialogState({
          isOpen: true,
          type,
          imagePath: tempFilePath as string,
          isResizing: false
        })
      },
      {
        loading: t('detail.properties.media.notifications.downloading'),
        success: t('detail.properties.media.notifications.downloadSuccess'),
        error: (err) =>
          t('detail.properties.media.notifications.downloadError', { message: err.message })
      }
    )
  }

  async function handleCropComplete(
    type: 'cover' | 'background' | 'icon' | 'logo',
    filePath: string
  ): Promise<void> {
    setCropDialogState({ isOpen: false, type: 'cover', imagePath: null, isResizing: false })

    const action = cropDialogState.isResizing
      ? t('detail.properties.media.actions.adjust')
      : t('detail.properties.media.actions.set')

    toast.promise(
      async () => {
        await ipcManager.invoke('game:set-image', gameId, type, filePath)
        refreshLight()
      },
      {
        loading: t('detail.properties.media.notifications.processing', {
          action,
          type: t(`detail.properties.media.types.${type}`)
        }),
        success: t('detail.properties.media.notifications.success', {
          action,
          type: t(`detail.properties.media.types.${type}`)
        }),
        error: (err) =>
          t('detail.properties.media.notifications.error', {
            action,
            type: t(`detail.properties.media.types.${type}`),
            message: err.message
          })
      }
    )
  }

  async function handleDeleteMedia(type: 'cover' | 'background' | 'icon' | 'logo'): Promise<void> {
    toast.promise(
      async () => {
        await ipcManager.invoke('game:remove-media', gameId, type)
        refreshLight()
      },
      {
        loading: t('detail.properties.media.notifications.deleting', {
          type: t(`detail.properties.media.types.${type}`)
        }),
        success: t('detail.properties.media.notifications.deleteSuccess', {
          type: t(`detail.properties.media.types.${type}`)
        }),
        error: (err) =>
          t('detail.properties.media.notifications.deleteError', {
            type: t(`detail.properties.media.types.${type}`),
            message: err.message
          })
      }
    )
  }

  const MediaControls = ({
    type
  }: {
    type: 'cover' | 'background' | 'icon' | 'logo'
  }): React.JSX.Element => (
    <div className={cn('flex flex-row gap-2')}>
      <Tooltip>
        <TooltipTrigger>
          <Button
            onClick={() => handleFileSelect(type)}
            variant={'outline'}
            size={'icon'}
            className={cn('w-7 h-7')}
          >
            <span className={cn('icon-[mdi--file-outline] w-4 h-4')}></span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('detail.properties.media.actions.importFromFile')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Button
            onClick={() => handleClipboardImport(type)}
            variant="outline"
            size="icon"
            className={cn('w-7 h-7')}
          >
            <span className={cn('icon-[mdi--clipboard-outline] w-4 h-4')}></span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('detail.properties.media.actions.importFromClipboard')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <UrlDialog
            setMediaWithUrl={setMediaWithUrl}
            isUrlDialogOpen={isUrlDialogOpen}
            setIsUrlDialogOpen={setIsUrlDialogOpen}
            type={type}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('detail.properties.media.actions.importFromUrl')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Button
            onClick={() => {
              setSearchType(type)
              setIsSearchDialogOpen(true)
            }}
            variant={'outline'}
            size={'icon'}
            className={cn('w-7 h-7')}
          >
            <span className={cn('icon-[mdi--search] w-4 h-4')}></span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('detail.properties.media.actions.searchImage')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Button
            onClick={() => handleResize(type)}
            variant={'outline'}
            size={'icon'}
            className={cn('w-7 h-7')}
          >
            <span className={cn('icon-[mdi--resize] w-4 h-4')}></span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('detail.properties.media.actions.cropImage')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Button
            onClick={() => handleDeleteMedia(type)}
            variant={'outline'}
            size={'icon'}
            className={cn('w-7 h-7 hover:bg-destructive hover:text-destructive-foreground')}
          >
            <span className={cn('icon-[mdi--delete-outline] w-4 h-4')}></span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('detail.properties.media.actions.deleteImage')}
        </TooltipContent>
      </Tooltip>
    </div>
  )

  const MediaCard = ({
    type,
    aspectRatio
  }: {
    type: 'cover' | 'background' | 'icon' | 'logo'
    aspectRatio: string
  }): React.JSX.Element => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{t(`detail.properties.media.types.${type}`)}</CardTitle>
      </CardHeader>
      <CardContent className={cn('-mt-2 flex-1 flex flex-col')}>
        <div className={cn('flex flex-col gap-2 h-full')}>
          <MediaControls type={type} />
          <div className={cn('flex-1 flex items-center justify-center')}>
            <GameImage
              gameId={gameId}
              type={type}
              className={cn(
                `aspect-[${aspectRatio}] object-${type === 'logo' ? 'contain' : 'cover'} h-auto max-h-full`
              )}
              fallback={<div>{t(`detail.properties.media.empty.${type}`)}</div>}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={cn('grid grid-cols-[1fr_1.5fr] gap-3 w-full h-full')}>
      <MediaCard type="cover" aspectRatio="2/3" />
      <MediaCard type="background" aspectRatio="2" />
      <MediaCard type="icon" aspectRatio="1" />
      <MediaCard type="logo" aspectRatio="3/2" />

      <CropDialog
        isOpen={cropDialogState.isOpen}
        onClose={() =>
          setCropDialogState({ isOpen: false, type: 'cover', imagePath: null, isResizing: false })
        }
        imagePath={cropDialogState.imagePath}
        onCropComplete={(filePath) => handleCropComplete(cropDialogState.type, filePath)}
      />
      <SearchMediaDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        type={searchType}
        gameTitle={originalName}
        onSelect={async (imagePath) => {
          toast.loading(t('detail.properties.media.notifications.downloading'), {
            id: 'download-image-toast'
          })
          const tempFilePath = await ipcManager.invoke('utils:download-temp-image', imagePath)
          toast.dismiss('download-image-toast')
          toast.success(t('detail.properties.media.notifications.downloadSuccess'))
          setCropDialogState({
            isOpen: true,
            type: searchType,
            imagePath: tempFilePath as string,
            isResizing: false
          })
        }}
      />
    </div>
  )
}
