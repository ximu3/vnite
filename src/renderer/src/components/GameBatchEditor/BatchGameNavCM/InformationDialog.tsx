import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { TooltipContent, TooltipTrigger, Tooltip } from '@ui/tooltip'
import { ArrayInput } from '@ui/array-input'
import { Switch } from '@ui/switch'
import { Button } from '@ui/button'
import { cn } from '~/utils'
import { useGameState } from '~/hooks'
import { useState } from 'react'
import { toast } from 'sonner'

export function InformationDialog({
  gameIds,
  isOpen,
  setIsOpen,
  children
}: {
  gameIds: string[]
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  children: React.ReactNode
}): JSX.Element {
  const [isIncremental, setIsIncremental] = useState(true)
  const [developers, setDevelopers] = useState<string[]>([])
  const [publishers, setPublishers] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])

  const gameStates = gameIds.map((gameId) => ({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    developers: useGameState(gameId, 'metadata.developers'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    publishers: useGameState(gameId, 'metadata.publishers'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    genres: useGameState(gameId, 'metadata.genres'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    platforms: useGameState(gameId, 'metadata.platforms')
  }))

  const handleConfirm = async (): Promise<void> => {
    try {
      gameStates.forEach(
        ({
          developers: [currentDevelopers, setGameDevelopers],
          publishers: [currentPublishers, setGamePublishers],
          genres: [currentGenres, setGameGenres],
          platforms: [currentPlatforms, setGamePlatforms]
        }) => {
          if (developers.length > 0) {
            setGameDevelopers(
              isIncremental ? [...new Set([...currentDevelopers, ...developers])] : developers
            )
          }
          if (publishers.length > 0) {
            setGamePublishers(
              isIncremental ? [...new Set([...currentPublishers, ...publishers])] : publishers
            )
          }
          if (genres.length > 0) {
            setGameGenres(isIncremental ? [...new Set([...currentGenres, ...genres])] : genres)
          }
          if (platforms.length > 0) {
            setGamePlatforms(
              isIncremental ? [...new Set([...currentPlatforms, ...platforms])] : platforms
            )
          }
        }
      )

      setIsOpen(false)
      setDevelopers([])
      setPublishers([])
      setGenres([])
      setPlatforms([])

      toast.success('已批量修改游戏信息')
    } catch (error) {
      console.error('Failed to update games:', error)
      if (error instanceof Error) {
        toast.error(`Failed to update games: ${error.message}`)
      } else {
        toast.error('Failed to update games: An unknown error occurred')
      }
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>
      <DialogContent className={cn('flex flex-col gap-5')}>
        <div className={cn('flex flex-col gap-3 p-4')}>
          <div className={cn('flex flex-row gap-3 items-center justify-start')}>
            <div className={cn('w-20')}>增量模式</div>
            <Switch checked={isIncremental} onCheckedChange={setIsIncremental} />
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('w-20')}>开发商</div>
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <ArrayInput value={developers} onChange={setDevelopers} placeholder="暂无开发商" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className={cn('text-xs')}>开发商之间用英文逗号分隔</div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('w-20')}>发行商</div>
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <ArrayInput value={publishers} onChange={setPublishers} placeholder="暂无发行商" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className={cn('text-xs')}>发行商之间用英文逗号分隔</div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('w-20')}>平台</div>
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <ArrayInput value={platforms} onChange={setPlatforms} placeholder="暂无平台" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className={cn('text-xs')}>平台之间用英文逗号分隔</div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={cn('flex flex-row gap-3 items-center justify-center')}>
            <div className={cn('w-20')}>类型</div>
            <Tooltip>
              <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
                <ArrayInput value={genres} onChange={setGenres} placeholder="暂无类型" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className={cn('text-xs')}>类型之间用英文逗号分隔</div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={cn('flex flex-row-reverse -mb-3 mt-2')}>
            <Button onClick={handleConfirm}>确认</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
