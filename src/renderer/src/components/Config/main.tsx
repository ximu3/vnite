import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { cn } from '~/utils'
import { Database } from './Database'
import { CloudSync } from './CloudSync'
import { General } from './General'
import { Advanced } from './Advanced'
import { About } from './About'
import { Scraper } from './Scraper'
import { Theme } from './Theme'
import { Appearances } from './Appearances'

export function ConfigDialog({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <Dialog>
      <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>
      <DialogContent className={cn('w-[1000px] max-h-[730px] h-[90vh] max-w-none flex flex-col')}>
        <DialogHeader>
          <DialogTitle>{`Vnite 设置`}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className={cn('w-full')}>
          <TabsList className={cn('w-[700px]')}>
            <TabsTrigger className={cn('w-full')} value="general">
              通用
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="appearances">
              外观
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="advanced">
              高级
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="theme">
              主题
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="cloudSync">
              云同步
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="scraper">
              刮削器
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="database">
              数据库
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="about">
              关于
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <General />
          </TabsContent>
          <TabsContent value="appearances">
            <Appearances />
          </TabsContent>
          <TabsContent value="advanced">
            <Advanced />
          </TabsContent>
          <TabsContent value="theme">
            <Theme />
          </TabsContent>
          <TabsContent value="cloudSync">
            <CloudSync />
          </TabsContent>
          <TabsContent value="scraper">
            <Scraper />
          </TabsContent>
          <TabsContent value="database">
            <Database />
          </TabsContent>
          <TabsContent value="about">
            <About />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
