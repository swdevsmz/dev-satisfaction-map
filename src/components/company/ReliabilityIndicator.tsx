import type { DataSource } from '../../types/company'
import { calculateReliabilityScore, getReliabilityLabel, formatRelativeDate } from '../../utils/reliability'
import SourceBadge from './SourceBadge'
import { type SourceName } from '../../constants/sourceMetricMap'

const ALL_SOURCES: SourceName[] = ['github', 'connpass', 'openwork', 'ir']

interface ReliabilityIndicatorProps {
  dataSources: DataSource[]
  dataUpdatedAt: string
}

export default function ReliabilityIndicator({ dataSources, dataUpdatedAt }: ReliabilityIndicatorProps) {
  const score = calculateReliabilityScore(dataSources)
  const { label, colorClass } = getReliabilityLabel(score)
  const acquiredSources = new Set(dataSources.map((d) => d.source))

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">データ信頼度</span>
          <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
          <span className="text-xs text-gray-400">({score}%)</span>
        </div>
        <span className="text-xs text-gray-400">更新: {formatRelativeDate(dataUpdatedAt)}</span>
      </div>

      {/* 信頼度バー */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* ソース一覧 */}
      <div className="flex flex-wrap gap-1.5">
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
  )
}
