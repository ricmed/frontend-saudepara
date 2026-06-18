import axios from 'axios';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';

export type MunicipioLabelMaps = {
  byIbge: Record<string, string>;
  byId: Record<string, string>;
};

function indexIbge(map: Record<string, string>, codigo: unknown, label: string) {
  const digits = String(codigo ?? '').replace(/\D/g, '');
  if (!digits || !label) return;
  map[digits] = label;
  if (digits.length > 6) map[digits.slice(-7)] = label;
}

export async function loadMunicipioLabelMaps(): Promise<MunicipioLabelMaps> {
  const maps: MunicipioLabelMaps = { byIbge: {}, byId: {} };
  try {
    const { data } = await axios.get<Array<Record<string, unknown>>>(
      `${getRuntimeApiRoot()}/tipo-municipio/select`,
      { withCredentials: true },
    );
    if (!Array.isArray(data)) return maps;
    for (const m of data) {
      const label = String(m.descricao ?? m.nome ?? '').trim() || undefined;
      if (!label) continue;
      const id = m.idtipo_municipio;
      if (id != null) maps.byId[String(id)] = label;
      indexIbge(maps.byIbge, m.codigo ?? m.codigo_ibge, label);
    }
  } catch {
    /* mantém mapas vazios */
  }
  return maps;
}

function ibgeLookupKeys(digits: string): string[] {
  if (!digits) return [];
  const keys = new Set<string>([digits]);
  if (digits.length > 6) {
    keys.add(digits.slice(-7));
    keys.add(digits.slice(-6));
  }
  // Corrige seeds antigos que prefixaram "1" em código PA de 6 dígitos (150140 → 1150140).
  if (digits.length === 7 && digits.startsWith('115')) {
    keys.add(digits.slice(1));
  }
  return [...keys];
}

export function resolveMunicipioLabel(
  ibgeOrId: string,
  maps: MunicipioLabelMaps,
): string {
  const key = String(ibgeOrId ?? '').trim();
  if (!key) return 'Não informado';
  const digits = key.replace(/\D/g, '');
  for (const k of ibgeLookupKeys(digits)) {
    const byIbge = maps.byIbge[k];
    if (byIbge) return byIbge;
  }
  return (
    maps.byId[key] ??
    maps.byId[digits] ??
    `IBGE ${digits || key}`
  );
}
