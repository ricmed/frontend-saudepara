import React from "react";
import { Building2 } from "lucide-react";
import FormField from "./FormField";
import SectionTitle from "./SectionTitle";
import { FIELD_LENGTHS } from "@/features/forms/utils/validations";

// 🎭 FUNÇÃO DE MÁSCARA PARA CNPJ
const formatCNPJ = (value: string): string => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara: XX.XXX.XXX/XXXX-XX
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }
};

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

interface DadosPrincipaisProps {
  estabelecimento: EstabelecimentoData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  fieldErrors: FieldErrors;
}

const PrimaryData: React.FC<DadosPrincipaisProps> = ({
  estabelecimento,
  handleInputChange,
  fieldErrors,
}) => {
  // 🎭 Handler especial para CNPJ com máscara
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // Verifica se é um input (tem propriedade value)
    if ('value' in e.target) {
      const formatted = formatCNPJ(e.target.value);
      
      // Criar evento sintético com o valor formatado
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
          name: 'cnpj'
        }
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
      
      handleInputChange(syntheticEvent);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 transition-shadow hover:shadow-md">
      <SectionTitle
        icon={<Building2 className="h-5 w-5 text-blue-500" />}
        title="Dados Principais"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormField
          label="Código da Unidade"
          name="codigo_unidade"
          maxLength={FIELD_LENGTHS.CODIGO_UNIDADE}
          placeholder="Ex.: 12345"
          value={estabelecimento.codigo_unidade}
          onChange={handleInputChange}
          error={fieldErrors.codigo_unidade}
        />
        <FormField
          label="Nome do Estabelecimento"
          name="nome"
          required
          maxLength={FIELD_LENGTHS.NOME}
          placeholder="Ex.: Hospital Geral"
          value={estabelecimento.nome}
          onChange={handleInputChange}
          error={fieldErrors.nome}
        />
        <FormField
          label="CNES"
          name="cnes"
          maxLength={FIELD_LENGTHS.CNES}
          placeholder="Ex.: 1234567"
          value={estabelecimento.cnes}
          onChange={handleInputChange}
          error={fieldErrors.cnes}
        />
        <FormField
          label="CNPJ"
          name="cnpj"
          maxLength={18} // Tamanho com máscara: XX.XXX.XXX/XXXX-XX
          placeholder="00.000.000/0000-00"
          value={estabelecimento.cnpj}
          onChange={handleCNPJChange}
          error={fieldErrors.cnpj}
        />
      </div>
    </div>
  );
};

export default PrimaryData;