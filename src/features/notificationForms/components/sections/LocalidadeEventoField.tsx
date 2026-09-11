import React, { useMemo } from 'react';
import {
  FormData,
  LocalidadeEventoDTO,
  ModoLocalidadeEvento,
} from '@/features/notificationForms/types/index2';
import FormField from '../shared/FormField';
import LocationInput from '@/features/notificationForms/components/LocationInput';

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

interface LocalidadeEventoFieldProps {
  formData: FormData;
  errors: Record<string, string>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  localidadeEventoOptions?: LocalidadeEventoDTO[];
  modoLocalidadeEvento?: ModoLocalidadeEvento;
  isLoadingLocalidadesEvento?: boolean;
  localidadeEventoCatalogAvailable?: boolean;
}

const LocalidadeEventoField: React.FC<LocalidadeEventoFieldProps> = ({
  formData,
  errors,
  handleChange,
  localidadeEventoOptions = [],
  modoLocalidadeEvento = 'NAO_USA',
  isLoadingLocalidadesEvento = false,
  localidadeEventoCatalogAvailable = true,
}) => {
  const selectedLocalidade = localidadeEventoOptions.find(
    option => option.id.toString() === formData.localidadeEvento,
  );
  const showLocalidadeOutro = selectedLocalidade?.especial === 'OUTRO';
  const localidadeObrigatoria = modoLocalidadeEvento === 'OBRIGATORIA';
  const campoDesabilitado =
    isLoadingLocalidadesEvento || !localidadeEventoCatalogAvailable;

  const locationOptions = useMemo(
    () =>
      groupLocalidadesEvento(localidadeEventoOptions).flatMap(group =>
        group.options.map(option => ({
          id: option.id,
          descricao: option.ativo ? option.nome : `${option.nome} (inativa)`,
        })),
      ),
    [localidadeEventoOptions],
  );

  const excludeValues = useMemo(
    () =>
      localidadeEventoOptions
        .filter(
          option =>
            !option.ativo &&
            option.id.toString() !== formData.localidadeEvento,
        )
        .map(option => String(option.id)),
    [localidadeEventoOptions, formData.localidadeEvento],
  );

  const emitLocalidadeChange = (value: string) => {
    handleChange({
      target: { name: 'localidadeEvento', value },
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <>
      <div>
        <LocationInput
          key={formData.evento || 'localidade-evento'}
          name="localidadeEvento"
          label="Localidade no evento"
          value={formData.localidadeEvento}
          onChange={emitLocalidadeChange}
          options={locationOptions}
          idField="id"
          placeholder={
            isLoadingLocalidadesEvento
              ? 'Carregando localidades...'
              : 'Selecione'
          }
          required={localidadeObrigatoria}
          error={errors.localidadeEvento}
          disabled={campoDesabilitado}
          excludeValues={excludeValues}
        />
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
            Catálogo indisponível. Sincronize os dados de apoio para usar este
            campo offline.
          </p>
        )}
      </div>

      {showLocalidadeOutro && (
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
            Informe apenas a localidade de forma genérica; não inclua nome de
            pessoa ou endereço.
          </p>
        </div>
      )}
    </>
  );
};

export default LocalidadeEventoField;
