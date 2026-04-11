import { ScrollArea } from '@ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { About } from './About'
import { Advanced } from './Advanced'
import { Appearances } from './Appearances/main'
import { CloudSync } from './CloudSync'
import { Database } from './Database'
import { General } from './General'
import { Hotkeys } from './Hotkeys'
import { Metadata } from './Metadata'
import { Network } from './Network'
import { Scraper } from './Scraper'
import { ConfigTab, useConfigTabStore } from './store'
import { Theme } from './Theme'

export function Config({ className }: { className?: string }): React.JSX.Element {
  const { t } = useTranslation('config')
  const tab = useConfigTabStore((state) => state.lastConfigTab)
  const setTab = useConfigTabStore((state) => state.setLastConfigTab)

  return (
    <div className={cn('w-full h-full bg-transparent', className)}>
      <ScrollArea className={cn('w-full h-full')}>
        <div className={cn('flex flex-col gap-6 py-[34px] px-6')}>
          <div className={cn('text-2xl font-bold')}>{t('title')}</div>

          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as ConfigTab)}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="general">{t('general.title')}</TabsTrigger>
              <TabsTrigger value="appearances">{t('appearances.title')}</TabsTrigger>
              <TabsTrigger value="advanced">{t('advanced.title')}</TabsTrigger>
              <TabsTrigger value="metadata">{t('metadata.title')}</TabsTrigger>
              <TabsTrigger value="theme">{t('theme.title')}</TabsTrigger>
              <TabsTrigger value="hotkeys">{t('hotkeys.title')}</TabsTrigger>
              <TabsTrigger value="cloudSync">{t('cloudSync.title')}</TabsTrigger>
              <TabsTrigger value="scraper">{t('scraper.title')}</TabsTrigger>
              <TabsTrigger value="database">{t('database.title')}</TabsTrigger>
              <TabsTrigger value="network">{t('network.title')}</TabsTrigger>
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

            <TabsContent value="metadata">
              <Metadata />
            </TabsContent>

            <TabsContent value="theme">
              <Theme />
            </TabsContent>

            <TabsContent value="hotkeys">
              <Hotkeys />
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

            <TabsContent value="network">
              <Network />
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
