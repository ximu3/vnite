export const GAME_DETAIL_BACKGROUND_TOP = 50 // px
export const GAME_DETAIL_BACKGROUND_FADE_END = 0.7 // 70%

export function getGameDetailBackgroundLeft(libraryBarWidth: number): number {
  return libraryBarWidth + 57 - (libraryBarWidth === 0 ? 1 : 0) // px
}
