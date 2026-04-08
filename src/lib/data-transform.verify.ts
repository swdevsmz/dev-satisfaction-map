import { rowToCompanyScores, rowsToCompanyScores } from './data-transform'

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message)
}

type TransformRow = Parameters<typeof rowToCompanyScores>[0]

function makeRow(overrides: Partial<TransformRow> = {}): TransformRow {
    return {
        company_id: 'acme',
        tech_stack_modernity: 8,
        remote_rate: 70,
        estimated_overtime_hours: 20,
        turnover_rate: 10,
        retention_rate: 90,
        dev_environment: 7,
        skill_up_support: 7,
        github_activity_bonus: 0,
        connpass_bonus: 0,
        data_source_flags: {
            openwork: true,
            job_posting: true,
            github: true,
            connpass: false,
        },
        scored_at: '2026-01-01T00:00:00.000Z',
        last_openwork_sync: '2026-01-01T00:00:00.000Z',
        last_job_posting_sync: '2026-01-01T00:00:00.000Z',
        last_github_sync: '2026-01-01T00:00:00.000Z',
        last_connpass_sync: null,
        ...overrides,
    }
}

export function runDataTransformVerification() {
    const cases: Array<() => boolean> = [
        () => rowToCompanyScores(makeRow()).happinessScore >= 0,
        () => rowToCompanyScores(makeRow()).happinessScore <= 100,
        () => rowToCompanyScores(makeRow({ remote_rate: null })).remoteRate === 50,
        () => rowToCompanyScores(makeRow({ estimated_overtime_hours: null })).estimatedOvertimeHours === 30,
        () => rowToCompanyScores(makeRow({ turnover_rate: null })).turnoverRate === 15,
        () => rowToCompanyScores(makeRow({ retention_rate: null })).retentionRate === 85,
        () => rowToCompanyScores(makeRow({ github_activity_bonus: 20 })).happinessScore <= 100,
        () => rowsToCompanyScores([makeRow(), makeRow({ company_id: 'b' })]).length === 2,
    ]

    cases.forEach((fn, i) => assert(fn(), `data-transform case ${ i + 1 } failed`))
    return { passed: cases.length }
}
