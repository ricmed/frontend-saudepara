// src/features/notificationForms/components/sections/NotifierInfoSection.tsx
import React from 'react';
import { Bell } from 'lucide-react';
import { FormSectionProps } from '@/features/notificationForms/types/index2';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';
import CustomDateInput from '@/features/notificationForms/components/CustomDateInput';
import UnidadeNotificadoraField from '@/features/notificationForms/components/UnidadeNotificadoraField';
import BrazilianPhoneInput from '@/features/notificationForms/components/BrazilianPhoneInput';

const NotifierInfoSection: React.FC<FormSectionProps> = ({
  formData,
  setFormData,
  errors,
  handleChange,
  isExpanded,
  toggleSection
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SectionHeader
        icon={<Bell className="h-5 w-5 text-orange-500" />}
        title="5. Informações da unidade notificadora"
        isExpanded={isExpanded}
        onToggle={toggleSection}
      />
      
      {isExpanded && (
        <div className="p-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data do Atendimento */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Data do Atendimento
              </label>
              <CustomDateInput
                name="dataAtendimento"
                className={`w-full p-3 border ${
                  errors.dataAtendimento
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                value={formData.dataAtendimento}
                onChange={handleChange}
                data-error={errors.dataAtendimento ? "true" : "false"}
              />
              {errors.dataAtendimento && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dataAtendimento}
                </p>
              )}
            </div>

            {/* Unidade Notificadora */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Unidade Notificadora <span className="text-red-500">*</span>
              </label>
              <UnidadeNotificadoraField
                value={formData.unidadeNotificadora}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    unidadeNotificadora: value,
                  }))
                }
                label=""
                placeholder="Buscar unidade notificadora..."
                hasError={!!errors.unidadeNotificadora}
                className={`${errors.unidadeNotificadora ? "border-red-500 bg-red-50" : ""}`}
              />
              {errors.unidadeNotificadora && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.unidadeNotificadora}
                </p>
              )}
            </div>

            {/* Nome do Notificador */}
            <FormField
              label="Nome do Notificador"
              name="nomeNotificador"
              value={formData.nomeNotificador}
              onChange={handleChange}
              placeholder="Nome do notificador"
            />

            {/* Contato do Notificador */}
            <div>
              <BrazilianPhoneInput
                name="contatoNotificador"
                value={formData.contatoNotificador}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    contatoNotificador: value,
                  }))
                }
                label="Contato do Notificador"
                placeholder="Digite o número de telefone"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotifierInfoSection;