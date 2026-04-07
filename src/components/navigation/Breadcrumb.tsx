import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="パンくずリスト" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
              {isLast || !item.href ? (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-gray-900 font-medium' : ''}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="hover:text-blue-600 transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
