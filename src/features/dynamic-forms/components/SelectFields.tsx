import React, { useState, useEffect } from 'react';
import type { FormField } from '@/services/FormService';
import CodeListService, { type CodeListItem } from '@/services/CodeListService';

interface SelectFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">Selecione...</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
