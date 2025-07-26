import { Button } from '~/components/ui/button'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { useState } from 'react'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { PlusCircleIcon } from 'lucide-react'
import { TimerEditDialog } from './TimerEditDialog'
import { Card } from '~/components/ui/card'

export function PlayTimeEditorDialog({
  gameId,
  setIsOpen
}: {
  gameId: string
  setIsOpen: (value: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [record, setRecord] = useGameState(gameId, 'record')

  const [timers, setTimers] = useState<{ start: string; end: string }[]>(record.timers || [])

  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false)
  const [editingTimer, setEditingTimer] = useState<{ start: string; end: string } | undefined>(
    undefined
  )
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // 格式化时间显示
  const formatDateTime = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm')
    } catch (_e) {
      return dateStr
    }
  }

  // 计算时间差（分钟）
  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0
    return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60)
  }

  // 计算总游戏时间（毫秒）
  const calculateTotalPlayTime = (timersList: { start: string; end: string }[]): number => {
    return timersList.reduce((total, timer) => {
      if (!timer.start || !timer.end) return total
      const start = new Date(timer.start).getTime()
      const end = new Date(timer.end).getTime()
      return total + Math.max(0, end - start)
    }, 0)
  }

  // 打开添加新计时器对话框
  const openAddTimer = (): void => {
    setEditingTimer(undefined)
    setEditingIndex(null)
    setIsTimerDialogOpen(true)
  }

  // 打开编辑计时器对话框
  const openEditTimer = (index: number): void => {
    setEditingTimer(timers[index])
    setEditingIndex(index)
    setIsTimerDialogOpen(true)
  }

  // 保存计时器（添加或编辑）
  const saveTimer = (timer: { start: string; end: string }): void => {
    if (editingIndex !== null) {
      // 编辑现有计时器
      const newTimers = [...timers]
      newTimers[editingIndex] = timer
      setTimers(newTimers)
    } else {
      // 添加新计时器
      setTimers([...timers, timer])
    }
    setIsTimerDialogOpen(false)
  }

  // 删除计时器
  const deleteTimer = (index: number): void => {
    const newTimers = timers.filter((_, i) => i !== index)
    setTimers(newTimers)
  }

  // 保存所有更改
  const handleSave = (): void => {
    const playTimeMs = calculateTotalPlayTime(timers)
    setRecord({
      ...record,
      timers: timers,
      playTime: playTimeMs
    })
    setIsOpen(false)
  }

  return (
    <>
      <Dialog open={true} onOpenChange={setIsOpen}>
        <DialogContent showCloseButton={true} className={cn('w-[600px] flex flex-col gap-3')}>
          <h3 className="text-xl font-bold mb-2">{t('detail.timersEditor.title', '游戏计时器')}</h3>

          {/* 添加计时器按钮 */}
          <Button
            variant="outline"
            onClick={openAddTimer}
            className="flex items-center gap-2 w-full"
          >
            <PlusCircleIcon className="h-4 w-4" />
            {t('detail.timersEditor.addTimer', '添加计时器')}
          </Button>

          {/* 计时器列表 */}
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">
              {t('detail.timersEditor.timersList', '计时器列表')}
            </h4>
            {timers.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center bg-muted rounded-md">
                {t('detail.timersEditor.noTimers', '没有计时器记录')}
              </div>
            ) : (
              <div className="space-y-2 max-h-[25vh] lg:max-h-[50vh] overflow-y-auto scrollbar-base pr-1 pb-1">
                {timers.map((timer, index) => (
                  <Card
                    key={index}
                    className="flex flex-row items-center justify-between bg-accent/40 p-3 rounded-md"
                  >
                    <div className="flex-1">
                      <div>
                        <span className="font-medium">开始:</span> {formatDateTime(timer.start)}
                      </div>
                      <div>
                        <span className="font-medium">结束:</span>{' '}
                        {timer.end ? formatDateTime(timer.end) : '进行中'}
                      </div>
                      {timer.start && timer.end && (
                        <div className="text-sm text-muted-foreground mt-1">
                          时长: {calculateDuration(timer.start, timer.end)} 分钟
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button variant="default" size="sm" onClick={() => openEditTimer(index)}>
                        {t('utils:common.edit', '编辑')}
                      </Button>
                      <Button variant="thirdary" size="sm" onClick={() => deleteTimer(index)}>
                        {t('utils:common.delete', '删除')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 总时长和操作按钮 */}
          <div className="flex items-center justify-between border-t pt-4 mt-2">
            <div className="text-md">
              <span className="font-medium">
                {t('detail.timersEditor.totalPlayTime', '总游戏时长')}:
              </span>{' '}
              {t('{{date, gameTime}}', { date: calculateTotalPlayTime(timers) })}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t('utils:common.cancel', '取消')}
              </Button>
              <Button onClick={handleSave}>{t('utils:common.save', '保存')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 计时器编辑对话框 */}
      <TimerEditDialog
        isOpen={isTimerDialogOpen}
        onClose={() => setIsTimerDialogOpen(false)}
        onSave={saveTimer}
        timer={editingTimer}
        isNew={editingIndex === null}
      />
    </>
  )
}
