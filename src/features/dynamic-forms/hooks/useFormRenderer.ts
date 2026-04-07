import { useState, useEffect, useCallback, useRef } from 'react';
import type { FormSchema, FormField } from '@/services/FormService';
import { get, set } from 'lodash';
import { evaluateRules, createDefaultFieldStates } from '@/utils/rulesEngine';
import { validateCPF } from '@/utils/cpfValidator';
import { validateCNS } from '@/utils/cnsValidator';
import { validatePassaporte } from '@/utils/passaporteValidator';

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
  const didInitRef = useRef(false);

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

  // Sempre notificar mudanças de dados (útil para preview/sandbox e debug)
  useEffect(() => {
    if (!onDataChange) return;
    if (!didInitRef.current) {
      didInitRef.current = true;
      onDataChange(formData);
      return;
    }
    onDataChange(formData);
  }, [formData, onDataChange]);

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

    // Default para mês (monitoramento operacional mensal): se vier vazio, preencher mês atual.
    // (No técnico PQAVS, quadrimestre continua sendo pré-preenchido no DynamicFormPage.)
    const mes = get(updatedData, 'cabecalho.mes');
    if (!mes && schema?.agravo?.includes('Monitoramento operacional')) {
      const mesAtual = (() => {
        const m = new Date().getMonth(); // 0..11
        const map = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        return map[m] || 'JAN';
      })();
      set(updatedData, 'cabecalho.mes', mesAtual);
      dataChanged = true;
    }

    setFieldVisibility(newVisibility);
    setFieldRequired(newRequired);
    setFieldDisabled(newDisabled);

    if (dataChanged) {
      setFormData(updatedData);
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
      const estrangeiro = getValue('paciente.e_estrangeiro');
      const estrangeiroSim = estrangeiro === '1';
      const orientacaoSexual = getValue('paciente.orientacao_sexual');
      const orientacaoOutra = orientacaoSexual === '4';
      const povoTradicionalSim = getValue('paciente.povo_tradicional') === '1';
      const qualPovoOutros = getValue('paciente.qual_povo_tradicional') === '39';
      // CPF: sempre visível (obrigatório só quando É Estrangeiro = NÃO)
      if (key === 'paciente.cpf') {
        return true;
      }
      // CNS: sempre visível
      if (key === 'paciente.cns') {
        return true;
      }
      // Passaporte: só quando É Estrangeiro = SIM (1)
      if (key === 'paciente.passaporte') {
        return estrangeiroSim;
      }
      // País de nascimento: só quando É Estrangeiro = SIM (1); oculto quando NÃO
      if (key === 'paciente.pais_nascimento_id') {
        return estrangeiroSim;
      }
      // Outra orientação sexual, especifique: só quando Orientação sexual = 4 (OUTRA)
      if (key === 'paciente.outra_orientacao_sexual') {
        return orientacaoOutra;
      }
      // Qual povo ou comunidade tradicional: só quando É membro = SIM (1)
      if (key === 'paciente.qual_povo_tradicional') {
        return povoTradicionalSim;
      }
      // Especifique (outro povo): só quando Qual povo = 39 (OUTROS)
      if (key === 'paciente.outro_povo_tradicional') {
        return qualPovoOutros;
      }
      // Qual etnia?: só quando Raça/Cor = 5 (INDÍGENA); aceita valor string ou número
      if (key === 'paciente.etnia') {
        return String(getValue('paciente.raca_cor') ?? '') === '5';
      }
      // Vive aldeado?: só quando Raça/Cor = 5 (INDÍGENA)
      if (key === 'paciente.vive_aldeado') {
        return String(getValue('paciente.raca_cor') ?? '') === '5';
      }
      // DSEI, Polo Base, Aldeia: só quando Vive aldeado? = Sim (1)
      if (key === 'paciente.distrito_sanitario' || key === 'paciente.polo_base' || key === 'paciente.aldeia') {
        return getValue('paciente.vive_aldeado') === '1';
      }
      return fieldVisibility[key] !== false;
    },
    [fieldVisibility, getValue]
  );

  const isFieldRequired = useCallback(
    (key: string) => {
      const estrangeiro = getValue('paciente.e_estrangeiro');
      const orientacaoSexual = getValue('paciente.orientacao_sexual');
      const povoTradicional = getValue('paciente.povo_tradicional');
      // CPF obrigatório só quando É Estrangeiro = NÃO; quando Sim continua visível mas não obrigatório
      if (key === 'paciente.cpf') {
        return estrangeiro === '2';
      }
      // Passaporte obrigatório quando visível (É Estrangeiro = SIM)
      if (key === 'paciente.passaporte') {
        return estrangeiro === '1';
      }
      // Outra orientação sexual obrigatório quando visível (Orientação sexual = 4 OUTRA)
      if (key === 'paciente.outra_orientacao_sexual') {
        return orientacaoSexual === '4';
      }
      // Qual povo ou comunidade tradicional obrigatório quando visível (É membro = SIM)
      if (key === 'paciente.qual_povo_tradicional') {
        return povoTradicional === '1';
      }
      // Especifique (outro povo) obrigatório quando visível (Qual povo = 39 OUTROS)
      if (key === 'paciente.outro_povo_tradicional') {
        return getValue('paciente.qual_povo_tradicional') === '39';
      }
      // Qual etnia? obrigatório quando visível (Raça/Cor = 5 INDÍGENA); aceita valor string ou número
      if (key === 'paciente.etnia') {
        return String(getValue('paciente.raca_cor') ?? '') === '5';
      }
      // DSEI, Polo Base, Aldeia obrigatórios quando visíveis (Vive aldeado? = Sim)
      if (key === 'paciente.distrito_sanitario' || key === 'paciente.polo_base' || key === 'paciente.aldeia') {
        return getValue('paciente.vive_aldeado') === '1';
      }
      return fieldRequired[key] === true;
    },
    [fieldRequired, getValue]
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

      // Validação de CPF por dígitos verificadores (impede CPF digitado ao acaso)
      if (field.type === 'cpf' && value) {
        const digits = String(value).replace(/\D/g, '');
        if (digits.length === 11 && !validateCPF(String(value))) {
          setError(field.key, 'CPF inválido. Verifique os números.');
          return false;
        }
      }

      // Validação de CNS por algoritmo oficial (impede CNS digitado ao acaso)
      if (field.type === 'cns' && value) {
        const digits = String(value).replace(/\D/g, '');
        if (digits.length === 15 && !validateCNS(String(value))) {
          setError(field.key, 'CNS inválido. Verifique os números.');
          return false;
        }
      }

      // Validação de passaporte (2 letras + 6 dígitos, ex.: AB123456)
      if (field.key === 'paciente.passaporte' && value) {
        const trimmed = String(value).trim();
        if (trimmed.length > 0 && !validatePassaporte(trimmed)) {
          setError(field.key, 'Use 2 letras e 6 dígitos (ex.: AB123456).');
          return false;
        }
      }

      // Idade em meses: máximo 120 anos (1440 meses)
      if (field.key === 'paciente.idade' && value != null && value !== '') {
        const meses = Number(value);
        if (!Number.isNaN(meses) && meses > 120 * 12) {
          setError(field.key, 'A idade não pode ser superior a 120 anos.');
          return false;
        }
      }

      // Data de nascimento: idade calculada não pode ser superior a 120 anos
      if (field.key === 'paciente.data_nascimento' && value) {
        try {
          const birth = new Date(value);
          const today = new Date();
          let anos = today.getFullYear() - birth.getFullYear();
          let meses = today.getMonth() - birth.getMonth();
          if (meses < 0 || (meses === 0 && today.getDate() < birth.getDate())) anos--;
          if (today.getDate() < birth.getDate()) meses--;
          const totalMeses = anos * 12 + meses;
          if (totalMeses > 120 * 12) {
            setError(field.key, 'A idade calculada não pode ser superior a 120 anos.');
            return false;
          }
        } catch {
          // ignore invalid date
        }
      }

      // Tabela: validação de coluna total (ex.: Frequência Relativa ~100%)
      const tableVal = field.tableValidations;
      if (field.type === 'table' && tableVal?.totalColumnKey && Array.isArray(value) && value.length > 0) {
        const { totalColumnKey, totalMin = 99, totalMax = 101, message } = tableVal;
        const badRow = value.findIndex((row: Record<string, any>) => {
          const v = Number(row?.[totalColumnKey]);
          if (Number.isNaN(v)) return true; // vazio ou inválido conta como erro
          return v < totalMin || v > totalMax;
        });
        if (badRow !== -1) {
          setError(
            field.key,
            message ?? `Na linha ${badRow + 1}: o total deve estar entre ${totalMin}% e ${totalMax}%.`
          );
          return false;
        }
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
    setError,
    clearError,
    validateField,
    validateAll,
    reset,
  };
};
