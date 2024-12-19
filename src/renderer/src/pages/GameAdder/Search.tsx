import { cn } from '~/utils'
import { Button } from '@ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Input } from '@ui/input'
import { toast } from 'sonner'
import { useGameAdderStore } from './store'
import { ipcInvoke } from '~/utils'
import { useNavigate } from 'react-router-dom'

export function Search({ className }: { className?: string }): JSX.Element {
  const { dataSource, setDataSource, name, setName, id, setId, setGameList } = useGameAdderStore()
  const navigate = useNavigate()
  async function searchGames(): Promise<void> {
    if (!name) {
      toast.warning('请输入游戏名称')
      return
    }
    try {
      type GameList = {
        id: string
        name: string
        releaseDate: string
        developers: string[]
      }[]

      toast.promise(
        (async (): Promise<GameList> => {
          const result = (await ipcInvoke('search-games', dataSource, name)) as GameList
          setGameList(result)
          if (result.length === 0) {
            toast.error('未找到游戏')
            return result
          }
          navigate('/games')
          return result
        })(),
        {
          loading: '搜索游戏中...',
          success: (data) => `找到 ${data.length} 个游戏`,
          error: (err) => `搜索失败: ${err.message}`
        }
      )
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`搜索游戏失败: ${error.message}`)
      } else {
        toast.error(`搜索游戏失败: ${error}`)
      }
    }
  }
  async function recognizeGame(): Promise<void> {
    if (!id) {
      toast.warning('请输入游戏ID')
      return
    }
    try {
      toast.promise(
        (async (): Promise<void> => {
          const result = await ipcInvoke('check-game-exists', dataSource, id)
          if (!result) {
            toast.error('无效ID')
            return
          }
          setId(id)
          navigate('/screenshots')
        })(),
        {
          loading: '识别游戏中...',
          success: '识别游戏成功',
          error: (err) => `识别游戏失败: ${err.message}`
        }
      )
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`识别游戏失败: ${error.message}`)
      } else {
        toast.error(`识别游戏失败: ${error}`)
      }
    }
  }
  return (
    <div className={cn('w-[36vw] h-auto', '3xl:w-[30vw]', className)}>
      <div className={cn('flex flex-col w-full h-full gap-3 p-3 justify-center')}>
        <div className={cn('flex flex-row gap-3 items-center justify-start')}>
          <div>数据来源</div>
          <div className={cn('w-[130px]')}>
            <Select onValueChange={setDataSource} value={dataSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>数据来源</SelectLabel>
                  <SelectItem value="steam">Steam</SelectItem>
                  <SelectItem value="vndb">VNDB</SelectItem>
                  <SelectItem value="bangumi">Bangumi</SelectItem>
                  <SelectItem value="igdb">IGDB</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className={cn('flex flex-row gap-3 items-center justify-start')}>
          <div className={cn('flex-shrink-0')}>游戏名称</div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入游戏名称"
            onKeyDown={(e) => {
              if (e.key === 'Enter') searchGames()
            }}
          />
          <Button onClick={searchGames}>搜索</Button>
        </div>
        <div className={cn('flex flex-row gap-3 items-center justify-start')}>
          <div className={cn('flex-shrink-0 mr-4')}>游戏ID</div>
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="请输入游戏ID"
            onKeyDown={(e) => {
              if (e.key === 'Enter') recognizeGame()
            }}
          />
          <Button onClick={recognizeGame}>识别</Button>
        </div>
      </div>
    </div>
  )
}
