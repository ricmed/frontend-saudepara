import React from 'react';
import { ArchiveX } from 'lucide-react';
import FormSection from '../components/FormSection';
import SelectField from '../components/SelectField';
import DateField from '../components/DateField';
import {
  tipoEncerramentoOptions,
  hospitalBelemOptions,
  localEncaminhamentoObitoOptions
} from '@/features/notificationForms/types/OptionTypes';
import { FormData, FormChangeEvent } from '../types/FormTypes';

interface EncerramentoSectionProps {
  formData: FormData;
  handleChange: (e: FormChangeEvent) => void;
  isExpanded: boolean;
  toggleSection: () => void;
}

const EncerramentoSection: React.FC<EncerramentoSectionProps> = ({
  formData,
  handleChange,
  isExpanded,
  toggleSection
}) => {
  return (
    <FormSection
      title="6. Encerramento do Caso"
      icon={<ArchiveX className="h-5 w-5 text-gray-700" />}
      isExpanded={isExpanded}
      onToggle={toggleSection}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data de Encerramento */}
        <DateField
          label="Data de Encerramento"
          name="dataEncerramento"
          value={formData.dataEncerramento}
          onChange={handleChange}
        />

        {/* Tipo de Encerramento */}
        <SelectField
          label="Tipo de Encerramento"
          name="tipoEncerramento"
          value={formData.tipoEncerramento}
          options={tipoEncerramentoOptions}
          onChange={handleChange}
        />

        {/* Local de Encaminhamento (condicional) */}
        {formData.tipoEncerramento === "4" && (
          <SelectField
            label="Local de Encaminhamento"
            name="localEncaminhamento"
            value={formData.localEncaminhamento}
            options={hospitalBelemOptions}
            onChange={handleChange}
          />
        )}

        {/* Local de Encaminhamento para Óbito */}
        {formData.tipoEncerramento === "5" && (
          <SelectField
            label="Local de Encaminhamento"
            name="localEncaminhamento"
            value={formData.localEncaminhamento}
            options={localEncaminhamentoObitoOptions}
            onChange={handleChange}
          />
        )}
      </div>
    </FormSection>
  );
};

export default EncerramentoSection;