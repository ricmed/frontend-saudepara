// src/features/notificationForms/components/sections/PersonOriginSection.tsx
import React from "react";
import { Globe } from "lucide-react";
import {
  FormSectionProps,
  LocalidadeEventoDTO,
  ModoLocalidadeEvento,
} from "@/features/notificationForms/types/index2";
import SectionHeader from "../shared/SectionHeader";
import FormField from "../shared/FormField";
import LocationInput from "@/features/notificationForms/components/LocationInput";
import BairroInput from "@/features/notificationForms/components/BairroInput";
import PhoneInput from "@/features/notificationForms/components/BrazilianPhoneInput";
import LocalidadeEventoField from "./LocalidadeEventoField";
import {
  getResidentePerguntaLabel,
  usaLocalidadeEvento,
} from "@/features/notificationForms/utils/procedenciaResidencia";

interface PersonOriginSectionProps extends FormSectionProps {
  modoLocalidadeEvento?: ModoLocalidadeEvento;
  localidadeEventoOptions?: LocalidadeEventoDTO[];
  isLoadingLocalidadesEvento?: boolean;
  localidadeEventoCatalogAvailable?: boolean;
  estadoOptions?: Array<{ idtipo_estado: number; descricao: string; codigo?: string | null }>;
  municipioOptions?: Array<{
    idtipo_municipio: number;
    descricao: string;
    codigo?: string | null;
  }>;
}

const PersonOriginSection: React.FC<PersonOriginSectionProps> = ({
  formData,
  setFormData,
  errors,
  handleChange,
  isExpanded,
  toggleSection,
  isLoadingMunicipios,
  ufError,
  modoLocalidadeEvento = "NAO_USA",
  localidadeEventoOptions = [],
  isLoadingLocalidadesEvento = false,
  localidadeEventoCatalogAvailable = true,
  estadoOptions = [],
  municipioOptions = [],
}) => {
  const usaLocalidade = usaLocalidadeEvento(modoLocalidadeEvento);
  const residenteLabel = getResidentePerguntaLabel(modoLocalidadeEvento);

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
            <FormField
              label={residenteLabel}
              name="residenteBelem"
              value={formData.residenteBelem}
              onChange={(e) => {
                const newValue = e.target.value;
                handleChange(e);

                if (
                  !usaLocalidade &&
                  newValue === "2" &&
                  formData.municipio === "170"
                ) {
                  setFormData((prev) => ({
                    ...prev,
                    residenteBelem: newValue,
                    municipio: "",
                  }));
                }
              }}
              type="select"
              required
              error={errors.residenteBelem}
              options={[
                { value: "1", label: "SIM" },
                { value: "2", label: "NÃO" },
                { value: "3", label: "ESTRANGEIRO" },
              ]}
            />

            {usaLocalidade && formData.residenteBelem === "1" && (
              <LocalidadeEventoField
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                localidadeEventoOptions={localidadeEventoOptions}
                modoLocalidadeEvento={modoLocalidadeEvento}
                isLoadingLocalidadesEvento={isLoadingLocalidadesEvento}
                localidadeEventoCatalogAvailable={
                  localidadeEventoCatalogAvailable
                }
              />
            )}

            {!usaLocalidade && formData.residenteBelem === "1" && (
              <div>
                <BairroInput
                  label="Bairro"
                  value={formData.bairro}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      bairro: value,
                      tipo_bairro_idtipo_bairro: value,
                      paisProcedencia: "105",
                      uf: "15",
                      municipio: "170",
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
                    options={estadoOptions}
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
                      if (
                        !usaLocalidade &&
                        formData.residenteBelem === "2" &&
                        formData.uf === "15" &&
                        value === "170"
                      ) {
                        return;
                      }
                      setFormData((prev) => ({
                        ...prev,
                        municipio: value,
                      }));
                    }}
                    placeholder={
                      isLoadingMunicipios
                        ? "Carregando municípios..."
                        : !usaLocalidade && formData.uf === "15"
                          ? "Selecione o município (exceto Belém)"
                          : "Selecione o município"
                    }
                    disabled={!formData.uf || isLoadingMunicipios}
                    options={municipioOptions}
                    apiEndpoint="api/tipo-municipio"
                    idField="idtipo_municipio"
                    parentValue={formData.uf}
                    debug={true}
                    excludeValues={
                      !usaLocalidade &&
                      formData.residenteBelem === "2" &&
                      formData.uf === "15"
                        ? ["170"]
                        : []
                    }
                  />
                  {ufError && (
                    <p className="mt-1 text-sm text-red-500">{ufError}</p>
                  )}
                  {!usaLocalidade &&
                    formData.residenteBelem === "2" &&
                    formData.uf === "15" && (
                      <p className="mt-1 text-sm text-amber-600">
                        ⚠️ Belém não está disponível. Se a pessoa reside em
                        Belém, selecione "SIM" em "Residente em Belém?"
                      </p>
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
                    <p className="mt-1 text-sm text-red-500">
                      {errors.contatoLocal}
                    </p>
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
