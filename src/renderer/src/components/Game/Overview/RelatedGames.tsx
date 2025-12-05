import { useNavigate } from '@tanstack/react-router'
import { Button } from '@ui/button'
import { SeparatorDashed } from '@ui/separator-dashed'
import { useTranslation } from 'react-i18next'
import { getSimilarGames } from '~/stores/game'
import { cn, navigateToGame } from '~/utils'

export function RelatedGamesCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const navigate = useNavigate()
  const relatedGames = getSimilarGames(gameId, 5)

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold select-none')}>
          {t('detail.overview.sections.relatedGames')}
        </div>
      </div>
      <SeparatorDashed />
      <div className={cn('flex flex-col text-sm justify-start gap-[6px] items-start')}>
        {relatedGames.length === 0
          ? t('detail.overview.relatedGames.empty')
          : relatedGames.map((game) => (
              <Button
                key={game.gameId}
                onClick={() => navigateToGame(navigate, game.gameId)}
                variant="link"
                className={cn('p-0 h-7', className)}
              >
                {game.gameName}
              </Button>
            ))}
      </div>
    </div>
  )
}
