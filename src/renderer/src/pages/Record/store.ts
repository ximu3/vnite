import { create } from 'zustand'

export interface ScoreReportStore {
  scoreEditorState: { open: true; gameId: string } | { open: false }
  scoreReportVersion: number
  openScoreEditor: (gameId: string) => void
  closeScoreEditor: () => void
  bumpVersion: () => void
}

export const useScoreReportStore = create<ScoreReportStore>((set) => ({
  scoreEditorState: { open: false },
  scoreReportVersion: 0,
  openScoreEditor: (gameId) =>
    set({
      scoreEditorState: { open: true, gameId }
    }),
  closeScoreEditor: () =>
    set({
      scoreEditorState: { open: false }
    }),
  bumpVersion: () => set((s) => ({ scoreReportVersion: s.scoreReportVersion + 1 }))
}))
