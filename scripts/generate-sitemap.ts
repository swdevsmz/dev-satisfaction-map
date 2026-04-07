/**
 * sitemap.xml ビルド時生成スクリプト
 *
 * Supabase から企業IDを取得し、XML Sitemap Protocol 0.9 形式で
 * public/sitemap.xml に出力する。
 *
 * 使用方法:
 *   npx tsx scripts/generate-sitemap.ts
 *
 * Supabase 取得に失敗しても既存ファイルを保持し、process.exit は呼ばない。
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const BASE_URL = 'https://engineer-happiness-map.com'
const OUTPUT_PATH = resolve(process.cwd(), 'public/sitemap.xml')

// 環境変数から Supabase 接続情報を取得
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? ''

function buildSitemapXml(companyIds: string[]): string {
  const now = new Date().toISOString().split('T')[0]

  const staticUrls = [
    `  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    `  <url>
    <loc>${BASE_URL}/privacy-policy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`,
  ]

  const companyUrls = companyIds.map(
    (id) => `  <url>
    <loc>${BASE_URL}/company/${encodeURIComponent(id)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )

  const allUrls = [...staticUrls, ...companyUrls].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls}
</urlset>`
}

export async function generateSitemap(): Promise<void> {
  console.log('[sitemap] 生成を開始します...')

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[sitemap] VITE_SUPABASE_URL または VITE_SUPABASE_ANON_KEY が未設定です。静的ページのみのサイトマップを生成します。')
    const xml = buildSitemapXml([])
    writeFileSync(OUTPUT_PATH, xml, 'utf-8')
    console.log(`[sitemap] 静的サイトマップを生成しました: ${OUTPUT_PATH}`)
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 既存ファイルをバックアップ（失敗時に復元するため）
  let backup: string | null = null
  if (existsSync(OUTPUT_PATH)) {
    backup = readFileSync(OUTPUT_PATH, 'utf-8')
  }

  try {
    const { data, error } = await supabase.from('companies').select('id').order('id')

    if (error) {
      console.error('[sitemap] Supabase からのデータ取得に失敗しました:', error.message)
      if (backup !== null) {
        console.log('[sitemap] 既存のサイトマップを保持します。')
      }
      return
    }

    const companyIds = (data ?? []).map((row: { id: string }) => row.id)
    const xml = buildSitemapXml(companyIds)
    writeFileSync(OUTPUT_PATH, xml, 'utf-8')
    console.log(`[sitemap] サイトマップを生成しました: ${OUTPUT_PATH} (企業${companyIds.length}件)`)
  } catch (err) {
    console.error('[sitemap] 予期しないエラーが発生しました:', err)
    if (backup !== null) {
      writeFileSync(OUTPUT_PATH, backup, 'utf-8')
      console.log('[sitemap] 既存のサイトマップを復元しました。')
    }
  }
}

// スクリプトとして直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap()
}
