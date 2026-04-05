import { getScoreColor } from '../../utils/scoring'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'lg'
}

const colorMap = {
  green: 'bg-green-100 text-green-800 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  red: 'bg-red-100 text-red-800 border-red-200',
}

export default function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  const color = getScoreColor(score)

  if (size === 'lg') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-4 py-2 rounded-2xl text-2xl font-bold border ${colorMap[color]}`}
      >
        {score.toFixed(1)}
        <span className="text-sm font-normal opacity-70">/ 100</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold border ${colorMap[color]}`}
    >
      {score.toFixed(1)}
    </span>
  )
}
