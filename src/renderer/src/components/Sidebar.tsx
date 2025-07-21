import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Nav } from '~/components/ui/nav'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { useGameBatchAdderStore } from '~/pages/GameBatchAdder/store'
import { useGameScannerStore } from '~/pages/GameScannerManager/store'
import { useSteamImporterStore } from '~/pages/Importer/SteamImporter/store'
import { ipcManager } from '~/app/ipc'
import { cn } from '~/utils'

export function Sidebar(): React.JSX.Element {
  const router = useRouter()
  const setIsGameAdderOpen = useGameAdderStore((state) => state.setIsOpen)
  const gameBatchAdderActions = useGameBatchAdderStore((state) => state.actions)
  const setIsSteamImporterOpen = useSteamImporterStore((state) => state.setIsOpen)
  const setEditingScanner = useGameScannerStore((state) => state.setEditingScanner)
  const { t } = useTranslation('sidebar')

  return (
    <div
      className={cn(
        'flex flex-col p-[6px] py-[8px] bg-transparent border-r border-border justify-between h-full w-[56px] shrink-0'
      )}
    >
      <div className={cn('flex flex-col gap-2 items-center justify-center')}>
        <div
          className={cn(
            'font-mono text-shadow-lg text-2xl font-bold flex justify-center items-center text-primary non-draggable cursor-pointer'
          )}
          onClick={() => {
            router.history.back()
          }}
        >
          V
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Nav
              variant="sidebar"
              to="/library"
              activeOptions={{
                exact: false
              }}
              className="size-9 p-0"
            >
              <span className={cn('icon-[mdi--bookshelf] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('navigation.library')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="/record" className="size-9 p-0">
              <span className={cn('icon-[mdi--report-box-multiple] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('navigation.records')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="/scanner" className="size-9 p-0">
              <span className={cn('icon-[mdi--folder-search] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('navigation.scanner')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="/transformer" className="size-9 p-0">
              <span className={cn('icon-[mdi--file-replace] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('navigation.transformer')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="/plugin" className="size-9 p-0">
              <span className={cn('icon-[mdi--puzzle] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('navigation.plugin')}</TooltipContent>
        </Tooltip>
      </div>
      <div className={cn('flex flex-col gap-2 items-center justify-center')}>
        <DropdownMenu>
          <Tooltip>
            <DropdownMenuTrigger>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                >
                  <span className={cn('icon-[mdi--plus-circle-outline] w-5 h-5')}></span>
                </Button>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <TooltipContent side="right">{t('actions.addGame')}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" className="">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{t('adder.addGame')}</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsGameAdderOpen(true)
                    }}
                  >
                    <div>{t('adder.addSingle')}</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      toast.promise(
                        (async (): Promise<void> => {
                          try {
                            const result = await ipcManager.invoke(
                              'adder:get-batch-game-adder-data'
                            )

                            if (!Array.isArray(result)) {
                              throw new Error(t('notifications.unknownError'))
                            }

                            if (result.length === 0) {
                              toast.error(t('notifications.noGamesFound'))
                              return
                            }

                            gameBatchAdderActions.setGames(result)
                            gameBatchAdderActions.setIsOpen(true)
                          } catch (error) {
                            if (error instanceof Error) {
                              toast.error(
                                `${t('notifications.getBatchGamesFailed')}${error.message}`
                              )
                              throw error
                            } else {
                              toast.error(`${t('notifications.getBatchGamesFailed')}${error}`)
                              throw new Error(t('notifications.unknownError'))
                            }
                          }
                        })(),
                        {
                          loading: t('notifications.selectLibraryFolder'),
                          success: t('notifications.getBatchGamesSuccess'),
                          error: (err: Error) =>
                            `${t('notifications.getBatchGamesFailed')}${err.message}`
                        }
                      )
                    }}
                  >
                    <div>{t('adder.addBatch')}</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        toast.info(t('notifications.selectGamePath'))
                        const gamePath = await ipcManager.invoke('system:select-path-dialog', [
                          'openFile'
                        ])
                        if (!gamePath) {
                          return
                        }
                        toast.promise(
                          (async (): Promise<void> => {
                            await ipcManager.invoke(
                              'adder:add-game-to-db-without-metadata',
                              gamePath
                            )
                          })(),
                          {
                            loading: t('notifications.adding'),
                            success: t('notifications.addSuccess'),
                            error: t('notifications.addError')
                          }
                        )
                      } catch (_error) {
                        toast.error(t('notifications.addError'))
                      }
                    }}
                  >
                    <div>{t('adder.addCustom')}</div>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem
              onClick={() => {
                router.navigate({ to: '/scanner' })
                setEditingScanner({
                  id: null,
                  isNew: true
                })
              }}
            >
              <div>{t('adder.addScanner')}</div>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{t('adder.importFromThirdParty')}</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsSteamImporterOpen(true)
                    }}
                  >
                    <div>{t('adder.steam')}</div>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="/config" className="size-9 p-0">
              <span className={cn('icon-[mdi--settings-outline] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('actions.settings')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
