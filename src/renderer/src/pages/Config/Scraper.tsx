import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { useConfigState } from '~/hooks'
import { useTranslation } from 'react-i18next'

export function Scraper(): JSX.Element {
  const { t } = useTranslation('config')

  const [defaultDataSource, setDefaultDataSource] = useConfigState(
    'game.scraper.common.defaultDataSource'
  )

  const [vndbTagSpoilerLevel, setVndbTagSpoilerLevel] = useConfigState(
    'game.scraper.vndb.tagSpoilerLevel'
  )

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
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('scraper.common.defaultDataSource')}
                </div>
                <Select value={defaultDataSource} onValueChange={setDefaultDataSource}>
                  <SelectTrigger className={cn('w-[200px]')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('scraper.common.defaultDataSource')}</SelectLabel>
                      <SelectItem value="steam">{t('scraper.dataSources.steam')}</SelectItem>
                      <SelectItem value="vndb">{t('scraper.dataSources.vndb')}</SelectItem>
                      <SelectItem value="bangumi">{t('scraper.dataSources.bangumi')}</SelectItem>
                      <SelectItem value="igdb">{t('scraper.dataSources.igdb')}</SelectItem>
                      <SelectItem value="ymgal">{t('scraper.dataSources.ymgal')}</SelectItem>
                      <SelectItem value="dlsite">{t('scraper.dataSources.dlsite')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* VNDB Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('scraper.vndb.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('scraper.vndb.tagSpoilerLevel')}
                </div>
                <Select
                  value={vndbTagSpoilerLevel.toString()}
                  onValueChange={(value) => {
                    setVndbTagSpoilerLevel(parseInt(value) as 0 | 1 | 2)
                  }}
                >
                  <SelectTrigger className={cn('w-[200px]')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('scraper.vndb.tagSpoilerLevel')}</SelectLabel>
                      <SelectItem value="0">{t('scraper.vndb.tagSpoilerLevels.none')}</SelectItem>
                      <SelectItem value="1">{t('scraper.vndb.tagSpoilerLevels.minor')}</SelectItem>
                      <SelectItem value="2">{t('scraper.vndb.tagSpoilerLevels.all')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
