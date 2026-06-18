import axios from 'axios';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';
import type { ReferenceLabelMaps } from '../types';

/** Remove prefixo "codigo - " retornado pelos endpoints /select (ex.: "4 - PARDA" → "PARDA"). */
export function formatSelectLabelForDisplay(label: string): string {
  const trimmed = label.trim();
  const withoutCode = trimmed.match(/^\d+\s*-\s*(.+)$/);
  return withoutCode ? withoutCode[1].trim() : trimmed;
}

export function buildReferenceMapFromSelectItems(
  items: Array<Record<string, unknown>>,
  idKey: string,
  labelKey: string,
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const item of items) {
    if (item.value != null && item.label != null) {
      const value = String(item.value).trim();
      const label = formatSelectLabelForDisplay(String(item.label));
      if (value && label) map[value] = label;
      continue;
    }

    const rawLabel = String(item[labelKey] ?? item.descricao ?? item.nome ?? item.label ?? '').trim();
    const id = item[idKey] ?? item.id ?? item.codigo ?? item.value;
    if (!rawLabel || id == null) continue;

    const label = formatSelectLabelForDisplay(rawLabel);
    map[String(id)] = label;

    const codigo = item.codigo != null ? String(item.codigo).trim() : '';
    if (codigo && codigo !== String(id)) {
      map[codigo] = label;
    }
  }

  return map;
}

async function loadSelectMap(
  endpoint: string,
  idKey: string,
  labelKey: string,
): Promise<Record<string, string>> {
  try {
    const { data } = await axios.get<Array<Record<string, unknown>>>(
      `${getRuntimeApiRoot()}/${endpoint}`,
      { withCredentials: true },
    );
    if (!Array.isArray(data)) return {};
    return buildReferenceMapFromSelectItems(data, idKey, labelKey);
  } catch {
    return {};
  }
}

export async function loadReferenceLabelMaps(): Promise<ReferenceLabelMaps> {
  const [raca, escolaridade] = await Promise.all([
    loadSelectMap('tipo-raca/select', 'idtipo_raca', 'descricao'),
    loadSelectMap('tipo-escolaridade/select', 'idtipo_escolaridade', 'descricao'),
  ]);
  return { raca, escolaridade };
}

export function resolveReferenceLabel(
  code: string,
  map: Record<string, string>,
  fallback = 'Não informado',
): string {
  const key = String(code ?? '').trim();
  if (!key) return fallback;
  return map[key] ?? `Cód. ${key}`;
}
