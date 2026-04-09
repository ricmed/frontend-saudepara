import React from 'react';
import { Check, HelpCircle, X } from 'lucide-react';
import type { FormField } from '@/services/FormService';

function getFieldInputId(field: FormField) {
  const key = (field.key || field.label || 'field').toString();
  return `df-${key}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

interface TextFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const FieldHelp: React.FC<{ helpText: string; label: string }> = ({ helpText, label }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
        aria-label={`Ajuda sobre ${label}`}
        title={`Ajuda sobre ${label}`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {open && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-gray-700 relative">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Fechar ajuda"
            title="Fechar ajuda"
          >
            <X className="h-4 w-4" />
          </button>
          {helpText}
        </div>
      )}
    </div>
  );
};

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
  const inputId = getFieldInputId(field);
  
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {field.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.helpText && <FieldHelp helpText={field.helpText} label={field.label} />}
      </div>
      <input
        id={inputId}
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
  const inputId = getFieldInputId(field);

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
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
          id={inputId}
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
  const nowYear = new Date().getFullYear();
  const isAnoReferencia = field.key === 'cabecalho.ano';
  const isCurrency = String(field.key || '').startsWith('custo.');
  const min = isAnoReferencia ? nowYear : field.min;
  const max = isAnoReferencia ? nowYear + 10 : field.max;
  const inputId = getFieldInputId(field);
  const step =
    typeof (field as any).step === 'number' && Number.isFinite((field as any).step)
      ? (field as any).step
      : isCurrency
      ? 0.01
      : 1;

  // UX: para campos numéricos com faixa (min/max) faz sentido usar stepper consistente com DateField.
  const showStepper = !isCurrency && (isAnoReferencia || min !== undefined || max !== undefined);
  const numericValue = value === '' || value === null || value === undefined ? undefined : Number(value);
  const canDecrement = !disabled && !field.disabled && (numericValue === undefined ? true : (min === undefined ? true : numericValue > min));
  const canIncrement = !disabled && !field.disabled && (numericValue === undefined ? true : (max === undefined ? true : numericValue < max));

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const handleDecrement = () => {
    if (!canDecrement) return;
    const base = numericValue ?? (min ?? 0);
    onChange(clamp(base - step));
  };

  const handleIncrement = () => {
    if (!canIncrement) return;
    const base = numericValue ?? (min ?? 0);
    onChange(clamp(base + step));
  };

  const parseNumericInput = (raw: string) => {
    if (!raw) return '';
    // Aceitar vírgula como decimal (pt-BR)
    const normalized = raw.replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : '';
  };
  
  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {showStepper ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={!canDecrement}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md text-gray-700 font-bold"
            aria-label={`Diminuir ${field.label}`}
            title={`Diminuir ${field.label}`}
          >
            −
          </button>
          <input
            id={inputId}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(parseNumericInput(e.target.value))}
            placeholder={field.placeholder}
            disabled={disabled || field.disabled}
            min={min}
            max={max}
            step={step}
            inputMode="numeric"
            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
          <button
            type="button"
            onClick={handleIncrement}
            disabled={!canIncrement}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md text-gray-700 font-bold"
            aria-label={`Aumentar ${field.label}`}
            title={`Aumentar ${field.label}`}
          >
            +
          </button>
        </div>
      ) : (
        <div className={isCurrency ? 'flex items-stretch' : ''}>
          {isCurrency && (
            <span className="inline-flex items-center px-3 rounded-l-md border border-gray-300 bg-gray-50 text-gray-700 text-sm">
              R$
            </span>
          )}
          <input
            id={inputId}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(parseNumericInput(e.target.value))}
            placeholder={field.placeholder}
            disabled={disabled || field.disabled}
            min={min}
            max={max}
            step={step}
            inputMode="decimal"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } ${
              disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isCurrency ? 'rounded-l-none' : ''
            }`}
          />
        </div>
      )}
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      <div className="flex justify-between items-center mt-1">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {((min !== undefined && min !== 0) || max !== undefined) && (
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

type MoneyFieldVariant = 'currency' | 'accounting';

const MoneyFieldBase: React.FC<TextFieldProps & { variant: MoneyFieldVariant }> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
  variant,
}) => {
  const inputId = getFieldInputId(field);
  const numericValue =
    value === '' || value === null || value === undefined ? undefined : Number(value);
  const isNegative =
    typeof numericValue === 'number' && Number.isFinite(numericValue) && numericValue < 0;

  const [isEditing, setIsEditing] = React.useState(false);
  const [text, setText] = React.useState('');

  const formatBRLNumber = (n: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(n));
    // "R$ 50,00" -> "50,00" (prefixo fica no addon do input)
    return formatted.replace(/^R\$\s?/, '').trim();
  };

  const toDisplayFormatted = (n?: number) => {
    if (n === undefined || n === null || !Number.isFinite(n)) return '';
    const base = formatBRLNumber(n);
    if (variant === 'accounting' && n < 0) return `(${base})`;
    return base;
  };

  const toEditingText = (n?: number) => {
    if (n === undefined || n === null || !Number.isFinite(n)) return '';
    // Em edição: sem parênteses, sem "R$"; usa vírgula pra decimal
    return String(n).replace('.', ',');
  };

  // Sincroniza texto quando não está editando
  React.useEffect(() => {
    if (isEditing) return;
    setText(toDisplayFormatted(numericValue));
  }, [isEditing, numericValue, variant]);

  const parseDisplayToNumber = (raw: string): number | '' => {
    const trimmed = (raw ?? '').toString().trim();
    if (!trimmed) return '';

    // Permite "(50,00)" para contábil
    const hasParens = trimmed.startsWith('(') && trimmed.endsWith(')');
    const cleaned = trimmed
      .replace(/[R$\s]/g, '')
      .replace(/[()]/g, '')
      .replace(/\./g, '') // milhares
      .replace(',', '.'); // decimal

    // Permitir apenas números, ponto e sinal
    const normalized = cleaned.replace(/[^0-9.\-]/g, '');
    const n = Number(normalized);
    if (!Number.isFinite(n)) return '';
    return hasParens ? -Math.abs(n) : n;
  };

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-stretch">
        <span className="inline-flex items-center px-3 rounded-l-md border border-gray-300 bg-gray-50 text-gray-700 text-sm">
          R$
        </span>
        <input
          id={inputId}
          type="text"
          value={text}
          onFocus={() => {
            setIsEditing(true);
            setText(toEditingText(numericValue));
          }}
          onBlur={() => {
            setIsEditing(false);
            const parsed = parseDisplayToNumber(text);
            if (parsed === '') {
              onChange('');
              setText('');
              return;
            }
            onChange(parsed);
            setText(toDisplayFormatted(parsed));
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            const parsed = parseDisplayToNumber(raw);
            // Atualiza valor quando parsear, mas sem forçar formatação enquanto digita
            if (parsed === '') {
              onChange('');
            } else {
              onChange(parsed);
            }
          }}
          placeholder={field.placeholder}
          disabled={disabled || field.disabled}
          min={field.min}
          max={field.max}
          inputMode="decimal"
          className={`w-full px-3 py-2 border rounded-md rounded-l-none focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : isNegative && variant === 'accounting'
              ? 'border-amber-400 focus:ring-amber-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
      </div>
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export const CurrencyField: React.FC<TextFieldProps> = (props) => (
  <MoneyFieldBase {...props} variant="currency" />
);

export const AccountingField: React.FC<TextFieldProps> = (props) => (
  <MoneyFieldBase {...props} variant="accounting" />
);

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
  const inputId = getFieldInputId(field);
  
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {field.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.helpText && <FieldHelp helpText={field.helpText} label={field.label} />}
      </div>
      <textarea
        id={inputId}
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
  const storeAs01 = (field as any).storeAs01 === true;
  const isChecked = storeAs01 ? String(value ?? '') === '1' : !!value;
  return (
    <div className="mb-4">
      <label
        className={`
          flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200
          ${disabled || field.disabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${isChecked
            ? 'bg-blue-50 border-2 border-blue-500 shadow-md scale-[1.02]'
            : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
          }
        `}
      >
        <div className="flex items-center h-6 mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              if (storeAs01) onChange(e.target.checked ? '1' : '0');
              else onChange(e.target.checked);
            }}
            disabled={disabled || field.disabled}
            className="w-6 h-6 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
          />
        </div>
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <span className={`text-sm font-medium transition-colors leading-relaxed ${
            isChecked ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {field.label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
          {isChecked && (
            <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          )}
        </div>
      </label>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
