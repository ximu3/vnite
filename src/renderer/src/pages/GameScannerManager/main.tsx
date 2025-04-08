import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/button'
import {
  Folder,
  RefreshCw,
  StopCircle,
  FolderPlus,
  AlertTriangle,
  ListFilter,
  Loader2,
  Settings
} from 'lucide-react'
import { Progress } from '@ui/progress'
import { Badge } from '@ui/badge'
import { ScrollArea } from '@ui/scroll-area'
import { useConfigLocalState } from '~/hooks'
import { GameScannerListItem } from './GameScannerListItem'
import { EditScannerDialog } from './EditScannerDialog'
import { GlobalSettingsDialog } from './GlobalSettingsDialog'
import { FailedFoldersDialog } from './FailedFoldersDialog'
import { useGameScannerStore } from './store'
import { cn } from '~/utils'

export const GameScannerManager: React.FC = () => {
  const { t } = useTranslation('scanner')

  const [isShowingGlobalSettings, setShowingGlobalSettings] = useState(false)

  const [scannerConfig] = useConfigLocalState('game.scanner')

  const {
    scanProgress,
    isShowingFailedDialog,
    editingScanner,
    initialize,
    setEditingScanner,
    showFailedDialog,
    scanAll,
    stopScan
  } = useGameScannerStore()

  // Initialize listeners and get initial state
  useEffect(() => {
    initialize()
  }, [initialize])

  // Handle adding a game scanner
  const handleAddScanner = (): void => {
    setEditingScanner({ id: null, isNew: true })
  }

  // Handle editing global settings
  const handleEditGlobalSettings = (): void => {
    setShowingGlobalSettings(true)
  }

  // Calculate overall progress percentage
  const calculateProgress = (): number => {
    if (scanProgress.totalScanners === 0) return 0
    return Math.round((scanProgress.processedScanners / scanProgress.totalScanners) * 100)
  }

  // Get the count of all failed folders
  const getFailedFolderCount = (): number => {
    return Object.values(scanProgress?.scannerProgresses).reduce((total, progress) => {
      return total + (progress.failedFolders?.length || 0)
    }, 0)
  }

  // Get status variant
  const getStatusVariant = (): 'default' | 'outline' | 'secondary' | 'destructive' => {
    switch (scanProgress.status) {
      case 'scanning':
        return 'secondary'
      case 'completed':
        return 'default'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusText = (): string => {
    switch (scanProgress.status) {
      case 'idle':
        return t('status.idle')
      case 'scanning':
        return t('status.scanning')
      case 'completed':
        return t('status.completed')
      case 'error':
        return t('status.error')
      default:
        return t('status.unknown')
    }
  }

  // Scanner count and global settings
  const scannerList = scannerConfig?.list || {}
  const scannerCount = Object.keys(scannerList).length
  const globalInterval = scannerConfig?.interval || 0

  return (
    <div className="flex flex-col w-screen h-screen pt-[34px] border-l-[1px]">
      <ScrollArea className="px-6">
        {/* Header title */}
        <div className="flex items-center justify-between mb-4 ">
          <h2 className="text-2xl font-bold">{t('title')}</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Status card */}
          <div className="p-4 border rounded-lg bg-background/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left: Status and progress information */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Status indicator */}
                <div className="flex items-center gap-2 pr-4 border-r">
                  <div className="flex items-center">
                    {scanProgress.status === 'scanning' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                    ) : (
                      <Badge
                        variant={getStatusVariant()}
                        className="flex items-center h-6 gap-1 px-2"
                      >
                        {getStatusText()}
                      </Badge>
                    )}
                  </div>

                  {/* Progress bar and percentage */}
                  <div className="flex items-center gap-2">
                    <Progress
                      value={calculateProgress()}
                      className={cn(
                        'w-20 h-2',
                        scanProgress.status === 'scanning' && 'animate-pulse'
                      )}
                    />
                    <span className="text-xs font-medium">{calculateProgress()}%</span>
                  </div>
                </div>

                {/* Scanning metrics */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5" />
                    <span>{t('metrics.scanners', { count: scannerCount })}</span>
                  </Badge>

                  <Badge variant="outline" className="flex items-center gap-1">
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>{t('metrics.games', { count: scanProgress.scannedGames || 0 })}</span>
                  </Badge>

                  {globalInterval > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {t('metrics.scanInterval', {
                          minutes: Math.round(globalInterval / 60000)
                        })}
                      </span>
                    </Badge>
                  )}

                  {getFailedFolderCount() > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center h-6 gap-1 px-2 text-amber-500"
                      onClick={() => showFailedDialog(true)}
                      disabled={scanProgress.status === 'scanning'}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{t('metrics.failures', { count: getFailedFolderCount() })}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: Action buttons group */}
              <div className="flex gap-2">
                {scanProgress.status === 'scanning' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:text-destructive-foreground hover:bg-destructive"
                    onClick={stopScan}
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    {t('actions.stop')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={scanAll}
                    disabled={scannerCount === 0}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('actions.scanAll')}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditGlobalSettings}
                  disabled={scanProgress.status === 'scanning'}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {t('actions.globalSettings')}
                </Button>
              </div>
            </div>
          </div>

          {/* Scanners list and action card */}
          <div className="flex flex-col flex-grow overflow-hidden border rounded-lg">
            {/* Scanners list title bar */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="text-sm font-medium">{t('list.title')}</div>
              <Button
                size="sm"
                onClick={handleAddScanner}
                disabled={scanProgress.status === 'scanning'}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                {t('actions.addDirectory')}
              </Button>
            </div>

            {/* Game scanner directories list */}
            <div className="overflow-auto">
              {scannerCount > 0 ? (
                <div className="divide-y">
                  {Object.entries(scannerList).map(([scannerId, scanner]) => (
                    <GameScannerListItem
                      key={scannerId}
                      scanner={scanner}
                      scannerId={scannerId}
                      onEditClick={() => setEditingScanner({ id: scannerId, isNew: false })}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <Folder className="w-16 h-16 mb-4 opacity-20" />
                  <p className="mb-2 text-lg">{t('list.empty.title')}</p>
                  <p className="text-sm text-center text-muted-foreground">
                    {t('list.empty.description')}
                  </p>
                  <Button className="mt-4" onClick={handleAddScanner}>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    {t('actions.addDirectory')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dialog components */}
        {editingScanner !== null && (
          <EditScannerDialog
            isOpen={editingScanner !== null}
            onClose={() => setEditingScanner(null)}
            scannerId={editingScanner.id}
            isNew={editingScanner.isNew}
          />
        )}

        <GlobalSettingsDialog
          isOpen={isShowingGlobalSettings}
          onClose={() => setShowingGlobalSettings(false)}
        />

        <FailedFoldersDialog
          isOpen={isShowingFailedDialog}
          onClose={() => showFailedDialog(false)}
        />
      </ScrollArea>
    </div>
  )
}
