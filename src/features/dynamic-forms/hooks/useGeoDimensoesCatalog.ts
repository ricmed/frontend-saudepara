import axios from 'axios';
import { useEffect, useState } from 'react';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';
import type { GeoDimensoesCatalog } from '../utils/monitorOperGeoDimensoes';

/**
 * Catálogo geográfico PA (macrorregião / RS / integração + municípios).
 * GET /api/geo-dimensoes/catalog
 */
export function useGeoDimensoesCatalog(enabled: boolean): GeoDimensoesCatalog | null {
  const [catalog, setCatalog] = useState<GeoDimensoesCatalog | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<GeoDimensoesCatalog>(
          `${getRuntimeApiRoot()}/geo-dimensoes/catalog`,
          { withCredentials: true },
        );
        if (cancelled || !data || typeof data !== 'object') return;
        setCatalog({
          macrorregioes: Array.isArray(data.macrorregioes) ? data.macrorregioes : [],
          regioesSaude: Array.isArray(data.regioesSaude) ? data.regioesSaude : [],
          regioesIntegracao: Array.isArray(data.regioesIntegracao) ? data.regioesIntegracao : [],
          municipios: Array.isArray(data.municipios) ? data.municipios : [],
        });
      } catch {
        if (!cancelled) setCatalog(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return catalog;
}
