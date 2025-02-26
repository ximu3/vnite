import { spawn } from 'child_process'
import { GameDBManager } from '~/database'
import { startMonitor } from '~/monitor'

//todo

export async function fileLuancher(gameId: string): Promise<void> {
  try {
    const fileConfig = await GameDBManager.getGameLocalValue(gameId, 'launcher.fileConfig')

    const launcher = spawn('start', ['""', `"${fileConfig.path}"`], {
      shell: true,
      detached: true,
      cwd: fileConfig.workingDirectory,
      stdio: 'ignore'
    })

    // error handling
    launcher.on('error', (err) => {
      console.error(`Failed to launch file for game ${gameId}:`, err)
      throw err
    })

    // Letting sub-processes run independently
    launcher.unref()

    // Startup Monitor
    await startMonitor(gameId)
  } catch (error) {
    console.error(`Error in fileLauncher for game ${gameId}:`, error)
    throw error
  }
}

export async function urlLauncher(gameId: string): Promise<void> {
  try {
    const urlConfig = await GameDBManager.getGameLocalValue(gameId, 'launcher.urlConfig')

    if (!urlConfig || !urlConfig.url) {
      throw new Error(`Invalid URL configuration for game ${gameId}`)
    }

    const args = urlConfig.browserPath
      ? ['""', urlConfig.browserPath, urlConfig.url] // Use the specified browser
      : ['""', urlConfig.url] // Use the specified browser

    const launcher = spawn('start', args, {
      shell: true,
      detached: true,
      stdio: 'ignore'
    })

    launcher.on('error', (err) => {
      console.error(`Failed to launch URL for game ${gameId}:`, err)
      throw err
    })

    launcher.unref()

    // Startup Monitor
    await startMonitor(gameId)
  } catch (err) {
    console.error(`Error in urlLauncher for game ${gameId}:`, err)
    throw err
  }
}

export async function scriptLauncher(gameId: string): Promise<void> {
  try {
    const scriptConfig = await GameDBManager.getGameLocalValue(gameId, 'launcher.scriptConfig')

    if (!scriptConfig || !scriptConfig.command || !Array.isArray(scriptConfig.command)) {
      throw new Error(`Invalid script configuration for game ${gameId}`)
    }

    // Building command strings
    const commands = [
      '/c',
      'chcp 65001',
      scriptConfig.workingDirectory ? `cd /d "${scriptConfig.workingDirectory}"` : null,
      ...scriptConfig.command,
      'pause'
    ]
      .filter(Boolean)
      .join(' && ')

    const launcher = spawn('start', ['cmd.exe', commands], {
      shell: true,
      detached: true,
      stdio: 'ignore'
    })

    launcher.on('error', (err) => {
      console.error(`Failed to launch script for game ${gameId}:`, err)
      throw err
    })

    launcher.unref()

    // Startup Monitor
    await startMonitor(gameId)
  } catch (err) {
    console.error(`Error in scriptLauncher for game ${gameId}:`, err)
    throw err
  }
}
