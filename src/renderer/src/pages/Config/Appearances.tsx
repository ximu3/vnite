import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/hover-card'
import { Slider } from '@ui/slider'
import { Switch } from '@ui/switch'
import { debounce } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { useAttachmentStore } from '~/stores'
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

  async function selectBackgroundImage(): Promise<void> {
    const filters = [
      { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
      { name: 'PNG Image', extensions: ['png'] },
      { name: 'WebP Image', extensions: ['webp'] },
      { name: 'GIF image', extensions: ['gif'] },
      { name: 'SVG image', extensions: ['svg'] },
      { name: 'TIFF image', extensions: ['tiff'] },
      { name: 'AVIF Image', extensions: ['avif'] },
      { name: 'ICO Image', extensions: ['ico'] },
      {
        name: 'All Images',
        extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tiff', 'avif', 'ico']
      }
    ]
    const filePath: string = await window.api.utils.selectPathDialog(['openFile'], filters)
    if (!filePath) return
    await window.api.theme.setConfigBackground(filePath)
  }

  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()

  const backgroundInfo = getAttachmentInfo('config', 'media', 'background.webp')
  const backgroundUrl = `attachment://config/media/background.webp?t=${backgroundInfo?.timestamp}`

  const [localBlurValue, setLocalBlurValue] = useState(glassBlur)
  const [localOpacityValue, setLocalOpacityValue] = useState(glassOpacity * 100)

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

  useEffect(() => {
    setLocalBlurValue(glassBlur)
  }, [glassBlur])

  useEffect(() => {
    setLocalOpacityValue(glassOpacity * 100)
  }, [glassOpacity])

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
            <div className={cn('border-b pb-2')}>{t('appearances.background.title')}</div>
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
                      <SelectLabel>{t('appearances.background.type.label')}</SelectLabel>
                      <SelectItem value="default">
                        {t('appearances.background.type.default')}
                      </SelectItem>
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
                      onClick={selectBackgroundImage}
                      disabled={customBackgroundMode === 'default'}
                    >
                      {t('appearances.background.uploadImage.label')}
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" side="left">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">
                        {t('appearances.background.currentBackground')}
                      </h4>
                      {!backgroundInfo.error ? (
                        <div className="overflow-hidden border rounded-md">
                          <img
                            src={backgroundUrl}
                            alt={t('appearances.background.currentBackground')}
                            className="object-cover w-full h-auto"
                            onError={() => {
                              setAttachmentError('config', 'media', 'background.webp', true)
                            }}
                          />
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
          </div>

          {/* Glass Effect Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.glass.title')}</div>
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
                  <span className={cn('text-sm text-muted-foreground w-12 text-right')}>
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
                  <span className={cn('text-sm text-muted-foreground w-12 text-right')}>
                    {localOpacityValue.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Showcase Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.showcase.title')}</div>
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
          {/* Game List Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.gameList.title')}</div>
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
            <div className={cn('border-b pb-2')}>{t('appearances.gameDetail.title')}</div>
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
            <div className={cn('border-b pb-2')}>{t('appearances.sidebar.title')}</div>
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
