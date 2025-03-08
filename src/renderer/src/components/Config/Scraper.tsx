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
    'game.scraper.defaultDatasSource'
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
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-5 justify-center')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('grow')}>{t('scraper.defaultDataSource')}</div>
            <Select value={defaultDataSource} onValueChange={setDefaultDataSource}>
              <SelectTrigger className={cn('w-[200px]')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('scraper.defaultDataSource')}</SelectLabel>
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
      </CardContent>
    </Card>
  )
}
