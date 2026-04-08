import { describe, expect, it } from 'vitest'

interface SourcePayload {
    source: 'openwork' | 'job_posting' | 'github' | 'connpass'
    metrics: Partial<Record<string, number>>
    syncedAt: string
}

function mergeSources(payloads: SourcePayload[]) {
    const merged: Record<string, number> = {}
    const flags: Record<string, boolean> = {
        openwork: false,
        job_posting: false,
        github: false,
        connpass: false,
    }

    for (const payload of payloads) {
        flags[payload.source] = true
        for (const [k, v] of Object.entries(payload.metrics)) {
            if (typeof v === 'number') merged[k] = v
        }
    }

    return { merged, flags }
}

function nextMonthlyRun(from: Date): Date {
    const d = new Date(from)
    d.setUTCMonth(d.getUTCMonth() + 1)
    return d
}

describe('data source integration design tests (Task 7)', () => {
    it('merges values from multiple sources', () => {
        const result = mergeSources([
            {
                source: 'openwork',
                metrics: { turnoverRate: 12, retentionRate: 88 },
                syncedAt: '2026-04-01T00:00:00.000Z',
            },
            {
                source: 'job_posting',
                metrics: { remoteRate: 80 },
                syncedAt: '2026-04-01T00:00:00.000Z',
            },
        ])

        expect(result.merged.turnoverRate).toBe(12)
        expect(result.merged.remoteRate).toBe(80)
        expect(result.flags.openwork).toBe(true)
        expect(result.flags.job_posting).toBe(true)
    })

    it('tracks source flags for monthly pipeline state', () => {
        const result = mergeSources([
            { source: 'github', metrics: { techStackModernity: 7 }, syncedAt: '2026-04-01T00:00:00.000Z' },
        ])

        expect(result.flags.github).toBe(true)
        expect(result.flags.openwork).toBe(false)
    })

    it('calculates monthly schedule step', () => {
        const start = new Date('2026-04-08T00:00:00.000Z')
        const next = nextMonthlyRun(start)
        expect(next.getUTCMonth()).toBe(4)
        expect(next.getUTCFullYear()).toBe(2026)
    })

    it('keeps extensibility for new metric keys', () => {
        const result = mergeSources([
            {
                source: 'connpass',
                metrics: { eventDensity: 4.2, skillUpSupport: 8 },
                syncedAt: '2026-04-01T00:00:00.000Z',
            },
        ])

        expect(result.merged.eventDensity).toBe(4.2)
        expect(result.merged.skillUpSupport).toBe(8)
    })
})
