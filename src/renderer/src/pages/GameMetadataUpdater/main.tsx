import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Checkbox } from '@ui/checkbox'
import { Label } from '@ui/label'
import { Slider } from '@ui/slider'
import { Progress } from '@ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { ipcManager } from '~/app/ipc'
import { BatchUpdateGameMetadataProgress, GameMetadataUpdateOptions } from '@appTypes/utils'
import { ScraperCapabilities, AllGameMetadataUpdateFields } from '@appTypes/utils'
import { useTranslation } from 'react-i18next'
import { useGameMetadataUpdaterStore } from './store'
import { useConfigState } from '~/hooks'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '~/utils'

export function GameMetadataUpdaterDialog(): React.JSX.Element {
  const {
    open,
    gameIds,
    dataSourceId,
    backgroundUrl,
    handleClose,
    dataSource,
    setDataSource,
    showProgress,
    setShowProgress
  } = useGameMetadataUpdaterStore()

  const [selectedFields, setSelectedFields] = useState<string[]>(['#all'])
  const [options, setOptions] = useState<GameMetadataUpdateOptions>({
    overwriteExisting: true,
    updateImages: true,
    mergeStrategy: 'merge'
  })
  const [concurrency, setConcurrency] = useState<number>(5)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [availableDataSources, setAvailableDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])
  const { t } = useTranslation('game')
  const [defaultDataSource] = useConfigState('game.scraper.common.defaultDataSource')

  useEffect(() => {
    if (!dataSource && defaultDataSource) {
      setDataSource(defaultDataSource)
    }
  }, [dataSource, defaultDataSource, setDataSource])

  useEffect(() => {
    const fetchAvailableDataSources = async (): Promise<void> => {
      const availableDataSources = await ipcManager.invoke(
        'scraper:get-provider-infos-with-capabilities',
        ['searchGames', 'checkGameExists', 'getGameMetadata', 'getGameBackgrounds', 'getGameCovers']
      )
      setAvailableDataSources(availableDataSources)
      if (availableDataSources.length > 0) {
        if (!availableDataSources.some((ds) => ds.id === dataSource)) {
          setDataSource(availableDataSources[0].id)
        }
      } else {
        toast.error(t('gameAdder.search.notifications.noDataSources'))
      }
    }
    fetchAvailableDataSources()
  }, [])

  // 批量更新进度状态
  const [progress, setProgress] = useState<{
    completed: number
    total: number
    current: number
    successful: number
    failed: number
    results: BatchUpdateGameMetadataProgress[]
  }>({
    completed: 0,
    total: gameIds.length,
    current: 0,
    successful: 0,
    failed: 0,
    results: []
  })

  const isBatchMode = gameIds.length > 1

  // 监听批量更新进度
  useEffect(() => {
    const handleProgress = (_: any, data: BatchUpdateGameMetadataProgress): void => {
      setProgress((prev) => {
        // 查找是否已有该游戏的结果
        const existingIndex = prev.results.findIndex((item) => item.gameId === data.gameId)

        const newResults = [...prev.results]
        if (existingIndex >= 0) {
          // 更新现有结果
          newResults[existingIndex] = data
        } else {
          // 添加新结果
          newResults.push(data)
        }

        // 计算成功和失败数量
        const successful = newResults.filter((r) => r.status === 'success').length
        const failed = newResults.filter((r) => r.status === 'error').length

        return {
          completed: data.current,
          total: data.total,
          current: data.current,
          successful,
          failed,
          results: newResults
        }
      })

      // 同时更新Toast通知
      updateToastProgress(data)
    }

    // 注册事件监听
    ipcManager.onUnique('adder:batch-update-game-metadata-progress', handleProgress)

    // 清理函数
    return () => {}
  }, [])

  // Toast进度通知管理
  const updateToastProgress = (data: BatchUpdateGameMetadataProgress): void => {
    const progressText = `${data.current}/${data.total} (${Math.round((data.current / data.total) * 100)}%)`

    toast.loading(`正在处理 ${data.gameName || data.gameId}... ${progressText}`, {
      id: 'batch-update'
    })
  }

  // 切换字段选择
  const toggleField = (field: string): void => {
    if (field === '#all' || field === '#missing') {
      setSelectedFields([field])
      return
    }

    // 如果已经选了#all或#missing，则清除
    if (selectedFields.includes('#all') || selectedFields.includes('#missing')) {
      setSelectedFields([field])
      return
    }

    // 否则切换当前字段
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field))
    } else {
      setSelectedFields([...selectedFields, field])
    }
  }

  // 处理单个游戏更新
  const handleSingleUpdate = async (): Promise<void> => {
    if (!gameIds[0]) return

    setIsUpdating(true)
    toast.loading(`正在更新游戏元数据...`, { id: 'single-update' })

    try {
      const params = {
        dbId: gameIds[0],
        dataSource: dataSource!,
        dataSourceId: dataSourceId!,
        fields: selectedFields,
        backgroundUrl,
        options
      }

      await ipcManager.invoke('adder:update-game-metadata', params)

      toast.success('游戏元数据更新成功！', { id: 'single-update' })
      handleClose()
    } catch (error) {
      toast.error(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`, {
        id: 'single-update'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // 处理批量更新
  const handleBatchUpdate = async (): Promise<void> => {
    setIsUpdating(true)
    setShowProgress(true) // 显示进度页面

    // 重置进度
    setProgress({
      completed: 0,
      total: gameIds.length,
      current: 0,
      successful: 0,
      failed: 0,
      results: []
    })

    toast.loading(`正在批量更新 ${gameIds.length} 个游戏的元数据...`, { id: 'batch-update' })

    try {
      const params = {
        gameIds,
        dataSource,
        fields: selectedFields,
        options,
        concurrency
      }

      await ipcManager.invoke('adder:batch-update-game-metadata', params)

      toast.success(`批量更新完成! 成功: ${progress.successful}, 失败: ${progress.failed}`, {
        id: 'batch-update'
      })

      // 不自动关闭对话框，让用户查看详细结果
    } catch (error) {
      toast.error(`批量更新出错: ${error instanceof Error ? error.message : '未知错误'}`, {
        id: 'batch-update'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // 处理更新按钮点击
  const handleUpdate = (): void => {
    if (isBatchMode) {
      handleBatchUpdate()
    } else {
      handleSingleUpdate()
    }
  }

  // 切换回设置页面
  const handleBackToSettings = (): void => {
    setShowProgress(false)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="w-[700px]" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>
            {isBatchMode ? `批量更新游戏元数据 (${gameIds.length} 个游戏)` : '更新游戏元数据'}
          </DialogTitle>
          <DialogDescription>从选定的数据源获取游戏元数据并应用到游戏库中</DialogDescription>
        </DialogHeader>

        {/* 根据状态显示设置页面或进度页面 */}
        {(!isBatchMode || (isBatchMode && !showProgress)) && (
          <div className="space-y-6 py-4 w-full h-full">
            {/* 数据源选择 */}
            {isBatchMode && (
              <div className="grid gap-2">
                <Label htmlFor="dataSource" className="">
                  数据源
                </Label>
                <Select value={dataSource} onValueChange={setDataSource}>
                  <SelectTrigger id="dataSource">
                    <SelectValue placeholder="选择数据源" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDataSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 要更新的字段 */}
            <div className="grid gap-2">
              <Label>要更新的字段</Label>
              <div className="grid grid-cols-2 gap-2">
                {AllGameMetadataUpdateFields.map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <Checkbox
                      id={`field-${field}`}
                      checked={selectedFields.includes(field)}
                      onCheckedChange={() => toggleField(field)}
                    />
                    <Label
                      htmlFor={`field-${field}`}
                      className={cn(
                        'cursor-pointer',
                        (field === '#all' || field === '#missing') && 'font-bold'
                      )}
                    >
                      {t(`updater.fields.${field}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 更新选项 */}
            <div className="grid gap-2">
              <Label>合并策略</Label>
              <div className="grid gap-4">
                <Select
                  value={options.mergeStrategy}
                  onValueChange={(val) =>
                    setOptions({
                      ...options,
                      mergeStrategy: val as 'replace' | 'merge' | 'append'
                    })
                  }
                >
                  <SelectTrigger id="mergeStrategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">替换</SelectItem>
                    <SelectItem value="merge">合并</SelectItem>
                    <SelectItem value="append">追加</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 批量模式下的并发设置 */}
            {isBatchMode && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="concurrency">并发数: {concurrency}</Label>
                </div>
                <Slider
                  id="concurrency"
                  min={1}
                  max={20}
                  step={1}
                  value={[concurrency]}
                  onValueChange={([val]) => setConcurrency(val)}
                />
                <span className="text-xs text-muted-foreground">
                  并发数越高，处理速度越快，但可能会导致请求失败
                </span>
              </div>
            )}
          </div>
        )}

        {/* 批量模式的进度页面 */}
        {isBatchMode && showProgress && (
          <div className="py-4 space-y-4 h-full overflow-hidden flex flex-col">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>总进度: {Math.round((progress.completed / progress.total) * 100)}%</span>
                <span>
                  {progress.completed}/{progress.total}
                </span>
              </div>
              <Progress value={(progress.completed / progress.total) * 100} className="h-2" />

              <div className="flex justify-between text-sm mt-2">
                <span className="text-green-500">成功: {progress.successful}</span>
                <span className="text-red-500">失败: {progress.failed}</span>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2 py-2 pr-4">
                {progress.results.map((result, index) => (
                  <Card
                    key={index}
                    className={result.status === 'error' ? 'border-red-400' : 'border-green-400'}
                  >
                    <CardHeader className="">
                      <CardTitle className="text-base flex justify-between">
                        <span className="truncate max-w-[300px]">
                          {result.gameName || result.gameId}
                        </span>
                        <span>{result.status === 'error' ? '❌' : '✅'}</span>
                      </CardTitle>
                    </CardHeader>
                    {result.status === 'error' && (
                      <CardContent className="">
                        <CardDescription className="text-red-400">
                          错误: {result.error}
                        </CardDescription>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              {isUpdating && progress.completed < progress.total && (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">处理中...</span>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {isBatchMode && showProgress ? (
            <>
              <Button variant="outline" onClick={handleBackToSettings} disabled={isUpdating}>
                返回设置
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
                关闭
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
                取消
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating || selectedFields.length === 0}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isBatchMode ? '批量更新中...' : '更新中...'}
                  </>
                ) : isBatchMode ? (
                  '开始批量更新'
                ) : (
                  '更新元数据'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
