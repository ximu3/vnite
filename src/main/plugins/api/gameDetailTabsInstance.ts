import { ipcManager } from '~/core/ipc'
import { GameDetailTabs } from './gameDetailTabs'

export const gameDetailTabs = new GameDetailTabs(() =>
  ipcManager.send('plugin:detail-tabs-changed')
)
