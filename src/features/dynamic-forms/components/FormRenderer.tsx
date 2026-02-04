import React from 'react';
import type { FormSchema } from '@/services/FormService';
import { useFormRenderer } from '../hooks/useFormRenderer';
import { TextField, DateField, NumberField, TextareaField, CheckboxField } from './FormFields';
import { SelectField, CodeListSelectField, CodeListSearchField } from './SelectFields';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly) return;

    if (validateAll()) {
      onSubmit?.(formData);
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly) return;

    onSaveDraft?.(formData);
  };

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
        return <CodeListSearchField {...commonProps} />;
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
        return <FileUploadField {...commonProps} />;
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
                    className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                  >
                    {renderField(field)}
                  </div>
                ))}
            </div>
          </div>
        ))}

      {!readOnly && (
        <div className="flex gap-4 justify-end mt-6 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {cancelLabel}
            </button>
          )}
          {onSaveDraft && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {saveDraftLabel}
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {submitLabel}
          </button>
        </div>
      )}
    </form>
  );
};
