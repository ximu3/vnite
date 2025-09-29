import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfigItem } from '~/components/form/ConfigItem'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { ipcManager } from '~/app/ipc'
import { ScraperCapabilities } from '@appTypes/utils'
import { useConfigState } from '~/hooks'

export function Scraper(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [proxyEnable] = useConfigState('game.scraper.proxy.enable')
  const [availableDataSources, setAvailableDataSources] = useState<
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

          {/* Proxy Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('scraper.proxy.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.proxy.enable"
                title={t('scraper.proxy.enable')}
                controlType="switch"
                description={t('scraper.proxy.enableDescription')}
              />
              {proxyEnable && (
                <ConfigItem
                  hookType="config"
                  path="game.scraper.proxy.enableScrapers"
                  title={t('scraper.proxy.enableScrapers')}
                  controlType="checkboxes"
                  description={t('scraper.proxy.enableScrapersDescription')}
                  values={availableDataSources.map((ds) => ({
                    value: ds.id,
                    label: ds.name
                  }))}
                />
              )}
              {proxyEnable && (
                <ConfigItem
                  hookType="config"
                  path="game.scraper.proxy.protocol"
                  title={t('scraper.proxy.protocol')}
                  controlType="select"
                  description={t('scraper.proxy.protocolDescription')}
                  options={[
                    { value: 'http', label: t('scraper.proxy.protocols.http') },
                    { value: 'https', label: t('scraper.proxy.protocols.https') },
                    { value: 'socks4', label: t('scraper.proxy.protocols.socks4') },
                    { value: 'socks5', label: t('scraper.proxy.protocols.socks5') }
                  ]}
                  controlClassName="w-[200px]"
                />
              )}
              {proxyEnable && (
                <ConfigItem
                  hookType="config"
                  path="game.scraper.proxy.host"
                  title={t('scraper.proxy.host')}
                  controlType="input"
                  inputType="text"
                  description={t('scraper.proxy.hostDescription')}
                  controlClassName="w-[200px]"
                />
              )}
              {proxyEnable && (
                <ConfigItem
                  hookType="config"
                  path="game.scraper.proxy.port"
                  title={t('scraper.proxy.port')}
                  controlType="input"
                  inputType="number"
                  description={t('scraper.proxy.portDescription')}
                  controlClassName="w-[100px]"
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
