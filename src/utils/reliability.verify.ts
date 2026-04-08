import { calculateReliabilityScore, formatRelativeDate, getReliabilityLabel } from './reliability'

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message)
}

function daysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export function runReliabilityVerification() {
    const sourceCases: Array<() => boolean> = [
        () => calculateReliabilityScore([]) === 0,
        () => calculateReliabilityScore([{ source: 'openwork', url: null, scrapedAt: daysAgo(10) }]) > 0,
        () => calculateReliabilityScore([{ source: 'ir', url: null, scrapedAt: daysAgo(10) }]) > 0,
        () => calculateReliabilityScore([{ source: 'github', url: null, scrapedAt: daysAgo(10) }]) > 0,
        () => calculateReliabilityScore([{ source: 'connpass', url: null, scrapedAt: daysAgo(10) }]) > 0,
        () => calculateReliabilityScore([{ source: 'openwork', url: null, scrapedAt: daysAgo(20) }]) > calculateReliabilityScore([{ source: 'openwork', url: null, scrapedAt: daysAgo(120) }]),
        () => calculateReliabilityScore([{ source: 'openwork', url: null, scrapedAt: daysAgo(15) }, { source: 'openwork', url: null, scrapedAt: daysAgo(80) }]) > 0,
        () => calculateReliabilityScore([{ source: 'openwork', url: null, scrapedAt: daysAgo(15) }, { source: 'ir', url: null, scrapedAt: daysAgo(15) }, { source: 'github', url: null, scrapedAt: daysAgo(15) }, { source: 'connpass', url: null, scrapedAt: daysAgo(15) }]) <= 100,
        () => calculateReliabilityScore([{ source: 'openwork', url: null, scrapedAt: daysAgo(220) }]) >= 0,
        () => calculateReliabilityScore([{ source: 'openwork', url: null, scrapedAt: daysAgo(15) }, { source: 'ir', url: null, scrapedAt: daysAgo(15) }]) >= 60,
        () => calculateReliabilityScore([{ source: 'github', url: null, scrapedAt: daysAgo(15) }, { source: 'connpass', url: null, scrapedAt: daysAgo(15) }]) <= 40,
        () => Number.isFinite(calculateReliabilityScore([{ source: 'openwork', url: null, scrapedAt: daysAgo(15) }]))
    ]

    sourceCases.forEach((fn, i) => assert(fn(), `reliability case ${ i + 1 } failed`))

    const labelCases = [
        [70, '高'],
        [100, '高'],
        [69, '中'],
        [40, '中'],
        [55, '中'],
        [39, '低'],
        [0, '低'],
        [15, '低'],
        [71, '高'],
        [41, '中'],
        [1, '低'],
        [88, '高'],
        [60, '中'],
        [30, '低'],
        [75, '高'],
        [45, '中'],
    ] as const

    labelCases.forEach(([score, expected], i) => {
        assert(getReliabilityLabel(score).label === expected, `label case ${ i + 1 } failed`)
    })

    const formattingCases = [
        () => formatRelativeDate(new Date().toISOString()) === '今日',
        () => formatRelativeDate(daysAgo(1)) === '昨日',
        () => formatRelativeDate(daysAgo(3)).includes('日前'),
        () => formatRelativeDate(daysAgo(21)).includes('週間前') || formatRelativeDate(daysAgo(21)).includes('ヶ月前'),
    ]
    formattingCases.forEach((fn, i) => assert(fn(), `format case ${ i + 1 } failed`))

    return {
        passed: sourceCases.length + labelCases.length + formattingCases.length,
        breakdown: {
            source: sourceCases.length,
            label: labelCases.length,
            formatting: formattingCases.length,
        },
    }
}
