import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import { ObservaSusSectionHeader } from '../components/ObservaSusSectionHeader';
import { ObservaSusFileList } from '../components/ObservaSusFileList';
import { useObservaSusResources } from '../hooks/useObservaSusResources';

export function ObservaSusRepositoryPage() {
  const { data, isLoading, isError } = useObservaSusResources({
    type: 'DATASET',
    system: 'GERAL',
    limit: 100,
  });

  return (
    <ObservaSusLayout breadcrumbSuffix={[{ label: 'Repositório' }]}>
      <Link
        to="/observasus/dados"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao DataStorage
      </Link>

      <ObservaSusSectionHeader
        eyebrow="Repositório"
        title="Repositório de Dados"
        description="Espaço centralizado para bases, relatórios e documentos institucionais do ObservaSUS.PA."
      />

      <ObservaSusFileList
        resources={data?.items ?? []}
        isLoading={isLoading}
        error={isError ? 'Não foi possível carregar o repositório.' : null}
        emptyMessage="Nenhum arquivo no repositório no momento."
      />
    </ObservaSusLayout>
  );
}

export default ObservaSusRepositoryPage;
