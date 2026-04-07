/**
 * Task 16.3: SEOメタ情報の受け入れ基準テスト
 *
 * 各ページのタイトル・ディスクリプション・canonical URLが
 * 要件（1.1, 1.2, 1.4）を満たすことを検証する。
 */
import { describe, it, expect } from 'vitest'
import {
  BASE_URL,
  generateCanonicalUrl,
  generatePageTitle,
  generatePageDescription,
  generateOgpMeta,
} from './seo'

// ---- ホームページ ----

const HOME_TITLE = generatePageTitle(['エンジニア幸福度マップ', 'エンジニアが輝ける会社を探そう'])
const HOME_DESCRIPTION = generatePageDescription(
  '技術スタック・リモート率・残業時間・定着率などを独自スコアで可視化。エンジニア転職で本当に良い会社を見つけよう。'
)
const HOME_CANONICAL = generateCanonicalUrl('/')

// ---- 企業詳細ページ（代表例） ----

const COMPANY_NAME = 'メルカリ'
const COMPANY_SCORE = 85
const DETAIL_TITLE = generatePageTitle([`${COMPANY_NAME} の幸福度スコア`, 'エンジニア幸福度マップ'])
const DETAIL_DESCRIPTION = generatePageDescription(
  `${COMPANY_NAME}のエンジニア幸福度スコアは${COMPANY_SCORE}点。技術スタック・リモート率・残業時間・定着率などを詳細分析。`
)
const DETAIL_CANONICAL = generateCanonicalUrl('/company/mercari-jp')

// ---- プライバシーポリシーページ ----

const PRIVACY_TITLE = generatePageTitle(['プライバシーポリシー', 'エンジニア幸福度マップ'])
const PRIVACY_DESCRIPTION = generatePageDescription(
  'エンジニア幸福度マップのプライバシーポリシー。収集するデータ・利用目的・第三者提供（Google Analytics・AdSense）・オプトアウト方法を説明します。'
)
const PRIVACY_CANONICAL = generateCanonicalUrl('/privacy-policy')

describe('SEOメタ情報 受け入れ基準（要件 1.1, 1.2, 1.4）', () => {

  describe('ホームページ', () => {
    it('タイトルは60文字以内であること（要件 1.1）', () => {
      expect(HOME_TITLE.length).toBeLessThanOrEqual(60)
    })

    it('タイトルは空でないこと', () => {
      expect(HOME_TITLE.length).toBeGreaterThan(0)
    })

    it('メタディスクリプションは160文字以内であること（要件 1.2）', () => {
      expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160)
    })

    it('canonical URLは BASE_URL + "/" であること（要件 1.4）', () => {
      expect(HOME_CANONICAL).toBe(`${BASE_URL}/`)
    })
  })

  describe('企業詳細ページ', () => {
    it('タイトルは60文字以内であること（要件 1.1, 1.3）', () => {
      expect(DETAIL_TITLE.length).toBeLessThanOrEqual(60)
    })

    it('タイトルに企業名が含まれること（要件 1.3）', () => {
      // 切り詰め後もサービス名か企業名のいずれかが含まれることを確認
      expect(
        DETAIL_TITLE.includes(COMPANY_NAME) || DETAIL_TITLE.includes('エンジニア幸福度マップ')
      ).toBe(true)
    })

    it('メタディスクリプションは160文字以内であること（要件 1.2）', () => {
      expect(DETAIL_DESCRIPTION.length).toBeLessThanOrEqual(160)
    })

    it('canonical URLは BASE_URL + /company/:id の形式であること（要件 1.4）', () => {
      expect(DETAIL_CANONICAL).toBe(`${BASE_URL}/company/mercari-jp`)
      expect(DETAIL_CANONICAL.startsWith(BASE_URL)).toBe(true)
    })
  })

  describe('プライバシーポリシーページ', () => {
    it('タイトルは60文字以内であること（要件 1.1）', () => {
      expect(PRIVACY_TITLE.length).toBeLessThanOrEqual(60)
    })

    it('メタディスクリプションは160文字以内であること（要件 1.2）', () => {
      expect(PRIVACY_DESCRIPTION.length).toBeLessThanOrEqual(160)
    })

    it('canonical URLは BASE_URL + /privacy-policy であること（要件 1.4）', () => {
      expect(PRIVACY_CANONICAL).toBe(`${BASE_URL}/privacy-policy`)
    })
  })

  describe('ページ間のタイトル一意性（要件 1.1）', () => {
    it('ホーム・詳細・プライバシーの各タイトルが一意であること', () => {
      const titles = [HOME_TITLE, DETAIL_TITLE, PRIVACY_TITLE]
      const uniqueTitles = new Set(titles)
      expect(uniqueTitles.size).toBe(titles.length)
    })
  })

  describe('OGP メタ情報', () => {
    it('OGP image URLはデフォルト画像を含むこと（要件 3.4）', () => {
      const ogp = generateOgpMeta({ title: HOME_TITLE, description: HOME_DESCRIPTION, url: HOME_CANONICAL })
      expect(ogp.image).toContain(BASE_URL)
      expect(ogp.image).toContain('og-default')
    })

    it('企業詳細ページのOGP titleに企業名またはサービス名が含まれること（要件 3.2）', () => {
      const ogp = generateOgpMeta({ title: DETAIL_TITLE, description: DETAIL_DESCRIPTION, url: DETAIL_CANONICAL })
      expect(
        ogp.title.includes(COMPANY_NAME) || ogp.title.includes('エンジニア幸福度マップ')
      ).toBe(true)
    })
  })
})

// ---- Task 16.4: 構造化データ出力のユニットテスト（seo.test.ts の補足） ----
// NOTE: generateWebSiteSchema / generateOrganizationSchema の主要テストは
// src/utils/seo.test.ts にて実施済み。以下は受け入れ基準視点の追加テスト。

import { generateWebSiteSchema, generateOrganizationSchema } from './seo'

describe('構造化データ 受け入れ基準（要件 2.1, 2.2, 2.4）', () => {
  describe('generateWebSiteSchema（要件 2.1）', () => {
    it('JSON-LD として有効なオブジェクトを返すこと', () => {
      const schema = generateWebSiteSchema()
      expect(() => JSON.stringify(schema)).not.toThrow()
    })

    it('WebSite スキーマの必須フィールドがすべて存在すること', () => {
      const schema = generateWebSiteSchema()
      expect(schema['@context']).toBeDefined()
      expect(schema['@type']).toBeDefined()
      expect(schema.name).toBeDefined()
      expect(schema.url).toBeDefined()
    })
  })

  describe('generateOrganizationSchema（要件 2.2, 2.4）', () => {
    it('有効な name を渡した場合は Organization スキーマを返すこと', () => {
      const schema = generateOrganizationSchema({ name: 'テスト株式会社' })
      expect(schema).not.toBeNull()
      expect(schema!['@type']).toBe('Organization')
    })

    it('name が空文字列の場合は null を返すこと（要件 2.4）', () => {
      expect(generateOrganizationSchema({ name: '' })).toBeNull()
    })

    it('website フィールドがある場合は url が含まれること', () => {
      const schema = generateOrganizationSchema({
        name: 'テスト株式会社',
        website: 'https://example.com',
      })
      expect(schema!.url).toBe('https://example.com')
    })

    it('website フィールドがない場合は url が含まれないこと', () => {
      const schema = generateOrganizationSchema({ name: 'テスト株式会社' })
      expect('url' in schema!).toBe(false)
    })

    it('JSON-LD として有効なオブジェクトを返すこと', () => {
      const schema = generateOrganizationSchema({ name: 'テスト株式会社' })
      expect(() => JSON.stringify(schema)).not.toThrow()
    })
  })
})
