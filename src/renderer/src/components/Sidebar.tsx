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
import { useGameIndexManager, useDBSyncedState } from '~/hooks'
import { ConfigDialog } from './Config'
import { useCloudSyncStore } from './Config/CloudSync/store'
import { useSteamImporterStore } from '~/pages/Importer/SteamImporter/store'
import { CloudSyncInfo } from './Config/CloudSync/Info'

export function Sidebar(): JSX.Element {
  const { setIsOpen: setIsGameAdderOpen } = useGameAdderStore()
  const { actions: gameBatchAdderActions } = useGameBatchAdderStore()
  const { setIsOpen: setIsSteamImporterOpen } = useSteamImporterStore()
  const { gameIndex: _ } = useGameIndexManager()
  const { status } = useCloudSyncStore()
  const [cloudSyncEnabled] = useDBSyncedState(false, 'config.json', ['cloudSync', 'enabled'])
  return (
    <div className={cn('flex flex-col p-[10px] pt-3 pb-3 h-full bg-background justify-between')}>
      <div className={cn('flex flex-col gap-2')}>
        <div
          className={cn(
            'pb-2 font-mono text-xs font-bold flex justify-center items-center text-primary'
          )}
        >
          vnite
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="./library">
              <span className={cn('icon-[mdi--bookshelf] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">游戏库</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="./record">
              <span className={cn('icon-[mdi--report-box-multiple] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">记录</TooltipContent>
        </Tooltip>
      </div>
      <div className={cn('flex flex-col gap-2')}>
        {cloudSyncEnabled ? (
          <Popover>
            <PopoverTrigger>
              {status?.status === 'syncing' ? (
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                >
                  <span className={cn('icon-[mdi--cloud-sync-outline] w-5 h-5')}></span>
                </Button>
              ) : status?.status === 'success' ? (
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                >
                  <span className={cn('icon-[mdi--cloud-check-outline] w-5 h-5')}></span>
                </Button>
              ) : status?.status === 'error' ? (
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
              <CloudSyncInfo isWithAction className={cn('text-sm')} />
            </PopoverContent>
          </Popover>
        ) : (
          <Tooltip>
            <TooltipTrigger>
              <span className={cn('icon-[mdi--cloud-cancel-outline] w-5 h-5')}></span>
            </TooltipTrigger>
            <TooltipContent side="right">云同步未开启</TooltipContent>
          </Tooltip>
        )}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                >
                  <span className={cn('icon-[mdi--plus-circle-outline] w-5 h-5')}></span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">添加游戏</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" className="w-44">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>使用刮削器</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsGameAdderOpen(true)
                    }}
                  >
                    <div>单个添加</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      toast.promise(
                        (async (): Promise<void> => {
                          try {
                            const result = (await ipcInvoke('get-batch-game-adder-data')) as Game[]

                            if (!Array.isArray(result)) {
                              throw new Error('返回数据格式错误')
                            }

                            if (result.length === 0) {
                              toast.error('未找到游戏')
                              return
                            }

                            gameBatchAdderActions.setGames(result)
                            gameBatchAdderActions.setIsOpen(true)
                          } catch (error) {
                            // 确保错误是 Error 类型
                            if (error instanceof Error) {
                              toast.error(`获取游戏失败: ${error.message}`)
                              throw error
                            } else {
                              toast.error(`获取游戏失败: ${error}`)
                              throw new Error('未知错误')
                            }
                          }
                        })(),
                        {
                          loading: '请选择库文件夹...',
                          success: '获取游戏成功',
                          error: (err: Error) => `获取游戏失败: ${err.message}`
                        }
                      )
                    }}
                  >
                    <div>批量添加</div>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  toast.info('请选择游戏路径')
                  const gamePath = await ipcInvoke('select-path-dialog', ['openFile'])
                  if (!gamePath) {
                    return
                  }
                  await ipcInvoke('add-game-to-db-without-metadata', gamePath)
                  toast.success('添加成功')
                } catch (error) {
                  toast.error('添加游戏时出错')
                }
              }}
            >
              <div>不使用刮削器</div>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>从第三方导入</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsSteamImporterOpen(true)
                    }}
                  >
                    <div>Steam</div>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <ConfigDialog>
              <Button
                variant="ghost"
                size={'icon'}
                className={cn('min-h-0 min-w-0 p-2 non-draggable')}
              >
                <span className={cn('icon-[mdi--settings-outline] w-5 h-5')}></span>
              </Button>
            </ConfigDialog>
          </TooltipTrigger>
          <TooltipContent side="right">设置</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
