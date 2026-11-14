import fse from 'fs-extra'
import archiver from 'archiver'
import path from 'path'
import yauzl from 'yauzl'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import { crc32 } from 'zlib'
import log from 'electron-log/main'

interface ZipOptions {
  // Compression level 1-9, default 9 (best compression)
  compressionLevel?: number
  // If or not the root folder is included, default is false
  includeRoot?: boolean
  // Excluded file or folder patterns
  exclude?: string[]
}

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
    log.error(`[Utils] Failed to zip folder ${sourcePath}`, error)
    throw error
  }
}

// yauzl does not verify CRC-32, so compare the extracted bytes with the
// checksum recorded in the central directory (like adm-zip did).
function crc32Check(entry: yauzl.Entry): Transform {
  let crc = 0
  return new Transform({
    transform(chunk: Buffer, _encoding, callback): void {
      crc = crc32(chunk, crc)
      callback(null, chunk)
    },
    flush(callback): void {
      if (crc >>> 0 !== entry.crc32 >>> 0) {
        callback(new Error(`CRC-32 mismatch for zip entry: ${entry.fileName}`))
      } else {
        callback()
      }
    }
  })
}

interface UnzipOptions {
  // Whether to overwrite existing files, default is true.
  overwrite?: boolean
}

export async function unzipFile(
  zipPath: string,
  targetDir: string,
  options: UnzipOptions = {}
): Promise<string[]> {
  try {
    const { overwrite = true } = options
    const normalizedTargetDir = path.resolve(targetDir)
    await fse.ensureDir(normalizedTargetDir)

    // Stream entries one by one so archives larger than 2 GiB (Node's Buffer limit) can be extracted
    const zip = await yauzl.openPromise(zipPath, { autoClose: true })
    const extractedFiles: string[] = []

    for await (const entry of zip.eachEntry()) {
      const filePath = path.resolve(normalizedTargetDir, entry.fileName)
      if (
        filePath !== normalizedTargetDir &&
        !filePath.startsWith(normalizedTargetDir + path.sep)
      ) {
        throw new Error(`Zip entry is outside the target directory: ${entry.fileName}`)
      }

      if (/\/$/.test(entry.fileName)) {
        await fse.ensureDir(filePath)
        continue
      }

      if (!overwrite && (await fse.pathExists(filePath))) {
        continue
      }

      await fse.ensureDir(path.dirname(filePath))
      const readStream = await zip.openReadStreamPromise(entry)
      try {
        await pipeline(readStream, crc32Check(entry), fse.createWriteStream(filePath))
      } catch (error) {
        await fse.remove(filePath)
        throw error
      }
      extractedFiles.push(filePath)
    }

    return extractedFiles
  } catch (error) {
    log.error(`[Utils] Failed to unzip file ${zipPath}`, error)
    throw error
  }
}
