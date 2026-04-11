import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import type { FormField } from '@/services/FormService';
import CodeListService, { type CodeListItem } from '@/services/CodeListService';
import DatabaseService from '@/services/DatabaseService';
import { searchMatches } from '@/utils/searchUtils';

function getFieldInputId(field: FormField) {
  const key = (field.key || field.label || 'field').toString();
  return `df-${key}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_BASE = `${server}:${port}/api`;

/** Maiúsculas, sem acento e sem cedilha (ç/Ç → C). Usado em etnia, país nascimento, CBO. */
function normalizeMaiusculoSemAcento(s: string): string {
  if (!s) return s;
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00E7/gi, 'C')
    .toUpperCase();
}

function normalizeSearchHaystack(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type SelectOptionSearchable = { value: string; label: string; searchHaystack: string };

/** Exibe código numérico sem zeros à esquerda (001 → 1); outros formatos mantém como no cadastro. */
function displayCodigoPais(codRaw: string): string {
  const t = codRaw.trim().replace(/\s/g, '');
  if (/^\d+$/.test(t)) return String(parseInt(t, 10));
  return codRaw.trim();
}

/**
 * País: lista "código - nome" (ex.: 1 - Brasil). Busca por código (com ou sem zeros à esquerda) e nome — não pelo id interno.
 */
function mapTipoPaisToOption(item: {
  idtipo_pais: number | string;
  descricao: string;
  codigo_pais?: string | null;
  codigo_iso?: string | null;
}): SelectOptionSearchable {
  const id = String(item.idtipo_pais);
  const desc = String(item.descricao ?? '').trim();
  const codRaw = item.codigo_pais != null ? String(item.codigo_pais).trim() : '';
  const codNorm = codRaw.replace(/\s/g, '');
  const codShown = codRaw ? displayCodigoPais(codRaw) : '';
  const label = codShown && desc ? `${codShown} - ${desc}` : desc || id;
  const codSemZeros =
    codNorm && /^\d+$/.test(codNorm) ? (codNorm.replace(/^0+/, '') || '0') : '';
  const searchHaystack = normalizeSearchHaystack(
    [codRaw, codNorm, codSemZeros, codShown, desc].filter(Boolean).join(' ')
  );
  return { value: id, label, searchHaystack };
}

function mapApiItemToSearchableOption(item: any): SelectOptionSearchable {
  if (item.value != null && item.label != null) {
    const value = String(item.value);
    const label = String(item.label);
    return {
      value,
      label,
      searchHaystack: normalizeSearchHaystack(`${label} ${value}`),
    };
  }
  if (item.idtipo_pais != null && item.descricao != null) {
    return mapTipoPaisToOption(item);
  }
  const value = String(item.id ?? item.value ?? '');
  const label = String(item.descricao ?? item.nome ?? item.label ?? value);
  return {
    value,
    label,
    searchHaystack: normalizeSearchHaystack(`${label} ${value}`),
  };
}

interface SelectFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/** Posiciona menu flutuante em coordenadas da viewport (evita recorte por overflow em cards/seções). */
function useFixedMenuPlacement(anchorRef: React.RefObject<HTMLElement | null>, visible: boolean) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const sync = useCallback(() => {
    if (!visible) {
      setRect(null);
      return;
    }
    const el = anchorRef.current;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, [visible]);

  useLayoutEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    if (!visible) return;
    const onMove = () => sync();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [visible, sync]);

  return rect;
}

/** Select que carrega opções de um endpoint (ex: tipo-pais/select). Resposta: array com idtipo_pais e descricao ou value/label. */
export const ApiSelectField: React.FC<SelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>(field.options || []);
  const [loading, setLoading] = useState(true);
  const inputId = getFieldInputId(field);

  useEffect(() => {
    const endpoint = (field as FormField & { apiSelectEndpoint?: string }).apiSelectEndpoint;
    if (!endpoint) {
      setOptions(field.options || []);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE}/${endpoint}`;
        const { data } = await axios.get<any[]>(url, { withCredentials: true });
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const opts = list.map((item: any) => {
          const o = mapApiItemToSearchableOption(item);
          return { value: o.value, label: o.label };
        });
        setOptions(opts);
      } catch (e) {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [(field as FormField & { apiSelectEndpoint?: string }).apiSelectEndpoint]);

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={inputId}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled || field.disabled || loading}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled || loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">{loading ? 'Carregando...' : 'Selecione...'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

/** Select com pesquisa: carrega opções de um endpoint (ex: tipo-pais/select) e filtra ao digitar. */
export const ApiSelectSearchField: React.FC<SelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [options, setOptions] = useState<SelectOptionSearchable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const apiEndpoint = (field as FormField & { apiSelectEndpoint?: string }).apiSelectEndpoint;
  const fieldKey = (field as FormField & { key?: string }).key;
  const isTipoPaisSearchList =
    fieldKey === 'paciente.pais_nascimento_id' || fieldKey === 'residencia.pais';
  const isEtnia = fieldKey === 'paciente.etnia';
  const useMaiusculoSemAcento = isTipoPaisSearchList || isEtnia;
  const inputId = getFieldInputId(field);

  // País (nascimento / residência): lista completa via index com limit alto
  const fetchUrl = isTipoPaisSearchList
    ? `${API_BASE}/tipo-pais?limit=500`
    : apiEndpoint
      ? `${API_BASE}/${apiEndpoint}`
      : null;

  useEffect(() => {
    if (!fetchUrl) {
      setOptions(
        (field.options || []).map((o: { value: string; label: string }) => ({
          value: String(o.value),
          label: String(o.label),
          searchHaystack: normalizeSearchHaystack(`${o.label} ${o.value}`),
        }))
      );
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<any>(fetchUrl, { withCredentials: true });
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : (data?.data && Array.isArray(data.data))
            ? data.data
            : [];
        setOptions(list.map((item: any) => mapApiItemToSearchableOption(item)));
      } catch (e) {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchUrl]);

  const normalizedSearch = normalizeSearchHaystack(searchTerm || '');
  const filteredOptions = options.filter(
    (opt) => !normalizedSearch || opt.searchHaystack.includes(normalizedSearch)
  );
  const selectedLabel = value ? options.find((o) => o.value === String(value))?.label : '';
  const legacyTextValue =
    value != null &&
    String(value).trim() !== '' &&
    !loading &&
    options.length > 0 &&
    !options.some((o) => o.value === String(value)) &&
    !/^\d+$/.test(String(value).trim())
      ? String(value).trim()
      : '';
  const displayValue = showDropdown
    ? searchTerm
    : loading && value
      ? 'Carregando...'
      : legacyTextValue
        ? useMaiusculoSemAcento
          ? normalizeMaiusculoSemAcento(legacyTextValue)
          : legacyTextValue
        : useMaiusculoSemAcento && selectedLabel
          ? normalizeMaiusculoSemAcento(selectedLabel)
          : selectedLabel;

  const anchorRef = useRef<HTMLDivElement>(null);
  const menuOpen = showDropdown && filteredOptions.length > 0;
  const menuRect = useFixedMenuPlacement(anchorRef, menuOpen);

  const dropdownList = (
    <>
      {filteredOptions.map((opt) => (
        <div
          key={opt.value}
          onMouseDown={() => {
            onChange(opt.value);
            setSearchTerm('');
            setShowDropdown(false);
          }}
          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
        >
          {useMaiusculoSemAcento ? normalizeMaiusculoSemAcento(opt.label) : opt.label}
        </div>
      ))}
    </>
  );

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative" ref={anchorRef}>
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) onChange(undefined);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          disabled={disabled || field.disabled || loading}
          placeholder={
            loading
              ? 'Carregando...'
              : isTipoPaisSearchList
                ? 'Código ou nome do país...'
                : 'Digite para buscar ou selecione...'
          }
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled || loading ? 'bg-gray-100' : ''}`}
        />
        {menuOpen &&
          menuRect &&
          createPortal(
            <div
              className="fixed z-[10000] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto min-w-[min(100vw-1rem,28rem)]"
              style={{ top: menuRect.top, left: menuRect.left, width: Math.max(menuRect.width, 280) }}
            >
              {dropdownList}
            </div>,
            document.body
          )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

/** Ocupação (CBO): pesquisa por código ou nome, exibe "codigo - profissão", valor salvo = código. Mesma lógica do notification forms. */
export const CboSearchField: React.FC<SelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [displayLabel, setDisplayLabel] = useState('');
  const inputId = getFieldInputId(field);

  // Resolver label quando value (codigo) está preenchido (ex.: formulário carregado)
  useEffect(() => {
    const codigo = value != null && value !== '' ? String(value).trim() : '';
    if (!codigo) {
      setDisplayLabel('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/tipo-cbo/codigo/${encodeURIComponent(codigo)}`, { withCredentials: true });
        if (cancelled || !data) return;
        const label = data.codigo && data.descricao ? `${data.codigo} - ${data.descricao}` : data.descricao || codigo;
        setDisplayLabel(normalizeMaiusculoSemAcento(label));
      } catch {
        if (!cancelled) setDisplayLabel(codigo);
      }
    })();
    return () => { cancelled = true; };
  }, [value]);

  // Busca ao digitar (mín. 3 caracteres)
  useEffect(() => {
    const term = (searchTerm || '').trim();
    if (term.length < 3 || !showDropdown) {
      setOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/tipo-cbo/search`, {
          params: { query: term, limit: 10000 },
          withCredentials: true,
        });
        const list = (data?.data && Array.isArray(data.data)) ? data.data : [];
        const opts = list.map((item: { codigo?: string; descricao?: string }) => {
          const cod = item.codigo ?? '';
          const desc = item.descricao ?? '';
          return { value: cod, label: desc ? `${cod} - ${desc}` : cod };
        });
        setOptions(opts);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, showDropdown]);

  const selectedLabel = value ? options.find((o) => o.value === value)?.label : '';
  const displayValue = showDropdown
    ? searchTerm
    : (normalizeMaiusculoSemAcento(displayLabel || selectedLabel) || (loading && value ? 'Carregando...' : ''));

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) {
              onChange(undefined);
              setDisplayLabel('');
            }
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          disabled={disabled || field.disabled}
          placeholder="Digite o código ou nome da profissão (mín. 3 caracteres)..."
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled ? 'bg-gray-100' : ''}`}
        />
        {showDropdown && (searchTerm || '').trim().length >= 3 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
            ) : options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Nenhuma profissão encontrada.</div>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={() => {
                    onChange(opt.value);
                    setDisplayLabel(normalizeMaiusculoSemAcento(opt.label));
                    setSearchTerm('');
                    setShowDropdown(false);
                  }}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {normalizeMaiusculoSemAcento(opt.label)}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

/** Atividade econômica (CNAE): pesquisa por código ou nome, exibe "codigo - denominacao", valor = código. Maiúscula sem acento/cedilha. */
export const CnaeSearchField: React.FC<SelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [displayLabel, setDisplayLabel] = useState('');
  const inputId = getFieldInputId(field);

  useEffect(() => {
    const codigo = value != null && value !== '' ? String(value).trim() : '';
    if (!codigo) {
      setDisplayLabel('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/tipo-cnae/codigo/${encodeURIComponent(codigo)}`, { withCredentials: true });
        if (cancelled || !data) return;
        const label = data.codigo && data.descricao ? `${data.codigo} - ${data.descricao}` : data.descricao || codigo;
        setDisplayLabel(normalizeMaiusculoSemAcento(label));
      } catch {
        if (!cancelled) setDisplayLabel(normalizeMaiusculoSemAcento(codigo));
      }
    })();
    return () => { cancelled = true; };
  }, [value]);

  useEffect(() => {
    const term = (searchTerm || '').trim();
    if (term.length < 2 || !showDropdown) {
      setOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/tipo-cnae/search`, {
          params: { query: term, limit: 10000 },
          withCredentials: true,
        });
        const list = (data?.data && Array.isArray(data.data)) ? data.data : [];
        const opts = list.map((item: { codigo?: string; descricao?: string }) => {
          const cod = item.codigo ?? '';
          const desc = item.descricao ?? '';
          return { value: cod, label: desc ? `${cod} - ${desc}` : cod };
        });
        setOptions(opts);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, showDropdown]);

  const selectedLabel = value ? options.find((o) => o.value === value)?.label : '';
  const displayValue = showDropdown
    ? searchTerm
    : (normalizeMaiusculoSemAcento(displayLabel || selectedLabel) || (loading && value ? 'Carregando...' : ''));

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) {
              onChange(undefined);
              setDisplayLabel('');
            }
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          disabled={disabled || field.disabled}
          placeholder="Digite o código ou a atividade econômica (mín. 2 caracteres)..."
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled ? 'bg-gray-100' : ''}`}
        />
        {showDropdown && (searchTerm || '').trim().length >= 2 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
            ) : options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Nenhuma atividade encontrada.</div>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={() => {
                    onChange(opt.value);
                    setDisplayLabel(normalizeMaiusculoSemAcento(opt.label));
                    setSearchTerm('');
                    setShowDropdown(false);
                  }}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {normalizeMaiusculoSemAcento(opt.label)}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export const SelectField: React.FC<SelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [options, setOptions] = useState(field.options || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const apiEndpoint = (field as FormField & { apiSelectEndpoint?: string }).apiSelectEndpoint;
    if (apiEndpoint) {
      return; // ApiSelectField handles this
    }
    if (field.dataSource === 'database' && field.dataTable && field.dataValueColumn && field.dataLabelColumn) {
      loadDatabaseOptions();
    } else {
      setOptions(field.options || []);
    }
  }, [field.dataSource, field.dataTable, field.dataValueColumn, field.dataLabelColumn, field.options]);

  const loadDatabaseOptions = async () => {
    if (!field.dataTable || !field.dataValueColumn || !field.dataLabelColumn) return;
    
    try {
      setLoading(true);
      const data = await DatabaseService.getTableData(
        field.dataTable,
        field.dataValueColumn,
        field.dataLabelColumn
      );
      setOptions(data);
    } catch (error) {
      console.error('Erro ao carregar opções do banco:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled || loading}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled || loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">{loading ? 'Carregando...' : 'Selecione...'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// Seleção única com busca - usa field.options ou banco (não codeList)
export const SelectSearchField: React.FC<SelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [options, setOptions] = useState(field.options || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (field.dataSource === 'database' && field.dataTable && field.dataValueColumn && field.dataLabelColumn) {
      loadDatabaseOptions();
    } else {
      setOptions(field.options || []);
    }
  }, [field.dataSource, field.dataTable, field.dataValueColumn, field.dataLabelColumn, field.options]);

  const loadDatabaseOptions = async () => {
    if (!field.dataTable || !field.dataValueColumn || !field.dataLabelColumn) return;
    try {
      setLoading(true);
      const data = await DatabaseService.getTableData(
        field.dataTable,
        field.dataValueColumn,
        field.dataLabelColumn
      );
      setOptions(data);
    } catch (err) {
      console.error('Erro ao carregar opções do banco:', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOptions = options.filter(opt =>
    searchMatches(opt.label, searchTerm) || searchMatches(opt.value, searchTerm)
  );

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = showDropdown ? searchTerm : (selectedOption?.label ?? '');

  const handleSelect = (option: { value: string; label: string }) => {
    onChange(option.value);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchTerm(v);
    if (!v) onChange('');
    setShowDropdown(true);
  };

  const handleFocus = () => {
    if (selectedOption?.label) setSearchTerm(selectedOption.label);
    setShowDropdown(true);
  };

  return (
    <div className="mb-4 relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={field.placeholder || 'Digite para buscar...'}
        disabled={disabled || field.disabled || loading}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled || loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {showDropdown && !disabled && !field.disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

/** Normaliza para busca (sem acentos, minúsculo) */
function normalizeForSearch(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Campo pesquisável: input + dropdown com filtro por texto (lista todas as opções, filtra ao digitar). */
function SearchableSelect({
  label,
  required,
  value,
  options,
  loading,
  disabled,
  placeholder,
  emptyMessage,
  error,
  onSelect,
  onClear,
}: {
  label: string;
  required: boolean;
  value: string;
  options: Array<{ value: string; label: string }>;
  loading: boolean;
  disabled: boolean;
  placeholder: string;
  emptyMessage: string;
  error?: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const normalizedSearch = normalizeForSearch(searchTerm);
  const filteredOptions = options.filter(
    (opt) => !normalizedSearch || normalizeForSearch(opt.label).includes(normalizedSearch)
  );
  const selectedLabel = value ? options.find((o) => o.value === value)?.label : '';
  const displayValue = showDropdown ? searchTerm : (loading && value ? 'Carregando...' : selectedLabel);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            if (!e.target.value && value) onClear();
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          disabled={disabled || loading}
          placeholder={loading ? 'Carregando...' : placeholder}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {showDropdown && !disabled && !loading && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</div>
              ) : (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onMouseDown={() => {
                      onSelect(opt.value);
                      setSearchTerm('');
                      setShowDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

/** Três campos em cascata com pesquisa: DSEI → Polo Base → Aldeia (quando Vive aldeado? = Sim). Lista todas as opções; digitar filtra. */
export interface DseiPoloAldeiaFieldsProps {
  getValue: (key: string) => any;
  setValue: (key: string, value: any) => void;
  getError: (key: string) => string | undefined;
  isFieldRequired: (key: string) => boolean;
  disabled?: boolean;
}

export const DseiPoloAldeiaFields: React.FC<DseiPoloAldeiaFieldsProps> = ({
  getValue,
  setValue,
  getError,
  isFieldRequired,
  disabled,
}) => {
  const dsei = getValue('paciente.distrito_sanitario') ?? '';
  const poloBase = getValue('paciente.polo_base') ?? '';
  const aldeia = getValue('paciente.aldeia') ?? '';
  const [dseiOptions, setDseiOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [poloOptions, setPoloOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [aldeiaOptions, setAldeiaOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingDsei, setLoadingDsei] = useState(true);
  const [loadingPolo, setLoadingPolo] = useState(true);
  const [loadingAldeia, setLoadingAldeia] = useState(true);

  // Busca os 3 com filtros opcionais: pode escolher DSEI, Polo ou Aldeia em qualquer ordem; os outros se adequam.
  useEffect(() => {
    let cancelled = false;
    setLoadingDsei(true);
    setLoadingPolo(true);
    setLoadingAldeia(true);
    const toOpt = (item: any) => ({ value: String(item.value ?? ''), label: String(item.label ?? item.value ?? '') });
    (async () => {
      try {
        const paramsDsei: Record<string, string> = {};
        if (poloBase) paramsDsei.polo_base = poloBase;
        if (aldeia) paramsDsei.aldeia = aldeia;
        const paramsPolo: Record<string, string> = {};
        if (dsei) paramsPolo.dsei = dsei;
        if (aldeia) paramsPolo.aldeia = aldeia;
        const paramsAldeia: Record<string, string> = {};
        if (dsei) paramsAldeia.dsei = dsei;
        if (poloBase) paramsAldeia.polo_base = poloBase;
        const [resDsei, resPolo, resAldeia] = await Promise.all([
          axios.get<any[]>(`${API_BASE}/dsei-polo-aldeia/dseis`, { params: paramsDsei, withCredentials: true }),
          axios.get<any[]>(`${API_BASE}/dsei-polo-aldeia/polos`, { params: paramsPolo, withCredentials: true }),
          axios.get<any[]>(`${API_BASE}/dsei-polo-aldeia/aldeias`, { params: paramsAldeia, withCredentials: true }),
        ]);
        if (cancelled) return;
        const listD = Array.isArray(resDsei.data) ? resDsei.data : [];
        const listP = Array.isArray(resPolo.data) ? resPolo.data : [];
        const listA = Array.isArray(resAldeia.data) ? resAldeia.data : [];
        const optsD = listD.map(toOpt);
        const optsP = listP.map(toOpt);
        const optsA = listA.map(toOpt);
        setDseiOptions(optsD);
        setPoloOptions(optsP);
        setAldeiaOptions(optsA);
        if (!cancelled) {
          if (optsD.length === 1 && !dsei) setValue('paciente.distrito_sanitario', optsD[0].value);
          if (optsP.length === 1 && !poloBase) setValue('paciente.polo_base', optsP[0].value);
          if (optsA.length === 1 && !aldeia) setValue('paciente.aldeia', optsA[0].value);
          if (dsei && optsD.length > 0 && !optsD.some((o) => o.value === dsei)) setValue('paciente.distrito_sanitario', undefined);
          if (poloBase && optsP.length > 0 && !optsP.some((o) => o.value === poloBase)) setValue('paciente.polo_base', undefined);
          if (aldeia && optsA.length > 0 && !optsA.some((o) => o.value === aldeia)) setValue('paciente.aldeia', undefined);
        }
      } catch {
        if (!cancelled) {
          setDseiOptions([]);
          setPoloOptions([]);
          setAldeiaOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingDsei(false);
          setLoadingPolo(false);
          setLoadingAldeia(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [dsei, poloBase, aldeia]);

  const req = (key: string) => isFieldRequired(key);
  const err = (key: string) => getError(key);

  return (
    <div className="space-y-4">
      <SearchableSelect
        label="Nome do distrito sanitário especial"
        required={req('paciente.distrito_sanitario')}
        value={dsei}
        options={dseiOptions}
        loading={loadingDsei}
        disabled={!!disabled}
        placeholder="Digite para pesquisar ou selecione (pode escolher em qualquer ordem)..."
        emptyMessage="Nenhum DSEI encontrado"
        error={err('paciente.distrito_sanitario')}
        onSelect={(v) => setValue('paciente.distrito_sanitario', v)}
        onClear={() => {
          setValue('paciente.distrito_sanitario', undefined);
          setValue('paciente.polo_base', undefined);
          setValue('paciente.aldeia', undefined);
        }}
      />
      <SearchableSelect
        label="Nome do polo base"
        required={req('paciente.polo_base')}
        value={poloBase}
        options={poloOptions}
        loading={loadingPolo}
        disabled={!!disabled}
        placeholder="Digite para pesquisar ou selecione (pode escolher em qualquer ordem)..."
        emptyMessage="Nenhum polo base encontrado"
        error={err('paciente.polo_base')}
        onSelect={(v) => setValue('paciente.polo_base', v)}
        onClear={() => {
          setValue('paciente.polo_base', undefined);
          setValue('paciente.aldeia', undefined);
        }}
      />
      <SearchableSelect
        label="Nome da aldeia"
        required={req('paciente.aldeia')}
        value={aldeia}
        options={aldeiaOptions}
        loading={loadingAldeia}
        disabled={!!disabled}
        placeholder="Digite para pesquisar ou selecione (pode escolher em qualquer ordem)..."
        emptyMessage="Nenhuma aldeia encontrada"
        error={err('paciente.aldeia')}
        onSelect={(v) => setValue('paciente.aldeia', v)}
        onClear={() => setValue('paciente.aldeia', undefined)}
      />
    </div>
  );
};

export const CodeListSelectField: React.FC<SelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [items, setItems] = useState<CodeListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (field.codeList) {
      loadItems();
    }
  }, [field.codeList]);

  const loadItems = async () => {
    if (!field.codeList) return;

    try {
      setLoading(true);
      const data = await CodeListService.getItems(field.codeList);
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar lista de códigos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled || loading}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled || loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">
          {loading ? 'Carregando...' : 'Selecione...'}
        </option>
        {items.map((item) => (
          <option key={item.id} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export const CodeListSearchField: React.FC<SelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [items, setItems] = useState<CodeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CodeListItem | null>(null);

  useEffect(() => {
    if (field.codeList && searchTerm) {
      searchItems(searchTerm);
    } else if (field.codeList && !searchTerm) {
      loadInitialItems();
    }
  }, [searchTerm, field.codeList]);

  useEffect(() => {
    // Carregar item selecionado se houver valor
    if (value && field.codeList && !selectedItem) {
      loadSelectedItem();
    }
  }, [value, field.codeList]);

  const loadInitialItems = async () => {
    if (!field.codeList) return;

    try {
      setLoading(true);
      const data = await CodeListService.searchItems(field.codeList, { limit: 50 });
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchItems = async (query: string) => {
    if (!field.codeList) return;

    try {
      setLoading(true);
      const data = await CodeListService.searchItems(field.codeList, { q: query, limit: 50 });
      setItems(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedItem = async () => {
    if (!field.codeList || !value) return;

    try {
      const data = await CodeListService.searchItems(field.codeList, { q: value, limit: 1 });
      if (data.length > 0) {
        setSelectedItem(data[0]);
        setSearchTerm(data[0].label);
      }
    } catch (error) {
      console.error('Erro ao carregar item selecionado:', error);
    }
  };

  const handleSelect = (item: CodeListItem) => {
    setSelectedItem(item);
    setSearchTerm(item.label);
    onChange(item.code);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    if (!newValue) {
      setSelectedItem(null);
      onChange('');
    }
  };

  return (
    <div className="mb-4 relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        placeholder={field.placeholder || 'Digite para buscar...'}
        disabled={disabled || field.disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      
      {showDropdown && !disabled && !field.disabled && items.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
          )}
          {!loading && items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
            >
              <div className="font-medium">{item.label}</div>
              {item.code && (
                <div className="text-xs text-gray-500">Código: {item.code}</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
