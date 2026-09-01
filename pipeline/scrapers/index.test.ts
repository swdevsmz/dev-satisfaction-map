import { describe, expect, it, vi } from 'vitest'
import { createScraperRegistry, scrapeFromRegistry } from './index.js'
import type { ScraperDefinition } from './index.js'

describe('scraper extension contract', () => {
  it('registers every built-in source with a callable scraper', () => {
    const registry = createScraperRegistry(true)
    expect(Object.keys(registry).sort()).toEqual(['connpass', 'github', 'ir', 'openwork'])
    for (const definition of Object.values(registry)) expect(typeof definition.scrape).toBe('function')
  })

  it('accepts an adapter that returns the required document shape', async () => {
    const adapter: ScraperDefinition = {
      source: 'github',
      description: 'Example adapter',
      scrape: vi.fn(async (companyId) => ({
        companyId,
        source: 'github',
        url: null,
        content: 'example',
      })),
    }
    await expect(scrapeFromRegistry(adapter, 'example-company')).resolves.toMatchObject({
      companyId: 'example-company',
      source: 'github',
    })
  })

  it('rejects adapters that omit required output fields', async () => {
    const adapter: ScraperDefinition = {
      source: 'github',
      description: 'Broken adapter',
      scrape: vi.fn(async () => ({ companyId: '', source: 'github', url: null, content: '' })),
    }
    await expect(scrapeFromRegistry(adapter, 'example-company')).rejects.toThrow('invalid companyId')
  })
})
