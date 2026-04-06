import { useState, useEffect } from 'react'
import type { CompanyWithSources, DataSource } from '../types/company'
import { supabase, rowToCompany, type RawDocumentRow } from '../lib/supabase'

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

      const [{ data: row, error: ce }, { data: docs }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).single(),
        supabase
          .from('raw_documents')
          .select('source, url, scraped_at')
          .eq('company_id', companyId),
      ])

      if (cancelled) return
      if (ce) {
        setError(ce.code === 'PGRST116' ? 'Company not found' : ce.message)
        setIsLoading(false)
        return
      }

      const dataSources: DataSource[] = ((docs ?? []) as Pick<RawDocumentRow, 'source' | 'url' | 'scraped_at'>[]).map((d) => ({
        source: d.source as DataSource['source'],
        url: d.url,
        scrapedAt: d.scraped_at,
      }))

      setCompany({ ...rowToCompany(row), dataSources })
      setIsLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [id])

  return { company, isLoading, error }
}
