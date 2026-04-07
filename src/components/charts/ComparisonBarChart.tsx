import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import type { Company } from '../../types/company'
import { getScoreHex } from '../../utils/scoring'

interface ComparisonBarChartProps {
  companies: Company[]
  onBarClick?: (companyId: string) => void
}

// 一覧の比較用ランキングチャート。
// 棒クリックを詳細遷移の入口としても使える。
export default function ComparisonBarChart({ companies, onBarClick }: ComparisonBarChartProps) {
  // recharts に渡す表示専用データへ変換する。
  const data = companies.map((c) => ({
    id: c.id,
    name: c.name,
    happinessScore: c.happinessScore,
    fill: getScoreHex(c.happinessScore),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12, fill: '#374151' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [`${Number(value).toFixed(1)}点`, '幸福度スコア']}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
          }}
          cursor={{ fill: '#f3f4f6' }}
        />
        <Bar
          dataKey="happinessScore"
          radius={[0, 6, 6, 0]}
          maxBarSize={28}
          onClick={onBarClick ? (entry) => onBarClick((entry as { id: string }).id) : undefined}
          style={onBarClick ? { cursor: 'pointer' } : undefined}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
