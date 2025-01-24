import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { cn, formatTimeToChinese } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { toNumber } from 'lodash'
import { useState } from 'react'
import { Parser } from 'expr-eval'

export function PlayingTimeEditorDialog({
  gameId,
  isOpen,
  setIsOpen,
  children
}: {
  gameId: string
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  children: React.ReactNode
}): JSX.Element {
  const [playingTime, setPlayingTime] = useDBSyncedState(0, `games/${gameId}/record.json`, [
    'playingTime'
  ])

  // Initial value converted to seconds
  const playingTime_sec = Math.floor(playingTime / 1000).toString()
  const [inputSeconds, setInputSeconds] = useState(playingTime_sec)
  const [inputExpression, setInputExpression] = useState(playingTime_sec)

  // Processing Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    // Allows only numbers to be entered
    if (/^[\d+\-*/. ]*$/.test(value)) {
      setInputExpression(value)
      if (/^\d*$/.test(value)) {
        setInputSeconds(value)
      } else {
        try {
          const parser = new Parser()
          const cal_result = parser.evaluate(value)
          if (!isNaN(cal_result)) {
            setInputSeconds(Math.floor(cal_result).toString())
          } else {
            setInputSeconds('NaN')
          }
        } catch (error) {
          setInputSeconds('NaN')
        }
      }
    }
  }

  // Processing Confirmation Button Click
  const handleConfirm = (): void => {
    if (inputSeconds === 'NaN') {
      setInputExpression(playingTime_sec)
      setInputSeconds(playingTime_sec)
      return
    }

    const seconds = toNumber(inputSeconds)
    if (seconds >= 0) {
      // Convert seconds to milliseconds and save
      setPlayingTime(seconds * 1000)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>
      <DialogContent showCloseButton={false} className={cn('w-[500px] flex flex-col gap-3 py-5')}>
        <div className={cn('text-xs')}>支持四则运算表达式</div>
        <div className={cn('flex flex-row gap-3 items-center')}>
          <div className={cn('')}>
            {isNaN(Number(inputSeconds)) ? 'NaN' : formatTimeToChinese(Number(inputSeconds) * 1000)}
          </div>
          <div className={cn('flex flex-row gap-3 items-center grow')}>
            <Input
              className={cn('w-full')}
              value={inputExpression}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm()
              }}
              type="text"
              placeholder="请输入秒数或表达式"
            />
            <Button onClick={handleConfirm}>确定</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
