import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadObservaSusResource } from '../services/observasusService';
import type { ObservaSusResource } from '../types/observasus';

export function useObservaSusDownload() {
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (resource: ObservaSusResource) => {
      if (!resource.hasFile) return;
      setError(null);
      setDownloadingId(resource.id);
      try {
        const filename = resource.originalFileName ?? `${resource.slug}.bin`;
        await downloadObservaSusResource(resource.id, filename);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          navigate('/login', { state: { from: window.location.pathname } });
          setError('Faça login para baixar este arquivo.');
          return;
        }
        if (status === 403) {
          setError('Você não tem permissão para baixar este arquivo.');
          return;
        }
        setError('Não foi possível baixar o arquivo. Tente novamente.');
      } finally {
        setDownloadingId(null);
      }
    },
    [navigate]
  );

  return { download, downloadingId, error, clearError: () => setError(null) };
}
