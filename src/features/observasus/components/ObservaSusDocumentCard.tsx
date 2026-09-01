import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, FileText } from 'lucide-react';
import type { ObservaSusPublication } from '../types/observasus';
import { ObservaSusStatusBadge } from './ObservaSusStatusBadge';

interface ObservaSusDocumentCardProps {
  document: ObservaSusPublication;
}

export function ObservaSusDocumentCard({ document }: ObservaSusDocumentCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {document.category === 'Manuais' ? (
            <BookOpen className="h-5 w-5" aria-hidden />
          ) : (
            <FileText className="h-5 w-5" aria-hidden />
          )}
        </div>
        <ObservaSusStatusBadge status={document.status} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {document.category}
      </p>
      <h3 className="mt-1 text-lg font-bold text-slate-900">{document.title}</h3>
      <p className="mt-2 flex-1 text-sm text-slate-600">{document.description}</p>
      <Link
        to="/observasus/publicacoes"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
      >
        Ver publicações
        <ChevronRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
