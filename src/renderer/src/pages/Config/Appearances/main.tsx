import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfigItem } from '~/components/form/ConfigItem'
import { ConfigItemPure } from '~/components/form/ConfigItemPure'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card'
import { useTranslation } from 'react-i18next'
import { useAttachmentStore } from '~/stores'
import { cn } from '~/utils'
import { ipcManager } from '~/app/ipc'
import { useState } from 'react'
import { FontSettingsDialog } from './FontSettingsDialog'
import { useTheme } from '~/components/ThemeProvider'
import { useLightStore } from '~/pages/Light'

export function Appearances(): React.JSX.Element {
  const { t } = useTranslation('config')
  const { isDark } = useTheme()
  const refresh = useLightStore((state) => state.refresh)

  const [fontDialogOpen, setFontDialogOpen] = useState(false)

  async function selectBackgroundImage(): Promise<void> {
    const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
    if (!filePath) return
    await ipcManager.invoke('db:set-config-background', filePath, isDark ? 'dark' : 'light')
    refresh()
  }

  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()

  const backgroundInfo = getAttachmentInfo(
    'config',
    'media',
    `background-${isDark ? 'dark' : 'light'}.webp`
  )
  const backgroundUrl = `attachment://config/media/background-${isDark ? 'dark' : 'light'}.webp?t=${backgroundInfo?.timestamp}`

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
            <div className={cn('')}>
              <ConfigItem
                hookType="config"
                path="appearances.background.customBackground"
                title={t('appearances.background.customBackground')}
                description={t('appearances.background.customBackgroundDescription')}
                controlType="switch"
              />
            </div>
            <div className={cn('')}>
              <ConfigItemPure
                title={t('appearances.background.image')}
                description={t('appearances.background.imageDescription')}
              >
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="outline" onClick={selectBackgroundImage}>
                      {t('appearances.background.selectImage')}
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" side="left" sideOffset={8}>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">
                        {t('appearances.background.currentBackground')}
                      </h4>
                      {!backgroundInfo.error ? (
                        <div className="overflow-hidden rounded-md">
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
              </ConfigItemPure>
            </div>
          </div>

          {/* Glass Effect Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.glass.title')}</div>
            <div className={cn(' space-y-4')}>
              <ConfigItem
                hookType="config"
                path={isDark ? 'appearances.glass.dark.blur' : 'appearances.glass.light.blur'}
                title={t('appearances.glass.blur')}
                description={t('appearances.glass.blurDescription')}
                controlType="slider"
                min={0}
                max={150}
                step={1}
                formatValue={(value) => `${value}px`}
                debounceMs={300}
              />

              <ConfigItem
                hookType="config"
                path={isDark ? 'appearances.glass.dark.opacity' : 'appearances.glass.light.opacity'}
                title={t('appearances.glass.opacity')}
                description={t('appearances.glass.opacityDescription')}
                controlType="slider"
                min={0}
                max={1}
                step={0.01}
                formatValue={(value) => `${Math.round(value * 100)}%`}
                debounceMs={300}
              />
            </div>
          </div>
          {/* Font Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.font.title')}</div>
            <div className={cn('')}>
              <ConfigItemPure
                title={t('appearances.font.manageFont')}
                description={t('appearances.font.manageFontDescription')}
              >
                <Button
                  variant="outline"
                  onClick={() => setFontDialogOpen(true)}
                  className="w-full justify-between font-normal"
                >
                  {t('appearances.font.manage')}
                </Button>
              </ConfigItemPure>
            </div>
            <FontSettingsDialog isOpen={fontDialogOpen} onOpenChange={setFontDialogOpen} />
          </div>
          {/* Showcase Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.showcase.title')}</div>
            <div className={cn('')}>
              <ConfigItem
                hookType="config"
                path="appearances.showcase.showPlayButtonOnPoster"
                title={t('appearances.showcase.showPlayButtonOnPoster')}
                description={t('appearances.showcase.showPlayButtonOnPosterDescription')}
                controlType="switch"
              />
            </div>
          </div>
          {/* Game List Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.gameList.title')}</div>
            <div className={cn(' space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.gameList.showRecentGames"
                title={t('appearances.gameList.showRecentGames')}
                description={t('appearances.gameList.showRecentGamesDescription')}
                controlType="switch"
              />

              <ConfigItem
                hookType="config"
                path="game.gameList.highlightLocalGames"
                title={t('appearances.gameList.highlightLocalGames')}
                description={t('appearances.gameList.highlightLocalGamesDescription')}
                controlType="switch"
              />

              <ConfigItem
                hookType="config"
                path="game.gameList.markLocalGames"
                title={t('appearances.gameList.markLocalGames')}
                description={t('appearances.gameList.markLocalGamesDescription')}
                controlType="switch"
              />
            </div>
          </div>

          {/* Game detail page settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.gameDetail.title')}</div>
            <div className={cn('')}>
              <ConfigItem
                hookType="config"
                path="game.gameHeader.showOriginalName"
                title={t('appearances.gameDetail.showOriginalName')}
                description={t('appearances.gameDetail.showOriginalNameDescription')}
                controlType="switch"
              />
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.sidebar.title')}</div>
            <div className={cn(' space-y-4')}>
              <ConfigItem
                hookType="config"
                path="appearances.sidebar.showThemeSwitcher"
                title={t('appearances.sidebar.showThemeSwitcher')}
                description={t('appearances.sidebar.showThemeSwitcherDescription')}
                controlType="switch"
              />

              <ConfigItem
                hookType="config"
                path="appearances.sidebar.showNSFWBlurSwitcher"
                title={t('appearances.sidebar.showNSFWBlurSwitcher')}
                description={t('appearances.sidebar.showNSFWBlurSwitcherDescription')}
                controlType="switch"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
