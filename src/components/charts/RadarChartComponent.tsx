import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { Company } from '../../types/company'
import { toRadarData } from '../../utils/scoring'

interface RadarChartComponentProps {
  company: Company
  height?: number
}

// 7指標のバランスを俯瞰で見せるレーダーチャート。
export default function RadarChartComponent({ company, height = 300 }: RadarChartComponentProps) {
  // 表示用の項目名と値へ変換してから描画する。
  const data = toRadarData(company.scores)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: '#6b7280' }}
        />
        <Radar
          name={company.name}
          dataKey="value"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value) => [`${Number(value)}点`, '']}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
