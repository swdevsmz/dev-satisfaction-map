import { Link } from 'react-router-dom'
import type { Company } from '../../types/company'
import ScoreBadge from './ScoreBadge'

interface CompanyCardProps {
  company: Company
  isSelected: boolean
  onClick: () => void
}

export default function CompanyCard({ company, isSelected, onClick }: CompanyCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 cursor-pointer p-5 ${
        isSelected
          ? 'border-green-500 ring-2 ring-green-500/20 shadow-md'
          : 'border-gray-200 hover:shadow-md hover:border-green-400'
      }`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <h3 className="font-bold text-lg text-gray-900 leading-tight">{company.name}</h3>
        <ScoreBadge score={company.happinessScore} size="sm" />
      </div>

      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{company.description}</p>

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
        <span>{company.industry}</span>
        <span>·</span>
        <span>{company.location}</span>
        <span>·</span>
        <span>{company.employeeCount.toLocaleString()}名</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {company.tags.map((tag) => (
          <span
            key={tag}
            className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      <Link
        to={`/company/${company.id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-4 block text-center text-sm text-green-700 hover:text-green-900 hover:underline font-medium"
      >
        詳細を見る →
      </Link>
    </div>
  )
}
