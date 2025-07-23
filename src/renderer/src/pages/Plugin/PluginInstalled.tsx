import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { toast } from 'sonner'
import { cn } from '~/utils'
import { PluginConfigDialog } from './PluginConfigDialog'
import { usePluginInfoStore } from './store'
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

export function PluginInstalled(): React.JSX.Element {
  const { t } = useTranslation('plugin')

  // Zustand store状态
  const plugins = usePluginInfoStore((state) => state.plugins)
  const loading = usePluginInfoStore((state) => state.loading)
  const installPluginFromFile = usePluginInfoStore((state) => state.installPluginFromFile)
  const uninstallPlugin = usePluginInfoStore((state) => state.uninstallPlugin)
  const togglePlugin = usePluginInfoStore((state) => state.togglePlugin)

  // 本地状态 - 搜索和筛选
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filteredPlugins, setFilteredPlugins] = useState<PluginInfo[]>([])

  // 对话框状态
  const [configDialog, setConfigDialog] = useState<{
    open: boolean
    pluginId: string
    pluginName: string
  }>({
    open: false,
    pluginId: '',
    pluginName: ''
  })

  const [uninstallDialog, setUninstallDialog] = useState<{
    open: boolean
    pluginId: string
    pluginName: string
  }>({
    open: false,
    pluginId: '',
    pluginName: ''
  })

  // 筛选和排序插件
  useEffect(() => {
    if (loading || !plugins.length) {
      setFilteredPlugins([])
      return
    }

    let results = [...plugins]

    // 关键词过滤
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      results = results.filter(
        (plugin) =>
          plugin.manifest.name.toLowerCase().includes(lowerKeyword) ||
          plugin.manifest.description.toLowerCase().includes(lowerKeyword) ||
          plugin.manifest.author?.toLowerCase().includes(lowerKeyword) ||
          plugin.manifest.keywords?.some((k) => k.toLowerCase().includes(lowerKeyword))
      )
    }

    // 分类过滤
    if (category !== 'all') {
      results = results.filter((plugin) => plugin.manifest.category === category)
    }

    // 排序
    results.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.manifest.name.localeCompare(b.manifest.name)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'category':
          comparison = (a.manifest.category || '').localeCompare(b.manifest.category || '')
          break
        case 'author':
          comparison = (a.manifest.author || '').localeCompare(b.manifest.author || '')
          break
        case 'date':
          comparison = new Date(a.installTime).getTime() - new Date(b.installTime).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredPlugins(results)
  }, [plugins, keyword, category, sortBy, sortOrder, loading])

  // 打开配置对话框
  const openConfigDialog = (pluginId: string, pluginName: string): void => {
    setConfigDialog({
      open: true,
      pluginId,
      pluginName
    })
  }

  // 关闭配置对话框
  const closeConfigDialog = (): void => {
    setConfigDialog({
      open: false,
      pluginId: '',
      pluginName: ''
    })
  }

  // 打开卸载确认对话框
  const openUninstallDialog = (pluginId: string, pluginName: string): void => {
    setUninstallDialog({
      open: true,
      pluginId,
      pluginName
    })
  }

  // 处理卸载
  const handleUninstall = async (): Promise<void> => {
    try {
      await uninstallPlugin(uninstallDialog.pluginId)
      toast.success(t('messages.uninstallSuccess', { name: uninstallDialog.pluginName }))
    } catch (_error) {
      toast.error(t('messages.uninstallFailed', { name: uninstallDialog.pluginName }))
    } finally {
      setUninstallDialog({ open: false, pluginId: '', pluginName: '' })
    }
  }

  return (
    <div>
      {/* 搜索和筛选工具栏 */}
      {!loading && plugins.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder={t('search.localPluginsPlaceholder')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filters.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
                <SelectItem value="common">{t('filters.common')}</SelectItem>
                <SelectItem value="scraper">{t('filters.scraper')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filters.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t('filters.name')}</SelectItem>
                <SelectItem value="status">{t('filters.status')}</SelectItem>
                <SelectItem value="category">{t('filters.category')}</SelectItem>
                <SelectItem value="author">{t('filters.author')}</SelectItem>
                <SelectItem value="date">{t('filters.date')}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              <span
                className={cn(
                  sortOrder === 'desc'
                    ? 'icon-[mdi--sort-descending]'
                    : 'icon-[mdi--sort-ascending]',
                  'w-4 h-4'
                )}
              ></span>
            </Button>
          </div>
        </div>
      )}

      {/* 显示结果数 */}
      {!loading && keyword && (
        <div className="text-sm text-muted-foreground mb-4">
          {filteredPlugins.length > 0
            ? t('search.localResults', { count: filteredPlugins.length })
            : t('search.noLocalResults')}
        </div>
      )}

      {/* 插件列表 */}
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
          <Button onClick={installPluginFromFile}>{t('actions.installFirstPlugin')}</Button>
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 mb-4 text-muted-foreground">
            <span className={cn('icon-[mdi--filter-off] w-full h-full')}></span>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('search.noLocalMatchesTitle')}</h3>
          <p className="text-muted-foreground">{t('search.noLocalMatchesDescription')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map((plugin) => (
            <Card
              key={plugin.manifest.id}
              className={cn(
                'overflow-hidden hover:shadow-md transition-shadow',
                plugin.status === 'error' ? 'border-destructive' : 'border-transparent'
              )}
            >
              <CardHeader className="-mb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg line-clamp-1">{plugin.manifest.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {plugin.manifest.author}
                    </CardDescription>
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
                      onClick={() => openConfigDialog(plugin.manifest.id, plugin.manifest.name)}
                      title={t('actions.configure')}
                      className="h-8 w-8 p-0"
                    >
                      <span className={cn('icon-[mdi--cog] w-4 h-4')}></span>
                    </Button>
                    <Button
                      size="sm"
                      variant={plugin.status === 'enabled' ? 'secondary' : 'default'}
                      onClick={() => togglePlugin(plugin.manifest.id, plugin.status !== 'enabled')}
                      disabled={plugin.status === 'error'}
                      className="h-8"
                    >
                      {plugin.status === 'enabled' ? t('actions.disable') : t('actions.enable')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openUninstallDialog(plugin.manifest.id, plugin.manifest.name)}
                      className="h-8 w-8 p-0"
                    >
                      <span className={cn('icon-[mdi--trash] w-4 h-4')}></span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 配置对话框 */}
      <PluginConfigDialog
        pluginId={configDialog.pluginId}
        pluginName={configDialog.pluginName}
        open={configDialog.open}
        onClose={closeConfigDialog}
      />

      {/* 卸载确认对话框 */}
      <AlertDialog
        open={uninstallDialog.open}
        onOpenChange={(open) =>
          !open && setUninstallDialog({ open: false, pluginId: '', pluginName: '' })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.uninstall.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.uninstall.description', { name: uninstallDialog.pluginName })}
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
    </div>
  )
}
