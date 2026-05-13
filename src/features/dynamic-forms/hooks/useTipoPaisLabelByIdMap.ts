import axios from 'axios';
import { useEffect, useState } from 'react';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';

/**
 * Mapa idtipo_pais → rótulo (código - descrição), via `/api/tipo-pais/select`.
 */
export function useTipoPaisLabelByIdMap(enabled: boolean): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<
          Array<{ idtipo_pais?: number; descricao?: string; codigo_pais?: string | null }>
        >(`${getRuntimeApiRoot()}/tipo-pais/select`, { withCredentials: true });
        if (cancelled || !Array.isArray(data)) return;
        const next: Record<string, string> = {};
        for (const m of data) {
          const id = m.idtipo_pais;
          if (id == null) continue;
          const desc = String(m.descricao ?? '').trim();
          const codRaw = m.codigo_pais != null ? String(m.codigo_pais).trim() : '';
          const codNorm = codRaw.replace(/\s/g, '');
          const codShown =
            codNorm && /^\d+$/.test(codNorm) ? String(parseInt(codNorm, 10)) : codRaw;
          const label = codShown && desc ? `${codShown} - ${desc}` : desc || `País ${id}`;
          next[String(id)] = label;
        }
        setMap(next);
      } catch {
        /* mantém {} */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return map;
}
