import { getScoreColor, normalizeScores } from '../../utils/scoring'
import type { CompanyScores, DataSource } from '../../types/company'
import { METRIC_SOURCE_MAP, type SourceName, type MetricKey } from '../../constants/sourceMetricMap'
import SourceBadge from './SourceBadge'

interface ScoreDisplayProps {
  scores: CompanyScores
  dataSources?: DataSource[]
}

interface MetricRowProps {
  label: string
  metricKey: MetricKey
  value: number
  unit: string
  normalizedValue: number
  inverted?: boolean
  acquiredSources: Set<string>
}

function MetricRow({
  label,
  metricKey,
  value,
  unit,
  normalizedValue,
  inverted = false,
  acquiredSources,
}: MetricRowProps) {
  const barColor = normalizedValue >= 70 ? 'bg-green-500' : normalizedValue >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  const sourceKey = METRIC_SOURCE_MAP[metricKey]
  const acquired = sourceKey ? acquiredSources.has(sourceKey) : false

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{label}</span>
          {sourceKey && <SourceBadge source={sourceKey as SourceName} acquired={acquired} />}
        </div>
        <span className="text-sm font-semibold text-gray-800">
          {value}
          {unit}
          {inverted && <span className="text-xs text-gray-400 ml-1">(少ないほど良い)</span>}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          data-testid="metric-progress-bar"
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}

export default function ScoreDisplay({ scores, dataSources = [] }: ScoreDisplayProps) {
  const normalized = normalizeScores(scores)
  const scoreColor = getScoreColor(scores.happinessScore)
  const acquiredSources = new Set(dataSources.map((d) => d.source))

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className="space-y-6">
      {/* Summary Section: Overall Score */}
      <div
        data-testid="score-summary"
        className={`rounded-2xl border p-6 ${colorClasses[scoreColor]}`}
      >
        <h3 className="text-sm font-medium opacity-75 mb-2">エンジニア幸福度スコア</h3>
        <div
          data-testid="happiness-score-container"
          className={`inline-flex items-baseline gap-1 text-3xl font-bold border rounded-2xl px-4 py-2 ${colorClasses[scoreColor]}`}
        >
          <span data-testid="happiness-score-value">{scores.happinessScore.toFixed(1)}</span>
          <span className="text-sm font-normal opacity-70">/ 100</span>
        </div>
      </div>

      {/* Details Section: Individual Metrics */}
      <div data-testid="score-details" className="bg-white rounded-xl border border-gray-100">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">各指標の詳細</h3>
          <MetricRow
            label="技術スタックの新しさ"
            metricKey="techStackModernity"
            value={scores.techStackModernity}
            unit=" / 10"
            normalizedValue={normalized.techStackModernity}
            acquiredSources={acquiredSources}
          />
          <MetricRow
            label="リモート率"
            metricKey="remoteRate"
            value={scores.remoteRate}
            unit="%"
            normalizedValue={normalized.remoteRate}
            acquiredSources={acquiredSources}
          />
          <MetricRow
            label="月間残業時間"
            metricKey="estimatedOvertimeHours"
            value={scores.estimatedOvertimeHours}
            unit="時間"
            normalizedValue={normalized.estimatedOvertimeHours}
            inverted
            acquiredSources={acquiredSources}
          />
          <MetricRow
            label="離職率"
            metricKey="turnoverRate"
            value={scores.turnoverRate}
            unit="%"
            normalizedValue={normalized.turnoverRate}
            inverted
            acquiredSources={acquiredSources}
          />
          <MetricRow
            label="定着率"
            metricKey="retentionRate"
            value={scores.retentionRate}
            unit="%"
            normalizedValue={normalized.retentionRate}
            acquiredSources={acquiredSources}
          />
          <MetricRow
            label="開発環境スコア"
            metricKey="devEnvironment"
            value={scores.devEnvironment}
            unit=" / 10"
            normalizedValue={normalized.devEnvironment}
            acquiredSources={acquiredSources}
          />
          <MetricRow
            label="スキルアップ支援"
            metricKey="skillUpSupport"
            value={scores.skillUpSupport}
            unit=" / 10"
            normalizedValue={normalized.skillUpSupport}
            acquiredSources={acquiredSources}
          />
        </div>
      </div>
    </div>
  )
}
