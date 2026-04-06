#!/usr/bin/env node
/**
 * descriptionが空の企業にOllamaで日本語説明文を自動生成・補完するメンテナンススクリプト
 *
 * Usage:
 *   npx tsx pipeline/maintenance/fill-descriptions.ts
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

import { getSupabase } from '../db/client.js'

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma2'

async function generateDescription(
  name: string,
  industry: string,
  location: string,
  tags: string[]
): Promise<string | null> {
  const prompt = `以下の企業情報から、エンジニア採用サイト向けの企業紹介文を日本語で1〜2文（50〜100文字）で生成してください。
文章のみ返してください。

企業名: ${name}
業種: ${industry}
所在地: ${location}
技術タグ: ${tags.join(', ')}`

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.7 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const description: string = (data.response ?? '').trim()

  return description.length > 0 ? description : null
}

async function main() {
  console.log('企業description補完スクリプト開始')
  console.log(`Ollama: ${OLLAMA_HOST} / モデル: ${OLLAMA_MODEL}`)
  console.log()

  const supabase = getSupabase()

  // descriptionが空の企業を全件取得
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, industry, location, tags')
    .eq('description', '')

  if (error) {
    console.error('Supabase取得エラー:', error.message)
    process.exit(1)
  }

  if (!companies || companies.length === 0) {
    console.log('descriptionが空の企業はありませんでした。')
    return
  }

  console.log(`descriptionが空の企業: ${companies.length}社`)
  console.log()

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    const { id, name, industry, location, tags } = company

    console.log(`[${i + 1}/${companies.length}] ${name} (${id}) を処理中...`)

    try {
      const description = await generateDescription(
        name ?? '',
        industry ?? '',
        location ?? '',
        Array.isArray(tags) ? tags : []
      )

      if (!description) {
        console.log(`  スキップ: Ollamaが空のレスポンスを返しました`)
        failCount++
        continue
      }

      console.log(`  生成された説明文: ${description}`)

      const { error: updateError } = await supabase
        .from('companies')
        .update({ description })
        .eq('id', id)

      if (updateError) {
        console.error(`  更新エラー: ${updateError.message}`)
        failCount++
      } else {
        console.log(`  更新完了`)
        successCount++
      }
    } catch (err) {
      console.error(`  エラー: ${(err as Error).message}`)
      failCount++
    }

    console.log()
  }

  console.log('── 処理完了 ────────────────────────────────────')
  console.log(`成功: ${successCount}社 / 失敗・スキップ: ${failCount}社 / 合計: ${companies.length}社`)
}

main().catch((err) => {
  console.error('予期しないエラー:', err)
  process.exit(1)
})
