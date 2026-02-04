import React, { useState } from 'react';
import type { FormField } from '@/services/FormService';
import { Search, X } from 'lucide-react';
import PhoneInput from '@/features/notificationForms/components/PhoneInput';

interface AdvancedFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// ========== CHECKBOX GROUP (múltiplos checkboxes) ==========
export const CheckboxGroupField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const selectedValues = Array.isArray(value) ? value : [];

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.helpText && (
        <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
      )}
      <div className="space-y-2">
        {field.options?.map((option) => (
          <label key={option.value} className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              disabled={disabled || field.disabled}
              className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                disabled || field.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            />
            <span className={`ml-2 text-sm text-gray-700 ${
              disabled || field.disabled ? 'opacity-50' : 'group-hover:text-gray-900'
            }`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== RADIO GROUP (grupo de radio buttons) ==========
export const RadioGroupField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.helpText && (
        <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
      )}
      <div className="space-y-2">
        {field.options?.map((option) => (
          <label key={option.value} className="flex items-center cursor-pointer group">
            <input
              type="radio"
              name={field.key}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled || field.disabled}
              className={`w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 ${
                disabled || field.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            />
            <span className={`ml-2 text-sm text-gray-700 ${
              disabled || field.disabled ? 'opacity-50' : 'group-hover:text-gray-900'
            }`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== MULTI SELECT (seleção múltipla com busca) ==========
export const MultiSelectField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const selectedValues = Array.isArray(value) ? value : [];

  const filteredOptions = field.options?.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(selectedValues.filter(v => v !== optionValue));
  };

  const getSelectedLabels = () => {
    return selectedValues
      .map(val => field.options?.find(opt => opt.value === val)?.label)
      .filter(Boolean);
  };

  return (
    <div className="mb-4 relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Valores selecionados */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {getSelectedLabels().map((label, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {label}
              <button
                type="button"
                onClick={() => handleRemove(selectedValues[idx])}
                disabled={disabled || field.disabled}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Campo de busca */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          disabled={disabled || field.disabled}
          placeholder={`Buscar... (${selectedValues.length} selecionado${selectedValues.length !== 1 ? 's' : ''})`}
          className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Dropdown de opções */}
      {showDropdown && !disabled && !field.disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {option.label}
                  </span>
                </label>
              ))
            )}
          </div>
        </>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== TIME FIELD (só hora) ==========
export const TimeField: React.FC<AdvancedFieldProps> = ({
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
      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== DATETIME FIELD (data + hora) ==========
export const DateTimeField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  // Obtém data/hora atual no fuso horário local no formato datetime-local (YYYY-MM-DDTHH:MM)
  const getLocalDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const now = getLocalDateTime();
  // Usa field.max apenas se for uma string válida, caso contrário usa agora como máximo
  const maxDateTime = (typeof field.max === 'string' && field.max.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) ? field.max : now;

  const incrementDateTime = () => {
    // Se não houver valor, define como agora
    if (!value) {
      onChange(now);
      return;
    }
    
    // Se houver valor, incrementa 1 dia
    const currentDateTime = new Date(value);
    const maxDateTimeObj = new Date(maxDateTime);
    
    // Só incrementa se a data/hora atual for menor que a máxima
    if (currentDateTime < maxDateTimeObj) {
      currentDateTime.setDate(currentDateTime.getDate() + 1);
      const year = currentDateTime.getFullYear();
      const month = String(currentDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(currentDateTime.getDate()).padStart(2, '0');
      const hours = String(currentDateTime.getHours()).padStart(2, '0');
      const minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
      onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  };

  const decrementDateTime = () => {
    // Se não houver valor, define como agora
    if (!value) {
      onChange(now);
      return;
    }
    
    // Se houver valor, decrementa 1 dia
    const currentDateTime = new Date(value);
    currentDateTime.setDate(currentDateTime.getDate() - 1);
    const year = currentDateTime.getFullYear();
    const month = String(currentDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentDateTime.getDate()).padStart(2, '0');
    const hours = String(currentDateTime.getHours()).padStart(2, '0');
    const minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
    onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  // Desabilita o botão + apenas se já estiver na data/hora máxima
  const isPlusDisabled = disabled || field.disabled || (!!value && value >= maxDateTime);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={decrementDateTime}
          disabled={disabled || field.disabled}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md text-gray-700 font-bold"
        >
          −
        </button>
        <input
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || field.disabled}
          min={field.min}
          max={maxDateTime}
          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        <button
          type="button"
          onClick={incrementDateTime}
          disabled={isPlusDisabled}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md text-gray-700 font-bold"
        >
          +
        </button>
      </div>
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== EMAIL FIELD ==========
export const EmailField: React.FC<AdvancedFieldProps> = ({
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
      <input
        type="email"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || 'exemplo@email.com'}
        disabled={disabled || field.disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== PHONE FIELD (formatação automática) ==========
export const PhoneField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    
    if (cleaned.length <= 10) {
      // (XX) XXXX-XXXX
      return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      // (XX) XXXXX-XXXX
      return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="tel"
        value={value || ''}
        onChange={handleChange}
        placeholder={field.placeholder || '(91) 98765-4321'}
        disabled={disabled || field.disabled}
        maxLength={15}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== CPF FIELD (formatação automática) ==========
export const CPFField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const formatCPF = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder={field.placeholder || '000.000.000-00'}
        disabled={disabled || field.disabled}
        maxLength={14}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== CEP FIELD (formatação + busca automática) ==========
export const CEPField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [loading, setLoading] = useState(false);

  const formatCEP = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    onChange(formatted);

    // Buscar endereço quando CEP estiver completo
    const cleanedCEP = formatted.replace(/\D/g, '');
    if (cleanedCEP.length === 8) {
      fetchAddress(cleanedCEP);
    }
  };

  const fetchAddress = async (cep: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        // Disparar evento customizado com dados do endereço
        const event = new CustomEvent('cep-found', { 
          detail: { 
            cep,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          } 
        });
        window.dispatchEvent(event);
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
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
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder || '00000-000'}
          disabled={disabled || field.disabled || loading}
          maxLength={9}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled || loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== INTERNATIONAL PHONE FIELD (telefone internacional com DDI) ==========
export const InternationalPhoneField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  return (
    <div className="mb-4">
      <PhoneInput
        value={value || ''}
        onChange={onChange}
        name={field.key}
        label={field.label}
        placeholder={field.placeholder || 'Digite o telefone'}
        className={error ? 'border-red-500' : ''}
      />
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
