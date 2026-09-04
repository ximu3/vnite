import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@ui/button'
import { SeparatorDashed } from '@ui/separator-dashed'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { getSimilarGames } from '~/stores/game'
import { cn, navigateToGame } from '~/utils'

export function RecommendedGamesCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const navigate = useNavigate()
  const recommendedGames = getSimilarGames(gameId, 5)

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold select-none')}>
          {t('detail.overview.sections.recommendedGames')}
        </div>
      </div>
      <SeparatorDashed />
      <div className={cn('flex flex-col text-sm justify-start gap-[6px] items-start')}>
        {recommendedGames.length === 0
          ? t('detail.overview.recommendedGames.empty')
          : recommendedGames.map((game) => (
              <Tooltip key={game.gameId}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => navigateToGame(navigate, game.gameId)}
                    variant="link"
                    className={cn('p-0 h-7 max-w-full min-w-0 justify-start', className)}
                  >
                    <span className="min-w-0 truncate">{game.gameName}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  className="max-w-80 whitespace-normal break-words text-wrap"
                >
                  {game.gameName}
                </TooltipContent>
              </Tooltip>
            ))}
      </div>
    </div>
  )
}
