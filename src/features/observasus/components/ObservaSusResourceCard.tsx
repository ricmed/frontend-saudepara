import { Link } from 'react-router-dom';
import { ChevronRight, Database, FileStack } from 'lucide-react';
import type { ObservaSusDataSystem } from '../types/observasus';
import { getObservaSusSystemAccent } from '../constants/observasusTheme';
import { formatObservaSusDate } from '../utils/observasusFormatters';
import { ObservaSusStatusBadge } from './ObservaSusStatusBadge';

interface ObservaSusResourceCardProps {
  resource: ObservaSusDataSystem;
}

export function ObservaSusResourceCard({ resource }: ObservaSusResourceCardProps) {
  const formattedDate = formatObservaSusDate(resource.lastUpdated);
  const accent = getObservaSusSystemAccent(resource.system);

  return (
    <Link
      to={resource.route}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 ${accent.cardHover} hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700`}
      aria-label={`${resource.title} — ${resource.subtitle}`}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ring-4 ${accent.iconBg} ${accent.iconText} ${accent.ring}`}
        >
          <Database className="h-5 w-5" aria-hidden />
        </div>
        <ObservaSusStatusBadge status={resource.status} />
      </div>

      <h3 className="text-lg font-bold text-slate-900">{resource.title}</h3>
      <p className={`mt-1 text-sm font-medium ${accent.eyebrow}`}>{resource.subtitle}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
        {resource.description}
      </p>

      {(resource.fileCount !== undefined || formattedDate) && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          {resource.fileCount !== undefined && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
              <FileStack className="h-3.5 w-3.5" aria-hidden />
              {resource.fileCount} arquivo{resource.fileCount === 1 ? '' : 's'}
            </span>
          )}
          {formattedDate && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1">
              Atualizado em {formattedDate}
            </span>
          )}
        </div>
      )}

      <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-700 bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:border-blue-700 group-hover:bg-white group-hover:text-blue-700">
        Acessar
        <ChevronRight className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  );
}
