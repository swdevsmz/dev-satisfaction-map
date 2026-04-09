import * as cheerio from 'cheerio'
import type { ScrapedDocument } from '../types.js'

// OpenWork の企業IDマッピング（companyId → openwork m_id）
// URL形式: https://www.openwork.jp/company_answer.php?m_id=<ID>
const OPENWORK_ID_MAP: Record<string, string> = {
  'mercari-jp':      'a0C1000000s1nIR',
  'cyberagent':      'a0910000000Fr7M',
  'rakuten':         'a0910000000Fr7P',
  'line-corp':       'a0910000000G1So',
  'freee':           'a0C1000000sgO4l',
  'money-forward':   'a0C1000000sgO47',
  'wealthnavi':      'a0C1000000vBCLp',
  'sakura-internet': 'a0910000000G18o',
  // 必要に応じて追加
}

function toEnvCompanyKey(companyId: string): string {
  return companyId.toUpperCase().replaceAll(/[^A-Z0-9]/g, '_')
}

function parseJsonUrlMap(): Record<string, string | string[]> {
  const raw = process.env.OPENWORK_URL_MAP?.trim()
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string | string[]>
    }
  } catch {
    // JSONが壊れていてもデフォルト探索を継続
  }

  return {}
}

function resolveCandidateUrls(companyId: string): string[] {
  const candidates: string[] = []
  const companyKey = toEnvCompanyKey(companyId)

  // 優先1: 会社ごとの明示URL（OPENWORK_URL_MERCARI_JP など）
  const directUrl = process.env[`OPENWORK_URL_${ companyKey }`]?.trim()
  if (directUrl) candidates.push(directUrl)

  // 優先2: JSONマップ（OPENWORK_URL_MAP='{"mercari-jp": "https://..."}'）
  const fromJson = parseJsonUrlMap()[companyId]
  if (typeof fromJson === 'string' && fromJson.trim()) {
    candidates.push(fromJson.trim())
  } else if (Array.isArray(fromJson)) {
    for (const url of fromJson) {
      if (typeof url === 'string' && url.trim()) candidates.push(url.trim())
    }
  }

  // m_id ベースURL（新形式）— company.php を優先（評価・残業・離職データあり）
  const openworkId = OPENWORK_ID_MAP[companyId]
  if (openworkId) {
    candidates.push(`https://www.openwork.jp/company.php?m_id=${ openworkId }`)
    candidates.push(`https://www.openwork.jp/company_answer.php?m_id=${ openworkId }`)
  }

  return [...new Set(candidates)]
}

function buildHeaders(acceptTos: boolean): Record<string, string> {
  const cookie = process.env.OPENWORK_COOKIE?.trim()
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    Referer: 'https://www.openwork.jp/',
    DNT: '1',
    'Upgrade-Insecure-Requests': '1',
  }

  if (acceptTos) {
    // 利用規約確認済みを明示
    headers['X-Accept-Tos'] = 'true'
  }

  if (cookie) {
    headers.Cookie = cookie
  }

  return headers
}

async function fetchFirstAvailablePage(urls: string[], headers: Record<string, string>) {
  const tried: Array<{ url: string; status: number; statusText: string }> = []

  for (const url of urls) {
    let res: Response
    try {
      res = await fetch(url, { headers, redirect: 'follow' })
    } catch {
      tried.push({ url, status: 0, statusText: 'NETWORK_ERROR' })
      continue
    }

    if (res.ok) {
      const html = await res.text()
      return { url, html, tried }
    }

    tried.push({ url, status: res.status, statusText: res.statusText })
  }

  return { url: null, html: null, tried }
}

function hasBlockedOrErrorContent($: cheerio.CheerioAPI): boolean {
  const title = $('title').text().trim()
  return (
    /403|forbidden|access denied/i.test(title) ||
    /404|not found|エラーが発生しました/i.test(title) ||
    /アクセスを拒否|captcha|ロボット/i.test(title)
  )
}

function pushRatingLines(lines: string[], $: cheerio.CheerioAPI) {
  const seen = new Set<string>()
  const wantedLabels = [
    '総合評価スコア',
    '残業時間（月間）',
    '有給休暇消化率',
    '待遇面の満足度',
    '社員の士気',
    '風通しの良さ',
    '社員の相互尊重',
    '20代成長環境',
    '人材の長期育成',
    '法令順守意識',
    '人事評価の適正感',
  ]
  const labelSeen = new Set<string>()

  // JSON-LD から総合評価スコアを抽出
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text()) as Record<string, unknown>
      if (json['@type'] === 'EmployerAggregateRating' && json.ratingValue) {
        const row = `総合評価スコア（5点満点）: ${ json.ratingValue }`
        if (!seen.has(row)) { lines.push(row); seen.add(row) }
      }
    } catch { /* ignore */ }
  })

  const categoryRows = $('.evaluate_category_list li, .evaluation_list li, [class*="category"] li')
  categoryRows.each((_, el) => {
    const label = $(el).find('.label, [class*="label"]').first().text().trim()
    const score = $(el).find('.point, [class*="point"]').first().text().trim()
    if (!label || !score) return
    const row = `${ label }: ${ score }`
    if (!seen.has(row)) { lines.push(row); seen.add(row) }
  })

  // dt/dd 形式のデータ（残業時間など）— 最初の値のみ取得
  $('dt').each((_, dt) => {
    const label = $(dt).text().trim()
    if (!label) return
    if (!wantedLabels.some((wanted) => label.includes(wanted))) return
    const ddText = $(dt).next('dd').find('span.fs-14, span').first().text().trim()
      || $(dt).next('dd').text().trim()
    if (!ddText || ddText.length > 50) return
    if (ddText === '--') return
    const normalizedLabel = wantedLabels.find((wanted) => label.includes(wanted)) ?? label
    if (labelSeen.has(normalizedLabel)) return
    const row = `${ label }: ${ ddText }`
    if (!seen.has(row)) { lines.push(row); seen.add(row) }
    labelSeen.add(normalizedLabel)
  })
}

function pushReviewLines(lines: string[], $: cheerio.CheerioAPI) {
  let reviewCount = 0

  $('.review_list .review_item, .answerList .answerBox, [class*="review"] [class*="item"]').each((_, el) => {
    if (reviewCount >= 5) return false

    const title = $(el).find('.review_title, .title, h3').first().text().trim() || '口コミ'
    const body =
      $(el).find('.review_body, .text, p').first().text().trim().replaceAll(/\s+/g, ' ').slice(0, 200)

    if (!body) return

    lines.push(`- ${ title }: ${ body }`)
    reviewCount++
  })

  if (reviewCount === 0) {
    lines.push('（口コミ本文は取得できませんでした。ログインが必要な可能性があります）')
  }
}

export async function scrapeOpenWork(
  companyId: string,
  acceptTos: boolean
): Promise<ScrapedDocument> {
  if (!acceptTos) {
    throw new Error(
      'OpenWork のスクレイピングには --accept-tos フラグが必要です。\n' +
      '利用前に https://www.openwork.jp/terms_of_use.php を確認してください。'
    )
  }

  const candidateUrls = resolveCandidateUrls(companyId)
  if (candidateUrls.length === 0) {
    return {
      companyId,
      source: 'openwork',
      url: null,
      content: [
        `企業ID: ${ companyId }`,
        `ソース: OpenWork（社員・元社員の口コミ）`,
        ``,
        `【データ取得不可】`,
        `OpenWork のURL候補がありません。`,
        `OPENWORK_URL_<COMPANY_ID> を pipeline.env に設定するか、OPENWORK_ID_MAP を更新してください。`,
      ].join('\n'),
    }
  }

  const headers = buildHeaders(acceptTos)
  const fetched = await fetchFirstAvailablePage(candidateUrls, headers)

  if (!fetched.html || !fetched.url) {
    const hint = process.env.OPENWORK_COOKIE
      ? 'Cookieは設定済みですが取得できません。OPENWORK_URL_<COMPANY_ID> に実在URLを設定して再実行してください。'
      : 'OPENWORK_COOKIE を設定したうえで再実行してください。'
    const tried = fetched.tried
      .map((t) => `${ t.status || 'ERR' } ${ t.statusText } ${ t.url }`)
      .join('\n')

    return {
      companyId,
      source: 'openwork',
      url: null,
      content: [
        `企業ID: ${ companyId }`,
        `ソース: OpenWork（社員・元社員の口コミ）`,
        ``,
        `【データ取得不可 - ログイン必須】`,
        hint,
        ``,
        `試行結果:`,
        tried,
        ``,
        `OpenWork の口コミデータを取得するには、ログイン済みCookieが必要です。`,
        `pipeline.env の OPENWORK_COOKIE にブラウザからコピーしたCookieを設定してください。`,
      ].join('\n'),
    }
  }

  const $ = cheerio.load(fetched.html)
  if (hasBlockedOrErrorContent($)) {
    return {
      companyId,
      source: 'openwork',
      url: fetched.url,
      content: [
        `企業ID: ${ companyId }`,
        `ソース: OpenWork（社員・元社員の口コミ）`,
        `URL: ${ fetched.url }`,
        ``,
        `【データ取得不可 - アクセスブロック】`,
        `ページは取得できましたが、エラーページまたはブロックページでした。`,
        `OPENWORK_COOKIE と OPENWORK_URL_<COMPANY_ID> を見直してください。`,
      ].join('\n'),
    }
  }

  const lines: string[] = [
    `企業ID: ${ companyId }`,
    `ソース: OpenWork（社員・元社員の口コミ）`,
    `URL: ${ fetched.url }`,
    ``,
    `【評価スコア】`,
  ]

  pushRatingLines(lines, $)
  lines.push('', '【口コミ抜粋（最新5件）】')
  pushReviewLines(lines, $)
  if (lines.length <= 7) {
    lines.push('（評価データが取得できませんでした。ログイン必須の可能性があります）')
  }

  return {
    companyId,
    source: 'openwork',
    url: fetched.url,
    content: lines.join('\n'),
  }
}
