import type { CompanyScores, RadarDataPoint } from '../types/company'

/** 各指標の重み（合計 1.00） */
export const WEIGHTS = {
  techStackModernity: 0.20,
  remoteRate: 0.20,
  estimatedOvertimeHours: 0.20, // 反転: 少ないほど高スコア
  turnoverRate: 0.10,           // 反転: 低いほど高スコア
  retentionRate: 0.10,
  devEnvironment: 0.10,
  skillUpSupport: 0.10,
} as const

/**
 * 各指標を 0–100 スケールに正規化する。
 * 残業時間・離職率は「少ないほど良い」ため反転する。
 */
function normalizeScores(s: CompanyScores): Record<keyof CompanyScores, number> {
  return {
    techStackModernity: ((s.techStackModernity - 1) / 9) * 100,
    remoteRate: s.remoteRate,
    estimatedOvertimeHours: Math.max(0, ((80 - s.estimatedOvertimeHours) / 80) * 100),
    turnoverRate: Math.max(0, 100 - s.turnoverRate),
    retentionRate: s.retentionRate,
    devEnvironment: ((s.devEnvironment - 1) / 9) * 100,
    skillUpSupport: ((s.skillUpSupport - 1) / 9) * 100,
  }
}

/**
 * 7指標の重み付き合計から 0–100 の幸福度スコアを算出する。
 * 小数点第1位で四捨五入。
 */
export function calculateHappinessScore(s: CompanyScores): number {
  const n = normalizeScores(s)
  const raw =
    n.techStackModernity * WEIGHTS.techStackModernity +
    n.remoteRate * WEIGHTS.remoteRate +
    n.estimatedOvertimeHours * WEIGHTS.estimatedOvertimeHours +
    n.turnoverRate * WEIGHTS.turnoverRate +
    n.retentionRate * WEIGHTS.retentionRate +
    n.devEnvironment * WEIGHTS.devEnvironment +
    n.skillUpSupport * WEIGHTS.skillUpSupport
  return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10
}

/** Recharts RadarChart 用データに変換する */
export function toRadarData(s: CompanyScores): RadarDataPoint[] {
  const n = normalizeScores(s)
  return [
    { subject: '技術スタック', value: Math.round(n.techStackModernity), fullMark: 100 },
    { subject: 'リモート率', value: Math.round(n.remoteRate), fullMark: 100 },
    { subject: '残業の少なさ', value: Math.round(n.estimatedOvertimeHours), fullMark: 100 },
    { subject: '低離職率', value: Math.round(n.turnoverRate), fullMark: 100 },
    { subject: '定着率', value: Math.round(n.retentionRate), fullMark: 100 },
    { subject: '開発環境', value: Math.round(n.devEnvironment), fullMark: 100 },
    { subject: 'スキルアップ', value: Math.round(n.skillUpSupport), fullMark: 100 },
  ]
}

/** スコアに応じたカラーカテゴリを返す */
export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}

/** スコアカラーに対応するHEXカラーコードを返す（チャート用） */
export function getScoreHex(score: number): string {
  const color = getScoreColor(score)
  if (color === 'green') return '#22c55e'
  if (color === 'yellow') return '#eab308'
  return '#ef4444'
}
