import { useState } from 'react'
import type { Company } from '../types/company'
import { mockCompanies } from '../data/mockData'

export function useCompanyData() {
  const [companies] = useState<Company[]>(mockCompanies)
  const [selectedId, setSelectedId] = useState<string>(companies[0].id)

  const selectedCompany = companies.find((c) => c.id === selectedId) ?? companies[0]
  const ranked = [...companies].sort((a, b) => b.happinessScore - a.happinessScore)

  return { companies, ranked, selectedId, setSelectedId, selectedCompany }
}
