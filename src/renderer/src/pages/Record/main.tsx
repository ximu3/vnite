import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/utils'

import { useRouter, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MonthlyReport } from './MonthlyReport'
import { RecordOverview } from './RecordOverview'
import { ScoreReport } from './ScoreReport'
import { WeeklyReport } from './WeeklyReport'
import { WIP } from './WIP'
import { YearlyReport } from './YearlyReport'

export function Record({ className }: { className?: string }): React.JSX.Element {
  const { t } = useTranslation('record')
  const router = useRouter()
  const search = useSearch({ from: '/record' })

  const handleTabChange = (value: string): void => {
    router.navigate({ to: '/record', search: { ...search, tab: value } })
  }

  const TAB_ORDER = ['overview', 'yearly', 'monthly', 'weekly', 'scores']
  useEffect(() => {
    const getNextIndex = (currentIndex: number, direction: 'left' | 'right'): number => {
      const length = TAB_ORDER.length
      return direction === 'left'
        ? (currentIndex - 1 + length) % length
        : (currentIndex + 1) % length
    }

    const handleCtrlArrow = (e: KeyboardEvent): void => {
      if (!e.ctrlKey) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

      const currentIndex = TAB_ORDER.indexOf(search.tab || 'overview')
      if (currentIndex === -1) return

      e.preventDefault()
      const nextIndex = getNextIndex(currentIndex, e.key === 'ArrowLeft' ? 'left' : 'right')
      handleTabChange(TAB_ORDER[nextIndex])
    }

    window.addEventListener('keydown', handleCtrlArrow)
    return () => window.removeEventListener('keydown', handleCtrlArrow)
  }, [search.tab, handleTabChange])

  return (
    <div className={cn('w-full h-full bg-transparent', className)}>
      <ScrollArea className={cn('w-full h-full')}>
        <div className={cn('flex flex-col gap-6 pt-[34px] px-6 pb-6')}>
          <div className={cn('text-2xl font-bold')}>{t('title')}</div>

          <Tabs value={search.tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
              <TabsTrigger value="yearly">{t('tabs.yearly')}</TabsTrigger>
              <TabsTrigger value="monthly">{t('tabs.monthly')}</TabsTrigger>
              <TabsTrigger value="weekly">{t('tabs.weekly')}</TabsTrigger>
              <TabsTrigger value="scores">{t('tabs.score')}</TabsTrigger>
              <TabsTrigger value="WIP">{'WIP'}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <RecordOverview />
            </TabsContent>

            <TabsContent value="yearly">
              <YearlyReport />
            </TabsContent>

            <TabsContent value="monthly">
              <MonthlyReport />
            </TabsContent>

            <TabsContent value="weekly">
              <WeeklyReport />
            </TabsContent>

            <TabsContent value="scores">
              <ScoreReport />
            </TabsContent>

            <TabsContent value="WIP">
              <WIP />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
