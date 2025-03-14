import React from "react";
import { Building2 } from "lucide-react";
import SectionTitle from "./SectionTitle";

export interface OptionItem {
  id?: number;
  idtipo_qualificacao?: number;
  idtipo_habilitacao?: number;
  idtipo_estabelecimento?: number;
  tipo_estabelecimento_idtipo_estabelecimento?: number;
  descricao: string;
}

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

interface InformacoesComplementaresProps {
  estabelecimento: EstabelecimentoData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  tiposEstabelecimento: OptionItem[];
  tiposNatureza: OptionItem[];
  tiposTurno: OptionItem[];
}

const ComplementaryInformations: React.FC<InformacoesComplementaresProps> = ({
  estabelecimento,
  handleInputChange,
  tiposEstabelecimento,
  tiposNatureza,
  tiposTurno,
}) => {

  // Adicione o log aqui
  console.log('Valores no componente:', {
    tipoEstabelecimentoId: estabelecimento.tipoEstabelecimentoId,
    tipoNaturezaId: estabelecimento.tipoNaturezaId,
    tipoTurnoId: estabelecimento.tipoTurnoId,
    tiposEstabelecimento: tiposEstabelecimento.map(t => t.id)
  });
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 transition-shadow hover:shadow-md">
      <SectionTitle
        icon={<Building2 className="h-5 w-5 text-blue-500" />}
        title="Informações Complementares"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">
            Tipo de Estabelecimento <span className="text-red-500">*</span>
          </label>
          <select
            name="tipoEstabelecimentoId"
            required
            value={estabelecimento.tipoEstabelecimentoId?.toString() || ""}
            onChange={(e) => {
              handleInputChange(e);
            }}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="">Selecione uma opção</option>
            {tiposEstabelecimento.map((item) => (
              <option key={item.id} value={item.id}>
                {item.descricao}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">
            Natureza <span className="text-red-500">*</span>
          </label>
          <select
            name="tipoNaturezaId"
            required
            value={String(estabelecimento.tipoNaturezaId || "")}
            onChange={(e) => {
              handleInputChange(e);
            }}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="">Selecione uma opção</option>
            {tiposNatureza.map((item) => (
              <option key={item.id} value={item.id}>
                {item.descricao}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="ativo"
            required
            value={estabelecimento.ativo}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="S">Ativo</option>
            <option value="N">Inativo</option>
          </select>
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">
            Turno de Atendimento <span className="text-red-500">*</span>
          </label>
          <select
            name="tipoTurnoId"
            required
            value={String(estabelecimento.tipoTurnoId || "")}
            onChange={(e) => {
              handleInputChange(e);
            }}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="">Selecione uma opção</option>
            {tiposTurno.map((item) => (
              <option key={item.id} value={item.id}>
                {item.descricao}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ComplementaryInformations;