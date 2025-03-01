import { ipcInvoke } from '~/utils'
import { DocChange } from '@appTypes/database'

/**
 * 通用数据库同步函数 - 将数据同步到指定数据库
 *
 * @param dbName 数据库名称
 * @param docId 文档ID
 * @param data 文档数据
 * @param immediate 已不再使用，保留参数保持API兼容
 * @param customDelay 已不再使用，保留参数保持API兼容
 * @returns Promise<void>
 */
export async function syncTo<T extends Record<string, any>>(
  dbName: string,
  docId: string,
  data: T
): Promise<void> {
  // 创建变更对象
  const change: DocChange = {
    dbName,
    docId,
    data,
    timestamp: Date.now()
  }

  // 直接执行同步，不再使用防抖
  try {
    await ipcInvoke('db-changed', change)
  } catch (error) {
    console.error(`[Sync] 同步失败 ${dbName}/${docId}:`, error)
    throw error // 向上传递错误
  }
}
