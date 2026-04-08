import { useState, useEffect } from 'react'
import type { CompanyScores, UserWeights } from '../../types/company'
import { calculatePersonalScore, getScoreColor } from '../../utils/scoring'
import { loadUserWeights, saveUserWeights, resetUserWeights, validateUserWeights } from '../../utils/user-weights'

interface PersonalScoreAdjusterProps {
  scores: CompanyScores
}

interface MetricConfig {
  key: keyof UserWeights
  label: string
  description: string
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'techStackModernity',
    label: '技術スタックの新しさ',
    description: '最新のフレームワークや言語を使っているかで判断',
  },
  {
    key: 'remoteRate',
    label: 'リモート率',
    description: 'リモートで作業できる環境の充実度',
  },
  {
    key: 'estimatedOvertimeHours',
    label: '月間残業時間（推定）',
    description: '少ないほど良い',
  },
  {
    key: 'turnoverRate',
    label: '離職率（推定）',
    description: '低いほど良い',
  },
  {
    key: 'retentionRate',
    label: '定着率（推定）',
    description: '高いほど良い',
  },
  {
    key: 'devEnvironment',
    label: '開発環境スコア',
    description: 'IDE、ツール、インフラの充実度',
  },
  {
    key: 'skillUpSupport',
    label: 'スキルアップ支援度',
    description: '研修、勉強会、資格取得支援の充実度',
  },
]

const IMPORTANCE_LABELS = ['気にしない', 'やや重視', '重視', '最重視']

/**
 * PersonalScoreAdjuster: 7指標ごとのスライダーコンポーネント
 * ユーザーが重要度を0-3で設定でき、リアルタイムで
 * パーソナルスコアが計算・表示される。
 * Task 5.2: パーソナルスコア調整UIの実装
 */
export default function PersonalScoreAdjuster({ scores }: PersonalScoreAdjusterProps) {
  const [weights, setWeights] = useState<UserWeights>(() => loadUserWeights())
  const [personalScore, setPersonalScore] = useState<number>(() =>
    calculatePersonalScore(scores, loadUserWeights())
  )

  // Update personal score whenever weights or scores change
  useEffect(() => {
    setPersonalScore(calculatePersonalScore(scores, weights))
  }, [weights, scores])

  // Persist weights to localStorage whenever they change
  useEffect(() => {
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
    if (totalWeight === 0) {
      resetUserWeights()
    } else if (validateUserWeights(weights)) {
      saveUserWeights(weights)
    }
  }, [weights])

  const handleSliderChange = (metric: keyof UserWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [metric]: value,
    }))
  }

  const handleReset = () => {
    resetUserWeights()
    setWeights({
      techStackModernity: 0,
      remoteRate: 0,
      estimatedOvertimeHours: 0,
      turnoverRate: 0,
      retentionRate: 0,
      devEnvironment: 0,
      skillUpSupport: 0,
    })
  }

  const scoreColor = getScoreColor(personalScore)
  const colorMap = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">マッチスコア調整</h2>
          <p className="text-sm text-gray-500">重視する指標を選ぶことで、あなた向けのスコアを計算します</p>
        </div>

        {/* Personal Score Display */}
        <div
          data-testid="personal-score-container"
          className={`inline-flex items-center gap-1 px-4 py-2 rounded-2xl border font-bold whitespace-nowrap ${colorMap[scoreColor]}`}
        >
          <span data-testid="personal-score-display" className="text-2xl">
            {personalScore.toFixed(1)}
          </span>
          <span className="text-sm font-normal opacity-70">/ 100</span>
        </div>
      </div>

      {/* Slider Controls */}
      <div data-testid="slider-container" className="space-y-6 mb-6">
        {METRIC_CONFIGS.map((metric) => (
          <div key={metric.key} className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label
                  htmlFor={metric.key}
                  className="block text-sm font-medium text-gray-800 mb-0.5"
                >
                  {metric.label}
                </label>
                <p className="text-xs text-gray-500">{metric.description}</p>
              </div>
              <span className="text-xs font-semibold text-gray-600 ml-2 px-2 py-1 bg-gray-100 rounded">
                {IMPORTANCE_LABELS[weights[metric.key]]}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id={metric.key}
                type="range"
                min="0"
                max="3"
                step="1"
                value={weights[metric.key]}
                onChange={(e) => handleSliderChange(metric.key, parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <span className="text-xs text-gray-500 min-w-fit">
                {weights[metric.key]} / 3
              </span>
            </div>

            {/* Importance labels below slider */}
            <div className="flex justify-between text-xs text-gray-400 px-0.5">
              <span>{IMPORTANCE_LABELS[0]}</span>
              <span>{IMPORTANCE_LABELS[3]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reset Button */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          リセット
        </button>
        <p className="text-xs text-gray-500 flex items-center">
          デフォルト重みに戻します
        </p>
      </div>
    </div>
  )
}
