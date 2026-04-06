import { SOURCE_LABEL, SOURCE_COLOR, SOURCE_TYPE, type SourceName } from '../../constants/sourceMetricMap'

interface SourceBadgeProps {
  source: SourceName
  acquired: boolean
  showType?: boolean
}

export default function SourceBadge({ source, acquired, showType = false }: SourceBadgeProps) {
  const label = SOURCE_LABEL[source]
  const type = SOURCE_TYPE[source]

  if (!acquired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-dashed border-gray-300 text-gray-400">
        {label}
        <span className="text-gray-300">未取得</span>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${SOURCE_COLOR[source]}`}>
      {label}
      {showType && (
        <span className="opacity-60">{type === 'actual' ? '実測' : '推定'}</span>
      )}
    </span>
  )
}
