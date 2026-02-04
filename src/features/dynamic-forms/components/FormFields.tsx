import React from 'react';
import type { FormField } from '@/services/FormService';

interface TextFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const maxLength = field.maxLength || 1500;
  const currentLength = (value || '').length;
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      <div className="flex justify-between items-center mt-1">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <p className={`text-xs ml-auto ${
          currentLength > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500'
        }`}>
          {currentLength}/{maxLength} caracteres
        </p>
      </div>
    </div>
  );
};

export const DateField: React.FC<TextFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const today = new Date().toISOString().split('T')[0];
  // Usa field.max apenas se for uma string de data válida, caso contrário usa today
  const maxDate = (typeof field.max === 'string' && field.max.match(/^\d{4}-\d{2}-\d{2}$/)) ? field.max : today;

  const incrementDate = () => {
    // Se não houver valor, define como hoje
    if (!value) {
      onChange(today);
      return;
    }
    
    // Se houver valor, incrementa 1 dia
    const currentDate = new Date(value + 'T12:00:00');
    const maxDateObj = new Date(maxDate + 'T12:00:00');
    
    // Só incrementa se a data atual for menor que a máxima
    if (currentDate < maxDateObj) {
      currentDate.setDate(currentDate.getDate() + 1);
      const newDate = currentDate.toISOString().split('T')[0];
      onChange(newDate);
    }
  };

  const decrementDate = () => {
    // Se não houver valor, define como hoje
    if (!value) {
      onChange(today);
      return;
    }
    
    // Se houver valor, decrementa 1 dia
    const currentDate = new Date(value + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() - 1);
    onChange(currentDate.toISOString().split('T')[0]);
  };

  // Desabilita o botão + apenas se já estiver na data máxima
  const isPlusDisabled = disabled || field.disabled || (!!value && value >= maxDate);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={decrementDate}
          disabled={disabled || field.disabled}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md text-gray-700 font-bold"
        >
          −
        </button>
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || field.disabled}
          min={field.min}
          max={maxDate}
          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        <button
          type="button"
          onClick={incrementDate}
          disabled={isPlusDisabled}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md text-gray-700 font-bold"
        >
          +
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export const NumberField: React.FC<TextFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const min = field.min;
  const max = field.max;
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        min={min}
        max={max}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      <div className="flex justify-between items-center mt-1">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {(min !== undefined || max !== undefined) && (
          <p className="text-xs text-gray-500 ml-auto">
            {min !== undefined && max !== undefined
              ? `Valor entre ${min} e ${max}`
              : min !== undefined
              ? `Mínimo: ${min}`
              : `Máximo: ${max}`}
          </p>
        )}
      </div>
    </div>
  );
};

export const TextareaField: React.FC<TextFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const maxLength = field.maxLength || 1500;
  const currentLength = (value || '').length;
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        maxLength={maxLength}
        rows={4}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-y ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      <div className="flex justify-between items-center mt-1">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <p className={`text-xs ml-auto ${
          currentLength > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500'
        }`}>
          {currentLength}/{maxLength} caracteres
        </p>
      </div>
    </div>
  );
};

export const CheckboxField: React.FC<TextFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  return (
    <div className="mb-4">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled || field.disabled}
          className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
            disabled || field.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        />
        <span className="ml-2 text-sm font-medium text-gray-700">
          {field.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
