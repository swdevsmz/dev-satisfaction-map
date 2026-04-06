import type { CompanyScores } from '../types/company'

export type SourceName = 'connpass' | 'github' | 'openwork' | 'ir'
export type MetricKey = keyof CompanyScores

/** どのソースがどの指標を担当するかの静的マッピング */
export const SOURCE_METRIC_MAP: Record<SourceName, MetricKey[]> = {
  connpass: ['skillUpSupport'],
  github:   ['techStackModernity', 'devEnvironment'],
  openwork: ['remoteRate', 'estimatedOvertimeHours', 'turnoverRate', 'retentionRate'],
  ir:       [],
}

/** 実測値(actual)か推定値(estimated)か */
export const SOURCE_TYPE: Record<SourceName, 'actual' | 'estimated'> = {
  openwork: 'actual',
  ir:       'actual',
  connpass: 'estimated',
  github:   'estimated',
}

export const SOURCE_LABEL: Record<SourceName, string> = {
  connpass: 'connpass',
  github:   'GitHub',
  openwork: 'OpenWork',
  ir:       'IR資料',
}

/** バッジの色クラス（Tailwind） */
export const SOURCE_COLOR: Record<SourceName, string> = {
  connpass: 'bg-orange-100 text-orange-700 border-orange-200',
  github:   'bg-gray-100 text-gray-600 border-gray-200',
  openwork: 'bg-blue-100 text-blue-700 border-blue-200',
  ir:       'bg-purple-100 text-purple-700 border-purple-200',
}

/** 指標キー → ソース名の逆引きマップ */
export const METRIC_SOURCE_MAP: Record<MetricKey, SourceName | null> = {
  techStackModernity:     'github',
  devEnvironment:         'github',
  skillUpSupport:         'connpass',
  remoteRate:             'openwork',
  estimatedOvertimeHours: 'openwork',
  turnoverRate:           'openwork',
  retentionRate:          'openwork',
}
