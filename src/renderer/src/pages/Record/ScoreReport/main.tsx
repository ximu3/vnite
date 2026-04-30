import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScoreEditorDialog } from '~/components/Game/Config/ManageMenu/ScoreEditorDialog'
import { getGamesByScoreRange } from '~/stores/game/recordUtils'
import { useScoreReportStore } from '../store'
import { ScoreReportCompactView } from './ScoreReportCompactView'
import { ScoreReportDetailedView } from './ScoreReportDetailedView'
import { ScoreCategoryData, ScoreReportView } from './types'

// Main Scoring Report Component
export function ScoreReport(): React.JSX.Element {
  const { t } = useTranslation('record')
  const [view, setView] = useState<ScoreReportView>('compact')

  const { scoreEditorState, closeScoreEditor, bumpVersion, scoreReportVersion } =
    useScoreReportStore()

  const categories = useMemo<ScoreCategoryData[]>(
    () => [
      {
        id: 'excellent',
        title: t('score.categories.excellent.title'),
        description: t('score.categories.excellent.description'),
        minScore: 9,
        maxScore: 10,
        className: 'border-primary',
        games: getGamesByScoreRange(9, 10)
      },
      {
        id: 'great',
        title: t('score.categories.great.title'),
        description: t('score.categories.great.description'),
        minScore: 8,
        maxScore: 8.9,
        className: 'border-secondary',
        games: getGamesByScoreRange(8, 8.9)
      },
      {
        id: 'good',
        title: t('score.categories.good.title'),
        description: t('score.categories.good.description'),
        minScore: 7,
        maxScore: 7.9,
        className: 'border-accent',
        games: getGamesByScoreRange(7, 7.9)
      },
      {
        id: 'average',
        title: t('score.categories.average.title'),
        description: t('score.categories.average.description'),
        minScore: 6,
        maxScore: 6.9,
        className: 'border-muted',
        games: getGamesByScoreRange(6, 6.9)
      },
      {
        id: 'notRecommended',
        title: t('score.categories.notRecommended.title'),
        description: t('score.categories.notRecommended.description'),
        minScore: 0,
        maxScore: 5.9,
        className: 'border-destructive',
        games: getGamesByScoreRange(0, 5.9)
      }
    ],
    [t, scoreReportVersion]
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
