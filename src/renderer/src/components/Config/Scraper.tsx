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
      <CardContent>
        <div className={cn('grid grid-cols-[1fr_auto] gap-x-5 gap-y-5 items-center text-sm')}>
          <div className={cn('whitespace-nowrap select-none')}>
            {t('scraper.defaultDataSource')}
          </div>
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
      </CardContent>
    </Card>
  )
}
