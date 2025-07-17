import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfigItem } from '~/components/form/ConfigItem'
import { ConfigItemPure } from '~/components/form/ConfigItemPure'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card'
import { useTranslation } from 'react-i18next'
import { useAttachmentStore } from '~/stores'
import { cn } from '~/utils'
import { ipcManager } from '~/app/ipc'

export function Appearances(): React.JSX.Element {
  const { t } = useTranslation('config')

  async function selectBackgroundImage(): Promise<void> {
    const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
    if (!filePath) return
    await ipcManager.invoke('db:set-config-background', filePath)
  }

  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()

  const backgroundInfo = getAttachmentInfo('config', 'media', 'background.webp')
  const backgroundUrl = `attachment://config/media/background.webp?t=${backgroundInfo?.timestamp}`

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
                description="启用自定义背景图片"
                controlType="switch"
              />
            </div>
            <div className={cn('')}>
              <ConfigItemPure
                title={t('appearances.background.image')}
                description="选择自定义背景图片"
              >
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="outline" onClick={selectBackgroundImage}>
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
              </ConfigItemPure>
            </div>
          </div>

          {/* Glass Effect Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.glass.title')}</div>
            <div className={cn(' space-y-4')}>
              <ConfigItem
                hookType="config"
                path="appearances.glass.blur"
                title={t('appearances.glass.blur')}
                description="玻璃效果模糊程度"
                controlType="slider"
                min={0}
                max={130}
                step={1}
                formatValue={(value) => `${value}px`}
                debounceMs={300}
              />

              <ConfigItem
                hookType="config"
                path="appearances.glass.opacity"
                title={t('appearances.glass.opacity')}
                description="玻璃效果透明度"
                controlType="slider"
                min={0}
                max={1}
                step={0.01}
                formatValue={(value) => `${Math.round(value * 100)}%`}
                debounceMs={300}
              />
            </div>
          </div>
          {/* Showcase Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('appearances.showcase.title')}</div>
            <div className={cn('')}>
              <ConfigItem
                hookType="config"
                path="appearances.showcase.showPlayButtonOnPoster"
                title={t('appearances.showcase.showPlayButtonOnPoster')}
                description="在海报上显示播放按钮"
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
                description="在游戏列表中显示最近游戏"
                controlType="switch"
              />

              <ConfigItem
                hookType="config"
                path="game.gameList.highlightLocalGames"
                title={t('appearances.gameList.highlightLocalGames')}
                description="高亮显示本地已安装的游戏"
                controlType="switch"
              />

              <ConfigItem
                hookType="config"
                path="game.gameList.markLocalGames"
                title={t('appearances.gameList.markLocalGames')}
                description="标记本地已安装的游戏"
                controlType="switch"
              />

              <ConfigItem
                hookType="config"
                path="game.gameList.showCollapseButton"
                title={t('appearances.gameList.showCollapseButton')}
                description="显示折叠按钮"
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
                description="在游戏详情页显示原始名称"
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
                description="在侧边栏显示主题切换器"
                controlType="switch"
              />

              <ConfigItem
                hookType="config"
                path="appearances.sidebar.showNSFWBlurSwitcher"
                title={t('appearances.sidebar.showNSFWBlurSwitcher')}
                description="在侧边栏显示NSFW模糊切换器"
                controlType="switch"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
