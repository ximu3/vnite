import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'

function normalizeItemsPerPageOptions(
  itemsPerPageOptions: number[],
  itemsPerPage: number
): number[] {
  return [...new Set([...itemsPerPageOptions, itemsPerPage])].sort((a, b) => a - b)
}

export function MemoryPaginationBar({
  currentPage,
  totalPages,
  itemsPerPage,
  itemsPerPageOptions,
  onPageChange,
  onItemsPerPageChange
}: {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  itemsPerPageOptions: number[]
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const normalizedItemsPerPageOptions = normalizeItemsPerPageOptions(
    itemsPerPageOptions,
    itemsPerPage
  )

  function navigateTo(page: number): (event: React.MouseEvent<HTMLAnchorElement>) => void {
    return (event): void => {
      event.preventDefault()

      const targetPage = Math.min(Math.max(page, 1), totalPages)
      if (targetPage === currentPage) return

      onPageChange(targetPage)
    }
  }

  function renderIconLink({
    page,
    icon,
    title,
    disabled
  }: {
    page: number
    icon: React.JSX.Element
    title: string
    disabled: boolean
  }): React.JSX.Element {
    return (
      <PaginationItem>
        <PaginationLink
          href="#"
          title={title}
          size="icon"
          className={cn('size-8', disabled && 'pointer-events-none opacity-50')}
          onClick={navigateTo(page)}
        >
          {icon}
        </PaginationLink>
      </PaginationItem>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center justify-center gap-3')}>
      <Pagination className={cn('mx-0 w-auto min-w-0 flex-none justify-start')}>
        <PaginationContent className={cn('min-w-0 flex-nowrap')}>
          {renderIconLink({
            page: 1,
            icon: <ChevronsLeftIcon className={cn('size-4')} />,
            title: t('detail.memory.pagination.first'),
            disabled: currentPage <= 1
          })}
          {renderIconLink({
            page: currentPage - 1,
            icon: <ChevronLeftIcon className={cn('size-4')} />,
            title: t('detail.memory.pagination.previous'),
            disabled: currentPage <= 1
          })}

          <PaginationItem>
            <div
              className={cn(
                'flex h-8 min-w-[3.5rem] items-center justify-center px-2 text-xs tabular-nums text-muted-foreground'
              )}
            >
              {currentPage} / {totalPages}
            </div>
          </PaginationItem>

          {renderIconLink({
            page: currentPage + 1,
            icon: <ChevronRightIcon className={cn('size-4')} />,
            title: t('detail.memory.pagination.next'),
            disabled: currentPage >= totalPages
          })}
          {renderIconLink({
            page: totalPages,
            icon: <ChevronsRightIcon className={cn('size-4')} />,
            title: t('detail.memory.pagination.last'),
            disabled: currentPage >= totalPages
          })}
        </PaginationContent>
      </Pagination>

      <Select
        value={String(itemsPerPage)}
        onValueChange={(value) => onItemsPerPageChange(Number(value))}
      >
        <SelectTrigger size="sm" className={cn('h-8 w-[3.5rem] shrink-0 text-xs')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {normalizedItemsPerPageOptions.map((option) => (
            <SelectItem key={`memory-items-per-page-${option}`} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
