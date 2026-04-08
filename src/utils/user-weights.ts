/**
 * ユーザーウェイト（重要度設定）のローカルストレージ管理
 * Task 2.2: ローカルストレージへのウェイト永続化
 */

import type { UserWeights } from '../types/company'

const STORAGE_KEY = 'happiness_map:user_weights'

const DEFAULT_WEIGHTS: UserWeights = {
  techStackModernity: 0,
  remoteRate: 0,
  estimatedOvertimeHours: 0,
  turnoverRate: 0,
  retentionRate: 0,
  devEnvironment: 0,
  skillUpSupport: 0,
}

/**
 * ローカルストレージからユーザーウェイトを読み込む
 * 存在しない場合またはパース失敗時はデフォルト値を返す
 */
export function loadUserWeights(): UserWeights {
  if (typeof window === 'undefined') {
    return DEFAULT_WEIGHTS
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_WEIGHTS
    }
    const parsed = JSON.parse(stored) as Partial<UserWeights>

    // デフォルト値とマージして、不足していたキーを補完
    return {
      techStackModernity: parsed.techStackModernity ?? DEFAULT_WEIGHTS.techStackModernity,
      remoteRate: parsed.remoteRate ?? DEFAULT_WEIGHTS.remoteRate,
      estimatedOvertimeHours:
        parsed.estimatedOvertimeHours ?? DEFAULT_WEIGHTS.estimatedOvertimeHours,
      turnoverRate: parsed.turnoverRate ?? DEFAULT_WEIGHTS.turnoverRate,
      retentionRate: parsed.retentionRate ?? DEFAULT_WEIGHTS.retentionRate,
      devEnvironment: parsed.devEnvironment ?? DEFAULT_WEIGHTS.devEnvironment,
      skillUpSupport: parsed.skillUpSupport ?? DEFAULT_WEIGHTS.skillUpSupport,
    }
  } catch {
    // パース失敗時はデフォルト値を返す
    return DEFAULT_WEIGHTS
  }
}

/**
 * ユーザーウェイトをローカルストレージに保存
 */
export function saveUserWeights(weights: UserWeights): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weights))
  } catch (err) {
    // ストレージ容量超過など、エラー時は無視
    console.warn('Failed to save user weights:', err)
  }
}

/**
 * ローカルストレージのウェイトをリセット（デフォルト値へ復元）
 */
export function resetUserWeights(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('Failed to reset user weights:', err)
  }
}

/**
 * ウェイト値が有効な範囲（0-3）にあるか検証
 * タスク2.2の要件: 各指標は0-3の値を持つ
 */
export function validateUserWeights(weights: UserWeights): boolean {
  return Object.values(weights).every((w) => typeof w === 'number' && w >= 0 && w <= 3)
}
