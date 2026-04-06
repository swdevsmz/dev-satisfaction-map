import * as cheerio from 'cheerio'
import type { ScrapedDocument } from '../types.js'

// companyId → Connpass グループサブドメイン名
const CONNPASS_GROUP_MAP: Record<string, string> = {
  'mercari-jp':      'mercari',
  'cyberagent':      'cyberagent',
  'rakuten':         'rakuten',
  'line-corp':       'line',
  'freee':           'freee-development',
  'gmo-internet':    'gmo',
  'mixi':            'mixi',
  'cookpad':         'cookpad',
  'wantedly':        'wantedly',
  'money-forward':   'moneyforward',
  'wealthnavi':      'wealthnavi',
  'sakura-internet': 'sakura',
  // 追加: companyId に対応するグループ名を登録
  'smarthr':            'smarthr',
  'dena':               'dena',
  'gree':               'gree',
  'gunosy':             'gunosy',
  'chatwork':           'chatwork',
  'visional':           'visional',
  'sansan':             'sansan',
  'uzabase':            'uzabase',
  'base':               'baseinc',
  'zozo':               'zozo',
  'layerx':             'layerx',
  'findy':              'findy',
  'crowdworks':         'crowdworks',
  'coconala':           'coconala',
  'ubie':               'ubie',
  'timee':              'timee',
  'recruit':            'recruit',
  'nttdata':            'nttdata',
  'dwango':             'dwango',
  'monotaro':           'monotaro',
  'retty':              'retty',
  'classi':             'classi',
  'smartnews':          'smartnews',
  'speee':              'speee',
  'eureka':             'eureka',
  'preferred-networks': 'preferred-networks',
  'plaid':              'plaid',
  'appier':             'appier',
  'treasure-data':      'treasuredata',
  'hamee':              'hamee',
  'yappli':             'yappli',
  'gmo-pg':             'gmo-pg',
  'fujitsu':            'fujitsu',
  'nec':                'nec',
  'tis':                'tis',
  'scsk':               'scsk',
  'aucfan':             'aucfan',
  'kaizen-platform':    'kaizen-platform',
  'medpeer':            'medpeer',
  'caddi':              'caddi',
  'nintendo':          'nintendo',
  'capcom':            'capcom',
  'omron':             'omron',
  'rakus':             'rakus',
  'ntt-west':          'nttwest',
  'sharp':             'sharp',
  'kyocera':           'kyocera',
  'murata':            'murata',
  'iridge':            'iridge',
  'aiming':            'aiming',
  'medley':            'medley',
  'lifull':            'lifull',
  'brainpad':          'brainpad',
  'usetech':           'usetech',
  'daikin':            'daikin',
  'panasonic-connect': 'panasonic',
  'ines':              'ines',
  'system-exe':        'system-exe',
  'osaka-gas':         'osakagas',
  'techfirm':          'techfirm',
}

const ONE_YEAR_AGO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
  Referer: 'https://connpass.com/',
}

interface ConnpassEvent {
  title: string
  url: string
  startedAt: Date | null
  capacity: number | null
}

// グループページ（例: mercari.connpass.com/event/）をパース
function parseGroupPage($: cheerio.CheerioAPI): ConnpassEvent[] {
  const events: ConnpassEvent[] = []

  $('.group_event_list, .vevent').each((_, el) => {
    const title = $(el).find('.event_title').text().trim()
    const url   = $(el).find('a.image_link, a[href*="/event/"]').first().attr('href') ?? ''

    // ISO日時は span.dtstart span.value-title[title] に格納されている
    const dtRaw = $(el).find('.dtstart .value-title').attr('title') ?? ''
    const startedAt = dtRaw ? new Date(dtRaw) : null

    // 定員（"50 人 まで" のような表記）
    const capText = $(el).find('.event_participants').text().trim()
    const capMatch = capText.match(/(\d+)/)
    const capacity = capMatch ? Number(capMatch[1]) : null

    if (title) events.push({ title, url, startedAt, capacity })
  })

  return events
}

async function fetchGroupPage(groupSlug: string): Promise<ConnpassEvent[] | null> {
  const url = `https://${groupSlug}.connpass.com/event/`
  let res: Response
  try {
    res = await fetch(url, { headers: HEADERS })
  } catch {
    return null
  }
  if (!res.ok) return null

  const html = await res.text()
  const $ = cheerio.load(html)
  const events = parseGroupPage($)
  return events.length > 0 ? events : null
}

// 検索ページ fallback（JS非依存の静的部分のみ）
async function fetchSearchPage(keyword: string): Promise<ConnpassEvent[] | null> {
  const url = `https://connpass.com/search/?keyword=${encodeURIComponent(keyword)}&order=2`
  let res: Response
  try {
    res = await fetch(url, { headers: HEADERS })
  } catch {
    return null
  }
  if (!res.ok) return null

  const html = await res.text()
  const $ = cheerio.load(html)

  // 検索ページは JSON-LD を持つ場合がある
  const events: ConnpassEvent[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text()) as unknown
      const nodes = Array.isArray(parsed)
        ? parsed
        : ((parsed as Record<string, unknown>)['@graph'] as unknown[] | undefined) ?? [parsed]
      for (const n of nodes as Record<string, unknown>[]) {
        if (n['@type'] !== 'Event') continue
        const title = typeof n.name === 'string' ? n.name : null
        const url   = typeof n.url  === 'string' ? n.url  : ''
        const startedAt = typeof n.startDate === 'string' ? new Date(n.startDate) : null
        if (title) events.push({ title, url, startedAt, capacity: null })
      }
    } catch { /* ignore */ }
  })

  return events.length > 0 ? events : null
}

/** イベント開催頻度から skill_up_support スコアを推定（1–10） */
function estimateSkillUpSupport(recentCount: number): number {
  if (recentCount === 0)  return 1
  if (recentCount <= 2)   return 3
  if (recentCount <= 5)   return 5
  if (recentCount <= 10)  return 7
  return 9
}

/** イベントタイトルから技術キーワードを抽出 */
function extractTechTags(events: ConnpassEvent[]): string[] {
  const TECH_PATTERN =
    /\b(Go|Rust|Python|TypeScript|JavaScript|Kotlin|Swift|Java|Ruby|PHP|C\+\+|React|Vue|Next\.js|Flutter|Kubernetes|k8s|Docker|AWS|GCP|Azure|ML|AI|LLM|RAG|生成AI|機械学習|データ基盤|マイクロサービス|GraphQL|gRPC)\b/gi
  const tags = new Set<string>()
  for (const e of events) {
    for (const m of e.title.matchAll(TECH_PATTERN)) {
      tags.add(m[0].toLowerCase().replace('kubernetes', 'Kubernetes').replace('k8s', 'Kubernetes'))
    }
  }
  return [...tags].slice(0, 10)
}

function buildContent(companyId: string, events: ConnpassEvent[], sourceUrl: string): string {
  const recent = events.filter(e => e.startedAt && e.startedAt >= ONE_YEAR_AGO)
  const display = recent.length > 0 ? recent : events

  const avgCapacity = (() => {
    const countable = recent.filter(e => e.capacity != null)
    if (countable.length === 0) return 0
    return Math.round(countable.reduce((s, e) => s + e.capacity!, 0) / countable.length)
  })()

  const skillUpScore = estimateSkillUpSupport(recent.length)
  const techTags = extractTechTags(events)

  const lines = [
    `企業ID: ${companyId}`,
    `ソース: Connpass（勉強会活動）`,
    `URL: ${sourceUrl}`,
    `取得期間: 過去1年`,
    ``,
    `【勉強会開催実績】`,
    `開催件数（過去1年）: ${recent.length}件`,
    `平均定員数: ${avgCapacity}人`,
    ``,
    `【スコア推定値（LLM抽出用ヒント）】`,
    `skill_up_support推定: ${skillUpScore}/10（開催${recent.length}件から算出）`,
    techTags.length > 0 ? `技術タグ: ${techTags.join(', ')}` : '',
    ``,
    `【イベント一覧（最新10件）】`,
    ...display.slice(0, 10).map(
      e => `- ${e.title}（${e.startedAt?.toISOString().slice(0, 10) ?? '日付不明'}, 定員: ${e.capacity ?? '不明'}人）`
    ),
  ].filter(l => l !== undefined)

  if (events.length === 0) {
    lines.push('（イベント情報を取得できませんでした）')
  }

  return lines.join('\n')
}

export async function scrapeConnpass(companyId: string): Promise<ScrapedDocument> {
  // 1) グループページ優先
  const groupSlug = CONNPASS_GROUP_MAP[companyId]
  if (groupSlug) {
    const events = await fetchGroupPage(groupSlug)
    if (events) {
      const sourceUrl = `https://${groupSlug}.connpass.com/event/`
      return { companyId, source: 'connpass', url: sourceUrl, content: buildContent(companyId, events, sourceUrl) }
    }
  }

  // 2) キーワード検索 fallback
  const keyword = companyId.replace(/-(?:jp|co|inc|ltd|corp)$/i, '').replace(/-/g, ' ')
  const searchUrl = `https://connpass.com/search/?keyword=${encodeURIComponent(keyword)}&order=2`
  const events = await fetchSearchPage(keyword) ?? []

  return {
    companyId,
    source: 'connpass',
    url: searchUrl,
    content: buildContent(companyId, events, searchUrl),
  }
}
