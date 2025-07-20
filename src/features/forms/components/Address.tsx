import React from "react";
import { Building2 } from "lucide-react";
import FormField from "./FormField";
import SectionTitle from "./SectionTitle";
import MiniMapa from "@/features/maps/leaflet/components/MiniMapa";
import { FIELD_LENGTHS } from "@/features/forms/utils/validations";

interface EstabelecimentoData {
  id?: number;
  codigo_unidade: string;
  nome: string;
  cnes?: string;
  cnpj?: string;
  cidade?: string;
  logradouro?: string;
  bairro?: string;
  numero?: string;
  latitude?: string;
  longitude?: string;
  tipoEstabelecimentoId: number | null;
  tipoNaturezaId: number | null;
  tipoTurnoId: number | null;
  ativo: string;
}

interface FieldErrors {
  [key: string]: string;
}

interface EnderecoProps {
  estabelecimento: EstabelecimentoData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  fieldErrors: FieldErrors;
  updateAddressFromCoordinates: (lat: number, lng: number) => void;
}

const Address: React.FC<EnderecoProps> = ({
  estabelecimento,
  handleInputChange,
  fieldErrors,
  updateAddressFromCoordinates,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 transition-shadow hover:shadow-md">
      <SectionTitle
        icon={<Building2 className="h-5 w-5 text-blue-500" />}
        title="Endereço"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <FormField
            label="Cidade"
            name="cidade"
            required
            maxLength={FIELD_LENGTHS.CIDADE}
            placeholder="Ex.: Belém"
            value={estabelecimento.cidade}
            onChange={handleInputChange}
            error={fieldErrors.cidade}
          />
          <FormField
            label="Logradouro"
            name="logradouro"
            required
            maxLength={FIELD_LENGTHS.LOGRADOURO}
            placeholder="Ex.: Avenida Presidente Vargas"
            value={estabelecimento.logradouro}
            onChange={handleInputChange}
            error={fieldErrors.logradouro}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Bairro"
              name="bairro"
              required
              maxLength={FIELD_LENGTHS.BAIRRO}
              placeholder="Ex.: Centro"
              value={estabelecimento.bairro}
              onChange={handleInputChange}
              error={fieldErrors.bairro}
            />
            <FormField
              label="Número"
              name="numero"
              required
              maxLength={FIELD_LENGTHS.NUMERO}
              placeholder="Ex.: 123"
              value={estabelecimento.numero}
              onChange={handleInputChange}
              error={fieldErrors.numero}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Latitude"
              name="latitude"
              type="text"
              placeholder="Ex.: -1.4557"
              value={estabelecimento.latitude}
              onChange={handleInputChange}
            />
            <FormField
              label="Longitude"
              name="longitude"
              type="text"
              placeholder="Ex.: -48.4902"
              value={estabelecimento.longitude}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="h-full min-h-[400px]">
          <MiniMapa
            initialLat={estabelecimento.latitude?.replace(/\s/g, "")}
            initialLng={estabelecimento.longitude?.replace(/\s/g, "")}
            onLocationSelect={(lat, lng) => {
              updateAddressFromCoordinates(lat, lng);
            }}
            className="h-full min-h-[400px] w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Address;