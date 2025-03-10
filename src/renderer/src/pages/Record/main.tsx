import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { ScrollArea } from '@ui/scroll-area'
import { cn } from '~/utils'

import { RecordOverview } from './RecordOverview'
import { WeeklyReport } from './WeeklyReport'
import { MonthlyReport } from './MonthlyReport'
import { YearlyReport } from './YearlyReport'
import { ScoreReport } from './ScoreReport'

export function Record({ className }: { className?: string }): JSX.Element {
  return (
    <div
      className={cn(
        'w-full h-[100vh] bg-background border-l-[1px] border-border pt-[34px]',
        className
      )}
    >
      <ScrollArea className={cn('w-full h-full p-6 pt-0')}>
        <div className={cn('flex flex-col gap-6')}>
          <div className={cn('text-2xl font-bold')}>我的游戏记录</div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="overview">总览</TabsTrigger>
              <TabsTrigger value="weekly">周报</TabsTrigger>
              <TabsTrigger value="monthly">月报</TabsTrigger>
              <TabsTrigger value="yearly">年报</TabsTrigger>
              <TabsTrigger value="scores">评分报告</TabsTrigger>
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
