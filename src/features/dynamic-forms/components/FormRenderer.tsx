import React, { useState, useCallback, useEffect } from 'react';
import type { FormSchema } from '@/services/FormService';
import { useFormRenderer } from '../hooks/useFormRenderer';
import { TextField, DateField, NumberField, TextareaField, CheckboxField } from './FormFields';
import { SelectField, SelectSearchField, CodeListSelectField, CodeListSearchField } from './SelectFields';
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
import { convertLocalDateTimeToUTC } from '@/utils/timezoneUtils';

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
  const {
    setValue,
    getValue,
    isFieldVisible,
    isFieldRequired,
    isFieldDisabled,
    getError,
    validateAll,
    formData,
  } = useFormRenderer({
    schema,
    initialData,
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

  const renderField = (field: any) => {
    const value = getValue(field.key);
    const error = getError(field.key);
    const required = isFieldRequired(field.key);
    const visible = isFieldVisible(field.key);
    const disabled = isFieldDisabled(field.key) || readOnly;

    if (!visible) {
      return null;
    }

    const commonProps = {
      field,
      value,
      onChange: (val: any) => setValue(field.key, val),
      error,
      required,
      disabled,
    };

    switch (field.type) {
      case 'text':
        return <TextField {...commonProps} />;
      case 'date':
        return <DateField {...commonProps} />;
      case 'datetime':
        return <DateTimeField {...commonProps} />;
      case 'time':
        return <TimeField {...commonProps} />;
      case 'number':
        return <NumberField {...commonProps} />;
      case 'textarea':
        return <TextareaField {...commonProps} />;
      case 'checkbox':
        return <CheckboxField {...commonProps} />;
      case 'checkbox-group':
        return <CheckboxGroupField {...commonProps} />;
      case 'select':
        if (field.codeList) {
          return <CodeListSelectField {...commonProps} />;
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
        return <CPFField {...commonProps} />;
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
              Tipo de campo não suportado: <strong>{field.type}</strong>
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
        .map((section) => (
          <div key={section.id} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div
                    key={field.key}
                    className={isFullWidth(field.type) ? 'md:col-span-2' : ''}
                  >
                    {renderField(field)}
                  </div>
                ))}
            </div>
          </div>
        ))}

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
