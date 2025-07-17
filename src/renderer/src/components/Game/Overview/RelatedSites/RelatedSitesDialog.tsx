import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'

export function RelatedSitesDialog({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [relatedSites, setRelatedSites, saveRelatedSites] = useGameState(
    gameId,
    'metadata.relatedSites',
    true
  )

  return (
    <Dialog>
      <DialogTrigger>
        <span
          className={cn('invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline]')}
        ></span>
      </DialogTrigger>
      <DialogContent className={cn('max-w-none flex flex-col gap-3 w-[700px]')}>
        <Button
          variant="outline"
          onClick={() => {
            setRelatedSites([...relatedSites, { label: '', url: '' }])
          }}
          className={cn('w-[fit-content] ml-3')}
        >
          {t('detail.overview.relatedSites.addLink')}
        </Button>
        <div className={cn('flex flex-col gap-3 grow p-3 overflow-auto scrollbar-base')}>
          {relatedSites.map((site, i) => (
            <div key={i} className={cn('flex flex-row gap-3')}>
              <Input
                value={site.label}
                className={cn('w-1/4')}
                onChange={(e) => {
                  setRelatedSites(
                    relatedSites.map((item, index) => {
                      if (index === i) {
                        return { ...item, label: e.target.value }
                      }
                      return item
                    })
                  )
                }}
                onBlur={saveRelatedSites}
                placeholder={t('detail.overview.relatedSites.nameLabel')}
              />
              <Input
                value={site.url}
                onChange={(e) => {
                  setRelatedSites(
                    relatedSites.map((item, index) => {
                      if (index === i) {
                        return { ...item, url: e.target.value }
                      }
                      return item
                    })
                  )
                }}
                placeholder={t('detail.overview.relatedSites.urlLabel')}
                onBlur={saveRelatedSites}
              />
              <div className={cn('flex flex-row gap-2 grow')}>
                <Button
                  variant="outline"
                  size={'icon'}
                  disabled={i === 0}
                  onClick={() => {
                    if (i === 0) return
                    const newRelatedSites = [...relatedSites]
                    const temp = newRelatedSites[i]
                    newRelatedSites[i] = newRelatedSites[i - 1]
                    newRelatedSites[i - 1] = temp
                    setRelatedSites(newRelatedSites)
                  }}
                >
                  <span className={cn('icon-[mdi--keyboard-arrow-up] w-4 h-4')}></span>
                </Button>
                <Button
                  variant="outline"
                  size={'icon'}
                  disabled={i === relatedSites.length - 1}
                  onClick={() => {
                    if (i === relatedSites.length - 1) return
                    const newRelatedSites = [...relatedSites]
                    const temp = newRelatedSites[i]
                    newRelatedSites[i] = newRelatedSites[i + 1]
                    newRelatedSites[i + 1] = temp
                    setRelatedSites(newRelatedSites)
                  }}
                >
                  <span className={cn('icon-[mdi--keyboard-arrow-down] w-4 h-4')}></span>
                </Button>
                <Button
                  variant="outline"
                  size={'icon'}
                  className={cn('hover:bg-destructive hover:text-destructive-foreground')}
                  onClick={() => {
                    const newRelatedSites = [...relatedSites]
                    newRelatedSites.splice(i, 1)
                    setRelatedSites(newRelatedSites)
                  }}
                >
                  <span className={cn('icon-[mdi--delete-outline] w-4 h-4')}></span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
