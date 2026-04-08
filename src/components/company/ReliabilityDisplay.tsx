import type { DataSource } from '../../types/company'
import { calculateReliabilityScore, getReliabilityLabel } from '../../utils/reliability'
import SourceBadge from './SourceBadge'
import { type SourceName } from '../../constants/sourceMetricMap'

interface ReliabilityDisplayProps {
  readonly dataSources: DataSource[]
}

const ALL_SOURCES: SourceName[] = ['openwork', 'ir', 'github', 'connpass']

/**
 * ReliabilityDisplay: 信頼度表示UIコンポーネント
 * データソース情報表示、信頼度スコア（0–100）表示、信頼度レベル（高/中/低）の色分け表示
 * Task 5.3: 信頼度表示UIの実装
 */
export default function ReliabilityDisplay({ dataSources }: ReliabilityDisplayProps) {
  const score = calculateReliabilityScore(dataSources)
  const { label, colorClass } = getReliabilityLabel(score)
  const acquiredSources = new Set(dataSources.map((d) => d.source))

  return (
    <div
      data-testid="reliability-display"
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex flex-col gap-4">
        {/* Header with Title and Score */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">データ信頼度</h3>
            <p className="text-sm text-gray-500">複数のデータソースから信頼性を計算</p>
          </div>

          {/* Score Display */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span
                data-testid="reliability-score-display"
                className="text-3xl font-bold text-gray-900"
              >
                {score}%
              </span>
              <span
                data-testid="reliability-level-display"
                className={`text-sm font-semibold ${colorClass}`}
              >
                {label}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div
            data-testid="reliability-progress-bar"
            className="h-2 bg-gray-100 rounded-full overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all ${
                score >= 70
                  ? 'bg-green-500'
                  : score >= 40
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>

          {/* Score Interpretation */}
          <div className="flex justify-between text-xs text-gray-400">
            <span>低</span>
            <span>中</span>
            <span>高</span>
          </div>
        </div>

        {/* Data Sources Section */}
        <div className="pt-4 border-t border-gray-100">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-800 mb-2">データソース</p>
            <p className="text-xs text-gray-500 mb-3">
              複数の情報源から企業データを収集しています。緑色は取得済み、グレーは未取得です。
            </p>
          </div>

          {/* Source Badges */}
          <div
            data-testid="source-badges-container"
            className="flex flex-wrap gap-2"
          >
            {ALL_SOURCES.map((source) => (
              <SourceBadge
                key={source}
                source={source}
                acquired={acquiredSources.has(source)}
                showType
              />
            ))}
          </div>
        </div>

        {/* Reliability Explanation */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-600 leading-relaxed">
            {score >= 70
              ? '複数の信頼できるデータソースから最新の情報を収集しています。このデータは信頼度が高いです。'
              : score >= 40
                ? '複数のデータソースから情報を収集していますが、更新が必要な可能性があります。'
                : 'データが限定的または古い可能性があります。最新情報はオフィシャルサイトで確認することをお勧めします。'}
          </p>
        </div>
      </div>
    </div>
  )
}
