import { useParams, Navigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useCompanyById } from '../hooks/useCompanyById'
import ScoreBadge from '../components/company/ScoreBadge'
import SourceBadge from '../components/company/SourceBadge'
import ReliabilityIndicator from '../components/company/ReliabilityIndicator'
import RadarChartComponent from '../components/charts/RadarChartComponent'
import { getScoreColor, normalizeScores } from '../utils/scoring'
import { METRIC_SOURCE_MAP, type SourceName } from '../constants/sourceMetricMap'
import type { MetricKey } from '../constants/sourceMetricMap'

interface MetricRowProps {
  label: string
  metricKey: MetricKey
  value: number
  unit: string
  inverted?: boolean
  normalizedValue: number
  acquiredSources: Set<string>
}

function MetricRow({ label, metricKey, value, unit, inverted = false, normalizedValue, acquiredSources }: MetricRowProps) {
  const barColor = normalizedValue >= 70 ? 'bg-green-500' : normalizedValue >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  const sourceKey = METRIC_SOURCE_MAP[metricKey]
  const acquired = sourceKey ? acquiredSources.has(sourceKey) : false

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{label}</span>
          {sourceKey && (
            <SourceBadge source={sourceKey as SourceName} acquired={acquired} />
          )}
        </div>
        <span className="text-sm font-semibold text-gray-800">
          {value}
          {unit}
          {inverted && <span className="text-xs text-gray-400 ml-1">(少ないほど良い)</span>}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const { company, isLoading, error } = useCompanyById(id)

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
        </div>
      </main>
    )
  }

  if (error === 'Company not found' || !company) {
    return <Navigate to="/" replace />
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-block text-sm text-green-700 hover:underline mb-6">
          ← 一覧に戻る
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          データの取得に失敗しました: {error}
        </div>
      </main>
    )
  }

  const normalized = normalizeScores(company.scores)
  const acquiredSources = new Set(company.dataSources.map((d) => d.source))
  const scoreColorClass = {
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700',
  }[getScoreColor(company.happinessScore)]

  return (
    <>
      <Helmet>
        <title>{company.name} の幸福度スコア | エンジニア幸福度マップ</title>
        <meta
          name="description"
          content={`${company.name}のエンジニア幸福度スコアは${company.happinessScore}点。技術スタック・リモート率・残業時間・定着率などを詳細分析。`}
        />
      </Helmet>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-block text-sm text-green-700 hover:underline mb-6"
        >
          ← 一覧に戻る
        </Link>

        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-500 mt-1 text-sm">
                {company.industry} · {company.location} · 従業員 {company.employeeCount.toLocaleString()}名
              </p>
              <p className="text-gray-600 mt-4 leading-relaxed">{company.description}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ScoreBadge score={company.happinessScore} size="lg" />
              <p className={`text-xs font-medium mt-1 ${scoreColorClass}`}>幸福度スコア</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {company.tags.map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>

          {/* 信頼度インジケーター */}
          <ReliabilityIndicator
            dataSources={company.dataSources}
            dataUpdatedAt={company.dataUpdatedAt}
          />
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">スコアバランス</h2>
            <div className="h-80">
              <RadarChartComponent company={company} height={320} />
            </div>
          </div>

          {/* Metric rows */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">各指標の詳細</h2>
            <MetricRow
              label="技術スタックの新しさ"
              metricKey="techStackModernity"
              value={company.scores.techStackModernity}
              unit=" / 10"
              normalizedValue={normalized.techStackModernity}
              acquiredSources={acquiredSources}
            />
            <MetricRow
              label="リモート率"
              metricKey="remoteRate"
              value={company.scores.remoteRate}
              unit="%"
              normalizedValue={normalized.remoteRate}
              acquiredSources={acquiredSources}
            />
            <MetricRow
              label="月間残業時間（推定）"
              metricKey="estimatedOvertimeHours"
              value={company.scores.estimatedOvertimeHours}
              unit="時間"
              inverted
              normalizedValue={normalized.estimatedOvertimeHours}
              acquiredSources={acquiredSources}
            />
            <MetricRow
              label="離職率（推定）"
              metricKey="turnoverRate"
              value={company.scores.turnoverRate}
              unit="%"
              inverted
              normalizedValue={normalized.turnoverRate}
              acquiredSources={acquiredSources}
            />
            <MetricRow
              label="定着率（推定）"
              metricKey="retentionRate"
              value={company.scores.retentionRate}
              unit="%"
              normalizedValue={normalized.retentionRate}
              acquiredSources={acquiredSources}
            />
            <MetricRow
              label="開発環境スコア"
              metricKey="devEnvironment"
              value={company.scores.devEnvironment}
              unit=" / 10"
              normalizedValue={normalized.devEnvironment}
              acquiredSources={acquiredSources}
            />
            <MetricRow
              label="スキルアップ支援"
              metricKey="skillUpSupport"
              value={company.scores.skillUpSupport}
              unit=" / 10"
              normalizedValue={normalized.skillUpSupport}
              acquiredSources={acquiredSources}
            />
          </div>
        </div>
      </main>
    </>
  )
}
