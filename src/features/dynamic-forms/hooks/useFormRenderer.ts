import { useState, useEffect, useCallback, useRef } from 'react';
import type { FormSchema, FormField } from '@/services/FormService';
import { get, set } from 'lodash';
import { evaluateRules, createDefaultFieldStates } from '@/utils/rulesEngine';

interface UseFormRendererProps {
  schema: FormSchema;
  initialData?: Record<string, any>;
  onDataChange?: (data: Record<string, any>) => void;
}

export const useFormRenderer = ({ schema, initialData = {}, onDataChange }: UseFormRendererProps) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [fieldVisibility, setFieldVisibility] = useState<Record<string, boolean>>({});
  const [fieldRequired, setFieldRequired] = useState<Record<string, boolean>>({});
  const [fieldDisabled, setFieldDisabled] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar estados padrão dos campos
  useEffect(() => {
    const defaultStates = createDefaultFieldStates(schema.sections);
    
    const visibility: Record<string, boolean> = {};
    const required: Record<string, boolean> = {};
    const disabled: Record<string, boolean> = {};

    Object.entries(defaultStates).forEach(([key, state]) => {
      visibility[key] = state.visible;
      required[key] = state.required;
      disabled[key] = state.disabled;
    });

    setFieldVisibility(visibility);
    setFieldRequired(required);
    setFieldDisabled(disabled);
  }, [schema]);

  // Avaliar regras quando dados mudarem
  useEffect(() => {
    if (!schema.rules || schema.rules.length === 0) return;

    const defaultStates = createDefaultFieldStates(schema.sections);
    const evaluatedStates = evaluateRules(schema.rules, formData, defaultStates);

    const newVisibility: Record<string, boolean> = {};
    const newRequired: Record<string, boolean> = {};
    const newDisabled: Record<string, boolean> = {};
    let dataChanged = false;
    const updatedData = { ...formData };

    Object.entries(evaluatedStates).forEach(([key, state]) => {
      newVisibility[key] = state.visible;
      newRequired[key] = state.required;
      newDisabled[key] = state.disabled;

      // Se a regra definiu um valor, aplicar
      if (state.value !== undefined && get(formData, key) !== state.value) {
        set(updatedData, key, state.value);
        dataChanged = true;
      }
    });

    setFieldVisibility(newVisibility);
    setFieldRequired(newRequired);
    setFieldDisabled(newDisabled);

    if (dataChanged) {
      setFormData(updatedData);
      onDataChange?.(updatedData);
    }
  }, [formData, schema]);

  const setValue = useCallback((key: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev };
      set(newData, key, value);
      return newData;
    });
  }, []);

  const getValue = useCallback(
    (key: string) => {
      return get(formData, key);
    },
    [formData]
  );

  const isFieldVisible = useCallback(
    (key: string) => {
      return fieldVisibility[key] !== false;
    },
    [fieldVisibility]
  );

  const isFieldRequired = useCallback(
    (key: string) => {
      return fieldRequired[key] === true;
    },
    [fieldRequired]
  );

  const isFieldDisabled = useCallback(
    (key: string) => {
      return fieldDisabled[key] === true;
    },
    [fieldDisabled]
  );

  const setError = useCallback((key: string, error: string) => {
    setErrors((prev) => ({ ...prev, [key]: error }));
  }, []);

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  const getError = useCallback(
    (key: string) => {
      return errors[key];
    },
    [errors]
  );

  const validateField = useCallback(
    (field: FormField) => {
      const value = getValue(field.key);
      const isRequired = isFieldRequired(field.key);
      const isVisible = isFieldVisible(field.key);

      if (!isVisible) {
        clearError(field.key);
        return true;
      }

      if (isRequired && (!value || value === '')) {
        setError(field.key, `${field.label} é obrigatório`);
        return false;
      }

      if (field.minLength && String(value).length < field.minLength) {
        setError(field.key, `${field.label} deve ter no mínimo ${field.minLength} caracteres`);
        return false;
      }

      if (field.maxLength && String(value).length > field.maxLength) {
        setError(field.key, `${field.label} deve ter no máximo ${field.maxLength} caracteres`);
        return false;
      }

      if (field.pattern && !new RegExp(field.pattern).test(String(value))) {
        setError(field.key, `${field.label} está em formato inválido`);
        return false;
      }

      clearError(field.key);
      return true;
    },
    [getValue, isFieldRequired, isFieldVisible, setError, clearError]
  );

  const validateAll = useCallback(() => {
    let isValid = true;

    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (!validateField(field)) {
          isValid = false;
        }
      });
    });

    return isValid;
  }, [schema, validateField]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  return {
    formData,
    setValue,
    getValue,
    isFieldVisible,
    isFieldRequired,
    isFieldDisabled,
    errors,
    getError,
    validateField,
    validateAll,
    reset,
  };
};
