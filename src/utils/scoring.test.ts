import { describe, it, expect } from 'vitest'
import {
  normalizeScores,
  calculateHappinessScore,
  calculatePersonalScore,
  applyBonusPoints,
  getScoreColor,
  WEIGHTS,
} from './scoring'
import type { CompanyScores, UserWeights } from '../types/company'

describe('normalizeScores - 指標正規化ロジック (Task 1.1)', () => {
  describe('技術スタック現代性: 1-10スケール → 0-100', () => {
    it('スコア1は0点に正規化される', () => {
      const scores = createTestScores({ techStackModernity: 1 })
      const result = normalizeScores(scores)
      expect(result.techStackModernity).toBe(0)
    })

    it('スコア5.5は50点に正規化される', () => {
      const scores = createTestScores({ techStackModernity: 5.5 })
      const result = normalizeScores(scores)
      expect(result.techStackModernity).toBeCloseTo(50, 1)
    })

    it('スコア10は100点に正規化される', () => {
      const scores = createTestScores({ techStackModernity: 10 })
      const result = normalizeScores(scores)
      expect(result.techStackModernity).toBe(100)
    })

    it('小数点を含むスコアを正確に計算する', () => {
      const scores = createTestScores({ techStackModernity: 8 })
      const result = normalizeScores(scores)
      expect(result.techStackModernity).toBeCloseTo(77.78, 1)
    })
  })

  describe('リモート対応率: パーセント値をそのまま使用', () => {
    it('0%は0点', () => {
      const scores = createTestScores({ remoteRate: 0 })
      const result = normalizeScores(scores)
      expect(result.remoteRate).toBe(0)
    })

    it('50%は50点', () => {
      const scores = createTestScores({ remoteRate: 50 })
      const result = normalizeScores(scores)
      expect(result.remoteRate).toBe(50)
    })

    it('100%は100点', () => {
      const scores = createTestScores({ remoteRate: 100 })
      const result = normalizeScores(scores)
      expect(result.remoteRate).toBe(100)
    })
  })

  describe('残業時間: 80時間基準で反転', () => {
    it('10時間は87.5点に正規化される', () => {
      const scores = createTestScores({ estimatedOvertimeHours: 10 })
      const result = normalizeScores(scores)
      expect(result.estimatedOvertimeHours).toBeCloseTo(87.5, 1)
    })

    it('30時間は62.5点に正規化される', () => {
      const scores = createTestScores({ estimatedOvertimeHours: 30 })
      const result = normalizeScores(scores)
      expect(result.estimatedOvertimeHours).toBeCloseTo(62.5, 1)
    })

    it('80時間は0点に正規化される', () => {
      const scores = createTestScores({ estimatedOvertimeHours: 80 })
      const result = normalizeScores(scores)
      expect(result.estimatedOvertimeHours).toBe(0)
    })

    it('100時間は下限0点にキャップされる', () => {
      const scores = createTestScores({ estimatedOvertimeHours: 100 })
      const result = normalizeScores(scores)
      expect(result.estimatedOvertimeHours).toBe(0)
    })

    it('150時間も下限0点にキャップされる', () => {
      const scores = createTestScores({ estimatedOvertimeHours: 150 })
      const result = normalizeScores(scores)
      expect(result.estimatedOvertimeHours).toBe(0)
    })
  })

  describe('離職率: パーセント値を反転', () => {
    it('0%離職は100点', () => {
      const scores = createTestScores({ turnoverRate: 0 })
      const result = normalizeScores(scores)
      expect(result.turnoverRate).toBe(100)
    })

    it('5%離職は95点', () => {
      const scores = createTestScores({ turnoverRate: 5 })
      const result = normalizeScores(scores)
      expect(result.turnoverRate).toBe(95)
    })

    it('15%離職は85点', () => {
      const scores = createTestScores({ turnoverRate: 15 })
      const result = normalizeScores(scores)
      expect(result.turnoverRate).toBe(85)
    })

    it('100%離職は0点', () => {
      const scores = createTestScores({ turnoverRate: 100 })
      const result = normalizeScores(scores)
      expect(result.turnoverRate).toBe(0)
    })
  })

  describe('定着率: パーセント値をそのまま使用', () => {
    it('80%定着は80点', () => {
      const scores = createTestScores({ retentionRate: 80 })
      const result = normalizeScores(scores)
      expect(result.retentionRate).toBe(80)
    })

    it('95%定着は95点', () => {
      const scores = createTestScores({ retentionRate: 95 })
      const result = normalizeScores(scores)
      expect(result.retentionRate).toBe(95)
    })
  })

  describe('開発環境スコア: 1-10スケール → 0-100', () => {
    it('スコア1は0点に正規化される', () => {
      const scores = createTestScores({ devEnvironment: 1 })
      const result = normalizeScores(scores)
      expect(result.devEnvironment).toBe(0)
    })

    it('スコア5.5は50点に正規化される', () => {
      const scores = createTestScores({ devEnvironment: 5.5 })
      const result = normalizeScores(scores)
      expect(result.devEnvironment).toBeCloseTo(50, 1)
    })

    it('スコア10は100点に正規化される', () => {
      const scores = createTestScores({ devEnvironment: 10 })
      const result = normalizeScores(scores)
      expect(result.devEnvironment).toBe(100)
    })
  })

  describe('スキルアップ支援度: 1-10スケール → 0-100', () => {
    it('スコア1は0点に正規化される', () => {
      const scores = createTestScores({ skillUpSupport: 1 })
      const result = normalizeScores(scores)
      expect(result.skillUpSupport).toBe(0)
    })

    it('スコア7は66.7点に正規化される', () => {
      const scores = createTestScores({ skillUpSupport: 7 })
      const result = normalizeScores(scores)
      expect(result.skillUpSupport).toBeCloseTo(66.7, 1)
    })

    it('スコア10は100点に正規化される', () => {
      const scores = createTestScores({ skillUpSupport: 10 })
      const result = normalizeScores(scores)
      expect(result.skillUpSupport).toBe(100)
    })
  })

  describe('エッジケース処理', () => {
    it('全指標が最小値の場合', () => {
      const scores = createTestScores({
        techStackModernity: 1,
        remoteRate: 0,
        estimatedOvertimeHours: 150, // max overtime = 0点
        turnoverRate: 100, // max turnover = 0点
        retentionRate: 0,
        devEnvironment: 1,
        skillUpSupport: 1,
      })
      const result = normalizeScores(scores)
      expect(result.techStackModernity).toBe(0)
      expect(result.remoteRate).toBe(0)
      expect(result.estimatedOvertimeHours).toBe(0)
      expect(result.turnoverRate).toBe(0)
      expect(result.retentionRate).toBe(0)
      expect(result.devEnvironment).toBe(0)
      expect(result.skillUpSupport).toBe(0)
    })

    it('全指標が最大値の場合', () => {
      const scores = createTestScores({
        techStackModernity: 10,
        remoteRate: 100,
        estimatedOvertimeHours: 0, // 0時間 = 100点
        turnoverRate: 0, // 0% = 100点
        retentionRate: 100,
        devEnvironment: 10,
        skillUpSupport: 10,
      })
      const result = normalizeScores(scores)
      expect(result.techStackModernity).toBe(100)
      expect(result.remoteRate).toBe(100)
      expect(result.estimatedOvertimeHours).toBe(100)
      expect(result.turnoverRate).toBe(100)
      expect(result.retentionRate).toBe(100)
      expect(result.devEnvironment).toBe(100)
      expect(result.skillUpSupport).toBe(100)
    })

    it('0時間残業の場合は100点', () => {
      const scores = createTestScores({ estimatedOvertimeHours: 0 })
      const result = normalizeScores(scores)
      expect(result.estimatedOvertimeHours).toBe(100)
    })
  })

  describe('精度確認 - 小数第1位', () => {
    it('技術スタックスコア8の正規化精度', () => {
      const scores = createTestScores({ techStackModernity: 8 })
      const result = normalizeScores(scores)
      // (8-1)/9 * 100 = 77.777...
      expect(result.techStackModernity).toBeCloseTo(77.8, 1)
    })

    it('複雑な組み合わせでの精度', () => {
      const scores = createTestScores({
        techStackModernity: 6.5,
        remoteRate: 33.3,
        estimatedOvertimeHours: 45,
      })
      const result = normalizeScores(scores)
      expect(result.techStackModernity).toBeCloseTo(61.1, 1)
      expect(result.remoteRate).toBeCloseTo(33.3, 1)
      expect(result.estimatedOvertimeHours).toBeCloseTo(43.75, 1)
    })
  })
})

describe('calculateHappinessScore - 幸福度スコア計算 (Task 1.2)', () => {
  it('正規化スコアの重み付き平均を計算する', () => {
    const scores = createTestScores({
      techStackModernity: 8,    // 77.8
      remoteRate: 95,           // 95
      estimatedOvertimeHours: 15, // 81.25
      turnoverRate: 10,         // 90
      retentionRate: 90,        // 90
      devEnvironment: 8,        // 77.8
      skillUpSupport: 7,        // 66.7
    })
    const happiness = calculateHappinessScore(scores)
    // Expected: 77.8*0.20 + 95*0.20 + 81.25*0.20 + 90*0.10 + 90*0.10 + 77.8*0.10 + 66.7*0.10
    //         = 15.56 + 19.00 + 16.25 + 9.00 + 9.00 + 7.78 + 6.67 = 83.26 → 83.3
    expect(happiness).toBeCloseTo(83.3, 1)
  })

  it('0–100の範囲に制限される（最小値）', () => {
    const scores = createTestScores({
      techStackModernity: 1,
      remoteRate: 0,
      estimatedOvertimeHours: 150,
      turnoverRate: 100,
      retentionRate: 0,
      devEnvironment: 1,
      skillUpSupport: 1,
    })
    const happiness = calculateHappinessScore(scores)
    expect(happiness).toBeGreaterThanOrEqual(0)
    expect(happiness).toBeLessThanOrEqual(100)
  })

  it('0–100の範囲に制限される（最大値）', () => {
    const scores = createTestScores({
      techStackModernity: 10,
      remoteRate: 100,
      estimatedOvertimeHours: 0,
      turnoverRate: 0,
      retentionRate: 100,
      devEnvironment: 10,
      skillUpSupport: 10,
    })
    const happiness = calculateHappinessScore(scores)
    expect(happiness).toBeGreaterThanOrEqual(0)
    expect(happiness).toBeLessThanOrEqual(100)
  })

  it('小数第1位で四捨五入される', () => {
    // Create values that would result in x.x5 to test rounding
    const scores = createTestScores({
      techStackModernity: 5,    // 44.4
      remoteRate: 50,           // 50
      estimatedOvertimeHours: 40, // 50
      turnoverRate: 50,         // 50
      retentionRate: 50,        // 50
      devEnvironment: 5,        // 44.4
      skillUpSupport: 5,        // 44.4
    })
    const happiness = calculateHappinessScore(scores)
    // Check that result is rounded to 1 decimal place
    const rounded = Math.round(happiness * 10) / 10
    expect(happiness).toBe(rounded)
  })

  it('各重みの合計が1.00であることを検証', () => {
    const weightSum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
    expect(weightSum).toBeCloseTo(1, 2)
  })

  it('レガシー企業の低スコア例', () => {
    const scores = createTestScores({
      techStackModernity: 3,    // 22.2
      remoteRate: 20,           // 20
      estimatedOvertimeHours: 50, // 37.5
      turnoverRate: 25,         // 75
      retentionRate: 75,        // 75
      devEnvironment: 3,        // 22.2
      skillUpSupport: 2,        // 11.1
    })
    const happiness = calculateHappinessScore(scores)
    // Expected: 22.2*0.20 + 20*0.20 + 37.5*0.20 + 75*0.10 + 75*0.10 + 22.2*0.10 + 11.1*0.10
    //         = 4.44 + 4.00 + 7.50 + 7.50 + 7.50 + 2.22 + 1.11 = 34.27 → 34.3
    expect(happiness).toBeCloseTo(34.3, 1)
  })
})

describe('applyBonusPoints - ボーナスポイント加算 (Task 1.3)', () => {
  it('GitHub活動度フラグから最大5点を加算', () => {
    const baseScore = 80
    const result = applyBonusPoints(baseScore, { github: 5, connpass: 0 })
    expect(result).toBe(85)
  })

  it('Connpassイベント開催フラグから最大5点を加算', () => {
    const baseScore = 80
    const result = applyBonusPoints(baseScore, { github: 0, connpass: 5 })
    expect(result).toBe(85)
  })

  it('両方のボーナスで最大10点加算（ただし100点にキャップ）', () => {
    const baseScore = 95
    const result = applyBonusPoints(baseScore, { github: 5, connpass: 5 })
    expect(result).toBe(100)
  })

  it('ボーナスが100点を超えないようにキャップされる', () => {
    const baseScore = 97
    const result = applyBonusPoints(baseScore, { github: 5, connpass: 5 })
    expect(result).toBe(100)
  })

  it('ボーナスなしの場合は元のスコアを返す', () => {
    const baseScore = 75
    const result = applyBonusPoints(baseScore, { github: 0, connpass: 0 })
    expect(result).toBe(75)
  })

  it('部分的なボーナスのハンドリング', () => {
    const baseScore = 80
    const result = applyBonusPoints(baseScore, { github: 2, connpass: 3 })
    expect(result).toBe(85)
  })

  it('0–100範囲内でのボーナス適用', () => {
    const baseScore = 50
    const result = applyBonusPoints(baseScore, { github: 4, connpass: 3 })
    expect(result).toBe(57)
  })
})

describe('getScoreColor - スコア色分けロジック (Task 1.4)', () => {
  describe('スコア範囲別の判定', () => {
    it('70以上は緑（green）', () => {
      expect(getScoreColor(70)).toBe('green')
      expect(getScoreColor(85)).toBe('green')
      expect(getScoreColor(100)).toBe('green')
    })

    it('40–69は黄（yellow）', () => {
      expect(getScoreColor(40)).toBe('yellow')
      expect(getScoreColor(50)).toBe('yellow')
      expect(getScoreColor(69)).toBe('yellow')
    })

    it('40未満は赤（red）', () => {
      expect(getScoreColor(0)).toBe('red')
      expect(getScoreColor(25)).toBe('red')
      expect(getScoreColor(39)).toBe('red')
    })
  })

  describe('境界値での正確な判定', () => {
    it('スコア40は黄（yellow）', () => {
      expect(getScoreColor(40)).toBe('yellow')
    })

    it('スコア39は赤（red）', () => {
      expect(getScoreColor(39)).toBe('red')
    })

    it('スコア70は緑（green）', () => {
      expect(getScoreColor(70)).toBe('green')
    })

    it('スコア69は黄（yellow）', () => {
      expect(getScoreColor(69)).toBe('yellow')
    })
  })

  describe('小数値での判定', () => {
    it('69.9は黄（yellow）', () => {
      expect(getScoreColor(69.9)).toBe('yellow')
    })

    it('70.0は緑（green）', () => {
      expect(getScoreColor(70)).toBe('green')
    })

    it('39.9は赤（red）', () => {
      expect(getScoreColor(39.9)).toBe('red')
    })

    it('40.0は黄（yellow）', () => {
      expect(getScoreColor(40)).toBe('yellow')
    })
  })
})

describe('calculatePersonalScore - パーソナルスコア計算 (Task 2.1)', () => {
  it('ユーザーウェイト0時に標準スコアを返す', () => {
    const scores = createTestScores({
      techStackModernity: 8,
      remoteRate: 95,
      estimatedOvertimeHours: 15,
      turnoverRate: 10,
      retentionRate: 90,
      devEnvironment: 8,
      skillUpSupport: 7,
    })
    const weights: UserWeights = {
      techStackModernity: 0,
      remoteRate: 0,
      estimatedOvertimeHours: 0,
      turnoverRate: 0,
      retentionRate: 0,
      devEnvironment: 0,
      skillUpSupport: 0,
    }
    const personal = calculatePersonalScore(scores, weights)
    const standard = calculateHappinessScore(scores)
    expect(personal).toBe(standard)
  })

  it('単一指標を重視する場合', () => {
    const scores = createTestScores({
      techStackModernity: 10,   // 100
      remoteRate: 50,           // 50
      estimatedOvertimeHours: 40, // 50
      turnoverRate: 50,         // 50
      retentionRate: 50,        // 50
      devEnvironment: 5,        // 44.4
      skillUpSupport: 5,        // 44.4
    })
    const weights: UserWeights = {
      techStackModernity: 3,
      remoteRate: 0,
      estimatedOvertimeHours: 0,
      turnoverRate: 0,
      retentionRate: 0,
      devEnvironment: 0,
      skillUpSupport: 0,
    }
    const personal = calculatePersonalScore(scores, weights)
    // When only techStackModernity (100) is weighted, score should be ~100
    expect(personal).toBeCloseTo(100, 1)
  })

  it('複数指標を重視する場合', () => {
    const scores = createTestScores({
      techStackModernity: 8,    // 77.8
      remoteRate: 100,          // 100 - リモート重視
      estimatedOvertimeHours: 20, // 75 - 残業時間重視
      turnoverRate: 10,         // 90
      retentionRate: 90,        // 90
      devEnvironment: 8,        // 77.8
      skillUpSupport: 7,        // 66.7
    })
    const weights: UserWeights = {
      techStackModernity: 0,
      remoteRate: 3,
      estimatedOvertimeHours: 3,
      turnoverRate: 0,
      retentionRate: 0,
      devEnvironment: 0,
      skillUpSupport: 0,
    }
    const personal = calculatePersonalScore(scores, weights)
    // (100 * 3/6) + (75 * 3/6) = 50 + 37.5 = 87.5
    expect(personal).toBeCloseTo(87.5, 1)
  })

  it('全指標を均等に重視する場合（正規化値の単純平均になる）', () => {
    const scores = createTestScores({
      techStackModernity: 8,
      remoteRate: 95,
      estimatedOvertimeHours: 15,
      turnoverRate: 10,
      retentionRate: 90,
      devEnvironment: 8,
      skillUpSupport: 7,
    })
    const weights: UserWeights = {
      techStackModernity: 1,
      remoteRate: 1,
      estimatedOvertimeHours: 1,
      turnoverRate: 1,
      retentionRate: 1,
      devEnvironment: 1,
      skillUpSupport: 1,
    }
    const personal = calculatePersonalScore(scores, weights)
    // 均等ウェイト(1,1,1,1,1,1,1)は、既定重みではなく単純平均になる
    // 77.8,95,81.25,90,90,77.8,66.7 の平均 ≒ 82.65 → 82.6
    expect(personal).toBeCloseTo(82.6, 1)
  })

  it('0–100の範囲で出力される', () => {
    const scores = createTestScores({
      techStackModernity: 1,
      remoteRate: 0,
      estimatedOvertimeHours: 150,
      turnoverRate: 100,
      retentionRate: 0,
      devEnvironment: 1,
      skillUpSupport: 1,
    })
    const weights: UserWeights = {
      techStackModernity: 3,
      remoteRate: 3,
      estimatedOvertimeHours: 3,
      turnoverRate: 3,
      retentionRate: 3,
      devEnvironment: 3,
      skillUpSupport: 3,
    }
    const personal = calculatePersonalScore(scores, weights)
    expect(personal).toBeGreaterThanOrEqual(0)
    expect(personal).toBeLessThanOrEqual(100)
  })

  it('小数第1位で四捨五入される', () => {
    const scores = createTestScores({
      techStackModernity: 5,
      remoteRate: 50,
      estimatedOvertimeHours: 40,
      turnoverRate: 50,
      retentionRate: 50,
      devEnvironment: 5,
      skillUpSupport: 5,
    })
    const weights: UserWeights = {
      techStackModernity: 1,
      remoteRate: 1,
      estimatedOvertimeHours: 1,
      turnoverRate: 1,
      retentionRate: 1,
      devEnvironment: 1,
      skillUpSupport: 1,
    }
    const personal = calculatePersonalScore(scores, weights)
    const rounded = Math.round(personal * 10) / 10
    expect(personal).toBe(rounded)
  })
})

// Helper function to create test company scores
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
