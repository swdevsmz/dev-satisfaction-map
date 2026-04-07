import { useState, useEffect } from 'react'
import type { CompanyWithSources, DataSource } from '../types/company'
import { supabase, rowToCompany, type CompanyScrapeRow, type CompanyScoreRow } from '../lib/supabase'

// 詳細画面用の単一企業データ取得フック。
// 基本情報・スコア・取得済みソースをまとめて読み込み、表示に必要な形へ整える。
export function useCompanyById(id: string | undefined) {
  const [company, setCompany] = useState<CompanyWithSources | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setIsLoading(false); return }
    const companyId = id
    let cancelled = false

    async function fetch() {
      setIsLoading(true); setError(null); setCompany(null)

      // 画面描画までの待ち時間を減らすため、必要な3系統を並列で取得する。
      const [{ data: row, error: ce }, { data: scoreRow }, { data: docs }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).single(),
        supabase.from('company_scores').select('*').eq('company_id', companyId).single().then(result => {
          // company_scores は 1:1 なので .single() だが、存在しない場合 404 が返る
          // その場合は null を返す（デフォルト値を使用するため）
          if (result.error?.code === 'PGRST116') return { data: null, error: null }
          return result
        }),
        supabase
          .from('company_scrapes')
          .select('source, url, scraped_at')
          .eq('company_id', companyId),
      ])

      if (cancelled) return
      if (ce) {
        setError(ce.code === 'PGRST116' ? 'Company not found' : ce.message)
        setIsLoading(false)
        return
      }

      // 詳細画面では URL と取得日時も見せたいので、ソース一覧を表示用の型に変換する。
      const dataSources: DataSource[] = ((docs ?? []) as Pick<CompanyScrapeRow, 'source' | 'url' | 'scraped_at'>[]).map((d) => ({
        source: d.source as DataSource['source'],
        url: d.url,
        scrapedAt: d.scraped_at,
      }))

      setCompany({ ...rowToCompany(row, scoreRow as CompanyScoreRow | null), dataSources })
      setIsLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [id])

  return { company, isLoading, error }
}
