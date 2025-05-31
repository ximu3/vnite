import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@ui/alert-dialog'
import { Badge } from '@ui/badge'
import { Button } from '@ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { Folder, FolderOpen, Pencil, PlayCircle, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigLocalState } from '~/hooks'
import { cn } from '~/utils'
import { useGameScannerStore } from './store'

interface GameScannerListItemProps {
  scanner: {
    path: string
    dataSource: string
    depth: number
  }
  scannerId: string
  onEditClick: () => void
}

export const GameScannerListItem: React.FC<GameScannerListItemProps> = ({
  scanner,
  scannerId,
  onEditClick
}) => {
  const { t } = useTranslation('scanner')
  const [scannerConfig, setScannerConfig] = useConfigLocalState('game.scanner')
  const { scanProgress, scanScanner } = useGameScannerStore()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Remove scanner
  const handleRemove = (): void => {
    // Update scanner list
    if (scannerConfig && scannerConfig.list) {
      const updatedList = { ...scannerConfig.list }
      delete updatedList[scannerId]

      // Save updated configuration
      setScannerConfig({
        ...scannerConfig,
        list: updatedList
      })
    }

    // Close dialog
    setShowDeleteDialog(false)
  }

  // Scan single directory
  const handleScan = (): void => {
    scanScanner(scannerId)
  }

  // Get data source display name
  const getDataSourceName = (): string => {
    return t(`dataSources.${scanner.dataSource}`, { defaultValue: scanner.dataSource })
  }

  // Get progress for this scanner
  const scannerProgress = scanProgress?.scannerProgresses[scannerId] || null

  // Check if current directory is being scanned
  const isScanning = scannerProgress?.status === 'scanning'

  // Calculate progress percentage for this scanner
  const calculateProgress = (): number => {
    if (!scannerProgress || scannerProgress.totalFolders === 0) return 0
    return Math.round((scannerProgress.processedFolders / scannerProgress.totalFolders) * 100)
  }

  // Get status variant and label text
  const getStatusDetails = (): {
    variant: 'default' | 'outline' | 'secondary' | 'destructive'
    label: string
  } => {
    if (!scannerProgress) return { variant: 'outline', label: t('list.item.statusLabels.idle') }

    const variants: Record<string, 'default' | 'outline' | 'secondary' | 'destructive'> = {
      scanning: 'secondary',
      paused: 'outline',
      completed: 'default',
      error: 'destructive',
      idle: 'outline'
    }

    const status = scannerProgress.status || 'unknown'
    return {
      variant: variants[status] || 'outline',
      label: t(`list.item.statusLabels.${status}`, {
        defaultValue: t('list.item.statusLabels.unknown')
      })
    }
  }

  const { variant, label } = getStatusDetails()

  return (
    <div className="relative flex items-center justify-between p-4 overflow-hidden transition-colors">
      {/* Semi-transparent progress bar - only shown when scanning */}
      {isScanning && (
        <div
          className={cn(
            'absolute left-0 top-0 h-full bg-primary/10 transition-all duration-300',
            'bg-primary/10'
          )}
          style={{ width: `${calculateProgress()}%` }}
        />
      )}

      <div className="z-10 flex items-center flex-grow gap-4 overflow-hidden">
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 ',
            'group cursor-pointer hover:bg-primary/20'
          )}
          onClick={() => window.api.utils.openPathInExplorer(scanner.path)}
        >
          <Folder className="w-5 h-5 text-primary block group-hover:hidden" />
          <FolderOpen className="w-5 h-5 text-primary hidden group-hover:block" />
        </div>

        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium truncate">{scanner.path}</p>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>{t('list.item.dataSource', { name: getDataSourceName() })}</span>
            <span className="mx-1">•</span>
            <span>{t('list.item.depth', { level: scanner.depth })}</span>

            {/* Scan status information */}
            {scannerProgress && scannerProgress.status !== 'idle' && (
              <>
                <span className="mx-1">•</span>
                <span>{t('list.item.progress', { percentage: calculateProgress() })}</span>
                <span className="mx-1">•</span>
                <span>{t('list.item.games', { count: scannerProgress.scannedGames || 0 })}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="z-10 flex items-center gap-3">
        {/* Scan status badge */}
        <Badge variant={variant}>{label}</Badge>

        <div className="flex gap-1 ml-2">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleScan}
                disabled={scanProgress.status === 'scanning' || isScanning}
              >
                <PlayCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('list.item.tooltips.scan')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                disabled={scanProgress.status === 'scanning' || isScanning}
                onClick={onEditClick}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('list.item.tooltips.edit')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="hover:text-destructive"
                disabled={scanProgress.status === 'scanning' || isScanning}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('list.item.tooltips.delete')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('list.item.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('list.item.deleteDialog.description', { path: scanner.path })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('list.item.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>
              {t('list.item.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
