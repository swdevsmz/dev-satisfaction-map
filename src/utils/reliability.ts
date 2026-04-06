import type { DataSource } from '../types/company'

/** scraped_at の経過日数から鮮度係数を返す */
function freshnessWeight(scrapedAt: string): number {
  const days = (Date.now() - new Date(scrapedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 30)  return 1.0
  if (days <= 90)  return 0.7
  if (days <= 180) return 0.4
  return 0.1
}

/**
 * 信頼スコアを 0–100 で計算する。
 * openwork/ir は実測値のため重み2、connpass/github は推定値で重み1。
 * 全ソース取得・30日以内で満点となるよう正規化（最大 = 2+2+1+1 = 6）。
 */
export function calculateReliabilityScore(docs: DataSource[]): number {
  if (docs.length === 0) return 0

  // ソースごとに最新の scraped_at を取る
  const latest = new Map<string, string>()
  for (const doc of docs) {
    const existing = latest.get(doc.source)
    if (!existing || new Date(doc.scrapedAt) > new Date(existing)) {
      latest.set(doc.source, doc.scrapedAt)
    }
  }

  let score = 0
  for (const [source, scrapedAt] of latest) {
    const weight = source === 'openwork' || source === 'ir' ? 2 : 1
    score += freshnessWeight(scrapedAt) * weight
  }

  return Math.min(100, Math.round((score / 6) * 100))
}

export function getReliabilityLabel(score: number): { label: string; colorClass: string } {
  if (score >= 70) return { label: '高', colorClass: 'text-green-600' }
  if (score >= 40) return { label: '中', colorClass: 'text-yellow-600' }
  return { label: '低', colorClass: 'text-red-500' }
}

export function formatRelativeDate(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return '今日'
  if (days === 1) return '昨日'
  if (days < 7)  return `${days}日前`
  if (days < 30) return `${Math.floor(days / 7)}週間前`
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`
  return `${Math.floor(days / 365)}年前`
}
