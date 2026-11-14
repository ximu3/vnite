import { useEffect, useRef } from 'react'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { UpscaleConfigControl } from '~/components/utils/UpscaleConfigControl'
import { cn } from '~/utils'
import { gameAdderFlow } from './flow'
import { useGameAdderStore } from './store'

export function BackgroundList(): React.JSX.Element {
  const { t } = useTranslation(['adder', 'game'])
  const { draft, backgroundList, updateDraft } = useGameAdderStore()
  const { backgroundUrl, dbId, enableUpscale } = draft
  const pageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const state = useGameAdderStore.getState()
    toast.promise(
      async (): Promise<string[]> => {
        const images = await ipcManager.invoke(
          'scraper:get-game-backgrounds',
          state.draft.dataSource,
          {
            type: 'id',
            value: state.draft.dataSourceId
          }
        )
        useGameAdderStore.setState({ backgroundList: images })
        updateDraft({ backgroundUrl: images[0] || '' })
        return images
      },
      {
        loading: i18next.t('adder:gameAdder.backgrounds.notifications.loading'),
        success: (images) => ({
          type: images.length ? 'success' : 'error',
          message: i18next.t(
            images.length
              ? 'adder:gameAdder.backgrounds.notifications.success'
              : 'adder:gameAdder.backgrounds.notifications.noImages'
          )
        }),
        error: (error) =>
          i18next.t('adder:gameAdder.backgrounds.notifications.error', {
            message: error instanceof Error ? error.message : String(error)
          })
      }
    )
  }, [])

  useEffect(() => {
    pageRef.current?.focus()
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const state = useGameAdderStore.getState()
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('button, input, select, textarea, [role="combobox"]')
    )
      return
    const images = state.backgroundList
    const index = images.indexOf(state.draft.backgroundUrl)
    if (index === -1) return
    if (event.key === 'Enter') {
      event.preventDefault()
      gameAdderFlow.confirmBackground()
      return
    }
    const offsets = { ArrowRight: 1, ArrowDown: 2, ArrowLeft: -1, ArrowUp: -2 }
    const offset = offsets[event.key as keyof typeof offsets]
    if (offset === undefined) return
    event.preventDefault()
    const target = (index + offset + images.length * 2) % images.length
    updateDraft({ backgroundUrl: images[target] })
    pageRef.current?.querySelector(`[data-background-index="${target}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    })
  }

  return (
    <div
      ref={pageRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="flex h-[80vh] w-[50vw] flex-col gap-3 p-3 outline-none"
    >
      <div className="shrink-0 font-bold">{t('gameAdder.backgrounds.title')}</div>
      <div className="scrollbar-base min-h-0 flex-1 overflow-auto pr-3">
        {backgroundList.length ? (
          <div className="grid grid-cols-2 gap-3">
            {backgroundList.map((image, index) => (
              <div
                key={image}
                data-background-index={index}
                onClick={() => {
                  updateDraft({ backgroundUrl: image })
                }}
                className={cn(
                  'cursor-pointer rounded-lg bg-muted p-3 text-muted-foreground',
                  image === backgroundUrl
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <img src={image} alt={image} className="h-auto w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div>{t('gameAdder.backgrounds.noImages')}</div>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
        {!dbId && (
          <UpscaleConfigControl
            checked={enableUpscale}
            onCheckedChange={(checked) => updateDraft({ enableUpscale: checked })}
            label={t('game:detail.properties.media.actions.upscaleImage')}
          />
        )}
        <Button onClick={gameAdderFlow.confirmBackground}>{t('utils:common.confirm')}</Button>
      </div>
    </div>
  )
}
