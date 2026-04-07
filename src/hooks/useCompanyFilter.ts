import { useState, useMemo } from 'react'
import type { Company } from '../types/company'

export interface FilterState {
  keyword: string
  minScore: number
  minRemoteRate: number
  selectedTags: string[]
}

export interface UseCompanyFilterReturn {
  keyword: string
  minScore: number
  minRemoteRate: number
  selectedTags: string[]
  setKeyword: (k: string) => void
  setMinScore: (s: number) => void
  setMinRemoteRate: (r: number) => void
  toggleTag: (tag: string) => void
  filtered: Company[]
  availableTags: string[]
  activeCount: number
  isFiltered: boolean
  reset: () => void
}

export const SCORE_THRESHOLDS = [
  { label: '全て', value: 0 },
  { label: '40以上', value: 40 },
  { label: '70以上', value: 70 },
] as const

export const REMOTE_RATE_THRESHOLDS = [
  { label: '全て', value: 0 },
  { label: '50%以上', value: 50 },
  { label: '80%以上', value: 80 },
] as const

// 一覧画面の絞り込み状態をまとめて管理するフック。
export function useCompanyFilter(companies: Company[]): UseCompanyFilterReturn {
  const [keyword, setKeyword] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [minRemoteRate, setMinRemoteRate] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // タグが多すぎるとUIが散らかるため、頻出上位だけを候補に出す。
  const availableTags = useMemo(() => {
    const counts = new Map<string, number>()
    companies.forEach((c) =>
      c.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1))
    )
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag)
  }, [companies])

  // 条件はすべて AND で適用する。
  const filtered = useMemo(() => {
    return companies.filter((c) => {
      // BR-01: キーワード検索（大文字小文字区別なし、部分一致）
      if (keyword !== '') {
        const kw = keyword.toLowerCase()
        const hit =
          c.name.toLowerCase().includes(kw) ||
          c.description.toLowerCase().includes(kw) ||
          c.industry.toLowerCase().includes(kw)
        if (!hit) return false
      }

      // BR-02: スコア下限フィルタ
      if (c.happinessScore < minScore) return false

      // BR-03: リモート率下限フィルタ
      if (c.scores.remoteRate < minRemoteRate) return false

      // BR-04: タグ AND フィルタ
      if (
        selectedTags.length > 0 &&
        !selectedTags.every((t) => c.tags.includes(t))
      ) {
        return false
      }

      return true
    })
  }, [companies, keyword, minScore, minRemoteRate, selectedTags])

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )

  // 一括リセットは、一覧を初期状態に戻すための操作。
  const reset = () => {
    setKeyword('')
    setMinScore(0)
    setMinRemoteRate(0)
    setSelectedTags([])
  }

  const isFiltered =
    keyword !== '' || minScore > 0 || minRemoteRate > 0 || selectedTags.length > 0

  const activeCount =
    (keyword !== '' ? 1 : 0) +
    (minScore > 0 ? 1 : 0) +
    (minRemoteRate > 0 ? 1 : 0) +
    selectedTags.length

  return {
    keyword,
    minScore,
    minRemoteRate,
    selectedTags,
    setKeyword,
    setMinScore,
    setMinRemoteRate,
    toggleTag,
    filtered,
    availableTags,
    activeCount,
    isFiltered,
    reset,
  }
}
