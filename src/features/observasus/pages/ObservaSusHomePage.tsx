import { Link } from 'react-router-dom';
import { ChevronRight, Loader2, Lock } from 'lucide-react';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import { ObservaSusHero } from '../components/ObservaSusHero';
import { ObservaSusSectionHeader } from '../components/ObservaSusSectionHeader';
import { ObservaSusPanelCard } from '../components/ObservaSusPanelCard';
import { ObservaSusResourceCard } from '../components/ObservaSusResourceCard';
import { ObservaSusDocumentCard } from '../components/ObservaSusDocumentCard';
import { ObservaSusQuickAccess } from '../components/ObservaSusQuickAccess';
import {
  OBSERVASUS_PUBLICATIONS,
  OBSERVASUS_QUICK_LINKS,
} from '../constants/observasusContent';
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
      <div className="space-y-16 sm:space-y-20 pb-12">
        <ObservaSusHero />

        <section aria-labelledby="about-observasus">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <ObservaSusSectionHeader
              eyebrow="Institucional"
              title="Sobre o ObservaSUS.PA"
              description="O ObservaSUS.PA reúne dados, indicadores e informações estratégicas para o monitoramento sistemático da situação de saúde do Estado do Pará. O observatório apoia as áreas técnicas da SESPA na identificação de problemas e prioridades, no planejamento das ações e serviços de saúde e na tomada de decisão orientada por evidências."
              action={
                <Link
                  to="/observasus/sobre"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Conheça o ObservaSUS
                  <ChevronRight className="h-4 w-4" />
                </Link>
              }
            />
          </div>
        </section>

        <section aria-labelledby="panels-section">
          <ObservaSusSectionHeader
            eyebrow="Indicadores"
            title="Painéis de Vigilância em Saúde"
            description="Conjuntos de indicadores estratégicos liberados para o seu perfil. Painéis restritos só aparecem se você tiver a role correspondente."
            action={
              <Link
                to="/observasus/paineis"
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Ver todos os painéis →
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
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 text-sm">
              Não foi possível carregar os painéis do servidor. Tente novamente em instantes.
            </div>
          )}

          {showPanelsFromApi && !isLoading && panels.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Lock className="h-5 w-5" />
              </div>
              <p className="font-semibold text-slate-900">Nenhum painel disponível para o seu perfil</p>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {panels.map((panel) => (
                <ObservaSusPanelCard key={panel.id} panel={panel} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="datastorage-section">
          <ObservaSusSectionHeader
            eyebrow="DataStorage"
            title="Bases e documentos por sistema"
            description="Acesso organizado aos arquivos dos principais sistemas de informação em saúde e ao repositório institucional."
            action={
              <Link
                to="/observasus/dados"
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Ver DataStorage completo →
              </Link>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {dataStorageSystems.map((system) => (
              <ObservaSusResourceCard key={system.id} resource={system} />
            ))}
          </div>
        </section>

        <section aria-labelledby="publications-section">
          <ObservaSusSectionHeader
            eyebrow="Conhecimento"
            title="Publicações e documentos"
            description="Notas técnicas, boletins, informes epidemiológicos, manuais e documentos metodológicos em um único repositório."
            action={
              <Link
                to="/observasus/publicacoes"
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Ver publicações →
              </Link>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OBSERVASUS_PUBLICATIONS.map((doc) => (
              <ObservaSusDocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </section>

        <section
          aria-labelledby="explore-section"
          className="rounded-3xl bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 px-6 py-10 sm:px-10 sm:py-12 shadow-xl shadow-blue-900/20"
        >
          <ObservaSusSectionHeader
            eyebrow="Ecossistema"
            title="Explore também o Saúde Pará"
            description="Recursos complementares já disponíveis no portal principal da Secretaria de Saúde Pública do Pará."
          />
          <ObservaSusQuickAccess links={OBSERVASUS_QUICK_LINKS} />
        </section>
      </div>
    </ObservaSusLayout>
  );
}

export default ObservaSusHomePage;
