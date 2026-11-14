import { BatchGameInfo } from '@appTypes/models'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'

export function StatusBadge({ status }: { status: BatchGameInfo['status'] }): React.JSX.Element {
  const { t } = useTranslation('adder')

  switch (status) {
    case 'review':
      return <Badge variant="secondary">{t('gameBatchAdder.status.review')}</Badge>
    case 'loading':
      return <Badge variant="secondary">{t('gameBatchAdder.status.loading')}</Badge>
    case 'success':
      return <Badge variant="default">{t('gameBatchAdder.status.success')}</Badge>
    case 'error':
      return <Badge variant="destructive">{t('gameBatchAdder.status.error')}</Badge>
    case 'existed':
      return <Badge variant="default">{t('gameBatchAdder.status.existed')}</Badge>
    default:
      return <Badge variant="outline">{t('gameBatchAdder.status.waiting')}</Badge>
  }
}
