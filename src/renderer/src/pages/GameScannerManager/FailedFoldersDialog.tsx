import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameScannerStore } from './store'
import { ScraperCapabilities } from '@appTypes/utils'
import { ipcManager } from '~/app/ipc'
import { useConfigLocalState } from '~/hooks'
import { toast } from 'sonner'

interface FailedFoldersDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const FailedFoldersDialog: React.FC<FailedFoldersDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('scanner')

  const { scanProgress, fixFailedFolder, ignoreFailedFolder } = useGameScannerStore()
  const [scannerConfig, setScannerConfig] = useConfigLocalState('game.scanner')

  const [selectedFolder, setSelectedFolder] = useState<{
    path: string
    name: string
    error: string
    dataSource?: string
  }>()
  const [dataSourceId, setDataSourceId] = useState('')
  const [dataSource, setDataSource] = useState<string>('steam')

  const [availableDataSources, setAvailableDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])

  useEffect(() => {
    const fetchAvailableDataSources = async (): Promise<void> => {
      const sources = await ipcManager.invoke('scraper:get-provider-infos-with-capabilities', [
        'searchGames',
        'checkGameExists',
        'getGameMetadata',
        'getGameBackgrounds',
        'getGameCovers'
      ])
      setAvailableDataSources(sources)
      if (sources.length > 0) {
        if (!sources.some((ds) => ds.id === dataSource)) {
          setDataSource(sources[0].id)
        }
      } else {
        toast.error(t('gameBatchAdder.notifications.noDataSources'))
      }
    }
    fetchAvailableDataSources()
  }, [])

  // Collect failed folders from all scanners
  const getAllFailedFolders = (): {
    path: string
    name: string
    error: string
    dataSource: string
    scannerId: string
  }[] => {
    const allFailedFolders: Array<{
      path: string
      name: string
      error: string
      dataSource: string
      scannerId: string
    }> = []

    Object.entries(scanProgress?.scannerProgresses).forEach(([scannerId, progress]) => {
      if (progress.failedFolders && progress.failedFolders.length > 0) {
        progress.failedFolders.forEach((folder) => {
          allFailedFolders.push({
            ...folder,
            scannerId
          })
        })
      }
    })

    return allFailedFolders
  }

  const failedFolders = getAllFailedFolders()

  const handleSelectFolder = (folder: {
    path: string
    name: string
    error: string
    dataSource?: string
  }): void => {
    setSelectedFolder(folder)
    setDataSourceId('')
    // If the folder has an associated data source, select it by default
    setDataSource(folder.dataSource || 'steam')
  }

  const handleBack = (): void => {
    setSelectedFolder(undefined)
    setDataSourceId('')
    setDataSource('steam')
  }

  const handleFix = async (): Promise<void> => {
    if (!selectedFolder || !dataSourceId) return

    try {
      await fixFailedFolder(selectedFolder.path, dataSourceId, dataSource)
      handleBack() // Return after success
    } catch (error) {
      console.error(t('errors.fixFolder'), error)
    }
  }

  const handleClose = (): void => {
    onClose()
    setSelectedFolder(undefined)
    setDataSourceId('')
    setDataSource('steam')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[60vw] relative">
        <DialogHeader>
          <DialogTitle>{t('failedFolders.title')}</DialogTitle>
        </DialogHeader>

        <div className="pb-1 space-y-4 max-h-[60vh] overflow-auto scrollbar-base">
          {selectedFolder ? (
            // Details view for a selected folder
            <div className="p-4 space-y-4 border rounded-lg">
              <div>
                <p className="font-medium">
                  {t('failedFolders.fixing', { name: selectedFolder.name })}
                </p>
                <p className="text-sm text-destructive">{selectedFolder.error}</p>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-y-4 gap-x-4 items-center">
                <div className="select-none whitespace-nowrap">{t('failedFolders.dataSource')}</div>
                <Select value={dataSource} onValueChange={setDataSource}>
                  <SelectTrigger className="">
                    <SelectValue placeholder={t('failedFolders.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDataSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="select-none whitespace-nowrap">
                  {t('failedFolders.dataSourceId')}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={dataSourceId}
                    onChange={(e) => setDataSourceId(e.target.value)}
                    placeholder={t('failedFolders.inputPlaceholder')}
                    className="flex-grow"
                  />
                  <Button onClick={handleFix} disabled={!dataSourceId}>
                    {t('actions.fix')}
                  </Button>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {t('failedFolders.helpText')}
                </div>
              </div>
            </div>
          ) : (
            // List of failed folders
            <Table className="">
              <TableHeader className="">
                <TableRow>
                  <TableHead>{t('failedFolders.table.folderName')}</TableHead>
                  <TableHead>{t('failedFolders.table.location')}</TableHead>
                  <TableHead>{t('failedFolders.table.error')}</TableHead>
                  <TableHead className="w-[100px]">{t('failedFolders.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="">
                {failedFolders.map((folder, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium max-w-[10vw] overflow-hidden">
                      {folder.name}
                    </TableCell>
                    <TableCell className="max-w-[10vw] overflow-hidden">
                      <Tooltip>
                        <TooltipTrigger className="text-xs">
                          {folder.path.split('/').pop()}
                        </TooltipTrigger>
                        <TooltipContent>{folder.path.split('/').pop()}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="max-w-[10vw] overflow-hidden">
                      <Tooltip>
                        <TooltipTrigger className="text-xs">{folder.error}</TooltipTrigger>
                        <TooltipContent>{folder.error}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="flex flex-row">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectFolder(folder)}
                      >
                        {t('actions.fix')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2"
                        onClick={() => {
                          ignoreFailedFolder(folder.scannerId, folder.path)
                          const normalize = (p: string): string =>
                            p.trim().replace(/\\/g, '/').replace(/\/+$/, '')
                          const current = (scannerConfig.ignoreList || [])
                            .map(normalize)
                            .filter((p) => p.length > 0)
                          const next = Array.from(
                            new Set([...current, normalize(folder.path)])
                          ).sort()
                          setScannerConfig({
                            ...scannerConfig,
                            ignoreList: next
                          })
                        }}
                      >
                        {t('actions.ignore')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          {selectedFolder ? (
            <Button variant={'ghost'} onClick={handleBack}>
              {t('actions.back')}
            </Button>
          ) : (
            <Button onClick={onClose}>{t('actions.close')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
