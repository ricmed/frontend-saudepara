import { useState, useEffect, useCallback, useRef } from 'react';
import type { FormSchema, FormField } from '@/services/FormService';
import { get, set } from 'lodash';
import {
  DF_CHOICE_WITH_TEXT_DEFAULT_VALUE,
  radioChoiceOtherTextKey,
} from '@/features/dynamic-forms/utils/radioChoiceOther';
import { evaluateRules, createDefaultFieldStates } from '@/utils/rulesEngine';
import { validateCPF } from '@/utils/cpfValidator';
import { validateCNS } from '@/utils/cnsValidator';
import { validatePassaporte } from '@/utils/passaporteValidator';

/** Agrupa campos da seção detalhamento do monitor operacional por tipo de atividade. */
function monitorOperImpactoGroup(key: string): 'epi' | 'san' | 'amb' | null {
  if (key.startsWith('imp_epi.')) return 'epi';
  if (key.startsWith('imp_san.')) return 'san';
  if (key.startsWith('imp_amb.')) return 'amb';
  return null;
}

function monitorOperDetalhamentoGroup(
  key: string,
): 'cap' | 'av' | 'comp' | 'aq' | 'dist' | 'fisc' | 'reg' | null {
  if (!key.startsWith('detalhamento.')) return null;
  if (key.startsWith('detalhamento.capacitacao')) return 'cap';
  if (key.startsWith('detalhamento.avaliacao')) return 'av';
  if (key.startsWith('detalhamento.complementar')) return 'comp';
  if (key.startsWith('detalhamento.aquisicao')) return 'aq';
  if (key.startsWith('detalhamento.distribuicao')) return 'dist';
  if (key.startsWith('detalhamento.fiscalizacao')) return 'fisc';
  if (key.startsWith('detalhamento.regulacao')) return 'reg';
  return null;
}

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

    // Monitoramento operacional: sincronizar competência (YYYY-MM) -> ano e mês (ocultos)
    if (schema?.agravo?.includes('Monitoramento operacional')) {
      const comp = get(updatedData, 'cabecalho.competencia_mes_ano');
      if (typeof comp === 'string' && /^\d{4}-\d{2}$/.test(comp)) {
        const [yStr, mStr] = comp.split('-');
        const y = Number(yStr);
        const m = Number(mStr); // 1..12
        const map = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const mesCode = map[m - 1];
        if (Number.isFinite(y) && mesCode) {
          if (get(updatedData, 'cabecalho.ano') !== y) {
            set(updatedData, 'cabecalho.ano', y);
            dataChanged = true;
          }
          if (get(updatedData, 'cabecalho.mes') !== mesCode) {
            set(updatedData, 'cabecalho.mes', mesCode);
            dataChanged = true;
          }
        }
      } else {
        // Default: se competência vier vazia, preencher com mês/ano atual
        if (!comp) {
          const now = new Date();
          const y = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          set(updatedData, 'cabecalho.competencia_mes_ano', `${y}-${mm}`);
          dataChanged = true;
        }
      }
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

  // Monitor operacional: total da seção Custo = soma automática dos elementos de despesa
  useEffect(() => {
    if (!schema?.agravo?.includes('Monitoramento operacional')) return;
    const keys = [
      'custo.el_339014',
      'custo.el_339030',
      'custo.el_339033',
      'custo.el_339036',
      'custo.el_339039',
    ];
    let sum = 0;
    for (const k of keys) {
      const v = get(formData, k);
      if (v === '' || v === null || v === undefined) continue;
      const n = Number(v);
      if (Number.isFinite(n)) sum += n;
    }
    const rounded = Math.round(sum * 100) / 100;
    const current = get(formData, 'custo.total');
    const curNum = current === '' || current === null || current === undefined ? NaN : Number(current);
    const curRounded = Number.isFinite(curNum) ? Math.round(curNum * 100) / 100 : null;
    if (curRounded === null || curRounded !== rounded) {
      setValue('custo.total', rounded);
    }
  }, [formData, schema?.agravo, setValue]);

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
      // Gestante: só visível quando Sexo ao nascimento = Feminino ('F')
      if (key === 'paciente.gestante') {
        return getValue('paciente.sexo') === 'F';
      }
      // Monitoramento operacional: detalhamento condicionado à atividade e à área
      if (schema?.agravo?.includes('Monitoramento operacional') && key.startsWith('detalhamento.')) {
        const atividade = getValue('acao.atividade');
        const area = getValue('acao.area');
        const g = monitorOperDetalhamentoGroup(key);
        if (g) {
          if (!atividade) return false;
          if (g === 'cap' && atividade !== 'capacitacao') return false;
          if (g === 'av' && atividade !== 'avaliacao') return false;
          if (g === 'comp' && atividade !== 'acao_complementar') return false;
          if (g === 'aq' && atividade !== 'aquisicao') return false;
          if (g === 'dist' && atividade !== 'distribuicao') return false;
          if (g === 'fisc') {
            const areaOk = area === 'vigilancia_sanitaria' || area === 'vigilancia_ambiental_trabalhador';
            if (!areaOk || atividade !== 'fiscalizacao_inspecao') return false;
          }
          if (g === 'reg') {
            if (area !== 'vigilancia_sanitaria' || atividade !== 'regulacao') return false;
          }
        }
        if (key === 'detalhamento.complementar_detalhe') {
          const v = getValue('detalhamento.complementar_descricao');
          if (!(v === 'acoes_prevencao_saude' || v === 'acoes_diagnostico')) return false;
        }
      }
      // Monitor operacional: impacto conforme área da vigilância
      if (schema?.agravo?.includes('Monitoramento operacional') && monitorOperImpactoGroup(key)) {
        const area = getValue('acao.area');
        if (!area) return false;
        const ig = monitorOperImpactoGroup(key);
        if (ig === 'epi') {
          if (area === 'vigilancia_sanitaria' || area === 'vigilancia_ambiental_trabalhador') return false;
        } else if (ig === 'san') {
          if (area !== 'vigilancia_sanitaria') return false;
        } else if (ig === 'amb') {
          if (area !== 'vigilancia_ambiental_trabalhador') return false;
        }
      }
      return fieldVisibility[key] !== false;
    },
    [fieldVisibility, getValue, schema]
  );

  const isFieldRequired = useCallback(
    (key: string) => {
      const estrangeiro = getValue('paciente.e_estrangeiro');
      const orientacaoSexual = getValue('paciente.orientacao_sexual');
      const povoTradicional = getValue('paciente.povo_tradicional');
      const sexo = getValue('paciente.sexo');
      const racaCor = String(getValue('paciente.raca_cor') ?? '');
      const situacaoRua = String(getValue('paciente.situacao_rua') ?? '');
      const privadoLiberdade = String(getValue('paciente.privado_liberdade') ?? '');

      // Data da notificação: sempre obrigatória
      if (key === 'notificacao.dt_notificacao') return true;
      // Nome completo: sempre obrigatório
      if (key === 'paciente.nome') return true;
      // Nome da mãe: sempre obrigatório
      if (key === 'paciente.nome_mae') return true;
      // CPF obrigatório só quando É Estrangeiro = NÃO (2)
      if (key === 'paciente.cpf') return estrangeiro === '2';
      // CNS obrigatório quando CPF não preenchido e não é estrangeiro
      if (key === 'paciente.cns') {
        const cpfDigits = String(getValue('paciente.cpf') ?? '').replace(/\D/g, '');
        return estrangeiro !== '1' && cpfDigits.length < 11;
      }
      // País de nascimento: obrigatório quando É Estrangeiro = SIM (1)
      if (key === 'paciente.pais_nascimento_id') return estrangeiro === '1';
      // Sexo ao nascimento: sempre obrigatório
      if (key === 'paciente.sexo') return true;
      // Orientação sexual: sempre obrigatório
      if (key === 'paciente.orientacao_sexual') return true;
      // Outra orientação sexual: obrigatório quando Orientação = 4 (OUTRA)
      if (key === 'paciente.outra_orientacao_sexual') return orientacaoSexual === '4';
      // Raça/Cor: sempre obrigatório
      if (key === 'paciente.raca_cor') return true;
      // É membro de povo/comunidade tradicional: sempre obrigatório
      if (key === 'paciente.povo_tradicional') return true;
      // Qual povo: obrigatório quando É membro = SIM (1)
      if (key === 'paciente.qual_povo_tradicional') return povoTradicional === '1';
      // Especifique (outro povo): obrigatório quando Qual povo = 39 (OUTROS)
      if (key === 'paciente.outro_povo_tradicional') return getValue('paciente.qual_povo_tradicional') === '39';
      // Qual etnia: obrigatório quando Raça/Cor = 5 (INDÍGENA)
      if (key === 'paciente.etnia') return racaCor === '5';
      // Vive aldeado: obrigatório quando Raça/Cor = 5 (INDÍGENA)
      if (key === 'paciente.vive_aldeado') return racaCor === '5';
      // DSEI, Polo Base, Aldeia: obrigatórios quando Vive aldeado = Sim (1)
      if (key === 'paciente.distrito_sanitario' || key === 'paciente.polo_base' || key === 'paciente.aldeia')
        return getValue('paciente.vive_aldeado') === '1';
      // Gestante: obrigatório quando Sexo = Feminino ('F')
      if (key === 'paciente.gestante') return sexo === 'F';
      // Escolaridade: sempre obrigatório
      if (key === 'paciente.escolaridade') return true;
      // Ocupação CBO: sempre obrigatório
      if (key === 'paciente.ocupacao_cbo') return true;
      // Atividade econômica CNAE: sempre obrigatório
      if (key === 'paciente.atividade_cnae') return true;
      // Situação de rua: sempre obrigatório
      if (key === 'paciente.situacao_rua') return true;
      // Profissional de saúde: sempre obrigatório
      if (key === 'paciente.profissional_saude') return true;
      // Privado de liberdade: sempre obrigatório
      if (key === 'paciente.privado_liberdade') return true;
      // Pessoa com deficiência: sempre obrigatório
      if (key === 'paciente.com_deficiencia') return true;
      // Endereço: obrigatório exceto quando situação de rua = Sim (1) ou privado de liberdade = Sim (1)
      if (
        key === 'residencia.cep' ||
        key === 'residencia.uf' ||
        key === 'residencia.municipio_ibge' ||
        key === 'residencia.bairro' ||
        key === 'residencia.logradouro' ||
        key === 'residencia.numero'
      ) {
        return situacaoRua !== '1' && privadoLiberdade !== '1';
      }
      // Telefone de residência: sempre obrigatório
      if (key === 'residencia.telefone') return true;

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

      if (field.type === 'radio' && field.choiceWithText) {
        const rawSent = String(field.choiceWithTextValue ?? DF_CHOICE_WITH_TEXT_DEFAULT_VALUE).trim();
        const sentinel = rawSent || DF_CHOICE_WITH_TEXT_DEFAULT_VALUE;
        if (String(value ?? '') === sentinel) {
          const otherKey = radioChoiceOtherTextKey(field.key);
          const otherTxt = getValue(otherKey);
          if (isRequired && (!otherTxt || !String(otherTxt).trim())) {
            const hint = (field.choiceWithTextLabel ?? 'Outro').trim() || 'Outro';
            setError(field.key, `Preencha o texto da opção "${hint}"`);
            return false;
          }
        }
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
