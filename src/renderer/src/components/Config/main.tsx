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
import { useTranslation } from 'react-i18next'

export function ConfigDialog({ children }: { children: React.ReactNode }): JSX.Element {
  const { t } = useTranslation('config')
  return (
    <Dialog>
      <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>
      <DialogContent className={cn('w-[1000px] max-h-[770px] h-[90vh] max-w-none flex flex-col')}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className={cn('w-full')}>
          <TabsList className={cn('w-[900px]')}>
            <TabsTrigger className={cn('w-full')} value="general">
              {t('general.title')}
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="appearances">
              {t('appearances.title')}
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="advanced">
              {t('advanced.title')}
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="theme">
              {t('theme.title')}
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="cloudSync">
              {t('cloudSync.title')}
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="scraper">
              {t('scraper.title')}
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="database">
              {t('database.title')}
            </TabsTrigger>
            <TabsTrigger className={cn('w-full')} value="about">
              {t('about.title')}
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
