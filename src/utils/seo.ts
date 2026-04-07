/** サイトのベースURL定数 */
export const BASE_URL = 'https://engineer-happiness-map.com'

/** canonical URL生成: BASE_URL + path */
export function generateCanonicalUrl(path: string): string {
  return `${BASE_URL}${path}`
}

/**
 * ページタイトル生成
 * パーツを " | " で結合し、最大60文字に切り詰める
 */
export function generatePageTitle(parts: string[]): string {
  const title = parts.join(' | ')
  return title.slice(0, 60)
}

/**
 * メタディスクリプション生成
 * 160文字を超える場合は157文字で切り詰め "..." を付加する
 */
export function generatePageDescription(text: string): string {
  if (text.length <= 160) return text
  return text.slice(0, 157) + '...'
}

/** OGPメタタグ情報 */
export interface OgpMeta {
  title: string
  description: string
  url: string
  image: string
}

/**
 * OGPメタ情報生成
 * image が省略された場合はデフォルトOGP画像URLを使用する
 */
export function generateOgpMeta(options: {
  title: string
  description: string
  url: string
  image?: string
}): OgpMeta {
  return {
    title: options.title,
    description: options.description,
    url: options.url,
    image: options.image ?? `${BASE_URL}/og-default.png`,
  }
}

/** WebSite JSON-LDスキーマ */
export interface WebSiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  description: string
}

/** WebSite JSON-LD生成 */
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'エンジニア幸福度マップ',
    url: BASE_URL,
    description:
      '求人データからエンジニアの働きやすさを可視化するWebサービス。技術スタック・リモート率・残業時間など7指標で企業を比較できます。',
  }
}

/** Organization JSON-LDスキーマ */
export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  url?: string
}

/**
 * Organization JSON-LD生成
 * name が空文字列または未指定の場合は null を返す
 */
export function generateOrganizationSchema(company: {
  name: string
  website?: string
}): OrganizationSchema | null {
  if (!company.name) return null

  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
  }

  if (company.website) {
    schema.url = company.website
  }

  return schema
}

/**
 * X（Twitter）シェアURL生成
 * twitter.com/intent/tweet にテキストとURLをクエリパラメータとして付与する
 */
export function generateTwitterShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url })
  return `https://twitter.com/intent/tweet?${params.toString()}`
}

/**
 * FacebookシェアURL生成
 * facebook.com/sharer/sharer に u パラメータとしてURLを付与する
 */
export function generateFacebookShareUrl(url: string): string {
  const params = new URLSearchParams({ u: url })
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`
}
