import { Button } from '@ui'
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
    <div className="draggable-area flex flex-row-reverse">
      <Button
        variant={'ghost'}
        size={'icon'}
        className={cn(
          'non-draggable rounded-none',
          'hover:bg-destructive hover:text-destructive-foreground'
        )}
        onClick={() => ipcSend('close')}
      >
        <span className="icon-[mdi--close] w-5 h-5"></span>
      </Button>
      <Button
        variant={'ghost'}
        size={'icon'}
        className={cn('non-draggable rounded-none')}
        onClick={() => ipcSend('maximize')}
      >
        {ismaximize ? (
          <span className="icon-[mdi--window-restore] w-5 h-5"></span>
        ) : (
          <span className="icon-[mdi--window-maximize] w-5 h-5"></span>
        )}
      </Button>
      <Button
        variant={'ghost'}
        size={'icon'}
        className={cn('non-draggable rounded-none')}
        onClick={() => ipcSend('minimize')}
      >
        <span className="icon-[mdi--minus] w-5 h-5"></span>
      </Button>
    </div>
  )
}
