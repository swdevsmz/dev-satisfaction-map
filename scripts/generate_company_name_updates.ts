import { createClient } from '@supabase/supabase-js'

// Supabaseクライアント設定
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function generateUpdateDML() {
  try {
    // 全企業データ取得
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching companies:', error)
      process.exit(1)
    }

    if (!companies || companies.length === 0) {
      console.error('No companies found')
      process.exit(1)
    }

    console.log(`-- DML: 企業名を正式名称に更新 (全${companies.length}社)`)
    console.log('')

    // 各企業のUPDATEステートメントを生成
    companies.forEach((company: any) => {
      const formalName = normalizeName(company.name)
      console.log(`UPDATE companies SET name = '${formalName}'`)
      console.log(`WHERE id = '${company.id}';`)
      console.log('')
    })

    console.log(`-- 合計: ${companies.length}件のUPDATE`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// 企業名を正式名称に正規化
function normalizeName(name: string): string {
  // 既に正式名称の可能性をチェック
  if (name.includes('株式会社')) {
    return name
  }

  // カタカナ企業名の場合
  if (/^[ァ-ヴー・ー]+$/.test(name)) {
    return `${name}株式会社`
  }

  // ひらがなの場合
  if (/^[ぁ-ん・ー]+$/.test(name)) {
    return `${name}株式会社`
  }

  // 英数字混在の場合（SmartHR → SmartHR株式会社）
  return `${name}株式会社`
}

generateUpdateDML()
