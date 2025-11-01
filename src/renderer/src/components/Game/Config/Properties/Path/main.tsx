import { ArrayTextarea } from '@ui/array-textarea'
import React, { useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useGameLocalState, useGameState } from '~/hooks'
import { cn } from '~/utils'

export interface PathHandle {
  save: () => Promise<void>
}

function PathComponent(
  { gameId }: { gameId: string },
  ref: React.Ref<PathHandle>
): React.JSX.Element {
  const { t } = useTranslation('game')
  const [monitorPath] = useGameLocalState(gameId, 'launcher.fileConfig.monitorPath')
  const [gamePath, setGamePath, saveGamePath, setGamePathAndSave] = useGameLocalState(
    gameId,
    'path.gamePath',
    true
  )
  const [savePaths, setSavePaths, saveSavePaths, setSavePathsAndSave] = useGameLocalState(
    gameId,
    'path.savePaths',
    true
  )
  const [markerPath] = useGameLocalState(gameId, 'utils.markPath')
  const [maxSaveBackups, setMaxSaveBackups] = useGameState(gameId, 'save.maxBackups')
  const [savePathSize, setSavePathSize] = useState(0)
  const [screenshotPath, setScreenshotPath, saveScreenshotPath, setScreenshotPathAndSave] =
    useGameLocalState(gameId, 'path.screenshotPath', true)

  const saveAll = useCallback(async () => {
    await Promise.all([saveGamePath(), saveSavePaths(), saveScreenshotPath()])
  }, [saveGamePath, saveSavePaths, saveScreenshotPath])
  useImperativeHandle(ref, () => ({ save: saveAll }), [saveAll])

  useEffect(() => {
    if ((savePaths.length === 1 && savePaths[0] === '') || savePaths.length === 0 || !savePaths) {
      setSavePathSize(-1)
      return
    }
    ipcManager
      .invoke('system:get-path-size', savePaths)
      .then((size: number) => setSavePathSize(size))
      .catch(() => setSavePathSize(NaN))
  }, [savePaths])

  async function selectScreenshotFolderPath(): Promise<void> {
    const folderPath = await ipcManager.invoke(
      'system:select-path-dialog',
      ['openDirectory'],
      undefined,
      gamePath || markerPath
    )
    if (!folderPath) {
      return
    }
    await setScreenshotPathAndSave(folderPath)
  }

  function formatSize(bytes: number): string {
    if (savePathSize === -1) return ''
    if (Number.isNaN(bytes)) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(2)} KiB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(2)} MiB`
    const gb = mb / 1024
    return `${gb.toFixed(2)} GiB`
  }

  async function selectGamePath(): Promise<void> {
    const filePath = await ipcManager.invoke(
      'system:select-path-dialog',
      ['openFile'],
      undefined,
      gamePath || markerPath
    )
    if (!filePath) {
      return
    }
    await setGamePathAndSave(filePath)
    const isIconAccessible = await ipcManager.invoke(
      'db:check-attachment',
      'game',
      gameId,
      'images/icon.webp'
    )
    if (!isIconAccessible) {
      await ipcManager.invoke('utils:save-game-icon-by-file', gameId, filePath)
    }
    if (!monitorPath) {
      toast.promise(
        async () => {
          await ipcManager.invoke('launcher:select-preset', 'default', gameId)
        },
        {
          loading: t('detail.properties.path.notifications.configuring'),
          success: t('detail.properties.path.notifications.success'),
          error: (error) => `${error}`
        }
      )
    }
  }

  async function selectSaveFolderPath(): Promise<void> {
    const folderPath = await ipcManager.invoke(
      'system:select-multiple-path-dialog',
      ['openDirectory'],
      undefined,
      gamePath || markerPath
    )
    if (!folderPath) {
      return
    }
    const newSavePath = savePaths.concat(folderPath)
    await setSavePathsAndSave(newSavePath.filter(Boolean))
  }

  async function selectSaveFilePath(): Promise<void> {
    const filePath = await ipcManager.invoke(
      'system:select-multiple-path-dialog',
      ['openFile'],
      undefined,
      gamePath || markerPath
    )
    if (!filePath) {
      return
    }
    const newSavePath = savePaths.concat(filePath)
    await setSavePathsAndSave(newSavePath.filter(Boolean))
  }

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle>{t('detail.properties.path.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-5')}>
          {/* Path Setting */}
          <div className={cn('grid grid-cols-[auto_1fr] gap-x-5 gap-y-5 items-center')}>
            {/* Game Path */}
            <div className={cn('whitespace-nowrap select-none self-center')}>
              {t('detail.properties.path.gamePath')}
            </div>
            <div className={cn('flex flex-row gap-3 items-center')}>
              <Input
                className={cn('flex-1')}
                value={gamePath}
                onChange={(e) => setGamePath(e.target.value)}
                onBlur={saveGamePath}
              />
              <Button variant={'outline'} size={'icon'} onClick={selectGamePath}>
                <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
              </Button>
            </div>

            {/* Screenshot Path */}
            <div className={cn('whitespace-nowrap select-none self-center')}>
              {t('detail.properties.path.screenshotPath')}
            </div>
            <div className={cn('flex flex-row gap-3 items-center')}>
              <Input
                className={cn('flex-1')}
                value={screenshotPath || ''}
                onChange={(e) => setScreenshotPath(e.target.value)}
                onBlur={saveScreenshotPath}
              />
              <Button variant={'outline'} size={'icon'} onClick={selectScreenshotFolderPath}>
                <span className={cn('icon-[mdi--folder-outline] w-5 h-5')}></span>
              </Button>
            </div>

            {/* Save Path */}
            <div className={cn('whitespace-nowrap select-none self-start pt-2')}>
              <div>{t('detail.properties.path.savePath')}</div>
              <div
                className={cn('text-xs pt-2', {
                  'text-destructive': Number.isNaN(savePathSize) || savePathSize > 1024 * 1024 * 256
                })}
              >{`${formatSize(savePathSize)}`}</div>
            </div>

            <div className={cn('flex flex-row gap-3 items-start')}>
              <ArrayTextarea
                className={cn('flex-1 max-h-[400px] min-h-[100px] resize-none')}
                value={savePaths}
                onChange={setSavePaths}
                onBlur={saveSavePaths}
              />
              <div className={cn('flex flex-col gap-3')}>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant={'outline'} size={'icon'} onClick={selectSaveFolderPath}>
                      <span className={cn('icon-[mdi--folder-plus-outline] w-5 h-5')}></span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t('detail.properties.path.addFolder')}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant={'outline'} size={'icon'} onClick={selectSaveFilePath}>
                      <span className={cn('icon-[mdi--file-plus-outline] w-5 h-5')}></span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t('detail.properties.path.addFile')}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <Separator />

          {/* Maximum Backup Settings */}
          <div className={cn('flex flex-row gap-5 items-center justify-start text-sm')}>
            <div className={cn('whitespace-nowrap select-none')}>
              {t('detail.properties.path.maxBackups')}
            </div>
            <div>
              <Select
                value={maxSaveBackups.toString()}
                onValueChange={(v) => setMaxSaveBackups(Number(v))}
              >
                <SelectTrigger className={cn('w-[120px]')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{t('detail.properties.path.maxBackups')}</SelectLabel>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const Path = React.forwardRef(PathComponent)
