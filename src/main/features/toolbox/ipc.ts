import { ipcManager } from '~/core/ipc'
import { launchTool } from './services'

export function setupToolboxIPC(): void {
  ipcManager.handle(
    'toolbox:launch-tool',
    async (_, tool: { path: string; args: string; workingDirectory: string }) => {
      await launchTool(tool)
    }
  )
}
