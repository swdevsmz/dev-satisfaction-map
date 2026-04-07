import { getSupabase } from './client.js'
import type { ScrapedDocument, ExtractedScores } from '../types.js'

export async function insertRawDocument(doc: ScrapedDocument): Promise<void> {
  const { error } = await getSupabase().from('company_scrapes').insert({
    company_id: doc.companyId,
    source: doc.source,
    url: doc.url,
    content: doc.content,
  })

  if (error) throw new Error(`company_scrapes INSERT 失敗: ${error.message}`)
}

export async function upsertCompanyScores(
  companyId: string,
  scores: ExtractedScores
): Promise<void> {
  // スコア（company_scores テーブル用）と企業情報（companies テーブル用）を分離
  const scoreUpdates: Record<string, unknown> = {}
  const companyUpdates: Record<string, unknown> = {}

  // company_scores テーブルへのUPSERT用フィールド
  if (scores.tech_stack_modernity     != null) scoreUpdates.tech_stack_modernity     = scores.tech_stack_modernity
  if (scores.remote_rate              != null) scoreUpdates.remote_rate              = scores.remote_rate
  if (scores.estimated_overtime_hours != null) scoreUpdates.estimated_overtime_hours = scores.estimated_overtime_hours
  if (scores.turnover_rate            != null) scoreUpdates.turnover_rate            = scores.turnover_rate
  if (scores.retention_rate           != null) scoreUpdates.retention_rate           = scores.retention_rate
  if (scores.dev_environment          != null) scoreUpdates.dev_environment          = scores.dev_environment
  if (scores.skill_up_support         != null) scoreUpdates.skill_up_support         = scores.skill_up_support

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
