import { GameTimerStatus, NSFWBlurLevel, NSFWFilterMode, TimerStatus } from '@appTypes/models'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useConfigLocalState, useConfigState } from '~/hooks'
import { useLogStore } from '~/pages/Log'
import { cn } from '~/utils'
import { CloudSyncInfo } from '../pages/Config/CloudSync/Info'
import { useCloudSyncStore } from '../pages/Config/CloudSync/store'
import { LibraryTitlebarContent } from './LibraryTitlebarContent'
import { useTheme } from './ThemeProvider'

export function Titlebar(): React.JSX.Element {
  const [ismaximize, setIsmaximize] = useState(false)
  const router = useRouter()
  const { location } = useRouterState()
  const { t } = useTranslation('sidebar')
  const { setIsOpen: setLogDialogIsOpen } = useLogStore()

  // Cloud Sync related
  const syncStatus = useCloudSyncStore((state) => state.status)
  const [cloudSyncEnabled] = useConfigLocalState('sync.enabled')

  // Theme related
  const { toggleTheme, isDark } = useTheme()
  const [showThemeSwitchInSidebar] = useConfigState('appearances.sidebar.showThemeSwitcher')

  // NSFW Blur related
  const [showNSFWBlurSwitchInSidebar] = useConfigState('appearances.sidebar.showNSFWBlurSwitcher')
  const [nsfwBlurLevel, setNsfwBlurLevel] = useConfigState('appearances.nsfwBlurLevel')
  const [nsfwFilterMode, setNsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')
  const [nsfwLevelTooltipOpen, setNsfwLevelTooltipOpen] = useState(false) // prevent unwanted auto-closing on click
  const [nsfwFilterTooltipOpen, setNsfwFilterTooltipOpen] = useState(false) // prevent unwanted auto-closing on click
  const nextBlurLevel = (current: NSFWBlurLevel): NSFWBlurLevel => (current + 1) % 3
  const prevBlurLevel = (current: NSFWBlurLevel): NSFWBlurLevel => (current - 1 + 3) % 3
  const nextFilterMode = (current: NSFWFilterMode): NSFWFilterMode => (current + 1) % 3
  const prevFilterMode = (current: NSFWFilterMode): NSFWFilterMode => (current - 1 + 3) % 3
  const nsfwBlurIconMap = {
    [NSFWBlurLevel.Off]: 'icon-[mdi--eye-outline]',
    [NSFWBlurLevel.BlurImage]: 'icon-[mdi--image-off-outline]',
    [NSFWBlurLevel.BlurImageAndTitle]: 'icon-[mdi--eye-off-outline]'
  }
  const nsfwFilterIconMap = {
    [NSFWFilterMode.All]: 'ALL',
    [NSFWFilterMode.HideNSFW]: 'SFW',
    [NSFWFilterMode.OnlyNSFW]: 'NSFW'
  }
  const nsfwBlurTooltips = {
    [NSFWBlurLevel.Off]: t('actions.nsfwLevel.off'),
    [NSFWBlurLevel.BlurImage]: t('actions.nsfwLevel.blurImage'),
    [NSFWBlurLevel.BlurImageAndTitle]: t('actions.nsfwLevel.blurImageAndTitle')
  }
  const nsfwFilterTooltips = {
    [NSFWFilterMode.All]: t('actions.nsfwFilter.all'),
    [NSFWFilterMode.HideNSFW]: t('actions.nsfwFilter.hideNSFW'),
    [NSFWFilterMode.OnlyNSFW]: t('actions.nsfwFilter.onlyNSFW')
  }
  const timerStatusTooltips = {
    idle: t('timerStatus.idle'),
    on: t('timerStatus.on'),
    paused: t('timerStatus.paused')
  }

  // timer status indicator
  const [timerStatusList, setTimerStatusList] = useState<GameTimerStatus[]>([])
  const timerStatus: 'on' | 'idle' | 'paused' =
    timerStatusList.length === 0
      ? 'idle'
      : timerStatusList.some((x) => x.status === TimerStatus.Resumed)
        ? 'on'
        : 'paused'

  useEffect(() => {
    const removeMaximizeListener = ipcManager.on('window:maximized', () => setIsmaximize(true))
    const removeUnmaximizeListener = ipcManager.on('window:unmaximized', () => setIsmaximize(false))
    const removeTimerStatusListener = ipcManager.on(
      'monitor:timer-status-change',
      (_, statusList) => {
        setTimerStatusList(statusList)
      }
    )

    return (): void => {
      removeMaximizeListener()
      removeUnmaximizeListener()
      removeTimerStatusListener()
    }
  }, [])

  const isLibraryRoute = location.pathname.startsWith('/library')

  return (
    <div
      data-titlebar="true"
      className="flex flex-row draggable-area text-accent-foreground h-[50px] bg-transparent border-b w-full"
    >
      {/* Content split to two parts: 1. Resizable/Collapsible main content area 2. Fixed window control button area */}

      {/* 1. Main content area - Overflow content will be hidden when width is insufficient */}
      <div className="flex flex-row items-center w-full overflow-hidden">
        {/* Left: General buttons */}
        <div className="flex flex-row items-center gap-2 px-3 pr-2 shrink-0 h-full">
          <Button
            variant={'thirdary'}
            size={'icon'}
            className={cn('h-[32px] w-[32px]')}
            onClick={() => router.history.back()}
          >
            <span className="icon-[mdi--arrow-left] w-4 h-4"></span>
          </Button>
          <Button
            variant={'thirdary'}
            size={'icon'}
            className={cn('h-[32px] w-[32px]')}
            onClick={() => router.history.forward()}
          >
            <span className="icon-[mdi--arrow-right] w-4 h-4"></span>
          </Button>
        </div>

        {/* Left: Library route specific buttons */}
        <div className="flex flex-row items-center gap-2 px-3 shrink-0 h-full">
          {isLibraryRoute && <LibraryTitlebarContent />}
        </div>

        {/* Middle resizable space */}
        <div className="flex-grow"></div>

        {/* Right: Function button area */}
        <div className="flex flex-row items-center gap-2 px-3 overflow-hidden shrink-0 h-full">
          {/* Timer status indicator */}
          <Tooltip>
            <TooltipTrigger>
              <div
                className={cn(
                  `flex items-center justify-start px-2 py-1 gap-1 rounded-md bg-input/[calc(var(--glass-opacity)/2)] cursor-pointer non-draggable`
                )}
              >
                <span
                  className={`w-2 h-2 rounded-full ${timerStatus === 'idle' ? 'bg-sky-700/50' : timerStatus === 'on' ? 'bg-emerald-600/50' : 'bg-amber-700/50'}`}
                />
                <span className="text-xs">{timerStatusTooltips[timerStatus]}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {timerStatusList.length === 0 ? (
                <span className="text-xs">{timerStatusTooltips[timerStatus]}</span>
              ) : (
                timerStatusList.map((status, idx) => {
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${status.status === TimerStatus.Resumed ? 'bg-emerald-600/50' : 'bg-amber-700/50'}`}
                      />
                      <p>{status.name}</p>
                    </div>
                  )
                })
              )}
            </TooltipContent>
          </Tooltip>

          {/* Log view button */}
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="thirdary"
                size={'icon'}
                className={cn('h-[32px] w-[32px]')}
                onClick={() => setLogDialogIsOpen(true)}
              >
                <span className={cn('icon-[mdi--file-document] w-4 h-4')}></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('actions.viewLogs')}</TooltipContent>
          </Tooltip>

          {showNSFWBlurSwitchInSidebar && (
            <>
              {/* NSFW Filter switch button */}
              <Tooltip open={nsfwFilterTooltipOpen}>
                <TooltipTrigger
                  // Prevent tooltip from disappearing after clicking the button
                  onMouseEnter={() => setNsfwFilterTooltipOpen(true)}
                  onMouseLeave={() => setNsfwFilterTooltipOpen(false)}
                >
                  <Button
                    variant="thirdary"
                    size={'icon'}
                    className={cn('h-[32px] w-[32px] relative')}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (e.button === 0) {
                        setNsfwFilterMode(nextFilterMode(nsfwFilterMode))
                      } else if (e.button === 2) {
                        setNsfwFilterMode(prevFilterMode(nsfwFilterMode))
                      }
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <span className={`icon-[mdi--eye-outline] w-4 h-4`} />
                    <span className="absolute bottom-[2px] right-0 text-[8px] font-bold px-1">
                      {nsfwFilterIconMap[nsfwFilterMode]}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="pointer-events-none">
                  {nsfwFilterTooltips[nsfwFilterMode]}
                </TooltipContent>
              </Tooltip>

              {/* NSFW Blur switch button */}
              <Tooltip open={nsfwLevelTooltipOpen}>
                <TooltipTrigger
                  // Prevent tooltip from disappearing after clicking the button
                  onMouseEnter={() => setNsfwLevelTooltipOpen(true)}
                  onMouseLeave={() => setNsfwLevelTooltipOpen(false)}
                >
                  <Button
                    variant="thirdary"
                    size={'icon'}
                    className={cn('h-[32px] w-[32px]')}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (e.button === 0) {
                        setNsfwBlurLevel(nextBlurLevel(nsfwBlurLevel))
                      } else if (e.button === 2) {
                        setNsfwBlurLevel(prevBlurLevel(nsfwBlurLevel))
                      }
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <span className={`${nsfwBlurIconMap[nsfwBlurLevel]} w-4 h-4`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="pointer-events-none">
                  {nsfwBlurTooltips[nsfwBlurLevel]}
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Theme switch button */}
          {showThemeSwitchInSidebar && (
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="thirdary"
                  size={'icon'}
                  className={cn('h-[32px] w-[32px]')}
                  onClick={toggleTheme}
                >
                  {isDark ? (
                    <span className={cn('icon-[mdi--weather-night] w-4 h-4')}></span>
                  ) : (
                    <span className={cn('icon-[mdi--weather-sunny] w-4 h-4')}></span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isDark ? t('actions.darkMode') : t('actions.lightMode')}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Cloud Sync status button */}
          {cloudSyncEnabled ? (
            <Popover>
              <PopoverTrigger>
                {syncStatus?.status === 'syncing' ? (
                  <Button variant="thirdary" size={'icon'} className={cn('h-[32px] w-[32px]')}>
                    <span className={cn('icon-[mdi--cloud-sync-outline] w-4 h-4')}></span>
                  </Button>
                ) : syncStatus?.status === 'success' ? (
                  <Button variant="thirdary" size={'icon'} className={cn('h-[32px] w-[32px]')}>
                    <span className={cn('icon-[mdi--cloud-check-outline] w-4 h-4')}></span>
                  </Button>
                ) : syncStatus?.status === 'error' ? (
                  <Button variant="thirdary" size={'icon'} className={cn('h-[32px] w-[32px]')}>
                    <span className={cn('icon-[mdi--cloud-remove-outline] w-4 h-4')}></span>
                  </Button>
                ) : (
                  <Button variant="thirdary" size={'icon'} className={cn('h-[32px] w-[32px]')}>
                    <span className={cn('icon-[mdi--cloud-outline] w-4 h-4')}></span>
                  </Button>
                )}
              </PopoverTrigger>
              <PopoverContent side="bottom">
                <CloudSyncInfo className={cn('text-sm')} />
              </PopoverContent>
            </Popover>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <Button variant="thirdary" size={'icon'} className={cn('h-[32px] w-[32px]')}>
                  <span className={cn('icon-[mdi--cloud-cancel-outline] w-4 h-4')}></span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('actions.cloudSyncDisabled')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* 2. Window control button area - Fixed display, never hidden */}
      <div className="flex flex-row ml-auto shrink-0">
        <Button
          variant={'ghost'}
          className={cn(
            'rounded-none h-[30px] z-[999]',
            'hover:bg-transparent hover:text-primary dark:hover:bg-transparent'
          )}
          onClick={() => ipcManager.send('window:minimize')}
        >
          <span className="icon-[mdi--minus] w-4 h-4"></span>
        </Button>
        <Button
          variant={'ghost'}
          className={cn(
            'hover:bg-transparent hover:text-primary rounded-none h-[30px] z-[999] dark:hover:bg-transparent'
          )}
          onClick={() => ipcManager.send('window:maximize')}
        >
          {ismaximize ? (
            <span className="icon-[mdi--window-restore] w-4 h-4"></span>
          ) : (
            <span className="icon-[mdi--window-maximize] w-4 h-4"></span>
          )}
        </Button>
        <Button
          variant={'ghost'}
          className={cn(
            'rounded-none hover:bg-transparent hover:text-destructive h-[30px] z-[999] dark:hover:bg-transparent'
          )}
          onClick={() => ipcManager.send('window:close')}
        >
          <span className="icon-[mdi--close] w-4 h-4"></span>
        </Button>
      </div>
    </div>
  )
}
