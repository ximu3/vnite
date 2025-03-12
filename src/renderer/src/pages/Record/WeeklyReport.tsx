import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Separator } from '@ui/separator'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart'

import { GameRankingItem } from './GameRankingItem'
import {
  getWeeklyPlayData
  // 移除不再使用的函数导入
  // formatChineseDate,
  // formatPlayTimeWithUnit
} from '~/stores/game/recordUtils'

export function WeeklyReport(): JSX.Element {
  // 使用record命名空间
  const { t } = useTranslation('record')

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const weekData = getWeeklyPlayData(selectedDate)

  // 上一周/下一周
  const goToPreviousWeek = (): void => {
    const prevWeek = new Date(selectedDate)
    prevWeek.setDate(selectedDate.getDate() - 7)
    setSelectedDate(prevWeek)
  }

  const goToNextWeek = (): void => {
    const nextWeek = new Date(selectedDate)
    nextWeek.setDate(selectedDate.getDate() + 7)
    setSelectedDate(nextWeek)
  }

  // 格式化周的日期范围
  const weekStart = new Date(weekData.dates[0])
  const weekEnd = new Date(weekData.dates[weekData.dates.length - 1])
  const weekRange = t('weekly.dateRange', {
    startDate: weekStart,
    endDate: weekEnd
  })

  // 获取星期几的本地化名称
  const getLocalizedWeekday = (dayIndex: number): string => {
    const weekdayKeys = [
      'weekly.weekdays.sunday',
      'weekly.weekdays.monday',
      'weekly.weekdays.tuesday',
      'weekly.weekdays.wednesday',
      'weekly.weekdays.thursday',
      'weekly.weekdays.friday',
      'weekly.weekdays.saturday'
    ]
    return t(weekdayKeys[dayIndex])
  }

  // 转换每日游戏时间为图表数据
  const dailyChartData = weekData.dates.map((date) => {
    const dayDate = new Date(date)
    return {
      date,
      weekday: getLocalizedWeekday(dayDate.getDay()),
      playTime: (weekData.dailyPlayTime[date] || 0) / 60000, // 转换为分钟
      fullDate: date // 存储原始日期用于格式化
    }
  })

  // Chart配置
  const chartConfig = {
    playTime: {
      label: t('overview.stats.totalPlayTime'),
      color: 'hsl(var(--primary))'
    }
  }

  // 游戏时间格式化函数
  const formatGameTime = (time: number): string => {
    return t('utils:format.gameTime', { time })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('weekly.title')}</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium">{weekRange}</div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            disabled={new Date(weekEnd) > new Date()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('weekly.dailyPlayTime')}</CardTitle>
            <CardDescription>
              {t('weekly.totalWeeklyTime', { time: weekData.totalTime })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="weekday" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatGameTime((value as number) * 60000)}
                      labelFormatter={(weekday, data) => {
                        if (data && data[0]?.payload) {
                          const rawDate = new Date(data[0].payload.fullDate)
                          return `${weekday} (${t('utils:format.niceDate', { date: rawDate })})`
                        }
                        return weekday
                      }}
                      hideIndicator={false}
                      color="hsl(var(--primary))"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="playTime"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={0.3}
                  fill="hsl(var(--primary))"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('weekly.highlights.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weekData.mostPlayedDay ? (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('weekly.highlights.longestDay')}
                  </p>
                  <p className="text-lg font-bold">
                    {t('weekly.highlights.dateFormat', {
                      weekday: getLocalizedWeekday(new Date(weekData.mostPlayedDay.date).getDay()),
                      date: new Date(weekData.mostPlayedDay.date)
                    })}
                  </p>
                  <p className="text-sm">
                    {t('weekly.highlights.playTime', { time: weekData.mostPlayedDay.playTime })}
                  </p>
                </div>
              ) : (
                <p>{t('weekly.highlights.noRecords')}</p>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">{t('weekly.highlights.frequency')}</p>
                <p className="text-lg font-bold">
                  {t('weekly.highlights.daysPlayed', {
                    played: Object.values(weekData.dailyPlayTime).filter((time) => time > 0).length,
                    total: Object.keys(weekData.dailyPlayTime).length
                  })}
                </p>
                <p className="text-sm">
                  {t('weekly.highlights.percentage', {
                    percent: Math.round(
                      (Object.values(weekData.dailyPlayTime).filter((time) => time > 0).length /
                        Object.keys(weekData.dailyPlayTime).length) *
                        100
                    )
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('weekly.weeklyGames.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weekData.mostPlayedGames.length > 0 ? (
                weekData.mostPlayedGames.map((game, index) => (
                  <GameRankingItem
                    key={game.gameId}
                    gameId={game.gameId}
                    rank={index + 1}
                    extraInfo={formatGameTime(game.playTime)}
                  />
                ))
              ) : (
                <p>{t('weekly.weeklyGames.noRecords')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
