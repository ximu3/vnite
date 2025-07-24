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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '~/components/ui/pagination'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { cn } from '~/utils'
import { PluginPackage, PluginCategory } from '@appTypes/plugin'
import { PluginBrowseCard } from './PluginBrowseCard'

const ITEMS_PER_PAGE = 12

export function PluginBrowse(): React.JSX.Element {
  const { t } = useTranslation('plugin')

  // 本地状态
  const [plugins, setPlugins] = useState<PluginPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<PluginCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'stars' | 'updated' | 'name'>('stars')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 加载插件列表
  const fetchPlugins = async (): Promise<void> => {
    setLoading(true)

    try {
      const response = await ipcManager.invoke('plugin:search-plugins', {
        keyword,
        category,
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        sort: sortBy,
        order: sortOrder
      })

      setPlugins(response.plugins || [])
      setTotalPages(response.totalPages || 1)
    } catch (error) {
      console.error('加载插件失败:', error)
      toast.error(t('messages.loadPluginsFailed'))
      setPlugins([])
    } finally {
      setLoading(false)
    }
  }

  // 初始加载和筛选条件变更时重新加载
  useEffect(() => {
    fetchPlugins()
  }, [currentPage, category, sortBy, sortOrder])

  // 处理搜索
  const handleSearch = (): void => {
    setCurrentPage(1) // 重置到第一页
    fetchPlugins()
  }

  // 生成分页项
  const renderPaginationItems = (): React.JSX.Element[] => {
    const items = [] as React.JSX.Element[]

    // 始终显示第一页
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => currentPage !== 1 && setCurrentPage(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )
    }

    // 显示省略号
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // 计算要显示的页码范围
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)

    // 调整以确保显示适当数量的页码
    if (startPage === 2) endPage = Math.min(totalPages - 1, startPage + 2)
    if (endPage === totalPages - 1) startPage = Math.max(2, endPage - 2)

    // 渲染中间页码
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => currentPage !== i && setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // 显示末尾省略号
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // 始终显示最后一页
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => currentPage !== totalPages && setCurrentPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder={t('search.placeholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className={cn('icon-[mdi--magnify] w-4 h-4')}></span>
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as PluginCategory | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filters.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
              <SelectItem value="common">{t('filters.common')}</SelectItem>
              <SelectItem value="scraper">{t('filters.scraper')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(setValue) => setSortBy(setValue as 'stars' | 'updated' | 'name')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filters.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stars">{t('filters.stars')}</SelectItem>
              <SelectItem value="updated">{t('filters.updated')}</SelectItem>
              <SelectItem value="name">{t('filters.name')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          >
            <span
              className={cn(
                sortOrder === 'desc' ? 'icon-[mdi--sort-descending]' : 'icon-[mdi--sort-ascending]',
                'w-4 h-4'
              )}
            ></span>
          </Button>
        </div>
      </div>

      {/* 插件列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>{t('messages.loading')}</span>
          </div>
        </div>
      ) : plugins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plugins.map((plugin) => (
            <PluginBrowseCard
              key={plugin.manifest.id}
              plugin={plugin}
              setPlugin={(plugin) => {
                setPlugins((prev) =>
                  prev.map((p) => (p.manifest.id === plugin.manifest.id ? plugin : p))
                )
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 mb-4 text-muted-foreground">
            <span className={cn('icon-[mdi--package-variant-closed] w-full h-full')}></span>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('search.noPluginsFound')}</h3>
          <p className="text-muted-foreground">{t('search.tryDifferentFilters')}</p>
        </div>
      )}

      {/* 分页控件 - 使用 shadcn/ui Pagination 组件 */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {currentPage > 1 ? (
                <PaginationPrevious
                  onClick={() => setCurrentPage(currentPage - 1)}
                  aria-label={t('pagination.previous')}
                />
              ) : (
                <PaginationPrevious
                  className="pointer-events-none opacity-50"
                  aria-label={t('pagination.previous')}
                  aria-disabled="true"
                />
              )}
            </PaginationItem>

            {renderPaginationItems()}

            <PaginationItem>
              {currentPage < totalPages ? (
                <PaginationNext
                  onClick={() => setCurrentPage(currentPage + 1)}
                  aria-label={t('pagination.next')}
                />
              ) : (
                <PaginationNext
                  className="pointer-events-none opacity-50"
                  aria-label={t('pagination.next')}
                  aria-disabled="true"
                />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
