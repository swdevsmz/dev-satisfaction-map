import { Link } from 'react-router-dom';
import type { Company } from '../../types/company';

interface RelatedCompaniesProps {
  currentCompany: Company;
  allCompanies: Company[];
  maxCount?: number;
}

export function RelatedCompanies({ currentCompany, allCompanies, maxCount = 4 }: RelatedCompaniesProps) {
  const related = allCompanies
    .filter((c) => c.id !== currentCompany.id)
    .sort((a, b) =>
      Math.abs(a.happinessScore - currentCompany.happinessScore) -
      Math.abs(b.happinessScore - currentCompany.happinessScore)
    )
    .slice(0, maxCount);

  if (related.length === 0) return null;

  const scoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <section aria-labelledby="related-companies-heading" className="mt-8">
      <h2 id="related-companies-heading" className="text-lg font-semibold text-gray-800 mb-4">
        他の企業も見る
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map((company) => (
          <li key={company.id}>
            <Link
              to={`/company/${company.id}`}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="font-medium text-gray-800 text-sm">{company.name}</span>
              <span className={`text-sm font-bold ${scoreColor(company.happinessScore)}`}>
                {company.happinessScore}点
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
