import { cn } from '~/utils'
import { useFilterStore } from '~/components/Librarybar/Filter/store'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function FilterAdder({
  field,
  value,
  className
}: {
  field: string
  value: string
  className?: string
}): React.JSX.Element {
  const { filter, addFilter, updateFilter } = useFilterStore()
  const { t } = useTranslation('game')
  return (
    <button
      className={cn(
        'py-[1px] px-[4px] bg-accent/50 cursor-pointer rounded-lg text-xs text-accent-foreground hover:text-accent-foreground hover:bg-accent',
        className
      )}
      onClick={() => {
        if (field === 'metadata.releaseDate') {
          updateFilter(field, [value, value])
        } else {
          if (!filter[field]?.includes(value)) {
            addFilter(field, value)
          }
        }
        toast.info(t('detail.filter.added', { field: field, value }))
      }}
    >
      {value}
    </button>
  )
}
