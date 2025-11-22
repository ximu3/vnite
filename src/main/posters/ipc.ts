import { PosterRenderArgs, TemplatePayloads } from '@appTypes/poster'
import { ipcManager } from '~/core/ipc'
import { PosterRegistrar } from './registry'

export function setupPosterIPC(): void {
  ipcManager.handle(
    'poster:render',
    async <T extends keyof TemplatePayloads>(_, args: PosterRenderArgs<T>) => {
      const { id, payload, options } = args
      await PosterRegistrar.render(id, payload, options)
    }
  )
}
