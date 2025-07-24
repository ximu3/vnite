import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/utils'
import { PluginPackage } from '@appTypes/plugin'
import { PluginDetailDialog } from './PluginDetailDialog'
import { usePluginInfoStore } from './store'

interface PluginBrowseCardProps {
  plugin: PluginPackage
  setPlugin: (plugin: PluginPackage) => void
}

export function PluginBrowseCard({ plugin, setPlugin }: PluginBrowseCardProps): React.JSX.Element {
  const { t } = useTranslation('plugin')
  // Zustand store
  const installPlugin = usePluginInfoStore((state) => state.installPlugin)

  const [isInstalling, setIsInstalling] = useState(false)

  // 对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // 格式化日期
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString()
  }

  // 阻止安装按钮点击事件冒泡到卡片
  const handleInstallClick = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation()
    try {
      setIsInstalling(true)
      await installPlugin(
        plugin.downloadUrl,
        {
          autoEnable: true
        },
        plugin.manifest.name
      )
      setPlugin({ ...plugin, installed: true }) // 更新插件状态
    } catch (error) {
      console.error('安装插件失败:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  // 打开插件详情对话框
  const handleCardClick = (): void => {
    setDetailDialogOpen(true)
  }

  return (
    <>
      <Card
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader className="-mb-3">
          <div className="flex items-start justify-between">
            <div className="flex justify-between">
              <div>
                <CardTitle className="text-lg line-clamp-1 break-words whitespace-normal">
                  {plugin.manifest.name}
                </CardTitle>
                <CardDescription className="line-clamp-1">
                  <span className="flex items-center gap-1">
                    <span className={cn('icon-[mdi--account] w-3 h-3')}></span>
                    {plugin.manifest.author || plugin.owner}
                  </span>
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">{t(`categories.${plugin.manifest.category}`)}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 h-[3em] break-words whitespace-normal">
            {plugin.manifest.description}
          </p>

          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">{plugin.manifest.version}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <span className={cn('icon-[mdi--star] w-3 h-3')}></span>
                {plugin.stars}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <span className={cn('icon-[mdi--calendar] w-3 h-3')}></span>
                {plugin.updatedAt
                  ? formatDate(new Date(plugin.updatedAt))
                  : t('search.unknownDate')}
              </Badge>
            </div>
            {!plugin.installed ? (
              <Button size="sm" onClick={handleInstallClick} disabled={isInstalling}>
                {isInstalling ? (
                  <>
                    <span className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    {t('actions.installing')}
                  </>
                ) : (
                  t('actions.install')
                )}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" disabled>
                {t('actions.installed')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 插件详情对话框 - 放置在卡片组件内 */}
      <PluginDetailDialog
        isOpen={detailDialogOpen}
        setIsOpen={setDetailDialogOpen}
        isInstalling={isInstalling}
        setIsInstalling={setIsInstalling}
        plugin={plugin}
        setPlugin={setPlugin}
      />
    </>
  )
}
