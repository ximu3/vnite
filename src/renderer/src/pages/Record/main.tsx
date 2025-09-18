import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/utils'

import { useRouter, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { MonthlyReport } from './MonthlyReport'
import { RecordOverview } from './RecordOverview'
import { ScoreReport } from './ScoreReport'
import { WeeklyReport } from './WeeklyReport'
import { YearlyReport } from './YearlyReport'

export function Record({ className }: { className?: string }): React.JSX.Element {
  const { t } = useTranslation('record')
  const router = useRouter()
  const search = useSearch({ from: '/record' })

  const handleTabChange = (value: string): void => {
    router.navigate({ to: '/record', search: { ...search, tab: value } })
  }

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
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
