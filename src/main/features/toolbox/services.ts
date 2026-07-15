import { spawn } from 'child_process'
import { app } from 'electron'
import log from 'electron-log/main'
import fse from 'fs-extra'
import path from 'path'
import { baseDBManager, ConfigDBManager } from '~/core/database'
import { convertToWebP } from '~/utils'

async function saveToolIcon(toolId: string, icon: Buffer | string): Promise<void> {
  const webpIcon = await convertToWebP(icon)
  await baseDBManager.putAttachment(
    'config-local',
    'toolbox',
    `${toolId}.webp`,
    webpIcon,
    'image/webp'
  )
}

export async function launchTool(tool: {
  path: string
  args: string
  workingDirectory: string
}): Promise<void> {
  const cwd = tool.workingDirectory || path.dirname(tool.path)
  const command = ['start', '""', `"${tool.path}"`, tool.args].filter(Boolean).join(' ')

  try {
    const launcher = spawn(command, {
      shell: true,
      detached: true,
      stdio: 'ignore',
      cwd
    })

    await new Promise<void>((resolve, reject) => {
      launcher.once('spawn', () => {
        resolve()
      })
      launcher.once('error', reject)
    })

    launcher.unref()

    log.info('[Toolbox] Launch requested', {
      path: tool.path,
      args: tool.args,
      workingDirectory: cwd
    })
  } catch (error) {
    log.error('[Toolbox] Failed to launch tool', {
      path: tool.path,
      args: tool.args,
      workingDirectory: cwd,
      error
    })
  }
}

export async function refreshToolIcon(toolId: string, exePath: string): Promise<void> {
  try {
    const trimmedPath = exePath.trim()
    if (!trimmedPath) {
      throw new Error('Tool executable path is required')
    }

    const resolvedPath = path.resolve(trimmedPath)
    if (!(await fse.pathExists(resolvedPath))) {
      throw new Error('Tool executable path does not exist')
    }

    const icon = await app.getFileIcon(resolvedPath, { size: 'large' })

    if (icon.isEmpty()) {
      throw new Error('Failed to read executable icon')
    }

    await saveToolIcon(toolId, icon.toPNG())

    log.info('[Toolbox] Saved tool icon from executable', {
      toolId,
      exePath: resolvedPath
    })
  } catch (error) {
    log.error('[Toolbox] Failed to refresh tool icon', {
      toolId,
      exePath,
      error
    })
    throw error
  }
}

async function removeToolIcon(toolId: string): Promise<void> {
  try {
    await baseDBManager.removeAttachment('config-local', 'toolbox', `${toolId}.webp`)

    log.info('[Toolbox] Removed tool icon', { toolId })
  } catch (error) {
    log.error('[Toolbox] Failed to remove tool icon', {
      toolId,
      error
    })
    throw error
  }
}

export async function removeTool(toolId: string): Promise<void> {
  try {
    const tools = await ConfigDBManager.getConfigLocalValue('toolbox.tools')
    const { [toolId]: _removedTool, ...restTools } = tools

    await removeToolIcon(toolId)

    if (toolId in tools) {
      await ConfigDBManager.setConfigLocalValue('toolbox.tools', restTools)
    }

    log.info('[Toolbox] Removed tool', { toolId })
  } catch (error) {
    log.error('[Toolbox] Failed to remove tool', {
      toolId,
      error
    })
    throw error
  }
}
