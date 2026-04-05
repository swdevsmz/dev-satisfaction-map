import { useState, useEffect } from 'react'
import type { Company } from '../types/company'
import { supabase, rowToCompany } from '../lib/supabase'

export function useCompanyById(id: string | undefined) {
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setIsLoading(false); return }
    const companyId = id
    let cancelled = false
    async function fetch() {
      setIsLoading(true); setError(null); setCompany(null)
      const { data, error: e } = await supabase.from('companies').select('*').eq('id', companyId).single()
      if (cancelled) return
      if (e) { setError(e.code === 'PGRST116' ? 'Company not found' : e.message); setIsLoading(false); return }
      setCompany(rowToCompany(data)); setIsLoading(false)
    }
    fetch()
    return () => { cancelled = true }
  }, [id])

  return { company, isLoading, error }
}
