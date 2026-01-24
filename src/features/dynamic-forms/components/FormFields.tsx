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
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        min={field.min}
        max={field.max}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
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
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        min={field.min}
        max={field.max}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
        rows={4}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-y ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
