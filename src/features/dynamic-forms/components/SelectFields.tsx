import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { FormField } from '@/services/FormService';
import CodeListService, { type CodeListItem } from '@/services/CodeListService';
import DatabaseService from '@/services/DatabaseService';
import { searchMatches } from '@/utils/searchUtils';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_BASE = `${server}:${port}/api`;

function normalizeMaiusculoSemAcento(s: string): string {
  if (!s) return s;
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

interface SelectFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
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
          if (item.value != null && item.label != null) {
            return { value: String(item.value), label: String(item.label) };
          }
          if (item.idtipo_pais != null && item.descricao != null) {
            return { value: String(item.idtipo_pais), label: String(item.descricao) };
          }
          return { value: String(item.id), label: String(item.descricao ?? item.nome ?? item.label ?? item.id) };
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
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
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const apiEndpoint = (field as FormField & { apiSelectEndpoint?: string }).apiSelectEndpoint;
  const isPaisNascimento = (field as FormField & { key?: string }).key === 'paciente.pais_nascimento_id';

  // País de nascimento: carregar como no notification forms (endpoint index com limit alto para todos os países)
  const fetchUrl = isPaisNascimento
    ? `${API_BASE}/tipo-pais?limit=500`
    : apiEndpoint
      ? `${API_BASE}/${apiEndpoint}`
      : null;

  useEffect(() => {
    if (!fetchUrl) {
      setOptions(field.options || []);
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
        const opts = list.map((item: any) => {
          if (item.value != null && item.label != null) {
            return { value: String(item.value), label: String(item.label) };
          }
          if (item.idtipo_pais != null && item.descricao != null) {
            return { value: String(item.idtipo_pais), label: String(item.descricao) };
          }
          return { value: String(item.id), label: String(item.descricao ?? item.nome ?? item.label ?? item.id) };
        });
        setOptions(opts);
      } catch (e) {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchUrl]);

  const normalizedSearch = (searchTerm || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filteredOptions = options.filter(
    (opt) => !normalizedSearch || opt.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedSearch)
  );
  const selectedLabel = value ? options.find((o) => o.value === value)?.label : '';
  const displayValue = showDropdown
    ? searchTerm
    : (loading && value ? 'Carregando...' : (isPaisNascimento && selectedLabel ? normalizeMaiusculoSemAcento(selectedLabel) : selectedLabel));

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
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
          placeholder={loading ? 'Carregando...' : 'Digite para buscar ou selecione...'}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled || loading ? 'bg-gray-100' : ''}`}
        />
        {showDropdown && filteredOptions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {(isPaisNascimento ? filteredOptions : filteredOptions.slice(0, 100)).map((opt) => (
              <div
                key={opt.value}
                onMouseDown={() => {
                  onChange(opt.value);
                  setSearchTerm('');
                  setShowDropdown(false);
                }}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
              >
                {isPaisNascimento ? normalizeMaiusculoSemAcento(opt.label) : opt.label}
              </div>
            ))}
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
