// src/features/notificationForms/components/sections/GeneralInfoSection.tsx
import React from 'react';
import { FileOutput } from 'lucide-react';
import {
  EventoOption,
  FormSectionProps,
} from '@/features/notificationForms/types/index2';
import { isEventoAtivo } from '@/features/notificationForms/utils/offlineEventoScope';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';

export { groupLocalidadesEvento } from './LocalidadeEventoField';

interface GeneralInfoSectionProps extends FormSectionProps {
  eventoOptions?: EventoOption[];
  publicoOptions?: Array<{ idtipo_publico: number; descricao: string }>;
  eventoDisabled?: boolean;
}

const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  formData,
  errors,
  handleChange,
  isExpanded,
  toggleSection,
  eventoOptions,
  publicoOptions,
  eventoDisabled = false,
}) => {
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
            <div>
              <FormField
                label="Evento"
                name="evento"
                value={formData.evento}
                onChange={handleChange}
                type="select"
                required
                error={errors.evento}
                disabled={eventoDisabled}
                options={
                  eventoOptions?.map((option) => ({
                    value: option.idtipo_evento.toString(),
                    label: isEventoAtivo(option)
                      ? option.descricao
                      : `${option.descricao} (histórico)`
                  })) || []
                }
              />
              {eventoDisabled && (
                <p className="mt-2 text-sm text-gray-600">
                  Evento encerrado. A ficha permanece neste evento.
                </p>
              )}
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralInfoSection;
