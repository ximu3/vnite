import { cn } from '~/utils'
import { Card, CardContent } from '@ui/card'
import { ScrollArea } from '@ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { toast } from 'sonner'
import { useGameAdderStore } from './store'
import { Search } from './Search'

export function GameList(): JSX.Element {
  const { setName, id, setId, gameList } = useGameAdderStore()
  return (
    <div className={cn('w-[726px] h-[84vh] p-3', '3xl:w-[876px]')}>
      <div className={cn('flex flex-col w-full h-full gap-3')}>
        <Card className={cn('grow pt-3')}>
          <CardContent className="h-full">
            <div className="w-full">
              <ScrollArea className={cn('h-[54vh]', '3xl:h-[60vh]', 'sm:h-[48vh]')}>
                <Table>
                  <TableHeader className={cn('bg-card')}>
                    <TableRow>
                      <TableHead className={cn('w-1/2')}>游戏名称</TableHead>
                      <TableHead className={cn('w-1/4')}>发行日期</TableHead>
                      <TableHead className={cn('w-1/4')}>开发商</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameList.map((game) => (
                      <TableRow
                        key={game.name}
                        onClick={() => {
                          setId(game.id)
                          setName(game.name)
                          toast.success(`已选择游戏: ${game.name}`)
                        }}
                        className={cn(
                          'cursor-pointer',
                          game.id === id
                            ? 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground'
                            : ''
                        )}
                      >
                        <TableCell>
                          <div className={cn('w-[300px] truncate', '3xl:w-[350px]')}>
                            {game.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn('w-[150px] truncate', '3xl:w-[200px]')}>
                            {game.releaseDate === '' ? '未知' : game.releaseDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn('w-[150px] truncate', '3xl:w-[200px]')}>
                            {game.developers.join(', ') === ''
                              ? '未知'
                              : game.developers.join(', ')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
        <Card>
          <Search className={cn('w-full p-3 text-sm', '3xl:w-full')} />
        </Card>
      </div>
    </div>
  )
}
