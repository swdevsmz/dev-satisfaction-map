import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// .env.local から環境変数を読み込む
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL || ''
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fetchCompaniesList() {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching companies:', error)
      process.exit(1)
    }

    if (!companies) {
      console.error('No companies found')
      process.exit(1)
    }

    console.log(`取得企業数: ${companies.length}\n`)

    companies.forEach((company, index) => {
      console.log(`${String(index + 1).padStart(3, '0')}. [${company.id}] ${company.name}`)
    })
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

fetchCompaniesList()
