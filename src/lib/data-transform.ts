/**
 * データ層の変換関数
 * Task 4.2: Supabaseの行をCompanyScoresドメインモデルに変換
 */

import {
  normalizeScores,
  calculateHappinessScore,
  getScoreColor,
} from '../utils/scoring'
import { calculateReliabilityScore } from '../utils/reliability'
import type { CompanyScores, DataSource } from '../types/company'

// Supabase company_scores テーブルの行型
interface CompanyScoresRow {
  company_id: string
  tech_stack_modernity?: number | null
  remote_rate?: number | null
  estimated_overtime_hours?: number | null
  turnover_rate?: number | null
  retention_rate?: number | null
  dev_environment?: number | null
  skill_up_support?: number | null
  github_activity_bonus?: number | null
  connpass_bonus?: number | null
  data_source_flags?: Record<string, boolean> | null
  scored_at?: string | null
  last_openwork_sync?: string | null
  last_job_posting_sync?: string | null
  last_github_sync?: string | null
  last_connpass_sync?: string | null
}

/**
 * デフォルト値（OpenWorkデータ未取得時）
 * Requirements 1.6 より
 */
const DEFAULTS = {
  remoteRate: 50,           // ニュートラル値（リモート未対応・対応済みの中間）
  estimatedOvertimeHours: 30, // 標準的な月間残業時間
  turnoverRate: 15,         // 業界平均前後
  retentionRate: 85,        // 離職率 15% に対応
} as const

/**
 * Supabaseの行をCompanyScoresドメインモデルに変換
 * NULL値をデフォルト値で補完し、スコア計算を実施
 */
export function rowToCompanyScores(row: CompanyScoresRow): CompanyScores {
  // NULL値をデフォルト値で補完
  const techStackModernity = row.tech_stack_modernity ?? 5 // デフォルト: 中位
  const remoteRate = row.remote_rate ?? DEFAULTS.remoteRate
  const estimatedOvertimeHours = row.estimated_overtime_hours ?? DEFAULTS.estimatedOvertimeHours
  const turnoverRate = row.turnover_rate ?? DEFAULTS.turnoverRate
  const retentionRate = row.retention_rate ?? DEFAULTS.retentionRate
  const devEnvironment = row.dev_environment ?? 5 // デフォルト: 中位
  const skillUpSupport = row.skill_up_support ?? 5 // デフォルト: 中位

  // 基本的なスコア値で正規化・計算
  const baseScores: CompanyScores = {
    techStackModernity,
    remoteRate,
    estimatedOvertimeHours,
    turnoverRate,
    retentionRate,
    devEnvironment,
    skillUpSupport,
    happinessScore: 0, // 後で計算
    reliabilityScore: 0, // 後で計算
    scoreColor: 'yellow', // 後で計算
  }

  // 幸福度スコアを計算
  const happinessScore = calculateHappinessScore(baseScores)

  // ボーナスポイントを適用（将来の拡張用）
  const githubBonus = row.github_activity_bonus ?? 0
  const connpassBonus = row.connpass_bonus ?? 0
  const finalScore = Math.min(100, happinessScore + githubBonus + connpassBonus)

  // スコアに対応する色を決定
  const scoreColor = getScoreColor(finalScore)

  // 信頼度スコアを計算（データソースフラグから）
  const dataSources: DataSource[] = []
  const sourceFlags = row.data_source_flags || {}

  if (sourceFlags.openwork && row.last_openwork_sync) {
    dataSources.push({
      source: 'openwork',
      url: null,
      scrapedAt: row.last_openwork_sync,
    })
  }

  // job_posting は ir として保存
  if (sourceFlags.job_posting && row.last_job_posting_sync) {
    dataSources.push({
      source: 'ir',
      url: null,
      scrapedAt: row.last_job_posting_sync,
    })
  }

  if (sourceFlags.github && row.last_github_sync) {
    dataSources.push({
      source: 'github',
      url: null,
      scrapedAt: row.last_github_sync,
    })
  }

  if (sourceFlags.connpass && row.last_connpass_sync) {
    dataSources.push({
      source: 'connpass',
      url: null,
      scrapedAt: row.last_connpass_sync,
    })
  }

  const reliabilityScore = calculateReliabilityScore(dataSources)

  return {
    techStackModernity,
    remoteRate,
    estimatedOvertimeHours,
    turnoverRate,
    retentionRate,
    devEnvironment,
    skillUpSupport,
    happinessScore: finalScore,
    reliabilityScore,
    scoreColor,
  }
}

/**
 * 複数行を一括変換
 * パフォーマンス最適化用
 */
export function rowsToCompanyScores(rows: CompanyScoresRow[]): CompanyScores[] {
  return rows.map(rowToCompanyScores)
}
