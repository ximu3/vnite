import { ScraperCapabilities } from '@appTypes/utils'
import { Button } from '@ui/button'
import { Card } from '@ui/card'
import { Dialog, DialogContent } from '@ui/dialog'
import { Input } from '@ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'

function checkMediaCapability(capabilities: ScraperCapabilities[], type: string): boolean {
  switch (type) {
    case 'cover':
      return capabilities.includes('getGameCovers')
    case 'icon':
      return capabilities.includes('getGameIcons')
    case 'logo':
      return capabilities.includes('getGameLogos')
    case 'background':
      return capabilities.includes('getGameBackgrounds')
    default:
      return false
  }
}

interface SearchMediaDialogProps {
  isOpen: boolean
  onClose: () => void
  type: string
  gameTitle: string
  onSelect: (imagePath: string) => void
}

export function SearchMediaDialog({
  isOpen,
  onClose,
  type,
  gameTitle,
  onSelect
}: SearchMediaDialogProps): React.JSX.Element {
  const { t } = useTranslation('game')
  const [searchTitle, setSearchTitle] = useState(gameTitle)
  const [dataSource, setDataSource] = useState('google')
  const [defaultMediaDataSource] = useConfigState('game.scraper.common.defaultMediaDataSource')
  const [availableDataSources, setAvailableDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])
  const [imageList, setImageList] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchAvailableDataSources = async (): Promise<void> => {
      const sources = await ipcManager.invoke(
        'scraper:get-provider-infos-with-capabilities',
        ['getGameCovers', 'getGameIcons', 'getGameLogos', 'getGameBackgrounds'],
        false
      )
      setAvailableDataSources(sources)
    }
    fetchAvailableDataSources()
  }, [])

  useEffect(() => {
    const defaultSource = availableDataSources.find((s) => s.id === defaultMediaDataSource)
    if (!defaultSource) return

    if (checkMediaCapability(defaultSource.capabilities, type)) {
      setDataSource(defaultMediaDataSource)
    }
  }, [defaultMediaDataSource, availableDataSources, setDataSource])

  useEffect(() => {
    if (isOpen) {
      toast.promise(handleSearch(), {
        loading: t('detail.properties.media.notifications.searching'),
        success: t('detail.properties.media.notifications.searchSuccess'),
        error: (err) =>
          t('detail.properties.media.notifications.searchError', { message: err.message })
      })
    }
  }, [isOpen])

  async function handleSearch(): Promise<void> {
    if (isLoading) return
    setIsLoading(true)

    try {
      let result: string[] = []
      switch (type) {
        case 'cover':
          result = await ipcManager.invoke('scraper:get-game-covers', dataSource, {
            type: 'name',
            value: searchTitle
          })
          break
        case 'icon':
          result = await ipcManager.invoke('scraper:get-game-icons', dataSource, {
            type: 'name',
            value: searchTitle
          })
          break
        case 'logo':
          result = await ipcManager.invoke('scraper:get-game-logos', dataSource, {
            type: 'name',
            value: searchTitle
          })
          break
        case 'background':
          result = await ipcManager.invoke('scraper:get-game-backgrounds', dataSource, {
            type: 'name',
            value: searchTitle
          })
          break
      }

      if (result.length === 0) {
        toast.error(t('detail.properties.media.notifications.noResultsFound'))
        return
      }

      const uniqueResult = [...new Set(result)]
      setImageList(uniqueResult)
      setSelectedImage(uniqueResult[0])
    } catch (error) {
      toast.error(t('detail.properties.media.notifications.searchError', { message: error }))
    } finally {
      setIsLoading(false)
    }
  }

  function handleConfirm(): void {
    if (!selectedImage) {
      toast.error(t('detail.properties.media.notifications.selectImage'))
      return
    }
    onSelect(selectedImage)
    handleClose()
  }

  function handleClose(): void {
    setSelectedImage('')
    setImageList([])
    setDataSource('google')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className={cn('w-[50vw] h-[80vh] max-w-none flex flex-col gap-3')}
      >
        {/* Image List */}
        <Card className={cn('p-3 w-full h-full')}>
          <div className="w-full h-full">
            <div className={cn('w-full h-full scrollbar-base overflow-auto')}>
              <div className={cn('grid grid-cols-2 gap-3 h-[62vh]')}>
                {imageList.length > 0 ? (
                  imageList.map((image) => (
                    <div
                      key={image}
                      onClick={() => setSelectedImage(image)}
                      className={cn(
                        'cursor-pointer p-3 bg-muted text-muted-foreground rounded-lg',
                        image === selectedImage
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <img src={image} alt={image} className="w-full h-auto" />
                    </div>
                  ))
                ) : (
                  <div>{t('detail.properties.media.empty.images')}</div>
                )}
              </div>
            </div>
          </div>
        </Card>
        {/* Data Source and Search */}
        <Card className={cn('p-3')}>
          <div className={cn('flex flex-row gap-3')}>
            <Select value={dataSource} onValueChange={setDataSource}>
              <SelectTrigger className={cn('w-72')}>
                <SelectValue placeholder={t('detail.properties.media.search.dataSource')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('detail.properties.media.search.dataSource')}</SelectLabel>
                  {availableDataSources
                    .filter((source) => checkMediaCapability(source.capabilities, type))
                    .map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder={t('detail.properties.media.search.searchTitle')}
              className={cn('')}
            />
            <Button
              onClick={() => {
                toast.promise(handleSearch(), {
                  loading: t('detail.properties.media.notifications.searching'),
                  success: t('detail.properties.media.notifications.searchSuccess'),
                  error: (err) =>
                    t('detail.properties.media.notifications.searchError', { message: err.message })
                })
              }}
              size={'icon'}
              className={cn('shrink-0')}
              disabled={isLoading}
            >
              <span className={cn('icon-[mdi--magnify] w-[20px] h-[20px]')}></span>
            </Button>
            <Button onClick={handleConfirm}>{t('utils:common.confirm')}</Button>
            <Button variant="outline" onClick={handleClose}>
              {t('utils:common.cancel')}
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
