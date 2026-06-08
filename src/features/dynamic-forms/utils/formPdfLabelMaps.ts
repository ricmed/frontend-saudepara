import axios from 'axios';
import type { FormField, FormSchema } from '@/services/FormService';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';
import { applySinanFichaToField, formatOptionLabelPlain } from '@/features/dynamic-forms/utils/sinanFichaUi';
import { getValueAtPath } from '@/features/dynamic-forms/utils/formResponsesListUtils';

/** Campos técnicos (ids internos) — omitir do PDF quando há campo amigável equivalente. */
export const PDF_SKIP_INTERNAL_FIELD_KEYS = new Set([
  'notificacao.municipio_id',
  'notificacao.unidade_id',
  'notificacao.estado_id',
  'residencia.estado_id',
  'residencia.municipio_id',
  'prenatal.municipio_id',
  'crianca.nascimento_municipio_id',
  'investigador.municipio_id',
]);

/** Omitir nome da unidade quando o CNES correspondente já será exportado com descrição. */
export const PDF_SKIP_DUPLICATE_COMPANION_KEYS = new Set([
  'prenatal.estabelecimento_nome',
  'investigador.estabelecimento_nome',
]);

export type PdfLabelMaps = {
  municipioById: Record<string, string>;
  municipioByIbge: Record<string, string>;
  estadoById: Record<string, string>;
  estadoByCodigo: Record<string, string>;
  estadoBySigla: Record<string, string>;
  paisById: Record<string, string>;
  crsById: Record<string, string>;
  apiSelectByEndpoint: Record<string, Record<string, string>>;
};

export const EMPTY_PDF_LABEL_MAPS: PdfLabelMaps = {
  municipioById: {},
  municipioByIbge: {},
  estadoById: {},
  estadoByCodigo: {},
  estadoBySigla: {},
  paisById: {},
  crsById: {},
  apiSelectByEndpoint: {},
};

const UF_SIGLA_TO_NOME: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins', EX: 'Exterior',
};

function normalizeIbge(code: unknown): string {
  return String(code ?? '').replace(/\D/g, '');
}

function indexMunicipioCodigo(maps: PdfLabelMaps, codigo: unknown, descricao: string): void {
  const norm = normalizeIbge(codigo);
  if (!norm) return;
  const label = descricao.trim();
  if (!label) return;
  maps.municipioByIbge[norm] = label;
  if (norm.length === 7) maps.municipioByIbge[norm.slice(0, 6)] = label;
  if (norm.length === 6) maps.municipioByIbge[`${norm}0`] = label;
}

function mapApiItemToLabelEntry(item: Record<string, unknown>): { value: string; label: string } | null {
  if (item.value != null && item.label != null) {
    const value = String(item.value).trim();
    const label = String(item.label).trim();
    return value && label ? { value, label } : null;
  }
  const value = String(
    item.idtipo_pais ??
      item.idtipo_municipio ??
      item.idtipo_estado ??
      item.idtipo_raca ??
      item.idtipo_sexo_nascimento ??
      item.idtipo_zona ??
      item.idtipo_escolaridade ??
      item.idtipo_cbo ??
      item.idcrs ??
      item.id ??
      item.codigo ??
      item.value ??
      '',
  ).trim();
  if (!value) return null;
  const label = String(
    item.descricao ?? item.nome ?? item.label ?? item.sigla ?? value,
  ).trim();
  return label ? { value, label } : null;
}

export function collectPdfApiSelectEndpoints(schema: FormSchema): Set<string> {
  const endpoints = new Set<string>();
  for (const sec of schema.sections ?? []) {
    for (const raw of sec.fields ?? []) {
      const f = raw as FormField;
      const ep = String(f.customApiSelectEndpoint || f.apiSelectEndpoint || '').trim();
      if (ep) endpoints.add(ep.replace(/^api\//i, ''));
    }
  }
  return endpoints;
}

export function shouldSkipPdfField(field: FormField): boolean {
  const key = String(field.key || '').trim();
  if (!key) return true;
  if (PDF_SKIP_INTERNAL_FIELD_KEYS.has(key)) return true;
  if (PDF_SKIP_DUPLICATE_COMPANION_KEYS.has(key)) return true;
  return false;
}

export function resolveMunicipioIbgeLabel(maps: PdfLabelMaps, raw: unknown): string | null {
  const norm = normalizeIbge(raw);
  if (!norm) return null;
  return maps.municipioByIbge[norm] ?? maps.municipioById[norm] ?? null;
}

export function resolveEstadoLabel(maps: PdfLabelMaps, raw: unknown): string | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  if (maps.estadoById[s]) return maps.estadoById[s];
  if (maps.estadoByCodigo[s]) return maps.estadoByCodigo[s];
  if (maps.estadoBySigla[s.toUpperCase()]) return maps.estadoBySigla[s.toUpperCase()];
  const sigla = s.length === 2 ? s.toUpperCase() : null;
  if (sigla && UF_SIGLA_TO_NOME[sigla]) return UF_SIGLA_TO_NOME[sigla];
  return null;
}

function resolveApiSelectLabel(maps: PdfLabelMaps, endpoint: string, raw: unknown): string | null {
  const ep = endpoint.replace(/^api\//i, '');
  const map = maps.apiSelectByEndpoint[ep];
  if (!map) return null;
  const key = String(raw).trim();
  return map[key] ?? map[String(Number(key))] ?? null;
}

function formatEstabelecimentoValue(fieldKey: string, raw: unknown, formData: Record<string, unknown>): string | null {
  if (!fieldKey.endsWith('_cnes')) return null;
  const base = fieldKey.slice(0, -'_cnes'.length);
  const nome = getValueAtPath(formData, `${base}_nome`);
  const cnes = String(raw ?? '').trim();
  const nomeStr = String(nome ?? '').trim();
  if (nomeStr && cnes) return `${nomeStr} (CNES ${cnes})`;
  if (nomeStr) return nomeStr;
  return null;
}

const formatDatePtBr = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  const raw = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return raw || '—';
};

export function formatPdfFieldValue(
  field: FormField,
  raw: unknown,
  maps: PdfLabelMaps,
  formData: Record<string, unknown>,
  hbvForm: boolean,
): string {
  if (raw === null || raw === undefined || raw === '') return '—';

  const resolved = applySinanFichaToField(field, hbvForm);
  const fieldKey = String(resolved.key || '');
  const type = String(resolved.type || '').toLowerCase();

  const estab = formatEstabelecimentoValue(fieldKey, raw, formData);
  if (estab) return estab;

  if (type === 'date') return formatDatePtBr(raw);

  if (type === 'number' && raw !== null && raw !== undefined && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n)) {
      return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(n);
    }
  }

  if (type === 'checkbox' || resolved.storeAs01) {
    if (raw === true || raw === 1 || raw === '1') return 'Sim';
    if (raw === false || raw === 0 || raw === '0') return 'Não';
  }

  const opts = resolved.options ?? resolved.customOptions ?? undefined;
  if (opts?.length) {
    const code = String(raw).trim();
    const found = opts.find((o) => o.value === code || String(o.value) === String(raw));
    if (found) {
      const plain = formatOptionLabelPlain(found, resolved);
      if (plain.trim()) return plain.trim();
    }
  }

  if (fieldKey.includes('municipio_ibge') || fieldKey.includes('municipio_notificacao_ibge')) {
    const mun = resolveMunicipioIbgeLabel(maps, raw);
    if (mun) return mun;
  }

  if (fieldKey.includes('.uf') || fieldKey.includes('uf_notificacao')) {
    const uf = resolveEstadoLabel(maps, raw);
    if (uf) return uf;
  }

  if (fieldKey.endsWith('.pais') || fieldKey.endsWith('.pais_nascimento_id')) {
    const pais = maps.paisById[String(raw).trim()];
    if (pais) return pais;
  }

  const apiEp = String(resolved.customApiSelectEndpoint || resolved.apiSelectEndpoint || '').trim();
  if (apiEp) {
    const apiLabel = resolveApiSelectLabel(maps, apiEp, raw);
    if (apiLabel) return apiLabel;
  }

  const ep = apiEp.toLowerCase();
  if (ep.includes('municipio') || ep.includes('tipo_municipio')) {
    const hit = maps.municipioById[String(raw).trim()];
    if (hit) return hit;
  }
  if (ep.includes('crs')) {
    const hit = maps.crsById[String(raw).trim()];
    if (hit) return hit;
  }
  if (ep.includes('pais') || ep.includes('tipo_pais')) {
    const hit = maps.paisById[String(raw).trim()];
    if (hit) return hit;
  }

  if (Array.isArray(raw)) {
    const parts = raw.map((item) => formatPdfFieldValue(resolved, item, maps, formData, hbvForm));
    const joined = parts.filter((p) => p && p !== '—').join(', ');
    return joined || '—';
  }

  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw);
    } catch {
      return String(raw);
    }
  }

  const text = String(raw).trim();
  return text || '—';
}

export async function loadPdfLabelMaps(schema: FormSchema): Promise<PdfLabelMaps> {
  const maps: PdfLabelMaps = {
    municipioById: {},
    municipioByIbge: {},
    estadoById: {},
    estadoByCodigo: {},
    estadoBySigla: {},
    paisById: {},
    crsById: {},
    apiSelectByEndpoint: {},
  };

  const api = getRuntimeApiRoot();
  const apiEndpoints = collectPdfApiSelectEndpoints(schema);
  const tasks: Promise<void>[] = [];

  tasks.push(
    axios
      .get<Array<Record<string, unknown>>>(`${api}/tipo-municipio/select`, { withCredentials: true })
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        for (const m of data) {
          const id = m.idtipo_municipio;
          const descricao = String(m.descricao ?? m.nome ?? '').trim();
          if (id != null) {
            maps.municipioById[String(id)] = descricao || `Município ${id}`;
          }
          indexMunicipioCodigo(maps, m.codigo ?? m.codigo_ibge, descricao);
        }
      })
      .catch(() => undefined),
  );

  tasks.push(
    axios
      .get<Array<Record<string, unknown>>>(`${api}/tipo-estado/select`, { withCredentials: true })
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        for (const e of data) {
          const id = e.idtipo_estado;
          const descricao = String(e.descricao ?? e.nome ?? '').trim();
          const sigla = String(e.sigla ?? '').trim().toUpperCase();
          const codigo = String(e.codigo ?? '').trim();
          const label = descricao || sigla || (id != null ? `Estado ${id}` : '');
          if (id != null) maps.estadoById[String(id)] = label;
          if (codigo) maps.estadoByCodigo[codigo] = label;
          if (sigla) maps.estadoBySigla[sigla] = label;
        }
      })
      .catch(() => undefined),
  );

  tasks.push(
    axios
      .get<Array<Record<string, unknown>>>(`${api}/tipo-pais/select`, { withCredentials: true })
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        for (const p of data) {
          const id = p.idtipo_pais;
          if (id == null) continue;
          maps.paisById[String(id)] = String(p.descricao ?? p.nome ?? '').trim() || `País ${id}`;
        }
      })
      .catch(() => undefined),
  );

  tasks.push(
    axios
      .get<Array<Record<string, unknown>>>(`${api}/crs/select`, { withCredentials: true })
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        for (const c of data) {
          const id = c.idcrs;
          if (id == null) continue;
          maps.crsById[String(id)] =
            String(c.descricao ?? c.nome ?? '').trim() || `CRS ${id}`;
        }
      })
      .catch(() => undefined),
  );

  for (const endpoint of apiEndpoints) {
    const ep = endpoint.replace(/^api\//i, '');
    tasks.push(
      axios
        .get<Array<Record<string, unknown>>>(`${api}/${ep}`, { withCredentials: true })
        .then(({ data }) => {
          if (!Array.isArray(data)) return;
          const byValue: Record<string, string> = {};
          for (const item of data) {
            const mapped = mapApiItemToLabelEntry(item);
            if (!mapped) continue;
            byValue[mapped.value] = mapped.label;
          }
          maps.apiSelectByEndpoint[ep] = byValue;
        })
        .catch(() => undefined),
    );
  }

  await Promise.all(tasks);
  return maps;
}
