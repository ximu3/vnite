import { debounce } from 'lodash'
import { ipcInvoke } from '~/utils'
import { DocChange } from '@appTypes/database'

// 存储防抖函数的缓存表 - 按 dbName:docId 组合缓存
const syncDebounces: Record<string, ReturnType<typeof debounce>> = {}

// 默认防抖延迟配置（毫秒）
const DEBOUNCE_CONFIG = {
  game: 500, // 游戏数据标准防抖
  'game-local': 300, // 本地游戏数据优先级稍高
  config: 1000, // 配置变更频率较低，可以更长的防抖
  'config-local': 300, // 本地配置响应更快
  attachment: 200, // 附件更新需要更及时
  default: 500 // 默认值
}

/**
 * 通用数据库同步函数 - 将数据同步到指定数据库
 *
 * @param dbName 数据库名称
 * @param docId 文档ID
 * @param data 文档数据
 * @param immediate 是否立即执行（绕过防抖）
 * @param customDelay 自定义防抖延迟时间（覆盖默认配置）
 * @returns Promise<void>
 */
export async function syncTo<T extends Record<string, any>>(
  dbName: string,
  docId: string,
  data: T,
  immediate = false,
  customDelay?: number
): Promise<void> {
  // 创建变更对象
  const change: DocChange = {
    dbName,
    docId,
    data,
    timestamp: Date.now()
  }

  // 创建实际执行同步的函数
  const performSync = async (): Promise<void> => {
    try {
      await ipcInvoke('db-changed', change)
    } catch (error) {
      console.error(`[Sync] 同步失败 ${dbName}/${docId}:`, error)
    }
  }

  // 立即执行模式，跳过防抖
  if (immediate) {
    await performSync()
    return
  }

  // 确定防抖键和防抖延迟时间
  const debounceKey = `${dbName}:${docId}`
  const debounceDelay = customDelay ?? DEBOUNCE_CONFIG[dbName] ?? DEBOUNCE_CONFIG.default

  // 如果该键还没有防抖函数，创建一个
  if (!syncDebounces[debounceKey]) {
    syncDebounces[debounceKey] = debounce(performSync, debounceDelay)
  }

  // 使用防抖函数执行更新，并适当包装返回的Promise
  return new Promise<void>((resolve) => {
    const debouncedFn = syncDebounces[debounceKey]

    // 保存原始的flush方法
    const originalFlush = debouncedFn.flush

    // 重写flush方法以在执行完成后解析Promise
    debouncedFn.flush = (): unknown => {
      const result = originalFlush.call(debouncedFn)
      resolve()
      return result
    }

    // 调用防抖函数并处理Promise
    debouncedFn()
      .then(() => resolve())
      .catch((err: any) => {
        console.error(`[Sync] 防抖同步过程中出错 ${debounceKey}:`, err)
        resolve() // 即使出错也解析Promise，避免阻塞调用方
      })
  })
}

/**
 * 清理指定数据库和文档ID的防抖函数
 * 在删除文档时调用，以避免内存泄漏
 */
export function clearSyncDebounce(dbName: string, docId: string): void {
  const debounceKey = `${dbName}:${docId}`

  if (syncDebounces[debounceKey]) {
    // 取消任何未执行的防抖操作
    syncDebounces[debounceKey].flush()
    delete syncDebounces[debounceKey]
  }
}

/**
 * 强制立即同步所有待处理更改
 * 可在应用关闭前调用，确保所有变更都已保存
 */
export function flushAllSyncOperations(): void {
  Object.values(syncDebounces).forEach((debouncedFn) => {
    try {
      debouncedFn.flush()
    } catch (error) {
      console.error('[Sync] 强制刷新防抖操作时出错:', error)
    }
  })
}
