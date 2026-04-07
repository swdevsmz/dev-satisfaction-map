import { describe, it, expect } from 'vitest'
import {
  BASE_URL,
  generateCanonicalUrl,
  generatePageTitle,
  generatePageDescription,
  generateOgpMeta,
  generateWebSiteSchema,
  generateOrganizationSchema,
  generateTwitterShareUrl,
  generateFacebookShareUrl,
} from './seo'

// ---- Task 1.1: SEOユーティリティ関数 ----

describe('BASE_URL', () => {
  it('正しいベースURLを保持していること', () => {
    expect(BASE_URL).toBe('https://engineer-happiness-map.com')
  })
})

describe('generateCanonicalUrl', () => {
  it('BASE_URL にパスを結合したURLを返すこと', () => {
    expect(generateCanonicalUrl('/')).toBe('https://engineer-happiness-map.com/')
  })

  it('/company/mercari-jp のパスを正しく結合すること', () => {
    expect(generateCanonicalUrl('/company/mercari-jp')).toBe(
      'https://engineer-happiness-map.com/company/mercari-jp'
    )
  })
})

describe('generatePageTitle', () => {
  it('パーツをパイプ区切りで結合した文字列を返すこと', () => {
    expect(generatePageTitle(['エンジニア幸福度マップ', 'トップ'])).toBe(
      'エンジニア幸福度マップ | トップ'
    )
  })

  it('60文字以内に切り詰めること', () => {
    const longPart = 'あ'.repeat(100)
    const result = generatePageTitle([longPart])
    expect(result.length).toBeLessThanOrEqual(60)
  })

  it('60文字ちょうどの入力は切り詰めないこと', () => {
    const sixtyChars = 'a'.repeat(60)
    const result = generatePageTitle([sixtyChars])
    expect(result.length).toBe(60)
  })

  it('空配列のとき空文字列を返すこと', () => {
    expect(generatePageTitle([])).toBe('')
  })
})

describe('generatePageDescription', () => {
  it('160文字以下のテキストはそのまま返すこと', () => {
    const text = 'エンジニア幸福度マップは求人データから働きやすさを可視化します。'
    expect(generatePageDescription(text)).toBe(text)
  })

  it('160文字を超えるテキストは "..." を付けて切り詰めること', () => {
    const text = 'あ'.repeat(200)
    const result = generatePageDescription(text)
    expect(result.length).toBeLessThanOrEqual(160)
    expect(result.endsWith('...')).toBe(true)
  })

  it('切り詰め後の本文は157文字であること（160 - 3文字の "..."）', () => {
    const text = 'a'.repeat(200)
    const result = generatePageDescription(text)
    expect(result).toBe('a'.repeat(157) + '...')
  })

  it('ちょうど160文字のテキストは切り詰めないこと', () => {
    const text = 'b'.repeat(160)
    const result = generatePageDescription(text)
    expect(result).toBe(text)
    expect(result.endsWith('...')).toBe(false)
  })
})

describe('generateOgpMeta', () => {
  it('指定したtitle・description・urlを持つオブジェクトを返すこと', () => {
    const options = {
      title: 'テストタイトル',
      description: 'テスト説明',
      url: 'https://engineer-happiness-map.com/',
    }
    const result = generateOgpMeta(options)
    expect(result.title).toBe(options.title)
    expect(result.description).toBe(options.description)
    expect(result.url).toBe(options.url)
  })

  it('imageが省略された場合はデフォルトOGP画像URLを使用すること', () => {
    const result = generateOgpMeta({
      title: 'タイトル',
      description: '説明',
      url: 'https://engineer-happiness-map.com/',
    })
    expect(result.image).toBe('https://engineer-happiness-map.com/og-default.png')
  })

  it('imageが指定された場合はその値を使用すること', () => {
    const customImage = 'https://example.com/custom.png'
    const result = generateOgpMeta({
      title: 'タイトル',
      description: '説明',
      url: 'https://engineer-happiness-map.com/',
      image: customImage,
    })
    expect(result.image).toBe(customImage)
  })
})

describe('generateWebSiteSchema', () => {
  it('@context が "https://schema.org" であること', () => {
    const schema = generateWebSiteSchema()
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('@type が "WebSite" であること', () => {
    const schema = generateWebSiteSchema()
    expect(schema['@type']).toBe('WebSite')
  })

  it('name が含まれていること', () => {
    const schema = generateWebSiteSchema()
    expect(typeof schema.name).toBe('string')
    expect(schema.name.length).toBeGreaterThan(0)
  })

  it('url が BASE_URL であること', () => {
    const schema = generateWebSiteSchema()
    expect(schema.url).toBe(BASE_URL)
  })

  it('description が含まれていること', () => {
    const schema = generateWebSiteSchema()
    expect(typeof schema.description).toBe('string')
    expect(schema.description.length).toBeGreaterThan(0)
  })
})

describe('generateOrganizationSchema', () => {
  it('@context が "https://schema.org" であること', () => {
    const schema = generateOrganizationSchema({ name: 'メルカリ' })
    expect(schema!['@context']).toBe('https://schema.org')
  })

  it('@type が "Organization" であること', () => {
    const schema = generateOrganizationSchema({ name: 'メルカリ' })
    expect(schema!['@type']).toBe('Organization')
  })

  it('name フィールドが返却オブジェクトに含まれること', () => {
    const schema = generateOrganizationSchema({ name: 'メルカリ' })
    expect(schema!.name).toBe('メルカリ')
  })

  it('website が指定された場合は url フィールドに含まれること', () => {
    const schema = generateOrganizationSchema({
      name: 'メルカリ',
      website: 'https://mercar.i.jp',
    })
    expect(schema!.url).toBe('https://mercar.i.jp')
  })

  it('website が未指定の場合は url フィールドが含まれないこと', () => {
    const schema = generateOrganizationSchema({ name: 'メルカリ' })
    expect('url' in schema!).toBe(false)
  })

  it('name が空文字列の場合は null を返すこと', () => {
    const schema = generateOrganizationSchema({ name: '' })
    expect(schema).toBeNull()
  })
})

describe('generateTwitterShareUrl', () => {
  it('twitter.com/intent/tweet の URL を返すこと', () => {
    const url = generateTwitterShareUrl('テスト', 'https://engineer-happiness-map.com/')
    expect(url).toContain('twitter.com/intent/tweet')
  })

  it('text パラメータがエンコードされて含まれること', () => {
    const url = generateTwitterShareUrl('テスト テキスト', 'https://example.com/')
    expect(url).toContain('text=')
    // URLSearchParams はスペースを + でエンコードするため、+ をスペースに変換してから検証する
    const decoded = url.replace(/\+/g, ' ')
    expect(decodeURIComponent(decoded)).toContain('テスト テキスト')
  })

  it('url パラメータが含まれること', () => {
    const shareUrl = 'https://engineer-happiness-map.com/company/abc'
    const result = generateTwitterShareUrl('テスト', shareUrl)
    expect(decodeURIComponent(result)).toContain(shareUrl)
  })
})

describe('generateFacebookShareUrl', () => {
  it('facebook.com/sharer/sharer の URL を返すこと', () => {
    const url = generateFacebookShareUrl('https://engineer-happiness-map.com/')
    expect(url).toContain('facebook.com/sharer/sharer')
  })

  it('u パラメータにURLがエンコードされて含まれること', () => {
    const shareUrl = 'https://engineer-happiness-map.com/company/abc'
    const result = generateFacebookShareUrl(shareUrl)
    expect(result).toContain('u=')
    expect(decodeURIComponent(result)).toContain(shareUrl)
  })
})
