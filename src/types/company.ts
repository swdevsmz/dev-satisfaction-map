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
}

/** Recharts RadarChart 用のデータ形式 */
export interface RadarDataPoint {
  subject: string
  value: number
  fullMark: 100
}
