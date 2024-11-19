import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { cn } from '~/utils'
import { Database } from './Database'
import { CloudSync } from './CloudSync'
import { General } from './General'
import { Advanced } from './Advanced'

export function ConfigDialog({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <Dialog>
      <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>
      <DialogContent className={cn('w-[1000px] h-[730px] max-w-none flex flex-col')}>
        <DialogHeader>
          <DialogTitle>{`Vnite 设置`}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className={cn('w-full')}>
          <TabsList className={cn('w-[330px]')}>
            <TabsTrigger className={cn('w-1/4')} value="general">
              通用
            </TabsTrigger>
            <TabsTrigger className={cn('w-1/4')} value="advanced">
              高级
            </TabsTrigger>
            <TabsTrigger className={cn('w-1/4')} value="cloudSync">
              云同步
            </TabsTrigger>
            <TabsTrigger className={cn('w-1/4')} value="database">
              数据库
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <General />
          </TabsContent>
          <TabsContent value="advanced">
            <Advanced />
          </TabsContent>
          <TabsContent value="cloudSync">
            <CloudSync />
          </TabsContent>
          <TabsContent value="database">
            <Database />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}