import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { FormField } from '@/services/FormService';
import { getLocalDateTime, convertUTCToLocalDateTime } from '@/utils/timezoneUtils';
import { getMatchingSynonym, searchMatches, searchMatchesWithSynonyms } from '@/utils/searchUtils';
import DatabaseService from '@/services/DatabaseService';
import { Search, X, Check } from 'lucide-react';
import { getMunicipioBandeiraPathBase } from '@/utils/municipioBandeiraPa';
import PhoneInput from '@/features/notificationForms/components/PhoneInput';
import { validateCPF } from '@/utils/cpfValidator';
import { validateCNS } from '@/utils/cnsValidator';
import { validatePassaporte, normalizePassaporte } from '@/utils/passaporteValidator';
import axios from 'axios';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';
import { buildApiSelectQueryParams } from './SelectFields';
import {
  DF_CHOICE_WITH_TEXT_DEFAULT_VALUE,
  radioChoiceOtherTextKey,
} from '@/features/dynamic-forms/utils/radioChoiceOther';
import { optionsChoiceGridClass } from '@/features/dynamic-forms/utils/optionsChoiceGridClass';
import {
  renderDynamicFieldLabel,
  renderDynamicOptionLabel,
} from '@/features/dynamic-forms/utils/sinanFichaUi';
import { filterApiSelectOptionsForField } from '@/features/dynamic-forms/utils/apiSelectOptionFilters';

const API_ROOT = getRuntimeApiRoot();

function getFieldInputId(field: FormField) {
  const key = (field.key || field.label || 'field').toString();
  return `df-${key}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

interface AdvancedFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  /** Lê valores de outros campos do formulário (para filtros/params). */
  getValue?: (key: string) => any;
  /** Persiste valor em outra chave (ex.: texto da opção “Outro” em radio, select em cartões ou checkbox-group). */
  setValue?: (key: string, value: any) => void;
  wrapperClassName?: string;
  reserveCharCountSpace?: boolean;
  compact?: boolean;
}

// ========== CHECKBOX GROUP (múltiplos checkboxes) ==========
export const CheckboxGroupField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
  getValue,
  setValue,
}) => {
  const selectedValues = Array.isArray(value) ? value : [];
  const [options, setOptions] = useState(field.options || []);
  const [loading, setLoading] = useState(false);
  const inputId = getFieldInputId(field);
  const choiceWithText = Boolean(field.choiceWithText) && typeof setValue === 'function' && typeof getValue === 'function';
  const otherSentinelRaw = String(field.choiceWithTextValue ?? DF_CHOICE_WITH_TEXT_DEFAULT_VALUE).trim();
  const otherSentinel = otherSentinelRaw || DF_CHOICE_WITH_TEXT_DEFAULT_VALUE;
  const otherTextKey = radioChoiceOtherTextKey(field.key);
  const otherLabel = (field.choiceWithTextLabel ?? 'Outro').trim() || 'Outro';
  const otherTextValue = choiceWithText ? String(getValue!(otherTextKey) ?? '') : '';
  const sentinelCollides = options.some((o) => String(o.value) === otherSentinel);
  const otherSelected = selectedValues.includes(otherSentinel);

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
    } catch (error) {
      console.error('Erro ao carregar opções do banco:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      const next = selectedValues.filter((v) => v !== optionValue);
      onChange(next);
      if (choiceWithText && setValue && optionValue === otherSentinel) {
        setValue(otherTextKey, undefined);
      }
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const ensureOtherSelected = () => {
    if (!selectedValues.includes(otherSentinel)) {
      onChange([...selectedValues, otherSentinel]);
    }
  };

  if (loading) {
    return (
      <div className="mb-4">
        {renderDynamicFieldLabel({
          field,
          required,
          htmlFor: inputId,
          className: 'block text-sm font-medium text-gray-700 mb-2',
        })}
        <p className="text-sm text-gray-500">Carregando opções...</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.helpText && (
        <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
      )}
      {choiceWithText && sentinelCollides && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2">
          Alguma opção usa o mesmo valor interno da opção com texto; altere o valor dessa opção ou o valor interno nas configurações do campo.
        </p>
      )}
      <div className={optionsChoiceGridClass(field)}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <label
              key={option.value}
              className={`
                flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200
                ${disabled || field.disabled ? 'opacity-60 cursor-not-allowed' : ''}
                ${isSelected
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-md scale-[1.02]'
                  : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-center h-6 mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(option.value)}
                  disabled={disabled || field.disabled}
                  className="w-6 h-6 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                {renderDynamicOptionLabel({ option, field, selected: isSelected })}
                {isSelected && (
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
              </div>
            </label>
          );
        })}
      </div>
      {choiceWithText && !sentinelCollides && (
        <div className="mt-3 sm:col-span-2">
          <label
            className={`
              flex flex-wrap items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200
              ${disabled || field.disabled ? 'opacity-60 cursor-not-allowed' : ''}
              ${otherSelected
                ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-center h-6 flex-shrink-0">
              <input
                type="checkbox"
                checked={otherSelected}
                onChange={() => handleToggle(otherSentinel)}
                disabled={disabled || field.disabled}
                className="w-6 h-6 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
              />
            </div>
            <span className={`text-sm font-medium shrink-0 ${otherSelected ? 'text-blue-900' : 'text-gray-900'}`}>
              {otherLabel}
            </span>
            <input
              type="text"
              value={otherSelected ? otherTextValue : ''}
              onChange={(e) => setValue!(otherTextKey, e.target.value)}
              onClick={() => {
                if (!(disabled || field.disabled)) ensureOtherSelected();
              }}
              onFocus={() => {
                if (!(disabled || field.disabled)) ensureOtherSelected();
              }}
              disabled={disabled || field.disabled || !otherSelected}
              placeholder={field.choiceWithTextPlaceholder || 'Digite aqui…'}
              className="flex-1 min-w-[10rem] bg-transparent border-0 border-b-2 border-dotted border-gray-400 px-1 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              aria-label={otherLabel}
            />
            {otherSelected && <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />}
          </label>
        </div>
      )}
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
  getValue,
  setValue,
}) => {
  const [options, setOptions] = useState(field.options || []);
  const [loading, setLoading] = useState(false);
  const inputId = getFieldInputId(field);
  const choiceWithText = Boolean(field.choiceWithText) && typeof setValue === 'function' && typeof getValue === 'function';
  const otherSentinelRaw = String(field.choiceWithTextValue ?? DF_CHOICE_WITH_TEXT_DEFAULT_VALUE).trim();
  const otherSentinel = otherSentinelRaw || DF_CHOICE_WITH_TEXT_DEFAULT_VALUE;
  const otherTextKey = radioChoiceOtherTextKey(field.key);
  const otherLabel = (field.choiceWithTextLabel ?? 'Outro').trim() || 'Outro';
  const otherTextValue = choiceWithText ? String(getValue!(otherTextKey) ?? '') : '';
  const sentinelCollides = options.some((o) => String(o.value) === otherSentinel);

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
    } catch (error) {
      console.error('Erro ao carregar opções do banco:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-4">
        {renderDynamicFieldLabel({
          field,
          required,
          htmlFor: inputId,
          className: 'block text-sm font-medium text-gray-700 mb-2',
        })}
        <p className="text-sm text-gray-500">Carregando opções...</p>
      </div>
    );
  }

  const selectMain = (next: string) => {
    onChange(next);
    if (choiceWithText && setValue && next !== otherSentinel) {
      setValue(otherTextKey, undefined);
    }
  };

  const compactTiles = field.compactTiles === true;
  const doseRowTiles = !compactTiles && field.doseRowTiles === true;
  const doseRowStacked = doseRowTiles && field.gridCols === 1;
  const inlineTiles = !compactTiles && !doseRowTiles && field.inlineTiles === true;
  const hideLabel = field.hideLabel === true;
  const tightTiles = compactTiles || inlineTiles || doseRowTiles;

  return (
    <div className={tightTiles ? 'mb-0' : 'mb-4'}>
      {renderDynamicFieldLabel({
        field,
        required,
        htmlFor: inputId,
        hideLabel,
        className: hideLabel
          ? ''
          : `block font-medium text-gray-700 ${compactTiles ? 'text-xs mb-1' : 'text-sm mb-2'}`,
      })}
      {field.helpText && (
        <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
      )}
      {choiceWithText && sentinelCollides && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2">
          Alguma opção usa o mesmo valor interno da opção com texto; altere o valor dessa opção ou o valor interno nas configurações do campo.
        </p>
      )}
      <div
        className={
          compactTiles
            ? 'grid grid-cols-2 gap-1.5'
            : doseRowTiles
              ? `grid w-full ${
                  doseRowStacked ? 'grid-cols-1 gap-1' : 'grid-cols-2 gap-2'
                }`
              : inlineTiles
                ? 'inline-grid w-max grid-cols-2 gap-2'
                : optionsChoiceGridClass(field)
        }
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const naoReagenteCompact =
            doseRowStacked &&
            (option.value === '2' || String(option.label).toLowerCase().includes('não reagente'));
          return (
            <label
              key={option.value}
              className={
                compactTiles
                  ? `flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 transition-colors ${
                      disabled || field.disabled ? 'cursor-not-allowed opacity-60' : ''
                    } ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`
                  : doseRowTiles
                    ? `flex min-w-0 w-full cursor-pointer items-center border-2 transition-colors ${
                        doseRowStacked
                          ? 'gap-2 rounded-md px-2.5 py-2 justify-start'
                          : 'gap-2 rounded-lg px-2.5 py-2 justify-center'
                      } ${disabled || field.disabled ? 'cursor-not-allowed opacity-60' : ''} ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                      }`
                    : inlineTiles
                      ? `flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2.5 transition-colors ${
                          disabled || field.disabled ? 'cursor-not-allowed opacity-60' : ''
                        } ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`
                      : `
                flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200
                ${disabled || field.disabled ? 'opacity-60 cursor-not-allowed' : ''}
                ${
                  isSelected
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md scale-[1.02]'
                    : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                }
              `
              }
            >
              <div
                className={
                  tightTiles
                    ? 'flex shrink-0 items-center'
                    : 'flex items-center h-6 mt-0.5 flex-shrink-0'
                }
              >
                <input
                  type="radio"
                  name={field.key}
                  checked={isSelected}
                  onChange={() => selectMain(option.value)}
                  disabled={disabled || field.disabled}
                  className={
                    compactTiles
                      ? 'h-3.5 w-3.5 text-blue-600'
                      : doseRowTiles
                        ? doseRowStacked
                          ? 'h-3.5 w-3.5 shrink-0 text-blue-600'
                          : 'h-5 w-5 rounded-full border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0'
                        : inlineTiles
                          ? 'h-4 w-4 text-blue-600'
                          : 'w-6 h-6 rounded-full border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer'
                  }
                />
              </div>
              <div
                className={
                  tightTiles
                    ? 'min-w-0'
                    : 'flex-1 min-w-0 flex items-start justify-between gap-2'
                }
              >
                <span
                  className={
                    compactTiles
                      ? 'inline-flex min-w-0'
                      : doseRowTiles || inlineTiles
                        ? `min-w-0 inline-flex ${
                            doseRowStacked ? `${naoReagenteCompact ? 'text-[13px]' : 'text-sm'}` : 'text-sm'
                          }`
                        : 'inline-flex min-w-0'
                  }
                >
                  {renderDynamicOptionLabel({ option, field, selected: isSelected })}
                </span>
                {!tightTiles && isSelected && (
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
              </div>
            </label>
          );
        })}
      </div>
      {choiceWithText && !sentinelCollides && (
        <div className="mt-3 sm:col-span-2">
          <label
            className={`
              flex flex-wrap items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200
              ${disabled || field.disabled ? 'opacity-60 cursor-not-allowed' : ''}
              ${value === otherSentinel
                ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-center h-6 flex-shrink-0">
              <input
                type="radio"
                name={field.key}
                checked={value === otherSentinel}
                onChange={() => selectMain(otherSentinel)}
                disabled={disabled || field.disabled}
                className="w-6 h-6 rounded-full border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
              />
            </div>
            <span className={`text-sm font-medium shrink-0 ${value === otherSentinel ? 'text-blue-900' : 'text-gray-900'}`}>
              {otherLabel}
            </span>
            <input
              type="text"
              value={value === otherSentinel ? otherTextValue : ''}
              onChange={(e) => setValue!(otherTextKey, e.target.value)}
              onClick={() => {
                if (!(disabled || field.disabled)) selectMain(otherSentinel);
              }}
              onFocus={() => {
                if (!(disabled || field.disabled)) selectMain(otherSentinel);
              }}
              disabled={disabled || field.disabled || value !== otherSentinel}
              placeholder={field.choiceWithTextPlaceholder || 'Digite aqui…'}
              className="flex-1 min-w-[10rem] bg-transparent border-0 border-b-2 border-dotted border-gray-400 px-1 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              aria-label={otherLabel}
            />
            {value === otherSentinel && <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />}
          </label>
        </div>
      )}
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
  getValue,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState(field.options || []);
  const [loading, setLoading] = useState(false);
  const selectedValues = Array.isArray(value) ? value : [];

  useEffect(() => {
    if (field.apiSelectEndpoint) {
      loadApiOptions();
      return;
    }

    if (field.dataSource === 'database' && field.dataTable && field.dataValueColumn && field.dataLabelColumn) {
      loadDatabaseOptions();
      return;
    }

    setOptions(field.options || []);
  }, [
    field.apiSelectEndpoint,
    JSON.stringify(field.apiSelectEndpointParams || []),
    JSON.stringify((field as FormField & { apiSelectStaticParams?: Record<string, string> }).apiSelectStaticParams || {}),
    ...(field.apiSelectEndpointParams || []).map((k) => getValue?.(k)),
    field.dataSource,
    field.dataTable,
    field.dataValueColumn,
    field.dataLabelColumn,
    field.options,
  ]);

  const loadApiOptions = async () => {
    if (!field.apiSelectEndpoint) return;

    try {
      setLoading(true);

      const params = buildApiSelectQueryParams(field, getValue);

      const response = await axios.get(`${API_ROOT}/${field.apiSelectEndpoint}`, {
        params,
        withCredentials: true,
      });

      const data = Array.isArray(response.data) ? response.data : [];
      const mapped = data.map((item: any) => ({
        value: String(item.value ?? item.idtipo_municipio ?? item.id ?? item.codigo ?? ''),
        label: String(item.label ?? item.descricao ?? item.nome ?? item.name ?? item.text ?? item.value ?? ''),
        termoOficial: String(item.termoOficial ?? item.label ?? ''),
        aliases: Array.isArray(item.aliases ?? item.sinonimos)
          ? (item.aliases ?? item.sinonimos).map((v: unknown) => String(v)).filter(Boolean)
          : undefined,
        sinonimos: Array.isArray(item.sinonimos ?? item.aliases)
          ? (item.sinonimos ?? item.aliases).map((v: unknown) => String(v)).filter(Boolean)
          : undefined,
      })).filter((o: any) => o.value && o.label);

      setOptions(filterApiSelectOptionsForField(mapped, field, value));
    } catch (error) {
      console.error('Erro ao carregar opções da API:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredOptions = options
    .filter((option) =>
      searchTerm === ''
        ? true
        : searchMatchesWithSynonyms(
            {
              label: option.label,
              termoOficial: option.termoOficial ?? option.label,
              aliases: option.aliases ?? option.sinonimos,
              sinonimos: option.sinonimos,
            },
            searchTerm,
          ),
    )
    .map((option) => ({
      ...option,
      matchingSynonym: getMatchingSynonym(
        {
          label: option.label,
          termoOficial: option.termoOficial ?? option.label,
          aliases: option.aliases ?? option.sinonimos,
          sinonimos: option.sinonimos,
        },
        searchTerm,
      ),
    }));

  const allOptionValues = useMemo(
    () => options.map((o) => o.value).filter((v) => v !== '' && v != null),
    [options],
  );

  const allOptionsSelected =
    allOptionValues.length > 0 && allOptionValues.every((v) => selectedValues.includes(v));

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  /** Só monitoramento QDQQ — mesmo padrão de arquivos do dashboard DAE (public/images/bandeiras_pa_mini). */
  const showMunicipioBandeiraPa = field.key === 'acao.municipios_alcancados';

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {selectedValues.length > 0 && (
          <span className="text-sm text-gray-500">
            {selectedValues.length} selecionado{selectedValues.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {field.helpText && (
        <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
      )}
      {/* Busca */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled || field.disabled}
          placeholder="Buscar opções..."
          className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
          }`}
        />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          disabled={
            disabled ||
            field.disabled ||
            loading ||
            allOptionValues.length === 0 ||
            allOptionsSelected
          }
          onClick={() => onChange(Array.from(new Set(allOptionValues)))}
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Selecionar todos
        </button>
        <button
          type="button"
          disabled={disabled || field.disabled || selectedValues.length === 0}
          onClick={() => onChange([])}
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpar seleção
        </button>
      </div>
      {/* Grid de cards (mesmo layout do checkbox group / radio) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="col-span-full py-4 text-center text-sm text-gray-500">
            Carregando opções...
          </div>
        ) : filteredOptions.length === 0 ? (
          <div className="col-span-full py-4 text-center text-sm text-gray-500">
            Nenhuma opção encontrada
          </div>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const bandeiraBase = showMunicipioBandeiraPa ? getMunicipioBandeiraPathBase(option.label) : '';
            const helpButton =
              'helpButton' in option && option.helpButton ? option.helpButton : null;
            return (
              <div
                key={option.value}
                className={`
                  flex items-start gap-2 p-4 rounded-xl transition-all duration-200
                  ${disabled || field.disabled ? 'opacity-60' : ''}
                  ${isSelected
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md scale-[1.02]'
                    : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                  }
                `}
              >
                <label
                  className={`flex flex-1 items-start gap-3 min-w-0 cursor-pointer ${
                    disabled || field.disabled ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center h-6 mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(option.value)}
                      disabled={disabled || field.disabled}
                      className="w-6 h-6 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                    <span
                      className={`flex items-center gap-2 min-w-0 text-sm font-medium transition-colors leading-relaxed ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}
                    >
                      {showMunicipioBandeiraPa && bandeiraBase ? (
                        <img
                          src={`${bandeiraBase}.jpg`}
                          alt={`Bandeira de ${option.label}`}
                          className="w-9 h-6 shrink-0 object-cover rounded border border-gray-200 shadow-sm"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.endsWith('.jpg')) {
                              target.src = `${bandeiraBase}.png`;
                            } else {
                              target.style.display = 'none';
                            }
                          }}
                        />
                      ) : null}
                      <span className="min-w-0">
                        <span className="block truncate">{option.label}</span>
                        {'matchingSynonym' in option && option.matchingSynonym ? (
                          <span className="block text-xs text-blue-600 mt-0.5 truncate">
                            encontrado por: &quot;{option.matchingSynonym}&quot;
                          </span>
                        ) : null}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    ) : null}
                  </div>
                </label>
                {helpButton ? (
                  <div className="flex-shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                    {helpButton}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
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
  // Normaliza o valor vindo do backend (se for UTC, converte para local)
  const normalizedValue = React.useMemo(() => {
    if (!value) return '';
    
    // Se o valor já está no formato datetime-local (YYYY-MM-DDTHH:MM), usar direto
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      return value;
    }
    
    // Se parece com UTC ou ISO, converter
    if (typeof value === 'string' && (value.includes('Z') || value.includes('+') || value.length > 16)) {
      return convertUTCToLocalDateTime(value);
    }
    
    return value;
  }, [value]);

  const now = getLocalDateTime();
  // Usa field.max apenas se for uma string válida, caso contrário usa agora como máximo
  const maxDateTime = (typeof field.max === 'string' && field.max.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) ? field.max : now;

  const incrementDateTime = () => {
    // Se não houver valor, define como agora
    if (!normalizedValue) {
      onChange(now);
      return;
    }
    
    // Se houver valor, incrementa 1 dia
    const currentDateTime = new Date(normalizedValue);
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
    if (!normalizedValue) {
      onChange(now);
      return;
    }
    
    // Se houver valor, decrementa 1 dia
    const currentDateTime = new Date(normalizedValue);
    currentDateTime.setDate(currentDateTime.getDate() - 1);
    const year = currentDateTime.getFullYear();
    const month = String(currentDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentDateTime.getDate()).padStart(2, '0');
    const hours = String(currentDateTime.getHours()).padStart(2, '0');
    const minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
    onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  // Desabilita o botão + apenas se já estiver na data/hora máxima
  const isPlusDisabled = disabled || field.disabled || (!!normalizedValue && normalizedValue >= maxDateTime);

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
          value={normalizedValue}
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
  onBlur,
}) => {
  const formatCPF = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    onChange(formatted);
  };

  const digits = (value || '').replace(/\D/g, '');
  const isValidCpf = digits.length === 11 && validateCPF(value || '');

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
        onBlur={onBlur}
        placeholder={field.placeholder || '000.000.000-00'}
        disabled={disabled || field.disabled}
        maxLength={14}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : isValidCpf
              ? 'border-green-500 focus:ring-green-500'
              : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {isValidCpf && !error && <p className="text-green-600 text-sm mt-1">CPF válido</p>}
    </div>
  );
};

// ========== CNS (Cartão Nacional de Saúde): 15 dígitos, formato 11 4 1 ==========
export const CNSField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
  onBlur,
}) => {
  const formatCNS = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 15);
    if (digits.length <= 11) return digits.replace(/(\d{0,11})/, '$1');
    if (digits.length <= 15) return digits.replace(/(\d{11})(\d{0,4})(\d{0,1})/, '$1 $2 $3').trim();
    return digits.slice(0, 15).replace(/(\d{11})(\d{4})(\d{1})/, '$1 $2 $3');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNS(e.target.value);
    onChange(formatted);
  };

  const displayValue = value != null ? formatCNS(String(value).replace(/\D/g, '')) : '';
  const digits = (value != null ? String(value).replace(/\D/g, '') : '').slice(0, 15);
  const isValidCns = digits.length === 15 && validateCNS(value != null ? String(value) : '');

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={field.placeholder || '000 0000 0000 0'}
        disabled={disabled || field.disabled}
        maxLength={18}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : isValidCns
              ? 'border-green-500 focus:ring-green-500'
              : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {isValidCns && !error && <p className="text-green-600 text-sm mt-1">CNS válido</p>}
    </div>
  );
};

// ========== IDADE (anos ou meses, salva em meses; máx. 120 anos) ==========
const IDADE_MAX_ANOS = 120;

export interface IdadeFieldProps extends AdvancedFieldProps {
  /** Quando true, valor é calculado a partir da data de nascimento e o campo fica bloqueado */
  calculadaPorDataNascimento?: boolean;
}

export const IdadeField: React.FC<IdadeFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
  onBlur,
  calculadaPorDataNascimento = false,
}) => {
  const somenteAnos = Boolean((field as { somenteAnos?: boolean }).somenteAnos);
  const idadeMinAnos =
    typeof (field as { idadeMinAnos?: number }).idadeMinAnos === 'number'
      ? (field as { idadeMinAnos: number }).idadeMinAnos
      : 0;
  const idadeMaxAnos =
    typeof (field as { idadeMaxAnos?: number }).idadeMaxAnos === 'number'
      ? (field as { idadeMaxAnos: number }).idadeMaxAnos
      : IDADE_MAX_ANOS;
  const idadeMaxMesesCampo =
    typeof (field as { idadeMaxMeses?: number }).idadeMaxMeses === 'number'
      ? (field as { idadeMaxMeses: number }).idadeMaxMeses
      : 11;
  const meses = value != null && value !== '' ? Number(value) : undefined;
  const isAnos = (m: number) => m >= 12;
  const [unidade, setUnidade] = useState<'anos' | 'meses'>(() =>
    somenteAnos ? 'anos' : meses !== undefined ? (isAnos(meses) ? 'anos' : 'meses') : 'anos'
  );
  const [erroMinIdade, setErroMinIdade] = useState(false);
  const [erroMaxIdade, setErroMaxIdade] = useState(false);
  const [erroMaxMeses, setErroMaxMeses] = useState(false);
  /** Após blur com 0–9: próximo dígito substitui o valor (não concatena). */
  const [substituirProximoDigito, setSubstituirProximoDigito] = useState(false);
  const idadeAnosRestrita = somenteAnos && idadeMinAnos > 0;
  const displayAnos = meses !== undefined ? Math.floor(meses / 12) : '';
  const displayMeses = meses !== undefined ? meses % 12 : '';
  const unidadeEfetiva = somenteAnos ? 'anos' : unidade;
  const inputValue =
    unidadeEfetiva === 'anos'
      ? displayAnos !== ''
        ? String(displayAnos)
        : ''
      : displayMeses !== ''
        ? String(displayMeses)
        : '';

  const handleUnidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setErroMinIdade(false);
    setErroMaxIdade(false);
    setErroMaxMeses(false);
    const u = e.target.value as 'anos' | 'meses';
    setUnidade(u);
    if (meses !== undefined) {
      if (u === 'anos') onChange(Math.floor(meses / 12) * 12);
      else onChange(meses % 12);
    }
  };

  const validateIdadeAnos = (num: number): boolean => {
    if (num < idadeMinAnos) {
      setErroMinIdade(true);
      setErroMaxIdade(false);
      return false;
    }
    if (num > idadeMaxAnos) {
      setErroMaxIdade(true);
      setErroMinIdade(false);
      return false;
    }
    setErroMinIdade(false);
    setErroMaxIdade(false);
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErroMaxMeses(false);
    let raw = e.target.value.replace(/\D/g, '');

    if (raw === '') {
      setErroMinIdade(false);
      setErroMaxIdade(false);
      setSubstituirProximoDigito(false);
      onChange(undefined);
      return;
    }

    if (idadeAnosRestrita) {
      if (substituirProximoDigito) {
        raw = raw.slice(-1);
        setSubstituirProximoDigito(false);
      }
      if (raw.length > 2) {
        raw = raw.slice(0, 2);
      }

      const num = parseInt(raw, 10);
      if (num > idadeMaxAnos) {
        setErroMaxIdade(true);
        setErroMinIdade(false);
        return;
      }

      onChange(num * 12);
      if (num >= idadeMinAnos && num <= idadeMaxAnos) {
        setErroMinIdade(false);
        setErroMaxIdade(false);
      } else {
        setErroMaxIdade(false);
      }
      return;
    }

    const num = parseInt(raw, 10);
    if (unidadeEfetiva === 'anos') {
      onChange(num * 12);
      if (num >= idadeMinAnos && num <= idadeMaxAnos) {
        setErroMinIdade(false);
        setErroMaxIdade(false);
      }
    } else {
      if (num > idadeMaxMesesCampo) {
        setErroMaxMeses(true);
        return;
      }
      setErroMaxMeses(false);
      onChange(num);
    }
  };

  const handleIdadeBlur = () => {
    if (unidadeEfetiva === 'anos' && meses !== undefined && meses !== '') {
      const anos = Math.floor(Number(meses) / 12);
      const ok = validateIdadeAnos(anos);
      if (idadeAnosRestrita && !ok && anos < idadeMinAnos) {
        setSubstituirProximoDigito(true);
      } else {
        setSubstituirProximoDigito(false);
      }
    } else {
      setSubstituirProximoDigito(false);
    }
    onBlur?.();
  };

  const locked = disabled || field.disabled || calculadaPorDataNascimento;

  const labelSuffix = calculadaPorDataNascimento ? (
    <span className="text-xs text-gray-500 ml-2">(calculada automaticamente)</span>
  ) : null;

  if (locked && meses !== undefined && meses !== '') {
    const anos = Math.floor(Number(meses) / 12);
    const mes = Number(meses) % 12;
    const texto = Number(meses) < 12
      ? `${meses} ${Number(meses) === 1 ? 'mês' : 'meses'}`
      : `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {labelSuffix}
        </label>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          <span className="font-medium">{texto}</span>
        </div>
        {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
        {calculadaPorDataNascimento && (
          <p className="text-xs text-gray-500 mt-1">Calculada automaticamente a partir da data de nascimento.</p>
        )}
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center gap-2">
        {!somenteAnos ? (
          <select
            value={unidade}
            onChange={handleUnidadeChange}
            disabled={disabled || field.disabled}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="anos">Anos</option>
            <option value="meses">Meses</option>
          </select>
        ) : (
          <span className="px-3 py-2 text-sm text-gray-600 shrink-0">Anos</span>
        )}
        <input
          type={idadeAnosRestrita ? 'text' : 'number'}
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleIdadeBlur}
          placeholder={unidadeEfetiva === 'anos' ? 'Anos' : 'Meses'}
          min={!idadeAnosRestrita && unidadeEfetiva === 'anos' ? 0 : undefined}
          max={
            !idadeAnosRestrita && unidadeEfetiva === 'anos'
              ? idadeMaxAnos
              : !idadeAnosRestrita
                ? idadeMaxMesesCampo
                : undefined
          }
          maxLength={idadeAnosRestrita ? 2 : undefined}
          step={idadeAnosRestrita ? undefined : 1}
          disabled={disabled || field.disabled}
          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${
            idadeAnosRestrita ? '' : '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          }`}
        />
      </div>
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {(error || erroMinIdade || erroMaxIdade || erroMaxMeses) && (
        <p className="text-red-500 text-sm mt-1">
          {erroMinIdade &&
            `A idade não pode ser inferior a ${idadeMinAnos} ${idadeMinAnos === 1 ? 'ano' : 'anos'}.`}
          {erroMaxIdade &&
            `A idade não pode ser superior a ${idadeMaxAnos} ${idadeMaxAnos === 1 ? 'ano' : 'anos'}.`}
          {erroMaxMeses &&
            `Quando a unidade é meses, o valor não pode ser superior a ${idadeMaxMesesCampo}.`}
          {!erroMinIdade && !erroMaxIdade && !erroMaxMeses && error}
        </p>
      )}
    </div>
  );
};

// ========== PASSAPORTE: 2 letras + 6 dígitos (ex.: AB123456) ==========
export const PassaporteField: React.FC<AdvancedFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
  onBlur,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizePassaporte(e.target.value);
    onChange(normalized);
  };

  const raw = (value || '').trim().replace(/\s/g, '').toUpperCase();
  const isValidPassaporte = raw.length === 8 && validatePassaporte(value || '');

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
        onBlur={onBlur}
        placeholder={field.placeholder || 'AB123456'}
        disabled={disabled || field.disabled}
        maxLength={8}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 uppercase ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : isValidPassaporte
              ? 'border-green-500 focus:ring-green-500'
              : 'border-gray-300 focus:ring-blue-500'
        } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {isValidPassaporte && !error && <p className="text-green-600 text-sm mt-1">Passaporte válido</p>}
    </div>
  );
};

// ========== CEP FIELD (formatação + busca automática ViaCEP) ==========
export type CepFoundDetail = {
  cep: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
};

export const CEPField: React.FC<AdvancedFieldProps & { onCepFound?: (detail: CepFoundDetail) => void }> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
  onCepFound,
}) => {
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastResolvedCepRef = useRef<string>('');
  const lastRequestedCepRef = useRef<string>('');

  const formatCEP = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    onChange(formatted);

    const cleanedCEP = formatted.replace(/\D/g, '');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (cleanedCEP.length === 8) {
      // Evita rajada de requisições ao editar/reeditar CEP.
      debounceRef.current = setTimeout(() => {
        void fetchAddress(cleanedCEP);
      }, 280);
    }
  };

  const fetchAddress = async (cep: string) => {
    if (cep.length !== 8) return;
    if (lastResolvedCepRef.current === cep) return;
    if (lastRequestedCepRef.current === cep && loading) return;
    try {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastRequestedCepRef.current = cep;
      setLoading(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal });
      const data = await response.json();
      
      if (!data.erro) {
        const detail: CepFoundDetail = {
          cep,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          localidade: data.localidade || '',
          uf: data.uf || '',
          ibge: data.ibge || '',
        };
        if (onCepFound) onCepFound(detail);
        window.dispatchEvent(new CustomEvent('cep-found', { detail }));
        lastResolvedCepRef.current = cep;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

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
  wrapperClassName,
  reserveCharCountSpace,
  compact,
}) => {
  const label = (
    <>
      {field.label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </>
  );
  return (
    <div className={wrapperClassName ?? 'mb-4'}>
      <PhoneInput
        value={value || ''}
        onChange={onChange}
        name={field.key}
        label={label}
        placeholder={field.placeholder || 'Digite o telefone'}
        className={error ? 'border-red-500' : ''}
        compact={compact}
        disabled={disabled || field.disabled}
      />
      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      {error ? (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      ) : reserveCharCountSpace ? (
        <div className="min-h-5 mt-1" aria-hidden="true" />
      ) : null}
    </div>
  );
};
