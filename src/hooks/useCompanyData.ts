import { useState, useEffect } from 'react'
import type { Company } from '../types/company'
import { supabase, rowToCompany } from '../lib/supabase'

export function useCompanyData() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setIsLoading(true); setError(null)
      const { data, error: e } = await supabase.from('companies').select('*').order('name')
      if (cancelled) return
      if (e) { setError(e.message); setIsLoading(false); return }
      const mapped = (data ?? []).map(rowToCompany)
      setCompanies(mapped)
      if (mapped.length > 0 && selectedId === null) {
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
