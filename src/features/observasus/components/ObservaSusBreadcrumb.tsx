import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface ObservaSusBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function ObservaSusBreadcrumb({ items }: ObservaSusBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="hover:text-blue-700 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-slate-900 font-semibold' : 'font-medium'}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
