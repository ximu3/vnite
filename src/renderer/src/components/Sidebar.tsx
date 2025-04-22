import { Nav } from '@ui/nav'
import { cn } from '~/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { Button } from '@ui/button'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { useGameBatchAdderStore, Game } from '~/pages/GameBatchAdder/store'
import { ipcInvoke } from '~/utils'
import { useConfigLocalState, useConfigState } from '~/hooks'
import { useCloudSyncStore } from '../pages/Config/CloudSync/store'
import { useSteamImporterStore } from '~/pages/Importer/SteamImporter/store'
import { CloudSyncInfo } from '../pages/Config/CloudSync/Info'
import { useTheme } from './ThemeProvider'
import { useTranslation } from 'react-i18next'
import { useGameScannerStore } from '~/pages/GameScannerManager/store'
import { useNavigate } from 'react-router-dom'

export function Sidebar(): JSX.Element {
  const navigate = useNavigate()
  const setIsGameAdderOpen = useGameAdderStore((state) => state.setIsOpen)
  const gameBatchAdderActions = useGameBatchAdderStore((state) => state.actions)
  const setIsSteamImporterOpen = useSteamImporterStore((state) => state.setIsOpen)
  const syncStatus = useCloudSyncStore((state) => state.status)
  const [cloudSyncEnabled] = useConfigLocalState('sync.enabled')
  const { toggleTheme, isDark } = useTheme()
  const [showThemeSwitchInSidebar] = useConfigState('appearances.sidebar.showThemeSwitcher')
  const setEditingScanner = useGameScannerStore((state) => state.setEditingScanner)
  const { t } = useTranslation('sidebar')

  return (
    <div
      className={cn(
        'flex flex-col p-[10px] h-full bg-background/70 border-r border-border justify-between'
      )}
    >
      <div className={cn('flex flex-col gap-2')}>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="./library">
              <span className={cn('icon-[mdi--bookshelf] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('navigation.library')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="./record">
              <span className={cn('icon-[mdi--report-box-multiple] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('navigation.records')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="./scanner">
              <span className={cn('icon-[mdi--folder-search] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('navigation.scanner')}</TooltipContent>
        </Tooltip>
      </div>
      <div className={cn('flex flex-col gap-2')}>
        {showThemeSwitchInSidebar && (
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size={'icon'}
                className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                onClick={toggleTheme}
              >
                {isDark ? (
                  <span className={cn('icon-[mdi--weather-night] w-5 h-5')}></span>
                ) : (
                  <span className={cn('icon-[mdi--weather-sunny] w-6 h-6 -m-1')}></span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isDark ? t('actions.darkMode') : t('actions.lightMode')}
            </TooltipContent>
          </Tooltip>
        )}
        {cloudSyncEnabled ? (
          <Popover>
            <PopoverTrigger>
              {syncStatus?.status === 'syncing' ? (
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                >
                  <span className={cn('icon-[mdi--cloud-sync-outline] w-5 h-5')}></span>
                </Button>
              ) : syncStatus?.status === 'success' ? (
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                >
                  <span className={cn('icon-[mdi--cloud-check-outline] w-5 h-5')}></span>
                </Button>
              ) : syncStatus?.status === 'error' ? (
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                >
                  <span className={cn('icon-[mdi--cloud-remove-outline] w-5 h-5')}></span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                >
                  <span className={cn('icon-[mdi--cloud-outline] w-5 h-5')}></span>
                </Button>
              )}
            </PopoverTrigger>
            <PopoverContent side="right">
              <CloudSyncInfo className={cn('text-sm')} />
            </PopoverContent>
          </Popover>
        ) : (
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size={'icon'}
                className={cn('min-h-0 min-w-0 p-2 non-draggable')}
              >
                <span className={cn('icon-[mdi--cloud-cancel-outline] w-5 h-5')}></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{t('actions.cloudSyncDisabled')}</TooltipContent>
          </Tooltip>
        )}
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
                            const result = (await ipcInvoke('get-batch-game-adder-data')) as Game[]

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
                              toast.error(`${t('notifications.getFailed')}${error.message}`)
                              throw error
                            } else {
                              toast.error(`${t('notifications.getFailed')}${error}`)
                              throw new Error(t('notifications.unknownError'))
                            }
                          }
                        })(),
                        {
                          loading: t('notifications.selectLibraryFolder'),
                          success: t('notifications.getSuccess'),
                          error: (err: Error) => `${t('notifications.getFailed')}${err.message}`
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
                        const gamePath = await ipcInvoke('select-path-dialog', ['openFile'])
                        if (!gamePath) {
                          return
                        }
                        toast.promise(
                          (async (): Promise<void> => {
                            await ipcInvoke('add-game-to-db-without-metadata', gamePath)
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
                navigate('/scanner')
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
            <Nav variant="sidebar" to="./config">
              <span className={cn('icon-[mdi--settings-outline] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">{t('actions.settings')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
