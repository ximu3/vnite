import { promises as fs } from 'fs'
import { createHash } from 'crypto'
import AdmZip from 'adm-zip'
import log from 'electron-log'
import type { PluginManifest } from '@appTypes/plugin'

export class PluginUtils {
  public static async calculateFileChecksum(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath)
    return createHash('sha256')
      .update(content as Uint8Array)
      .digest('hex')
  }

  public static async verifyPackageIntegrity(
    packagePath: string,
    expectedChecksum: string
  ): Promise<boolean> {
    try {
      const actualChecksum = await this.calculateFileChecksum(packagePath)
      return actualChecksum === expectedChecksum
    } catch (error) {
      log.error('[Plugin] Failed to verify plugin package integrity:', error)
      return false
    }
  }

  public static async extractPackageInfo(packagePath: string): Promise<{
    manifest: PluginManifest
    files: string[]
    size: number
  }> {
    try {
      const zip = new AdmZip(packagePath)
      const entries = zip.getEntries()

      // Find manifest file (supports manifest.json or package.json)
      const manifestEntry = entries.find(
        (entry) =>
          (entry.entryName.endsWith('manifest.json') || entry.entryName.endsWith('package.json')) &&
          !entry.entryName.includes('node_modules')
      )

      if (!manifestEntry) {
        throw new Error('No manifest.json or package.json found in plugin package')
      }

      const manifestContent = manifestEntry.getData().toString('utf8')
      const manifest: PluginManifest = JSON.parse(manifestContent)

      const files = entries.filter((entry) => !entry.isDirectory).map((entry) => entry.entryName)

      const stats = await fs.stat(packagePath)
      const size = stats.size

      return { manifest, files, size }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to parse plugin package: ${errorMessage}`)
    }
  }

  public static validatePluginId(id: string): { valid: boolean; error?: string } {
    // Plugin ID rules: can only contain letters, numbers, hyphens and underscores
    const idRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/

    if (!idRegex.test(id)) {
      return {
        valid: false,
        error: 'Plugin ID can only contain letters, numbers, hyphens and underscores'
      }
    }

    if (id.length < 3) {
      return {
        valid: false,
        error: 'Plugin ID must be at least 3 characters long'
      }
    }

    if (id.length > 50) {
      return {
        valid: false,
        error: 'Plugin ID cannot exceed 50 characters'
      }
    }

    return { valid: true }
  }

  public static formatSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }
}
