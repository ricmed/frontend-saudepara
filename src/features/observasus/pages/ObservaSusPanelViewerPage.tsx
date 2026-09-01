import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Loader2, Lock } from 'lucide-react';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import { getObservaSusResourceBySlug } from '../services/observasusService';

/**
 * Viewer transitório: iframe Publish to Web (mesmo padrão do WordPress).
 * Layout immersive — o embed ocupa o máximo da viewport.
 * Fase 5 deve substituir por embed token via backend.
 */
export function ObservaSusPanelViewerPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['observasus', 'resource', slug],
    queryFn: () => getObservaSusResourceBySlug(slug),
    enabled: Boolean(slug),
  });

  const statusCode =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;

  return (
    <ObservaSusLayout
      immersive
      breadcrumbSuffix={[
        { label: 'Painéis', to: '/observasus/paineis' },
        { label: data?.title || 'Painel' },
      ]}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
          <Link
            to="/observasus/paineis"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Painéis</span>
          </Link>

          <div className="min-w-0 flex-1">
            {data ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{data.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {data.subtitle || data.system}
                  <span className="mx-1.5 text-slate-300">·</span>
                  Publish to Web (provisório)
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Carregando painel…</p>
            )}
          </div>

          {data?.externalUrl && (
            <a
              href={data.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Nova aba</span>
            </a>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-1 items-center justify-center gap-2 bg-white text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
            Carregando painel...
          </div>
        )}

        {isError && (
          <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {statusCode === 401 || statusCode === 403 ? (
              <span className="inline-flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Este painel exige autenticação ou permissão adicional.
              </span>
            ) : (
              'Não foi possível carregar este painel.'
            )}
          </div>
        )}

        {data?.externalUrl && (
          <iframe
            title={data.title}
            src={data.externalUrl}
            className="min-h-0 w-full flex-1 border-0 bg-white"
            allowFullScreen
          />
        )}

        {data && !data.externalUrl && (
          <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 text-center">
            <p className="font-semibold text-slate-900">Este item é um hub de painéis</p>
            <p className="mt-2 text-sm text-slate-600">
              Não há embed direto. Veja os subpainéis do sistema {data.system}.
            </p>
            <Link
              to={`/observasus/paineis?system=${data.system}`}
              className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Ver painéis de {data.system}
            </Link>
          </div>
        )}
      </div>
    </ObservaSusLayout>
  );
}

export default ObservaSusPanelViewerPage;
