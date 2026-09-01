import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import { ObservaSusSectionHeader } from '../components/ObservaSusSectionHeader';
import { ObservaSusFileList } from '../components/ObservaSusFileList';
import { getObservaSusPublications } from '../services/observasusService';
import { OBSERVASUS_PUBLICATIONS } from '../constants/observasusContent';
import { ObservaSusDocumentCard } from '../components/ObservaSusDocumentCard';

export function ObservaSusPublicationsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['observasus', 'publications'],
    queryFn: () => getObservaSusPublications({ limit: 100 }),
  });

  const hasApiItems = (data?.items.length ?? 0) > 0;

  return (
    <ObservaSusLayout breadcrumbSuffix={[{ label: 'Publicações' }]}>
      <Link
        to="/observasus"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao ObservaSUS
      </Link>

      <ObservaSusSectionHeader
        eyebrow="Conhecimento"
        title="Publicações e documentos"
        description="Central de notas técnicas, boletins, informes epidemiológicos, manuais e documentos metodológicos da vigilância em saúde."
      />

      {hasApiItems ? (
        <ObservaSusFileList
          resources={data!.items}
          isLoading={isLoading}
          error={isError ? 'Não foi possível carregar as publicações.' : null}
          emptyMessage="Nenhuma publicação disponível no momento."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {OBSERVASUS_PUBLICATIONS.map((doc) => (
            <ObservaSusDocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </ObservaSusLayout>
  );
}

export default ObservaSusPublicationsPage;
