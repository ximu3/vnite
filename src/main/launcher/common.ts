import { spawn } from 'child_process'
import { getDBValue } from '~/database'
import { startMonitor } from '~/monitor'

export async function fileLuancher(gameId: string): Promise<void> {
  try {
    const fileConfig = await getDBValue(`games/${gameId}/launcher.json`, ['fileConfig'], '')

    const launcher = spawn('start', ['""', `"${fileConfig.path}"`], {
      shell: true,
      detached: true,
      cwd: fileConfig.workingDirectory,
      stdio: 'ignore'
    })

    // 错误处理
    launcher.on('error', (err) => {
      console.error(`Failed to launch file for game ${gameId}:`, err)
      throw err
    })

    // 让子进程独立运行
    launcher.unref()

    // 启动监视器
    startMonitor(gameId, fileConfig.timerPath)
  } catch (error) {
    console.error(`Error in fileLauncher for game ${gameId}:`, error)
    throw error
  }
}

export async function urlLauncher(gameId: string): Promise<void> {
  try {
    const urlConfig = await getDBValue(`games/${gameId}/launcher.json`, ['urlConfig'], '')

    if (!urlConfig || !urlConfig.url) {
      throw new Error(`Invalid URL configuration for game ${gameId}`)
    }

    const args = urlConfig.browserPath
      ? ['""', urlConfig.browserPath, urlConfig.url] // 使用指定浏览器
      : ['""', urlConfig.url] // 使用默认浏览器

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

    // 启动监视器
    if (urlConfig.timerMode === 'browser') {
      startMonitor(gameId, urlConfig.browserPath)
    } else {
      startMonitor(gameId, urlConfig.timerPath)
    }
  } catch (err) {
    console.error(`Error in urlLauncher for game ${gameId}:`, err)
    throw err
  }
}

export async function scriptLauncher(gameId: string): Promise<void> {
  try {
    const scriptConfig = await getDBValue(`games/${gameId}/launcher.json`, ['scriptConfig'], '')

    if (!scriptConfig || !scriptConfig.command || !Array.isArray(scriptConfig.command)) {
      throw new Error(`Invalid script configuration for game ${gameId}`)
    }

    // 构建命令字符串
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

    // 启动监视器
    startMonitor(gameId, scriptConfig.timerPath)
  } catch (err) {
    console.error(`Error in scriptLauncher for game ${gameId}:`, err)
    throw err
  }
}
