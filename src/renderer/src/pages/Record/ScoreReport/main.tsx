import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScoreEditorDialog } from '~/components/Game/Config/ManageMenu/ScoreEditorDialog'
import { useGameRegistry, useNSFWFilteredGameIds } from '~/stores/game'
import { useScoreReportStore } from '../store'
import { createScoreReportCategories } from './data'
import { ScoreReportCompactView } from './ScoreReportCompactView'
import { ScoreReportDetailedView } from './ScoreReportDetailedView'
import { ScoreCategoryData, ScoreReportView } from './types'

// Main Scoring Report Component
export function ScoreReport(): React.JSX.Element {
  const { t } = useTranslation('record')
  const [view, setView] = useState<ScoreReportView>('compact')
  const filteredGameIds = useNSFWFilteredGameIds()
  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)

  const { scoreEditorState, closeScoreEditor, bumpVersion, scoreReportVersion } =
    useScoreReportStore()

  const categories = useMemo<ScoreCategoryData[]>(
    () => createScoreReportCategories(t, filteredGameIds, gameMetaIndex),
    [t, scoreReportVersion, filteredGameIds, gameMetaIndex]
  )

  return (
    <div>
      <Tabs
        value={view}
        onValueChange={(value) => setView(value as ScoreReportView)}
        className="w-full gap-0"
      >
        <div className="flex flex-row gap-4 mb-6 justify-between">
          <div>
            <div className="flex items-center mb-2 space-x-2">
              <Trophy className="w-5 h-5" />
              <h2 className="text-2xl font-bold">{t('score.title')}</h2>
            </div>
            <p className="text-muted-foreground">{t('score.description')}</p>
          </div>

          <TabsList className="shrink-0 self-start">
            <TabsTrigger value="compact">{t('score.views.compact')}</TabsTrigger>
            <TabsTrigger value="detailed">{t('score.views.detailed')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="compact">
          <ScoreReportCompactView categories={categories} />
        </TabsContent>

        <TabsContent value="detailed">
          <ScoreReportDetailedView categories={categories} />
        </TabsContent>
      </Tabs>

      {scoreEditorState.open && (
        <ScoreEditorDialog
          gameId={scoreEditorState.gameId}
          setIsOpen={(open) => {
            if (!open) {
              closeScoreEditor()
              bumpVersion()
            }
          }}
        />
      )}
    </div>
  )
}
