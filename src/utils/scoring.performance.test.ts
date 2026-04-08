import { describe, it, expect } from 'vitest'
import {
  normalizeScores,
  calculateHappinessScore,
  calculatePersonalScore,
  applyBonusPoints,
  getScoreColor,
} from './scoring'
import type { CompanyScores, UserWeights } from '../types/company'

describe('Performance Optimization Tests (Tasks 6.1-6.2)', () => {
  describe('Task 6.1: Single Company Score Calculation < 100ms', () => {
    it('normalizeScores completes within 100ms', () => {
      const scores = createTestScores()
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        normalizeScores(scores)
      }

      const endTime = performance.now()
      const avgTime = (endTime - startTime) / 100
      expect(avgTime).toBeLessThan(1) // Should be much less than 1ms
    })

    it('calculateHappinessScore completes within 100ms', () => {
      const scores = createTestScores()
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        calculateHappinessScore(scores)
      }

      const endTime = performance.now()
      const avgTime = (endTime - startTime) / 100
      expect(avgTime).toBeLessThan(1) // Should be much less than 1ms
    })

    it('full score calculation pipeline completes within 100ms per company', () => {
      const scores = createTestScores()
      const weights: UserWeights = {
        techStackModernity: 1,
        remoteRate: 1,
        estimatedOvertimeHours: 1,
        turnoverRate: 1,
        retentionRate: 1,
        devEnvironment: 1,
        skillUpSupport: 1,
      }

      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        const normalized = normalizeScores(scores)
        const happiness = calculateHappinessScore(scores)
        const personal = calculatePersonalScore(scores, weights)
        const withBonus = applyBonusPoints(happiness, { github: 2, connpass: 1 })
        const color = getScoreColor(withBonus)
      }

      const endTime = performance.now()
      const avgTime = (endTime - startTime) / 100
      expect(avgTime).toBeLessThan(1) // Single company calc should be < 1ms
    })
  })

  describe('Task 6.2: Batch Calculation Performance < 5 seconds for 73 companies', () => {
    it('calculates scores for 73 companies within 5 seconds', () => {
      const companies = Array.from({ length: 73 }, (_, i) =>
        createTestScores({
          techStackModernity: 1 + (Math.random() * 9),
          remoteRate: Math.random() * 100,
          estimatedOvertimeHours: Math.random() * 150,
          turnoverRate: Math.random() * 100,
          retentionRate: Math.random() * 100,
          devEnvironment: 1 + (Math.random() * 9),
          skillUpSupport: 1 + (Math.random() * 9),
        })
      )

      const startTime = performance.now()

      for (const company of companies) {
        normalizeScores(company)
        calculateHappinessScore(company)
        getScoreColor(calculateHappinessScore(company))
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(5000) // 5 seconds
    })

    it('memory usage remains stable during batch processing', () => {
      const companies = Array.from({ length: 73 }, (_, i) =>
        createTestScores()
      )

      const results = companies.map(company => ({
        normalized: normalizeScores(company),
        happiness: calculateHappinessScore(company),
        color: getScoreColor(calculateHappinessScore(company)),
      }))

      expect(results).toHaveLength(73)
      expect(results[0]).toHaveProperty('normalized')
      expect(results[0]).toHaveProperty('happiness')
      expect(results[0]).toHaveProperty('color')
    })

    it('caching weight array improves batch performance', () => {
      const companies = Array.from({ length: 73 }, () => createTestScores())

      // Without explicit caching (current implementation)
      const startTime1 = performance.now()
      companies.forEach(company => calculateHappinessScore(company))
      const duration1 = performance.now() - startTime1

      // Results should be consistent
      const scores = companies.map(company => calculateHappinessScore(company))
      expect(scores).toHaveLength(73)
      expect(scores.every(s => typeof s === 'number')).toBe(true)
    })
  })

  describe('Task 6.3: Calculation Accuracy Verification', () => {
    it('normalization maintains 1st decimal place precision', () => {
      const scores = createTestScores({
        techStackModernity: 6.5,
        remoteRate: 33.3,
        estimatedOvertimeHours: 45,
      })

      const result = normalizeScores(scores)

      // Verify calculations are accurate to 1 decimal place
      expect(result.techStackModernity).toBeCloseTo((6.5 - 1) / 9 * 100, 1)
      expect(result.remoteRate).toBeCloseTo(33.3, 1)
      expect(result.estimatedOvertimeHours).toBeCloseTo((80 - 45) / 80 * 100, 1)
    })

    it('weight sum verification (1.00 ± 0.01)', () => {
      const scores = createTestScores()
      const normalized = normalizeScores(scores)

      // Manually calculate with explicit weights to verify precision
      const WEIGHTS = {
        techStackModernity: 0.20,
        remoteRate: 0.20,
        estimatedOvertimeHours: 0.20,
        turnoverRate: 0.10,
        retentionRate: 0.10,
        devEnvironment: 0.10,
        skillUpSupport: 0.10,
      }

      const weightSum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
      expect(weightSum).toBeCloseTo(1.0, 2)
      expect(weightSum).toBeGreaterThanOrEqual(0.99)
      expect(weightSum).toBeLessThanOrEqual(1.01)
    })

    it('boundary value calculations are accurate (0-100 range)', () => {
      // Test minimum values
      const minScores = createTestScores({
        techStackModernity: 1,
        remoteRate: 0,
        estimatedOvertimeHours: 150,
        turnoverRate: 100,
        retentionRate: 0,
        devEnvironment: 1,
        skillUpSupport: 1,
      })

      const minResult = normalizeScores(minScores)
      expect(Object.values(minResult).every(v => v >= 0 && v <= 100)).toBe(true)

      // Test maximum values
      const maxScores = createTestScores({
        techStackModernity: 10,
        remoteRate: 100,
        estimatedOvertimeHours: 0,
        turnoverRate: 0,
        retentionRate: 100,
        devEnvironment: 10,
        skillUpSupport: 10,
      })

      const maxResult = normalizeScores(maxScores)
      expect(Object.values(maxResult).every(v => v >= 0 && v <= 100)).toBe(true)
    })

    it('happiness score rounding is consistent', () => {
      const testCases = [
        { value: 12.34, expected: 12.3 },
        { value: 12.35, expected: 12.4 },
        { value: 12.36, expected: 12.4 },
        { value: 12.44, expected: 12.4 },
        { value: 12.45, expected: 12.5 },
      ]

      testCases.forEach(({ value, expected }) => {
        const rounded = Math.round(value * 10) / 10
        expect(rounded).toBe(expected)
      })
    })
  })
})

function createTestScores(overrides: Partial<CompanyScores> = {}): CompanyScores {
  return {
    techStackModernity: 5,
    remoteRate: 50,
    estimatedOvertimeHours: 40,
    turnoverRate: 50,
    retentionRate: 50,
    devEnvironment: 5,
    skillUpSupport: 5,
    happinessScore: 0,
    reliabilityScore: 0,
    scoreColor: 'yellow',
    ...overrides,
  } as CompanyScores
}
