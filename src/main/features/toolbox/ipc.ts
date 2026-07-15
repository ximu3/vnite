import { ipcManager } from '~/core/ipc'
import { launchTool, refreshToolIcon, removeTool } from './services'

export function setupToolboxIPC(): void {
  ipcManager.handle(
    'toolbox:launch-tool',
    async (_, tool: { path: string; args: string; workingDirectory: string }) => {
      await launchTool(tool)
    }
  )

  ipcManager.handle('toolbox:refresh-tool-icon', async (_, toolId: string, exePath: string) => {
    await refreshToolIcon(toolId, exePath)
  })

  ipcManager.handle('toolbox:remove-tool', async (_, toolId: string) => {
    await removeTool(toolId)
  })
}
