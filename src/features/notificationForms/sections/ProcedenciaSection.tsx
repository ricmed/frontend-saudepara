import React from 'react';
import { Globe } from 'lucide-react';
import FormSection from '../components/FormSection';
import SelectField from '../components/SelectField';
import InputField from '../components/InputField';
import {
  residenteBelemOptions,
  bairrosBelemOptions,
  estadoOptions,
  municipioParaOptions,
  paisOptions
} from '@/features/notificationForms/types/OptionTypes';
import { FormData, FormChangeEvent } from '../types/FormTypes';

interface ProcedenciaSectionProps {
  formData: FormData;
  handleChange: (e: FormChangeEvent) => void;
  isExpanded: boolean;
  toggleSection: () => void;
}

const ProcedenciaSection: React.FC<ProcedenciaSectionProps> = ({
  formData,
  handleChange,
  isExpanded,
  toggleSection
}) => {
  return (
    <FormSection
      title="2. Procedência do indivíduo"
      icon={<Globe className="h-5 w-5 text-green-500" />}
      isExpanded={isExpanded}
      onToggle={toggleSection}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Residente em Belém? */}
        <SelectField
          label="Residente em Belém?"
          name="residenteBelem"
          value={formData.residenteBelem}
          options={residenteBelemOptions}
          onChange={handleChange}
        />

        {/* Campos condicionais baseados na residência */}
        {formData.residenteBelem === "1" && (
          <SelectField
            label="Bairro"
            name="bairro"
            value={formData.bairro}
            options={bairrosBelemOptions}
            onChange={handleChange}
          />
        )}

        {formData.residenteBelem === "2" && (
          <>
            <SelectField
              label="UF"
              name="uf"
              value={formData.uf}
              options={estadoOptions}
              onChange={handleChange}
            />
            <SelectField
              label="Município"
              name="municipio"
              value={formData.municipio}
              options={municipioParaOptions}
              onChange={handleChange}
            />
          </>
        )}

        {formData.residenteBelem === "3" && (
          <>
            <SelectField
              label="País de Procedência"
              name="paisProcedencia"
              value={formData.paisProcedencia}
              options={paisOptions}
              onChange={handleChange}
            />
            <InputField
              label="Local de Hospedagem"
              name="localHospedagem"
              value={formData.localHospedagem}
              onChange={handleChange}
              placeholder="Informe o local de hospedagem"
            />
            <InputField
              label="Contato do Local"
              name="contatoLocal"
              value={formData.contatoLocal}
              onChange={handleChange}
              placeholder="DDD XXXXX-XXXX"
            />
          </>
        )}
      </div>
    </FormSection>
  );
};

export default ProcedenciaSection;