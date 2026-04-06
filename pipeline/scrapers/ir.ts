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
  'dena':               'https://dena.com/jp/ir/',
  'gree':               'https://corp.gree.net/jp/ja/ir/',
  'gunosy':             'https://gunosy.co.jp/ja/ir/',
  'chatwork':           'https://corp.chatwork.com/ja/ir/',
  'visional':           'https://visional.inc/ja/ir/',
  'sansan':             'https://jp.corp-sansan.com/ir/',
  'uzabase':            'https://uzabase.com/jp/ir/',
  'base':               'https://binc.jp/ir/',
  'zozo':               'https://corp.zozo.com/ir/',
  'crowdworks':         'https://crowdworks.co.jp/ir/',
  'coconala':           'https://coconala.co.jp/ir/',
  'recruit':            'https://recruit-holdings.com/ja/ir/',
  'nttdata':            'https://www.nttdata.com/jp/ja/ir/',
  'monotaro':           'https://ir.monotaro.com/',
  'plaid':              'https://plaid.co.jp/ir/',
  'appier':             'https://www.appier.com/ja/ir/',
  'hamee':              'https://hamee.co.jp/ir/',
  'yappli':             'https://yappli.co.jp/ir/',
  'gmo-pg':             'https://www.gmo-pg.com/ir/',
  'fujitsu':            'https://www.fujitsu.com/jp/investors/',
  'nec':                'https://jpn.nec.com/ir/',
  'tis':                'https://www.tis.co.jp/ir/',
  'scsk':               'https://www.scsk.jp/ir/',
  'aucfan':             'https://aucfan.com/ir/',
  'kaizen-platform':    'https://kaizenplatform.com/ir/',
  'medpeer':            'https://medpeer.co.jp/ir/',
  'nintendo':          'https://www.nintendo.co.jp/ir/',
  'capcom':            'https://www.capcom.co.jp/ir/',
  'omron':             'https://www.omron.com/jp/ja/ir/',
  'rakus':             'https://www.rakus.co.jp/ir/',
  'sharp':             'https://corporate.jp.sharp/ir/',
  'kyocera':           'https://www.kyocera.co.jp/ir/',
  'murata':            'https://corporate.murata.com/ja-jp/investor',
  'iridge':            'https://iridge.jp/ir/',
  'aiming':            'https://aiming-inc.com/ja/ir/',
  'medley':            'https://www.medley.jp/ir/',
  'lifull':            'https://lifull.com/ir/',
  'brainpad':          'https://www.brainpad.co.jp/ir/',
  'daikin':            'https://www.daikin.co.jp/investor/',
  'system-exe':        'https://www.system-exe.co.jp/ir/',
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
