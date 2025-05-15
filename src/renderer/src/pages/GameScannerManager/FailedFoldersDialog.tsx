import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@ui/dialog'
import { Input } from '@ui/input'
import { ScrollArea } from '@ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { useGameScannerStore } from './store'

interface FailedFoldersDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const FailedFoldersDialog: React.FC<FailedFoldersDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('scanner')

  const { scanProgress, fixFailedFolder, ignoreFailedFolder } = useGameScannerStore()

  const [selectedFolder, setSelectedFolder] = useState<{
    path: string
    name: string
    error: string
    dataSource?: string
  }>()
  const [dataSourceId, setDataSourceId] = useState('')
  const [dataSource, setDataSource] = useState<string>('steam')

  // Data source options
  const dataSourceOptions = [
    { value: 'steam', label: t('dataSources.steam') },
    { value: 'vndb', label: t('dataSources.vndb') },
    { value: 'bangumi', label: t('dataSources.bangumi') },
    { value: 'ymgal', label: t('dataSources.ymgal') },
    { value: 'igdb', label: t('dataSources.igdb') },
    { value: 'dlsite', label: t('dataSources.dlsite') }
  ]

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

  // Handle folder selection
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

  // Handle going back
  const handleBack = (): void => {
    setSelectedFolder(undefined)
    setDataSourceId('')
    setDataSource('steam')
  }

  // Handle fixing
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
      <DialogContent className="w-[60vw] max-w-none">
        <DialogHeader>
          <DialogTitle>{t('failedFolders.title')}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {selectedFolder ? (
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
                    {dataSourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            <ScrollArea className={cn('h-[calc(84vh-230px)] bg-background pr-2')}>
              <Table className="bg-background">
                <TableHeader className="bg-background">
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
                      <TableCell className="font-medium">{folder.name}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <Tooltip>
                          <TooltipTrigger className="text-xs truncate max-w-[200px]">
                            {folder.path.split('/').pop()}
                          </TooltipTrigger>
                          <TooltipContent>{folder.path.split('/').pop()}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <Tooltip>
                          <TooltipTrigger className="text-xs truncate max-w-[200px]">
                            {folder.error}
                          </TooltipTrigger>
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
                          onClick={() => ignoreFailedFolder(folder.scannerId, folder.path)}
                        >
                          {t('actions.ignore')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
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
