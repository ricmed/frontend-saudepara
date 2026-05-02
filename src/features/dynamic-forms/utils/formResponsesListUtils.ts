/** Helpers compartilhados entre lista de respostas (admin) e lista SINAN/notificações. */

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
) {
  if (!cols.length) {
    alert('Não foi possível montar a tabela (sem colunas do formulário).');
    return;
  }
  const lines: string[] = [];
  lines.push(cols.map((c) => csvEscape(c.label)).join(';'));
  for (const r of rows) {
    const flat = flattenObject(r.data_json ?? {});
    lines.push(cols.map((c) => csvEscape(flat[c.key] ?? '')).join(';'));
  }
  await navigator.clipboard.writeText(lines.join('\n'));
  alert('Dados copiados (CSV) para a área de transferência.');
}
