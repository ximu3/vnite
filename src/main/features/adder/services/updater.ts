import {
  GameMetadata,
  ScraperIdentifier,
  GameMetadataField,
  GameMetadataUpdateMode,
  GameMetadataUpdateOptions,
  BatchUpdateResults,
  BatchUpdateResult,
  GameDescriptionList,
  GameTagsList,
  GameExtraInfoList,
  ScraperCapabilities
} from '@appTypes/utils'
import { GameDBManager } from '~/core/database'
import { scraperManager } from '~/features/scraper'
import { ipcManager } from '~/core/ipc'
import log from 'electron-log/main'

/**
 * 批量更新多个游戏的元数据
 * @param params 批量更新参数
 * @returns 包含每个游戏更新结果的对象
 */
export async function batchUpdateGameMetadata({
  gameIds,
  dataSource,
  fields = ['#all'] as (GameMetadataField | GameMetadataUpdateMode)[],
  options = {},
  concurrency = 5
}: {
  gameIds: string[]
  dataSource: string
  fields?: (GameMetadataField | GameMetadataUpdateMode)[]
  options?: GameMetadataUpdateOptions
  concurrency?: number
}): Promise<BatchUpdateResults> {
  try {
    // 准备返回结果对象
    const results: BatchUpdateResults = {
      totalGames: gameIds.length,
      successfulUpdates: 0,
      failedUpdates: 0,
      results: []
    }

    // 当前处理游戏的计数
    let current = 0
    const total = gameIds.length

    // 处理单个游戏的函数
    const processGame = async (gameId: string): Promise<BatchUpdateResult> => {
      // 获取游戏文档
      const gameDoc = await GameDBManager.getGame(gameId)

      // 增加当前处理计数
      current++

      try {
        // 如果游戏名称不存在，返回错误
        if (!gameDoc?.metadata?.name) {
          const result = {
            gameId,
            success: false,
            error: '游戏名称不存在',
            dataSourceId: null,
            gameName: null
          }

          // 发送失败进度通知
          ipcManager.send('adder:batch-update-game-metadata-progress', {
            gameId,
            gameName: null,
            dataSource,
            dataSourceId: null,
            fields,
            options,
            status: 'error',
            error: '游戏名称不存在',
            current,
            total
          })

          return result
        }

        // 获取游戏名称
        const gameName = gameDoc.metadata.name

        // 检查是否已有该数据源的ID
        const existingDataSourceId = gameDoc.metadata[`${dataSource}Id`]
        if (existingDataSourceId) {
          // 直接使用已有的数据源ID更新
          await updateGameMetadata({
            dbId: gameId,
            dataSource,
            dataSourceId: existingDataSourceId,
            fields,
            options
          })

          // 发送成功进度通知
          ipcManager.send('adder:batch-update-game-metadata-progress', {
            gameId,
            gameName,
            dataSource,
            dataSourceId: existingDataSourceId,
            fields,
            options,
            status: 'success',
            current,
            total
          })

          return {
            gameId,
            success: true,
            dataSourceId: existingDataSourceId,
            gameName
          }
        }

        // 搜索游戏
        const searchResults = await scraperManager.searchGames(dataSource, gameName)

        // 没有搜索结果
        if (!searchResults || searchResults.length === 0) {
          const result = {
            gameId,
            success: false,
            error: '未找到匹配的游戏',
            dataSourceId: null,
            gameName
          }

          // 发送失败进度通知
          ipcManager.send('adder:batch-update-game-metadata-progress', {
            gameId,
            gameName,
            dataSource,
            dataSourceId: null,
            fields,
            options,
            status: 'error',
            error: '未找到匹配的游戏',
            current,
            total
          })

          return result
        }

        // 直接使用第一个搜索结果
        const selectedResult = searchResults[0]

        // 使用选出的结果更新游戏元数据
        await updateGameMetadata({
          dbId: gameId,
          dataSource,
          dataSourceId: selectedResult.id,
          fields,
          options
        })

        // 发送成功进度通知
        ipcManager.send('adder:batch-update-game-metadata-progress', {
          gameId,
          gameName,
          dataSource,
          dataSourceId: selectedResult.id,
          fields,
          options,
          status: 'success',
          current,
          total
        })

        return {
          gameId,
          success: true,
          dataSourceId: selectedResult.id,
          gameName
        }
      } catch (error) {
        // 构造错误信息
        const errorMessage = error instanceof Error ? error.message : '未知错误'

        // 发送失败进度通知
        ipcManager.send('adder:batch-update-game-metadata-progress', {
          gameId,
          gameName: gameDoc?.metadata?.name || null,
          dataSource,
          dataSourceId: null,
          fields,
          options,
          status: 'error',
          error: errorMessage,
          current,
          total
        })

        // 返回错误结果
        return {
          gameId,
          success: false,
          error: errorMessage,
          dataSourceId: null,
          gameName: gameDoc?.metadata?.name || null
        }
      }
    }

    // 分批处理所有游戏
    const processBatch = async (gameIds: string[]): Promise<void> => {
      let successful = 0
      let failed = 0

      // 分批处理游戏
      for (let i = 0; i < gameIds.length; i += concurrency) {
        const batch = gameIds.slice(i, i + concurrency)

        // 创建处理任务，传入游戏ID和索引
        const batchPromises = batch.map((gameId) => processGame(gameId))

        const batchResults = await Promise.all(batchPromises)

        // 处理结果
        batchResults.forEach((result) => {
          if (result.success) {
            successful++
          } else {
            failed++
          }
          results.results.push(result)
        })
      }

      // 更新最终结果
      results.successfulUpdates = successful
      results.failedUpdates = failed
    }

    // 执行批处理
    await processBatch(gameIds)

    return results
  } catch (error) {
    log.error('[Updater] 批量更新游戏元数据失败:', error)
    throw error
  }
}

export async function updateGameMetadata({
  dbId,
  dataSource,
  dataSourceId,
  fields = ['#all'] as (GameMetadataField | GameMetadataUpdateMode)[],
  backgroundUrl,
  options = {}
}: {
  dbId: string
  dataSource: string
  dataSourceId: string
  fields?: (GameMetadataField | GameMetadataUpdateMode)[]
  backgroundUrl?: string
  options?: GameMetadataUpdateOptions
}): Promise<void> {
  try {
    // 获取当前游戏文档
    const gameDoc = await GameDBManager.getGame(dbId)

    // 解析更新模式和字段
    const updateAll = fields.includes('#all' as GameMetadataUpdateMode)
    const updateMissingOnly = fields.includes('#missing' as GameMetadataUpdateMode)
    const specificFields = fields.filter(
      (f) => f !== '#all' && f !== '#missing'
    ) as GameMetadataField[]

    // 确定要更新的字段列表
    const fieldsToUpdate: GameMetadataField[] = updateAll
      ? [
          'name',
          'originalName',
          'releaseDate',
          'description',
          'developers',
          'publishers',
          'genres',
          'platforms',
          'tags',
          'relatedSites',
          'extra',
          'cover',
          'background',
          'logo',
          'icon'
        ]
      : updateMissingOnly
        ? [] // 将在获取元数据后确定缺失字段
        : specificFields

    // 设置默认选项
    const {
      overwriteExisting = true,
      updateImages = true,
      mergeStrategy = 'replace',
      sourcesPriority = []
    } = options

    // 图像相关字段
    const imageFields: GameMetadataField[] = ['cover', 'background', 'logo', 'icon']

    // 需要通过额外API获取的字段
    const specialFetchFields: GameMetadataField[] = ['description', 'tags', 'extra']

    // 获取数据源能力信息
    const providerInfo = scraperManager.getProviderInfo(dataSource)
    const providerCapabilities = providerInfo?.capabilities || []

    // 第一步：获取基本元数据
    const baseMetadata = await scraperManager.getGameMetadata(dataSource, {
      type: 'id',
      value: dataSourceId
    })

    // 准备图像获取任务
    const imageFetchTasks: Array<{ type: GameMetadataField; promise: Promise<string[]> }> = []

    // 根据需要获取不同类型的图像
    if (updateImages) {
      // 处理图像字段
      imageFields.forEach((imageField) => {
        if (updateAll || fieldsToUpdate.includes(imageField)) {
          // 特殊处理背景图片，优先使用传入的URL
          if (imageField === 'background' && backgroundUrl) {
            imageFetchTasks.push({
              type: imageField,
              promise: Promise.resolve([backgroundUrl])
            })
          } else {
            // 检查当前数据源是否支持此图像类型的能力
            const methodName =
              `getGame${imageField.charAt(0).toUpperCase() + imageField.slice(1)}s` as ScraperCapabilities

            // 判断数据源是否支持获取此类图像
            if (providerCapabilities.includes(methodName)) {
              // 当前数据源支持此图像类型，直接使用当前数据源
              imageFetchTasks.push({
                type: imageField,
                promise: (
                  scraperManager[methodName] as (
                    dataSource: string,
                    identifier: { type: string; value: string }
                  ) => Promise<string[]>
                )(dataSource, {
                  type: 'id',
                  value: dataSourceId
                })
              })
            } else if (imageField === 'logo' || imageField === 'icon') {
              // 特殊处理 logo 和 icon，使用 steamgriddb 作为备选
              const alternativeSource = 'steamgriddb'
              const alternativeMethod = imageField === 'logo' ? 'getGameLogos' : 'getGameIcons'

              // 已经获取到基本元数据，直接使用
              imageFetchTasks.push({
                type: imageField,
                promise: scraperManager[alternativeMethod](
                  alternativeSource,
                  dataSource === 'steam'
                    ? { type: 'id', value: dataSourceId }
                    : {
                        type: 'name',
                        value: baseMetadata.originalName || baseMetadata.name
                      }
                )
              })
            }
          }
        }
      })
    }

    // 处理图片获取结果
    const imageResults = await Promise.all(
      imageFetchTasks.map((task) => task.promise.then((urls) => ({ type: task.type, urls })))
    )

    // 更新元数据对象
    const updatedMetadata = { ...gameDoc.metadata }

    // 确定更新缺失字段的情况下需要更新的字段
    if (updateMissingOnly) {
      // 检查基本元数据中哪些字段是缺失的
      Object.keys(baseMetadata).forEach((key) => {
        const typedKey = key as keyof GameMetadata
        if (
          !updatedMetadata[typedKey] ||
          (Array.isArray(updatedMetadata[typedKey]) && updatedMetadata[typedKey].length === 0) ||
          updatedMetadata[typedKey] === ''
        ) {
          if (!fieldsToUpdate.includes(typedKey as GameMetadataField)) {
            fieldsToUpdate.push(typedKey as GameMetadataField)
          }
        }
      })

      // 检查特殊字段是否缺失
      if (!updatedMetadata.description || updatedMetadata.description === '') {
        fieldsToUpdate.push('description')
      }

      if (!updatedMetadata.tags || updatedMetadata.tags.length === 0) {
        fieldsToUpdate.push('tags')
      }

      if (!updatedMetadata.extra || updatedMetadata.extra.length === 0) {
        fieldsToUpdate.push('extra')
      }
    }

    // 更新基本元数据字段
    if (updateAll) {
      // 全部替换基本元数据
      const basicFields = Object.keys(baseMetadata).filter(
        (key) =>
          !specialFetchFields.includes(key as GameMetadataField) &&
          !imageFields.includes(key as GameMetadataField)
      )

      basicFields.forEach((key) => {
        const typedKey = key as keyof GameMetadata
        updatedMetadata[typedKey] = baseMetadata[typedKey] as any
      })
    } else {
      // 更新指定的基本字段
      fieldsToUpdate.forEach((field) => {
        if (
          !specialFetchFields.includes(field) &&
          !imageFields.includes(field) &&
          baseMetadata[field] !== undefined
        ) {
          // 对数组类型的字段应用合并策略
          if (Array.isArray(baseMetadata[field])) {
            if (mergeStrategy === 'replace' || !updatedMetadata[field]) {
              updatedMetadata[field] = baseMetadata[field]
            } else if (mergeStrategy === 'append') {
              updatedMetadata[field] = [...(updatedMetadata[field] || []), ...baseMetadata[field]]
            } else if (mergeStrategy === 'merge') {
              updatedMetadata[field] = Array.from(
                new Set([...(updatedMetadata[field] || []), ...baseMetadata[field]])
              )
            }
          } else {
            // 非数组字段直接替换
            updatedMetadata[field] = baseMetadata[field]
          }
        }
      })
    }

    // 确保ID字段始终存在
    updatedMetadata[`${dataSource}Id`] = dataSourceId

    // 确保originalName不为null
    if (updateAll || fieldsToUpdate.includes('originalName')) {
      updatedMetadata.originalName = baseMetadata.originalName ?? ''
    }

    // 第二步：处理特殊字段 (description, tags, extra)
    // 准备需要进行额外获取的特殊字段列表
    const needFetchSpecialFields: GameMetadataField[] = []

    // 处理description字段
    if (updateAll || fieldsToUpdate.includes('description')) {
      // 先检查baseMetadata中是否已有描述
      if (baseMetadata.description && baseMetadata.description.trim()) {
        // 如果主数据源已有描述，直接使用
        updatedMetadata.description = baseMetadata.description
      } else {
        // 如果主数据源没有描述，需要额外获取
        needFetchSpecialFields.push('description')
      }
    }

    // 处理tags字段
    if (updateAll || fieldsToUpdate.includes('tags')) {
      // 先检查baseMetadata中是否已有标签
      if (baseMetadata.tags && baseMetadata.tags.length > 0) {
        // 如果主数据源已有标签，根据合并策略处理
        if (mergeStrategy === 'replace' || !updatedMetadata.tags) {
          updatedMetadata.tags = baseMetadata.tags
        } else if (mergeStrategy === 'append') {
          updatedMetadata.tags = [...(updatedMetadata.tags || []), ...baseMetadata.tags]
        } else if (mergeStrategy === 'merge') {
          updatedMetadata.tags = Array.from(
            new Set([...(updatedMetadata.tags || []), ...baseMetadata.tags])
          )
        }
      } else {
        // 如果主数据源没有标签，需要额外获取
        needFetchSpecialFields.push('tags')
      }
    }

    // 处理extra字段
    if (updateAll || fieldsToUpdate.includes('extra')) {
      // 先检查baseMetadata中是否已有额外信息
      if (baseMetadata.extra && baseMetadata.extra.length > 0) {
        // 如果主数据源已有额外信息，根据合并策略处理
        if (mergeStrategy === 'replace' || !updatedMetadata.extra) {
          updatedMetadata.extra = baseMetadata.extra
        } else {
          // 合并额外信息
          const extraMap = new Map()

          // 先加入现有数据
          if (updatedMetadata.extra) {
            updatedMetadata.extra.forEach((e) => {
              extraMap.set(e.key, e.value)
            })
          }

          // 根据合并策略添加新数据
          baseMetadata.extra.forEach((e) => {
            if (!extraMap.has(e.key) || overwriteExisting) {
              extraMap.set(e.key, e.value)
            } else if (mergeStrategy === 'append') {
              extraMap.set(e.key, [...extraMap.get(e.key), ...e.value])
            } else if (mergeStrategy === 'merge') {
              extraMap.set(e.key, Array.from(new Set([...extraMap.get(e.key), ...e.value])))
            }
          })

          updatedMetadata.extra = Array.from(extraMap.entries()).map(([key, value]) => ({
            key,
            value
          }))
        }
      } else {
        // 如果主数据源没有额外信息，需要额外获取
        needFetchSpecialFields.push('extra')
      }
    }

    // 如果还有特殊字段需要获取，使用游戏名称进行额外搜索
    if (needFetchSpecialFields.length > 0) {
      const gameName = baseMetadata.name || updatedMetadata.name

      if (gameName) {
        // 使用游戏名称作为标识符
        const nameIdentifier = { type: 'name', value: gameName } as ScraperIdentifier
        const specialFetchPromises: {
          description?: Promise<GameDescriptionList>
          tags?: Promise<GameTagsList>
          extra?: Promise<GameExtraInfoList>
        } = {}

        // 准备额外的获取任务
        if (needFetchSpecialFields.includes('description')) {
          specialFetchPromises.description = scraperManager.getGameDescriptionList(nameIdentifier)
        }

        if (needFetchSpecialFields.includes('tags')) {
          specialFetchPromises.tags = scraperManager.getGameTagsList(nameIdentifier)
        }

        if (needFetchSpecialFields.includes('extra')) {
          specialFetchPromises.extra = scraperManager.getGameExtraInfoList(nameIdentifier)
        }

        // 执行额外的获取任务
        const specialResults = await Promise.all(Object.values(specialFetchPromises))
        const specialResultsMap: {
          description?: GameDescriptionList
          tags?: GameTagsList
          extra?: GameExtraInfoList
        } = {}

        // 映射结果
        let resultIndex = 0
        Object.keys(specialFetchPromises).forEach((key) => {
          specialResultsMap[key] = specialResults[resultIndex++]
        })

        // 处理额外获取的描述
        if (specialResultsMap.description) {
          const descriptions = specialResultsMap.description
          if (descriptions && descriptions.length > 0) {
            let selectedDescription = ''

            // 按来源优先级选择
            for (const sourceId of sourcesPriority) {
              const match = descriptions.find((d) => d.dataSource === sourceId && d.description)
              if (match) {
                selectedDescription = match.description
                break
              }
            }

            // 如果没找到优先来源的描述，使用第一个
            if (!selectedDescription && descriptions[0]) {
              selectedDescription = descriptions[0].description
            }

            if (selectedDescription) {
              updatedMetadata.description = selectedDescription
            }
          }
        }

        // 处理额外获取的标签
        if (specialResultsMap.tags) {
          const tagsList = specialResultsMap.tags
          if (tagsList && tagsList.length > 0) {
            if (mergeStrategy === 'replace' || !updatedMetadata.tags) {
              // 使用第一个来源的标签
              updatedMetadata.tags = tagsList[0].tags
            } else {
              // 合并所有来源的标签
              const allTags = tagsList.flatMap((item) => item.tags)

              if (mergeStrategy === 'append') {
                updatedMetadata.tags = [...(updatedMetadata.tags || []), ...allTags]
              } else {
                // 'merge'
                updatedMetadata.tags = Array.from(
                  new Set([...(updatedMetadata.tags || []), ...allTags])
                )
              }
            }
          }
        }

        // 处理额外获取的extra信息
        if (specialResultsMap.extra) {
          const extraInfo = specialResultsMap.extra
          if (extraInfo && extraInfo.length > 0) {
            // 按合并策略处理extra信息
            if (mergeStrategy === 'replace' || !updatedMetadata.extra) {
              // 使用第一个来源的extra
              updatedMetadata.extra = extraInfo[0].extra
            } else {
              // 合并所有来源的extra
              const extraMap = new Map()

              // 先加入现有数据
              if (updatedMetadata.extra) {
                updatedMetadata.extra.forEach((e) => {
                  extraMap.set(e.key, e.value)
                })
              }

              // 根据合并策略添加新数据
              extraInfo.forEach((item) => {
                item.extra.forEach((e) => {
                  if (!extraMap.has(e.key) || overwriteExisting) {
                    extraMap.set(e.key, e.value)
                  } else if (mergeStrategy === 'append') {
                    extraMap.set(e.key, [...extraMap.get(e.key), ...e.value])
                  } else if (mergeStrategy === 'merge') {
                    extraMap.set(e.key, Array.from(new Set([...extraMap.get(e.key), ...e.value])))
                  }
                })
              })

              updatedMetadata.extra = Array.from(extraMap.entries()).map(([key, value]) => ({
                key,
                value
              }))
            }
          }
        }
      }
    }

    // 更新游戏文档
    gameDoc.metadata = updatedMetadata

    // 准备所有数据库写操作
    const dbPromises: Promise<unknown>[] = [GameDBManager.setGame(dbId, gameDoc)]

    // 添加图片保存操作
    if (updateImages) {
      imageResults.forEach((result) => {
        if (result.urls.length > 0 && result.urls[0]) {
          dbPromises.push(
            GameDBManager.setGameImage(
              dbId,
              result.type as 'cover' | 'background' | 'logo' | 'icon',
              result.urls[0]
            )
          )
        }
      })
    }

    // 并行执行所有数据库操作
    await Promise.all(dbPromises)
  } catch (error) {
    log.error('[Updater] 更新游戏元数据失败:', error)
    throw error
  }
}
