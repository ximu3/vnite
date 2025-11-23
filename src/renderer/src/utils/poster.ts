import {
  defaultPayloadMap,
  RenderReponse,
  type RenderOptions,
  type TemplatePayloads
} from '@appTypes/poster'
import { ipcManager } from '~/app/ipc'

export async function invokePosterRender<T extends keyof TemplatePayloads>(
  templateId: T,
  payload: Partial<TemplatePayloads[T]>,
  options: RenderOptions = { outputPath: 'C:/Users/zj/Downloads' }
): Promise<RenderReponse> {
  return ipcManager.invoke('poster:render', {
    id: templateId,
    payload: { ...defaultPayloadMap[templateId], ...payload },
    options
  })
}
