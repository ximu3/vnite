import { Button } from '@ui/button'
import { cn, ipcSend, ipcOnUnique } from '~/utils'
import { useState, useEffect } from 'react'

export function Titlebar(): JSX.Element {
  const [ismaximize, setIsmaximize] = useState(false)
  useEffect(() => {
    const removeMaximizeListener = ipcOnUnique('window-maximized', () => setIsmaximize(true))
    const removeUnmaximizeListener = ipcOnUnique('window-unmaximized', () => setIsmaximize(false))

    return (): void => {
      removeMaximizeListener()
      removeUnmaximizeListener()
    }
  }, [])
  return (
    <div data-titlebar="true" className="flex flex-row-reverse draggable-area">
      <Button
        variant={'ghost'}
        className={cn(
          'non-draggable rounded-none h-[30px]',
          'hover:bg-destructive hover:text-destructive-foreground'
        )}
        onClick={() => ipcSend('close')}
      >
        <span className="icon-[mdi--close] w-4 h-4"></span>
      </Button>
      <Button
        variant={'ghost'}
        className={cn('non-draggable rounded-none h-[30px]')}
        onClick={() => ipcSend('maximize')}
      >
        {ismaximize ? (
          <span className="icon-[mdi--window-restore] w-4 h-4"></span>
        ) : (
          <span className="icon-[mdi--window-maximize] w-4 h-4"></span>
        )}
      </Button>
      <Button
        variant={'ghost'}
        className={cn('non-draggable rounded-none h-[30px]')}
        onClick={() => ipcSend('minimize')}
      >
        <span className="icon-[mdi--minus] w-4 h-4"></span>
      </Button>
    </div>
  )
}
