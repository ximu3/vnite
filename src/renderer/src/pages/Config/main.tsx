import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { ScrollArea } from '@ui/scroll-area'
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

export function Config({ className }: { className?: string }): JSX.Element {
  const { t } = useTranslation('config')

  return (
    <div className={cn('w-full h-full bg-background/60 shadow-inner', className)}>
      <ScrollArea className={cn('w-full h-full px-6 pt-0')}>
        <div className={cn('flex flex-col gap-6 pt-[34px]')}>
          <div className={cn('text-2xl font-bold')}>{t('title')}</div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-8 mb-4">
              <TabsTrigger value="general">{t('general.title')}</TabsTrigger>
              <TabsTrigger value="appearances">{t('appearances.title')}</TabsTrigger>
              <TabsTrigger value="advanced">{t('advanced.title')}</TabsTrigger>
              <TabsTrigger value="theme">{t('theme.title')}</TabsTrigger>
              <TabsTrigger value="cloudSync">{t('cloudSync.title')}</TabsTrigger>
              <TabsTrigger value="scraper">{t('scraper.title')}</TabsTrigger>
              <TabsTrigger value="database">{t('database.title')}</TabsTrigger>
              <TabsTrigger value="about">{t('about.title')}</TabsTrigger>
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
        </div>
      </ScrollArea>
    </div>
  )
}
