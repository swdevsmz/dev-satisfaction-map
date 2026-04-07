import { useState, useEffect } from 'react'
import type { Company } from '../types/company'
import { supabase, rowToCompany, type CompanyScoreRow, type CompanyRow } from '../lib/supabase'

// 一覧画面用の企業データをまとめて取得するフック。
// companies と company_scores を分けて取得し、画面側では扱いやすい Company 型に揃える。
export function useCompanyData() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setIsLoading(true); setError(null)

      // 結合を埋め込みで取らず、2クエリを並列実行して安定性を優先する。
      const [{ data: companiesData, error: e1 }, { data: scoresData, error: e2 }] = await Promise.all([
        supabase.from('companies').select('*').order('name'),
        supabase.from('company_scores').select('*'),
      ])

      if (cancelled) return
      if (e1 || e2) { setError((e1 || e2)?.message ?? 'Unknown error'); setIsLoading(false); return }

      // company_id をキーにしておくと、企業ごとの結合を O(1) で引ける。
      const scoresMap = new Map((scoresData ?? []).map((s: CompanyScoreRow) => [s.company_id, s]))

      const mapped = (companiesData ?? []).map((companyRow: CompanyRow) => {
        const scoreRow = scoresMap.get(companyRow.id) ?? null
        return rowToCompany(companyRow, scoreRow as CompanyScoreRow | null)
      })

      setCompanies(mapped)
      if (mapped.length > 0 && selectedId === null) {
        // 初回表示では幸福度トップの企業を選択済みにして、右カラムを空にしない。
        setSelectedId([...mapped].sort((a, b) => b.happinessScore - a.happinessScore)[0].id)
      }
      setIsLoading(false)
    }
    fetch()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedCompany = companies.find((c) => c.id === selectedId) ?? null
  const ranked = [...companies].sort((a, b) => b.happinessScore - a.happinessScore)
  return { companies, ranked, selectedId, setSelectedId, selectedCompany, isLoading, error }
}
