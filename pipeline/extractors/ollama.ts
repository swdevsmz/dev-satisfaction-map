import type { ExtractedScores } from '../types.js'

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma2'

export async function extractScores(content: string): Promise<ExtractedScores> {
  const prompt = `以下の企業情報テキストから指標を抽出し、JSONのみ返してください。
値が不明な場合は null にしてください。コードブロックや説明文は不要です。

テキスト:
${content}

JSON形式:
{
  "tech_stack_modernity": null,
  "remote_rate": null,
  "estimated_overtime_hours": null,
  "turnover_rate": null,
  "retention_rate": null,
  "dev_environment": null,
  "skill_up_support": null,
  "description": null,
  "tags": null
}

各フィールドの意味:
- tech_stack_modernity: 技術スタックの新しさ（1-10の整数）
- remote_rate: リモートワーク率（0-100の整数）
- estimated_overtime_hours: 月間残業時間（0以上の整数）
- turnover_rate: 離職率（0-100の整数）
- retention_rate: 定着率（0-100の整数）
- dev_environment: 開発環境の良さ（1-10の整数）
- skill_up_support: スキルアップ支援の充実度（1-10の整数）
- description: 企業の特徴を1-2文で説明した日本語テキスト
- tags: 関連する技術・文化キーワードの配列（例: ["Go","Kubernetes","フルリモート"]）`

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.1 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const raw: string = data.response ?? ''

  // コードブロックを除去してJSONをパース
  const jsonText = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  let parsed: Partial<ExtractedScores>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error(`Ollama の出力をJSONとしてパースできませんでした:\n${raw}`)
  }

  return {
    tech_stack_modernity:     toIntOrNull(parsed.tech_stack_modernity, 1, 10),
    remote_rate:              toIntOrNull(parsed.remote_rate, 0, 100),
    estimated_overtime_hours: toIntOrNull(parsed.estimated_overtime_hours, 0, 999),
    turnover_rate:            toIntOrNull(parsed.turnover_rate, 0, 100),
    retention_rate:           toIntOrNull(parsed.retention_rate, 0, 100),
    dev_environment:          toIntOrNull(parsed.dev_environment, 1, 10),
    skill_up_support:         toIntOrNull(parsed.skill_up_support, 1, 10),
    description:              typeof parsed.description === 'string' ? parsed.description : null,
    tags:                     Array.isArray(parsed.tags)
      ? (parsed.tags as unknown[]).filter((t): t is string => typeof t === 'string')
      : null,
  }
}

function toIntOrNull(
  val: number | null | undefined,
  min: number,
  max: number
): number | null {
  if (val == null || typeof val !== 'number' || isNaN(val)) return null
  const n = Math.round(val)
  if (n < min || n > max) return null
  return n
}
