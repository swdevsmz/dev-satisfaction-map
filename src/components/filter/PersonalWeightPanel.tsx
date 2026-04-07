import type { UserWeights } from '../../types/company'

const LABELS: { key: keyof UserWeights; label: string; emoji: string }[] = [
  { key: 'techStackModernity',     label: '技術スタックの新しさ', emoji: '⚙️' },
  { key: 'remoteRate',             label: 'リモートワーク率',     emoji: '🏠' },
  { key: 'estimatedOvertimeHours', label: '残業の少なさ',         emoji: '⏰' },
  { key: 'turnoverRate',           label: '低離職率',             emoji: '👥' },
  { key: 'retentionRate',          label: '定着率',               emoji: '🌱' },
  { key: 'devEnvironment',         label: '開発環境の良さ',       emoji: '💻' },
  { key: 'skillUpSupport',         label: 'スキルアップ支援',     emoji: '📚' },
]

const LEVEL_LABELS = ['気にしない', '少し重視', '重視', '最重視']

interface PersonalWeightPanelProps {
  weights: UserWeights
  isPersonalized: boolean
  onUpdate: (key: keyof UserWeights, value: number) => void
  onReset: () => void
}

// ユーザーの価値観を重みとして入力するパネル。
export default function PersonalWeightPanel({
  weights,
  isPersonalized,
  onUpdate,
  onReset,
}: PersonalWeightPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">自分に合う企業を探す</h2>
          <p className="text-xs text-gray-400 mt-0.5">重視する項目を設定するとランキングが変わります</p>
        </div>
        {isPersonalized && (
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            リセット
          </button>
        )}
      </div>

      <div className="space-y-3">
        {LABELS.map(({ key, label, emoji }) => {
          const val = weights[key]
          return (
            <div key={key}>
              {/* ラベルと現在の重み段階をセットで見せる。 */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">
                  {emoji} {label}
                </span>
                <span className={`text-xs font-medium ${val === 0 ? 'text-gray-300' : 'text-green-600'}`}>
                  {LEVEL_LABELS[val]}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={val}
                onChange={(e) => onUpdate(key, Number(e.target.value))}
                className="w-full h-1.5 accent-green-500 cursor-pointer"
              />
            </div>
          )
        })}
      </div>

      {isPersonalized && (
        <p className="text-xs text-green-600 mt-4 text-center font-medium">
          ✓ パーソナルスコア順で表示中
        </p>
      )}
    </div>
  )
}
