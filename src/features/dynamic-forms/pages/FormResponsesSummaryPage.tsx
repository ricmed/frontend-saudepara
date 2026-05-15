import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { BarChart3 } from 'lucide-react';
import FormResponsesSummaryService, { type SummaryResponse } from '@/services/FormResponsesSummaryService';

export const FormResponsesSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const formId = Number(id);
  const responsesBackPath = location.pathname.includes('/meus-formularios/')
    ? `/private/meus-formularios/${formId}/respostas`
    : `/private/formularios-admin/respostas/${formId}`;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [status, setStatus] = useState<'submitted' | 'draft' | 'synced'>('submitted');

  const title = useMemo(() => data?.form?.nome || 'Resumo', [data?.form?.nome]);

  const load = async (s = status) => {
    try {
      setLoading(true);
      const res = await FormResponsesSummaryService.get(formId, { status: s, sampleLimit: 5000 });
      setData(res);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao carregar resumo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(formId)) return;
    load(status);
  }, [formId]);

  return (
    <AppPageLayout
      title="Resumo das respostas"
      subtitle={title}
      icon={<BarChart3 className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      backPath={responsesBackPath}
      headerActions={
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-sm text-white/90">Mostrar:</span>
          <div className="inline-flex rounded-lg bg-white/90 p-1 shadow">
            {(
              [
                { key: 'submitted', label: 'Enviadas' },
                { key: 'draft', label: 'Não enviadas' },
                { key: 'synced', label: 'Enviadas (offline)' },
              ] as const
            ).map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => {
                  setStatus(it.key);
                  load(it.key);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  status === it.key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-pressed={status === it.key}
                title={it.label}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando…</p>
        </div>
      ) : !data ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Sem dados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6 flex flex-wrap gap-6 items-center">
            <div>
              <div className="text-xs text-gray-600">
                Total (
                {status === 'submitted'
                  ? 'enviadas'
                  : status === 'draft'
                    ? 'não enviadas'
                    : 'enviadas no offline'}
                )
              </div>
              <div className="text-2xl font-bold text-gray-900">{data.total}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Analisadas (amostra)</div>
              <div className="text-2xl font-bold text-gray-900">{data.analyzed}</div>
            </div>
            <div className="text-sm text-gray-600">
              Mostrando até <strong>12</strong> valores mais frequentes por pergunta.
            </div>
            <div className="text-xs text-gray-500">
              <strong>Não enviadas</strong> são preenchimentos não finalizados. <strong>Enviadas (offline)</strong> foram enviadas
              automaticamente quando a internet voltou.
            </div>
          </div>

          {data.fields.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">Ainda não há respostas para resumir.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.fields.map((f) => {
                const max = Math.max(...f.top.map((t) => t.count), 1);
                return (
                  <div key={f.key} className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-semibold text-gray-900 mb-3">{f.label}</div>
                    <div className="space-y-2">
                      {f.top.map((t) => (
                        <div key={t.value} className="flex items-center gap-3">
                          <div className="w-40 text-xs text-gray-700 truncate" title={t.value}>
                            {t.value}
                          </div>
                          <div className="flex-1 h-2 bg-gray-100 rounded">
                            <div
                              className="h-2 bg-blue-600 rounded"
                              style={{ width: `${Math.round((t.count / max) * 100)}%` }}
                            />
                          </div>
                          <div className="w-10 text-xs text-gray-700 text-right">{t.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AppPageLayout>
  );
};

