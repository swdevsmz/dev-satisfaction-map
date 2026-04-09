import { getSupabase } from './client.js'
import type { ScrapedDocument, ExtractedScores } from '../types.js'

export interface BonusScores {
  github_activity_bonus: number
  connpass_bonus: number
}

export async function insertRawDocument(doc: ScrapedDocument): Promise<void> {
  const { error } = await getSupabase().from('company_scrapes').insert({
    company_id: doc.companyId,
    source: doc.source,
    url: doc.url,
    content: doc.content,
  })

  if (error) throw new Error(`company_scrapes INSERT 失敗: ${error.message}`)
}

export function deriveBonusScores(docs: ScrapedDocument[]): BonusScores {
  const githubDoc = docs.find((doc) => doc.source === 'github')
  const connpassDoc = docs.find((doc) => doc.source === 'connpass')

  return {
    github_activity_bonus: githubDoc ? deriveGithubBonus(githubDoc.content) : 0,
    connpass_bonus: connpassDoc ? deriveConnpassBonus(connpassDoc.content) : 0,
  }
}

export async function upsertCompanyScores(
  companyId: string,
  scores: ExtractedScores,
  docs: ScrapedDocument[] = []
): Promise<void> {
  // スコア（company_scores テーブル用）と企業情報（companies テーブル用）を分離
  const scoreUpdates: Record<string, unknown> = {}
  const companyUpdates: Record<string, unknown> = {}
  const bonusScores = deriveBonusScores(docs)
  const hasGithubDoc = docs.some((doc) => doc.source === 'github')
  const hasConnpassDoc = docs.some((doc) => doc.source === 'connpass')

  // company_scores テーブルへのUPSERT用フィールド
  if (scores.tech_stack_modernity     != null) scoreUpdates.tech_stack_modernity     = scores.tech_stack_modernity
  if (scores.remote_rate              != null) scoreUpdates.remote_rate              = scores.remote_rate
  if (scores.estimated_overtime_hours != null) scoreUpdates.estimated_overtime_hours = scores.estimated_overtime_hours
  if (scores.turnover_rate            != null) scoreUpdates.turnover_rate            = scores.turnover_rate
  if (scores.retention_rate           != null) scoreUpdates.retention_rate           = scores.retention_rate
  if (scores.dev_environment          != null) scoreUpdates.dev_environment          = scores.dev_environment
  if (scores.skill_up_support         != null) scoreUpdates.skill_up_support         = scores.skill_up_support
  if (hasGithubDoc) scoreUpdates.github_activity_bonus = bonusScores.github_activity_bonus
  if (hasConnpassDoc) scoreUpdates.connpass_bonus = bonusScores.connpass_bonus

  // companies テーブルへのUPDATE用フィールド
  if (scores.description              != null) companyUpdates.description            = scores.description
  if (scores.tags                     != null) companyUpdates.tags                   = scores.tags

  // company_scores の UPSERT
  if (Object.keys(scoreUpdates).length > 0) {
    scoreUpdates.scored_at = new Date().toISOString()
    const { error } = await getSupabase()
      .from('company_scores')
      .upsert({ company_id: companyId, ...scoreUpdates }, { onConflict: 'company_id' })

    if (error) throw new Error(`company_scores UPSERT 失敗: ${error.message}`)
  }

  // companies の UPDATE
  if (Object.keys(companyUpdates).length > 0) {
    const { error } = await getSupabase()
      .from('companies')
      .update(companyUpdates)
      .eq('id', companyId)

    if (error) throw new Error(`companies UPDATE 失敗: ${error.message}`)
  }

  // 更新するフィールドがない場合は警告
  if (Object.keys(scoreUpdates).length === 0 && Object.keys(companyUpdates).length === 0) {
    console.log('  ⚠ 更新するフィールドがありません（すべてnull）')
  }
}

function deriveGithubBonus(content: string): number {
  const repoCount = parseFirstNumber(content, /公開リポジトリ数:\s*(\d+)/)
  const recentEventCount = parseFirstNumber(content, /過去30日のイベント数:\s*(\d+)/)

  let score = 0
  if (repoCount != null) {
    if (repoCount >= 50) score += 3
    else if (repoCount >= 20) score += 2
    else if (repoCount > 0) score += 1
  }

  if (recentEventCount != null) {
    if (recentEventCount >= 20) score += 2
    else if (recentEventCount >= 3) score += 1
  }

  return Math.max(0, Math.min(5, score))
}

function deriveConnpassBonus(content: string): number {
  const eventCount = parseFirstNumber(content, /開催件数（過去1年）:\s*(\d+)件/) ?? parseFirstNumber(content, /開催件数:\s*(\d+)件/)
  if (eventCount == null) return 0

  if (eventCount >= 21) return 5
  if (eventCount >= 11) return 4
  if (eventCount >= 6) return 3
  if (eventCount >= 3) return 2
  if (eventCount >= 1) return 1
  return 0
}

function parseFirstNumber(content: string, pattern: RegExp): number | null {
  const match = content.match(pattern)
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}
