import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
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
import { toast } from 'sonner'
import { useState } from 'react'
import { useRunningGames } from '~/pages/Library/store'

export function Header({ gameId, className }: { gameId: string; className?: string }): JSX.Element {
  const { runningGames } = useRunningGames()
  const [name] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const [gamePath] = useDBSyncedState('', `games/${gameId}/path.json`, ['gamePath'])
  const [playStatus, setPlayStatus] = useDBSyncedState('stopped', `games/${gameId}/record.json`, [
    'playStatus'
  ])
  const [score, setScore] = useDBSyncedState('', `games/${gameId}/record.json`, ['score'])
  const [preScore, setPreScore] = useState(score)
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false)

  function confirmScore(): void {
    const scoreNum = parseFloat(preScore)

    if (isNaN(scoreNum)) {
      toast.error('请输入有效数字')
      setPreScore(score)
      return
    }

    if (scoreNum > 10) {
      toast.error('评分不能超过10分')
      setPreScore(score)
      return
    }

    const formattedScore = scoreNum === 10 ? '10' : scoreNum.toFixed(1)

    // 检查原始输入是否已经是标准格式（包括带小数点零的情况）
    if (preScore !== formattedScore) {
      if (Number.isInteger(scoreNum) && scoreNum < 10 && !preScore.includes('.')) {
        toast.warning('已自动补零')
      } else if (!preScore.endsWith('.0')) {
        // 如果不是以 .0 结尾
        toast.warning('已自动保留1位小数')
      }
    }

    setScore(formattedScore)
    setPreScore(formattedScore)
    setIsScoreDialogOpen(false)
    toast.success('评分已保存')
  }

  return (
    <div
      className={cn(
        'h-16 bg-gradient-to-b bg-background/80 absolute flex-row flex justify-between items-center pl-7 pr-7',
        className
      )}
    >
      <div className={cn('flex flex-row gap-5 items-center justify-center')}>
        <div className={cn('font-bold text-xl text-accent-foreground')}>{name}</div>
        <div className={cn('flex flex-row gap-2 items-center justify-center')}>
          <Badge variant="secondary">{gamePath === '' ? '未安装' : '已安装'}</Badge>
        </div>
      </div>
      <div className={cn('flex flex-row gap-3 justify-center items-center', '3xl:gap-5')}>
        {runningGames.includes(gameId) ? (
          <StopGame gameId={gameId} />
        ) : (
          <StartGame gameId={gameId} />
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

        <Dialog open={isScoreDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size={'icon'}
              className="non-draggable"
              onClick={() => {
                setIsScoreDialogOpen(true)
                setPreScore(score)
              }}
            >
              <span className={cn('icon-[mdi--starburst-edit-outline] w-4 h-4')}></span>
            </Button>
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="w-[500px]">
            <div className={cn('flex flex-row gap-3 items-center justify-center')}>
              <div className={cn('whitespace-nowrap')}>我的评分</div>
              <Input value={preScore} onChange={(e) => setPreScore(e.target.value)} />
              <Button onClick={confirmScore}>确定</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Config gameId={gameId} />
      </div>
    </div>
  )
}
