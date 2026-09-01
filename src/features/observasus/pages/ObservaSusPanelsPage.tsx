import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import { ObservaSusSectionHeader } from '../components/ObservaSusSectionHeader';
import { ObservaSusPanelCard } from '../components/ObservaSusPanelCard';
import { useObservaSusResources } from '../hooks/useObservaSusResources';
import { mapApiResourcesToPanels } from '../utils/observasusMerge';
import type { ObservaSusSystem } from '../types/observasus';

const HUB_SLUGS = new Set(['painel-sim', 'painel-sinan']);

const SYSTEM_FILTERS: Array<{ value: '' | ObservaSusSystem; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'SIM', label: 'SIM' },
  { value: 'SINASC', label: 'SINASC' },
  { value: 'SINAN', label: 'SINAN' },
  { value: 'COVID_19', label: 'COVID-19' },
  { value: 'DEMOGRAFICO', label: 'Demográfico' },
  { value: 'PQAVS', label: 'PQA-VS' },
];

export function ObservaSusPanelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const systemParam = (searchParams.get('system') || '').toUpperCase();
  const systemFilter = SYSTEM_FILTERS.some((item) => item.value === systemParam)
    ? (systemParam as ObservaSusSystem)
    : undefined;

  const { data, isLoading, isError, isFetched } = useObservaSusResources({
    type: 'PANEL',
    system: systemFilter,
    limit: 100,
  });

  const panels = mapApiResourcesToPanels(data?.items ?? []).filter(
    (panel) => !HUB_SLUGS.has(panel.slug)
  );

  return (
    <ObservaSusLayout breadcrumbSuffix={[{ label: 'Painéis' }]}>
      <Link
        to="/observasus"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao ObservaSUS
      </Link>

      <ObservaSusSectionHeader
        eyebrow="Indicadores"
        title="Painéis de Indicadores"
        description="Lista filtrada pelo seu perfil de acesso. Painéis com visibilidade RESTRICTED só aparecem se você tiver a role exigida."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {SYSTEM_FILTERS.map((filter) => {
          const active = (systemFilter || '') === filter.value;
          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => {
                if (!filter.value) {
                  setSearchParams({});
                  return;
                }
                setSearchParams({ system: filter.value });
              }}
              className={
                active
                  ? 'rounded-full bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
          Carregando painéis...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Não foi possível carregar os painéis. Verifique se o backend está no ar.
        </div>
      )}

      {isFetched && !isError && !isLoading && panels.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Lock className="h-5 w-5" />
          </div>
          <p className="font-semibold text-slate-900">Nenhum painel disponível para o seu perfil</p>
          <p className="mt-2 mx-auto max-w-lg text-sm text-slate-600">
            Cadastre painéis em <strong>/admin/master/observasus</strong> (tipo PANEL) e defina a
            visibilidade.
          </p>
        </div>
      )}

      {panels.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {panels.map((panel) => (
            <ObservaSusPanelCard key={panel.id} panel={panel} />
          ))}
        </div>
      )}
    </ObservaSusLayout>
  );
}

export default ObservaSusPanelsPage;
