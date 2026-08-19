// src/features/notificationForms/components/sections/GeneralInfoSection.tsx
import React from 'react';
import { FileOutput } from 'lucide-react';
import {
  EventoOption,
  FormSectionProps,
  LocalidadeEventoDTO,
  ModoLocalidadeEvento,
} from '@/features/notificationForms/types/index2';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';

interface GeneralInfoSectionProps extends FormSectionProps {
  eventoOptions?: EventoOption[];
  publicoOptions?: Array<{ idtipo_publico: number; descricao: string }>;
  localidadeEventoOptions?: LocalidadeEventoDTO[];
  modoLocalidadeEvento?: ModoLocalidadeEvento;
  isLoadingLocalidadesEvento?: boolean;
  localidadeEventoCatalogAvailable?: boolean;
}

interface LocalidadeGroup {
  label: string;
  options: LocalidadeEventoDTO[];
}

export const groupLocalidadesEvento = (
  options: LocalidadeEventoDTO[],
): LocalidadeGroup[] => [
  {
    label: 'Bairros',
    options: options.filter(
      option => option.especial === 'NORMAL' && option.tipo === 'BAIRRO',
    ),
  },
  {
    label: 'Comunidades',
    options: options.filter(
      option =>
        option.especial === 'NORMAL' &&
        option.tipo === 'COMUNIDADE' &&
        !option.ribeirinha,
    ),
  },
  {
    label: 'Comunidades Ribeirinhas',
    options: options.filter(
      option =>
        option.especial === 'NORMAL' &&
        option.tipo === 'COMUNIDADE' &&
        option.ribeirinha,
    ),
  },
  {
    label: 'Ramais',
    options: options.filter(
      option => option.especial === 'NORMAL' && option.tipo === 'RAMAL',
    ),
  },
  {
    label: 'Aldeias indígenas',
    options: options.filter(
      option =>
        option.especial === 'NORMAL' && option.tipo === 'ALDEIA_INDIGENA',
    ),
  },
  {
    label: 'Especiais',
    options: options.filter(option => option.especial !== 'NORMAL'),
  },
];

const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  formData,
  errors,
  handleChange,
  isExpanded,
  toggleSection,
  eventoOptions,
  publicoOptions,
  localidadeEventoOptions = [],
  modoLocalidadeEvento = 'NAO_USA',
  isLoadingLocalidadesEvento = false,
  localidadeEventoCatalogAvailable = true,
}) => {
  const showLocalidadeEvento = modoLocalidadeEvento !== 'NAO_USA';
  const selectedLocalidade = localidadeEventoOptions.find(
    option => option.id.toString() === formData.localidadeEvento,
  );
  const showLocalidadeOutro = selectedLocalidade?.especial === 'OUTRO';
  const localidadeGroups = groupLocalidadesEvento(localidadeEventoOptions);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SectionHeader
        icon={<FileOutput className="h-5 w-5 text-blue-500" />}
        title="1. Dados Gerais"
        isExpanded={isExpanded}
        onToggle={toggleSection}
      />
      
      {isExpanded && (
        <div className="p-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Evento */}
            <FormField
              label="Evento"
              name="evento"
              value={formData.evento}
              onChange={handleChange}
              type="select"
              required
              error={errors.evento}
              options={
                eventoOptions?.map((option) => ({
                  value: option.idtipo_evento.toString(),
                  label: option.descricao
                })) || []
              }
            />

            {/* Público Atendido */}
            <FormField
              label="Público Atendido"
              name="publicoAtendido"
              value={formData.publicoAtendido}
              onChange={handleChange}
              type="select"
              required
              error={errors.publicoAtendido}
              options={
                publicoOptions?.map((option) => ({
                  value: option.idtipo_publico.toString(),
                  label: option.descricao
                })) || []
              }
            />

            {showLocalidadeEvento && (
              <div className="md:col-span-2">
                <label
                  htmlFor="localidadeEvento"
                  className="block mb-2 font-medium text-gray-700"
                >
                  Localidade no evento{' '}
                  {modoLocalidadeEvento === 'OBRIGATORIA' && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <select
                  id="localidadeEvento"
                  name="localidadeEvento"
                  value={formData.localidadeEvento}
                  onChange={handleChange}
                  disabled={
                    isLoadingLocalidadesEvento ||
                    !localidadeEventoCatalogAvailable
                  }
                  aria-invalid={Boolean(errors.localidadeEvento)}
                  className={`w-full p-3 border rounded-lg text-sm transition-colors outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                    errors.localidadeEvento
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-blue-400'
                  } ${
                    isLoadingLocalidadesEvento ||
                    !localidadeEventoCatalogAvailable
                      ? 'bg-gray-100 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <option value="">
                    {isLoadingLocalidadesEvento
                      ? 'Carregando localidades...'
                      : 'Selecione'}
                  </option>
                  {localidadeGroups.map(group =>
                    group.options.length > 0 ? (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map(option => (
                          <option
                            key={option.id}
                            value={option.id}
                            disabled={!option.ativo}
                          >
                            {option.nome}
                            {!option.ativo ? ' (inativa)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    ) : null,
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Selecione a localidade relacionada ao caso durante o evento
                  selecionado.
                </p>
                {!isLoadingLocalidadesEvento &&
                  localidadeEventoCatalogAvailable &&
                  localidadeEventoOptions.length === 0 && (
                    <p className="mt-1 text-sm text-amber-700">
                      Nenhuma localidade está disponível para este evento.
                    </p>
                  )}
                {!localidadeEventoCatalogAvailable && (
                  <p className="mt-1 text-sm text-amber-700">
                    Catálogo indisponível. Sincronize os dados de apoio para
                    usar este campo offline.
                  </p>
                )}
                {errors.localidadeEvento && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.localidadeEvento}
                  </p>
                )}
              </div>
            )}

            {showLocalidadeEvento && showLocalidadeOutro && (
              <div className="md:col-span-2">
                <FormField
                  label="Outra localidade"
                  name="localidadeEventoOutro"
                  value={formData.localidadeEventoOutro}
                  onChange={handleChange}
                  type="textarea"
                  required
                  maxLength={150}
                  error={errors.localidadeEventoOutro}
                  placeholder="Informe a localidade de forma genérica"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Informe apenas a localidade de forma genérica; não inclua nome
                  de pessoa ou endereço.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralInfoSection;