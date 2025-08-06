import { cn } from '~/utils'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { GameInformationList } from '@appTypes/utils'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

interface SearchInformationDialogProps {
  isOpen: boolean
  onClose: () => void
  gameTitle: string
  onSelect: (information: {
    name?: string
    originalName?: string
    releaseDate?: string
    developers?: string[]
    publishers?: string[]
    genres?: string[]
    platforms?: string[]
  }) => void
  initialInformation?: {
    name?: string
    originalName?: string
    releaseDate?: string
    developers?: string[]
    publishers?: string[]
    genres?: string[]
    platforms?: string[]
  }
}

export function SearchInformationDialog({
  isOpen,
  onClose,
  gameTitle,
  onSelect,
  initialInformation = {}
}: SearchInformationDialogProps): React.JSX.Element {
  const { t } = useTranslation('game')
  const [searchTitle, setSearchTitle] = useState(gameTitle)
  const [informationList, setInformationList] = useState<GameInformationList>([])
  const [selectedInformation, setSelectedInformation] = useState(initialInformation)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSearchTitle(gameTitle)
  }, [gameTitle])

  useEffect(() => {
    if (isOpen) {
      toast.promise(handleSearch(), {
        loading: t('detail.overview.information.search.loading'),
        success: t('detail.overview.information.search.success'),
        error: (err) => t('detail.overview.information.search.error', { message: err.message })
      })
    }
    setInformationList([])
  }, [isOpen, t])

  useEffect(() => {
    // Set initial selected information when dialog opens
    if (isOpen && initialInformation) {
      setSelectedInformation(initialInformation)
    }
  }, [isOpen, initialInformation])

  async function handleSearch(): Promise<void> {
    if (isLoading) return
    setIsLoading(true)

    try {
      const result = await ipcManager.invoke('scraper:get-game-information-list', {
        type: 'name',
        value: searchTitle
      })

      if (!result || result.length === 0) {
        toast.error(t('detail.overview.information.search.notFound'))
        return
      }

      setInformationList(result)
    } catch (error) {
      toast.error(t('detail.overview.information.search.searchError', { error }))
    } finally {
      setIsLoading(false)
    }
  }

  function handleFieldSelect(field: string, value: string | string[]): void {
    setSelectedInformation((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  function handleConfirm(): void {
    onSelect(selectedInformation)
    handleClose()
  }

  function handleClose(): void {
    setSelectedInformation(initialInformation)
    setSearchTitle(gameTitle)
    onClose()
  }

  function isFieldSelected(field: string, value: string | string[]): boolean {
    const currentValue = selectedInformation[field as keyof typeof selectedInformation]
    if (Array.isArray(value)) {
      return Array.isArray(currentValue) && JSON.stringify(currentValue) === JSON.stringify(value)
    } else {
      return currentValue === value
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className={cn('w-[50vw] h-[80vh] max-w-none flex flex-col gap-3')}
      >
        {/* Information List */}
        <Card className={cn('p-3 w-full h-full scrollbar-base overflow-auto')}>
          {informationList.length > 0 ? (
            <div className="space-y-4">
              {informationList.map((source) => (
                <Card key={source.dataSource} className="rounded-lg p-4 shadow-xs">
                  <div className="">
                    <Badge className="">{source.dataSource}</Badge>
                  </div>
                  <div className="space-y-3">
                    {/* Basic Information */}
                    {source.information.name && (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {t('detail.overview.information.fields.localizedName')}
                        </div>
                        <div
                          className={cn(
                            'text-xs cursor-pointer rounded px-2 py-1 inline-block',
                            isFieldSelected('name', source.information.name)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted'
                          )}
                          onClick={() => handleFieldSelect('name', source.information.name!)}
                        >
                          {source.information.name}
                        </div>
                      </div>
                    )}

                    {source.information.originalName && (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {t('detail.overview.information.fields.originalName')}
                        </div>
                        <div
                          className={cn(
                            'text-xs cursor-pointer rounded px-2 py-1 inline-block',
                            isFieldSelected('originalName', source.information.originalName)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted'
                          )}
                          onClick={() =>
                            handleFieldSelect('originalName', source.information.originalName!)
                          }
                        >
                          {source.information.originalName}
                        </div>
                      </div>
                    )}

                    {source.information.releaseDate && (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {t('detail.overview.information.fields.releaseDate')}
                        </div>
                        <div
                          className={cn(
                            'text-xs cursor-pointer rounded px-2 py-1 inline-block',
                            isFieldSelected('releaseDate', source.information.releaseDate)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted'
                          )}
                          onClick={() =>
                            handleFieldSelect('releaseDate', source.information.releaseDate!)
                          }
                        >
                          {source.information.releaseDate}
                        </div>
                      </div>
                    )}

                    {/* Array Fields */}
                    {source.information.developers && source.information.developers.length > 0 && (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {t('detail.overview.information.fields.developers')}
                        </div>
                        <div
                          className={cn(
                            'text-xs cursor-pointer rounded px-2 py-1 inline-block',
                            isFieldSelected('developers', source.information.developers)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted'
                          )}
                          onClick={() =>
                            handleFieldSelect('developers', source.information.developers!)
                          }
                        >
                          {source.information.developers.join(', ')}
                        </div>
                      </div>
                    )}

                    {source.information.publishers && source.information.publishers.length > 0 && (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {t('detail.overview.information.fields.publishers')}
                        </div>
                        <div
                          className={cn(
                            'text-xs cursor-pointer rounded px-2 py-1 inline-block',
                            isFieldSelected('publishers', source.information.publishers)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted'
                          )}
                          onClick={() =>
                            handleFieldSelect('publishers', source.information.publishers!)
                          }
                        >
                          {source.information.publishers.join(', ')}
                        </div>
                      </div>
                    )}

                    {source.information.genres && source.information.genres.length > 0 && (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {t('detail.overview.information.fields.genres')}
                        </div>
                        <div
                          className={cn(
                            'text-xs cursor-pointer rounded px-2 py-1 inline-block',
                            isFieldSelected('genres', source.information.genres)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted'
                          )}
                          onClick={() => handleFieldSelect('genres', source.information.genres!)}
                        >
                          {source.information.genres.join(', ')}
                        </div>
                      </div>
                    )}

                    {source.information.platforms && source.information.platforms.length > 0 && (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {t('detail.overview.information.fields.platforms')}
                        </div>
                        <div
                          className={cn(
                            'text-xs cursor-pointer rounded px-2 py-1 inline-block',
                            isFieldSelected('platforms', source.information.platforms)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted'
                          )}
                          onClick={() =>
                            handleFieldSelect('platforms', source.information.platforms!)
                          }
                        >
                          {source.information.platforms.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('detail.overview.information.empty')}
            </div>
          )}
        </Card>

        {/* Search and Action Buttons */}
        <Card className={cn('p-3')}>
          <div className={cn('flex flex-row gap-3')}>
            <Input
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder={t('detail.overview.search.placeholder')}
              className={cn('flex-grow')}
            />
            <Button
              onClick={() => {
                toast.promise(handleSearch(), {
                  loading: t('detail.overview.information.search.loading'),
                  success: t('detail.overview.information.search.success'),
                  error: (err) =>
                    t('detail.overview.information.search.error', { message: err.message })
                })
              }}
              size={'icon'}
              className={cn('shrink-0')}
              disabled={isLoading}
            >
              <span className={cn('icon-[mdi--magnify] w-[20px] h-[20px]')}></span>
            </Button>
            <Button onClick={handleConfirm}>{t('utils:common.confirm')}</Button>
            <Button variant="outline" onClick={handleClose}>
              {t('utils:common.cancel')}
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
