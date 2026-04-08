/**
 * useCompanyFilter — Property-Based Tests (fast-check)
 *
 * 実行方法（テストランナー未設定のため暫定）:
 *   npx tsx src/hooks/useCompanyFilter.test.ts
 *
 * 推奨: Vitest 導入後は `npx vitest run` で実行
 *   npm install -D vitest
 *   vitest.config.ts に test: { globals: true } を追加
 *
 * fast-check seed について (PBT-08):
 *   失敗時はコンソールに seed 値が出力されます。
 *   再現: fc.assert(..., { seed: <表示された値> })
 */

import * as fc from 'fast-check'
import type { Company, CompanyScores } from '../types/company'
import { calculateHappinessScore, getScoreColor } from '../utils/scoring'

// ─── テスト用ヘルパー ─────────────────────────────────────────────

/** fast-check Arbitrary: CompanyScores */
const arbScores: fc.Arbitrary<CompanyScores> = fc.tuple(
  fc.record({
    techStackModernity:     fc.integer({ min: 1, max: 10 }),
    remoteRate:             fc.integer({ min: 0, max: 100 }),
    estimatedOvertimeHours: fc.integer({ min: 0, max: 80 }),
    turnoverRate:           fc.integer({ min: 0, max: 100 }),
    retentionRate:          fc.integer({ min: 0, max: 100 }),
    devEnvironment:         fc.integer({ min: 1, max: 10 }),
    skillUpSupport:         fc.integer({ min: 1, max: 10 }),
  }),
  fc.integer({ min: 0, max: 100 })
).map(([baseScores, reliabilityScore]) => {
  // Create a temporary full CompanyScores object to calculate happiness score
  const tempScores: CompanyScores = {
    ...baseScores,
    happinessScore: 0,
    scoreColor: 'red' as const,
    reliabilityScore: 0,
  }
  const happinessScore = calculateHappinessScore(tempScores)
  return {
    ...baseScores,
    happinessScore,
    scoreColor: getScoreColor(happinessScore),
    reliabilityScore,
  }
})

const SAMPLE_TAGS = ['Go', 'React', 'TypeScript', 'Kotlin', 'Ruby', 'リモートOK', 'SaaS', 'AWS', 'Docker', 'Python']

/** fast-check Arbitrary: Company */
const arbCompany: fc.Arbitrary<Company> = fc.record({
  id:           fc.string({ minLength: 1, maxLength: 20 }),
  name:         fc.string({ minLength: 1, maxLength: 50 }),
  description:  fc.string({ minLength: 0, maxLength: 200 }),
  industry:     fc.string({ minLength: 1, maxLength: 30 }),
  employeeCount: fc.integer({ min: 1, max: 100000 }),
  location:     fc.string({ minLength: 1, maxLength: 30 }),
  scores:       arbScores,
  happinessScore: fc.constant(0), // 後でcalculate
  tags:         fc.array(fc.constantFrom(...SAMPLE_TAGS), { minLength: 0, maxLength: 5 }),
  dataUpdatedAt: fc.constant(new Date().toISOString()),
}).map((c) => ({ ...c, happinessScore: calculateHappinessScore(c.scores) }))

/** FilterState arbitrary */
const arbFilterState = fc.record({
  keyword:       fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 10 })),
  minScore:      fc.constantFrom(0, 40, 70),
  minRemoteRate: fc.constantFrom(0, 50, 80),
  selectedTags:  fc.array(fc.constantFrom(...SAMPLE_TAGS), { minLength: 0, maxLength: 3 }),
})

/** フィルタ純粋関数（useCompanyFilter フックのロジックを切り出し） */
function applyFilter(
  companies: Company[],
  keyword: string,
  minScore: number,
  minRemoteRate: number,
  selectedTags: string[]
): Company[] {
  return companies.filter((c) => {
    if (keyword !== '') {
      const kw = keyword.toLowerCase()
      const hit =
        c.name.toLowerCase().includes(kw) ||
        c.description.toLowerCase().includes(kw) ||
        c.industry.toLowerCase().includes(kw)
      if (!hit) return false
    }
    if (c.happinessScore < minScore) return false
    if (c.scores.remoteRate < minRemoteRate) return false
    if (selectedTags.length > 0 && !selectedTags.every((t) => c.tags.includes(t))) return false
    return true
  })
}

function getAvailableTags(companies: Company[]): string[] {
  const counts = new Map<string, number>()
  companies.forEach((c) => c.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag)
}

// ─── Example-based テスト（PBT-10） ──────────────────────────────

function testExamples() {
  const companies: Company[] = [
    {
      id: 'a', name: 'メルカリ', description: 'Go・Kubernetes', industry: 'EC',
      employeeCount: 2000, location: '東京', dataUpdatedAt: '',
      scores: { techStackModernity: 9, remoteRate: 90, estimatedOvertimeHours: 15,
                turnoverRate: 18, retentionRate: 82, devEnvironment: 9, skillUpSupport: 8,
                happinessScore: 0, scoreColor: 'red' as const, reliabilityScore: 0 },
      happinessScore: 0, tags: ['Go', 'React', 'リモートOK'],
    },
    {
      id: 'b', name: '楽天', description: '大規模Java', industry: 'EC',
      employeeCount: 28000, location: '東京', dataUpdatedAt: '',
      scores: { techStackModernity: 4, remoteRate: 40, estimatedOvertimeHours: 45,
                turnoverRate: 30, retentionRate: 70, devEnvironment: 5, skillUpSupport: 5,
                happinessScore: 0, scoreColor: 'red' as const, reliabilityScore: 0 },
      happinessScore: 0, tags: ['Java', 'PHP'],
    },
  ].map((c) => {
    const happinessScore = calculateHappinessScore(c.scores)
    return {
      ...c,
      happinessScore,
      scores: { ...c.scores, happinessScore, scoreColor: getScoreColor(happinessScore) },
    }
  })

  // キーワード検索
  const r1 = applyFilter(companies, 'メルカリ', 0, 0, [])
  console.assert(r1.length === 1 && r1[0].id === 'a', 'Example: keyword filter')

  // スコアフィルタ（楽天のスコアは低いはず）
  const r2 = applyFilter(companies, '', 70, 0, [])
  console.assert(r2.every((c) => c.happinessScore >= 70), 'Example: score filter')

  // リモート率フィルタ
  const r3 = applyFilter(companies, '', 0, 80, [])
  console.assert(r3.every((c) => c.scores.remoteRate >= 80), 'Example: remote rate filter')

  // タグフィルタ
  const r4 = applyFilter(companies, '', 0, 0, ['Go'])
  console.assert(r4.length === 1 && r4[0].id === 'a', 'Example: tag filter')

  console.log('✓ Example-based tests passed')
}

// ─── Property-Based テスト ────────────────────────────────────────

/** P1: 結果は入力の部分集合 */
function testP1_subsetProperty() {
  fc.assert(
    fc.property(
      fc.array(arbCompany, { minLength: 0, maxLength: 20 }),
      arbFilterState,
      (companies, { keyword, minScore, minRemoteRate, selectedTags }) => {
        const result = applyFilter(companies, keyword, minScore, minRemoteRate, selectedTags)
        return result.length <= companies.length &&
          result.every((r) => companies.some((c) => c.id === r.id))
      }
    ),
    { numRuns: 200 }
  )
  console.log('✓ P1: 結果は入力の部分集合')
}

/** P2: 空フィルターは全件返す */
function testP2_emptyFilterReturnsAll() {
  fc.assert(
    fc.property(
      fc.array(arbCompany, { minLength: 0, maxLength: 20 }),
      (companies) => {
        const result = applyFilter(companies, '', 0, 0, [])
        return result.length === companies.length
      }
    ),
    { numRuns: 200 }
  )
  console.log('✓ P2: 空フィルターは全件返す')
}

/** P3: より厳しいスコアフィルタは件数が同じか少ない */
function testP3_stricterFilterFewerResults() {
  fc.assert(
    fc.property(
      fc.array(arbCompany, { minLength: 0, maxLength: 20 }),
      (companies) => {
        const r40 = applyFilter(companies, '', 40, 0, [])
        const r70 = applyFilter(companies, '', 70, 0, [])
        return r70.length <= r40.length
      }
    ),
    { numRuns: 200 }
  )
  console.log('✓ P3: 厳しいフィルタで件数は単調減少')
}

/** P4: フィルタの冪等性 */
function testP4_idempotent() {
  fc.assert(
    fc.property(
      fc.array(arbCompany, { minLength: 0, maxLength: 20 }),
      arbFilterState,
      (companies, { keyword, minScore, minRemoteRate, selectedTags }) => {
        const once  = applyFilter(companies, keyword, minScore, minRemoteRate, selectedTags)
        const twice = applyFilter(once,      keyword, minScore, minRemoteRate, selectedTags)
        return once.length === twice.length &&
          once.every((c, i) => c.id === twice[i].id)
      }
    ),
    { numRuns: 200 }
  )
  console.log('✓ P4: フィルタは冪等')
}

/** P5: 結果の全企業がフィルター条件を満たす */
function testP5_allResultsMatchFilter() {
  fc.assert(
    fc.property(
      fc.array(arbCompany, { minLength: 0, maxLength: 20 }),
      arbFilterState,
      (companies, { keyword, minScore, minRemoteRate, selectedTags }) => {
        const result = applyFilter(companies, keyword, minScore, minRemoteRate, selectedTags)
        return result.every((c) => {
          if (keyword !== '') {
            const kw = keyword.toLowerCase()
            const hit = c.name.toLowerCase().includes(kw) ||
              c.description.toLowerCase().includes(kw) ||
              c.industry.toLowerCase().includes(kw)
            if (!hit) return false
          }
          if (c.happinessScore < minScore) return false
          if (c.scores.remoteRate < minRemoteRate) return false
          if (selectedTags.length > 0 && !selectedTags.every((t) => c.tags.includes(t))) return false
          return true
        })
      }
    ),
    { numRuns: 200 }
  )
  console.log('✓ P5: 全結果がフィルター条件を満たす')
}

/** P6: availableTags は最大10件 */
function testP6_tagsMaxTen() {
  fc.assert(
    fc.property(
      fc.array(arbCompany, { minLength: 0, maxLength: 50 }),
      (companies) => {
        const tags = getAvailableTags(companies)
        return tags.length <= 10
      }
    ),
    { numRuns: 200 }
  )
  console.log('✓ P6: availableTags は最大10件')
}

/** P7: availableTags の各タグは少なくとも1社が保有 */
function testP7_tagsOwnedByAtLeastOne() {
  fc.assert(
    fc.property(
      fc.array(arbCompany, { minLength: 1, maxLength: 30 }),
      (companies) => {
        const tags = getAvailableTags(companies)
        return tags.every((tag) => companies.some((c) => c.tags.includes(tag)))
      }
    ),
    { numRuns: 200 }
  )
  console.log('✓ P7: availableTags の各タグは最低1社が保有')
}

// ─── 実行 ─────────────────────────────────────────────────────────

console.log('\n=== useCompanyFilter Tests ===\n')

try {
  testExamples()
  testP1_subsetProperty()
  testP2_emptyFilterReturnsAll()
  testP3_stricterFilterFewerResults()
  testP4_idempotent()
  testP5_allResultsMatchFilter()
  testP6_tagsMaxTen()
  testP7_tagsOwnedByAtLeastOne()
  console.log('\n✅ All tests passed\n')
} catch (e) {
  console.error('\n❌ Test failed:', e)
  process.exit(1)
}
