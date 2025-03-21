import React from 'react';
import { ListChecks } from 'lucide-react';
import FormSection from '../components/FormSection';
import SelectField from '../components/SelectField';
import DateField from '../components/DateField';
import TextareaField from '../components/TextareaField';
import CheckboxGroup from '../components/CheckboxGroup';
import {
  tipoAtendimentoOptions,
  sinaisESintomasOptions,
  hipoteseDiagnosticaOptions,
  tipoTraumaOptions
} from '@/features/notificationForms/types/OptionTypes';
import { FormData, FormChangeEvent } from '../types/FormTypes';

interface AtendimentoSectionProps {
  formData: FormData;
  handleChange: (e: FormChangeEvent) => void;
  handleCheckboxChange: (field: keyof FormData, value: string) => void;
  searchSintomas: string;
  setSearchSintomas: React.Dispatch<React.SetStateAction<string>>;
  searchTrauma: string;
  setSearchTrauma: React.Dispatch<React.SetStateAction<string>>;
  isExpanded: boolean;
  toggleSection: () => void;
}

const AtendimentoSection: React.FC<AtendimentoSectionProps> = ({
  formData,
  handleChange,
  handleCheckboxChange,
  searchSintomas,
  setSearchSintomas,
  searchTrauma,
  setSearchTrauma,
  isExpanded,
  toggleSection
}) => {
  // Handler para alterações em grupos de checkbox
  const handleSinaisESintomasChange = (values: string[]) => {
    const fieldName: keyof FormData = 'sinaisESintomas';
    // O TypeScript pode reclamar aqui, mas sabemos que estamos definindo um array de strings
    // @ts-ignore
    setFormData(prev => ({ ...prev, [fieldName]: values }));
  };

  const handleHipoteseDiagnosticaChange = (values: string[]) => {
    const fieldName: keyof FormData = 'hipoteseDiagnostica';
    // @ts-ignore
    setFormData(prev => ({ ...prev, [fieldName]: values }));
  };

  const handleTipoTraumaChange = (values: string[]) => {
    const fieldName: keyof FormData = 'tipoTrauma';
    // @ts-ignore
    setFormData(prev => ({ ...prev, [fieldName]: values }));
  };

  return (
    <FormSection
      title="4. Informações do atendimento"
      icon={<ListChecks className="h-5 w-5 text-yellow-500" />}
      isExpanded={isExpanded}
      onToggle={toggleSection}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipo de Atendimento */}
        <SelectField
          label="Tipo de Atendimento"
          name="tipoAtendimento"
          value={formData.tipoAtendimento}
          options={tipoAtendimentoOptions}
          onChange={handleChange}
        />

        {/* Campos condicionais baseados no tipo de atendimento */}
        {formData.tipoAtendimento === "1" && ( // Clínico
          <>
            {/* Sinais e Sintomas */}
            <div className="md:col-span-2">
              <CheckboxGroup
                label="Sinais e Sintomas"
                options={sinaisESintomasOptions}
                selectedValues={formData.sinaisESintomas}
                onChange={(values) => {
                  handleSinaisESintomasChange(values);
                }}
                searchPlaceholder="Pesquisar sintomas..."
              />
            </div>

            {/* Data de Início dos Sintomas */}
            <DateField
              label="Data de Início dos Sintomas"
              name="dataInicioSintomas"
              value={formData.dataInicioSintomas}
              onChange={handleChange}
            />

            {/* Observação dos Sintomas */}
            <div className="md:col-span-2">
              <TextareaField
                label="Observação"
                name="observacaoSintomas"
                value={formData.observacaoSintomas}
                onChange={handleChange}
                placeholder="Informações adicionais sobre os sintomas..."
              />
            </div>

            {/* Hipótese Diagnóstica */}
            <div className="md:col-span-2">
              <CheckboxGroup
                label="Hipótese Diagnóstica"
                options={hipoteseDiagnosticaOptions}
                selectedValues={formData.hipoteseDiagnostica}
                onChange={(values) => {
                  handleHipoteseDiagnosticaChange(values);
                }}
                searchPlaceholder="Pesquisar hipóteses..."
              />
            </div>

            {/* Observação da Hipótese */}
            <div className="md:col-span-2">
              <TextareaField
                label="Observação"
                name="observacaoHipotese"
                value={formData.observacaoHipotese}
                onChange={handleChange}
                placeholder="Informações adicionais sobre a hipótese diagnóstica..."
              />
            </div>
          </>
        )}

        {formData.tipoAtendimento === "2" && ( // Trauma
          <>
            {/* Tipo de Trauma */}
            <div className="md:col-span-2">
              <CheckboxGroup
                label="Tipo de Trauma"
                options={tipoTraumaOptions}
                selectedValues={formData.tipoTrauma}
                onChange={(values) => {
                  handleTipoTraumaChange(values);
                }}
                searchPlaceholder="Pesquisar traumas..."
              />
            </div>

            {/* Data da Ocorrência */}
            <DateField
              label="Data da Ocorrência"
              name="dataOcorrencia"
              value={formData.dataOcorrencia}
              onChange={handleChange}
            />

            {/* Observação do Trauma */}
            <div className="md:col-span-2">
              <TextareaField
                label="Observação"
                name="observacaoTrauma"
                value={formData.observacaoTrauma}
                onChange={handleChange}
                placeholder="Informações adicionais sobre o trauma..."
              />
            </div>
          </>
        )}

        {/* Surto, Múltiplas vítimas, QBRN */}
        {["3", "4", "5"].includes(formData.tipoAtendimento) && (
          <>
            {/* Relacionado a Surto ou Agregado de Indivíduos */}
            <SelectField
              label="Relacionado a Surto ou Agregado de Indivíduos"
              name="relacionadoSurto"
              value={formData.relacionadoSurto}
              options={[
                { value: "1", label: "Sim" },
                { value: "2", label: "Não" },
              ]}
              onChange={handleChange}
            />

            {/* Observação do Incidente */}
            <div className="md:col-span-2">
              <TextareaField
                label="Observação do Incidente"
                name="observacaoIncidente"
                value={formData.observacaoIncidente}
                onChange={handleChange}
                placeholder="Informações adicionais sobre o incidente..."
              />
            </div>
          </>
        )}
      </div>
    </FormSection>
  );
};

export default AtendimentoSection;