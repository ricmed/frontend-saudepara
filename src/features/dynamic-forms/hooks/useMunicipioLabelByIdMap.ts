import axios from 'axios';
import { useEffect, useState } from 'react';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_BASE = `${server}:${port}/api`;

/**
 * Mapa idtipo_municipio (string) → nome (descrição), via `/api/tipo-municipio/select`.
 * Usado no relatório do monitor operacional: `acao.municipios_alcancados` grava o id do município.
 */
export function useMunicipioLabelByIdMap(enabled: boolean): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<
          Array<{ idtipo_municipio?: number; descricao?: string; codigo?: string }>
        >(`${API_BASE}/tipo-municipio/select`, { withCredentials: true });
        if (cancelled || !Array.isArray(data)) return;
        const next: Record<string, string> = {};
        for (const m of data) {
          const id = m.idtipo_municipio;
          if (id == null) continue;
          const label = (m.descricao || '').trim();
          next[String(id)] = label || `Município ${id}`;
        }
        setMap(next);
      } catch {
        /* mantém {} — UI mostra fallback com id */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return map;
}
