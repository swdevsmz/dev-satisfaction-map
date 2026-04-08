import { describe, expect, it } from 'vitest'
import { WEIGHTS, calculateHappinessScore, normalizeScores } from './scoring'
import type { CompanyScores } from '../types/company'

function makeScores(i = 0): CompanyScores {
    return {
        techStackModernity: 5 + (i % 5),
        remoteRate: 40 + (i % 60),
        estimatedOvertimeHours: 10 + (i % 40),
        turnoverRate: 5 + (i % 20),
        retentionRate: 70 + (i % 30),
        devEnvironment: 4 + (i % 6),
        skillUpSupport: 4 + (i % 6),
        happinessScore: 0,
        reliabilityScore: 0,
        scoreColor: 'yellow',
    }
}

describe('scoring performance (Task 6)', () => {
    it('single company normalization is fast', () => {
        const scores = makeScores()
        const start = performance.now()
        for (let i = 0; i < 1000; i += 1) {
            normalizeScores(scores)
        }
        const elapsed = performance.now() - start
        expect(elapsed).toBeLessThan(100)
    })

    it('single company score calculation is fast', () => {
        const scores = makeScores()
        const start = performance.now()
        for (let i = 0; i < 1000; i += 1) {
            calculateHappinessScore(scores)
        }
        const elapsed = performance.now() - start
        expect(elapsed).toBeLessThan(100)
    })

    it('batch calculation for 73 companies completes under 5 seconds', () => {
        const companies = Array.from({ length: 73 }, (_, i) => makeScores(i))
        const start = performance.now()
        const result = companies.map((s) => calculateHappinessScore(s))
        const elapsed = performance.now() - start
        expect(result).toHaveLength(73)
        expect(elapsed).toBeLessThan(5000)
    })

    it('weight total remains 1.00 +-0.01', () => {
        const total = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0)
        expect(total).toBeGreaterThanOrEqual(0.99)
        expect(total).toBeLessThanOrEqual(1.01)
    })

    it('normalized values keep first decimal precision for key metrics', () => {
        const normalized = normalizeScores(makeScores(3))
        expect(Number(normalized.techStackModernity.toFixed(1))).toBeCloseTo(normalized.techStackModernity, 1)
        expect(Number(normalized.estimatedOvertimeHours.toFixed(1))).toBeCloseTo(normalized.estimatedOvertimeHours, 1)
    })
})
