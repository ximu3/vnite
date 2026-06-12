import { spawn } from 'child_process'
import log from 'electron-log/main'
import path from 'path'

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
