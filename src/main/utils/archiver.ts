import fse from 'fs-extra'
import archiver from 'archiver'
import path from 'path'
import AdmZip from 'adm-zip'
import log from 'electron-log/main'

interface ZipOptions {
  // Compression level 1-9, default 9 (best compression)
  compressionLevel?: number
  // If or not the root folder is included, default is false
  includeRoot?: boolean
  // Excluded file or folder patterns
  exclude?: string[]
}

/**
 * compressed file
 * @param sourcePath Path to the folder to be compressed
 * @param targetDir Save directory for zip files
 * @param zipName Name of the compressed file (does not need to contain the .zip extension)
 * @param options Compression Options
 * @returns Returns the full path of the generated zip file
 */
export async function zipFolder(
  sourcePath: string,
  targetDir: string,
  zipName: string,
  options: ZipOptions = {}
): Promise<string> {
  try {
    // Normalization path
    const normalizedSourcePath = path.resolve(sourcePath)
    const normalizedTargetDir = path.resolve(targetDir)

    // Check if the source folder exists
    const sourceExists = await fse.pathExists(normalizedSourcePath)
    if (!sourceExists) {
      throw new Error(`Source folder not found: ${normalizedSourcePath}`)
    }

    // Ensure that the target directory exists
    await fse.ensureDir(normalizedTargetDir)

    // Setting the default options
    const { compressionLevel = 9, includeRoot = false, exclude = [] } = options

    // Build the output file path
    const zipFileName = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`
    const outputPath = path.join(normalizedTargetDir, zipFileName)

    // Creating Compression
    const archive = archiver('zip', {
      zlib: { level: compressionLevel }
    })

    // Creating a Write Stream
    const output = fse.createWriteStream(outputPath)

    // Connect the output stream to the compressor
    archive.pipe(output)

    // Get source folder name
    const folderName = path.basename(normalizedSourcePath)

    // Add files to zip
    if (includeRoot) {
      // Include root folder
      archive.directory(normalizedSourcePath, folderName, (entry) => {
        // Check if the file should be excluded
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
      // Root folder not included
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

    // Waiting for compression to complete
    await new Promise<void>((resolve, reject) => {
      output.on('close', resolve)
      archive.on('error', reject)
      archive.finalize()
    })

    return outputPath
  } catch (error) {
    log.error(`Failed to zip folder ${sourcePath}`, error)
    throw error
  }
}

interface UnzipOptions {
  // Whether to overwrite existing files, default is true.
  overwrite?: boolean
}

/**
 * Decompressing ZIP files
 * @param zipPath ZIP file path
 * @param targetDir Unzip the target directory
 * @param options Decompression options
 * @returns Returns a list of the paths to the extracted files
 */
export async function unzipFile(
  zipPath: string,
  targetDir: string,
  options: UnzipOptions = {}
): Promise<string[]> {
  try {
    const { overwrite = true } = options
    await fse.ensureDir(targetDir)

    const extractedFiles: string[] = []
    const zip = new AdmZip(zipPath)

    const entries = zip.getEntries()

    for (const entry of entries) {
      const filePath = path.join(targetDir, entry.entryName)

      if (entry.isDirectory) {
        await fse.ensureDir(filePath)
      } else {
        if (overwrite || !(await fse.pathExists(filePath))) {
          await fse.ensureDir(path.dirname(filePath))
          zip.extractEntryTo(entry, targetDir, true, overwrite)
          extractedFiles.push(filePath)
        }
      }
    }

    return extractedFiles
  } catch (error) {
    log.error(`Failed to unzip file ${zipPath}`, error)
    throw error
  }
}
