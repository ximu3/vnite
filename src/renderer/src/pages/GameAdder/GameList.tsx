import { cn } from '~/utils'
import { Card, CardContent } from '@ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { toast } from 'sonner'
import { useGameAdderStore } from './store'
import { Search } from './Search'

export function List(): JSX.Element {
  const { setName, id, setId, gameList } = useGameAdderStore()
  return (
    <div className={cn('w-[726px] h-[750px] p-3', '3xl:w-[876px] 3xl:h-[1000px]')}>
      <div className={cn('flex flex-col w-full h-full gap-3')}>
        <Card className={cn('grow pt-3')}>
          <CardContent className="h-full">
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={cn('w-[300px]', '3xl:w-[350px]')}>游戏名称</TableHead>
                    <TableHead className={cn('w-[150px]', '3xl:w-[200px]')}>发行日期</TableHead>
                    <TableHead className={cn('w-[150px]', '3xl:w-[200px]')}>开发商</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              <Table>
                <TableBody>
                  <div
                    className={cn('overflow-auto h-[466px] w-full scrollbar-base', '3xl:h-[712px]')}
                  >
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
                            {game.releaseDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn('w-[150px] truncate', '3xl:w-[200px]')}>
                            {game.developers.join(', ')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </div>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <Search className={cn('w-full p-3 text-sm')} />
        </Card>
      </div>
    </div>
  )
}
