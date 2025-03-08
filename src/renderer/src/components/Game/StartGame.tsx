import { cn } from '~/utils'
import { Button } from '@ui/button'
import { startGame } from '~/utils'
import { useTranslation } from 'react-i18next'

export function StartGame({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const { t } = useTranslation('game')
  return (
    <Button className={cn('', className)} onClick={() => startGame(gameId)}>
      <div className={cn('flex flex-row justify-center gap-1 items-center w-full h-full p-3')}>
        <span className={cn('icon-[mdi--play] w-6 h-6 -ml-1')}></span>
        <div className={cn('')}>{t('detail.actions.start')}</div>
      </div>
    </Button>
  )
}
