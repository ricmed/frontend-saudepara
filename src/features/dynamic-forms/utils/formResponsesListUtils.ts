import type { FormField } from '@/services/FormService';

/** Mapas id → rótulo para listagens de respostas (selects via API). */
export type ResponseListLabelMaps = {
  municipioById: Record<string, string>;
  crsById: Record<string, string>;
  paisById: Record<string, string>;
};

export const EMPTY_RESPONSE_LIST_LABEL_MAPS: ResponseListLabelMaps = {
  municipioById: {},
  crsById: {},
  paisById: {},
};

export function findFormFieldByKey(schema: unknown, fieldKey: string): FormField | undefined {
  const key = String(fieldKey || '').trim();
  if (!key) return undefined;
  for (const sec of (schema as { sections?: Array<{ fields?: FormField[] }> })?.sections ?? []) {
    for (const f of sec?.fields ?? []) {
      if (String(f?.key || '').trim() === key) return f;
    }
  }
  return undefined;
}

/** Indica quais listas `/select` precisam ser carregadas para exibir rótulos em vez de ids. */
export function collectSchemaReferenceMapsNeeded(schema: unknown): {
  municipio: boolean;
  crs: boolean;
  pais: boolean;
} {
  const out = { municipio: false, crs: false, pais: false };
  const considerEp = (epRaw: string | undefined | null) => {
    const ep = String(epRaw || '').toLowerCase();
    if (!ep) return;
    if (ep.includes('municipio') || ep.includes('tipo_municipio')) out.municipio = true;
    if (ep.includes('crs')) out.crs = true;
    if (ep.includes('pais') || ep.includes('tipo_pais')) out.pais = true;
  };
  for (const sec of (schema as { sections?: Array<{ fields?: FormField[] }> })?.sections ?? []) {
    for (const raw of sec?.fields ?? []) {
      const f = raw as FormField;
      considerEp(f.customApiSelectEndpoint ?? undefined);
      considerEp(f.apiSelectEndpoint);
    }
  }
  return out;
}

function mergedFieldOptions(f: FormField | undefined): Array<{ value: string; label: string }> | undefined {
  if (!f) return undefined;
  const manual = (f.options && f.options.length > 0 ? f.options : null) ?? (f.customOptions && f.customOptions.length > 0 ? f.customOptions : null);
  return manual ?? undefined;
}

function labelFromOptions(raw: unknown, options: Array<{ value: string; label: string }> | undefined): string | null {
  if (!options?.length) return null;
  if (raw === null || raw === undefined || raw === '') return null;
  if (Array.isArray(raw)) {
    const parts = raw.map((x) => labelFromOptions(x, options)).filter((x): x is string => x != null && x !== '');
    return parts.length ? parts.join(', ') : null;
  }
  const s = String(raw);
  const found = options.find(
    (o) => o.value === s || String(o.value) === String(raw) || (Number.isFinite(Number(s)) && String(o.value) === String(Number(s))),
  );
  return found?.label?.trim() ? found.label : null;
}

function effectiveApiEndpoint(f: FormField | undefined): string {
  if (!f) return '';
  return String(f.customApiSelectEndpoint || f.apiSelectEndpoint || '').toLowerCase();
}

/**
 * Converte valor bruto gravado em `data_json` em texto amigável para listas (rótulo de select, município, CRS, país).
 */
export function formatCellValueForResponseList(
  raw: unknown,
  field: FormField | undefined,
  maps: ResponseListLabelMaps,
): string {
  if (raw === null || raw === undefined) return '';
  if (Array.isArray(raw)) {
    const opts = mergedFieldOptions(field);
    const joined = labelFromOptions(raw, opts);
    if (joined) return joined;
    return raw.map((x) => (x === null || x === undefined ? '' : String(x))).join(', ');
  }
  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw);
    } catch {
      return String(raw);
    }
  }

  const type = String(field?.type || '').toLowerCase();
  const opts = mergedFieldOptions(field);

  if (opts?.length) {
    const lbl = labelFromOptions(raw, opts);
    if (lbl) return lbl;
  }

  if (type === 'checkbox' || field?.storeAs01) {
    if (raw === true || raw === 1 || raw === '1') return 'Sim';
    if (raw === false || raw === 0 || raw === '0') return 'Não';
  }

  const ep = effectiveApiEndpoint(field);
  if (ep) {
    const id = String(raw);
    if (ep.includes('municipio') || ep.includes('tipo_municipio')) {
      const hit = maps.municipioById[id];
      if (hit) return hit;
    }
    if (ep.includes('crs')) {
      const hit = maps.crsById[id];
      if (hit) return hit;
    }
    if (ep.includes('pais') || ep.includes('tipo_pais')) {
      const hit = maps.paisById[id];
      if (hit) return hit;
    }
  }

  return String(raw);
}

export function flattenObject(input: any, maxDepth = 6): Record<string, any> {
  const out: Record<string, any> = {};
  const rec = (value: any, p: string, depth: number) => {
    if (depth > maxDepth) return;
    if (value === null || value === undefined) {
      out[p] = value;
      return;
    }
    if (typeof value !== 'object') {
      out[p] = value;
      return;
    }
    if (Array.isArray(value)) {
      out[p] = `(${value.length} itens)`;
      return;
    }
    const keys = Object.keys(value);
    if (keys.length === 0) {
      out[p] = '';
      return;
    }
    for (const k of keys) {
      if (k === '_meta') continue;
      rec(value[k], p ? `${p}.${k}` : k, depth + 1);
    }
  };
  rec(input, '', 0);
  return out;
}

export function csvEscape(value: any): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[;"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function getValueAtPath(obj: any, path: string) {
  if (!obj || !path) return undefined;
  const parts = String(path).split('.').filter(Boolean);
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function guessKeyFields(schema: any | undefined): Array<{ key: string; label: string }> {
  const fields: Array<{ key: string; label: string }> = [];
  const all: Array<{ key: string; label: string; type?: string }> = [];
  for (const sec of schema?.sections ?? []) {
    for (const f of sec?.fields ?? []) {
      const key = String(f?.key || '').trim();
      if (!key) continue;
      const type = String(f?.type || '').toLowerCase();
      if (['file', 'signature', 'table'].includes(type)) continue;
      const label = String(f?.customLabel || f?.label || key);
      all.push({ key, label, type });
    }
  }

  const preferOrder = [
    'paciente.nome',
    'paciente.cpf',
    'paciente.cns',
    'paciente.data_nascimento',
    'paciente.nome_mae',
    'notificacao.dt_notificacao',
  ];

  for (const k of preferOrder) {
    const found = all.find((x) => x.key === k);
    if (found && !fields.some((f) => f.key === found.key)) fields.push({ key: found.key, label: found.label });
    if (fields.length >= 3) break;
  }

  for (const f of all) {
    if (fields.length >= 3) break;
    if (fields.some((x) => x.key === f.key)) continue;
    fields.push({ key: f.key, label: f.label });
  }

  return fields.slice(0, 3);
}

export function buildSheetColumnsFromSchema(schema: any | undefined): Array<{ key: string; label: string }> {
  const cols: Array<{ key: string; label: string }> = [];
  for (const sec of schema?.sections ?? []) {
    for (const f of sec?.fields ?? []) {
      const k = String(f?.key || '').trim();
      if (!k) continue;
      const type = String(f?.type || '').toLowerCase();
      if (['file', 'signature'].includes(type)) continue;
      cols.push({ key: k, label: String(f?.customLabel || f?.label || k) });
    }
  }
  return cols;
}

export function resolveActiveSchema(form: {
  active_version_id?: number;
  versions?: Array<{ id: number; schema_json?: any }>;
} | null): any {
  if (!form?.active_version_id || !Array.isArray(form.versions)) return undefined;
  return form.versions.find((v) => v.id === form.active_version_id)?.schema_json;
}

export function getStatusUi(status: string) {
  const key = String(status || '').toLowerCase();
  const labels: Record<string, string> = {
    submitted: 'Enviada',
    draft: 'Não enviada',
    synced: 'Enviada (offline)',
  };
  const classes: Record<string, string> = {
    submitted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    draft: 'bg-amber-50 text-amber-900 border-amber-200',
    synced: 'bg-blue-50 text-blue-800 border-blue-200',
  };
  return {
    label: labels[key] || (key ? key : '-'),
    className: classes[key] || 'bg-gray-50 text-gray-700 border-gray-200',
  };
}

export function getCreatedByUi(createdBy: string) {
  const s = String(createdBy || '');
  if (!s) return { label: '-', title: '' };
  if (s.startsWith('public:')) return { label: 'Público', title: 'Resposta enviada por link público' };
  return { label: 'Autenticado', title: s };
}

export async function copySheetRowsToClipboard(
  rows: Array<{ data_json?: Record<string, any> }>,
  cols: Array<{ key: string; label: string }>,
  opts?: { formatCell?: (key: string, value: any) => string },
) {
  if (!cols.length) {
    alert('Não foi possível montar a tabela (sem colunas do formulário).');
    return;
  }
  const lines: string[] = [];
  lines.push(cols.map((c) => csvEscape(c.label)).join(';'));
  for (const r of rows) {
    const flat = flattenObject(r.data_json ?? {});
    lines.push(
      cols
        .map((c) => {
          const raw = (flat as any)[c.key];
          const formatted = opts?.formatCell ? opts.formatCell(c.key, raw) : raw;
          return csvEscape(formatted ?? '');
        })
        .join(';'),
    );
  }
  await navigator.clipboard.writeText(lines.join('\n'));
  alert('Dados copiados (CSV) para a área de transferência.');
}
