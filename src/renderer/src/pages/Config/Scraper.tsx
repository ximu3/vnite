import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfigItem } from '~/components/form/ConfigItem'
import { useTranslation } from 'react-i18next'

export function Scraper(): React.JSX.Element {
  const { t } = useTranslation('config')

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
                description="选择默认的数据源"
                options={[
                  { value: 'steam', label: t('scraper.dataSources.steam') },
                  { value: 'vndb', label: t('scraper.dataSources.vndb') },
                  { value: 'bangumi', label: t('scraper.dataSources.bangumi') },
                  { value: 'igdb', label: t('scraper.dataSources.igdb') },
                  { value: 'ymgal', label: t('scraper.dataSources.ymgal') },
                  { value: 'dlsite', label: t('scraper.dataSources.dlsite') }
                ]}
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
                description="选择 VNDB 标签的剧透级别"
                options={[
                  { value: 0, label: t('scraper.vndb.tagSpoilerLevels.none') },
                  { value: 1, label: t('scraper.vndb.tagSpoilerLevels.minor') },
                  { value: 2, label: t('scraper.vndb.tagSpoilerLevels.all') }
                ]}
                controlClassName="w-[200px]"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
