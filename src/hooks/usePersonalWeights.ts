import { useState, useCallback } from 'react'
import type { UserWeights } from '../types/company'
import { DEFAULT_USER_WEIGHTS } from '../types/company'
import { calculatePersonalScore } from '../utils/scoring'
import type { Company } from '../types/company'

const STORAGE_KEY = 'devmap:userWeights'

function loadWeights(): UserWeights {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_USER_WEIGHTS
    return { ...DEFAULT_USER_WEIGHTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_USER_WEIGHTS
  }
}

function isDefaultWeights(w: UserWeights): boolean {
  return Object.values(w).every((v) => v === 0)
}

export function usePersonalWeights() {
  const [weights, setWeights] = useState<UserWeights>(loadWeights)

  const updateWeight = useCallback((key: keyof UserWeights, value: number) => {
    setWeights((prev) => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const resetWeights = useCallback(() => {
    setWeights(DEFAULT_USER_WEIGHTS)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  const isPersonalized = !isDefaultWeights(weights)

  const sortByPersonal = useCallback(
    (companies: Company[]): Company[] =>
      [...companies].sort(
        (a, b) =>
          calculatePersonalScore(b.scores, weights) -
          calculatePersonalScore(a.scores, weights)
      ),
    [weights]
  )

  return { weights, updateWeight, resetWeights, isPersonalized, sortByPersonal }
}
