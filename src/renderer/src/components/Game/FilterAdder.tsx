import { Button } from '@ui/button'
import { cn } from '~/utils'
import { useFilterStore } from '~/components/Librarybar/Filter/store'
import { toast } from 'sonner'

export function FilterAdder({
  filed,
  value,
  className
}: {
  filed: string
  value: string
  className?: string
}): JSX.Element {
  const { addFilter, updateFilter } = useFilterStore()
  return (
    <Button
      variant="link"
      className={cn(
        'p-0 m-0 -mt-2 -mb-2 hover:text-primary/90 transition-none hover:no-underline leading-none',
        className
      )}
      onClick={() => {
        if (filed === 'releaseDate') {
          updateFilter(filed, [value, value])
        } else {
          addFilter(filed, value)
        }
        toast.info(`已添加筛选器，${filed}: ${value}`)
      }}
    >
      {value}
    </Button>
  )
}
