import { initGameStore } from './gameStore'
export { useGameStore } from './gameStore'

export async function initStores(): Promise<void> {
  await initGameStore()
}
