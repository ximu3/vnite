import { Button } from '@ui/button'
import { Dialog, DialogContent } from '@ui/dialog'
import { Input } from '@ui/input'
import { Parser } from 'expr-eval'
import { toNumber } from 'lodash'
import { useState } from 'react'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'
import { useTranslation } from 'react-i18next'

export function PlayTimeEditorDialog({
  gameId,
  setIsOpen
}: {
  gameId: string
  setIsOpen: (value: boolean) => void
}): JSX.Element {
  const { t } = useTranslation('game')
  const [playTime, setPlayTime] = useGameState(gameId, 'record.playTime')
  // Initial value converted to seconds
  const playTime_sec = Math.floor(playTime / 1000).toString()
  const [inputSeconds, setInputSeconds] = useState(playTime_sec)
  const [inputExpression, setInputExpression] = useState(playTime_sec)

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
        } catch (_error) {
          setInputSeconds('NaN')
        }
      }
    }
  }

  // Processing Confirmation Button Click
  const handleConfirm = (): void => {
    if (inputSeconds === 'NaN') {
      setInputExpression(playTime_sec)
      setInputSeconds(playTime_sec)
      return
    }

    const seconds = toNumber(inputSeconds)
    if (seconds >= 0) {
      // Convert seconds to milliseconds and save
      setPlayTime(seconds * 1000)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={setIsOpen}>
      <DialogContent showCloseButton={false} className={cn('w-[500px] flex flex-col gap-3 py-5')}>
        <div className={cn('text-xs')}>{t('detail.playTimeEditor.expressionSupport')}</div>
        <div className={cn('flex flex-row gap-3 items-center')}>
          <div className={cn('')}>
            {isNaN(Number(inputSeconds))
              ? 'NaN'
              : t('{{date, gameTime}}', { date: Number(inputSeconds) * 1000 })}
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
              placeholder={t('detail.playTimeEditor.placeholder')}
            />
            <Button onClick={handleConfirm}>{t('utils:common.confirm')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
