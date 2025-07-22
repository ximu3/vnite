/**
 * 插件工具类
 *
 * 提供插件开发、打包、验证等实用功能
 */

import path, { join } from 'path'
import { promises as fs } from 'fs'
import { createHash } from 'crypto'
import AdmZip from 'adm-zip'
import log from 'electron-log'
import type { PluginManifest } from '@appTypes/plugin'

export class PluginUtils {
  /**
   * 创建插件包
   */
  public static async createPluginPackage(sourceDir: string, outputPath: string): Promise<void> {
    try {
      const zip = new AdmZip()
      await this.addDirectoryToZip(zip, sourceDir, '')

      // 确保输出目录存在
      const outputDir = path.dirname(outputPath)
      await fs.mkdir(outputDir, { recursive: true })

      zip.writeZip(outputPath)
      log.info(`插件包创建成功: ${outputPath}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`创建插件包失败: ${errorMessage}`)
    }
  }

  /**
   * 递归添加目录到ZIP
   */
  private static async addDirectoryToZip(
    zip: AdmZip,
    sourceDir: string,
    relativePath: string
  ): Promise<void> {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(sourceDir, entry.name)
      const entryPath = relativePath ? join(relativePath, entry.name) : entry.name

      // 跳过特定文件和目录
      if (this.shouldSkipFile(entry.name)) {
        continue
      }

      if (entry.isDirectory()) {
        await this.addDirectoryToZip(zip, fullPath, entryPath)
      } else {
        const content = await fs.readFile(fullPath)
        zip.addFile(entryPath, content)
      }
    }
  }

  /**
   * 检查是否应该跳过文件
   */
  private static shouldSkipFile(fileName: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '.env',
      '.env.local',
      'dist',
      'build',
      'coverage',
      '.nyc_output'
    ]

    return skipPatterns.some((pattern) => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'))
        return regex.test(fileName)
      }
      return fileName === pattern
    })
  }

  /**
   * 计算文件校验和
   */
  public static async calculateFileChecksum(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath)
    return createHash('sha256')
      .update(content as Uint8Array)
      .digest('hex')
  }

  /**
   * 验证插件包完整性
   */
  public static async verifyPackageIntegrity(
    packagePath: string,
    expectedChecksum: string
  ): Promise<boolean> {
    try {
      const actualChecksum = await this.calculateFileChecksum(packagePath)
      return actualChecksum === expectedChecksum
    } catch (error) {
      log.error('验证插件包完整性失败:', error)
      return false
    }
  }

  /**
   * 解析插件包信息
   */
  public static async extractPackageInfo(packagePath: string): Promise<{
    manifest: PluginManifest
    files: string[]
    size: number
  }> {
    try {
      const zip = new AdmZip(packagePath)
      const entries = zip.getEntries()

      // 查找manifest文件 (支持 manifest.json 或 package.json)
      const manifestEntry = entries.find(
        (entry) =>
          (entry.entryName.endsWith('manifest.json') || entry.entryName.endsWith('package.json')) &&
          !entry.entryName.includes('node_modules')
      )

      if (!manifestEntry) {
        throw new Error('插件包中未找到 manifest.json 或 package.json')
      }

      const manifestContent = manifestEntry.getData().toString('utf8')
      const manifest: PluginManifest = JSON.parse(manifestContent)

      const files = entries.filter((entry) => !entry.isDirectory).map((entry) => entry.entryName)

      const stats = await fs.stat(packagePath)
      const size = stats.size

      return { manifest, files, size }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`解析插件包失败: ${errorMessage}`)
    }
  }

  /**
   * 验证插件ID格式
   */
  public static validatePluginId(id: string): { valid: boolean; error?: string } {
    // 插件ID规则：只能包含字母、数字、连字符和下划线
    const idRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/

    if (!idRegex.test(id)) {
      return {
        valid: false,
        error: '插件ID只能包含字母、数字、连字符和下划线，且不能以数字开头'
      }
    }

    if (id.length < 3) {
      return {
        valid: false,
        error: '插件ID长度不能少于3个字符'
      }
    }

    if (id.length > 50) {
      return {
        valid: false,
        error: '插件ID长度不能超过50个字符'
      }
    }

    return { valid: true }
  }

  /**
   * 格式化文件大小
   */
  public static formatSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * 比较版本号
   */
  public static compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)

    const maxLength = Math.max(v1Parts.length, v2Parts.length)

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }

    return 0
  }
}
