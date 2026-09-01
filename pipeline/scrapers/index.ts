import { scrapeConnpass } from './connpass.js'
import { scrapeGithub } from './github.js'
import { scrapeIR } from './ir.js'
import { scrapeOpenWork } from './openwork.js'
import type { ScrapedDocument, Scraper } from '../types.js'

export type SourceType = ScrapedDocument['source']

export interface ScraperDefinition {
  source: SourceType
  description: string
  scrape: Scraper
}

/**
 * Build the source registry in one place so adding a source does not require
 * changing the pipeline's orchestration logic.
 */
export function createScraperRegistry(acceptTos = false): Record<SourceType, ScraperDefinition> {
  return {
    connpass: { source: 'connpass', description: 'Connpass events', scrape: scrapeConnpass },
    openwork: {
      source: 'openwork',
      description: 'OpenWork reviews (requires terms acceptance)',
      scrape: (companyId) => scrapeOpenWork(companyId, acceptTos),
    },
    github: { source: 'github', description: 'GitHub OSS activity', scrape: scrapeGithub },
    ir: { source: 'ir', description: 'Investor relations disclosures', scrape: scrapeIR },
  }
}

/**
 * Execute a registered scraper and validate the required output contract.
 */
export async function scrapeFromRegistry(
  definition: ScraperDefinition,
  companyId: string,
): Promise<ScrapedDocument> {
  const document = await definition.scrape(companyId)
  if (!document.companyId) {
    throw new Error(`${definition.source}: scraper returned an invalid companyId`)
  }
  if (document.source !== definition.source || typeof document.content !== 'string') {
    throw new Error(`${definition.source}: scraper returned an invalid document`)
  }
  return document
}
