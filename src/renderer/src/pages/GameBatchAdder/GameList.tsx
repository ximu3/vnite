import { cn, ipcInvoke } from '~/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useGameBatchAdderStore, DataSource } from './store'

export function GameList(): JSX.Element {
  const { gameList, setGameList, setIsLoading, isLoading } = useGameBatchAdderStore()
  async function addOneGame(dataId: string): Promise<void> {
    const game = gameList.find((item) => item.dataId === dataId)
    if (!game) {
      toast.error('未找到游戏')
      return
    }
    if (game.status === 'loading') {
      toast.warning('请等待游戏添加完成')
      return
    }
    if (game.status === 'success') {
      toast.warning('游戏已添加')
      return
    }
    setIsLoading(true)
    const newGameList = gameList.map((item) =>
      item.dataId === dataId ? { ...item, status: 'loading' } : item
    )
    setGameList(newGameList)
    toast.promise(
      (async (): Promise<void> => {
        try {
          await ipcInvoke('add-game-to-db', game.dataSource, game.id)
          const newGameList = gameList.map((item) =>
            item.dataId === dataId ? { ...item, status: 'success' } : item
          )
          setGameList(newGameList)
          setIsLoading(false)
        } catch (error) {
          const newGameList = gameList.map((item) =>
            item.dataId === dataId ? { ...item, status: 'error' } : item
          )
          setGameList(newGameList)
          setIsLoading(false)
        }
      })(),
      {
        loading: `添加 ${game.name} 中...`,
        success: `添加 ${game.name} 成功`,
        error: (err) => `添加 ${game.name} 失败: ${err.message}`
      }
    )
  }
  async function addAllGames(): Promise<void> {
    gameList.forEach((game) => {
      addOneGame(game.dataId)
    })
  }
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn('w-[300px]', '3xl:w-[350px]')}>数据源</TableHead>
            <TableHead className={cn('w-[300px]', '3xl:w-[350px]')}>游戏名称</TableHead>
            <TableHead className={cn('w-[150px]', '3xl:w-[200px]')}>游戏ID</TableHead>
            <TableHead className={cn('w-[150px]', '3xl:w-[200px]')}>状态</TableHead>
            <TableHead className={cn('w-[150px]', '3xl:w-[200px]')}>操作</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      <Table>
        <TableBody>
          <div className={cn('overflow-auto h-[466px] w-full scrollbar-base', '3xl:h-[712px]')}>
            {gameList.map((game) => (
              <TableRow key={game.dataId}>
                <TableCell>
                  <Select
                    onValueChange={(e) => {
                      const newGameList = gameList.map((item) =>
                        item.dataId === game.dataId
                          ? { ...item, dataSource: e as DataSource }
                          : item
                      )
                      setGameList(newGameList)
                    }}
                    value={game.dataSource}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>数据来源</SelectLabel>
                        <SelectItem value="vndb">VNDB</SelectItem>
                        <SelectItem value="igdb">IGDB</SelectItem>
                        <SelectItem value="steam">Steam</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={game.name}
                    onChange={(e) => {
                      const newGameList = gameList.map((item) =>
                        item.dataId === game.dataId ? { ...item, name: e.target.value } : item
                      )
                      setGameList(newGameList)
                    }}
                    placeholder="请输入游戏名称"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={game.id}
                    onChange={(e) => {
                      const newGameList = gameList.map((item) =>
                        item.dataId === game.dataId ? { ...item, id: e.target.value } : item
                      )
                      setGameList(newGameList)
                    }}
                    placeholder="请输入游戏ID"
                  />
                </TableCell>
                <TableCell>
                  <div className={cn('w-[150px] truncate', '3xl:w-[200px]')}>
                    {game.status === 'loading'
                      ? '加载中...'
                      : game.status === 'success'
                        ? '成功'
                        : game.status === 'error'
                          ? '失败'
                          : '未添加'}
                  </div>
                </TableCell>
                <TableCell>
                  {game.status === 'success' ? (
                    '添加成功'
                  ) : (
                    <div className={cn('flex flex-row gap-2')}>
                      {game.status === 'loading' ? (
                        <Button disabled onClick={() => addOneGame(game.dataId)}>
                          <Loader2 className="animate-spin" />
                          添加
                        </Button>
                      ) : (
                        <Button onClick={() => addOneGame(game.dataId)}>
                          {game.status === 'error' ? '重试' : '添加'}
                        </Button>
                      )}
                      <Button
                        variant={'outline'}
                        onClick={() => {
                          const newGameList = gameList.filter((item) => item.dataId !== game.dataId)
                          setGameList(newGameList)
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </div>
        </TableBody>
      </Table>
      <div className={cn('flex flex-row-reverse')}>
        {isLoading ? (
          <Button disabled>添加中...</Button>
        ) : (
          <Button onClick={addAllGames}>全部添加</Button>
        )}
      </div>
    </div>
  )
}
