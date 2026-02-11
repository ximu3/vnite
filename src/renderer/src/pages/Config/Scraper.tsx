import { ScraperCapabilities } from '@appTypes/utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'
import { ConfigItem } from '~/components/form/ConfigItem'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/utils'

export function Scraper(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [availableDataSources, setAvailableDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])
  const [availableMediaDataSources, setAvailableMediaDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])

  useEffect(() => {
    const fetchAvailableDataSources = async (): Promise<void> => {
      const availableDataSources = await ipcManager.invoke(
        'scraper:get-provider-infos-with-capabilities',
        ['searchGames', 'checkGameExists', 'getGameMetadata', 'getGameBackgrounds', 'getGameCovers']
      )
      setAvailableDataSources(availableDataSources)
    }
    fetchAvailableDataSources()
  }, [])

  useEffect(() => {
    const fetchAvailableMediaDataSources = async (): Promise<void> => {
      const availableDataSources = await ipcManager.invoke(
        'scraper:get-provider-infos-with-capabilities',
        ['getGameCovers', 'getGameIcons', 'getGameLogos', 'getGameBackgrounds'],
        false
      )
      setAvailableMediaDataSources(availableDataSources)
    }
    fetchAvailableMediaDataSources()
  }, [])

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('scraper.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-8')}>
          {/* General Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('scraper.common.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.common.defaultDataSource"
                title={t('scraper.common.defaultDataSource')}
                controlType="select"
                description={t('scraper.common.defaultDataSourceDescription')}
                options={availableDataSources.map((ds) => ({
                  value: ds.id,
                  label: ds.name
                }))}
                controlClassName="w-[200px]"
              />
            </div>

            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.common.defaultMediaDataSource"
                title={t('scraper.common.defaultMediaDataSource')}
                controlType="select"
                description={t('scraper.common.defaultMediaDataSourceDescription')}
                options={availableMediaDataSources.map((ds) => ({
                  value: ds.id,
                  label: ds.name
                }))}
                controlClassName="w-[200px]"
              />
            </div>
          </div>

          {/* VNDB Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('scraper.vndb.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.vndb.tagSpoilerLevel"
                title={t('scraper.vndb.tagSpoilerLevel')}
                controlType="select"
                description={t('scraper.vndb.tagSpoilerLevelDescription')}
                options={[
                  { value: 0, label: t('scraper.vndb.tagSpoilerLevels.none') },
                  { value: 1, label: t('scraper.vndb.tagSpoilerLevels.minor') },
                  { value: 2, label: t('scraper.vndb.tagSpoilerLevels.all') }
                ]}
                controlClassName="w-[200px]"
              />
            </div>
          </div>

          {/* DLSite Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('scraper.dlsite.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.dlsite.findIdInName"
                title={t('scraper.dlsite.findIdInName')}
                controlType="switch"
                description={t('scraper.dlsite.findIdInNameDescription')}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
