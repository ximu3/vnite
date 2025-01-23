import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { Button } from '@ui/button'
// import { Badge } from '@ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger
} from '@ui/select'
import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import { Config } from './Config'
import { StartGame } from './StartGame'
import { StopGame } from './StopGame'
import { Record } from './Overview/Record'
import { toast } from 'sonner'
import { useState } from 'react'
import { useRunningGames } from '~/pages/Library/store'

export function Header({
  gameId,
  className,
  isSticky
}: {
  gameId: string
  className?: string
  isSticky: boolean
}): JSX.Element {
  const { runningGames } = useRunningGames()
  const [name] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const [originalName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['originalName'])
  const [showOriginalNameInGameHeader] = useDBSyncedState(false, 'config.json', [
    'appearances',
    'gameHeader',
    'showOriginalNameInGameHeader'
  ])
  const [playStatus, setPlayStatus] = useDBSyncedState('unplayed', `games/${gameId}/record.json`, [
    'playStatus'
  ])
  const [score, setScore] = useDBSyncedState(-1, `games/${gameId}/record.json`, ['score'])
  const [preScore, setPreScore] = useState(score === -1 ? '' : score.toString())
  const resetPreScore = (): void => setPreScore(score === -1 ? '' : score.toString())
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false)

  const [_saveList] = useDBSyncedState(
    { ['']: { id: '', date: '', note: '' } },
    `games/${gameId}/save.json`,
    ['#all']
  )
  const [_timer] = useDBSyncedState([], `games/${gameId}/record.json`, ['timer'])

  function confirmScore(): void {
    if (preScore === '') {
      setScore(-1)
      setIsScoreDialogOpen(false)
      toast.success('评分已清除')
      return
    }

    const scoreNum = parseFloat(preScore)

    if (isNaN(scoreNum)) {
      toast.error('请输入有效数字')
      resetPreScore()
      return
    }

    if (scoreNum < 0) {
      toast.error('评分不能为负数')
      resetPreScore()
      return
    }

    if (scoreNum > 10) {
      toast.error('评分不能超过10分')
      resetPreScore()
      return
    }

    const formattedScore = scoreNum.toFixed(1)

    if (preScore !== formattedScore && !Number.isInteger(scoreNum)) {
      toast.warning('已自动保留1位小数')
    }

    setScore(Number(formattedScore))
    setPreScore(Number(formattedScore).toString())
    setIsScoreDialogOpen(false)
    toast.success('评分已保存')
  }

  return (
    <div
      className={cn(
        'flex-col flex gap-5 px-7 py-5 pb-11 relative',
        isSticky
          ? 'bg-gradient-to-t from-background/80 to-background py-5 backdrop-blur-sm'
          : 'bg-gradient-to-b from-background/60 to-background backdrop-blur-md duration-100',
        className,
        'transition-all duration-100'
      )}
    >
      <div
        className={cn(
          'absolute inset-0',
          isSticky
            ? 'border-0 border-b-[1px] border-accent-foreground/10'
            : 'border-t-[1px] border-accent-foreground/10',
          'transition-none'
        )}
      ></div>
      <div
        className={cn(
          'flex flex-row gap-3 grow overflow-hidden items-center justify-between',
          showOriginalNameInGameHeader && originalName && originalName !== name && 'items-end'
        )}
      >
        <div className={cn('truncate')}>
          <span className={cn('font-bold text-2xl text-accent-foreground')}>{name}</span>
          {showOriginalNameInGameHeader && originalName && originalName !== name && (
            <span className={cn('font-bold text-accent-foreground ml-3')}>{originalName}</span>
          )}
        </div>
        {isSticky && (
          <div className={cn('flex flex-row gap-3 items-center duration-300 z-20', '3xl:gap-5')}>
            {runningGames.includes(gameId) ? (
              <StopGame gameId={gameId} className={cn('')} />
            ) : (
              <StartGame gameId={gameId} className={cn('')} />
            )}

            <Select value={playStatus} onValueChange={setPlayStatus}>
              <SelectTrigger noIcon className={cn('p-0 h-auto w-auto border-0 shadow-none')}>
                <Button variant="outline" size={'icon'} className="non-draggable">
                  <span className={cn('icon-[mdi--bookmark-outline] w-4 h-4')}></span>
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>游玩状态</SelectLabel>
                  <SelectItem value="unplayed">未开始</SelectItem>
                  <SelectItem value="playing">游玩中</SelectItem>
                  <SelectItem value="finished">已完成</SelectItem>
                  <SelectItem value="multiple">多周目</SelectItem>
                  <SelectItem value="shelved">搁置中</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size={'icon'}
                  className="non-draggable"
                  onClick={() => {
                    resetPreScore()
                    setIsScoreDialogOpen(true)
                  }}
                >
                  <span className={cn('icon-[mdi--starburst-edit-outline] w-4 h-4')}></span>
                </Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false} className="w-[500px]">
                <div className={cn('flex flex-row gap-3 items-center justify-center')}>
                  <div className={cn('whitespace-nowrap')}>我的评分</div>
                  <Input
                    value={preScore}
                    onChange={(e) => setPreScore(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmScore()
                    }}
                  />
                  <Button onClick={confirmScore}>确定</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Config gameId={gameId} />
          </div>
        )}
      </div>
      {!isSticky && (
        <div className={cn('flex flex-row justify-between items-center duration-300', '3xl:gap-5')}>
          <Record gameId={gameId} />
          <div className={cn('flex flex-row gap-3 items-center z-20', '3xl:gap-5')}>
            {runningGames.includes(gameId) ? (
              <StopGame gameId={gameId} className={cn('')} />
            ) : (
              <StartGame gameId={gameId} className={cn('')} />
            )}

            <Select value={playStatus} onValueChange={setPlayStatus}>
              <SelectTrigger noIcon className={cn('p-0 h-auto w-auto border-0 shadow-none')}>
                <Button variant="outline" size={'icon'} className="non-draggable">
                  <span className={cn('icon-[mdi--bookmark-outline] w-4 h-4')}></span>
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>游玩状态</SelectLabel>
                  <SelectItem value="unplayed">未开始</SelectItem>
                  <SelectItem value="playing">游玩中</SelectItem>
                  <SelectItem value="finished">已完成</SelectItem>
                  <SelectItem value="multiple">多周目</SelectItem>
                  <SelectItem value="shelved">搁置中</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size={'icon'}
                  className="non-draggable"
                  onClick={() => {
                    resetPreScore()
                    setIsScoreDialogOpen(true)
                  }}
                >
                  <span className={cn('icon-[mdi--starburst-edit-outline] w-4 h-4')}></span>
                </Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false} className="w-[500px]">
                <div className={cn('flex flex-row gap-3 items-center justify-center')}>
                  <div className={cn('whitespace-nowrap')}>我的评分</div>
                  <Input
                    value={preScore}
                    onChange={(e) => setPreScore(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmScore()
                    }}
                  />
                  <Button onClick={confirmScore}>确定</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Config gameId={gameId} />
          </div>
        </div>
      )}
    </div>
  )
}
