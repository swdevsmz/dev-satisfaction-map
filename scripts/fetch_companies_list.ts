import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

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

    console.log(`取得企業数: ${companies.length}`)
    console.log('')
    console.log('ID\t\t\t名前')
    console.log('-'.repeat(60))

    companies.forEach((company: any) => {
      console.log(`${company.id}\t${company.name}`)
    })
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

fetchCompaniesList()
