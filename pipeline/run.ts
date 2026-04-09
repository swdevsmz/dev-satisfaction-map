#!/usr/bin/env node
/**
 * ETLパイプライン CLIエントリーポイント
 *
 * Usage:
 *   npx tsx pipeline/run.ts --company mercari-jp --source connpass
 *   npx tsx pipeline/run.ts --company mercari-jp --source connpass,openwork --accept-tos
 *   npx tsx pipeline/run.ts --company mercari-jp --source connpass --dry-run
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// pipeline.env を自動読み込み
try {
  const envPath = resolve(process.cwd(), 'pipeline.env')
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (key && !process.env[key]) process.env[key] = val
  }
} catch {
  // pipeline.env が存在しない場合は環境変数から読む
}

import { scrapeConnpass } from './scrapers/connpass.js'
import { scrapeOpenWork } from './scrapers/openwork.js'
import { scrapeGithub } from './scrapers/github.js'
import { scrapeIR } from './scrapers/ir.js'
import { extractScores } from './extractors/ollama.js'
import { insertRawDocument, upsertCompanyScores } from './db/upsert.js'
import type { ScrapedDocument } from './types.js'

export type SourceType = 'connpass' | 'openwork' | 'ir' | 'github'

export interface PipelineOptions {
  companyId: string
  sources: SourceType[]
  dryRun?: boolean
  acceptTos?: boolean
  verbose?: boolean
}

type ScrapeResult =
  | { source: string; doc: ScrapedDocument }
  | { source: string; error: string }
  | { source: string; skipped: true; reason: string }

// ── パイプライン本体（テスト可能な形でエクスポート）────────────────
export async function runPipeline(options: PipelineOptions): Promise<void> {
  const { companyId, sources, dryRun = false, acceptTos = false, verbose = false } = options

  console.log(`\n🚀 パイプライン開始`)
  console.log(`  企業ID  : ${ companyId }`)
  console.log(`  ソース  : ${ sources.join(', ') }`)
  console.log(`  ドライラン: ${ dryRun }`)
  console.log()

  // Step 1: スクレイピング（並列）
  const docs: ScrapedDocument[] = []

  console.log(`📡 スクレイピング中（並列）: ${ sources.join(', ') }`)

  const results: ScrapeResult[] = await Promise.all(
    sources.map(async (source): Promise<ScrapeResult> => {
      try {
        let doc: ScrapedDocument

        if (source === 'connpass') {
          doc = await scrapeConnpass(companyId)
        } else if (source === 'openwork') {
          doc = await scrapeOpenWork(companyId, acceptTos)
        } else if (source === 'github') {
          doc = await scrapeGithub(companyId)
        } else if (source === 'ir') {
          doc = await scrapeIR(companyId)
        } else {
          return { source, skipped: true, reason: '未対応ソース' }
        }

        if (!dryRun) {
          await insertRawDocument(doc)
        }

        return { source, doc }
      } catch (err) {
        return { source, error: (err as Error).message }
      }
    })
  )

  for (const result of results) {
    if ('doc' in result) {
      docs.push(result.doc)
      console.log(`  ✓ ${ result.source }: 取得完了 (${ result.doc.content.length } 文字)`)

      if (verbose) {
        console.log('  ─── スクレイプ内容 ───')
        console.log(result.doc.content.split('\n').map(l => '  ' + l).join('\n'))
        console.log('  ─────────────────────')
      }

      if (!dryRun) {
        console.log(`  ✓ ${ result.source }: raw_documents 保存完了`)
      } else {
        console.log(`  [dry-run] ${ result.source }: raw_documents への保存をスキップ`)
      }
    } else if ('skipped' in result) {
      console.log(`  ⚠ ${ result.source }: ${ result.reason }（スキップ）`)
    } else {
      console.error(`  ✗ ${ result.source } エラー: ${ result.error }`)
    }
  }

  const failedCount = results.filter((r) => 'error' in r).length
  if (failedCount > 0 && !dryRun) {
    throw new Error(`スクレイピング失敗: ${ failedCount } ソース`)
  }

  if (docs.length === 0) {
    console.log('\n⚠ ドキュメントが取得できませんでした。終了します。')
    return
  }

  // Step 2: Ollama でスコア抽出
  console.log(`\n🤖 Ollama (${ process.env.OLLAMA_MODEL ?? 'gemma2' }) でスコア抽出中...`)
  const combinedContent = docs
    .map((d) => compactDocumentForLlm(d))
    .join('\n\n')

  if (verbose) {
    console.log('  ─── Ollama への入力 ───')
    console.log(combinedContent.split('\n').map(l => '  ' + l).join('\n'))
    console.log('  ──────────────────────')
  }

  const scores = await extractScores(combinedContent)
  console.log('  ✓ 抽出完了')
  const extracted = Object.entries(scores).filter(([, v]) => v !== null)
  if (extracted.length === 0) {
    console.log('  ⚠ 抽出値なし（ソースデータが不十分か、Ollamaモデルが対応していない可能性があります）')
  } else {
    console.log('  抽出結果:')
    for (const [k, v] of extracted) console.log(`    ${ k }: ${ JSON.stringify(v) }`)
  }

  // Step 3: companies テーブルを upsert
  if (!dryRun) {
    console.log(`\n📝 companies テーブルを更新中...`)
    await upsertCompanyScores(companyId, scores, docs)
    console.log('  ✓ 更新完了')
  } else {
    console.log('\n[dry-run] companies テーブルへの書き込みをスキップ')
  }

  console.log('\n✅ パイプライン完了\n')
}

function compactDocumentForLlm(doc: ScrapedDocument): string {
  const lines = doc.content.split('\n')
  const compacted: string[] = []
  let recentRepoCount = 0
  let recentEventCount = 0
  let inRepoSection = false
  let inEventSection = false
  let inReviewSection = false
  let totalLength = 0

  const shouldKeep = (line: string): boolean => {
    if (
      line.startsWith('企業ID:') ||
      line.startsWith('ソース:') ||
      line.startsWith('URL:') ||
      line.startsWith('GitHub org:') ||
      line.startsWith('公開リポジトリ数:') ||
      line.startsWith('フォロワー数:') ||
      line.startsWith('過去30日のイベント数:') ||
      line.startsWith('tech_stack_modernity推定:') ||
      line.startsWith('dev_environment推定:') ||
      line.startsWith('開催件数（過去1年）:') ||
      line.startsWith('平均定員数:') ||
      line.startsWith('skill_up_support推定:') ||
      line.startsWith('技術タグ:') ||
      line.startsWith('【口コミ抜粋') ||
      line.startsWith('総合評価スコア') ||
      line.startsWith('残業時間') ||
      line.startsWith('有給休暇消化率') ||
      line.startsWith('待遇面') ||
      line.startsWith('社員の士気') ||
      line.startsWith('風通しの良さ') ||
      line.startsWith('社員の相互尊重') ||
      line.startsWith('20代成長環境') ||
      line.startsWith('人材の長期育成') ||
      line.startsWith('法令順守意識') ||
      line.startsWith('人事評価の適正感') ||
      line.startsWith('【データ取得不可') ||
      line.startsWith('【IR情報】')
    ) {
      return true
    }

    if (line.startsWith('【リポジトリ一覧')) {
      inRepoSection = true
      return true
    }

    if (line.startsWith('【イベント一覧')) {
      inEventSection = true
      return true
    }

    if (line.startsWith('【口コミ抜粋')) {
      inReviewSection = true
      return true
    }

    if (inRepoSection && line.startsWith('- ') && recentRepoCount < 5) {
      recentRepoCount++
      return true
    }

    if (inEventSection && line.startsWith('- ') && recentEventCount < 5) {
      recentEventCount++
      return true
    }

    if (inReviewSection && line.startsWith('- ')) {
      return true
    }

    return false
  }

  for (const line of lines) {
    const normalized = line.trim().replace(/\s+/g, ' ')
    if (!normalized) continue
    if (shouldKeep(normalized)) {
      compacted.push(normalized)
      totalLength += normalized.length
      if (totalLength > 4000) break
    }
  }

  if (compacted.length === 0) {
    compacted.push(...lines.slice(0, 20).map((line) => line.trim().replace(/\s+/g, ' ')).filter(Boolean))
  }

  return `=== ${ doc.source } ===\n${ compacted.join('\n') }`
}

// ── CLI引数パース ────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)

  function getArg(name: string): string | undefined {
    const idx = args.indexOf(`--${ name }`)
    return idx >= 0 ? args[idx + 1] : undefined
  }

  function hasFlag(name: string): boolean {
    return args.includes(`--${ name }`)
  }

  const companyId = getArg('company')
  const sourceArg = getArg('source') ?? 'connpass'
  const dryRun    = hasFlag('dry-run')
  const acceptTos = hasFlag('accept-tos')
  const verbose   = hasFlag('verbose')

  if (!companyId) {
    console.error('エラー: --company <id> が必要です')
    console.error('例: npx tsx pipeline/run.ts --company mercari-jp --source connpass')
    process.exit(1)
  }

  const sources = sourceArg.split(',').map((s) => s.trim()) as SourceType[]

  try {
    await runPipeline({ companyId, sources, dryRun, acceptTos, verbose })
  } catch (err) {
    console.error(`\n❌ ${ (err as Error).message }`)
    process.exit(1)
  }
}

// 直接実行時のみ main() を呼ぶ（テストからインポートされた場合は実行しない）
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((err) => {
    console.error('予期しないエラー:', err)
    process.exit(1)
  })
}
