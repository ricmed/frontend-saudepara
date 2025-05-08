// src/features/notificationForms/components/sections/AttendanceInfoSection.tsx
import React from 'react';
import { ListChecks } from 'lucide-react';
import { FormSectionProps } from '@/features/notificationForms/types/index2';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';
import SearchableCheckboxGroup from '../shared/SearchableCheckboxGroup';
import CustomDateInput from '@/features/notificationForms/components/CustomDateInput';

interface AttendanceInfoSectionProps extends FormSectionProps {
  searchSintomas: string;
  setSearchSintomas: (search: string) => void;
  searchTrauma: string;
  setSearchTrauma: (search: string) => void;
  atendimentoOptions: any[];
  sintomaOptions: any[];
  traumaOptions: any[];
  hipoteseDiagOptions: any[];
  hipoteseDiagFiltradas: any[]; // Nova propriedade
  isLoadingHipoteses: boolean;  // Nova propriedade
  isTipoAtendimentoFunc: (tipo: string) => boolean;
}

const AttendanceInfoSection: React.FC<AttendanceInfoSectionProps> = ({
  formData,
  setFormData,
  errors,
  handleChange,
  handleCheckboxChange,
  isExpanded,
  toggleSection,
  searchSintomas,
  setSearchSintomas,
  searchTrauma,
  setSearchTrauma,
  atendimentoOptions,
  sintomaOptions,
  traumaOptions,
  hipoteseDiagOptions,
  hipoteseDiagFiltradas,
  isLoadingHipoteses,
  isTipoAtendimentoFunc
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SectionHeader
        icon={<ListChecks className="h-5 w-5 text-yellow-500" />}
        title="4. Informações do atendimento"
        isExpanded={isExpanded}
        onToggle={toggleSection}
      />
      
      {isExpanded && (
        <div className="p-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Atendimento */}
            <FormField
              label="Tipo de Atendimento"
              name="tipoAtendimento"
              value={formData.tipoAtendimento}
              onChange={handleChange}
              type="select"
              required
              error={errors.tipoAtendimento}
              options={
                atendimentoOptions?.map((option) => ({
                  value: option.idtipo_atendimento.toString(),
                  label: option.descricao
                })) || []
              }
            />

            {/* Sinais e Sintomas para CLINICO, SURTO, INCIDENTE QBRN */}
            {(isTipoAtendimentoFunc("CLINICO") ||
              isTipoAtendimentoFunc("SURTO") ||
              isTipoAtendimentoFunc("INCIDENTE QBRN")) && (
              <div className="md:col-span-2">
                <SearchableCheckboxGroup
                  label="Sinais e Sintomas"
                  options={sintomaOptions.map(option => ({
                    id: option.idtipo_sintoma.toString(),
                    label: option.descricao
                  }))}
                  selectedValues={formData.sinaisESintomas}
                  onChange={(value) => handleCheckboxChange && handleCheckboxChange('sinaisESintomas', value)}
                  error={errors.sinaisESintomas}
                  maxHeight="96"
                />
              </div>
            )}

            {/* Data de Início dos Sintomas e Observação apenas para CLINICO */}
            {isTipoAtendimentoFunc("CLINICO") && (
              <>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Data de Início dos Sintomas
                  </label>
                  <CustomDateInput
                    name="dataInicioSintomas"
                    className={`w-full p-3 border ${
                      errors.dataInicioSintomas
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                    value={formData.dataInicioSintomas}
                    onChange={handleChange}
                    data-error={errors.dataInicioSintomas ? "true" : "false"}
                  />
                  {errors.dataInicioSintomas && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.dataInicioSintomas}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <FormField
                    label="Observação"
                    name="observacaoSintomas"
                    value={formData.observacaoSintomas}
                    onChange={handleChange}
                    type="textarea"
                    placeholder="Informações adicionais sobre os sintomas..."
                  />
                </div>
              </>
            )}

            {/* Trauma ou múltiplas vítimas */}
            {(isTipoAtendimentoFunc("TRAUMA") ||
              isTipoAtendimentoFunc("MULTIPLAS VITIMAS")) && (
              <>
                {/* Tipo de Trauma com campo de pesquisa */}
                <div className="md:col-span-2">
                  <SearchableCheckboxGroup
                    label="Tipo de Trauma"
                    options={traumaOptions.map(option => ({
                      id: option.idtipo_trauma.toString(),
                      label: option.descricao
                    }))}
                    selectedValues={formData.tipoTrauma}
                    onChange={(value) => handleCheckboxChange && handleCheckboxChange('tipoTrauma', value)}
                    error={errors.tipoTrauma}
                    maxHeight="96"
                  />
                </div>

                {/* Data da Ocorrência */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Data da Ocorrência <span className="text-red-500">*</span>
                  </label>
                  <CustomDateInput
                    name="dataOcorrencia"
                    className={`w-full p-3 border ${
                      errors.dataOcorrencia
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                    value={formData.dataOcorrencia}
                    onChange={handleChange}
                    data-error={errors.dataOcorrencia ? "true" : "false"}
                  />
                  {errors.dataOcorrencia && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.dataOcorrencia}
                    </p>
                  )}
                </div>

                {/* Observação do Trauma */}
                <div className="md:col-span-2">
                  <FormField
                    label="Observação"
                    name="observacaoTrauma"
                    value={formData.observacaoTrauma}
                    onChange={handleChange}
                    type="textarea"
                    placeholder="Informações adicionais sobre o trauma..."
                  />
                </div>
              </>
            )}

            {/* Observação do Incidente para SURTO ou INCIDENTE QBRN */}
            {(isTipoAtendimentoFunc("SURTO") ||
              isTipoAtendimentoFunc("INCIDENTE QBRN")) && (
              <>
                <div className="md:col-span-2">
                  <FormField
                    label="Observação do Incidente"
                    name="observacaoIncidente"
                    value={formData.observacaoIncidente}
                    onChange={handleChange}
                    type="textarea"
                    placeholder="Informações adicionais sobre o incidente..."
                  />
                </div>
              </>
            )}

            {/* Data da Ocorrência para outros tipos */}
            {!isTipoAtendimentoFunc("TRAUMA") &&
              !isTipoAtendimentoFunc("MULTIPLAS VITIMAS") && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Data da Ocorrência <span className="text-red-500">*</span>
                </label>
                <CustomDateInput
                  name="dataOcorrencia"
                  className={`w-full p-3 border ${
                    errors.dataOcorrencia
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                  value={formData.dataOcorrencia}
                  onChange={handleChange}
                  data-error={errors.dataOcorrencia ? "true" : "false"}
                />
                {errors.dataOcorrencia && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.dataOcorrencia}
                  </p>
                )}
              </div>
            )}

            {/* Hipótese Diagnóstica para TODOS os tipos */}
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-gray-700">
                Hipótese Diagnóstica
              </label>
              
              {isLoadingHipoteses ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-600">Carregando hipóteses diagnósticas...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.sinaisESintomas.length > 0 && hipoteseDiagFiltradas.length > 0 && (
                    <div className="md:col-span-3 mb-2 text-xs text-gray-500">
                      Mostrando hipóteses diagnósticas ordenadas por relevância com base nos sintomas selecionados.
                    </div>
                  )}
                  
                  {hipoteseDiagFiltradas.map((option) => (
                    <label
                      key={option.idtipo_hipotese_diag}
                      className={`flex items-center gap-3 p-3 border ${
                        option.qtdSintomas ? 'border-yellow-200' : 'border-gray-200'
                      } rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.hipoteseDiagnostica.includes(
                          option.idtipo_hipotese_diag.toString()
                        )}
                        onChange={() => handleCheckboxChange && 
                          handleCheckboxChange(
                            "hipoteseDiagnostica",
                            option.idtipo_hipotese_diag.toString()
                          )
                        }
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                          {option.descricao}
                        </span>
                        {option.qtdSintomas && (
                          <span className="text-xs text-yellow-600">
                            {option.qtdSintomas} {option.qtdSintomas === 1 ? 'sintoma relacionado' : 'sintomas relacionados'}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                  
                  {hipoteseDiagFiltradas.length === 0 && formData.sinaisESintomas.length > 0 && (
                    <div className="md:col-span-3 text-center p-3 text-gray-500 italic border border-dashed border-gray-300 rounded-lg">
                      Nenhuma hipótese diagnóstica encontrada para os sintomas selecionados.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Observação da Hipótese para TODOS os tipos */}
            <div className="md:col-span-2">
              <FormField
                label="Observação da Hipótese"
                name="observacaoHipotese"
                value={formData.observacaoHipotese}
                onChange={handleChange}
                type="textarea"
                placeholder="Informações adicionais sobre a hipótese diagnóstica..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceInfoSection;