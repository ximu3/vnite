import { useTranslation } from 'react-i18next'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'
import { ArrayInput } from '~/components/ui/array-input'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'
import { METADATA_EXTRA_PREDEFINED_KEYS } from '@appTypes/database'

export function ExtraInformationDialog({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const [extra, setExtra] = useGameState(gameId, 'metadata.extra')

  const addNewItem = (): void => {
    const newItem = { key: '', value: [] }
    setExtra([...extra, newItem])
  }

  const setPredefinedKey = (index: number, key: string): void => {
    setExtra(
      extra.map((item, i) => {
        if (i === index) {
          return { ...item, key }
        }
        return item
      })
    )
  }

  const moveItemUp = (index: number): void => {
    if (index <= 0) return
    const newItems = [...extra]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp
    setExtra(newItems)
  }

  const moveItemDown = (index: number): void => {
    if (index >= extra.length - 1) return
    const newItems = [...extra]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp
    setExtra(newItems)
  }

  const removeItem = (index: number): void => {
    const newItems = [...extra]
    newItems.splice(index, 1)
    setExtra(newItems)
  }

  return (
    <Dialog>
      <DialogTrigger>
        <span
          className={cn('invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline]')}
        ></span>
      </DialogTrigger>
      <DialogContent
        className={cn('w-1/2 h-1/2 max-w-none flex flex-col gap-3')}
        onClose={
          // Remove items with empty keys
          () => {
            setExtra(extra.filter((item) => item.key.trim() !== ''))
          }
        }
      >
        <div className={cn('ml-3')}>
          <Button variant="outline" onClick={addNewItem} className={cn('w-[fit-content]')}>
            {t('detail.overview.extraInformation.addNew')}
          </Button>
        </div>

        <div className={cn('flex flex-col gap-3 grow p-3 overflow-auto scrollbar-base')}>
          {extra.map((item, i) => (
            <div key={i} className={cn('flex flex-row gap-2')}>
              {/* Key input and predefined key selection */}
              <div className={cn('flex items-center gap-1 w-2/3')}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className={cn('flex-shrink-0')}>
                      <span className={cn('icon-[mdi--lightning-bolt] w-4 h-4')}></span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    {METADATA_EXTRA_PREDEFINED_KEYS.map((key) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() =>
                          setPredefinedKey(
                            i,
                            t(`detail.overview.extraInformation.fields.${key}`, key)
                          )
                        }
                      >
                        {t(`detail.overview.extraInformation.fields.${key}`, key)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Input
                  value={item.key}
                  onChange={(e) => {
                    setExtra(
                      extra.map((item, index) => {
                        if (index === i) {
                          return { ...item, key: e.target.value }
                        }
                        return item
                      })
                    )
                  }}
                  placeholder={t('detail.overview.extraInformation.enterKey')}
                  className={cn('flex-grow')}
                />
              </div>

              {/* Value input */}
              <ArrayInput
                value={item.value}
                className={cn('flex-grow')}
                onChange={(value) => {
                  setExtra(
                    extra.map((item, index) => {
                      if (index === i) {
                        return { ...item, value }
                      }
                      return item
                    })
                  )
                }}
                placeholder={t('detail.overview.extraInformation.enterValue')}
                tooltipText={t('detail.overview.extraInformation.valueTip')}
              />

              {/* Action buttons */}
              <div className={cn('flex flex-row gap-1')}>
                <Button
                  variant="outline"
                  size={'icon'}
                  disabled={i === 0}
                  onClick={() => moveItemUp(i)}
                >
                  <span className={cn('icon-[mdi--keyboard-arrow-up] w-4 h-4')}></span>
                </Button>
                <Button
                  variant="outline"
                  size={'icon'}
                  disabled={i === extra.length - 1}
                  onClick={() => moveItemDown(i)}
                >
                  <span className={cn('icon-[mdi--keyboard-arrow-down] w-4 h-4')}></span>
                </Button>
                <Button
                  variant="outline"
                  size={'icon'}
                  className={cn('hover:bg-destructive hover:text-destructive-foreground')}
                  onClick={() => removeItem(i)}
                >
                  <span className={cn('icon-[mdi--delete-outline] w-4 h-4')}></span>
                </Button>
              </div>
            </div>
          ))}

          {extra.length === 0 && (
            <div className={cn('text-center text-muted-foreground py-4')}>
              {t('detail.overview.extraInformation.empty')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
