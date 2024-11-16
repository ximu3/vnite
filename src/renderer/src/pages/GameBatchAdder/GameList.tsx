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
import { Badge } from '@ui/badge'
import { Input } from '@ui/input'
import { toast } from 'sonner'
import { useGameBatchAdderStore, DataSource } from './store'

type GameList = {
  id: string
  name: string
  releaseDate: string
  developers: string[]
}[]

export function GameList(): JSX.Element {
  const { gameList, setGameList, setIsLoading, isLoading } = useGameBatchAdderStore()
  async function addOneGame(
    dataId: string,
    newGameList?: typeof gameList
  ): Promise<typeof gameList> {
    const game = gameList.find((item) => item.dataId === dataId)
    if (!newGameList) {
      newGameList = gameList
    }

    if (!game) {
      toast.error('未找到游戏')
      return newGameList
    }

    if (game.status === 'loading') {
      toast.warning('请等待游戏添加完成')
      return newGameList
    }

    if (game.status === 'success') {
      toast.warning('游戏已添加')
      return newGameList
    }

    setIsLoading(true)

    newGameList = newGameList.map((item) =>
      item.dataId === dataId ? { ...item, status: 'loading' } : item
    )
    setGameList(newGameList)

    let gameId: string = game.id

    try {
      if (!gameId) {
        const result = (await ipcInvoke('search-games', game.dataSource, game.name)) as GameList
        if (result.length === 0) {
          toast.error(`未找到游戏: ${game.name}`)
          newGameList = newGameList.map((item) =>
            item.dataId === dataId ? { ...item, status: 'error' } : item
          )
          setGameList(newGameList)
          setIsLoading(false)
          return newGameList
        }
        gameId = result[0].id
        newGameList = newGameList.map((item) =>
          item.dataId === dataId ? { ...item, id: gameId } : item
        )
        setGameList(newGameList)
      }

      await ipcInvoke('add-game-to-db', game.dataSource, gameId)
      newGameList = newGameList.map((item) =>
        item.dataId === dataId ? { ...item, status: 'success' } : item
      )
      setGameList(newGameList)

      setIsLoading(false)

      return newGameList
    } catch (error) {
      console.error(error)
      setIsLoading(false)
      newGameList = newGameList.map((item) =>
        item.dataId === dataId ? { ...item, status: 'error' } : item
      )
      setGameList(newGameList)
      throw error
    }
  }
  async function addAllGames(): Promise<void> {
    let newGameList = gameList
    for (const game of gameList) {
      if (game.status === 'success') {
        continue
      }
      try {
        newGameList = await addOneGame(game.dataId, newGameList)
      } catch (error) {
        console.log(error)
      }
    }
  }
  async function addOneGameWithToast(dataId: string): Promise<void> {
    const gameName = gameList.find((item) => item.dataId === dataId)?.name
    toast.promise(
      (async (): Promise<void> => {
        try {
          await addOneGame(dataId)
        } catch (error) {
          console.error(error)
          throw error
        }
      })(),
      {
        loading: `正在添加游戏 ${gameName}...`,
        success: `游戏 ${gameName} 添加成功`,
        error: `游戏 ${gameName} 添加失败`
      }
    )
  }
  async function addAllGamesWithToast(): Promise<void> {
    toast.promise(
      (async (): Promise<void> => {
        try {
          await addAllGames()
        } catch (error) {
          console.error(error)
          throw error
        }
      })(),
      {
        loading: '正在添加游戏...',
        success: '添加游戏成功',
        error: '添加游戏失败'
      }
    )
  }
  return (
    <div className="w-[870px] h-[670px]">
      <div className={cn('py-[10px]')}>
        <Table className={cn('')}>
          <TableHeader>
            <TableRow>
              <TableHead className={cn('w-[150px]', '3xl:w-[350px]')}>数据源</TableHead>
              <TableHead className={cn('w-[300px]', '3xl:w-[350px]')}>游戏名称</TableHead>
              <TableHead className={cn('w-[150px]', '3xl:w-[200px]')}>游戏ID</TableHead>
              <TableHead className={cn('w-[120px]', '3xl:w-[200px]')}>状态</TableHead>
              <TableHead className={cn('w-[150px]', '3xl:w-[200px]')}>操作</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <Table>
          <TableBody>
            <div className={cn('overflow-auto h-[570px] scrollbar-base', '3xl:h-[712px]')}>
              {gameList.map((game) => (
                <TableRow key={game.dataId}>
                  <TableCell className={cn('w-[150px]')}>
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
                  <TableCell className={cn('w-[300px]')}>
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
                  <TableCell className={cn('w-[150px]')}>
                    <Input
                      value={game.id}
                      onChange={(e) => {
                        const newGameList = gameList.map((item) =>
                          item.dataId === game.dataId ? { ...item, id: e.target.value } : item
                        )
                        setGameList(newGameList)
                      }}
                      placeholder="游戏ID(可选)"
                    />
                  </TableCell>
                  <TableCell className={cn('w-[120px]')}>
                    <div>
                      {game.status === 'loading' ? (
                        <Badge>正在添加</Badge>
                      ) : game.status === 'success' ? (
                        <Badge variant="default">添加成功</Badge>
                      ) : game.status === 'error' ? (
                        <Badge variant="destructive">添加失败</Badge>
                      ) : (
                        <Badge variant="outline">等待添加</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={cn('w-[150px]')}>
                    {game.status === 'success' ? (
                      <div className={cn('flex flex-row gap-2')}>
                        <Button disabled onClick={() => addOneGameWithToast(game.dataId)}>
                          添加
                        </Button>
                        <Button
                          disabled
                          variant={'outline'}
                          onClick={() => {
                            const newGameList = gameList.filter(
                              (item) => item.dataId !== game.dataId
                            )
                            setGameList(newGameList)
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    ) : (
                      <div className={cn('flex flex-row gap-2')}>
                        {game.status === 'loading' ? (
                          <Button disabled>添加</Button>
                        ) : (
                          <Button onClick={() => addOneGameWithToast(game.dataId)}>
                            {game.status === 'error' ? '重试' : '添加'}
                          </Button>
                        )}
                        <Button
                          variant={'outline'}
                          onClick={() => {
                            const newGameList = gameList.filter(
                              (item) => item.dataId !== game.dataId
                            )
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
        <div className={cn('flex flex-row-reverse pt-[20px]')}>
          {isLoading ? (
            <Button disabled>添加中...</Button>
          ) : (
            <Button onClick={addAllGamesWithToast}>全部添加</Button>
          )}
        </div>
      </div>
    </div>
  )
}
