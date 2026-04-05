import { getSupabase } from './client.js'
import type { ScrapedDocument, ExtractedScores } from '../types.js'

export async function insertRawDocument(doc: ScrapedDocument): Promise<void> {
  const { error } = await getSupabase().from('raw_documents').insert({
    company_id: doc.companyId,
    source: doc.source,
    url: doc.url,
    content: doc.content,
  })

  if (error) throw new Error(`raw_documents INSERT 失敗: ${error.message}`)
}

export async function upsertCompanyScores(
  companyId: string,
  scores: ExtractedScores
): Promise<void> {
  // null フィールドを除外（既存の値を上書きしない）
  const updates: Record<string, unknown> = {}

  if (scores.tech_stack_modernity     != null) updates.tech_stack_modernity     = scores.tech_stack_modernity
  if (scores.remote_rate              != null) updates.remote_rate              = scores.remote_rate
  if (scores.estimated_overtime_hours != null) updates.estimated_overtime_hours = scores.estimated_overtime_hours
  if (scores.turnover_rate            != null) updates.turnover_rate            = scores.turnover_rate
  if (scores.retention_rate           != null) updates.retention_rate           = scores.retention_rate
  if (scores.dev_environment          != null) updates.dev_environment          = scores.dev_environment
  if (scores.skill_up_support         != null) updates.skill_up_support         = scores.skill_up_support
  if (scores.description              != null) updates.description              = scores.description
  if (scores.tags                     != null) updates.tags                     = scores.tags

  if (Object.keys(updates).length === 0) {
    console.log('  ⚠ 更新するフィールドがありません（すべてnull）')
    return
  }

  const { error } = await getSupabase()
    .from('companies')
    .update(updates)
    .eq('id', companyId)

  if (error) throw new Error(`companies UPDATE 失敗: ${error.message}`)
}
