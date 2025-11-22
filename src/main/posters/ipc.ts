import { ipcManager } from '~/core/ipc'
import { PosterRegistrar, PosterRenderArgs, TemplateMap } from './registry'

export function setupPosterIPC(): void {
  ipcManager.handle(
    'poster:render',
    async <T extends keyof TemplateMap>(_, args: PosterRenderArgs<T>) => {
      const { id, payload, options } = args
      await PosterRegistrar.render(id, payload, options)
    }
  )
}
