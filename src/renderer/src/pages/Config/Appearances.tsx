import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/hover-card'
import { Slider } from '@ui/slider'
import { Switch } from '@ui/switch'
import { Textarea } from '@ui/textarea'
import { debounce } from 'lodash'
import { toast } from 'sonner'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { useAttachmentStore } from '~/stores'
import { useBackgroundRefreshStore } from '~/stores/config'
import { cn } from '~/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'

export function Appearances(): JSX.Element {
  const { t } = useTranslation('config')

  const [showRecentGamesInGameList, setShowRecentGamesInGameList] = useConfigState(
    'game.gameList.showRecentGames'
  )
  const [showCollapseButton, setShowCollapseButton] = useConfigState(
    'game.gameList.showCollapseButton'
  )
  const [showOriginalNameInGameHeader, setShowOriginalNameInGameHeader] = useConfigState(
    'game.gameHeader.showOriginalName'
  )
  const [showThemeSwitchInSidebar, setShowThemeSwitchInSidebar] = useConfigState(
    'appearances.sidebar.showThemeSwitcher'
  )
  const [showNSFWBlurSwitchInSidebar, setShowNSFWBlurSwitchInSidebar] = useConfigState(
    'appearances.sidebar.showNSFWBlurSwitcher'
  )
  const [highlightLocalGames, setHighlightLocalGames] = useConfigState(
    'game.gameList.highlightLocalGames'
  )
  const [markLocalGames, setMarkLocalGames] = useConfigState('game.gameList.markLocalGames')

  const [customBackgroundMode, setCustomBackgroundMode] = useConfigState(
    'appearances.background.customBackgroundMode'
  )
  const [showPlayButtonOnPoster, setShowPlayButtonOnPoster] = useConfigState(
    'appearances.showcase.showPlayButtonOnPoster'
  )
  const [glassBlur, setGlassBlur] = useConfigState('appearances.glass.blur')
  const [glassOpacity, setGlassOpacity] = useConfigState('appearances.glass.opacity')

  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()
  const [backgroundImageNames, setBackgroundImageNames] = useState<string[]>([]);
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const [reloadBackgroundPreview, setReloadBackgroundPreview] = useState(0);
  const [timerBackground, setBackgroundImageTimer] = useConfigState(
    'appearances.background.timerBackground'
  )
  const [compressionBackgroundImageStatus, setBackgroundImageCompressionStatus] = useConfigState(
    'appearances.background.compression.enabled'
  )

  const [compressionBackgroundImageFactor, setBackgroundImageCompressionFactor] = useConfigState(
    'appearances.background.compression.factor'
  )

  const triggerBackgroundRefresh = useBackgroundRefreshStore(state => state.triggerRefresh)

  async function setBackgroundImage(): Promise<void> {
    const filters = [
      { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
      { name: 'PNG', extensions: ['png'] },
      { name: 'WebP', extensions: ['webp'] },
      { name: 'GIF', extensions: ['gif'] },
      { name: 'SVG', extensions: ['svg'] },
      { name: 'TIFF', extensions: ['tiff'] },
      { name: 'AVIF', extensions: ['avif'] },
      { name: 'ICO', extensions: ['ico'] },
      {
        name: `${t('appearances.background.uploadImage.allValidFormats')}`,
        extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tiff', 'avif', 'ico']
      }
    ]

    if (customBackgroundMode === 'single') {
      const filePath: string = await window.api.utils.selectPathDialog(['openFile'], filters)
      if (!filePath) return

      const toastBackgroundImageUpload = toast.loading(`${t('appearances.background.uploadImage.notifications.uploading')}
       ${t('appearances.background.uploadImage.notifications.image')}...`)
      try {
        await window.api.theme.setConfigBackground(
          [filePath],
          compressionBackgroundImageStatus,
          compressionBackgroundImageFactor
        )
        toast.success(`${t('appearances.background.uploadImage.notifications.successSingle')}`, { id: toastBackgroundImageUpload })
        setReloadBackgroundPreview(x => x + 1)
        triggerBackgroundRefresh()
      } catch (e) {
        toast.error(`${t('appearances.background.uploadImage.notifications.failureSingle')}`, { id: toastBackgroundImageUpload })
      }
    } else if (customBackgroundMode === 'slideshow') {
      const filePaths: string[] = await window.api.utils.selectMultiplePathDialog(
        ['openFile'],
        filters
      )
      if (!filePaths || filePaths.length === 0) return

      const toastBackgroundImageUpload = toast.loading(`${t('appearances.background.uploadImage.notifications.uploading')} ${filePaths.length}
       ${t('appearances.background.uploadImage.notifications.images')}...`)
      try {
        await window.api.theme.setConfigBackground(
          filePaths,
          compressionBackgroundImageStatus,
          compressionBackgroundImageFactor
        )
        toast.success(`${t('appearances.background.uploadImage.notifications.successMultiple')}`, { id: toastBackgroundImageUpload })
        setReloadBackgroundPreview(x => x + 1)
        triggerBackgroundRefresh()
      } catch (e) {
        toast.error(`${t('appearances.background.uploadImage.notifications.failureMultiple')}`, { id: toastBackgroundImageUpload })
      }
    }
  }

  function getBackgroundImageUrls(
    imageNames: string[],
    getAttachmentInfo: (a: string, b: string, c: string) => any
  ) {
    return imageNames.map(name => {
      const info = getAttachmentInfo('config', 'media', name);
      const url = `attachment://config/media/${name}?t=${info?.timestamp ?? ''}`;
      return { name, url, error: info?.error };
    });
  }

  const [localBlurValue, setLocalBlurValue] = useState(glassBlur)
  const [localOpacityValue, setLocalOpacityValue] = useState(glassOpacity * 100)
  const [localTimerBackground, setLocalTimerBackground] = useState(timerBackground)
  const [localBackgroundImageCompressionFactor, setLocalBackgroundImageCompressionFactor] = useState(compressionBackgroundImageFactor)


  const debouncedSetBlur = useCallback(
    debounce((value: number) => {
      setGlassBlur(value)
    }, 300),
    [setGlassBlur]
  )

  const debouncedSetOpacity = useCallback(
    debounce((value: number) => {
      setGlassOpacity(value / 100)
    }, 300),
    [setGlassOpacity]
  )

  const debouncedSetBackgroundImageCompressionFactor = useCallback(
      debounce((value: number) => {
        setBackgroundImageCompressionFactor(value)
      }, 300),
      [setBackgroundImageCompressionFactor]
    )

  useEffect(() => {
    setLocalBlurValue(glassBlur)
  }, [glassBlur])

  useEffect(() => {
    setLocalOpacityValue(glassOpacity * 100)
  }, [glassOpacity])

  useEffect(() => {
    setLocalTimerBackground(timerBackground)
  }, [timerBackground])

  useEffect(() => {
    setLocalBackgroundImageCompressionFactor(compressionBackgroundImageFactor)
  }, [compressionBackgroundImageFactor])

  //Update the background previewer when new images get added
  useEffect(() => {
    window.api.theme.getConfigBackground('buffer', true)
      .then((names: string[]) => {
        setBackgroundImageNames(Array.isArray(names) ? names : []);
        setCurrentBackgroundIndex(0);
      })
      .catch(() => {
        setBackgroundImageNames([]);
        setCurrentBackgroundIndex(0);
      });
  }, [reloadBackgroundPreview]);

  const backgroundImages = getBackgroundImageUrls(backgroundImageNames, getAttachmentInfo);
  const hasImages = backgroundImages.length > 0;
  const currentBackground = hasImages ? backgroundImages[currentBackgroundIndex] : undefined;

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('appearances.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-8')}>
          {/* Background Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2 select-none')}>{t('appearances.background.title')}</div>
            {/* Background image mode selector */}
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.background.typeBackground')}
                </div>
                <Select value={customBackgroundMode} onValueChange={setCustomBackgroundMode}>
                  <SelectTrigger className={cn('w-[200px]')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className='select-none'>{t('appearances.background.source.library')}</SelectLabel>
                      <SelectItem value="default">
                        {t('appearances.background.type.default')}
                      </SelectItem>
                      <SelectLabel className='select-none'>{t('appearances.background.source.custom')}</SelectLabel>
                      <SelectItem value="single">
                        {t('appearances.background.type.single')}
                      </SelectItem>
                      <SelectItem value="slideshow">
                        {t('appearances.background.type.slideshow')}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {customBackgroundMode !== 'default' && (
              <>
              {/* Background image uploader */}
              <div className={cn('pl-2')}>
                <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                  <div className={cn('whitespace-nowrap select-none')}>
                    {t('appearances.background.selectImage')}
                  </div>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('')}
                        onClick={setBackgroundImage}
                        disabled={customBackgroundMode === 'default'}
                      >
                        {t('appearances.background.uploadImage.label')}
                      </Button>
                    </HoverCardTrigger>
                    {/* Background image previewer */}
                    <HoverCardContent className="w-80" side="left">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">
                          {t('appearances.background.currentBackground')}
                        </h4>
                        {hasImages && !currentBackground?.error ? (
                          <div className="flex flex-col items-center">
                            <div className="overflow-hidden border rounded-md">
                              {currentBackground ? (
                              <img
                                src={currentBackground.url}
                                alt={t('appearances.background.currentBackground')}
                                className="object-cover w-full h-auto"
                                onError={() => setAttachmentError('config', 'media', currentBackground.name, true)}
                              />
                            ) : null}
                            </div>
                            {backgroundImages.length > 1 && customBackgroundMode === 'slideshow' && (
                              <div className="flex justify-between w-full mt-2">
                                <button
                                  type="button"
                                  onClick={() => setCurrentBackgroundIndex(i => (i === 0 ? backgroundImages.length - 1 : i - 1))}
                                  className="px-2 py-1 text-sm"
                                >
                                  &lt;
                                </button>
                                <span>{currentBackgroundIndex + 1} / {backgroundImages.length}</span>
                                <button
                                  type="button"
                                  onClick={() => setCurrentBackgroundIndex(i => (i === backgroundImages.length - 1 ? 0 : i + 1))}
                                  className="px-2 py-1 text-sm"
                                >
                                  &gt;
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {t('appearances.background.noBackground')}
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </div>
              {/* Background timer settings */}
              <div className={cn('pl-2')}>
                <div className={cn('grid grid-cols-[1fr_auto] gap-1 items-center')}>
                  <div className={cn('whitespace-nowrap select-none')}>
                    {t('appearances.background.timer')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={localTimerBackground}
                      onChange={e => {
                        const value = Number(e.target.value)
                        setLocalTimerBackground(value)
                      }}
                      disabled={customBackgroundMode !== 'slideshow'}
                      onBlur={() => setBackgroundImageTimer(localTimerBackground)}
                      className={cn('font-mono resize-none text-center')}
                      style={{
                        width: '7rem',
                        height: '2.38rem',
                        minHeight: '2.38rem',
                        maxHeight: '2.38rem'
                      }}
                    />
                    <span
                      className={cn(
                        'text-sm select-none transition-opacity',
                        customBackgroundMode !== 'slideshow'
                          ? 'text-muted-foreground opacity-60 cursor-not-allowed'
                          : 'text-muted-foreground'
                      )}
                    >
                      {t('appearances.background.seconds')}
                    </span>
                  </div>
                </div>
              </div>
              {/* Background image compression settings */}
              <div className={cn('pl-2')}>
                <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                  {/* Background image compression toggle */}
                  <div className={cn('whitespace-nowrap select-none')}>
                    {t('appearances.background.compression.label')}
                  </div>
                  <div className={cn('justify-self-end')}>
                    <Switch
                      checked={compressionBackgroundImageStatus}
                      onCheckedChange={(checked) => setBackgroundImageCompressionStatus(checked)}
                    />
                  </div>
                  {/* Background image compression factor selector */}
                  <div className={cn('whitespace-nowrap select-none')}>
                    {t('appearances.background.compression.factor')}
                  </div>
                  <div className={cn('flex items-center gap-2 w-[250px]', 
                    !compressionBackgroundImageStatus && 'opacity-50 pointer-events-none select-none')}>
                    <Slider
                        value={[localBackgroundImageCompressionFactor]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={(value: number[]) => {
                          const newValue = value[0]
                          setLocalBackgroundImageCompressionFactor(newValue)
                          debouncedSetBackgroundImageCompressionFactor(newValue)
                        }}
                        className={cn('flex-1')}
                      />
                      <span className={cn('text-sm text-muted-foreground w-12 text-right select-none')}>
                        {localBackgroundImageCompressionFactor}%
                      </span>
                  </div>
                </div>
              </div>
              </>
              )}
          </div>

          {/* Glass Effect Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2 select-none')}>{t('appearances.glass.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.glass.blur')}
                </div>
                <div className={cn('flex items-center gap-2 w-[250px]')}>
                  <Slider
                    value={[localBlurValue]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value: number[]) => {
                      const newValue = value[0]
                      setLocalBlurValue(newValue)
                      debouncedSetBlur(newValue)
                    }}
                    className={cn('flex-1')}
                  />
                  <span className={cn('text-sm text-muted-foreground w-12 text-right select-none')}>
                    {localBlurValue}px
                  </span>
                </div>

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.glass.opacity')}
                </div>
                <div className={cn('flex items-center self-end gap-2 w-[250px]')}>
                  <Slider
                    value={[localOpacityValue]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value: number[]) => {
                      const newValue = value[0]
                      setLocalOpacityValue(newValue)
                      debouncedSetOpacity(newValue)
                    }}
                    className={cn('flex-1')}
                  />
                  <span className={cn('text-sm text-muted-foreground w-12 text-right select-none')}>
                    {localOpacityValue.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Showcase Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2 select-none')}>{t('appearances.showcase.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.showcase.showPlayButtonOnPoster')}
                </div>
                <Switch
                  checked={showPlayButtonOnPoster}
                  onCheckedChange={(checked) => setShowPlayButtonOnPoster(checked)}
                />
              </div>
            </div>
          </div>
          {/* Game list Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2 select-none')}>{t('appearances.gameList.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.gameList.showRecentGames')}
                </div>
                <Switch
                  checked={showRecentGamesInGameList}
                  onCheckedChange={(checked) => setShowRecentGamesInGameList(checked)}
                />

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.gameList.highlightLocalGames')}
                </div>
                <Switch
                  checked={highlightLocalGames}
                  onCheckedChange={(checked) => setHighlightLocalGames(checked)}
                />

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.gameList.markLocalGames')}
                </div>
                <Switch
                  checked={markLocalGames}
                  onCheckedChange={(checked) => setMarkLocalGames(checked)}
                />

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.gameList.showCollapseButton')}
                </div>
                <Switch
                  checked={showCollapseButton}
                  onCheckedChange={(checked) => setShowCollapseButton(checked)}
                />
              </div>
            </div>
          </div>

          {/* Game detail page settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2 select-none')}>{t('appearances.gameDetail.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.gameDetail.showOriginalName')}
                </div>
                <Switch
                  checked={showOriginalNameInGameHeader}
                  onCheckedChange={(checked) => setShowOriginalNameInGameHeader(checked)}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2 select-none')}>{t('appearances.sidebar.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.sidebar.showThemeSwitcher')}
                </div>
                <Switch
                  checked={showThemeSwitchInSidebar}
                  onCheckedChange={(checked) => setShowThemeSwitchInSidebar(checked)}
                />

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.sidebar.showNSFWBlurSwitcher')}
                </div>
                <Switch
                  checked={showNSFWBlurSwitchInSidebar}
                  onCheckedChange={(checked) => setShowNSFWBlurSwitchInSidebar(checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
