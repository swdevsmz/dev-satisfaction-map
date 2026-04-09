#!/usr/bin/env node

import { runPipeline } from '../pipeline/run.js'

const TARGET_COMPANIES = ['mercari-jp', 'smarthr', 'cyberagent', 'freee', 'rakuten-tech']
const SOURCES = ['github', 'connpass', 'openwork', 'ir'] as const

async function main() {
  console.log(`対象企業数: ${TARGET_COMPANIES.length}`)
  console.log(`対象ソース: ${SOURCES.join(', ')}`)
  console.log('')

  for (const [index, companyId] of TARGET_COMPANIES.entries()) {
    console.log(`[${index + 1}/${TARGET_COMPANIES.length}] ${companyId}`)
    try {
      await runPipeline({
        companyId,
        sources: [...SOURCES],
        acceptTos: true,
      })
    } catch (error) {
      console.error(`  ✗ ${companyId}: ${(error as Error).message}`)
    }

    if (index < TARGET_COMPANIES.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
