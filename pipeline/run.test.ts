// @vitest-environment node
/**
 * pipeline/run.ts — runPipeline 並行実行テスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ScrapedDocument, ExtractedScores } from './types.js'

// ── モック設定 ────────────────────────────────────────────────────
vi.mock('./scrapers/connpass.js',  () => ({ scrapeConnpass:  vi.fn() }))
vi.mock('./scrapers/openwork.js',  () => ({ scrapeOpenWork:  vi.fn() }))
vi.mock('./scrapers/github.js',    () => ({ scrapeGithub:    vi.fn() }))
vi.mock('./scrapers/ir.js',        () => ({ scrapeIR:        vi.fn() }))
vi.mock('./extractors/ollama.js',  () => ({ extractScores:   vi.fn() }))
vi.mock('./db/upsert.js',          () => ({
  insertRawDocument:  vi.fn(),
  upsertCompanyScores: vi.fn(),
}))

import { runPipeline } from './run.js'
import { scrapeConnpass }  from './scrapers/connpass.js'
import { scrapeOpenWork }  from './scrapers/openwork.js'
import { scrapeGithub }    from './scrapers/github.js'
import { scrapeIR }        from './scrapers/ir.js'
import { extractScores }   from './extractors/ollama.js'
import { insertRawDocument, upsertCompanyScores } from './db/upsert.js'

// ── ヘルパー ──────────────────────────────────────────────────────
function makeDoc(source: ScrapedDocument['source'], companyId = 'test-co'): ScrapedDocument {
  return { companyId, source, url: `https://example.com/${source}`, content: `${source} content` }
}

const nullScores: ExtractedScores = {
  tech_stack_modernity:     null,
  remote_rate:              null,
  estimated_overtime_hours: null,
  turnover_rate:            null,
  retention_rate:           null,
  dev_environment:          null,
  skill_up_support:         null,
  description:              null,
  tags:                     null,
}

// ── テスト ────────────────────────────────────────────────────────
describe('runPipeline', () => {
  const mockScrapeConnpass  = vi.mocked(scrapeConnpass)
  const mockScrapeOpenWork  = vi.mocked(scrapeOpenWork)
  const mockScrapeGithub    = vi.mocked(scrapeGithub)
  const mockScrapeIR        = vi.mocked(scrapeIR)
  const mockExtractScores   = vi.mocked(extractScores)
  const mockInsert          = vi.mocked(insertRawDocument)
  const mockUpsert          = vi.mocked(upsertCompanyScores)

  beforeEach(() => {
    vi.clearAllMocks()
    mockExtractScores.mockResolvedValue(nullScores)
    mockInsert.mockResolvedValue(undefined)
    mockUpsert.mockResolvedValue(undefined)
  })

  // ── 並行実行 ────────────────────────────────────────────────────
  describe('並行実行', () => {
    it('複数スクレイパーを並行実行する（所要時間が直列の半分未満）', async () => {
      const DELAY = 60

      mockScrapeConnpass.mockImplementation(
        () => new Promise(res => setTimeout(() => res(makeDoc('connpass')), DELAY))
      )
      mockScrapeGithub.mockImplementation(
        () => new Promise(res => setTimeout(() => res(makeDoc('github')), DELAY))
      )

      const start = Date.now()
      await runPipeline({
        companyId: 'test-co',
        sources: ['connpass', 'github'],
        dryRun: true,
      })
      const elapsed = Date.now() - start

      // 並行なら ≈ DELAY ms、直列なら ≈ DELAY*2 ms
      expect(elapsed).toBeLessThan(DELAY * 1.8)
      expect(mockScrapeConnpass).toHaveBeenCalledOnce()
      expect(mockScrapeGithub).toHaveBeenCalledOnce()
    })

    it('4ソースすべてを並行実行する', async () => {
      const DELAY = 50
      const makeDelayed = (doc: ScrapedDocument) =>
        new Promise<ScrapedDocument>(res => setTimeout(() => res(doc), DELAY))

      mockScrapeConnpass.mockImplementation(() => makeDelayed(makeDoc('connpass')))
      mockScrapeOpenWork.mockImplementation(() => makeDelayed(makeDoc('openwork')))
      mockScrapeGithub.mockImplementation(  () => makeDelayed(makeDoc('github')))
      mockScrapeIR.mockImplementation(      () => makeDelayed(makeDoc('ir')))

      const start = Date.now()
      await runPipeline({
        companyId: 'test-co',
        sources: ['connpass', 'openwork', 'github', 'ir'],
        dryRun: true,
        acceptTos: true,
      })
      const elapsed = Date.now() - start

      // 4つ直列なら 200ms、並行なら ≈ 50ms
      expect(elapsed).toBeLessThan(DELAY * 1.8)
    })
  })

  // ── 正常系 ──────────────────────────────────────────────────────
  describe('正常系', () => {
    it('成功時に insertRawDocument を各ドキュメントに対して呼ぶ', async () => {
      mockScrapeConnpass.mockResolvedValue(makeDoc('connpass'))
      mockScrapeGithub.mockResolvedValue(makeDoc('github'))

      await runPipeline({
        companyId: 'test-co',
        sources: ['connpass', 'github'],
      })

      expect(mockInsert).toHaveBeenCalledTimes(2)
    })

    it('extractScores に全ドキュメントの結合コンテンツを渡す', async () => {
      mockScrapeConnpass.mockResolvedValue(makeDoc('connpass'))
      mockScrapeGithub.mockResolvedValue(makeDoc('github'))

      await runPipeline({
        companyId: 'test-co',
        sources: ['connpass', 'github'],
      })

      expect(mockExtractScores).toHaveBeenCalledOnce()
      const input: string = mockExtractScores.mock.calls[0][0]
      expect(input).toContain('=== connpass ===')
      expect(input).toContain('=== github ===')
    })

    it('upsertCompanyScores に companyId とスコアを渡す', async () => {
      mockScrapeConnpass.mockResolvedValue(makeDoc('connpass'))
      const scores: ExtractedScores = { ...nullScores, tech_stack_modernity: 8 }
      mockExtractScores.mockResolvedValue(scores)

      await runPipeline({ companyId: 'mercari-jp', sources: ['connpass'] })

      expect(mockUpsert).toHaveBeenCalledWith('mercari-jp', scores)
    })
  })

  // ── dry-run ─────────────────────────────────────────────────────
  describe('dry-run', () => {
    it('insertRawDocument を呼ばない', async () => {
      mockScrapeConnpass.mockResolvedValue(makeDoc('connpass'))

      await runPipeline({ companyId: 'test-co', sources: ['connpass'], dryRun: true })

      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('upsertCompanyScores を呼ばない', async () => {
      mockScrapeConnpass.mockResolvedValue(makeDoc('connpass'))

      await runPipeline({ companyId: 'test-co', sources: ['connpass'], dryRun: true })

      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('スクレイパーエラーが発生しても例外を投げない', async () => {
      mockScrapeConnpass.mockRejectedValue(new Error('network error'))

      // dry-run + エラーの場合は throw しない（failedCount チェックをスキップ）
      await expect(
        runPipeline({ companyId: 'test-co', sources: ['connpass'], dryRun: true })
      ).resolves.toBeUndefined()
    })
  })

  // ── エラーハンドリング ───────────────────────────────────────────
  describe('エラーハンドリング', () => {
    it('スクレイパーエラー時（非dry-run）は例外を投げる', async () => {
      mockScrapeConnpass.mockRejectedValue(new Error('タイムアウト'))

      await expect(
        runPipeline({ companyId: 'test-co', sources: ['connpass'] })
      ).rejects.toThrow('スクレイピング失敗')
    })

    it('一部スクレイパーが失敗しても他のスクレイパーは実行される', async () => {
      mockScrapeConnpass.mockRejectedValue(new Error('失敗'))
      mockScrapeGithub.mockResolvedValue(makeDoc('github'))

      // dry-run にして例外を回避しつつ両スクレイパーが呼ばれたか確認
      await runPipeline({
        companyId: 'test-co',
        sources: ['connpass', 'github'],
        dryRun: true,
      })

      expect(mockScrapeConnpass).toHaveBeenCalledOnce()
      expect(mockScrapeGithub).toHaveBeenCalledOnce()
    })

    it('未対応ソースは skipped として処理される', async () => {
      // 'unknown' をキャストして渡す
      mockScrapeConnpass.mockResolvedValue(makeDoc('connpass'))

      await runPipeline({
        companyId: 'test-co',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sources: ['connpass', 'unknown' as any],
        dryRun: true,
      })

      // unknown はスキップされるが connpass は処理される
      expect(mockScrapeConnpass).toHaveBeenCalledOnce()
    })

    it('ドキュメントが0件の場合は extractScores を呼ばない', async () => {
      mockScrapeConnpass.mockRejectedValue(new Error('失敗'))

      await runPipeline({
        companyId: 'test-co',
        sources: ['connpass'],
        dryRun: true,
      })

      expect(mockExtractScores).not.toHaveBeenCalled()
    })
  })

  // ── 各スクレイパーの呼び出し引数 ────────────────────────────────
  describe('スクレイパー呼び出し引数', () => {
    it('scrapeConnpass に companyId を渡す', async () => {
      mockScrapeConnpass.mockResolvedValue(makeDoc('connpass'))

      await runPipeline({ companyId: 'cyberagent', sources: ['connpass'], dryRun: true })

      expect(mockScrapeConnpass).toHaveBeenCalledWith('cyberagent')
    })

    it('scrapeOpenWork に companyId と acceptTos を渡す', async () => {
      mockScrapeOpenWork.mockResolvedValue(makeDoc('openwork'))

      await runPipeline({
        companyId: 'cyberagent',
        sources: ['openwork'],
        dryRun: true,
        acceptTos: true,
      })

      expect(mockScrapeOpenWork).toHaveBeenCalledWith('cyberagent', true)
    })
  })
})
