// src/features/notificationForms/components/sections/PersonOriginSection.tsx
import React from "react";
import { Globe } from "lucide-react";
import { FormSectionProps } from "@/features/notificationForms/types";
import SectionHeader from "../shared/SectionHeader";
import FormField from "../shared/FormField";
import LocationInput from "@/features/notificationForms/components/LocationInput";
import BairroInput from "@/features/notificationForms/components/BairroInput";
import PhoneInput from "@/features/notificationForms/components/BrazilianPhoneInput";

const PersonOriginSection: React.FC<FormSectionProps> = ({
  formData,
  setFormData,
  errors,
  handleChange,
  handleContatoLocalChange,
  isExpanded,
  toggleSection,
  isLoadingMunicipios,
  ufError,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SectionHeader
        icon={<Globe className="h-5 w-5 text-green-500" />}
        title="2. Procedência do indivíduo"
        isExpanded={isExpanded}
        onToggle={toggleSection}
      />

      {isExpanded && (
        <div className="p-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Residente em Belém? */}
            <FormField
              label="Residente em Belém?"
              name="residenteBelem"
              value={formData.residenteBelem}
              onChange={handleChange}
              type="select"
              required
              error={errors.residenteBelem}
              options={[
                { value: "1", label: "SIM" },
                { value: "2", label: "NÃO" },
                { value: "3", label: "ESTRANGEIRO" },
              ]}
            />

            {/* Campos condicionais baseados na residência */}
            {formData.residenteBelem === "1" && (
              <div>
                <BairroInput
                  label="Bairro"
                  value={formData.bairro}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      bairro: value,
                      tipo_bairro_idtipo_bairro: value,
                      // ✅ AUTO-PREENCHIMENTO: Quando seleciona bairro de Belém, preencher automaticamente
                      paisProcedencia: "105", // Brasil
                      uf: "1", // Pará
                      municipio: "1", // Belém
                      // Limpar campos não aplicáveis
                      localHospedagem: "",
                      contatoLocal: "",
                    }));
                  }}
                  placeholder="Selecione o bairro"
                  disabled={false}
                />
                {errors.bairro && (
                  <p className="mt-1 text-sm text-red-500">{errors.bairro}</p>
                )}
              </div>
            )}

            {formData.residenteBelem === "2" && (
              <>
                <div>
                  {/* UF */}
                  <LocationInput
                    name="uf"
                    label="UF"
                    value={formData.uf}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        uf: value,
                        municipio: "",
                      }));
                    }}
                    placeholder="Selecione a UF"
                    disabled={false}
                    apiEndpoint="api/tipo-estado"
                    idField="idtipo_estado"
                    debug={true}
                  />
                </div>
                <div>
                  <LocationInput
                    name="municipio"
                    label="Município"
                    value={formData.municipio}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        municipio: value,
                      }));
                    }}
                    placeholder={
                      isLoadingMunicipios
                        ? "Carregando municípios..."
                        : "Selecione o município"
                    }
                    disabled={!formData.uf || isLoadingMunicipios}
                    apiEndpoint="api/tipo-municipio"
                    idField="idtipo_municipio"
                    parentValue={formData.uf}
                    debug={true}
                  />
                  {ufError && (
                    <p className="mt-1 text-sm text-red-500">{ufError}</p>
                  )}
                </div>
                <div>
                  <FormField
                    label="Local de Hospedagem"
                    name="localHospedagem"
                    value={formData.localHospedagem}
                    onChange={handleChange}
                    placeholder="Informe o nome do local de hospedagem"
                  />
                </div>
                <div>
                  <PhoneInput
                    label="Contato do Local da Hospedagem"
                    name="contatoLocal"
                    value={formData.contatoLocal}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        contatoLocal: value,
                      }));
                    }}
                    placeholder="Celular ou telefone fixo com DDD"
                  />
                </div>
              </>
            )}

            {formData.residenteBelem === "3" && (
              <>
                <div>
                  <LocationInput
                    name="paisProcedencia"
                    label="País de Procedência"
                    value={formData.paisProcedencia}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        paisProcedencia: value,
                      }));
                    }}
                    placeholder="Selecione o país"
                    disabled={false}
                    apiEndpoint="api/tipo-pais"
                    idField="idtipo_pais"
                    debug={true}
                    required={true}
                    error={errors.paisProcedencia}
                  />
                </div>
                <div>
                  <FormField
                    label="Local de Hospedagem"
                    name="localHospedagem"
                    value={formData.localHospedagem}
                    onChange={handleChange}
                    placeholder="Informe o nome do local de hospedagem"
                  />
                </div>
                <div>
                  <PhoneInput
                    label="Contato do Local da Hospedagem"
                    name="contatoLocal"
                    value={formData.contatoLocal}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        contatoLocal: value,
                      }));
                    }}
                    placeholder="Celular ou telefone fixo com DDD"
                  />
                  {errors.contatoLocal && (
                    <p className="mt-1 text-sm text-red-500">{errors.contatoLocal}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonOriginSection;
