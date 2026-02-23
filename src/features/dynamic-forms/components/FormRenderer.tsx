import React, { useState, useCallback, useEffect } from 'react';
import type { FormSchema } from '@/services/FormService';
import { useFormRenderer } from '../hooks/useFormRenderer';
import { TextField, DateField, NumberField, TextareaField, CheckboxField } from './FormFields';
import { SelectField, SelectSearchField, CodeListSelectField, CodeListSearchField, ApiSelectField, ApiSelectSearchField } from './SelectFields';
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

/** Bloco Nome + É estrangeiro? + CPF/CNS ou Passaporte: nome e estrangeiro na mesma linha; doc (e CNS ao lado do CPF) logo abaixo */
const NOME_ESTRANGEIRO_DOC_KEYS = new Set([
  'paciente.nome',
  'paciente.e_estrangeiro',
  'paciente.cpf',
  'paciente.passaporte',
  'paciente.cns',
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

/** ID do Brasil em tipo_pais (pré-seleção em País de Nascimento). Valor string para bater com as opções do select. */
const BRASIL_PAIS_NASCIMENTO_ID = '105';

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
    const paisId = pac.pais_nascimento_id;
    const needPaisDefault = paisId === undefined || paisId === null || paisId === '';
    const estrangeiroSim = pac.e_estrangeiro === '1';
    // Brasil só como padrão quando não for estrangeiro; se estrangeiro = Sim, não preencher país
    const paisInicial = needPaisDefault
      ? (estrangeiroSim ? undefined : BRASIL_PAIS_NASCIMENTO_ID)
      : paisId;
    return {
      ...initialData,
      paciente: {
        ...pac,
        pais_nascimento_id: paisInicial,
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
  ]);
  const isFullWidth = (type: string) => fullWidthTypes.has(type);

  // Mapeamento por key: garante tipo/opções corretos mesmo quando o schema vem com type "text" do banco
  const getResolvedField = (field: any) => {
    const keyMap: Record<string, { type: string; options?: Array<{ value: string; label: string }>; apiSelectEndpoint?: string; maxLength?: number }> = {
      'paciente.nome': { type: 'text', maxLength: 100 },
      'paciente.cpf': { type: 'cpf' },
      'paciente.cns': { type: 'cns' },
      'paciente.nome_social': { type: 'text', maxLength: 100 },
      'paciente.e_estrangeiro': { type: 'select', options: [{ value: '1', label: 'SIM' }, { value: '2', label: 'NÃO' }] },
      'paciente.passaporte': { type: 'passaporte' },
      'paciente.pais_nascimento_id': { type: 'select', apiSelectEndpoint: 'tipo-pais/select' },
      'paciente.data_nascimento': { type: 'date' },
      'paciente.idade': { type: 'idade' },
      'paciente.nome_mae': { type: 'text', maxLength: 100 },
    };
    const over = keyMap[field.key];
    if (!over) return field;
    return { ...field, type: over.type, options: over.options ?? field.options, apiSelectEndpoint: over.apiSelectEndpoint ?? field.apiSelectEndpoint, maxLength: over.maxLength ?? field.maxLength };
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

    const normalizeNomeMaiusculo = (v: any) => {
      if (v == null || v === '') return v;
      return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    };
    const isNomeOuNomeSocialOuNomeMae =
      resolved.key === 'paciente.nome' || resolved.key === 'paciente.nome_social' || resolved.key === 'paciente.nome_mae';
    const textProps = isNomeOuNomeSocialOuNomeMae
      ? { ...commonProps, onChange: (val: any) => setValue(resolved.key, normalizeNomeMaiusculo(val)) }
      : commonProps;

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
        return <TextField {...textProps} />;
      case 'date':
        return <DateField {...dateProps} />;
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
        if (resolved.codeList) {
          return <CodeListSelectField {...commonProps} />;
        }
        if ((resolved as { apiSelectEndpoint?: string }).apiSelectEndpoint) {
          if (resolved.key === 'paciente.pais_nascimento_id') {
            return <ApiSelectSearchField {...commonProps} />;
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
                  setValue('paciente.pais_nascimento_id', BRASIL_PAIS_NASCIMENTO_ID); // não estrangeiro: Brasil
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

      {schema.sections
        .sort((a, b) => a.order - b.order)
        .map((section) => {
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
          const nomeField = sortedFields.find((f) => f.key === 'paciente.nome');
          const estrangeiroField = sortedFields.find((f) => f.key === 'paciente.e_estrangeiro');
          const cpfField = sortedFields.find((f) => f.key === 'paciente.cpf');
          const passaporteField = sortedFields.find((f) => f.key === 'paciente.passaporte');
          const cnsField = sortedFields.find((f) => f.key === 'paciente.cns');
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
                  // Bloco Nome + É estrangeiro? (ao lado) + CPF+CNS ou Passaporte (logo abaixo)
                  if (nomeField && estrangeiroField && field.key === 'paciente.nome') {
                    const nomeContent = renderField(nomeField);
                    const estrangeiroContent = renderField(estrangeiroField);
                    const estrangeiroSim = getValue('paciente.e_estrangeiro') === '1';
                    const estrangeiroNao = getValue('paciente.e_estrangeiro') === '2';
                    const passaporteContent = estrangeiroSim && passaporteField ? renderField(passaporteField) : null;
                    const cpfContent = estrangeiroNao && cpfField ? renderField(cpfField) : null;
                    const cnsContent = (estrangeiroSim || estrangeiroNao) && cnsField ? renderField(cnsField) : null;
                    return (
                      <div key="nome-estrangeiro-doc-block" className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="min-w-0">{nomeContent}</div>
                          <div className="md:flex-shrink-0">{estrangeiroContent}</div>
                        </div>
                        {passaporteContent != null && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>{passaporteContent}</div>
                            <div>{cnsContent}</div>
                          </div>
                        )}
                        {cpfContent != null && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>{cpfContent}</div>
                            <div>{cnsContent}</div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (field.key === 'paciente.e_estrangeiro' || field.key === 'paciente.cpf' || field.key === 'paciente.passaporte') {
                    return null;
                  }
                  // CNS já aparece no bloco (ao lado do Passaporte ou do CPF); não duplicar
                  if (field.key === 'paciente.cns') {
                    return null;
                  }
                  // Não renderizar nem o wrapper: campo duplicado (só exibimos paciente.pais_nascimento_id)
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
