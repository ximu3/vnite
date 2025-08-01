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
import { cn } from '~/utils'
import { PluginPackage } from '@appTypes/plugin'
import { usePluginInfoStore } from './store'
import { MarkdownRenderer } from '~/components/ui/markdown-renderer'

interface PluginDetailDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isInstalling: boolean
  setIsInstalling: (installing: boolean) => void
  plugin: PluginPackage | null
  setPlugin: (plugin: PluginPackage) => void
}

export function PluginDetailDialog({
  isOpen,
  setIsOpen,
  isInstalling,
  setIsInstalling,
  plugin,
  setPlugin
}: PluginDetailDialogProps): React.JSX.Element {
  const { t } = useTranslation('plugin')
  const installPlugin = usePluginInfoStore((state) => state.installPlugin)

  const handleInstall = async (): Promise<void> => {
    if (!plugin) return

    try {
      setIsInstalling(true)
      await installPlugin(
        plugin.downloadUrl,
        {
          autoEnable: true
        },
        plugin.manifest.name
      )
      setPlugin({ ...plugin, installed: true })
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to install plugin:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return t('search.unknownDate')
    return t('utils:format.niceDate', {
      date: new Date(dateStr)
    })
  }

  if (!plugin) return <></>

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[70vw]">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{plugin.manifest.name}</DialogTitle>
            <DialogClose />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-[60vh] lg:h-[70vh] pr-2 pb-1 scrollbar-base overflow-auto">
          {/* Left：README */}
          <div className="md:col-span-3 border-r pr-5">
            {plugin.readme ? <MarkdownRenderer content={plugin.readme} /> : t('details.noReadme')}
          </div>

          {/* Right：Details */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Basic Information */}
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
                    <span className={cn('icon-[mdi--star] w-4 h-4 text-primary')}></span>
                    <span>{plugin.stars}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
                <Button className="w-full" onClick={handleInstall} disabled={isInstalling}>
                  {isInstalling ? (
                    <>
                      <span className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      {t('actions.installing')}
                    </>
                  ) : (
                    <>
                      <span className={cn('icon-[mdi--download] w-4 h-4 mr-2')}></span>
                      {t('actions.install')}
                    </>
                  )}
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
