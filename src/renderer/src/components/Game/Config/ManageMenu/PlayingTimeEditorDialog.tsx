import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { cn, formatTimeToChinese } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { toNumber } from 'lodash'
import { useState } from 'react'

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
  const [inputSeconds, setInputSeconds] = useState(Math.floor(playingTime / 1000).toString())

  // Processing Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    // Allows only numbers to be entered
    if (/^\d*$/.test(value)) {
      setInputSeconds(value)
    }
  }

  // Processing Confirmation Button Click
  const handleConfirm = (): void => {
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
      <DialogContent
        showCloseButton={false}
        className={cn('w-[500px] flex flex-row gap-3 items-center')}
      >
        <div className={cn('grow whitespace-nowrap')}>
          {formatTimeToChinese(Number(inputSeconds) * 1000)}
        </div>
        <Input
          className={cn('w-full')}
          value={inputSeconds}
          onChange={handleInputChange}
          type="text"
          placeholder="请输入秒数"
        />
        <Button onClick={handleConfirm}>确定</Button>
      </DialogContent>
    </Dialog>
  )
}
