import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Switch } from '@ui/switch'
import { Slider } from '@ui/slider'
import { Button } from '@ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/hover-card'
import { useConfigState } from '~/hooks'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { ipcInvoke } from '~/utils/ipc'
import { useAttachmentStore } from '~/stores'
import { debounce } from 'lodash'
import { useCallback, useState, useEffect } from 'react'

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
  const [highlightLocalGames, setHighlightLocalGames] = useConfigState(
    'game.gameList.highlightLocalGames'
  )
  const [markLocalGames, setMarkLocalGames] = useConfigState('game.gameList.markLocalGames')

  const [customBackground, setCustomBackground] = useConfigState(
    'appearances.background.customBackground'
  )
  const [glassBlur, setGlassBlur] = useConfigState('appearances.glass.blur')
  const [glassOpacity, setGlassOpacity] = useConfigState('appearances.glass.opacity')

  async function selectBackgroundImage(): Promise<void> {
    const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    if (!filePath) return
    await ipcInvoke('set-config-background', filePath)
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
                  {t('appearances.background.customBackground')}
                </div>
                <Switch
                  checked={customBackground}
                  onCheckedChange={(checked) => setCustomBackground(checked)}
                />
              </div>
            </div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('appearances.background.image')}
                </div>

                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="outline" className={cn('')} onClick={selectBackgroundImage}>
                      {t('appearances.background.selectImage')}
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
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
