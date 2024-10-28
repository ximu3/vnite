import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { cn } from '~/utils'
import { Launcher } from './Launcher'
import { Path } from './Path'

export function AttributesDialog({
  gameId,
  children
}: {
  gameId: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <Dialog>
      <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>
      <DialogContent className={cn('w-[1000px] h-[700px] max-w-none')}>
        <Tabs defaultValue="launcher" className={cn('w-full')}>
          <TabsList className={cn('w-[250px]')}>
            <TabsTrigger className={cn('w-1/3')} value="launcher">
              运行
            </TabsTrigger>
            <TabsTrigger className={cn('w-1/3')} value="path">
              路径
            </TabsTrigger>
            <TabsTrigger className={cn('w-1/3')} value="save">
              存档
            </TabsTrigger>
          </TabsList>
          <TabsContent value="launcher">
            <Launcher gameId={gameId} />
          </TabsContent>
          <TabsContent value="path">
            <Path gameId={gameId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
