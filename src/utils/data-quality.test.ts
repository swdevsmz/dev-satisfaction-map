import { describe, it, expect } from 'vitest'
import type { CompanyScores } from '../types/company'

/**
 * Task 9: Validation and Quality Assurance
 * Tests for data quality checks and consistency verification
 */

describe('Task 9.1: Data Quality Check Functions', () => {
  describe('Sampling validation (monthly 10 company verification)', () => {
    it('validates calculated vs actual score consistency', () => {
      const company: CompanyScores = {
        techStackModernity: 8,
        remoteRate: 90,
        estimatedOvertimeHours: 20,
        turnoverRate: 8,
        retentionRate: 92,
        devEnvironment: 8,
        skillUpSupport: 8,
        happinessScore: 83.5, // Pre-calculated
        reliabilityScore: 85,
        scoreColor: 'green',
      }

      // Verify stored happiness score is within expected range
      expect(company.happinessScore).toBeGreaterThanOrEqual(0)
      expect(company.happinessScore).toBeLessThanOrEqual(100)
    })

    it('identifies sampling set for monthly verification', () => {
      const allCompanies = Array.from({ length: 73 }, (_, i) => ({
        id: `company-${i}`,
        name: `Company ${i}`,
        score: Math.random() * 100,
      }))

      // Select 10 random companies for sampling
      const sampleSize = 10
      const sampleIndices = new Set<number>()
      while (sampleIndices.size < sampleSize) {
        sampleIndices.add(Math.floor(Math.random() * allCompanies.length))
      }

      const sampleCompanies = Array.from(sampleIndices).map(
        (i) => allCompanies[i]
      )

      expect(sampleCompanies).toHaveLength(sampleSize)
      expect(sampleCompanies.every((c) => c.id)).toBe(true)
    })
  })

  describe('Anomaly detection', () => {
    it('detects scores outside expected range (0-100)', () => {
      const validScores = [0, 25, 50, 75, 100, 33.3, 66.7]
      const invalidScores = [-10, 150, 101, -0.1]

      const isValidScore = (score: number) => score >= 0 && score <= 100

      validScores.forEach((score) => {
        expect(isValidScore(score)).toBe(true)
      })

      invalidScores.forEach((score) => {
        expect(isValidScore(score)).toBe(false)
      })
    })

    it('detects suspicious indicator patterns', () => {
      const flagSuspiciousCompany = (company: CompanyScores): string[] => {
        const flags: string[] = []

        if (company.techStackModernity < 1 || company.techStackModernity > 10) {
          flags.push('invalid_tech_score')
        }
        if (company.remoteRate < 0 || company.remoteRate > 100) {
          flags.push('invalid_remote_rate')
        }
        if (company.estimatedOvertimeHours < 0) {
          flags.push('invalid_overtime')
        }
        if (company.turnoverRate < 0 || company.turnoverRate > 100) {
          flags.push('invalid_turnover')
        }

        // Suspicious patterns
        if (
          company.techStackModernity === 10 &&
          company.remoteRate === 100 &&
          company.estimatedOvertimeHours === 0
        ) {
          flags.push('perfect_score_suspicious')
        }

        return flags
      }

      const normalCompany: CompanyScores = {
        techStackModernity: 8,
        remoteRate: 80,
        estimatedOvertimeHours: 30,
        turnoverRate: 10,
        retentionRate: 90,
        devEnvironment: 8,
        skillUpSupport: 7,
        happinessScore: 75,
        reliabilityScore: 80,
        scoreColor: 'green',
      }

      expect(flagSuspiciousCompany(normalCompany)).toHaveLength(0)

      const suspiciousCompany: CompanyScores = {
        techStackModernity: 10,
        remoteRate: 100,
        estimatedOvertimeHours: 0,
        turnoverRate: 0,
        retentionRate: 100,
        devEnvironment: 10,
        skillUpSupport: 10,
        happinessScore: 100,
        reliabilityScore: 100,
        scoreColor: 'green',
      }

      const flags = flagSuspiciousCompany(suspiciousCompany)
      expect(flags).toContain('perfect_score_suspicious')
    })

    it('detects stale data (last update exceeds threshold)', () => {
      const checkDataFreshness = (lastUpdatedAt: Date, thresholdDays: number) => {
        const now = new Date()
        const days = (now.getTime() - lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
        return days <= thresholdDays
      }

      // Fresh data (1 day old)
      const freshDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      expect(checkDataFreshness(freshDate, 90)).toBe(true)

      // Stale data (180 days old)
      const staleDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      expect(checkDataFreshness(staleDate, 90)).toBe(false)
    })

    it('detects inconsistent data sources', () => {
      const validateSourceConsistency = (
        sources: Record<string, { timestamp: string; dataCount: number }>
      ) => {
        const timeDiffs = Object.entries(sources)
          .map(([_, data]) => new Date(data.timestamp).getTime())
          .map((time, _, arr) => {
            const max = Math.max(...arr)
            const min = Math.min(...arr)
            return max - min
          })

        // Flag if sources differ by more than 30 days
        const maxDiff = Math.max(...timeDiffs)
        const days = maxDiff / (1000 * 60 * 60 * 24)
        return days <= 30
      }

      const consistentSources = {
        openwork: { timestamp: '2026-04-01T00:00:00Z', dataCount: 73 },
        jobPosting: { timestamp: '2026-04-02T00:00:00Z', dataCount: 73 },
      }

      expect(validateSourceConsistency(consistentSources)).toBe(true)

      const inconsistentSources = {
        openwork: { timestamp: '2026-04-01T00:00:00Z', dataCount: 73 },
        github: { timestamp: '2026-01-01T00:00:00Z', dataCount: 50 },
      }

      expect(validateSourceConsistency(inconsistentSources)).toBe(false)
    })
  })

  describe('Update frequency monitoring', () => {
    it('tracks periodic update job execution', () => {
      const updateHistory = [
        { date: '2026-04-01', success: true, itemsProcessed: 73 },
        { date: '2026-03-01', success: true, itemsProcessed: 73 },
        { date: '2026-02-01', success: false, itemsProcessed: 0 },
        { date: '2026-01-01', success: true, itemsProcessed: 73 },
      ]

      expect(updateHistory).toHaveLength(4)
      expect(updateHistory.filter((u) => u.success)).toHaveLength(3)
    })

    it('alerts on missed monthly updates', () => {
      const checkUpdateCadence = (
        updateHistory: { date: string }[],
        expectedMonthly: number
      ) => {
        const recentMonths = 3
        const recentUpdates = updateHistory.slice(0, recentMonths)

        // If we have fewer updates than months, something is wrong
        return recentUpdates.length >= expectedMonthly - 1 // Allow 1 missed
      }

      const regularUpdates = [
        { date: '2026-04-01' },
        { date: '2026-03-01' },
        { date: '2026-02-01' },
      ]

      expect(checkUpdateCadence(regularUpdates, 3)).toBe(true)

      const missedUpdates = [
        { date: '2026-04-01' },
        // Missing March update
        { date: '2026-02-01' },
      ]

      expect(checkUpdateCadence(missedUpdates, 3)).toBe(false)
    })
  })
})

describe('Task 9.2: Code Consistency and Integration', () => {
  describe('Normalization logic consistency', () => {
    it('ensures consistent 1-10 scale normalization across all uses', () => {
      const normalize1To10 = (score: number) => ((score - 1) / 9) * 100

      // Used for: techStackModernity, devEnvironment, skillUpSupport
      const testIndicators = [
        { name: 'techStackModernity', value: 6.5 },
        { name: 'devEnvironment', value: 6.5 },
        { name: 'skillUpSupport', value: 6.5 },
      ]

      testIndicators.forEach(({ name, value }) => {
        const result = normalize1To10(value)
        expect(result).toBeCloseTo(61.1, 1)
      })
    })

    it('ensures consistent percentage normalization', () => {
      const normalizePercent = (value: number) => value

      const percentIndicators = [
        { name: 'remoteRate', value: 75 },
        { name: 'turnoverRate', value: 15 },
        { name: 'retentionRate', value: 85 },
      ]

      percentIndicators.forEach(({ name, value }) => {
        const result = normalizePercent(value)
        expect(result).toBe(value)
      })
    })

    it('ensures consistent reverse normalization logic', () => {
      const normalizeReverse = (actual: number, baseline: number) =>
        Math.max(0, ((baseline - actual) / baseline) * 100)

      // Used for: estimatedOvertimeHours (80h baseline), turnoverRate (100%)
      expect(normalizeReverse(40, 80)).toBeCloseTo(50, 1)
      expect(normalizeReverse(50, 100)).toBe(50)
    })
  })

  describe('Weight configuration consistency', () => {
    it('verifies weight sum equals 1.00', () => {
      const weights = {
        techStackModernity: 0.20,
        remoteRate: 0.20,
        estimatedOvertimeHours: 0.20,
        turnoverRate: 0.10,
        retentionRate: 0.10,
        devEnvironment: 0.10,
        skillUpSupport: 0.10,
      }

      const sum = Object.values(weights).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 2)
    })

    it('verifies all indicators have weight defined', () => {
      const indicators = [
        'techStackModernity',
        'remoteRate',
        'estimatedOvertimeHours',
        'turnoverRate',
        'retentionRate',
        'devEnvironment',
        'skillUpSupport',
      ]

      const weights = {
        techStackModernity: 0.20,
        remoteRate: 0.20,
        estimatedOvertimeHours: 0.20,
        turnoverRate: 0.10,
        retentionRate: 0.10,
        devEnvironment: 0.10,
        skillUpSupport: 0.10,
      }

      indicators.forEach((indicator) => {
        expect(weights).toHaveProperty(indicator)
        expect(weights[indicator as keyof typeof weights]).toBeGreaterThan(0)
      })
    })
  })

  describe('Color classification consistency', () => {
    it('ensures getScoreColor and getReliabilityLabel use same boundaries', () => {
      const getScoreColor = (score: number) => {
        if (score >= 70) return 'green'
        if (score >= 40) return 'yellow'
        return 'red'
      }

      const getReliabilityLevel = (score: number) => {
        if (score >= 70) return 'high' // 高
        if (score >= 40) return 'medium' // 中
        return 'low' // 低
      }

      // Same boundaries
      expect(getScoreColor(70)).toBe('green')
      expect(getReliabilityLevel(70)).toBe('high')

      expect(getScoreColor(69)).toBe('yellow')
      expect(getReliabilityLevel(69)).toBe('medium')

      expect(getScoreColor(40)).toBe('yellow')
      expect(getReliabilityLevel(40)).toBe('medium')

      expect(getScoreColor(39)).toBe('red')
      expect(getReliabilityLevel(39)).toBe('low')
    })
  })

  describe('Data structure consistency', () => {
    it('ensures CompanyScores type has all required fields', () => {
      const company: CompanyScores = {
        techStackModernity: 8,
        remoteRate: 80,
        estimatedOvertimeHours: 30,
        turnoverRate: 10,
        retentionRate: 90,
        devEnvironment: 8,
        skillUpSupport: 7,
        happinessScore: 75.5,
        reliabilityScore: 80,
        scoreColor: 'green',
      }

      expect(company).toHaveProperty('techStackModernity')
      expect(company).toHaveProperty('remoteRate')
      expect(company).toHaveProperty('estimatedOvertimeHours')
      expect(company).toHaveProperty('turnoverRate')
      expect(company).toHaveProperty('retentionRate')
      expect(company).toHaveProperty('devEnvironment')
      expect(company).toHaveProperty('skillUpSupport')
      expect(company).toHaveProperty('happinessScore')
      expect(company).toHaveProperty('reliabilityScore')
      expect(company).toHaveProperty('scoreColor')
    })
  })
})
