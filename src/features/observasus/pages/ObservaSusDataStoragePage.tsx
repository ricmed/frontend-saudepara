import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import { ObservaSusSectionHeader } from '../components/ObservaSusSectionHeader';
import { ObservaSusResourceCard } from '../components/ObservaSusResourceCard';
import { getObservaSusDataStorage } from '../services/observasusService';
import { mergeDataStorageSystems } from '../utils/observasusMerge';

export function ObservaSusDataStoragePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['observasus', 'datastorage', 'all'],
    queryFn: () => getObservaSusDataStorage({ limit: 100 }),
  });

  const systems = mergeDataStorageSystems(data?.items ?? []);
  const datasetSystems = systems.filter((s) => s.slug !== 'repositorio');
  const repository = systems.find((s) => s.slug === 'repositorio');

  return (
    <ObservaSusLayout breadcrumbSuffix={[{ label: 'DataStorage' }]}>
      <Link
        to="/observasus"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao ObservaSUS
      </Link>

      <ObservaSusSectionHeader
        eyebrow="DataStorage"
        title="Sistemas de Informação"
        description="Selecione um sistema para consultar arquivos, relatórios e bases disponíveis."
      />

      {isLoading ? (
        <p className="text-slate-600 mb-10">Carregando sistemas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {datasetSystems.map((system) => (
            <ObservaSusResourceCard key={system.id} resource={system} />
          ))}
        </div>
      )}

      {repository && (
        <>
          <ObservaSusSectionHeader
            title="Repositório de Dados"
            description="Conjunto centralizado de documentos institucionais do observatório."
          />
          <div className="max-w-xl">
            <ObservaSusResourceCard resource={repository} />
          </div>
        </>
      )}
    </ObservaSusLayout>
  );
}

export default ObservaSusDataStoragePage;
