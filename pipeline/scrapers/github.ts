import type { ScrapedDocument } from '../types.js'

// companyId → GitHub org 名のマッピング
const GITHUB_ORG_MAP: Record<string, string> = {
  'mercari-jp':      'mercari',
  'cyberagent':      'cyberagent',
  'rakuten':         'rakuten',
  'line-corp':       'line',
  'freee':           'freee-accounting',
  'smarthr':         'kufu',
  'mixi':            'mixi-dev',
  'cookpad':         'cookpad',
  'wantedly':        'wantedly',
  'money-forward':   'moneyforward',
  'wealthnavi':      'wealthnavi',
  'sakura-internet': 'sakura-internet',
  'dena':               'dena',
  'gree':               'gree',
  'gunosy':             'gunosy',
  'chatwork':           'chatwork',
  'visional':           'visional-inc',
  'sansan':             'sansan-inc',
  'uzabase':            'uzabase',
  'base':               'baseinc',
  'zozo':               'zozotech',
  'layerx':             'layerxcom',
  'findy':              'findyteam',
  'crowdworks':         'crowdworks',
  'coconala':           'coconala',
  'ubie':               'ubie-oss',
  'timee':              'timee-inc',
  'recruit':            'recruit-tech',
  'nttdata':            'nttdata-oss',
  'dwango':             'dwango',
  'monotaro':           'monotaro',
  'retty':              'retty-inc',
  'classi':             'classi',
  'smartnews':          'smartnews',
  'speee':              'speee',
  'eureka':             'eureka',
  'preferred-networks': 'pfnet',
  'plaid':              'plaidev',
  'appier':             'appier',
  'treasure-data':      'treasure-data',
  'hamee':              'hamee-dev',
  'yappli':             'yappli',
  'gmo-pg':             'gmo-pg',
  'fujitsu':            'fujitsu',
  'nec':                'nec-oss',
  'tis':                'tis-oss',
  'scsk':               'scsk-oss',
  'aucfan':             'aucfan',
  'kaizen-platform':    'kaizen-platform',
  'medpeer':            'medpeer',
  'caddi':              'caddi-inc',
  'nintendo':          'niconicovideos',
  'capcom':            'capcom-research',
  'omron':             'omron-sinicx',
  'rakus':             'rakus',
  'sharp':             'sharp-official',
  'kyocera':           'kyocera-dev',
  'murata':            'murata-developer',
  'iridge':            'iridge',
  'aiming':            'aiming-inc',
  'medley':            'medley-inc',
  'lifull':            'lifull',
  'brainpad':          'brainpad',
  'daikin':            'daikin-industries',
  'panasonic-connect': 'panasonic-connect',
  'ines':              'ines-corp',
  'techfirm':          'techfirm',
}

const GITHUB_API = 'https://api.github.com'

const HEADERS: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'dev-satisfaction-map-pipeline/1.0',
  'X-GitHub-Api-Version': '2022-11-28',
}

interface GitHubOrg {
  public_repos: number
  followers: number
}

interface GitHubRepo {
  name: string
  language: string | null
  pushed_at: string
  stargazers_count: number
  fork: boolean
}

interface GitHubEvent {
  type: string
  created_at: string
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// モダン言語/フレームワーク判定
const MODERN_LANGS = new Set(['typescript', 'rust', 'go', 'kotlin', 'swift'])
const MID_LANGS = new Set(['python', 'javascript', 'ruby', 'scala', 'elixir'])
const LEGACY_LANGS = new Set(['php', 'perl', 'vba', 'cobol', 'fortran'])

function estimateTechStackModernity(repos: GitHubRepo[]): { score: number; topLangs: string[] } {
  const langCount = new Map<string, number>()
  for (const repo of repos) {
    if (repo.fork || !repo.language) continue
    const lang = repo.language.toLowerCase()
    langCount.set(lang, (langCount.get(lang) ?? 0) + 1)
  }

  const sorted = [...langCount.entries()].sort((a, b) => b[1] - a[1])
  const topLangs = sorted.slice(0, 8).map(([lang]) => lang)

  let score = 5 // ベーススコア

  const hasModern = topLangs.some(l => MODERN_LANGS.has(l))
  const hasMid = topLangs.some(l => MID_LANGS.has(l))
  const hasLegacy = topLangs.some(l => LEGACY_LANGS.has(l))
  const allLegacy = topLangs.length > 0 && topLangs.every(l => LEGACY_LANGS.has(l))

  if (hasModern) score += 2
  if (hasMid) score += 1
  if (allLegacy) score -= 2
  else if (hasLegacy && !hasModern) score -= 1

  return {
    score: Math.max(1, Math.min(10, score)),
    topLangs: sorted.slice(0, 10).map(([lang]) => lang),
  }
}

function estimateDevEnvironment(org: GitHubOrg, recentEventCount: number): number {
  let score = 3 // ベーススコア

  if (org.public_repos >= 50) score += 2
  else if (org.public_repos >= 20) score += 1

  if (recentEventCount >= 20) score += 3
  else if (recentEventCount >= 10) score += 2
  else if (recentEventCount >= 3) score += 1

  return Math.max(1, Math.min(10, score))
}

function countRecentEvents(events: GitHubEvent[]): number {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return events.filter(e => new Date(e.created_at) >= thirtyDaysAgo).length
}

export async function scrapeGithub(companyId: string): Promise<ScrapedDocument> {
  const orgName = GITHUB_ORG_MAP[companyId]
  if (!orgName) {
    return {
      companyId,
      source: 'github',
      url: null,
      content: [
        `企業ID: ${companyId}`,
        `ソース: GitHub（OSS活動）`,
        ``,
        `【データ取得不可】`,
        `GitHub org のマッピングが未登録です。GITHUB_ORG_MAP に追加してください。`,
      ].join('\n'),
    }
  }

  const orgUrl = `${GITHUB_API}/orgs/${orgName}`
  const reposUrl = `${GITHUB_API}/orgs/${orgName}/repos?per_page=100&sort=pushed`
  const eventsUrl = `${GITHUB_API}/orgs/${orgName}/events?per_page=30`

  const [org, repos, events] = await Promise.all([
    fetchJson<GitHubOrg>(orgUrl),
    fetchJson<GitHubRepo[]>(reposUrl),
    fetchJson<GitHubEvent[]>(eventsUrl),
  ])

  if (!org) {
    return {
      companyId,
      source: 'github',
      url: `https://github.com/${orgName}`,
      content: [
        `企業ID: ${companyId}`,
        `ソース: GitHub（OSS活動）`,
        `GitHub org: ${orgName}`,
        ``,
        `【データ取得不可】`,
        `GitHub API からorg情報を取得できませんでした（rate limit超過またはorg未存在）。`,
      ].join('\n'),
    }
  }

  const repoList = repos ?? []
  const eventList = events ?? []
  const recentEventCount = countRecentEvents(eventList)
  const { score: techScore, topLangs } = estimateTechStackModernity(repoList)
  const devEnvScore = estimateDevEnvironment(org, recentEventCount)

  // 最近pushされたリポジトリ上位10件
  const recentRepos = repoList
    .filter(r => !r.fork)
    .slice(0, 10)

  const lines = [
    `企業ID: ${companyId}`,
    `ソース: GitHub（OSS活動）`,
    `GitHub org: ${orgName}`,
    `URL: https://github.com/${orgName}`,
    ``,
    `【org概要】`,
    `公開リポジトリ数: ${org.public_repos}`,
    `フォロワー数: ${org.followers}`,
    `過去30日のイベント数: ${recentEventCount}`,
    ``,
    `【スコア推定値（LLM抽出用ヒント）】`,
    `tech_stack_modernity推定: ${techScore}/10`,
    `dev_environment推定: ${devEnvScore}/10`,
    topLangs.length > 0 ? `技術タグ: ${topLangs.join(', ')}` : '',
    ``,
    `【リポジトリ一覧（最新push順、上位10件）】`,
    ...recentRepos.map(
      r => `- ${r.name} [${r.language ?? 'N/A'}] stars:${r.stargazers_count} (pushed: ${r.pushed_at.slice(0, 10)})`
    ),
  ].filter(l => l !== undefined)

  if (repoList.length === 0) {
    lines.push('（公開リポジトリが見つかりませんでした）')
  }

  return {
    companyId,
    source: 'github',
    url: `https://github.com/${orgName}`,
    content: lines.join('\n'),
  }
}
