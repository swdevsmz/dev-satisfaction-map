import { createClient } from '@supabase/supabase-js'
import { calculateHappinessScore, getScoreColor } from '../utils/scoring'
import type { Company, CompanyScores } from '../types/company'

export interface CompanyRow {
  id: string; name: string; description: string; industry: string
  employee_count: number; location: string; tags: string[]
  website?: string; created_at: string; updated_at: string
}

export interface CompanyScoreRow {
  company_id: string
  tech_stack_modernity: number; remote_rate: number
  estimated_overtime_hours: number; turnover_rate: number
  retention_rate: number; dev_environment: number; skill_up_support: number
  scored_at: string
}

export interface CompanyScrapeRow {
  id: number
  company_id: string
  source: 'connpass' | 'openwork' | 'ir' | 'github'
  url: string | null
  content: string
  scraped_at: string
}

// 後方互換性
export type RawDocumentRow = CompanyScrapeRow

interface Database {
  public: {
    Tables: {
      companies: { Row: CompanyRow }
      company_scores: { Row: CompanyScoreRow }
      company_scrapes: { Row: CompanyScrapeRow }
    }
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/** DB行(snake_case) → Company(camelCase)。happinessScore、reliabilityScore、scoreColor はここで計算。 */
export function rowToCompany(row: CompanyRow, scoreRow: CompanyScoreRow | null): Company {
  const baseScores = {
    techStackModernity: scoreRow?.tech_stack_modernity ?? 5,
    remoteRate: scoreRow?.remote_rate ?? 50,
    estimatedOvertimeHours: scoreRow?.estimated_overtime_hours ?? 30,
    turnoverRate: scoreRow?.turnover_rate ?? 15,
    retentionRate: scoreRow?.retention_rate ?? 80,
    devEnvironment: scoreRow?.dev_environment ?? 5,
    skillUpSupport: scoreRow?.skill_up_support ?? 5,
  }

  // Create a temporary full CompanyScores object to calculate happiness score
  const tempScores: CompanyScores = {
    ...baseScores,
    happinessScore: 0,
    scoreColor: 'red' as const,
    reliabilityScore: 75, // デフォルト値（本番ではデータソースから計算）
  }

  const happinessScore = calculateHappinessScore(tempScores)

  const scores = {
    ...baseScores,
    happinessScore,
    scoreColor: getScoreColor(happinessScore),
    reliabilityScore: 75, // デフォルト値（本番ではデータソースから計算）
  }

  return {
    id: row.id, name: row.name, description: row.description,
    industry: row.industry, employeeCount: row.employee_count,
    location: row.location, tags: row.tags, website: row.website,
    scores, happinessScore,
    dataUpdatedAt: scoreRow?.scored_at ?? row.updated_at,
  }
}
