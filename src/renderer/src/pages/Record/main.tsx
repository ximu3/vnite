import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '~/utils'

import { RecordOverview } from './RecordOverview'
import { WeeklyReport } from './WeeklyReport'
import { MonthlyReport } from './MonthlyReport'
import { YearlyReport } from './YearlyReport'
import { ScoreReport } from './ScoreReport'
import { useTranslation } from 'react-i18next'

export function Record({ className }: { className?: string }): React.JSX.Element {
  const { t } = useTranslation('record')
  return (
    <div className={cn('w-full h-full bg-transparent', className)}>
      <ScrollArea className={cn('w-full h-full px-6')}>
        <div className={cn('flex flex-col gap-6 pt-[34px]')}>
          <div className={cn('text-2xl font-bold')}>{t('title')}</div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
              <TabsTrigger value="weekly">{t('tabs.weekly')}</TabsTrigger>
              <TabsTrigger value="monthly">{t('tabs.monthly')}</TabsTrigger>
              <TabsTrigger value="yearly">{t('tabs.yearly')}</TabsTrigger>
              <TabsTrigger value="scores">{t('tabs.score')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <RecordOverview />
            </TabsContent>

            <TabsContent value="weekly">
              <WeeklyReport />
            </TabsContent>

            <TabsContent value="monthly">
              <MonthlyReport />
            </TabsContent>

            <TabsContent value="yearly">
              <YearlyReport />
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
