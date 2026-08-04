import type { ReportExportOptions } from '@appTypes/report'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildReportDocument } from '../utils/reportDocument'
import templateStyles from './template.css?inline'
import type { ScoreReportExportModel } from './types'
import variantAStyles from './variantA.css?inline'
import variantBStyles from './variantB.css?inline'

// eslint-disable-next-line react-refresh/only-export-components
function ScoreReportExportTemplate({
  model,
  showScore,
  variant
}: {
  model: ScoreReportExportModel
  showScore: boolean
  variant: ReportExportOptions['reports']['scoreReport']['variant']
}): React.JSX.Element {
  return (
    <main className="score-report-export" data-report-root>
      <div className="score-report-categories">
        {model.categories.map((category) => (
          <div key={category.id} className="score-report-category" data-category={category.id}>
            <div className="score-report-category-header">
              <span className="score-report-count">{variant === 'A' && category.countLabel}</span>
            </div>

            <div className="score-report-games">
              {category.games.map((game) => (
                <article className="score-report-game" key={game.id}>
                  <div className="score-report-cover">
                    <div className="score-report-cover-placeholder">{game.name}</div>
                    {game.coverSrc && (
                      <img
                        src={game.coverSrc}
                        alt=""
                        style={
                          {
                            '--score-report-cover-position': game.coverPosition
                          } as React.CSSProperties
                        }
                      />
                    )}
                    {showScore && (
                      <span className="score-report-score">{game.score.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="score-report-game-name">{game.name}</div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

export function buildScoreReportDocument({
  model,
  options,
  themeCss,
  fontSource,
  styleCss = ''
}: {
  model: ScoreReportExportModel
  options: ReportExportOptions['reports']['scoreReport']
  themeCss: string
  fontSource: string
  styleCss?: string
}): string {
  const variant = options.variant === 'B' ? 'B' : 'A'
  const markup = renderToStaticMarkup(
    <ScoreReportExportTemplate model={model} showScore={options.showScore} variant={variant} />
  )
  const variantStyles = variant === 'A' ? variantAStyles : variantBStyles

  return buildReportDocument({
    language: model.language,
    title: model.title,
    markup,
    themeCss,
    styleCss: `:root {
  --score-report-cover-width: ${options.coverWidth}px;
  --score-report-cover-height: ${options.coverWidth * 1.5}px;
}
${templateStyles}
${variantStyles}
${styleCss}`,
    fontSource
  })
}
