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

// ── CLI引数パース ────────────────────────────────────────
const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 ? args[idx + 1] : undefined
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`)
}

const companyId  = getArg('company')
const sourceArg  = getArg('source') ?? 'connpass'
const dryRun     = hasFlag('dry-run')
const skipScrape = hasFlag('skip-scrape')
const acceptTos  = hasFlag('accept-tos')
const verbose    = hasFlag('verbose')

if (!companyId) {
  console.error('エラー: --company <id> が必要です')
  console.error('例: npx tsx pipeline/run.ts --company mercari-jp --source connpass')
  process.exit(1)
}

const sources = sourceArg.split(',').map((s) => s.trim()) as Array<
  'connpass' | 'openwork' | 'ir' | 'github'
>

// ── メイン処理 ────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 パイプライン開始`)
  console.log(`  企業ID  : ${companyId}`)
  console.log(`  ソース  : ${sources.join(', ')}`)
  console.log(`  ドライラン: ${dryRun}`)
  console.log()

  // Step 1: スクレイピング
  const docs: ScrapedDocument[] = []

  if (!skipScrape) {
    for (const source of sources) {
      console.log(`📡 スクレイピング中: ${source}`)
      try {
        let doc: ScrapedDocument

        if (source === 'connpass') {
          doc = await scrapeConnpass(companyId!)
        } else if (source === 'openwork') {
          doc = await scrapeOpenWork(companyId!, acceptTos)
        } else if (source === 'github') {
          doc = await scrapeGithub(companyId!)
        } else if (source === 'ir') {
          doc = await scrapeIR(companyId!)
        } else {
          console.log(`  ⚠ 未対応のソース: ${source}（スキップ）`)
          continue
        }

        docs.push(doc)
        console.log(`  ✓ 取得完了 (${doc.content.length} 文字)`)
        if (verbose) {
          console.log('  ─── スクレイプ内容 ───')
          console.log(doc.content.split('\n').map(l => '  ' + l).join('\n'))
          console.log('  ─────────────────────')
        }

        // Step 2: raw_documents に保存
        if (!dryRun) {
          console.log(`  💾 raw_documents に保存中...`)
          await insertRawDocument(doc)
          console.log(`  ✓ 保存完了`)
        } else {
          console.log(`  [dry-run] raw_documents への保存をスキップ`)
        }
      } catch (err) {
        console.error(`  ✗ ${source} エラー: ${(err as Error).message}`)
        if (!dryRun) process.exit(1)
      }
    }
  } else {
    console.log('⏭ スクレイピングをスキップ（--skip-scrape）')
    // TODO: raw_documents から既存ドキュメントを取得する実装
    console.error('--skip-scrape は未実装です')
    process.exit(1)
  }

  if (docs.length === 0) {
    console.log('\n⚠ ドキュメントが取得できませんでした。終了します。')
    process.exit(0)
  }

  // Step 3: Ollama でスコア抽出
  console.log(`\n🤖 Ollama (${process.env.OLLAMA_MODEL ?? 'gemma2'}) でスコア抽出中...`)
  const combinedContent = docs
    .map((d) => `=== ${d.source} ===\n${d.content}`)
    .join('\n\n')

  if (verbose) {
    console.log('  ─── Ollama への入力 ───')
    console.log(combinedContent.split('\n').map(l => '  ' + l).join('\n'))
    console.log('  ──────────────────────')
  }

  let scores
  try {
    scores = await extractScores(combinedContent)
    console.log('  ✓ 抽出完了')
    const extracted = Object.entries(scores).filter(([, v]) => v !== null)
    if (extracted.length === 0) {
      console.log('  ⚠ 抽出値なし（ソースデータが不十分か、Ollamaモデルが対応していない可能性があります）')
    } else {
      console.log('  抽出結果:')
      for (const [k, v] of extracted) console.log(`    ${k}: ${JSON.stringify(v)}`)
    }
  } catch (err) {
    console.error(`  ✗ Ollama エラー: ${(err as Error).message}`)
    process.exit(1)
  }

  // Step 4: companies テーブルを upsert
  if (!dryRun) {
    console.log(`\n📝 companies テーブルを更新中...`)
    try {
      await upsertCompanyScores(companyId!, scores)
      console.log('  ✓ 更新完了')
    } catch (err) {
      console.error(`  ✗ DB更新エラー: ${(err as Error).message}`)
      process.exit(1)
    }
  } else {
    console.log('\n[dry-run] companies テーブルへの書き込みをスキップ')
  }

  console.log('\n✅ パイプライン完了\n')
}

main().catch((err) => {
  console.error('予期しないエラー:', err)
  process.exit(1)
})
