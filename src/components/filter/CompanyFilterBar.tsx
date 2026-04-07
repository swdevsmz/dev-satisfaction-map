import { SCORE_THRESHOLDS, REMOTE_RATE_THRESHOLDS } from '../../hooks/useCompanyFilter'

interface CompanyFilterBarProps {
  keyword: string
  onKeywordChange: (k: string) => void
  minScore: number
  onScoreChange: (s: number) => void
  minRemoteRate: number
  onRemoteRateChange: (r: number) => void
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  availableTags: string[]
  activeCount: number
  isFiltered: boolean
  onReset: () => void
  filteredCount: number
  totalCount: number
}

// 一覧画面の絞り込み条件を一箇所にまとめたバー。
export default function CompanyFilterBar({
  keyword,
  onKeywordChange,
  minScore,
  onScoreChange,
  minRemoteRate,
  onRemoteRateChange,
  selectedTags,
  onTagToggle,
  availableTags,
  activeCount,
  isFiltered,
  onReset,
  filteredCount,
  totalCount,
}: CompanyFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4">
      {/* 上段は自由入力と全体状態の確認用。 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="企業名・説明・業種で検索"
            aria-label="企業を検索"
            data-testid="filter-keyword-input"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {isFiltered ? (
            <span className="text-green-600 font-medium">{filteredCount}</span>
          ) : (
            filteredCount
          )}
          /{totalCount}件
        </span>
        {isFiltered && (
          <button
            onClick={onReset}
            aria-label="フィルターをリセット"
            data-testid="filter-reset-button"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
          >
            ✕ リセット
            {activeCount > 0 && (
              <span className="bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 中段はよく使う閾値をワンタップで切り替える。 */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">スコア:</span>
          {SCORE_THRESHOLDS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onScoreChange(value)}
              aria-pressed={minScore === value}
              data-testid={`filter-score-button-${value}`}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                minScore === value
                  ? 'bg-green-500 border-green-500 text-white font-medium'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-green-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">リモート:</span>
          {REMOTE_RATE_THRESHOLDS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onRemoteRateChange(value)}
              aria-pressed={minRemoteRate === value}
              data-testid={`filter-remote-button-${value}`}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                minRemoteRate === value
                  ? 'bg-blue-500 border-blue-500 text-white font-medium'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 下段はタグのAND条件絞り込み。 */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((tag) => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                aria-pressed={active}
                data-testid={`filter-tag-button-${tag}`}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-gray-700 border-gray-700 text-white font-medium'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
