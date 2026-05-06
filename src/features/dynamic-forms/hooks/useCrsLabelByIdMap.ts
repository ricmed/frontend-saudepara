import axios from 'axios';
import { useEffect, useState } from 'react';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';

/**
 * Mapa id_crs → nome da regional (ex.: "11ª CRS (Marabá)"), a partir de `/api/crs/select`.
 * Usado em relatórios/listas onde `data_json` só guarda `cabecalho.crs_id`.
 */
export function useCrsLabelByIdMap(enabled: boolean): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<Array<{ value: number; label: string }>>(`${getRuntimeApiRoot()}/crs/select`, {
          withCredentials: true,
        });
        if (cancelled || !Array.isArray(data)) return;
        const next: Record<string, string> = {};
        for (const row of data) {
          next[String(row.value)] = row.label;
        }
        setMap(next);
      } catch {
        /* mantém {} — UI mostra só o id */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return map;
}
