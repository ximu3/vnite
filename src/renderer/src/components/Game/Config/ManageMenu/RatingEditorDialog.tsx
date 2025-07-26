import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'

export function RatingEditorDialog({
  gameId,
  setIsOpen
}: {
  gameId: string
  setIsOpen: (value: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [score, setScore] = useGameState(gameId, 'record.score')
  const [preScore, setPreScore] = useState(score === -1 ? '' : score.toString())
  const resetPreScore = (): void => setPreScore(score === -1 ? '' : score.toString())

  // Score submission handler function
  function confirmScore(): void {
    if (preScore === '') {
      setScore(-1)
      setIsOpen(false)
      toast.success(t('detail.header.rating.cleared'))
      return
    }

    const scoreNum = parseFloat(preScore)

    if (isNaN(scoreNum)) {
      toast.error(t('detail.header.rating.errors.invalidNumber'))
      resetPreScore()
      return
    }

    if (scoreNum < 0) {
      toast.error(t('detail.header.rating.errors.negative'))
      resetPreScore()
      return
    }

    if (scoreNum > 10) {
      toast.error(t('detail.header.rating.errors.tooHigh'))
      resetPreScore()
      return
    }

    const formattedScore = scoreNum.toFixed(1)

    if (preScore !== formattedScore && !Number.isInteger(scoreNum)) {
      toast.warning(t('detail.header.rating.warning'))
    }

    setScore(Number(formattedScore))
    setPreScore(Number(formattedScore).toString())
    setIsOpen(false)
    toast.success(t('detail.header.rating.success'))
  }

  return (
    <Dialog open={true} onOpenChange={setIsOpen}>
      <DialogContent showCloseButton={false} className="w-[500px]">
        <div className={cn('flex flex-row gap-3 items-center justify-center')}>
          <div className={cn('whitespace-nowrap')}>{t('detail.header.rating.title')}</div>
          <Input
            value={preScore}
            onChange={(e) => setPreScore(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmScore()
            }}
          />
          <Button onClick={confirmScore}>{t('utils:common.confirm')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
