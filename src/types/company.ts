export interface CompanyScores {
  /** 1–10 技術スタックの新しさ（高いほど良い） */
  techStackModernity: number
  /** 0–100% リモート率（高いほど良い） */
  remoteRate: number
  /** 月間残業時間（低いほど良い → スコア算出時に反転） */
  estimatedOvertimeHours: number
  /** 0–100% 離職率（低いほど良い → 反転） */
  turnoverRate: number
  /** 0–100% 定着率（高いほど良い） */
  retentionRate: number
  /** 1–10 開発環境スコア（高いほど良い） */
  devEnvironment: number
  /** 1–10 スキルアップ支援度（高いほど良い） */
  skillUpSupport: number
  /** 0–100 の幸福度スコア（計算済み） */
  happinessScore: number
  /** 0–100 の信頼度スコア（計算済み） */
  reliabilityScore: number
  /** スコアに対応する色分け */
  scoreColor: 'green' | 'yellow' | 'red'
}

export interface Company {
  /** URLスラッグ形式のID（例: "mercari-jp"） */
  id: string
  name: string
  description: string
  industry: string
  employeeCount: number
  location: string
  scores: CompanyScores
  /** 0–100 の幸福度スコア（calculateHappinessScore()で算出済み） */
  happinessScore: number
  tags: string[]
  /** companies.updated_at（一覧カードの鮮度表示用） */
  dataUpdatedAt: string
  /** 企業WebサイトURL（任意: Organization JSON-LD等で使用） */
  website?: string
}

/** Recharts RadarChart 用のデータ形式 */
export interface RadarDataPoint {
  subject: string
  value: number
  fullMark: 100
}

/** 指標ごとのユーザー重要度（0=気にしない〜3=最重視） */
export interface UserWeights {
  techStackModernity: number
  remoteRate: number
  estimatedOvertimeHours: number
  turnoverRate: number
  retentionRate: number
  devEnvironment: number
  skillUpSupport: number
}

export const DEFAULT_USER_WEIGHTS: UserWeights = {
  techStackModernity: 0,
  remoteRate: 0,
  estimatedOvertimeHours: 0,
  turnoverRate: 0,
  retentionRate: 0,
  devEnvironment: 0,
  skillUpSupport: 0,
}

/** raw_documents の1件 */
export interface DataSource {
  source: 'connpass' | 'openwork' | 'ir' | 'github'
  url: string | null
  scrapedAt: string
}

/** Company + データソース情報（詳細ページ用） */
export interface CompanyWithSources extends Company {
  dataSources: DataSource[]
}
