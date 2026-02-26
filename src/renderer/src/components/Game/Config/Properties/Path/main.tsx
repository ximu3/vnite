import { ArrayTextarea } from '@ui/array-textarea'
import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Checkbox } from '@ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@ui/dialog'
import { Input } from '@ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Separator } from '@ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import React, { useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
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
  const [isGamePathValid, setIsGamePathValid] = useState(true)
  const [isScreenshotPathValid, setIsScreenshotPathValid] = useState(true)
  const [screenshotPath, setScreenshotPath, saveScreenshotPath, setScreenshotPathAndSave] =
    useGameLocalState(gameId, 'path.screenshotPath', true)

  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [selectedSearchResults, setSelectedSearchResults] = useState<Record<string, boolean>>({})

  const openSearchDialog = async (): Promise<void> => {
    const promise = ipcManager.invoke('game:search-save-paths', gameId)

    toast.promise(promise, {
      loading: t('detail.properties.path.search.loading'),
      error: (err) => t('detail.properties.path.search.error', { message: err.message })
    })

    promise.then((results) => {
      setSearchResults(results ?? [])

      const map: Record<string, boolean> = {}
      ;(results ?? []).forEach((p) => (map[p] = false))

      setSelectedSearchResults(map)
      setShowSearchDialog(true)
    })
  }

  const confirmSearchSelection = async (): Promise<void> => {
    const picked = Object.keys(selectedSearchResults).filter((p) => selectedSearchResults[p])
    if (picked.length === 0) {
      setShowSearchDialog(false)
      return
    }
    const combined = savePaths.concat(picked)
    const newSavePaths = Array.from(new Set(combined))
    await setSavePathsAndSave(newSavePaths.filter(Boolean))
    setShowSearchDialog(false)
  }

  const saveAll = useCallback(async () => {
    await Promise.all([saveGamePath(), saveSavePaths(), saveScreenshotPath()])
  }, [saveGamePath, saveSavePaths, saveScreenshotPath])
  useImperativeHandle(ref, () => ({ save: saveAll }), [saveAll])

  useEffect(() => {
    if (!gamePath) {
      setIsGamePathValid(true)
      return
    }
    ipcManager
      .invoke('system:check-if-path-exist', [gamePath])
      .then((res: boolean[]) => setIsGamePathValid(res[0]))
      .catch(() => setIsGamePathValid(false))
  }, [gamePath])

  useEffect(() => {
    if (!screenshotPath) {
      setIsScreenshotPathValid(true)
      return
    }
    ipcManager
      .invoke('system:check-if-path-exist', [screenshotPath])
      .then((res: boolean[]) => setIsScreenshotPathValid(res[0]))
      .catch(() => setIsScreenshotPathValid(false))
  }, [screenshotPath])

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
                aria-invalid={!isGamePathValid}
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    aria-invalid={!isScreenshotPathValid}
                    className={cn('flex-1')}
                    value={screenshotPath || ''}
                    onChange={(e) => setScreenshotPath(e.target.value)}
                    onBlur={saveScreenshotPath}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('detail.properties.path.screenshotPathTooltip')}
                </TooltipContent>
              </Tooltip>
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
                className={cn('flex-1 max-h-[400px] min-h-[130px] resize-none')}
                value={savePaths}
                onChange={setSavePaths}
                onBlur={saveSavePaths}
              />
              <div className={cn('flex flex-col gap-3')}>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant={'outline'} size={'icon'} onClick={openSearchDialog}>
                      <span className={cn('icon-[mdi--magnify] w-5 h-5')}></span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t('detail.properties.path.search.tooltip')}
                  </TooltipContent>
                </Tooltip>
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

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('detail.properties.path.search.results')}</DialogTitle>
          </DialogHeader>
          <div className={cn('flex items-center justify-between mb-3')}>
            <div className={cn('flex flex-col gap-2')}>
              {searchResults.length === 0 ? (
                <div className={cn('text-sm text-muted-foreground')}>
                  {t('detail.properties.path.search.noResults')}
                </div>
              ) : (
                searchResults.map((p, index) => (
                  <div key={p} className="flex flex-row items-center gap-2">
                    <Checkbox
                      id={`search-result-${index}`}
                      checked={!!selectedSearchResults[p]}
                      onCheckedChange={(val: boolean | 'indeterminate') =>
                        setSelectedSearchResults((prev) => ({ ...prev, [p]: !!val }))
                      }
                    />
                    <label htmlFor={`search-result-${index}`}>{p}</label>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant={'ghost'} onClick={() => setShowSearchDialog(false)}>
              {t('utils:common.cancel')}
            </Button>
            <Button className={cn('ml-2')} onClick={confirmSearchSelection}>
              {t('utils:common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export const Path = React.forwardRef(PathComponent)
