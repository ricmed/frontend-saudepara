import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import { ObservaSusSectionHeader } from '../components/ObservaSusSectionHeader';
import { ObservaSusFileList } from '../components/ObservaSusFileList';
import { OBSERVASUS_DATA_SYSTEMS } from '../constants/observasusContent';
import { useObservaSusDataStorageSystem } from '../hooks/useObservaSusDataStorageSystem';

export function ObservaSusSystemPage() {
  const { systemSlug } = useParams<{ systemSlug: string }>();
  const systemMeta = OBSERVASUS_DATA_SYSTEMS.find((s) => s.slug === systemSlug);
  const { data, isLoading, isError } = useObservaSusDataStorageSystem(systemSlug, { limit: 100 });

  if (!systemMeta) {
    return (
      <ObservaSusLayout breadcrumbSuffix={[{ label: 'Sistema não encontrado' }]}>
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">Sistema não encontrado</p>
          <Link to="/observasus/dados" className="mt-4 inline-block text-blue-700 font-medium">
            Voltar ao DataStorage
          </Link>
        </div>
      </ObservaSusLayout>
    );
  }

  return (
    <ObservaSusLayout
      breadcrumbSuffix={[
        { label: 'DataStorage', to: '/observasus/dados' },
        { label: systemMeta.title },
      ]}
    >
      <Link
        to="/observasus/dados"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao DataStorage
      </Link>

      <ObservaSusSectionHeader
        eyebrow={systemMeta.subtitle}
        title={systemMeta.title}
        description={systemMeta.description}
      />

      <ObservaSusFileList
        resources={data?.items ?? []}
        isLoading={isLoading}
        error={isError ? 'Não foi possível carregar os arquivos deste sistema.' : null}
        emptyMessage={`Nenhum arquivo disponível para ${systemMeta.title} no momento.`}
      />
    </ObservaSusLayout>
  );
}

export default ObservaSusSystemPage;
