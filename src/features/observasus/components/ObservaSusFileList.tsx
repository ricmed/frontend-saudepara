import { useMemo, useState } from 'react';
import { Search, Download, Lock, Loader2 } from 'lucide-react';
import type { ObservaSusResource } from '../types/observasus';
import { formatObservaSusDate, formatObservaSusStatus } from '../utils/observasusFormatters';
import { ObservaSusStatusBadge } from './ObservaSusStatusBadge';
import { useObservaSusDownload } from '../hooks/useObservaSusDownload';

interface ObservaSusFileListProps {
  resources: ObservaSusResource[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ObservaSusFileList({
  resources,
  isLoading = false,
  error = null,
  emptyMessage = 'Nenhum arquivo disponível no momento.',
}: ObservaSusFileListProps) {
  const [search, setSearch] = useState('');
  const { download, downloadingId, error: downloadError, clearError } = useObservaSusDownload();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return resources;
    return resources.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        (item.subtitle?.toLowerCase().includes(term) ?? false) ||
        (item.description?.toLowerCase().includes(term) ?? false)
    );
  }, [resources, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" aria-hidden />
        <span className="sr-only">Carregando arquivos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            clearError();
            setSearch(e.target.value);
          }}
          placeholder="Buscar arquivo..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {downloadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {downloadError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {filtered.map((resource) => {
              const updated = formatObservaSusDate(resource.updatedAt);
              const isDownloading = downloadingId === resource.id;
              const requiresAuth = resource.visibility !== 'PUBLIC';

              return (
                <li
                  key={resource.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <ObservaSusStatusBadge status={resource.status} />
                      {requiresAuth && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <Lock className="h-3 w-3" />
                          {resource.visibility === 'RESTRICTED' ? 'Restrito' : 'Login'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900">{resource.title}</h3>
                    {resource.subtitle && (
                      <p className="text-sm text-blue-700">{resource.subtitle}</p>
                    )}
                    {resource.description && (
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{resource.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {resource.originalFileName && <span>{resource.originalFileName}</span>}
                      <span>{formatFileSize(resource.fileSize)}</span>
                      {updated && <span>Atualizado em {updated}</span>}
                      <span>{formatObservaSusStatus(resource.status)}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {resource.hasFile ? (
                      <button
                        type="button"
                        onClick={() => download(resource)}
                        disabled={isDownloading || resource.status === 'COMING_SOON'}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Baixar
                      </button>
                    ) : resource.externalUrl ? (
                      <a
                        href={resource.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Acessar link
                      </a>
                    ) : resource.status === 'MIGRATING' ? (
                      <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900">
                        Em migração
                      </span>
                    ) : resource.status === 'COMING_SOON' ? (
                      <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600">
                        Em breve
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
