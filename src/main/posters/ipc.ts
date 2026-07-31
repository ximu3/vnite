import { PosterRenderArgs, TemplatePayloads } from '@appTypes/poster'
import log from 'electron-log/main'
import { ipcManager } from '~/core/ipc'
import { PosterRegistrar } from './registry'

export function setupPosterIPC(): void {
  ipcManager.handle(
    'poster:render',
    async <T extends keyof TemplatePayloads>(_, args: PosterRenderArgs<T>) => {
      const { id, payload, options, context } = args
      log.info('[Poster] render request', {
        id,
        payload,
        options,
        includedGameCount: context?.includedGameIds?.length
      })
      try {
        return await PosterRegistrar.render(id, payload, options, context)
      } catch (error) {
        log.error('[Poster] render failed', { id, error })
        throw error
      }
    }
  )
}
