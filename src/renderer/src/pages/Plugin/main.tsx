import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/utils'
import { usePluginInfoStore } from './store'
import { PluginInstalled } from './PluginInstalled'
import { PluginBrowse } from './PluginBrowse'

export function Plugin(): React.JSX.Element {
  const { t } = useTranslation('plugin')

  // Zustand store
  const installPluginFromFile = usePluginInfoStore((state) => state.installPluginFromFile)
  const stats = usePluginInfoStore((state) => state.stats)
  const loading = usePluginInfoStore((state) => state.loading)

  return (
    <div className={cn('w-full h-full bg-transparent')}>
      <ScrollArea className={cn('w-full h-full')}>
        <div className="w-full h-full pt-[34px] pb-6 px-6 overflow-auto">
          <div className="max-w-7xl space-y-6">
            {/* 页面标题和操作按钮 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground mt-1">{t('description')}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={() => {}} disabled={loading}>
                  <span className={cn('icon-[mdi--update] w-4 h-4 mr-2')}></span>
                  {t('actions.checkUpdates')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <span className={cn('icon-[mdi--plus] w-4 h-4 mr-2')}></span>
                      {t('actions.installPlugin')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={installPluginFromFile}>
                      <span className={cn('icon-[mdi--file-upload] w-4 h-4 mr-2')}></span>
                      {t('actions.installFromFile')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* 统计信息 */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="">
                    <CardTitle className="text-sm font-medium">{t('stats.total')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="">
                    <CardTitle className="text-sm font-medium">{t('stats.enabled')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{stats.enabled}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="">
                    <CardTitle className="text-sm font-medium">{t('stats.disabled')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">{stats.disabled}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="">
                    <CardTitle className="text-sm font-medium">{t('stats.errors')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{stats.error}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 主要内容区域 */}
            <Tabs defaultValue="installed" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="installed">{t('tabs.installed')}</TabsTrigger>
                <TabsTrigger value="browse">{t('tabs.browse')}</TabsTrigger>
              </TabsList>

              <TabsContent value="installed">
                <PluginInstalled />
              </TabsContent>

              <TabsContent value="browse">
                <PluginBrowse />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
