// src/features/notificationForms/components/sections/CaseClosureSection.tsx
import React from 'react';
import { ArchiveX } from 'lucide-react';
import { FormSectionProps } from '@/features/notificationForms/types/index2';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';
import CustomDateInput from '@/features/notificationForms/components/CustomDateInput';
import UnidadeNotificadoraField from '@/features/notificationForms/components/UnidadeNotificadoraField';
import LocalEncaminhamentoSelect from '@/features/notificationForms/components/LocalEncaminhamentoSelect';

interface CaseClosureSectionProps extends FormSectionProps {
  encerramentoOptions: any[];
  isTipoEncerramentoFunc: (tipo: string) => boolean;
}

const CaseClosureSection: React.FC<CaseClosureSectionProps> = ({
  formData,
  setFormData,
  errors,
  handleChange,
  isExpanded,
  toggleSection,
  encerramentoOptions,
  isTipoEncerramentoFunc
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SectionHeader
        icon={<ArchiveX className="h-5 w-5 text-gray-700" />}
        title="6. Desfecho do Caso"
        isExpanded={isExpanded}
        onToggle={toggleSection}
      />
      
      {isExpanded && (
        <div className="p-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data de Encerramento */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Data do Desfecho
              </label>
              <CustomDateInput
                name="dataEncerramento"
                className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                value={formData.dataEncerramento}
                onChange={handleChange}
              />
            </div>

            {/* Tipo de Encerramento */}
            <FormField
              label="Desfecho"
              name="tipoEncerramento"
              value={formData.tipoEncerramento}
              onChange={handleChange}
              type="select"
              required
              error={errors.tipoEncerramento}
              options={
                encerramentoOptions?.map((option) => ({
                  value: option.idtipo_encerramento.toString(),
                  label: option.descricao
                })) || []
              }
            />

            {/* Local de Encaminhamento (condicional) */}
            {isTipoEncerramentoFunc("transferido") && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Local de Encaminhamento <span className="text-red-500">*</span>
                </label>
                <UnidadeNotificadoraField
                  value={formData.localEncaminhamento}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      localEncaminhamento: value,
                    }))
                  }
                  label=""
                  placeholder="Buscar estabelecimento para encaminhamento..."
                  isForEncaminhamento={true}
                  hasError={!!errors.localEncaminhamento}
                  className={`${errors.localEncaminhamento ? "border-red-500 bg-red-50" : ""}`}
                />
                {errors.localEncaminhamento && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.localEncaminhamento}
                  </p>
                )}
                {/* ID selecionado */}
                <p className="mt-1 text-xs text-blue-400">
                  ID selecionado: {formData.localEncaminhamento || "Nenhum"}
                </p>
              </div>
            )}

            {/* Local de Encaminhamento para Óbito - Dropdown com dados do banco */}
            {isTipoEncerramentoFunc("óbito") && (
              <div>
                <LocalEncaminhamentoSelect
                  value={formData.localEncaminhamento}
                  onChange={handleChange}
                  hasError={!!errors.localEncaminhamento}
                />
                {errors.localEncaminhamento && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.localEncaminhamento}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseClosureSection;