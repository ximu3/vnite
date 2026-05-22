import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Database,
  ExternalLink,
  FileStack,
  HardDrive,
  ImageIcon,
  RefreshCw
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { DatabaseAttachmentCategory, GameAttachmentEntry } from '@appTypes/models'
import { generateUUID } from '@appUtils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@ui/alert-dialog'
import { Badge } from '@ui/badge'
import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@ui/context-menu'
import { GameImage } from '@ui/game-image'
import { ScrollArea } from '@ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { usePositionButtonStore } from '~/components/Librarybar/PositionButton'
import { ScrollToTopButton } from '~/components/Showcase/ScrollToTopButton'
import { ImageViewerDialog } from '~/components/dialog/ImageViewerDialog'
import { cn, formatStorageSize, scrollToElement } from '~/utils'
import { DatabaseAnalysisMetricCard } from './MetricCard'
import {
  DatabaseAnalysisErrorCard,
  DatabaseAnalysisLoadingCard,
  DatabaseAnalysisRefreshFailedAlert
} from './StateViews'
import { useDatabaseAnalysisStore } from './store'
import { resolveLoadableViewState } from './utils'

const ATTACHMENT_CATEGORY_ORDER: DatabaseAttachmentCategory[] = [
  'memory',
  'save',
  'descriptionImage',
  'media',
  'other'
]

type DetailFilter = 'all' | DatabaseAttachmentCategory

function getCategoryLabel(
  category: DatabaseAttachmentCategory,
  t: (key: string) => string
): string {
  return t(`categories.${category}`)
}

export function DatabaseAnalysisGameDetail({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('databaseAnalysis')
  const navigate = useNavigate()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const detail = useDatabaseAnalysisStore((state) => state.detailsByGameId[gameId])
  const ensureGameDetail = useDatabaseAnalysisStore((state) => state.ensureGameDetail)
  const refreshGameDetail = useDatabaseAnalysisStore((state) => state.refreshGameDetail)
  const invalidateOverview = useDatabaseAnalysisStore((state) => state.invalidateOverview)
  const [filter, setFilter] = useState<DetailFilter>('all')
  const [imageViewer, setImageViewer] = useState<{ open: boolean; path: string | null }>({
    open: false,
    path: null
  })
  const [deleteTarget, setDeleteTarget] = useState<GameAttachmentEntry | null>(null)
  const setLazyloadMark = usePositionButtonStore((state) => state.setLazyloadMark)

  useEffect(() => {
    void ensureGameDetail(gameId)
  }, [ensureGameDetail, gameId])

  const viewState = resolveLoadableViewState(detail)
  const report = viewState.kind === 'ready' ? viewState.data : null
  const isDetailBusy = detail?.status === 'loading' || detail?.isRefreshing

  const filteredAttachments = useMemo(() => {
    if (!report) return []
    if (filter === 'all') return report.attachmentEntries
    return report.attachmentEntries.filter((entry) => entry.category === filter)
  }, [filter, report])

  const handleRefresh = async (): Promise<void> => {
    try {
      await refreshGameDetail(gameId)
    } catch {
      // The stale state banner already explains the refresh failure.
    }
  }

  const handleViewAttachment = async (entry: GameAttachmentEntry): Promise<void> => {
    try {
      const tempPath = await ipcManager.invoke(
        'db:get-attachment-temp-file',
        gameId,
        entry.attachmentId
      )
      if (!tempPath) {
        toast.error(t('detail.imageActions.viewError', { error: 'File not found' }))
        return
      }
      setImageViewer({ open: true, path: tempPath as string })
    } catch (error) {
      toast.error(
        t('detail.imageActions.viewError', {
          error: error instanceof Error ? error.message : String(error)
        })
      )
    }
  }

  const handleDeleteAttachment = async (): Promise<void> => {
    if (!deleteTarget) return
    try {
      await ipcManager.invoke('db:remove-game-attachment', gameId, deleteTarget.attachmentId)
      toast.success(t('detail.imageActions.deleteSuccess'))
      setDeleteTarget(null)
      invalidateOverview()
      await refreshGameDetail(gameId)
    } catch (error) {
      toast.error(
        t('detail.imageActions.deleteError', {
          error: error instanceof Error ? error.message : String(error)
        })
      )
    }
  }

  const isImageAttachment = (entry: GameAttachmentEntry): boolean => {
    return entry.contentType?.startsWith('image/') ?? false
  }

  const pageContent = (() => {
    switch (viewState.kind) {
      case 'loading':
        return <DatabaseAnalysisLoadingCard message={t('messages.loading')} />
      case 'error':
        return (
          <DatabaseAnalysisErrorCard
            error={viewState.error}
            retryLabel={t('actions.retry')}
            onRetry={() => void handleRefresh()}
          />
        )
      case 'ready': {
        const report = viewState.data

        return (
          <>
            <Card>
              <CardContent className="flex flex-wrap items-center gap-4 pt-6">
                <GameImage
                  gameId={gameId}
                  type="cover"
                  className="h-28 w-20 rounded-lg object-cover shadow-sm"
                  fallback={
                    <div className="flex h-28 w-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  }
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex gap-2 mb-2">
                    <div className="text-xl font-semibold items-center">{report.name}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigate({ to: `/library/games/${gameId}/all` })
                        setTimeout(() => {
                          scrollToElement({
                            selector: `[data-game-id="${gameId}"][data-group-id="all"]`
                          })
                          setTimeout(() => {
                            setLazyloadMark(generateUUID())
                          }, 100)
                        }, 50)
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {t('detail.hero.total')}:{' '}
                      {formatStorageSize(report.summary.totalLogicalPayloadBytes)}
                    </Badge>
                    <Badge variant="outline">
                      {t('detail.hero.attachments')}:{' '}
                      {report.summary.attachmentCount.toLocaleString()}
                    </Badge>
                    <Badge variant="outline">
                      {t('detail.hero.documents')}:{' '}
                      {formatStorageSize(report.summary.estimatedDocBytes)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <DatabaseAnalysisMetricCard
                title={t('summary.logicalPayloadBytes')}
                value={formatStorageSize(report.summary.totalLogicalPayloadBytes)}
                hint={t('detail.summary.totalHint')}
                icon={<HardDrive className="w-4 h-4" />}
              />
              <DatabaseAnalysisMetricCard
                title={t('summary.documents')}
                value={formatStorageSize(report.summary.estimatedDocBytes)}
                hint={t('detail.summary.documentsHint')}
                icon={<Database className="w-4 h-4" />}
              />
              <DatabaseAnalysisMetricCard
                title={t('summary.attachmentBytes')}
                value={formatStorageSize(report.summary.attachmentBytes)}
                hint={t('detail.summary.attachmentsHint')}
                icon={<ImageIcon className="w-4 h-4" />}
              />
              <DatabaseAnalysisMetricCard
                title={t('summary.attachmentCount')}
                value={report.summary.attachmentCount.toLocaleString()}
                hint={t('detail.summary.attachmentCountHint')}
                icon={<FileStack className="w-4 h-4" />}
              />
            </div>

            <Card>
              <CardHeader className="gap-4">
                <div>
                  <CardTitle>{t('detail.table.title')}</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                  >
                    {t('detail.filters.all')}
                  </Button>
                  {ATTACHMENT_CATEGORY_ORDER.map((category) => (
                    <Button
                      key={category}
                      size="sm"
                      variant={filter === category ? 'default' : 'outline'}
                      onClick={() => setFilter(category)}
                    >
                      {getCategoryLabel(category, t)}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('detail.table.columns.type')}</TableHead>
                      <TableHead>{t('detail.table.columns.attachmentId')}</TableHead>
                      <TableHead>{t('detail.table.columns.size')}</TableHead>
                      <TableHead>{t('detail.table.columns.contentType')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttachments.length > 0 ? (
                      filteredAttachments.map((entry) => {
                        const isImage = isImageAttachment(entry)
                        const row = (
                          <TableRow
                            key={entry.attachmentId}
                            className={cn(isImage && 'cursor-pointer')}
                            onClick={isImage ? () => void handleViewAttachment(entry) : undefined}
                          >
                            <TableCell>{getCategoryLabel(entry.category, t)}</TableCell>
                            <TableCell className="max-w-[32rem] truncate">
                              {entry.attachmentId}
                            </TableCell>
                            <TableCell>{formatStorageSize(entry.bytes)}</TableCell>
                            <TableCell>{entry.contentType || 'application/octet-stream'}</TableCell>
                          </TableRow>
                        )
                        if (!isImage) return row
                        return (
                          <ContextMenu key={entry.attachmentId}>
                            <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                variant="destructive"
                                onSelect={() => setDeleteTarget(entry)}
                              >
                                {t('detail.imageActions.deleteImage')}
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          {t('messages.noAttachments')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )
      }
    }
  })()

  return (
    <div className="w-full h-full bg-transparent">
      <ScrollArea ref={scrollAreaRef} className="w-full h-full">
        <div className="flex flex-col gap-6 pt-[34px] px-6 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="px-0"
                onClick={() => navigate({ to: '/database-analysis' })}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('detail.backToOverview')}
              </Button>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">{report?.name || gameId}</h1>
                <p className="text-muted-foreground text-sm">
                  {t('detail.description', { gameId })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {report && (
                <Badge variant="outline">
                  {t('generatedAt')}: {t('{{date, niceDateSeconds}}', { date: report.generatedAt })}
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={() => void handleRefresh()}
                disabled={isDetailBusy}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', isDetailBusy && 'animate-spin')} />
                {t('actions.refresh')}
              </Button>
            </div>
          </div>

          {viewState.kind === 'ready' && viewState.staleError && (
            <DatabaseAnalysisRefreshFailedAlert
              title={t('messages.refreshFailedTitle')}
              description={t('messages.refreshFailedDescription', {
                error: viewState.staleError
              })}
            />
          )}

          {pageContent}
        </div>
      </ScrollArea>

      <ScrollToTopButton scrollAreaRef={scrollAreaRef} threshold={500} />

      <ImageViewerDialog
        isOpen={imageViewer.open}
        imagePath={imageViewer.path}
        onClose={() => setImageViewer({ open: false, path: null })}
      />
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('detail.imageActions.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('detail.imageActions.deleteConfirmDescription', {
                attachmentId: deleteTarget?.attachmentId ?? ''
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteAttachment()}>
              {t('detail.imageActions.deleteImage')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
