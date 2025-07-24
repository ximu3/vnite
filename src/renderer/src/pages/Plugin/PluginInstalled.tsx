import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { cn } from '~/utils'
import { usePluginInfoStore } from './store'
import { PluginInfo } from '@appTypes/plugin'
import { PluginInstalledCard } from './PluginInstalledCard'

export function PluginInstalled(): React.JSX.Element {
  const { t } = useTranslation('plugin')

  // Zustand store状态
  const plugins = usePluginInfoStore((state) => state.plugins)
  const loading = usePluginInfoStore((state) => state.loading)
  const installPluginFromFile = usePluginInfoStore((state) => state.installPluginFromFile)

  // 本地状态 - 搜索和筛选
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filteredPlugins, setFilteredPlugins] = useState<PluginInfo[]>([])

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
            <PluginInstalledCard key={plugin.manifest.id} plugin={plugin} />
          ))}
        </div>
      )}
    </div>
  )
}
