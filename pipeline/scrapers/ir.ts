import type { ScrapedDocument } from '../types.js'

// companyId → IR資料ページURLのマッピング
const IR_URL_MAP: Record<string, string> = {
  'mercari-jp':      'https://about.mercari.com/ir/',
  'cyberagent':      'https://www.cyberagent.co.jp/ir/',
  'rakuten':         'https://global.rakuten.com/corp/investor/',
  'freee':           'https://corp.freee.co.jp/ir/',
  'money-forward':   'https://corp.moneyforward.com/ir/',
  'wealthnavi':      'https://corp.wealthnavi.com/ir/',
  'sakura-internet': 'https://www.sakura.ad.jp/corporate/ir/',
}

export async function scrapeIR(companyId: string): Promise<ScrapedDocument> {
  const url = IR_URL_MAP[companyId] ?? null

  if (!url) {
    return {
      companyId,
      source: 'ir',
      url: null,
      content: [
        `企業ID: ${companyId}`,
        `ソース: IR（投資家向け情報）`,
        ``,
        `【データ取得不可】`,
        `IR URLのマッピングが未登録です。IR_URL_MAP に追加してください。`,
      ].join('\n'),
    }
  }

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; dev-satisfaction-map-pipeline/1.0)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
  } catch {
    return {
      companyId,
      source: 'ir',
      url,
      content: [
        `企業ID: ${companyId}`,
        `ソース: IR（投資家向け情報）`,
        `URL: ${url}`,
        ``,
        `【データ取得不可 - ネットワークエラー】`,
        `IR ページへの接続に失敗しました。`,
      ].join('\n'),
    }
  }

  if (!res.ok) {
    return {
      companyId,
      source: 'ir',
      url,
      content: [
        `企業ID: ${companyId}`,
        `ソース: IR（投資家向け情報）`,
        `URL: ${url}`,
        ``,
        `【データ取得不可 - HTTP ${res.status}】`,
        `IR ページを取得できませんでした（${res.status} ${res.statusText}）。`,
      ].join('\n'),
    }
  }

  return {
    companyId,
    source: 'ir',
    url,
    content: [
      `企業ID: ${companyId}`,
      `ソース: IR（投資家向け情報）`,
      `URL: ${url}`,
      ``,
      `【IR情報】`,
      `ページ取得成功 (HTTP ${res.status})`,
      `※ 詳細な財務・人事データの抽出は未実装です。Ollama に渡す前に手動でテキストを確認してください。`,
    ].join('\n'),
  }
}
