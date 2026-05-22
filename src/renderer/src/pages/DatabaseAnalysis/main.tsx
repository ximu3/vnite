import { useNavigate } from '@tanstack/react-router'
import { Database, FolderTree, HardDrive, ImageIcon, RefreshCw } from 'lucide-react'
import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'

import type { DatabaseAttachmentCategory } from '@appTypes/models'
import { Badge } from '@ui/badge'
import { Button } from '@ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'
import { ScrollArea } from '@ui/scroll-area'
import { ScrollToTopButton } from '~/components/Showcase/ScrollToTopButton'
import { cn, formatStorageSize } from '~/utils'
import { DatabaseAnalysisGameTable } from './GameTable'
import { DatabaseAnalysisMetricCard } from './MetricCard'
import {
  DatabaseAnalysisErrorCard,
  DatabaseAnalysisLoadingCard,
  DatabaseAnalysisRefreshFailedAlert
} from './StateViews'
import { useDatabaseAnalysisStore } from './store'
import { filterPieChartDataByMinimumPercent, resolveLoadableViewState } from './utils'

const ATTACHMENT_CATEGORY_ORDER: DatabaseAttachmentCategory[] = [
  'memory',
  'save',
  'descriptionImage',
  'media',
  'other'
]
const MINIMUM_PIE_PERCENT = 0.02

type LargestGameChartDatum = {
  gameId: string
  label: string
  value: number
}

function getCategoryLabel(
  category: DatabaseAttachmentCategory,
  t: (key: string) => string
): string {
  return t(`categories.${category}`)
}

function truncateLabel(value: string, maxLength = 18): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1)}…`
}

export function DatabaseAnalysis(): React.JSX.Element {
  const { t } = useTranslation('databaseAnalysis')
  const navigate = useNavigate()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const overview = useDatabaseAnalysisStore((state) => state.overview)
  const ensureOverview = useDatabaseAnalysisStore((state) => state.ensureOverview)
  const refreshOverview = useDatabaseAnalysisStore((state) => state.refreshOverview)

  useEffect(() => {
    void ensureOverview()
  }, [ensureOverview])

  const viewState = resolveLoadableViewState(overview)
  const report = viewState.kind === 'ready' ? viewState.data : null
  const isOverviewBusy = overview.status === 'loading' || overview.isRefreshing

  const attachmentChartData = useMemo(() => {
    if (!report) return []

    return filterPieChartDataByMinimumPercent(
      ATTACHMENT_CATEGORY_ORDER.map((category) => ({
        key: category,
        category,
        label: getCategoryLabel(category, t),
        value: report.attachmentCategoryBytes[category]
      })),
      MINIMUM_PIE_PERCENT
    )
  }, [report, t])

  const largestGamesChartData = useMemo<LargestGameChartDatum[]>(
    () =>
      [...(report?.games ?? [])]
        .sort((a, b) => {
          if (b.totalLogicalPayloadBytes !== a.totalLogicalPayloadBytes) {
            return b.totalLogicalPayloadBytes - a.totalLogicalPayloadBytes
          }
          return a.name.localeCompare(b.name)
        })
        .slice(0, 8)
        .map((game) => ({
          gameId: game.gameId,
          label: game.name,
          value: game.totalLogicalPayloadBytes
        })),
    [report]
  )

  const handleRefresh = async (): Promise<void> => {
    try {
      await refreshOverview()
    } catch {
      // The stale state banner already explains the refresh failure.
    }
  }

  const openGameDetail = (gameId: string): void => {
    navigate({
      to: '/database-analysis/games/$gameId',
      params: { gameId }
    })
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <DatabaseAnalysisMetricCard
                title={t('summary.physicalBytes')}
                value={formatStorageSize(report.summary.physicalBytes)}
                hint={t('summary.physicalBytesHint')}
                icon={<HardDrive className="w-4 h-4" />}
              />
              <DatabaseAnalysisMetricCard
                title={t('summary.logicalPayloadBytes')}
                value={formatStorageSize(report.summary.logicalPayloadBytes)}
                hint={t('summary.logicalPayloadBytesHint')}
                icon={<Database className="w-4 h-4" />}
              />
              <DatabaseAnalysisMetricCard
                title={t('summary.attachmentBytes')}
                value={formatStorageSize(report.summary.attachmentBytes)}
                hint={t('summary.attachmentBytesHint')}
                icon={<ImageIcon className="w-4 h-4" />}
              />
              <DatabaseAnalysisMetricCard
                title={t('summary.attachmentCount')}
                value={report.summary.attachmentCount.toLocaleString()}
                hint={t('summary.attachmentCountHint', {
                  count: report.summary.gamesWithAttachments
                })}
                icon={<FolderTree className="w-4 h-4" />}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[auto_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>{t('charts.attachmentDistribution.title')}</CardTitle>
                  <CardDescription>
                    {t('charts.attachmentDistribution.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {attachmentChartData.length > 0 ? (
                    <ChartContainer
                      config={Object.fromEntries(
                        attachmentChartData.map((item, index) => [
                          item.key,
                          {
                            label: item.label,
                            color: `var(--chart-${(index % 5) + 1})`
                          }
                        ])
                      )}
                      className="h-[280px] w-full"
                    >
                      <PieChart>
                        <Pie
                          data={attachmentChartData}
                          dataKey="value"
                          nameKey="key"
                          innerRadius={60}
                          outerRadius={100}
                          isAnimationActive={false}
                          label={({ label, percent }) =>
                            `${label} ${(Number(percent) * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {attachmentChartData.map((item, index) => (
                            <Cell key={item.key} fill={`var(--chart-${(index % 5) + 1})`} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={(props) => (
                            <ChartTooltipContent
                              {...props}
                              formatter={(value) => formatStorageSize(Number(value))}
                              labelKey="category"
                              hideIndicator={false}
                            />
                          )}
                        />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                      {t('messages.noAttachments')}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('charts.largestGames.title')}</CardTitle>
                  <CardDescription>{t('charts.largestGames.description')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {largestGamesChartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        total: {
                          label: t('summary.logicalPayloadBytes'),
                          color: 'var(--chart-1)'
                        }
                      }}
                      className="h-[280px] w-full"
                    >
                      <BarChart
                        data={largestGamesChartData}
                        layout="vertical"
                        margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                      >
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={120}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => truncateLabel(String(value), 16)}
                        />
                        <ChartTooltip
                          content={(props) => (
                            <ChartTooltipContent
                              {...props}
                              formatter={(value) => formatStorageSize(Number(value))}
                            />
                          )}
                        />
                        <Bar
                          dataKey="value"
                          fill="var(--chart-1)"
                          radius={[0, 4, 4, 0]}
                          className="cursor-pointer"
                          onClick={(_data, index) => {
                            const datum = largestGamesChartData[index]
                            if (!datum) return
                            openGameDetail(datum.gameId)
                          }}
                        />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                      {t('messages.noMatchingGames')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <DatabaseAnalysisGameTable games={report.games} />
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
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground text-sm">{t('description')}</p>
            </div>
            <div className="flex items-center gap-2">
              {report && (
                <Badge variant="outline" className="max-w-[28rem] truncate">
                  {t('generatedAt')}: {t('{{date, niceDateSeconds}}', { date: report.generatedAt })}
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={() => void handleRefresh()}
                disabled={isOverviewBusy}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', isOverviewBusy && 'animate-spin')} />
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
    </div>
  )
}
