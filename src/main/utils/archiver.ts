import fse from 'fs-extra'
import archiver from 'archiver'
import path from 'path'

interface ZipOptions {
  /** 压缩级别 1-9，默认为 9 (最佳压缩) */
  compressionLevel?: number
  /** 是否包含根文件夹，默认为 true */
  includeRoot?: boolean
  /** 排除的文件或文件夹模式 */
  exclude?: string[]
}

/**
 * 压缩文件夹
 * @param sourcePath 要压缩的文件夹路径
 * @param targetDir 压缩文件保存目录
 * @param zipName 压缩文件名称（不需要包含.zip扩展名）
 * @param options 压缩选项
 * @returns 返回生成的压缩文件完整路径
 */
export async function zipFolder(
  sourcePath: string,
  targetDir: string,
  zipName: string,
  options: ZipOptions = {}
): Promise<string> {
  // 规范化路径
  const normalizedSourcePath = path.resolve(sourcePath)
  const normalizedTargetDir = path.resolve(targetDir)

  // 检查源文件夹是否存在
  const sourceExists = await fse.pathExists(normalizedSourcePath)
  if (!sourceExists) {
    throw new Error(`Source folder not found: ${normalizedSourcePath}`)
  }

  // 确保目标目录存在
  await fse.ensureDir(normalizedTargetDir)

  // 设置默认选项
  const { compressionLevel = 9, includeRoot = true, exclude = [] } = options

  // 构建输出文件路径
  const zipFileName = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`
  const outputPath = path.join(normalizedTargetDir, zipFileName)

  // 创建压缩
  const archive = archiver('zip', {
    zlib: { level: compressionLevel }
  })

  // 创建写入流
  const output = fse.createWriteStream(outputPath)

  // 将输出流连接到压缩器
  archive.pipe(output)

  // 获取源文件夹名称
  const folderName = path.basename(normalizedSourcePath)

  // 添加文件到压缩包
  if (includeRoot) {
    // 包含根文件夹
    archive.directory(normalizedSourcePath, folderName, (entry) => {
      // 检查是否应该排除该文件
      if (
        exclude.some(
          (pattern) => entry.name.includes(pattern) || entry.name.match(new RegExp(pattern))
        )
      ) {
        return false
      }
      return entry
    })
  } else {
    // 不包含根文件夹
    archive.directory(normalizedSourcePath, false, (entry) => {
      if (
        exclude.some(
          (pattern) => entry.name.includes(pattern) || entry.name.match(new RegExp(pattern))
        )
      ) {
        return false
      }
      return entry
    })
  }

  // 等待压缩完成
  await new Promise<void>((resolve, reject) => {
    output.on('close', resolve)
    archive.on('error', reject)
    archive.finalize()
  })

  return outputPath
}
