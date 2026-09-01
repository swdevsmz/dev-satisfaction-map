export interface ScrapedDocument {
  companyId: string
  source: 'connpass' | 'openwork' | 'ir' | 'github'
  url: string | null
  content: string
}

/**
 * Scraper implementation contract.
 * A scraper must return a complete document or throw a recoverable error.
 */
export type Scraper = (companyId: string) => Promise<ScrapedDocument>

// LLMが抽出する構造（nullは「情報なし」）
export interface ExtractedScores {
  tech_stack_modernity:     number | null  // 1-10
  remote_rate:              number | null  // 0-100
  estimated_overtime_hours: number | null  // 月間時間
  turnover_rate:            number | null  // 0-100%
  retention_rate:           number | null  // 0-100%
  dev_environment:          number | null  // 1-10
  skill_up_support:         number | null  // 1-10
  description:              string | null
  tags:                     string[] | null
}
