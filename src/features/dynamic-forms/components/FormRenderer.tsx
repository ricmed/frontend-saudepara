import React, { useState, useCallback, useEffect } from 'react';
import type { FormSchema } from '@/services/FormService';
import { useFormRenderer } from '../hooks/useFormRenderer';
import { TextField, DateField, NumberField, TextareaField, CheckboxField } from './FormFields';
import { SelectField, SelectSearchField, CodeListSelectField, CodeListSearchField, ApiSelectField, ApiSelectSearchField, CboSearchField, CnaeSearchField, DseiPoloAldeiaFields } from './SelectFields';
import { 
  CheckboxGroupField, 
  RadioGroupField, 
  MultiSelectField, 
  TimeField, 
  DateTimeField, 
  EmailField, 
  PhoneField, 
  CPFField, 
  CEPField,
  CNSField,
  PassaporteField,
  IdadeField,
  InternationalPhoneField
} from './AdvancedFields';
import type { CepFoundDetail } from './AdvancedFields';
import {
  FileUploadField,
  SignatureField,
  GeoLocationField,
  AutocompleteField,
  ColorPickerField,
  SliderField,
  StarRatingField,
  GoogleMapsAddressField,
  AddressField
} from './SpecialFields';
import { EstadoMunicipioNotificacao } from './EstadoMunicipioNotificacao';
import { EstabelecimentoNotificacao } from './EstabelecimentoNotificacao';
import { EstadoMunicipioResidencia } from './EstadoMunicipioResidencia';
import { TableField } from './TableField';
import { convertLocalDateTimeToUTC } from '@/utils/timezoneUtils';

const NOTIFICATION_LOCATION_KEYS = new Set([
  'notificacao.uf_notificacao',
  'notificacao.municipio_notificacao_ibge',
  'notificacao.municipio_id',
]);

const NOTIFICATION_ESTABELECIMENTO_KEYS = new Set([
  'notificacao.estabelecimento_cnes',
  'notificacao.estabelecimento',
  'notificacao.unidade_id',
]);

const RESIDENCIA_BLOCK_KEYS = new Set([
  'residencia.cep',
  'residencia.uf',
  'residencia.municipio_ibge',
  'residencia.bairro',
  'residencia.logradouro',
  'residencia.zona',
  'residencia.numero',
  'residencia.complemento',
  'residencia.telefone',
]);

/** Campos do bloco Identificação renderizados em layout customizado; Sexo ao nascimento fica ao lado de Idade; os demais (orientação sexual, etc.) renderizam no grid após o bloco */
const IDENTIFICACAO_BLOCK_KEYS = new Set([
  'notificacao.dt_notificacao',
  'paciente.cpf',
  'paciente.cns',
  'paciente.e_estrangeiro',
  'paciente.nome',
  'paciente.nome_social',
  'paciente.nome_mae',
  'paciente.data_nascimento',
  'paciente.idade',
  'paciente.sexo',
  'paciente.passaporte',
  'paciente.pais_nascimento_id',
]);

interface FormRendererProps {
  schema: FormSchema;
  initialData?: Record<string, any>;
  onDataChange?: (data: Record<string, any>) => void;
  onSubmit?: (data: Record<string, any>) => void;
  onSaveDraft?: (data: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  saveDraftLabel?: string;
  cancelLabel?: string;
  readOnly?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  initialData = {},
  onDataChange,
  onSubmit,
  onSaveDraft,
  onCancel,
  submitLabel = 'Enviar',
  saveDraftLabel = 'Salvar Rascunho',
  cancelLabel = 'Cancelar',
  readOnly = false,
}) => {
  const initialDataWithDefaults = React.useMemo(() => {
    const pac = initialData?.paciente ?? {};
    const dataNasc = pac.data_nascimento;
    const idadeAtual = pac.idade;
    const hasIdade = idadeAtual !== undefined && idadeAtual !== null && idadeAtual !== '';
    let idadeMeses: number | undefined;
    if (dataNasc && !hasIdade) {
      try {
        const birth = new Date(dataNasc);
        const today = new Date();
        let anos = today.getFullYear() - birth.getFullYear();
        let meses = today.getMonth() - birth.getMonth();
        if (meses < 0 || (meses === 0 && today.getDate() < birth.getDate())) {
          anos--;
          meses += 12;
        }
        if (today.getDate() < birth.getDate()) meses--;
        idadeMeses = anos * 12 + meses;
        if (idadeMeses < 0) idadeMeses = undefined;
      } catch {
        idadeMeses = undefined;
      }
    } else if (hasIdade) {
      const n = Number(idadeAtual);
      if (!Number.isNaN(n)) {
        if (n > 150) idadeMeses = n;
        else idadeMeses = n * 12;
      }
    }
    const estrangeiroVal = pac.e_estrangeiro;
    const eEstrangeiroDefault = (estrangeiroVal === undefined || estrangeiroVal === null || estrangeiroVal === '') ? '2' : estrangeiroVal;
    // País de nascimento não vem mais pré-selecionado como Brasil; só preenche se já vier nos dados
    return {
      ...initialData,
      paciente: {
        ...pac,
        e_estrangeiro: eEstrangeiroDefault,
        ...(idadeMeses !== undefined ? { idade: idadeMeses } : {}),
      },
    };
  }, [initialData]);

  const {
    setValue,
    getValue,
    isFieldVisible,
    isFieldRequired,
    isFieldDisabled,
    getError,
    setError,
    clearError,
    validateAll,
    validateField,
    formData,
  } = useFormRenderer({
    schema,
    initialData: initialDataWithDefaults,
    onDataChange,
  });

  const [uploadingCount, setUploadingCount] = useState(0);
  const handleUploadingChange = useCallback((uploading: boolean) => {
    setUploadingCount(c => Math.max(0, c + (uploading ? 1 : -1)));
  }, []);
  const isUploading = uploadingCount > 0;

  // Quando "Configurar Colunas Fixas" está ativo, exibir apenas os campos marcados como coluna fixa
  const sectionsToRender = React.useMemo(() => {
    const useFixedOnly = !!schema.fixedColumnsConfig?.enabled;
    if (!useFixedOnly) return schema.sections;
    return schema.sections
      .map((section) => ({
        ...section,
        fields: section.fields.filter((f) => f.isFixedColumn === true),
      }))
      .filter((section) => section.fields.length > 0)
      .sort((a, b) => a.order - b.order);
  }, [schema]);

  // Retorno da assinatura Gov.br: preencher campo ou exibir erro e limpar hash/query
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash?.slice(1) || window.location.search?.slice(1) || ''
    );
    const signature = params.get('signature');
    const cert = params.get('cert');
    const fieldKey = params.get('fieldKey');
    const govbrError = params.get('govbr_error');
    if (govbrError) {
      try {
        const message = decodeURIComponent(govbrError);
        alert(`Assinatura Gov.br: ${message}`);
      } catch {
        alert('Erro ao processar assinatura Gov.br.');
      }
      const newUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', newUrl);
      return;
    }
    if (signature && fieldKey) {
      setValue(fieldKey, {
        type: 'govbr',
        signatureBase64: signature,
        certificatePem: cert || undefined,
        signedAt: new Date().toISOString(),
      });
      const newUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', newUrl);
    }
  }, [setValue]);

  // Função para converter campos datetime-local para UTC antes de enviar
  const convertDateTimeFieldsToUTC = (data: Record<string, any>, schema: FormSchema): Record<string, any> => {
    const result = { ...data };
    
    // Percorrer todas as seções e campos para encontrar datetime fields
    schema.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.type === 'datetime' && result[field.key]) {
          const value = result[field.key];
          // Se for datetime-local (sem timezone), converter para UTC
          if (typeof value === 'string' && 
              !value.includes('Z') && 
              !value.includes('+') &&
              value.length <= 16) {
            result[field.key] = convertLocalDateTimeToUTC(value);
          }
        }
      });
    });
    
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly || isUploading) return;

    if (validateAll()) {
      // Converter datetime fields antes de enviar
      const dataToSubmit = convertDateTimeFieldsToUTC(formData, schema);
      onSubmit?.(dataToSubmit);
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly || isUploading) return;

    // Converter datetime fields antes de salvar rascunho também
    const dataToSave = convertDateTimeFieldsToUTC(formData, schema);
    onSaveDraft?.(dataToSave);
  };

  // Tipos que devem ocupar a linha inteira (não ficar na metade do grid)
  const fullWidthTypes = new Set([
    'textarea',
    'file',
    'signature',
    'geolocation',
    'checkbox-group',
    'radio',
    'multi-select',
    'address',
    'google-address',
    'slider',
    'rating',
    'color',
    'autocomplete',
    'table',
  ]);
  const isFullWidth = (type: string) => fullWidthTypes.has(type);

  const normalizeMaiusculo = (v: any) => {
    if (v == null || v === '') return v;
    return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  };
  const normalizeNumeroSN = (v: any) => {
    if (v == null || v === '') return v;
    const s = String(v).toUpperCase();
    if (/[0-9]/.test(s)) return s.replace(/\D/g, ''); // só números: qualquer outro caractere removido
    let result = '';
    for (const c of s) {
      if (c === 'S' && result === '') result = 'S';
      else if (c === 'N' && result === 'S') result = 'SN';
    }
    return result;
  };

  const residenciaPlaceholders: Record<string, string> = {
    'residencia.bairro': 'Ex.: NAZARÉ, JURUNAS',
    'residencia.logradouro': 'Ex.: AV. CONSELHEIRO FURTADO, RUA 15 DE NOVEMBRO',
    'residencia.numero': 'Ex.: 100, SN (sem número)',
    'residencia.complemento': 'Ex.: APTO 101, CASA 2, FUNDOS',
  };

  // Mapeamento por key: garante tipo/opções corretos mesmo quando o schema vem com type "text" do banco
  const getResolvedField = (field: any) => {
    const keyMap: Record<string, { type: string; options?: Array<{ value: string; label: string }>; apiSelectEndpoint?: string; maxLength?: number }> = {
      'paciente.nome': { type: 'text', maxLength: 100 },
      'paciente.cpf': { type: 'cpf' },
      'paciente.cns': { type: 'cns' },
      'paciente.nome_social': { type: 'text', maxLength: 100 },
      'paciente.e_estrangeiro': { type: 'select', options: [{ value: '1', label: 'SIM' }, { value: '2', label: 'NÃO' }] },
      'paciente.povo_tradicional': { type: 'select', options: [{ value: '1', label: 'SIM' }, { value: '2', label: 'NAO' }, { value: '9', label: 'IGNORADO' }] },
      'paciente.passaporte': { type: 'passaporte' },
      'paciente.pais_nascimento_id': { type: 'select', apiSelectEndpoint: 'tipo-pais/select' },
      'paciente.data_nascimento': { type: 'date' },
      'paciente.idade': { type: 'idade' },
      'paciente.nome_mae': { type: 'text', maxLength: 100 },
    };
    const over = keyMap[field.key];
    const base = over
      ? { ...field, type: over.type, options: over.options ?? field.options, apiSelectEndpoint: over.apiSelectEndpoint ?? field.apiSelectEndpoint, maxLength: over.maxLength ?? field.maxLength }
      : field;
    const placeholder = residenciaPlaceholders[base.key];
    if (placeholder != null) return { ...base, placeholder: base.placeholder ?? placeholder };
    return base;
  };

  const renderField = (field: any) => {
    const resolved = getResolvedField(field);
    // Não exibir paciente.pais_nascimento (texto); só o select paciente.pais_nascimento_id é usado
    if (resolved.key === 'paciente.pais_nascimento') {
      return null;
    }
    const value = getValue(resolved.key);
    const error = getError(resolved.key);
    const required = isFieldRequired(resolved.key);
    const visible = isFieldVisible(resolved.key);
    const disabled = isFieldDisabled(resolved.key) || readOnly;

    if (!visible) {
      return null;
    }

    const commonProps = {
      field: resolved,
      value,
      onChange: (val: any) => setValue(resolved.key, val),
      error,
      required,
      disabled,
    };

    const isNomeOuNomeSocialOuNomeMae =
      resolved.key === 'paciente.nome' || resolved.key === 'paciente.nome_social' || resolved.key === 'paciente.nome_mae';
    const isResidenciaMaiusculo =
      resolved.key === 'residencia.bairro' || resolved.key === 'residencia.logradouro' || resolved.key === 'residencia.complemento';
    const isResidenciaNumero = resolved.key === 'residencia.numero';
    let textProps = commonProps;
    if (isNomeOuNomeSocialOuNomeMae || isResidenciaMaiusculo) {
      textProps = { ...commonProps, onChange: (val: any) => setValue(resolved.key, normalizeMaiusculo(val)) };
    } else if (isResidenciaNumero) {
      textProps = { ...commonProps, onChange: (val: any) => setValue(resolved.key, normalizeNumeroSN(val)) };
    }

    const isDataNascimento = resolved.key === 'paciente.data_nascimento';
    const MAX_IDADE_MESES = 120 * 12;
    const dateProps = isDataNascimento
      ? {
          ...commonProps,
          onChange: (val: any) => {
            setValue(resolved.key, val);
            if (val) {
              const birth = new Date(val);
              const today = new Date();
              let anos = today.getFullYear() - birth.getFullYear();
              let meses = today.getMonth() - birth.getMonth();
              if (meses < 0 || (meses === 0 && today.getDate() < birth.getDate())) {
                anos--;
                meses += 12;
              }
              if (today.getDate() < birth.getDate()) meses--;
              const totalMeses = anos * 12 + meses;
              if (totalMeses < 0) {
                clearError('paciente.data_nascimento');
                setValue('paciente.idade', undefined);
              } else if (totalMeses > MAX_IDADE_MESES) {
                setError('paciente.data_nascimento', 'A idade calculada não pode ser superior a 120 anos.');
                setValue('paciente.idade', undefined);
              } else {
                clearError('paciente.data_nascimento');
                setValue('paciente.idade', totalMeses);
              }
            } else {
              clearError('paciente.data_nascimento');
              setValue('paciente.idade', undefined);
            }
          },
        }
      : commonProps;

    const hasDataNascimento = !!getValue('paciente.data_nascimento');

    switch (resolved.type) {
      case 'text':
        // DSEI, Polo Base, Aldeia: selects em cascata (só visíveis quando Vive aldeado? = Sim)
        if (resolved.key === 'paciente.distrito_sanitario') {
          return (
            <DseiPoloAldeiaFields
              getValue={getValue}
              setValue={setValue}
              getError={getError}
              isFieldRequired={isFieldRequired}
              disabled={disabled}
            />
          );
        }
        if (resolved.key === 'paciente.polo_base' || resolved.key === 'paciente.aldeia') {
          return null;
        }
        return <TextField {...textProps} />;
      case 'date':
        return <DateField {...dateProps} />;
      case 'month':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {resolved.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="month"
              value={value ?? ''}
              onChange={(e) => setValue(resolved.key, e.target.value || undefined)}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
      case 'datetime':
        return <DateTimeField {...commonProps} />;
      case 'time':
        return <TimeField {...commonProps} />;
      case 'number':
        return <NumberField {...commonProps} />;
      case 'idade':
        return (
          <IdadeField
            {...commonProps}
            onBlur={() => validateField(resolved)}
            calculadaPorDataNascimento={hasDataNascimento}
            disabled={disabled || hasDataNascimento}
          />
        );
      case 'textarea':
        return <TextareaField {...commonProps} />;
      case 'checkbox':
        return <CheckboxField {...commonProps} />;
      case 'checkbox-group':
        return <CheckboxGroupField {...commonProps} />;
      case 'select':
        // Vive aldeado?: ao mudar para Não/Ignorado, limpar DSEI, Polo Base e Aldeia
        if (resolved.key === 'paciente.vive_aldeado') {
          const viveAldeadoOnChange = (val: any) => {
            setValue(resolved.key, val);
            if (val !== '1') {
              setValue('paciente.distrito_sanitario', undefined);
              setValue('paciente.polo_base', undefined);
              setValue('paciente.aldeia', undefined);
            }
          };
          if (resolved.codeList) {
            return <CodeListSelectField {...commonProps} onChange={viveAldeadoOnChange} />;
          }
          return <SelectField {...commonProps} onChange={viveAldeadoOnChange} />;
        }
        if (resolved.codeList) {
          return <CodeListSelectField {...commonProps} />;
        }
        if ((resolved as { apiSelectEndpoint?: string }).apiSelectEndpoint) {
          if (resolved.key === 'paciente.ocupacao_cbo') {
            return <CboSearchField {...commonProps} />;
          }
          if (resolved.key === 'paciente.atividade_cnae') {
            return <CnaeSearchField {...commonProps} />;
          }
          if (resolved.key === 'paciente.pais_nascimento_id') {
            return <ApiSelectSearchField {...commonProps} />;
          }
          if (resolved.key === 'paciente.qual_povo_tradicional') {
            return (
              <ApiSelectSearchField
                {...commonProps}
                onChange={(val: any) => {
                  setValue(resolved.key, val);
                  if (val !== '39') setValue('paciente.outro_povo_tradicional', undefined);
                }}
              />
            );
          }
          if (resolved.key === 'paciente.etnia') {
            return <ApiSelectSearchField {...commonProps} />;
          }
          if (resolved.key === 'paciente.raca_cor') {
            return (
              <ApiSelectField
                {...commonProps}
                onChange={(val: any) => {
                  setValue(resolved.key, val);
                  if (String(val ?? '') !== '5') {
                    setValue('paciente.etnia', undefined);
                    setValue('paciente.vive_aldeado', undefined);
                    setValue('paciente.distrito_sanitario', undefined);
                    setValue('paciente.polo_base', undefined);
                    setValue('paciente.aldeia', undefined);
                  }
                }}
              />
            );
          }
          if (resolved.key === 'paciente.orientacao_sexual') {
            return (
              <ApiSelectField
                {...commonProps}
                onChange={(val: any) => {
                  setValue(resolved.key, val);
                  if (val !== '4') setValue('paciente.outra_orientacao_sexual', undefined);
                }}
              />
            );
          }
          return <ApiSelectField {...commonProps} />;
        }
        // É estrangeiro?: ao mudar, limpar documento que não se aplica e ajustar país de nascimento
        if (resolved.key === 'paciente.e_estrangeiro') {
          return (
            <SelectField
              {...commonProps}
              onChange={(val: any) => {
                setValue(resolved.key, val);
                if (val === '1') {
                  setValue('paciente.cpf', undefined);
                  setValue('paciente.pais_nascimento_id', undefined); // estrangeiro: não é Brasil automaticamente
                }
                if (val === '2') {
                  setValue('paciente.passaporte', undefined);
                  setValue('paciente.pais_nascimento_id', undefined); // não estrangeiro: país fica oculto, não pré-selecionar Brasil
                }
              }}
            />
          );
        }
        // É membro de povo ou comunidade tradicional?: ao mudar para Não/Ignorado, limpar Qual povo e Outro povo
        if (resolved.key === 'paciente.povo_tradicional') {
          return (
            <SelectField
              {...commonProps}
              onChange={(val: any) => {
                setValue(resolved.key, val);
                if (val !== '1') {
                  setValue('paciente.qual_povo_tradicional', undefined);
                  setValue('paciente.outro_povo_tradicional', undefined);
                }
              }}
            />
          );
        }
        return <SelectField {...commonProps} />;
      case 'select-search':
        if (field.codeList) {
          return <CodeListSearchField {...commonProps} />;
        }
        if ((field as { apiSelectEndpoint?: string }).apiSelectEndpoint) {
          return <ApiSelectSearchField {...commonProps} />;
        }
        return <SelectSearchField {...commonProps} />;
      case 'multi-select':
        return <MultiSelectField {...commonProps} />;
      case 'radio':
        return <RadioGroupField {...commonProps} />;
      case 'email':
        return <EmailField {...commonProps} />;
      case 'phone':
        return <PhoneField {...commonProps} />;
      case 'international-phone':
        return <InternationalPhoneField {...commonProps} />;
      case 'cpf':
        return <CPFField {...commonProps} onBlur={() => validateField(resolved)} />;
      case 'cns':
        return <CNSField {...commonProps} onBlur={() => validateField(resolved)} />;
      case 'passaporte':
        return <PassaporteField {...commonProps} onBlur={() => validateField(resolved)} />;
      case 'cep':
        return <CEPField {...commonProps} />;
      case 'file':
        return <FileUploadField {...commonProps} onUploadingChange={handleUploadingChange} />;
      case 'signature':
        return <SignatureField {...commonProps} />;
      case 'geolocation':
        return <GeoLocationField {...commonProps} />;
      case 'autocomplete':
        return <AutocompleteField {...commonProps} />;
      case 'color':
        return <ColorPickerField {...commonProps} />;
      case 'slider':
        return <SliderField {...commonProps} />;
      case 'rating':
        return <StarRatingField {...commonProps} />;
      case 'google-address':
        return <GoogleMapsAddressField {...commonProps} />;
      case 'address':
        return <AddressField {...commonProps} />;
      case 'table':
        return <TableField {...commonProps} getValue={getValue} />;
      default:
        return (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              Tipo de campo não suportado: <strong>{resolved.type}</strong>
            </p>
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">{schema.agravo}</h1>

      {sectionsToRender.map((section) => {
          const sortedFields = [...section.fields].sort((a, b) => a.order - b.order);
          const firstNotificationLocationKey = sortedFields.find((f) =>
            NOTIFICATION_LOCATION_KEYS.has(f.key)
          )?.key;
          const firstEstabelecimentoKey = sortedFields.find((f) =>
            NOTIFICATION_ESTABELECIMENTO_KEYS.has(f.key)
          )?.key;
          const firstNotificationField = sortedFields.find(
            (f) =>
              NOTIFICATION_LOCATION_KEYS.has(f.key) ||
              NOTIFICATION_ESTABELECIMENTO_KEYS.has(f.key)
          );
          const dtNotificacaoField = sortedFields.find((f) => f.key === 'notificacao.dt_notificacao');
          const cpfField = sortedFields.find((f) => f.key === 'paciente.cpf');
          const cnsField = sortedFields.find((f) => f.key === 'paciente.cns');
          const estrangeiroField = sortedFields.find((f) => f.key === 'paciente.e_estrangeiro');
          const nomeField = sortedFields.find((f) => f.key === 'paciente.nome');
          const nomeSocialField = sortedFields.find((f) => f.key === 'paciente.nome_social');
          const nomeMaeField = sortedFields.find((f) => f.key === 'paciente.nome_mae');
          const dataNascimentoField = sortedFields.find((f) => f.key === 'paciente.data_nascimento');
          const idadeField = sortedFields.find((f) => f.key === 'paciente.idade');
          const sexoField = sortedFields.find((f) => f.key === 'paciente.sexo');
          const passaporteField = sortedFields.find((f) => f.key === 'paciente.passaporte');
          const paisField = sortedFields.find((f) => f.key === 'paciente.pais_nascimento_id');
          return (
            <div key={section.id} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedFields.map((field) => {
                  // Bloco único: Estabelecimento de saúde de notificação (UF, Município, Estabelecimento). Data da notificação fica em Dados do paciente.
                  if (firstNotificationField && field.key === firstNotificationField.key) {
                    return (
                      <div key="notificacao-estabelecimento-block" className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Estabelecimento de saúde de notificação</h3>
                        <div className="space-y-4">
                          <EstadoMunicipioNotificacao
                            getValue={getValue}
                            setValue={setValue}
                            disabled={readOnly}
                            error={getError('notificacao.municipio_id') || getError('notificacao.uf_notificacao')}
                            required={isFieldRequired('notificacao.uf_notificacao') || isFieldRequired('notificacao.municipio_id')}
                          />
                          <EstabelecimentoNotificacao
                            getValue={getValue}
                            setValue={setValue}
                            disabled={readOnly}
                            error={getError('notificacao.unidade_id') || getError('notificacao.estabelecimento_cnes')}
                            required={isFieldRequired('notificacao.unidade_id') || isFieldRequired('notificacao.estabelecimento_cnes')}
                          />
                        </div>
                      </div>
                    );
                  }
                  if (NOTIFICATION_LOCATION_KEYS.has(field.key) || NOTIFICATION_ESTABELECIMENTO_KEYS.has(field.key)) {
                    return null;
                  }
                  const firstResidenciaField = sortedFields.find((f) => RESIDENCIA_BLOCK_KEYS.has(f.key));
                  if (firstResidenciaField && field.key === firstResidenciaField.key) {
                    const cepField = sortedFields.find((f) => f.key === 'residencia.cep');
                    const bairroField = sortedFields.find((f) => f.key === 'residencia.bairro');
                    const logradouroField = sortedFields.find((f) => f.key === 'residencia.logradouro');
                    const zonaField = sortedFields.find((f) => f.key === 'residencia.zona');
                    const numeroField = sortedFields.find((f) => f.key === 'residencia.numero');
                    const complementoField = sortedFields.find((f) => f.key === 'residencia.complemento');
                    const telefoneField = sortedFields.find((f) => f.key === 'residencia.telefone');
                    const handleCepFound = (detail: CepFoundDetail) => {
                      setValue('residencia.uf', detail.uf ?? '');
                      setValue('residencia.municipio_ibge', detail.ibge ?? '');
                      setValue('residencia.logradouro', normalizeMaiusculo(detail.logradouro ?? ''));
                      setValue('residencia.bairro', normalizeMaiusculo(detail.bairro ?? ''));
                    };
                    return (
                      <div key="residencia-block" className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Endereço de residência</h3>
                        <div className="space-y-4">
                          {cepField && (
                            <CEPField
                              field={getResolvedField(cepField)}
                              value={getValue(cepField.key)}
                              onChange={(v) => setValue(cepField.key, v)}
                              error={getError(cepField.key)}
                              required={isFieldRequired(cepField.key)}
                              disabled={readOnly}
                              onCepFound={handleCepFound}
                            />
                          )}
                          <EstadoMunicipioResidencia
                            getValue={getValue}
                            setValue={setValue}
                            disabled={readOnly}
                            error={getError('residencia.uf') || getError('residencia.municipio_ibge')}
                            required={isFieldRequired('residencia.uf') || isFieldRequired('residencia.municipio_ibge')}
                          />
                          {bairroField && (
                            <div className="min-w-0">
                              {renderField(getResolvedField(bairroField))}
                            </div>
                          )}
                          {logradouroField && (
                            <div className="min-w-0">
                              {renderField(getResolvedField(logradouroField))}
                            </div>
                          )}
                          {zonaField && (
                            <div className="min-w-0">
                              {renderField(getResolvedField(zonaField))}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {numeroField && (
                              <div className="min-w-0">
                                {renderField(getResolvedField(numeroField))}
                              </div>
                            )}
                            {complementoField && (
                              <div className="min-w-0">
                                {renderField(getResolvedField(complementoField))}
                              </div>
                            )}
                          </div>
                          {telefoneField && (
                            <div className="min-w-0">
                              {renderField(getResolvedField(telefoneField))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  if (RESIDENCIA_BLOCK_KEYS.has(field.key)) return null;
                  // Bloco Paciente - Identificação: quando Sim, Passaporte e País (ao lado) surgem embaixo de CNS/É estrangeiro e empurram Nome/Nome social pra baixo. País oculto quando Não; sem pré-seleção Brasil.
                  if (dtNotificacaoField && field.key === 'notificacao.dt_notificacao') {
                    const estrangeiroSim = getValue('paciente.e_estrangeiro') === '1';
                    return (
                      <div key="identificacao-block" className="md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 items-start">
                          {dtNotificacaoField && <div className="min-w-0">{renderField(dtNotificacaoField)}</div>}
                          {cpfField && <div className="min-w-0">{renderField(cpfField)}</div>}
                          {cnsField && <div className="min-w-0">{renderField(cnsField)}</div>}
                          {estrangeiroField && <div className="min-w-0">{renderField(estrangeiroField)}</div>}
                          {estrangeiroSim && passaporteField && <div className="min-w-0">{renderField(passaporteField)}</div>}
                          {estrangeiroSim && paisField && <div className="min-w-0">{renderField(paisField)}</div>}
                          {nomeField && <div className="min-w-0">{renderField(nomeField)}</div>}
                          {nomeSocialField && <div className="min-w-0">{renderField(nomeSocialField)}</div>}
                          {nomeMaeField && <div className="min-w-0">{renderField(nomeMaeField)}</div>}
                          {dataNascimentoField && <div className="min-w-0">{renderField(dataNascimentoField)}</div>}
                          {idadeField && <div className="min-w-0">{renderField(idadeField)}</div>}
                          {sexoField && <div className="min-w-0">{renderField(sexoField)}</div>}
                        </div>
                      </div>
                    );
                  }
                  if (IDENTIFICACAO_BLOCK_KEYS.has(field.key)) return null;
                  if (field.key === 'paciente.pais_nascimento') return null;
                  const content = renderField(field);
                  if (content == null) return null;
                  return (
                    <div
                      key={field.key}
                      className={isFullWidth(field.type) ? 'md:col-span-2' : ''}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {!readOnly && (
        <div className="flex gap-4 justify-end mt-6 pt-6 border-t">
          {isUploading && (
            <p className="mr-auto text-sm text-amber-700 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Processando arquivo… Aguarde antes de enviar ou sair da página.
            </p>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
          )}
          {onSaveDraft && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isUploading}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveDraftLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Aguarde...' : submitLabel}
          </button>
        </div>
      )}
    </form>
  );
};
