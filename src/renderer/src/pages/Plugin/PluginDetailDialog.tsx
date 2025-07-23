import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '~/utils'
import { PluginPackage } from '@appTypes/plugin'
import { usePluginInfoStore } from './store'
import { MarkdownRenderer } from '~/components/ui/markdown-renderer'

interface PluginDetailDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  plugin: PluginPackage | null
}

export function PluginDetailDialog({
  isOpen,
  setIsOpen,
  plugin
}: PluginDetailDialogProps): React.JSX.Element {
  const { t } = useTranslation('plugin')
  const installPlugin = usePluginInfoStore((state) => state.installPlugin)

  // 处理安装
  const handleInstall = async (): Promise<void> => {
    if (!plugin) return

    try {
      await installPlugin(plugin.downloadUrl, {
        autoEnable: true
      })
      setIsOpen(false)
    } catch (error) {
      console.error('安装失败:', error)
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return t('search.unknownDate')
    return t('utils:format.niceDate', {
      date: new Date(dateStr)
    })
  }

  if (!plugin) return <></>

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{plugin.manifest.name}</DialogTitle>
            <DialogClose />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-full">
          {/* 左侧：README */}
          <div className="md:col-span-3 h-[70vh] border-r pr-5">
            <ScrollArea className="rounded-md h-full">
              {plugin.readme ? <MarkdownRenderer content={plugin.readme} /> : t('details.noReadme')}
            </ScrollArea>
          </div>

          {/* 右侧：详细信息 */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('details.author')}
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <span className={cn('icon-[mdi--account] w-4 h-4')}></span>
                  <span>{plugin.manifest.author || plugin.owner}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('details.description')}
                </label>
                <p className="mt-1 line-clamp-5 break-words whitespace-normal">
                  {plugin.manifest.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('details.category')}
                  </label>
                  <div className="mt-1">{t(`categories.${plugin.manifest.category}`)}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('details.version')}
                  </label>
                  <div className="mt-1">{plugin.manifest.version}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('details.created')}
                  </label>
                  <div className="mt-1">
                    {plugin.createdAt ? formatDate(plugin.createdAt) : t('search.unknownDate')}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('details.updated')}
                  </label>
                  <div className="mt-1">
                    {plugin.updatedAt ? formatDate(plugin.updatedAt) : t('search.unknownDate')}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('details.stars')}
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={cn('icon-[mdi--star] w-4 h-4 text-yellow-500')}></span>
                    <span>{plugin.stars}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2 mt-auto">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(plugin.repoUrl, '_blank')}
              >
                <span className={cn('icon-[mdi--github] w-4 h-4 mr-2')}></span>
                {t('details.viewOnGithub')}
              </Button>

              {plugin.homepageUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(plugin.homepageUrl, '_blank')}
                >
                  <span className={cn('icon-[mdi--home] w-4 h-4 mr-2')}></span>
                  {t('details.visitHomepage')}
                </Button>
              )}

              {!plugin.installed ? (
                <Button className="w-full" onClick={handleInstall}>
                  <span className={cn('icon-[mdi--download] w-4 h-4 mr-2')}></span>
                  {t('actions.install')}
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  <span className={cn('icon-[mdi--check] w-4 h-4 mr-2')}></span>
                  {t('actions.installed')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
