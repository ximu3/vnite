import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { cn } from '~/utils'
import { useState, useEffect } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useConfigLocalState, useConfigState } from '~/hooks'
import { useCloudSyncStore } from '../pages/Config/CloudSync/store'
import { CloudSyncInfo } from '../pages/Config/CloudSync/Info'
import { useTheme } from './ThemeProvider'
import { LibraryTitlebarContent } from './LibraryTitlebarContent'
import { ipcManager } from '~/app/ipc'
import { useLogStore } from '~/pages/Log'

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
  const [enableNSFWBlur, setEnableNSFWBlur] = useConfigState('appearances.enableNSFWBlur')

  useEffect(() => {
    const removeMaximizeListener = ipcManager.on('window:maximized', () => setIsmaximize(true))
    const removeUnmaximizeListener = ipcManager.on('window:unmaximized', () => setIsmaximize(false))

    return (): void => {
      removeMaximizeListener()
      removeUnmaximizeListener()
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
        <div className="flex flex-row items-center gap-2 px-3 pr-2 shrink-0">
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
        <div className="flex flex-row items-center gap-2 px-3 shrink-0">
          {isLibraryRoute && <LibraryTitlebarContent />}
        </div>

        {/* Middle resizable space */}
        <div className="flex-grow"></div>

        {/* Right: Function button area */}
        <div className="flex flex-row items-center gap-2 px-3 overflow-hidden shrink-0">
          {/* Log view button */}
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="thirdary"
                size={'icon'}
                className={cn('p-1 h-[32px] w-[32px]')}
                onClick={() => setLogDialogIsOpen(true)}
              >
                <span className={cn('icon-[mdi--file-document] w-4 h-4')}></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('actions.viewLogs')}</TooltipContent>
          </Tooltip>

          {/* NSFW Blur switch button */}
          {showNSFWBlurSwitchInSidebar && (
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="thirdary"
                  size={'icon'}
                  className={cn('p-1 h-[32px] w-[32px]')}
                  onClick={() => setEnableNSFWBlur(!enableNSFWBlur)}
                >
                  {enableNSFWBlur ? (
                    <span className={cn('icon-[mdi--eye-off-outline] w-4 h-4')}></span>
                  ) : (
                    <span className={cn('icon-[mdi--eye-outline] w-4 h-4')}></span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {enableNSFWBlur ? t('actions.disableNSFWBlur') : t('actions.enableNSFWBlur')}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Theme switch button */}
          {showThemeSwitchInSidebar && (
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="thirdary"
                  size={'icon'}
                  className={cn('p-1 h-[32px] w-[32px]')}
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
                  <Button variant="thirdary" size={'icon'} className={cn('p-1 h-[32px] w-[32px]')}>
                    <span className={cn('icon-[mdi--cloud-sync-outline] w-4 h-4')}></span>
                  </Button>
                ) : syncStatus?.status === 'success' ? (
                  <Button variant="thirdary" size={'icon'} className={cn('p-1 h-[32px] w-[32px]')}>
                    <span className={cn('icon-[mdi--cloud-check-outline] w-4 h-4')}></span>
                  </Button>
                ) : syncStatus?.status === 'error' ? (
                  <Button variant="thirdary" size={'icon'} className={cn('p-1 h-[32px] w-[32px]')}>
                    <span className={cn('icon-[mdi--cloud-remove-outline] w-4 h-4')}></span>
                  </Button>
                ) : (
                  <Button variant="thirdary" size={'icon'} className={cn('p-1 h-[32px] w-[32px]')}>
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
                <Button variant="thirdary" size={'icon'} className={cn('p-1 h-[32px] w-[32px]')}>
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
