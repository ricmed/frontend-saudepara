import { Link } from 'react-router-dom';
import { ChevronRight, Loader2, Lock } from 'lucide-react';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import { ObservaSusAboutBand } from '../components/ObservaSusAboutBand';
import { ObservaSusHero } from '../components/ObservaSusHero';
import { ObservaSusSectionHeader } from '../components/ObservaSusSectionHeader';
import { ObservaSusSectionShell } from '../components/ObservaSusSectionShell';
import { ObservaSusPanelCard } from '../components/ObservaSusPanelCard';
import { ObservaSusResourceCard } from '../components/ObservaSusResourceCard';
import { useObservaSusHome } from '../hooks/useObservaSusHome';
import {
  mapApiResourcesToPanels,
  mergeDataStorageSystems,
} from '../utils/observasusMerge';

export function ObservaSusHomePage() {
  const { data: homeData, isLoading, isError, isFetched } = useObservaSusHome();
  const dataStorageSystems = mergeDataStorageSystems(homeData?.dataStorage ?? []);
  const panels = mapApiResourcesToPanels(homeData?.panels ?? []);
  const showPanelsFromApi = isFetched && !isError;

  return (
    <ObservaSusLayout>
      <div className="space-y-14 pb-12 sm:space-y-16">
        <ObservaSusHero />

        <ObservaSusAboutBand />

        <ObservaSusSectionShell id="panels-section" className="observasus-enter-delay-2">
          <ObservaSusSectionHeader
            eyebrow="Indicadores"
            title="Painéis de Vigilância em Saúde"
            action={
              <Link
                to="/observasus/paineis"
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 ring-1 ring-blue-100 transition hover:bg-blue-100"
              >
                Ver todos
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />

          {isLoading && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
              Carregando painéis...
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              Não foi possível carregar os painéis do servidor. Tente novamente em instantes.
            </div>
          )}

          {showPanelsFromApi && !isLoading && panels.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Lock className="h-5 w-5" />
              </div>
              <p className="font-semibold text-slate-900">Nenhum painel disponível para o seu perfil</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Faça login ou solicite à administração a role de acesso ao sistema desejado
                (ex.: <code className="text-xs">observasus.download.sim</code>).
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Ir para o login →
              </Link>
            </div>
          )}

          {panels.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {panels.map((panel) => (
                <ObservaSusPanelCard key={panel.id} panel={panel} />
              ))}
            </div>
          )}
        </ObservaSusSectionShell>

        <ObservaSusSectionShell variant="tinted" id="datastorage-section" className="observasus-enter-delay-3">
          <ObservaSusSectionHeader
            eyebrow="DataStorage"
            title="Bases e documentos por sistema"
            description="Acesso organizado aos arquivos dos principais sistemas de informação em saúde e ao repositório institucional."
            action={
              <Link
                to="/observasus/dados"
                className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm ring-1 ring-slate-200 transition hover:ring-blue-200"
              >
                Ver completo
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dataStorageSystems.map((system) => (
              <ObservaSusResourceCard key={system.id} resource={system} />
            ))}
          </div>
        </ObservaSusSectionShell>
      </div>
    </ObservaSusLayout>
  );
}

export default ObservaSusHomePage;
