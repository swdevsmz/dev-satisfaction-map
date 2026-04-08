import {
    WEIGHTS,
    applyBonusPoints,
    calculateHappinessScore,
    calculatePersonalScore,
    getScoreColor,
    normalizeScores,
} from './scoring'
import type { CompanyScores, UserWeights } from '../types/company'

function baseScores(overrides: Partial<CompanyScores> = {}): CompanyScores {
    return {
        techStackModernity: 5,
        remoteRate: 50,
        estimatedOvertimeHours: 30,
        turnoverRate: 15,
        retentionRate: 85,
        devEnvironment: 6,
        skillUpSupport: 6,
        happinessScore: 0,
        reliabilityScore: 0,
        scoreColor: 'yellow',
        ...overrides,
    }
}

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message)
}

function runNormalizationCases(): number {
    const cases = [
        () => normalizeScores(baseScores({ techStackModernity: 1 })).techStackModernity === 0,
        () => normalizeScores(baseScores({ techStackModernity: 10 })).techStackModernity === 100,
        () => normalizeScores(baseScores({ remoteRate: 0 })).remoteRate === 0,
        () => normalizeScores(baseScores({ remoteRate: 100 })).remoteRate === 100,
        () => normalizeScores(baseScores({ estimatedOvertimeHours: 0 })).estimatedOvertimeHours === 100,
        () => normalizeScores(baseScores({ estimatedOvertimeHours: 80 })).estimatedOvertimeHours === 0,
        () => normalizeScores(baseScores({ estimatedOvertimeHours: 150 })).estimatedOvertimeHours === 0,
        () => normalizeScores(baseScores({ turnoverRate: 0 })).turnoverRate === 100,
        () => normalizeScores(baseScores({ turnoverRate: 100 })).turnoverRate === 0,
        () => normalizeScores(baseScores({ retentionRate: 90 })).retentionRate === 90,
        () => normalizeScores(baseScores({ devEnvironment: 1 })).devEnvironment === 0,
        () => normalizeScores(baseScores({ devEnvironment: 10 })).devEnvironment === 100,
        () => normalizeScores(baseScores({ skillUpSupport: 1 })).skillUpSupport === 0,
        () => normalizeScores(baseScores({ skillUpSupport: 10 })).skillUpSupport === 100,
        () => Math.abs(normalizeScores(baseScores({ techStackModernity: 8 })).techStackModernity - 77.8) < 0.1,
    ]

    cases.forEach((fn, i) => assert(fn(), `normalize case ${ i + 1 } failed`))
    return cases.length
}

function runHappinessCases(): number {
    const weightTotal = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0)
    const cases = [
        () => calculateHappinessScore(baseScores()) >= 0,
        () => calculateHappinessScore(baseScores({ techStackModernity: 10, remoteRate: 100 })) <= 100,
        () => Math.abs(weightTotal - 1) <= 0.01,
        () => Number.isFinite(calculateHappinessScore(baseScores({ estimatedOvertimeHours: 200 }))),
        () => calculateHappinessScore(baseScores({ techStackModernity: 8 })) === Number(calculateHappinessScore(baseScores({ techStackModernity: 8 })).toFixed(1)),
    ]

    cases.forEach((fn, i) => assert(fn(), `happiness case ${ i + 1 } failed`))
    return cases.length
}

function runBonusCases(): number {
    const cases = [
        () => applyBonusPoints(80, { github: 5, connpass: 5 }) === 90,
        () => applyBonusPoints(98, { github: 5, connpass: 5 }) === 100,
        () => applyBonusPoints(70, { github: 5, connpass: 0 }) === 75,
        () => applyBonusPoints(70, { github: 0, connpass: 5 }) === 75,
        () => applyBonusPoints(70, { github: 0, connpass: 0 }) === 70,
    ]

    cases.forEach((fn, i) => assert(fn(), `bonus case ${ i + 1 } failed`))
    return cases.length
}

function runColorCases(): number {
    const paletteCases = [100, 80, 70, 69.9, 50, 40, 39.9, 10, 0, 85.3, 55.2, 44.4, 20.8]
    paletteCases.forEach((score, i) => {
        const color = getScoreColor(score)
        assert(['green', 'yellow', 'red'].includes(color), `color case ${ i + 1 } failed`)
    })
    return paletteCases.length
}

function runPersonalCases(): number {
    const weights: UserWeights = {
        techStackModernity: 3,
        remoteRate: 2,
        estimatedOvertimeHours: 1,
        turnoverRate: 0,
        retentionRate: 0,
        devEnvironment: 0,
        skillUpSupport: 0,
    }

    const emptyWeights: UserWeights = {
        techStackModernity: 0,
        remoteRate: 0,
        estimatedOvertimeHours: 0,
        turnoverRate: 0,
        retentionRate: 0,
        devEnvironment: 0,
        skillUpSupport: 0,
    }

    const cases = [
        () => calculatePersonalScore(baseScores(), weights) >= 0,
        () => calculatePersonalScore(baseScores(), weights) <= 100,
        () => calculatePersonalScore(baseScores(), emptyWeights) === calculateHappinessScore(baseScores()),
        () => calculatePersonalScore(baseScores({ remoteRate: 100 }), weights) >= calculatePersonalScore(baseScores({ remoteRate: 40 }), weights),
        () => Number.isFinite(calculatePersonalScore(baseScores({ estimatedOvertimeHours: 90 }), weights)),
        () => calculatePersonalScore(baseScores(), weights) === Number(calculatePersonalScore(baseScores(), weights).toFixed(1)),
    ]

    cases.forEach((fn, i) => assert(fn(), `personal case ${ i + 1 } failed`))
    return cases.length
}

export function runScoringVerification() {
    const normalization = runNormalizationCases()
    const happiness = runHappinessCases()
    const bonus = runBonusCases()
    const color = runColorCases()
    const personal = runPersonalCases()

    return {
        passed: normalization + happiness + bonus + color + personal,
        breakdown: { normalization, happiness, bonus, color, personal },
    }
}
