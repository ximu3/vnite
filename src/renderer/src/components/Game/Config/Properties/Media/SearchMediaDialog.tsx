import type { GameMediaType } from '@appTypes/models'
import type { ScraperCapabilities, ScraperIdentifier } from '@appTypes/utils'
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

type DataSourceMap = Record<GameMediaType, string>
type SearchMode = ScraperIdentifier['type']
type SearchPresetValue = 'originalName' | 'name' | 'storedId'

interface SearchPresetOption {
  value: SearchPresetValue
  label: string
  searchMode: SearchMode
  searchValue: string
}

interface MediaSearchContext {
  name: string
  originalName: string
  storedIds: Partial<Record<string, string>>
}

function checkMediaCapability(capabilities: ScraperCapabilities[], type: GameMediaType): boolean {
  switch (type) {
    case 'cover':
      return capabilities.includes('getGameCovers')
    case 'icon':
      return capabilities.includes('getGameIcons')
    case 'logo':
      return capabilities.includes('getGameLogos')
    case 'background':
      return capabilities.includes('getGameBackgrounds')
    case 'wideCover':
      return capabilities.includes('getGameWideCovers')
    default:
      return false
  }
}

interface SearchMediaDialogProps {
  isOpen: boolean
  onClose: () => void
  type: GameMediaType
  searchContext: MediaSearchContext
  onSelect: (imagePath: string) => void
}

export function SearchMediaDialog({
  isOpen,
  onClose,
  type,
  searchContext,
  onSelect
}: SearchMediaDialogProps): React.JSX.Element {
  const { t } = useTranslation('game')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('name')
  const [dataSources, setDataSources] = useState<DataSourceMap>({
    cover: 'google',
    icon: 'google',
    logo: 'google',
    background: 'google',
    wideCover: 'google'
  })
  const [defaultMediaDataSource] = useConfigState('game.scraper.common.defaultMediaDataSource')
  const [availableDataSources, setAvailableDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])
  const [imageList, setImageList] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const currentDataSource = dataSources[type]
  const quickFillOptions = getSearchPresetOptions(currentDataSource, searchContext, t)

  useEffect(() => {
    const fetchAvailableDataSources = async (): Promise<void> => {
      const sources = await ipcManager.invoke(
        'scraper:get-provider-infos-with-capabilities',
        [
          'getGameCovers',
          'getGameIcons',
          'getGameLogos',
          'getGameBackgrounds',
          'getGameWideCovers'
        ],
        false
      )
      setAvailableDataSources(sources)
    }
    fetchAvailableDataSources()
  }, [])

  useEffect(() => {
    const defaultSource = availableDataSources.find((s) => s.id === defaultMediaDataSource)
    if (!defaultSource) return

    const nextDataSources: DataSourceMap = {
      cover: 'google',
      icon: 'google',
      logo: 'google',
      background: 'google',
      wideCover: 'google'
    }

    for (const t of ['cover', 'icon', 'logo', 'background', 'wideCover'] as GameMediaType[]) {
      if (checkMediaCapability(defaultSource.capabilities, t)) {
        nextDataSources[t] = defaultMediaDataSource
      }
    }
    setDataSources(nextDataSources)
  }, [defaultMediaDataSource, availableDataSources])

  useEffect(() => {
    if (isOpen) {
      const defaultSearchState = getDefaultSearchState(searchContext)
      setSearchTitle(defaultSearchState.searchValue)
      setSearchMode(defaultSearchState.searchMode)
      setImageList([])
      setSelectedImage('')
    }
  }, [isOpen])

  async function handleSearch(
    value: string = searchTitle,
    mode: SearchMode = searchMode
  ): Promise<void> {
    if (isLoading) return
    const normalizedValue = value.trim()
    if (!normalizedValue) {
      toast.error(t('detail.properties.media.notifications.emptySearchValue'))
      return
    }
    setIsLoading(true)

    try {
      const identifier: ScraperIdentifier = {
        type: mode,
        value: normalizedValue
      }
      let result: string[] = []
      switch (type) {
        case 'cover':
          result = await ipcManager.invoke('scraper:get-game-covers', dataSources.cover, identifier)
          break
        case 'icon':
          result = await ipcManager.invoke('scraper:get-game-icons', dataSources.icon, identifier)
          break
        case 'logo':
          result = await ipcManager.invoke('scraper:get-game-logos', dataSources.logo, identifier)
          break
        case 'background':
          result = await ipcManager.invoke(
            'scraper:get-game-backgrounds',
            dataSources.background,
            identifier
          )
          break
        case 'wideCover':
          result = await ipcManager.invoke(
            'scraper:get-game-wide-covers',
            dataSources.wideCover,
            identifier
          )
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

  function runSearchWithToast(value: string = searchTitle, mode: SearchMode = searchMode): void {
    if (isLoading) return

    const normalizedValue = value.trim()
    if (!normalizedValue) {
      toast.error(t('detail.properties.media.notifications.emptySearchValue'))
      return
    }

    toast.promise(handleSearch(normalizedValue, mode), {
      loading: t('detail.properties.media.notifications.searching'),
      success: t('detail.properties.media.notifications.searchSuccess'),
      error: (err) =>
        t('detail.properties.media.notifications.searchError', { message: err.message })
    })
  }

  function handleSearchPresetChange(value: SearchPresetValue): void {
    const selectedPreset = quickFillOptions.find((option) => option.value === value)
    if (!selectedPreset) return

    setSearchTitle(selectedPreset.searchValue)
    setSearchMode(selectedPreset.searchMode)
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
          <div className={cn('flex flex-col gap-3')}>
            <div className={cn('flex flex-row gap-3')}>
              <Select
                value={currentDataSource}
                onValueChange={(value) => setDataSources((prev) => ({ ...prev, [type]: value }))}
              >
                <SelectTrigger className={cn('w-72')}>
                  <SelectValue placeholder={t('detail.properties.media.search.dataSource')} />
                </SelectTrigger>
                <SelectContent side="top">
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
              <Select
                value={searchMode}
                onValueChange={(value) => setSearchMode(value as SearchMode)}
              >
                <SelectTrigger className={cn('w-48')}>
                  <SelectValue placeholder={t('detail.properties.media.search.searchType')} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    <SelectLabel>{t('detail.properties.media.search.searchType')}</SelectLabel>
                    <SelectItem value="name">
                      {t('detail.properties.media.search.byName')}
                    </SelectItem>
                    <SelectItem value="id">{t('detail.properties.media.search.byId')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value=""
                onValueChange={(value) => handleSearchPresetChange(value as SearchPresetValue)}
              >
                <SelectTrigger className={cn('w-48')}>
                  <SelectValue placeholder={t('detail.properties.media.search.quickFill')} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    <SelectLabel>{t('detail.properties.media.search.quickFill')}</SelectLabel>
                    {quickFillOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className={cn('flex flex-row gap-3')}>
              <Input
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder={t('detail.properties.media.search.searchTitle')}
                className={cn('flex-1')}
              />
              <Button
                onClick={() => runSearchWithToast()}
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
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

function getDefaultSearchState(searchContext: MediaSearchContext): {
  searchValue: string
  searchMode: SearchMode
} {
  const originalName = searchContext.originalName.trim()
  if (originalName) {
    return {
      searchValue: originalName,
      searchMode: 'name'
    }
  }

  const localizedName = searchContext.name.trim()
  if (localizedName) {
    return {
      searchValue: localizedName,
      searchMode: 'name'
    }
  }

  return {
    searchValue: '',
    searchMode: 'name'
  }
}

function getSearchPresetOptions(
  dataSource: string,
  searchContext: MediaSearchContext,
  t: (key: string) => string
): SearchPresetOption[] {
  const options: SearchPresetOption[] = []
  const originalName = searchContext.originalName.trim()
  if (originalName) {
    options.push({
      value: 'originalName',
      label: t('detail.overview.information.fields.originalName'),
      searchMode: 'name',
      searchValue: originalName
    })
  }

  const localizedName = searchContext.name.trim()
  if (localizedName) {
    options.push({
      value: 'name',
      label: t('detail.overview.information.fields.localizedName'),
      searchMode: 'name',
      searchValue: localizedName
    })
  }

  const storedId = searchContext.storedIds[dataSource]?.trim()
  if (storedId) {
    options.push({
      value: 'storedId',
      label: t('detail.properties.media.search.storedId'),
      searchMode: 'id',
      searchValue: storedId
    })
  }

  return options
}
