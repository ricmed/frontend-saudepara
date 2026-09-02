import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ArrowLeft, ExternalLink, Loader2, Lock } from 'lucide-react';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import {
  getObservaSusPanelEmbed,
  getObservaSusResourceBySlug,
} from '../services/observasusService';

function getAxiosStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

/**
 * Viewer de painéis: metadados via slug; embed via endpoint protegido (Fase 5).
 */
export function ObservaSusPanelViewerPage() {
  const { slug = '' } = useParams<{ slug: string }>();

  const {
    data: meta,
    isLoading: metaLoading,
    isError: metaError,
    error: metaErrorObj,
  } = useQuery({
    queryKey: ['observasus', 'resource', slug],
    queryFn: () => getObservaSusResourceBySlug(slug),
    enabled: Boolean(slug),
  });

  const needsEmbed = Boolean(meta?.hasEmbed ?? meta?.externalUrl);
  const metaStatus = getAxiosStatus(metaErrorObj);

  const {
    data: embed,
    isLoading: embedLoading,
    isError: embedError,
    error: embedErrorObj,
  } = useQuery({
    queryKey: ['observasus', 'panel-embed', slug],
    queryFn: () => getObservaSusPanelEmbed(slug),
    enabled: Boolean(slug) && needsEmbed && !metaError,
    retry: (failureCount, error) => {
      const status = getAxiosStatus(error);
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });

  const embedStatus = getAxiosStatus(embedErrorObj);
  const accessDenied = metaStatus === 401 || metaStatus === 403 || embedStatus === 401 || embedStatus === 403;
  const isLoading = metaLoading || (needsEmbed && embedLoading && !metaError);

  return (
    <ObservaSusLayout
      immersive
      breadcrumbSuffix={[
        { label: 'Painéis', to: '/observasus/paineis' },
        { label: meta?.title || 'Painel' },
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
            {meta ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{meta.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {meta.subtitle || meta.system}
                  {meta.visibility !== 'PUBLIC' && (
                    <>
                      <span className="mx-1.5 text-slate-300">·</span>
                      Painel protegido
                    </>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Carregando painel…</p>
            )}
          </div>

          {embed?.embedUrl && (
            <a
              href={embed.embedUrl}
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

        {!isLoading && accessDenied && (
          <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {metaStatus === 403 || embedStatus === 403
                ? 'Você não tem permissão para visualizar este painel.'
                : 'Este painel exige autenticação.'}
            </span>
            {(metaStatus === 401 || embedStatus === 401) && (
              <p className="mt-3">
                <Link
                  to="/login"
                  className="font-semibold text-blue-700 underline hover:text-blue-800"
                >
                  Fazer login
                </Link>
              </p>
            )}
          </div>
        )}

        {!isLoading && !accessDenied && (metaError || (needsEmbed && embedError)) && (
          <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Não foi possível carregar este painel.
          </div>
        )}

        {!isLoading && !accessDenied && embed?.embedUrl && (
          <iframe
            title={embed.title || meta?.title || 'Painel'}
            src={embed.embedUrl}
            className="min-h-0 w-full flex-1 border-0 bg-white"
            allowFullScreen
          />
        )}

        {!isLoading && !accessDenied && meta && !needsEmbed && (
          <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 text-center">
            <p className="font-semibold text-slate-900">Este item é um hub de painéis</p>
            <p className="mt-2 text-sm text-slate-600">
              Não há embed direto. Veja os subpainéis do sistema {meta.system}.
            </p>
            <Link
              to={`/observasus/paineis?system=${meta.system}`}
              className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Ver painéis de {meta.system}
            </Link>
          </div>
        )}
      </div>
    </ObservaSusLayout>
  );
}

export default ObservaSusPanelViewerPage;
