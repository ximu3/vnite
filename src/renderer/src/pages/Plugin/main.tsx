import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { ScrollArea } from '~/components/ui/scroll-area'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { cn } from '~/utils'
import { PluginConfigDialog } from './PluginConfigDialog'
import { usePluginInfoStore } from './store'
import { PluginSearchResult } from '@appTypes/plugin'

export function Plugin(): React.JSX.Element {
  const { t } = useTranslation('plugin')

  // 使用Zustand store中的状态和方法
  const plugins = usePluginInfoStore((state) => state.plugins)
  const stats = usePluginInfoStore((state) => state.stats)
  const loading = usePluginInfoStore((state) => state.loading)
  const installPlugin = usePluginInfoStore((state) => state.installPlugin)
  const installPluginFromFile = usePluginInfoStore((state) => state.installPluginFromFile)
  const uninstallPlugin = usePluginInfoStore((state) => state.uninstallPlugin)
  const togglePlugin = usePluginInfoStore((state) => state.togglePlugin)
  const checkUpdates = usePluginInfoStore((state) => state.checkUpdates)

  // 保留本地状态
  const [searchResults, setSearchResults] = useState<PluginSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [configDialog, setConfigDialog] = useState<{
    open: boolean
    pluginId: string
    pluginName: string
  }>({
    open: false,
    pluginId: '',
    pluginName: ''
  })

  // 搜索插件
  const searchPlugins = async (keyword: string): Promise<void> => {
    if (!keyword.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const result = await ipcManager.invoke('plugin:search-plugins', keyword)
      setSearchResults(result || [])
    } catch (error) {
      console.error('搜索插件失败:', error)
      toast.error(t('messages.searchPluginsFailed'))
    } finally {
      setSearchLoading(false)
    }
  }

  // 打开插件配置对话框
  const openConfigDialog = (pluginId: string, pluginName: string): void => {
    setConfigDialog({
      open: true,
      pluginId,
      pluginName
    })
  }

  // 关闭插件配置对话框
  const closeConfigDialog = (): void => {
    setConfigDialog({
      open: false,
      pluginId: '',
      pluginName: ''
    })
  }

  return (
    <div className={cn('w-full h-full bg-transparent')}>
      <ScrollArea className={cn('w-full h-full px-6')}>
        <div className="w-full h-full pt-[34px] pb-6 overflow-auto">
          <div className="max-w-7xl space-y-6">
            {/* 页面标题和操作按钮 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{t('title') + ' - Beta'}</h1>
                <p className="text-muted-foreground mt-1">{t('description')}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={checkUpdates} disabled={loading}>
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
              <TabsList>
                <TabsTrigger value="installed">{t('tabs.installed')}</TabsTrigger>
                <TabsTrigger value="browse">{t('tabs.browse')}</TabsTrigger>
              </TabsList>

              <TabsContent value="installed" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('messages.loading')}</span>
                    </div>
                  </div>
                ) : plugins.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 mb-4 text-muted-foreground">
                      <span className={cn('icon-[mdi--puzzle-outline] w-full h-full')}></span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('emptyState.title')}</h3>
                    <p className="text-muted-foreground mb-4">{t('emptyState.description')}</p>
                    <Button onClick={installPluginFromFile}>
                      {t('actions.installFirstPlugin')}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plugins.map((plugin) => (
                      <Card
                        key={plugin.manifest.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{plugin.manifest.name}</CardTitle>
                              <CardDescription>{plugin.manifest.author}</CardDescription>
                            </div>
                            <Badge variant={plugin.status === 'enabled' ? 'default' : 'secondary'}>
                              {plugin.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {plugin.manifest.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{plugin.manifest.category}</Badge>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openConfigDialog(plugin.manifest.id, plugin.manifest.name)
                                }
                                title={t('actions.configure')}
                              >
                                <span className={cn('icon-[mdi--cog] w-4 h-4')}></span>
                              </Button>
                              <Button
                                size="sm"
                                variant={plugin.status === 'enabled' ? 'destructive' : 'default'}
                                onClick={() =>
                                  togglePlugin(plugin.manifest.id, plugin.status !== 'enabled')
                                }
                              >
                                {plugin.status === 'enabled'
                                  ? t('actions.disable')
                                  : t('actions.enable')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => uninstallPlugin(plugin.manifest.id)}
                              >
                                {t('actions.uninstall')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="browse" className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input
                    placeholder={t('search.placeholder')}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchPlugins(searchKeyword)
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={() => searchPlugins(searchKeyword)} disabled={searchLoading}>
                    {searchLoading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className={cn('icon-[mdi--magnify] w-4 h-4')}></span>
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((plugin) => (
                      <Card
                        key={plugin.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{plugin.name}</CardTitle>
                              <CardDescription>{plugin.author}</CardDescription>
                            </div>
                            <Badge variant="secondary">{plugin.version}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{plugin.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{plugin.source}</Badge>
                            <Button
                              size="sm"
                              disabled={plugin.installed}
                              onClick={() => installPlugin(plugin.id, { autoEnable: true })}
                            >
                              {plugin.installed ? t('actions.installed') : t('actions.install')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {searchKeyword && searchResults.length === 0 && !searchLoading && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 mb-4 text-muted-foreground">
                      <span className={cn('icon-[mdi--magnify] w-full h-full')}></span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('search.noResults')}</h3>
                    <p className="text-muted-foreground">{t('search.tryDifferentKeyword')}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* 插件配置对话框 */}
          <PluginConfigDialog
            pluginId={configDialog.pluginId}
            pluginName={configDialog.pluginName}
            open={configDialog.open}
            onClose={closeConfigDialog}
          />
        </div>
      </ScrollArea>
    </div>
  )
}
