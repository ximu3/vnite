import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { GameImage } from '@ui/game-image'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGameState } from '~/hooks'
import { cn, ipcInvoke } from '~/utils'
import { CropDialog } from './CropDialog'
import { SearchMediaDialog } from './SearchMediaDialog'
import { UrlDialog } from './UrlDialog'
import { useTranslation } from 'react-i18next'

export function Media({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')

  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState({
    icon: false,
    cover: false,
    background: false,
    logo: false
  })

  const [cropDialogState, setCropDialogState] = useState<{
    isOpen: boolean
    type: string
    imagePath: string | null
    isResizing: boolean
  }>({
    isOpen: false,
    type: '',
    imagePath: null,
    isResizing: false
  })

  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [searchType, setSearchType] = useState('')

  const [originalName] = useGameState(gameId, 'metadata.originalName')

  // Processing file selection
  async function handleFileSelect(type: string): Promise<void> {
    try {
      const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
      if (!filePath) return

      if (filePath.endsWith('.exe') && type == 'icon') {
        await ipcInvoke('set-game-media', gameId, type, filePath)
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

  // Handling of resizing
  async function handleResize(type: string): Promise<void> {
    try {
      // Get current image path
      const currentPath: string = await ipcInvoke('get-game-media-path', gameId, type)
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

  // Processing URL Input
  function setMediaWithUrl(type: string, URL: string): void {
    toast.promise(
      async () => {
        setIsUrlDialogOpen({ ...isUrlDialogOpen, [type]: false })
        if (!URL.trim()) return

        const tempFilePath = await ipcInvoke('download-temp-image', URL)
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

  // Processing cuts are complete
  async function handleCropComplete(type: string, filePath: string): Promise<void> {
    setCropDialogState({ isOpen: false, type: '', imagePath: null, isResizing: false })

    const action = cropDialogState.isResizing
      ? t('detail.properties.media.actions.adjust')
      : t('detail.properties.media.actions.set')

    toast.promise(
      async () => {
        await ipcInvoke('set-game-image', gameId, type, filePath)
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

  // Media Control Button Component
  const MediaControls = ({ type }: { type: string }): JSX.Element => (
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
    </div>
  )

  return (
    <div className={cn('flex flex-row gap-3 w-full')}>
      <div className={cn('flex flex-col gap-3 w-full')}>
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.properties.media.types.icon')}</CardTitle>
          </CardHeader>
          <CardContent className={cn('-mt-2')}>
            <div className={cn('flex flex-col gap-2')}>
              <MediaControls type="icon" />
              <div className={cn('self-center')}>
                <GameImage
                  gameId={gameId}
                  type="icon"
                  className={cn('max-h-16 h-[calc(30vh-160px)] aspect-[1] object-cover')}
                  fallback={<div>{t('detail.properties.media.empty.icon')}</div>}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('detail.properties.media.types.background')}</CardTitle>
          </CardHeader>
          <CardContent className={cn('-mt-2')}>
            <div className={cn('flex flex-col gap-2')}>
              <MediaControls type="background" />
              <div className={cn('self-center')}>
                <GameImage
                  gameId={gameId}
                  type="background"
                  className={cn('max-h-[264px] h-[calc(60vh-200px)] aspect-[2] object-cover')}
                  fallback={<div>{t('detail.properties.media.empty.background')}</div>}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn('flex flex-col gap-3 w-full')}>
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.properties.media.types.cover')}</CardTitle>
          </CardHeader>
          <CardContent className={cn('-mt-2')}>
            <div className={cn('flex flex-col gap-2')}>
              <MediaControls type="cover" />
              <div className={cn('self-center')}>
                <GameImage
                  gameId={gameId}
                  type="cover"
                  className={cn('max-h-[170px] h-[calc(90vh-230px)] aspect-[2/3] object-cover')}
                  fallback={<div>{t('detail.properties.media.empty.cover')}</div>}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.properties.media.types.logo')}</CardTitle>
          </CardHeader>
          <CardContent className={cn('-mt-2')}>
            <div className={cn('flex flex-col gap-2')}>
              <MediaControls type="logo" />
              <div className={cn('self-center')}>
                <GameImage
                  gameId={gameId}
                  type="logo"
                  className={cn('max-h-[158px] h-[calc(90vh-230px)] aspect-[2/3] object-contain')}
                  fallback={<div>{t('detail.properties.media.empty.logo')}</div>}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CropDialog
        isOpen={cropDialogState.isOpen}
        onClose={() =>
          setCropDialogState({ isOpen: false, type: '', imagePath: null, isResizing: false })
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
          const tempFilePath = await ipcInvoke('download-temp-image', imagePath)
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
