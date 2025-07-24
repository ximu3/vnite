import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/utils'
import { PluginConfigDialog } from './PluginConfigDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { PluginInfo } from '@appTypes/plugin'
import { usePluginInfoStore } from './store'

interface PluginInstalledCardProps {
  plugin: PluginInfo
}

export function PluginInstalledCard({ plugin }: PluginInstalledCardProps): React.JSX.Element {
  const { t } = useTranslation('plugin')

  // 从 store 获取状态和方法
  const updates = usePluginInfoStore((state) => state.updates)
  const togglePlugin = usePluginInfoStore((state) => state.togglePlugin)
  const installPlugin = usePluginInfoStore((state) => state.installPlugin)
  const uninstallPlugin = usePluginInfoStore((state) => state.uninstallPlugin)

  // 本地状态
  const [isInstalling, setIsInstalling] = useState(false)

  // 对话框状态
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false)

  // 更新信息
  const updateInfo = updates?.find((u) => u.pluginId === plugin.manifest.id)

  // 处理更新插件
  const handleUpdate = async (): Promise<void> => {
    if (!updateInfo) return

    setIsInstalling(true)
    try {
      await installPlugin(
        updateInfo.downloadUrl,
        { autoEnable: true, overwrite: true },
        plugin.manifest.name
      )
    } finally {
      setIsInstalling(false)
    }
  }

  // 处理卸载插件
  const handleUninstall = async (): Promise<void> => {
    await uninstallPlugin(plugin.manifest.id, plugin.manifest.name)
    setUninstallDialogOpen(false)
  }

  return (
    <>
      <Card
        className={cn(
          'overflow-hidden hover:shadow-md transition-shadow relative',
          plugin.status === 'error' ? 'border-destructive' : 'border-transparent'
        )}
      >
        <CardHeader className="-mb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg line-clamp-1">{plugin.manifest.name}</CardTitle>
              <CardDescription className="line-clamp-1">{plugin.manifest.author}</CardDescription>
            </div>
            <Badge
              variant={
                plugin.status === 'enabled'
                  ? 'default'
                  : plugin.status === 'disabled'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {t(`status.${plugin.status}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 h-[3em] break-words whitespace-normal">
            {plugin.manifest.description}
          </p>

          {plugin.status === 'error' && plugin.error && (
            <div className="bg-destructive/10 text-destructive p-2 rounded mb-4 text-xs">
              {plugin.error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">{plugin.manifest.version}</Badge>
              {plugin.manifest.category && (
                <Badge variant="outline">{t(`categories.${plugin.manifest.category}`)}</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfigDialogOpen(true)}
                title={t('actions.configure')}
                className="h-8 w-8 p-0"
              >
                <span className={cn('icon-[mdi--cog] w-4 h-4')}></span>
              </Button>
              {updateInfo && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleUpdate}
                  disabled={isInstalling}
                  className="h-8 relative overflow-hidden"
                >
                  {isInstalling ? (
                    <>
                      <span className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      {t('actions.updating')}
                    </>
                  ) : (
                    t('actions.update')
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant={plugin.status === 'enabled' ? 'secondary' : 'default'}
                onClick={() => togglePlugin(plugin.manifest.id, plugin.status !== 'enabled')}
                disabled={plugin.status === 'error' || isInstalling}
                className="h-8"
              >
                {plugin.status === 'enabled' ? t('actions.disable') : t('actions.enable')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUninstallDialogOpen(true)}
                disabled={isInstalling}
                className="h-8 w-8 p-0"
              >
                <span className={cn('icon-[mdi--trash] w-4 h-4')}></span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置对话框 */}
      <PluginConfigDialog
        pluginId={plugin.manifest.id}
        pluginName={plugin.manifest.name}
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
      />

      {/* 卸载确认对话框 */}
      <AlertDialog
        open={uninstallDialogOpen}
        onOpenChange={(open) => !open && setUninstallDialogOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.uninstall.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.uninstall.description', { name: plugin.manifest.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUninstall}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('actions.uninstall')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
