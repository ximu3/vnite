import { cn } from '~/utils'
import { useFilterStore } from '~/components/Librarybar/Filter/store'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function FilterAdder({
  filed,
  value,
  className
}: {
  filed: string
  value: string
  className?: string
}): JSX.Element {
  const { filter, addFilter, updateFilter } = useFilterStore()
  const { t } = useTranslation('game')
  return (
    <button
      className={cn(
        'py-[1px] px-[4px] bg-accent/70 rounded-lg text-xs text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent',
        className
      )}
      onClick={() => {
        if (filed === 'metadata.releaseDate') {
          updateFilter(filed, [value, value])
        } else {
          if (!filter[filed]?.includes(value)) {
            addFilter(filed, value)
          }
        }
        toast.info(t('detail.filter.added', { field: filed, value }))
      }}
    >
      {value}
    </button>
  )
}
