import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { TransformerRule } from './types'
import { useTranslation } from 'react-i18next'

interface DeleteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transformer: TransformerRule | null
  onConfirm: () => void
}

export function DeleteDialog({
  isOpen,
  onOpenChange,
  transformer,
  onConfirm
}: DeleteDialogProps): React.JSX.Element {
  const { t } = useTranslation('transformer')

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteDialog.confirmMessage', { name: transformer?.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t('deleteDialog.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
