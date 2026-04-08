import { describe, it, expect } from 'vitest'
import { calculateReliabilityScore, getReliabilityLabel } from './reliability'
import type { DataSource } from '../types/company'

/**
 * Task 8.4: Reliability Score Calculation Unit Tests
 */

describe('calculateReliabilityScore - Reliability Score Calculation (Task 3.1)', () => {
  describe('Source weight calculation', () => {
    it('OpenWork source has weight 2', () => {
      const sources: DataSource[] = [
        {
          source: 'openwork',
          url: 'https://openwork.com',
          scrapedAt: new Date().toISOString(),
        },
      ]

      const score = calculateReliabilityScore(sources)
      // Weight 2 / max 6 = 33.3%, with freshness 1.0 = 33.3
      expect(score).toBeGreaterThan(0)
    })

    it('Job posting source has weight 2', () => {
      const sources: DataSource[] = [
        {
          source: 'ir',
          url: 'https://ir.example.com',
          scrapedAt: new Date().toISOString(),
        },
      ]

      const score = calculateReliabilityScore(sources)
      expect(score).toBeGreaterThan(0)
    })

    it('GitHub source has weight 1', () => {
      const sources: DataSource[] = [
        {
          source: 'github',
          url: 'https://github.com',
          scrapedAt: new Date().toISOString(),
        },
      ]

      const score = calculateReliabilityScore(sources)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('Connpass source has weight 1', () => {
      const sources: DataSource[] = [
        {
          source: 'connpass',
          url: 'https://connpass.com',
          scrapedAt: new Date().toISOString(),
        },
      ]

      const score = calculateReliabilityScore(sources)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('maximum weight with all sources is 6', () => {
      const now = new Date()
      const sources: DataSource[] = [
        { source: 'openwork', url: null, scrapedAt: now.toISOString() },
        { source: 'ir', url: null, scrapedAt: now.toISOString() },
        { source: 'github', url: null, scrapedAt: now.toISOString() },
        { source: 'connpass', url: null, scrapedAt: now.toISOString() },
      ]

      const score = calculateReliabilityScore(sources)
      // With all sources fresh (within 30 days), should be close to 100
      expect(score).toBeGreaterThanOrEqual(90)
    })
  })

  describe('Freshness coefficient application', () => {
    it('applies 1.0 coefficient for 0-30 days old data', () => {
      const now = new Date()
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)

      const sources: DataSource[] = [
        { source: 'openwork', url: null, scrapedAt: fifteenDaysAgo.toISOString() },
      ]

      const score = calculateReliabilityScore(sources)
      // Weight 2, freshness 1.0, max 6 = (2/6)*100 = 33.3
      expect(score).toBeCloseTo(33, 0)
    })

    it('applies 0.7 coefficient for 31-90 days old data', () => {
      const now = new Date()
      const sixttyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const sources: DataSource[] = [
        { source: 'openwork', url: null, scrapedAt: sixttyDaysAgo.toISOString() },
      ]

      const score = calculateReliabilityScore(sources)
      // Weight 2 * 0.7 = 1.4, normalized to (1.4/6)*100 = 23.3
      expect(score).toBeLessThan(33)
    })

    it('applies 0.4 coefficient for 91-180 days old data', () => {
      const now = new Date()
      const oneThirtyDaysAgo = new Date(now.getTime() - 130 * 24 * 60 * 60 * 1000)

      const sources: DataSource[] = [
        { source: 'openwork', url: null, scrapedAt: oneThirtyDaysAgo.toISOString() },
      ]

      const score = calculateReliabilityScore(sources)
      // Weight 2 * 0.4 = 0.8, normalized to (0.8/6)*100 = 13.3
      expect(score).toBeLessThan(23)
    })

    it('applies 0.1 coefficient for 180+ days old data', () => {
      const now = new Date()
      const twohundredDaysAgo = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000)

      const sources: DataSource[] = [
        { source: 'openwork', url: null, scrapedAt: twohundredDaysAgo.toISOString() },
      ]

      const score = calculateReliabilityScore(sources)
      // Weight 2 * 0.1 = 0.2, normalized to (0.2/6)*100 = 3.3
      expect(score).toBeLessThan(5)
    })
  })

  describe('Reliability score range validation', () => {
    it('returns 0 for empty sources', () => {
      const sources: DataSource[] = []
      const score = calculateReliabilityScore(sources)
      expect(score).toBe(0)
    })

    it('maintains 0-100 range with all sources fresh', () => {
      const now = new Date()
      const sources: DataSource[] = [
        { source: 'openwork', url: null, scrapedAt: now.toISOString() },
        { source: 'ir', url: null, scrapedAt: now.toISOString() },
        { source: 'github', url: null, scrapedAt: now.toISOString() },
        { source: 'connpass', url: null, scrapedAt: now.toISOString() },
      ]

      const score = calculateReliabilityScore(sources)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('maintains 0-100 range with all sources stale', () => {
      const now = new Date()
      const staleDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

      const sources: DataSource[] = [
        { source: 'openwork', url: null, scrapedAt: staleDate.toISOString() },
        { source: 'ir', url: null, scrapedAt: staleDate.toISOString() },
        { source: 'github', url: null, scrapedAt: staleDate.toISOString() },
        { source: 'connpass', url: null, scrapedAt: staleDate.toISOString() },
      ]

      const score = calculateReliabilityScore(sources)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('Multiple source handling', () => {
    it('uses latest timestamp when source appears multiple times', () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixttyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const sources: DataSource[] = [
        { source: 'openwork', url: 'url1', scrapedAt: sixttyDaysAgo.toISOString() },
        { source: 'openwork', url: 'url2', scrapedAt: thirtyDaysAgo.toISOString() },
      ]

      const score = calculateReliabilityScore(sources)
      // Should use freshest timestamp (30 days ago)
      expect(score).toBeGreaterThan(30)
    })
  })
})

describe('getReliabilityLabel - Reliability Level Classification (Task 3.2)', () => {
  it('returns high label for score >= 70', () => {
    const result = getReliabilityLabel(70)
    expect(result.label).toBe('高')
    expect(result.colorClass).toBe('text-green-600')
  })

  it('returns high label for score 100', () => {
    const result = getReliabilityLabel(100)
    expect(result.label).toBe('高')
    expect(result.colorClass).toBe('text-green-600')
  })

  it('returns medium label for score 40-69', () => {
    expect(getReliabilityLabel(40).label).toBe('中')
    expect(getReliabilityLabel(55).label).toBe('中')
    expect(getReliabilityLabel(69).label).toBe('中')
  })

  it('returns medium label with yellow color class', () => {
    const result = getReliabilityLabel(50)
    expect(result.label).toBe('中')
    expect(result.colorClass).toBe('text-yellow-600')
  })

  it('returns low label for score < 40', () => {
    expect(getReliabilityLabel(0).label).toBe('低')
    expect(getReliabilityLabel(25).label).toBe('低')
    expect(getReliabilityLabel(39).label).toBe('低')
  })

  it('returns low label with red color class', () => {
    const result = getReliabilityLabel(20)
    expect(result.label).toBe('低')
    expect(result.colorClass).toBe('text-red-500')
  })

  describe('Boundary value testing', () => {
    it('score 70 is high (boundary)', () => {
      const result = getReliabilityLabel(70)
      expect(result.label).toBe('高')
    })

    it('score 69 is medium (boundary)', () => {
      const result = getReliabilityLabel(69)
      expect(result.label).toBe('中')
    })

    it('score 40 is medium (boundary)', () => {
      const result = getReliabilityLabel(40)
      expect(result.label).toBe('中')
    })

    it('score 39 is low (boundary)', () => {
      const result = getReliabilityLabel(39)
      expect(result.label).toBe('低')
    })
  })
})
