import React, { useMemo, useState } from 'react';
import axios from '@/utils/axiosRetry';
import type { FormField, TableColumnDef } from '@/services/FormService';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';

const API_BASE = getRuntimeApiRoot();

type Row = Record<string, unknown>;

export type EntomologiaMunicipioBlock = {
  /** Chave estável na UI (municipio_id ou índice provisório) */
  uiKey: string;
  municipio_id?: string;
  resumo: Row;
  frequencia: Row;
};

function sumKeys(row: Row, keys: string[]): number {
  return keys.reduce((acc, k) => acc + (Number(row?.[k]) || 0), 0);
}

function computedPctValue(row: Row, numeratorKey: string, denominatorKeys: string[]): number | null {
  const den = sumKeys(row || {}, denominatorKeys);
  if (den === 0) return null;
  const num = Number(row?.[numeratorKey]) || 0;
  return (num / den) * 100;
}

function asRows(value: unknown): Row[] {
  if (!Array.isArray(value)) return [];
  return value.filter((r): r is Row => r != null && typeof r === 'object');
}

function municipioKey(row: Row): string {
  if (row.municipio_id == null || row.municipio_id === '') return '';
  return String(row.municipio_id);
}

/**
 * Une resumo + frequência por índice (como o editor grava).
 * Antes, linhas vazias em cada array viravam dois blocos “sem seleção”.
 */
export function mergeEntomologiaMunicipioBlocks(resumo: Row[], frequencia: Row[]): EntomologiaMunicipioBlock[] {
  const n = Math.max(resumo.length, frequencia.length);
  if (n === 0) return [];

  const blocks: EntomologiaMunicipioBlock[] = [];
  for (let i = 0; i < n; i++) {
    const r = { ...(resumo[i] ?? {}) };
    const f = { ...(frequencia[i] ?? {}) };
    const mid = municipioKey(r) || municipioKey(f) || undefined;
    if (mid) {
      r.municipio_id = mid;
      f.municipio_id = mid;
    }
    blocks.push({
      uiKey: mid ?? `idx-${i}`,
      municipio_id: mid,
      resumo: r,
      frequencia: f,
    });
  }
  return blocks;
}

export function blocksToEntomologiaArrays(blocks: EntomologiaMunicipioBlock[]): {
  resumo_mensal: Row[];
  frequencia_recipientes: Row[];
} {
  return {
    resumo_mensal: blocks.map((b) => ({
      ...b.resumo,
      ...(b.municipio_id != null && b.municipio_id !== '' ? { municipio_id: b.municipio_id } : {}),
    })),
    frequencia_recipientes: blocks.map((b) => ({
      ...b.frequencia,
      ...(b.municipio_id != null && b.municipio_id !== '' ? { municipio_id: b.municipio_id } : {}),
    })),
  };
}

export function resolveCrsIdForMunicipioSelect(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined;
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const nested = o.value ?? o.id_crs ?? o.id;
    if (nested == null || nested === '') return undefined;
    const s = String(nested).trim();
    if (!s || s === '[object Object]' || Number.isNaN(Number(s))) return undefined;
    return s;
  }
  const s = String(raw).trim();
  if (!s || s === '[object Object]' || Number.isNaN(Number(s))) return undefined;
  return s;
}

function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function useMunicipioOptions(crsIdRaw: unknown) {
  const crsId = resolveCrsIdForMunicipioSelect(crsIdRaw);
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  React.useEffect(() => {
    if (!crsId) {
      setOptions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${API_BASE}/tipo-municipio/select`, {
        params: { crs_id: crsId },
        withCredentials: true,
      })
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
        setOptions(
          (list as Array<Record<string, unknown>>)
            .map((item) => ({
              value: String(item.value ?? item.idtipo_municipio ?? item.id ?? ''),
              label: String(item.label ?? item.descricao ?? item.nome ?? ''),
            }))
            .filter((o) => o.value !== ''),
        );
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [crsId]);
  return { options, loading, crsId };
}

/** Select com busca — evita dump de 50–100+ opções no <select> nativo. */
function MunicipioSearchSelect({
  value,
  onChange,
  options,
  excludeValues,
  disabled,
  loading,
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
  options: Array<{ value: string; label: string }>;
  excludeValues: Set<string>;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const available = options.filter(
    (o) => o.value === value || !excludeValues.has(o.value),
  );
  const q = normalizeSearch(searchTerm);
  const filtered = available.filter(
    (o) => !q || normalizeSearch(o.label).includes(q) || o.value.includes(q),
  );
  const visible = filtered.slice(0, 12);

  return (
    <div className="relative max-w-md">
      <input
        type="text"
        value={open ? searchTerm : selected?.label ?? ''}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange(undefined);
        }}
        onFocus={() => {
          setSearchTerm(selected?.label ?? '');
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        disabled={disabled || loading}
        placeholder={loading ? 'Carregando municípios…' : 'Digite para buscar o município…'}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off"
      />
      {open && !disabled && !loading ? (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {visible.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {available.length === 0
                ? 'Nenhum município disponível para esta CRS (ou todos já foram adicionados).'
                : 'Nenhum município encontrado. Refine a busca.'}
            </div>
          ) : (
            <>
              {visible.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(o.value);
                    setSearchTerm('');
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              ))}
              {filtered.length > visible.length ? (
                <div className="px-3 py-1.5 text-xs text-gray-500 border-t border-gray-100">
                  +{filtered.length - visible.length} — continue digitando para filtrar
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ColumnInput({
  column,
  row,
  onChange,
  disabled,
  municipioOptions,
}: {
  column: TableColumnDef;
  row: Row;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  municipioOptions?: Array<{ value: string; label: string }>;
}) {
  const val = row?.[column.key];
  const commonClass =
    'w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (column.type === 'computed' && column.sumKeys?.length) {
    return (
      <div className="px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700 tabular-nums">
        {sumKeys(row || {}, column.sumKeys)}
      </div>
    );
  }

  if (column.type === 'computedPct' && column.computedPct) {
    const pct = computedPctValue(row || {}, column.computedPct.numeratorKey, column.computedPct.denominatorKeys);
    const isAlb = column.key.endsWith('_alb');
    return (
      <div
        className={`px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 tabular-nums ${
          isAlb ? 'text-red-600 font-medium' : 'text-gray-700'
        }`}
      >
        {pct != null ? `${pct.toFixed(1)}%` : '—'}
      </div>
    );
  }

  if (column.type === 'number') {
    const isAlb = column.key.endsWith('_alb');
    return (
      <input
        type="number"
        inputMode="numeric"
        step={1}
        value={val == null ? '' : String(val)}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? undefined : Number(v));
        }}
        min={column.min ?? 0}
        max={column.max ?? 1_000_000}
        disabled={disabled}
        title={column.hint ?? 'Inteiro ≥ 0'}
        className={`${commonClass} ${isAlb ? 'text-red-600 font-medium' : ''}`}
      />
    );
  }

  if (column.type === 'select') {
    const opts = municipioOptions ?? column.options ?? [];
    return (
      <select
        value={val == null ? '' : String(val)}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        className={commonClass}
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      value={val == null ? '' : String(val)}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={commonClass}
      placeholder={column.placeholder}
      maxLength={column.maxLength}
    />
  );
}

function FieldGrid({
  columns,
  row,
  onCellChange,
  disabled,
  municipioOptions,
}: {
  columns: TableColumnDef[];
  row: Row;
  onCellChange: (key: string, value: unknown) => void;
  disabled?: boolean;
  municipioOptions?: Array<{ value: string; label: string }>;
}) {
  const editable = columns.filter((c) => c.key !== 'municipio_id');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {editable.map((col) => (
        <div key={col.key} className="min-w-0">
          <label
            className={`block text-xs font-medium mb-1 ${
              col.key.endsWith('_alb') ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            {col.label}
            {col.required ? <span className="text-red-500 ml-0.5">*</span> : null}
          </label>
          <ColumnInput
            column={col}
            row={row}
            onChange={(v) => onCellChange(col.key, v)}
            disabled={disabled}
            municipioOptions={municipioOptions}
          />
        </div>
      ))}
    </div>
  );
}

export interface EntomologiaMunicipiosFieldProps {
  resumoField: FormField;
  frequenciaField: FormField | null;
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
  disabled?: boolean;
  error?: string;
}

export const EntomologiaMunicipiosField: React.FC<EntomologiaMunicipiosFieldProps> = ({
  resumoField,
  frequenciaField,
  getValue,
  setValue,
  disabled,
  error,
}) => {
  const crsRaw = getValue('crs_id');
  const { options: municipioOptions, loading: municipiosLoading, crsId } = useMunicipioOptions(crsRaw);
  const resumoRows = asRows(getValue('resumo_mensal'));
  const frequenciaRows = asRows(getValue('frequencia_recipientes'));
  const blocks = useMemo(
    () => mergeEntomologiaMunicipioBlocks(resumoRows, frequenciaRows),
    [resumoRows, frequenciaRows],
  );
  const selectedMunicipioIds = useMemo(() => {
    const ids = new Set<string>();
    for (const b of blocks) {
      if (b.municipio_id) ids.add(String(b.municipio_id));
    }
    return ids;
  }, [blocks]);

  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());
  const [didInitOpen, setDidInitOpen] = useState(false);

  const resumoColumns = resumoField.tableColumns ?? [];
  const frequenciaColumns = frequenciaField?.tableColumns ?? [];
  const municipioCol = resumoColumns.find((c) => c.key === 'municipio_id');

  React.useEffect(() => {
    if (!didInitOpen && blocks.length > 0) {
      // Em leitura, abre todos os municípios para ver o preenchimento sem clicar.
      setOpenKeys(disabled ? new Set(blocks.map((b) => b.uiKey)) : new Set([blocks[0].uiKey]));
      setDidInitOpen(true);
    }
  }, [blocks, didInitOpen, disabled]);

  const commitBlocks = (next: EntomologiaMunicipioBlock[]) => {
    if (disabled) return;
    const { resumo_mensal, frequencia_recipientes } = blocksToEntomologiaArrays(next);
    setValue('resumo_mensal', resumo_mensal);
    setValue('frequencia_recipientes', frequencia_recipientes);
  };

  const toggleOpen = (uiKey: string) => {
    setOpenKeys((prev) => {
      const n = new Set(prev);
      if (n.has(uiKey)) n.delete(uiKey);
      else n.add(uiKey);
      return n;
    });
  };

  const addMunicipio = () => {
    if (disabled) return;
    const uiKey = `idx-${blocks.length}`;
    const next: EntomologiaMunicipioBlock[] = [
      ...blocks,
      { uiKey, municipio_id: undefined, resumo: {}, frequencia: {} },
    ];
    commitBlocks(next);
    setOpenKeys((prev) => new Set(prev).add(uiKey));
  };

  const removeBlock = (uiKey: string) => {
    if (disabled) return;
    commitBlocks(blocks.filter((b) => b.uiKey !== uiKey));
    setOpenKeys((prev) => {
      const n = new Set(prev);
      n.delete(uiKey);
      return n;
    });
  };

  const updateBlock = (uiKey: string, patch: Partial<EntomologiaMunicipioBlock>) => {
    if (disabled) return;
    let nextUiKey = uiKey;
    const next = blocks.map((b) => {
      if (b.uiKey !== uiKey) return b;
      const municipio_id =
        patch.municipio_id !== undefined ? patch.municipio_id : b.municipio_id;
      const resumo = patch.resumo ? { ...b.resumo, ...patch.resumo } : { ...b.resumo };
      const frequencia = patch.frequencia
        ? { ...b.frequencia, ...patch.frequencia }
        : { ...b.frequencia };
      if (municipio_id != null && municipio_id !== '') {
        resumo.municipio_id = municipio_id;
        frequencia.municipio_id = municipio_id;
      }
      nextUiKey =
        municipio_id && municipio_id !== ''
          ? municipio_id
          : patch.uiKey ?? b.uiKey;
      return {
        ...b,
        ...patch,
        municipio_id,
        resumo,
        frequencia,
        uiKey: nextUiKey,
      };
    });
    commitBlocks(next);
    if (nextUiKey !== uiKey) {
      setOpenKeys((prev) => {
        const n = new Set(prev);
        if (n.has(uiKey)) {
          n.delete(uiKey);
          n.add(nextUiKey);
        }
        return n;
      });
    }
  };

  const labelForMunicipio = (id?: string) => {
    if (!id) return 'Município sem seleção';
    return municipioOptions.find((o) => o.value === id)?.label ?? `Município ${id}`;
  };

  const resumoColumnsView = useMemo(
    () => resumoColumns.filter((c) => c.key !== 'municipio_id'),
    [resumoColumns],
  );
  const frequenciaColumnsView = useMemo(
    () => frequenciaColumns.filter((c) => c.key !== 'municipio_id'),
    [frequenciaColumns],
  );

  return (
    <div className="mb-4 space-y-3 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Municípios (resumo + frequência relativa)
          </label>
          {!disabled ? (
            <p className="text-xs text-gray-500 mt-0.5">
              Use só números inteiros (0, 1, 2…). Se houver larvas, pupas ou exúvias de uma espécie, informe também
              quantos imóveis tiveram essa espécie. T.B + P.E não podem passar do total de imóveis. Não deixe o
              município todo zerado.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">
              Mesmo layout da digitação, somente leitura. Export completo em Excel/PDF no dashboard.
            </p>
          )}
        </div>
        {!disabled ? (
          <button
            type="button"
            onClick={addMunicipio}
            disabled={!crsId}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!crsId ? 'Selecione a CRS primeiro' : undefined}
          >
            <Plus className="h-4 w-4" />
            Adicionar município
          </button>
        ) : null}
      </div>

      {!disabled && !crsId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Selecione a CRS no cabeçalho para liberar a lista de municípios (somente da regional).
        </div>
      ) : null}

      {blocks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          {disabled
            ? 'Nenhum município neste relatório.'
            : 'Nenhum município. Clique em "Adicionar município" para começar o relatório do mês.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {blocks.map((block, index) => {
            const isOpen = openKeys.has(block.uiKey);
            return (
              <li key={block.uiKey} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-600 text-white">
                  <button
                    type="button"
                    onClick={() => toggleOpen(block.uiKey)}
                    className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-white"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-blue-100 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-blue-100 shrink-0" />
                    )}
                    <span>
                      {index + 1}. {labelForMunicipio(block.municipio_id)}
                    </span>
                  </button>
                  {!disabled ? (
                    <button
                      type="button"
                      onClick={() => removeBlock(block.uiKey)}
                      className="p-1.5 text-white/90 hover:bg-blue-700 rounded"
                      title="Remover município"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                {isOpen ? (
                  <div className="p-4 space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {municipioCol?.label ?? 'Município'}
                        {!disabled ? <span className="text-red-500 ml-0.5">*</span> : null}
                      </label>
                      {disabled ? (
                        <div className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-800">
                          {labelForMunicipio(block.municipio_id)}
                        </div>
                      ) : (
                        <MunicipioSearchSelect
                          value={block.municipio_id}
                          onChange={(v) =>
                            updateBlock(block.uiKey, {
                              municipio_id: v,
                            })
                          }
                          options={municipioOptions}
                          excludeValues={
                            new Set(
                              [...selectedMunicipioIds].filter((id) => id !== block.municipio_id),
                            )
                          }
                          disabled={!crsId}
                          loading={municipiosLoading}
                        />
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Resumo mensal</h4>
                      <FieldGrid
                        columns={disabled ? resumoColumnsView : resumoColumns}
                        row={block.resumo}
                        onCellChange={(key, value) =>
                          updateBlock(block.uiKey, { resumo: { [key]: value } })
                        }
                        disabled={disabled}
                        municipioOptions={municipioOptions}
                      />
                    </div>

                    {frequenciaColumns.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">
                          Frequência relativa (contagens)
                        </h4>
                        <p className="text-xs text-gray-500 mb-2">
                          A1 caixa d&apos;água | A2 outros depósitos | B móveis | C fixos | D1 pneus | D2
                          lixo | E naturais. Vermelho = albopictus. % calculados.
                        </p>
                        <FieldGrid
                          columns={disabled ? frequenciaColumnsView : frequenciaColumns}
                          row={block.frequencia}
                          onCellChange={(key, value) =>
                            updateBlock(block.uiKey, { frequencia: { [key]: value } })
                          }
                          disabled={disabled}
                          municipioOptions={municipioOptions}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
    </div>
  );
};

export default EntomologiaMunicipiosField;
