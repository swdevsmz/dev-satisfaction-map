// @vitest-environment node

import { describe, expect, it } from 'vitest'
import type { ScrapedDocument } from '../types.js'
import { deriveBonusScores } from './upsert.js'

function makeDoc(source: ScrapedDocument['source'], content: string): ScrapedDocument {
  return { companyId: 'test-co', source, url: null, content }
}

describe('deriveBonusScores', () => {
  it('uses GitHub and Connpass contents to derive bonus points', () => {
    const docs = [
      makeDoc(
        'github',
        [
          '公開リポジトリ数: 58',
          '過去30日のイベント数: 18',
        ].join('\n')
      ),
      makeDoc(
        'connpass',
        [
          '開催件数（過去1年）: 12件',
          'skill_up_support推定: 7/10',
        ].join('\n')
      ),
    ]

    const bonus = deriveBonusScores(docs)

    expect(bonus.github_activity_bonus).toBe(5)
    expect(bonus.connpass_bonus).toBe(4)
  })

  it('falls back to zero when bonus hints are missing', () => {
    const bonus = deriveBonusScores([
      makeDoc('github', 'データ取得不可'),
      makeDoc('connpass', 'データ取得不可'),
    ])

    expect(bonus.github_activity_bonus).toBe(0)
    expect(bonus.connpass_bonus).toBe(0)
  })
})
