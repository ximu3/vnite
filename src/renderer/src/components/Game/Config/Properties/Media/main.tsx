import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { GameImage } from '@ui/game-image'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGameState, useConfigState } from '~/hooks'
import { cn } from '~/utils'
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

  //Global variables used to know when to compress the metadata images
  const [imageTransformerStatus] = useConfigState('metadata.imageTransformer.enabled')
  const [imageTransformerQuality] = useConfigState('metadata.imageTransformer.quality')

  //Global variable to let the GameImage component to update the image source
  const [refreshKey, setRefreshKey] = useState(0)

  // Processing file selection
  async function handleFileSelect(type: 'cover' | 'background' | 'icon' | 'logo'): Promise<void> {
    try {
      // Define the base image filters
      const imageFilters = [
        { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
        { name: 'PNG', extensions: ['png'] },
        { name: 'WebP', extensions: ['webp'] },
        { name: 'GIF', extensions: ['gif'] },
        { name: 'SVG', extensions: ['svg'] },
        { name: 'TIFF', extensions: ['tiff'] },
        { name: 'AVIF', extensions: ['avif'] },
        { name: 'ICO', extensions: ['ico'] }
      ]

      // Add EXE filter for icons
      const filters = type === 'icon'
        ? [
            ...imageFilters,
            { name: 'EXE', extensions: ['exe'] },
            {
              name: t('detail.properties.media.upload.allValidFormats'),
              extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tiff', 'avif', 'ico', 'exe']
            }
          ]
        : [
            ...imageFilters,
            {
              name: t('detail.properties.media.upload.allValidFormats'),
              extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tiff', 'avif', 'ico']
            }
          ]

      const filePath: string = await window.api.utils.selectPathDialog(['openFile'], filters)
      if (!filePath) return
      
      if (filePath.endsWith('.exe') && type === 'icon'){
        await window.api.media.saveGameIconByFile(gameId, filePath, imageTransformerStatus, imageTransformerQuality)
        setRefreshKey(k => k + 1)
        return
      }
      else{
        await window.api.game.setGameImage(gameId, type, filePath, imageTransformerStatus, imageTransformerQuality)
        setRefreshKey(k => k + 1)
        return
      }

    } catch (error) {
      toast.error(t('detail.properties.media.notifications.fileSelectError', { error }));
    }
  }

  // Handling of resizing
  async function handleResize(type: 'cover' | 'background' | 'icon' | 'logo'): Promise<void> {
    try {
      // Get current image path
      const currentPath = await window.api.game.getGameMediaPath(gameId, type)
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
  function setMediaWithUrl(type: 'cover' | 'background' | 'icon' | 'logo', URL: string): void {
    toast.promise(
      async () => {
        setIsUrlDialogOpen({ ...isUrlDialogOpen, [type]: false })
        if (!URL.trim()) return

        const tempFilePath = await window.api.media.downloadTempImage(URL.trim())
        await window.api.game.setGameImage(gameId, type, tempFilePath, imageTransformerStatus, imageTransformerQuality)
        setRefreshKey(k => k + 1)
        return
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
        await window.api.game.setGameImage(gameId, type, filePath, false) //To avoid problems where an user might have the compressor set to on
        setRefreshKey(k => k + 1)
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

  // Handling media deletions
  async function handleDeleteMedia(type: 'cover' | 'background' | 'icon' | 'logo'): Promise<void> {
    toast.promise(
      async () => {
        await window.api.game.removeGameMedia(gameId, type)
        setRefreshKey(k => k + 1)
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

  // Media Control Button Component
  const MediaControls = ({type}: {type: 'cover' | 'background' | 'icon' | 'logo'}):
   JSX.Element => (
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

  return (
    <div className={cn('flex flex-row gap-3 w-full h-full')}>
      <div className={cn('flex flex-col gap-3 w-full h-full')}>
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
                  refreshKey={refreshKey}
                  className={cn('max-h-16 h-[calc(30vh-160px)] aspect-[1] object-cover')}
                  fallback={<div className='select-none'>{t('detail.properties.media.empty.icon')}</div>}
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
                  refreshKey={refreshKey}
                  className={cn('max-h-[264px] h-[calc(60vh-200px)] aspect-[2] object-cover')}
                  fallback={<div className='select-none'>{t('detail.properties.media.empty.background')}</div>}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn('flex flex-col gap-3 w-full h-full')}>
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
                  refreshKey={refreshKey}
                  className={cn('max-h-[170px] h-[calc(50vh-230px)] aspect-[2/3] object-cover')}
                  fallback={<div className='select-none'>{t('detail.properties.media.empty.cover')}</div>}
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
                  refreshKey={refreshKey}
                  className={cn('max-h-[158px] h-[calc(40vh-130px)] aspect-[3/2] object-contain')}
                  fallback={<div className='select-none'>{t('detail.properties.media.empty.logo')}</div>}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          const tempFilePath = await window.api.media.downloadTempImage(imagePath)
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
