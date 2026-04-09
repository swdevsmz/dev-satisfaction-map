#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runPipeline } from '../pipeline/run.js'

async function loadPipelineEnv() {
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
    // pipeline.env が無くても環境変数で動く
  }
}

async function fetchCompanyIds(): Promise<string[]> {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です')
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/companies?select=id&order=name`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  })

  if (!res.ok) {
    throw new Error(`companies の取得に失敗しました: ${res.status} ${res.statusText}`)
  }

  const rows = (await res.json()) as Array<{ id?: string }>
  return rows.map((row) => row.id).filter((id): id is string => typeof id === 'string' && id.length > 0)
}

async function main() {
  await loadPipelineEnv()

  const sources = ['github', 'connpass', 'openwork', 'ir'] as const
  const companyIds = await fetchCompanyIds()

  console.log(`対象企業数: ${companyIds.length}`)
  console.log(`対象ソース: ${sources.join(', ')}`)
  console.log(`Ollamaモデル: ${process.env.OLLAMA_MODEL ?? 'gemma2'}`)
  console.log('')

  for (const [index, companyId] of companyIds.entries()) {
    console.log(`[${index + 1}/${companyIds.length}] ${companyId}`)
    try {
      await runPipeline({
        companyId,
        sources: [...sources],
        acceptTos: true,
      })
    } catch (error) {
      console.error(`  ✗ ${companyId}: ${(error as Error).message}`)
    }

    if (index < companyIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
