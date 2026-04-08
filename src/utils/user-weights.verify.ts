import { loadUserWeights, resetUserWeights, saveUserWeights, validateUserWeights } from './user-weights'
import type { UserWeights } from '../types/company'

const VALID_WEIGHTS: UserWeights = {
    techStackModernity: 1,
    remoteRate: 2,
    estimatedOvertimeHours: 3,
    turnoverRate: 0,
    retentionRate: 1,
    devEnvironment: 2,
    skillUpSupport: 3,
}

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message)
}

export function runUserWeightsVerification() {
    resetUserWeights()

    const cases: Array<() => boolean> = [
        () => validateUserWeights(VALID_WEIGHTS),
        () => !validateUserWeights({ ...VALID_WEIGHTS, remoteRate: -1 }),
        () => !validateUserWeights({ ...VALID_WEIGHTS, remoteRate: 4 }),
        () => {
            saveUserWeights(VALID_WEIGHTS)
            return loadUserWeights().remoteRate === 2
        },
        () => {
            saveUserWeights(VALID_WEIGHTS)
            resetUserWeights()
            return loadUserWeights().remoteRate === 0
        },
        () => {
            saveUserWeights({ ...VALID_WEIGHTS, techStackModernity: 3 })
            return loadUserWeights().techStackModernity === 3
        },
        () => {
            saveUserWeights({ ...VALID_WEIGHTS, skillUpSupport: 0 })
            return loadUserWeights().skillUpSupport === 0
        },
        () => Object.values(loadUserWeights()).every((w) => w >= 0 && w <= 3),
    ]

    cases.forEach((fn, i) => assert(fn(), `user-weights case ${ i + 1 } failed`))
    resetUserWeights()

    return { passed: cases.length }
}
