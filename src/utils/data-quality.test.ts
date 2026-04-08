import { describe, expect, it } from 'vitest'
import { rowToCompanyScores } from '../lib/data-transform'
import { getScoreColor, normalizeScores, WEIGHTS } from './scoring'

describe('data quality and consistency (Task 8.6/8.7/9)', () => {
    it('rowToCompanyScores produces bounded score values', () => {
        const scores = rowToCompanyScores({
            company_id: 'sample',
            tech_stack_modernity: 7,
            remote_rate: 70,
            estimated_overtime_hours: 20,
            turnover_rate: 10,
            retention_rate: 90,
            dev_environment: 8,
            skill_up_support: 8,
            github_activity_bonus: 2,
            connpass_bonus: 3,
            data_source_flags: {
                openwork: true,
                job_posting: true,
                github: true,
                connpass: true,
            },
            scored_at: '2026-04-01T00:00:00.000Z',
            last_openwork_sync: '2026-04-01T00:00:00.000Z',
            last_job_posting_sync: '2026-04-01T00:00:00.000Z',
            last_github_sync: '2026-04-01T00:00:00.000Z',
            last_connpass_sync: '2026-04-01T00:00:00.000Z',
        })

        expect(scores.happinessScore).toBeGreaterThanOrEqual(0)
        expect(scores.happinessScore).toBeLessThanOrEqual(100)
        expect(scores.reliabilityScore).toBeGreaterThanOrEqual(0)
        expect(scores.reliabilityScore).toBeLessThanOrEqual(100)
    })

    it('uses default values when nullable score columns are missing', () => {
        const scores = rowToCompanyScores({
            company_id: 'missing',
            remote_rate: null,
            estimated_overtime_hours: null,
            turnover_rate: null,
            retention_rate: null,
        })

        expect(scores.remoteRate).toBe(50)
        expect(scores.estimatedOvertimeHours).toBe(30)
        expect(scores.turnoverRate).toBe(15)
        expect(scores.retentionRate).toBe(85)
    })

    it('keeps scoring color threshold consistency', () => {
        expect(getScoreColor(70)).toBe('green')
        expect(getScoreColor(69.9)).toBe('yellow')
        expect(getScoreColor(40)).toBe('yellow')
        expect(getScoreColor(39.9)).toBe('red')
    })

    it('keeps normalized score fields in 0-100 range for valid inputs', () => {
        const normalized = normalizeScores({
            techStackModernity: 8,
            remoteRate: 80,
            estimatedOvertimeHours: 20,
            turnoverRate: 10,
            retentionRate: 90,
            devEnvironment: 8,
            skillUpSupport: 8,
            happinessScore: 0,
            reliabilityScore: 0,
            scoreColor: 'yellow',
        })

        for (const value of Object.values(normalized)) {
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThanOrEqual(100)
        }
    })

    it('maintains total scoring weight around 1.0', () => {
        const total = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0)
        expect(total).toBeGreaterThanOrEqual(0.99)
        expect(total).toBeLessThanOrEqual(1.01)
    })
})
