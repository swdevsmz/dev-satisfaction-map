import { createClient } from '@supabase/supabase-js'
import { calculateHappinessScore } from '../utils/scoring'
import type { Company } from '../types/company'

export interface CompanyRow {
  id: string; name: string; description: string; industry: string
  employee_count: number; location: string; tags: string[]
  tech_stack_modernity: number; remote_rate: number
  estimated_overtime_hours: number; turnover_rate: number
  retention_rate: number; dev_environment: number; skill_up_support: number
  created_at: string; updated_at: string
}

interface Database {
  public: { Tables: { companies: { Row: CompanyRow } } }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/** DB行(snake_case) → Company(camelCase)。happinessScore はここで計算。 */
export function rowToCompany(row: CompanyRow): Company {
  const scores = {
    techStackModernity: row.tech_stack_modernity,
    remoteRate: row.remote_rate,
    estimatedOvertimeHours: row.estimated_overtime_hours,
    turnoverRate: row.turnover_rate,
    retentionRate: row.retention_rate,
    devEnvironment: row.dev_environment,
    skillUpSupport: row.skill_up_support,
  }
  return {
    id: row.id, name: row.name, description: row.description,
    industry: row.industry, employeeCount: row.employee_count,
    location: row.location, tags: row.tags,
    scores, happinessScore: calculateHappinessScore(scores),
  }
}
