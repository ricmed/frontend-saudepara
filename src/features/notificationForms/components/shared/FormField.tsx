// src/features/notificationForms/components/shared/FormField.tsx
import React from 'react';
import { FormFieldProps } from '@/features/notificationForms/types/index2';

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  error,
  className = '',
  disabled = false,
  options,
  maxLength,
}) => {
  const baseClasses = `w-full p-3 border ${
    error ? 'border-red-500 bg-red-50' : 'border-gray-200'
  } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${
    disabled ? 'bg-gray-100 cursor-not-allowed' : ''
  } ${className}`;

  // Calcular caracteres restantes para textarea com maxLength
  const currentLength = value?.toString().length || 0;
  const isNearLimit = maxLength && currentLength > maxLength * 0.8; // Laranja após 80%
  const isAtLimit = maxLength && currentLength >= maxLength; // Vermelho no limite

  // Classes dinâmicas para o textarea baseado no limite
  const textareaClasses = maxLength 
    ? `w-full p-3 border ${
        isAtLimit ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 
        isNearLimit ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200' : 
        error ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
      } rounded-lg text-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      } ${className}`
    : baseClasses;

  return (
    <div>
      <label htmlFor={name} className="block mb-2 font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {type === 'select' && options ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={baseClasses}
          disabled={disabled}
          data-error={error ? 'true' : 'false'}
        >
          <option value="">Selecione</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <>
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={textareaClasses}
            disabled={disabled}
            data-error={error ? 'true' : 'false'}
            rows={3}
            maxLength={maxLength}
          />
          {maxLength && (
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${
                isAtLimit ? 'text-red-600 font-bold' : 
                isNearLimit ? 'text-orange-600 font-semibold' : 
                'text-gray-500'
              }`}>
                {currentLength} / {maxLength} caracteres
                {isAtLimit && ' - ⚠️ Limite máximo atingido'}
                {isNearLimit && !isAtLimit && ' - ⚠️ Próximo ao limite'}
              </p>
            </div>
          )}
        </>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={baseClasses}
          disabled={disabled}
          data-error={error ? 'true' : 'false'}
          maxLength={maxLength}
        />
      )}

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormField;