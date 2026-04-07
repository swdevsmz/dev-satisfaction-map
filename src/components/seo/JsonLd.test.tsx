import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import JsonLd from './JsonLd'

// ---- Task 3.1: JsonLd コンポーネント ----
// react-helmet-async はデフォルトで requestAnimationFrame を使うため、
// テスト環境（jsdom）では defer={false} を設定して同期的に DOM に注入する。

function renderWithHelmet(ui: React.ReactElement) {
  return render(<HelmetProvider>{ui}</HelmetProvider>)
}

describe('JsonLd', () => {
  beforeEach(() => {
    // 各テスト前に head の JSON-LD script タグをクリア
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove())
  })

  it('schema が null の場合は何もレンダリングしないこと', () => {
    const { container } = renderWithHelmet(<JsonLd schema={null} />)
    // コンポーネント自体が null を返すため、container 内には何もない
    expect(container.firstChild).toBeNull()
    // head にも script タグが追加されていないこと
    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBe(0)
  })

  it('schema オブジェクトが渡された場合に script タグが head に注入されること', () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'エンジニア幸福度マップ',
      url: 'https://engineer-happiness-map.com',
    }
    renderWithHelmet(<JsonLd schema={schema} />)

    // defer={false} により同期的に head に注入される
    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThan(0)
  })

  it('JSON.stringify の出力が正しくシリアライズされること', () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'テスト株式会社',
    }
    renderWithHelmet(<JsonLd schema={schema} />)

    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThan(0)
    const lastScript = scripts[scripts.length - 1]
    const parsed = JSON.parse(lastScript.textContent ?? '')
    expect(parsed['@context']).toBe('https://schema.org')
    expect(parsed['@type']).toBe('Organization')
    expect(parsed.name).toBe('テスト株式会社')
  })
})
