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
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={baseClasses}
          disabled={disabled}
          data-error={error ? 'true' : 'false'}
          rows={3}
          maxLength={maxLength}
        />
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