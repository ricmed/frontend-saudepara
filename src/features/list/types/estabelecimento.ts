export interface Estabelecimento {
  idestabelecimento: number;
  codigo_unidade: string;
  nome?: string;
  cnpj?: string;
  cnes?: string;
  cidade: string;
  tipo_municipio_idtipo_municipio?: number;  // 🆕 Campo de município
  logradouro: string;
  bairro: string;
  numero: string;
  latitude: string;
  longitude: string;
  ativo: string;
  tipo_estabelecimento_idtipo_estabelecimento: number;
  tipo_natureza_idtipo_natureza: number;
  tipo_turno_idtipo_turno: number;
  tipo_estabelecimento_descricao?: string;
  tipo_natureza_descricao?: string;
  tipo_turno_descricao?: string;
  
  // Relação com município (incluindo estado)
  tipo_municipio?: {
    idtipo_municipio: number;
    descricao: string;
    tipo_estado?: {
      idtipo_estado: number;
      descricao: string;
    };
  };
  
  // Propriedades para compatibilidade com o frontend
  habilitacoes?: Array<{
    tipo_habilitacao_idtipo_habilitacao: number;
    descricao: string;
  }>;
  qualificacoes?: number[];
  
  // Propriedades para integração com o Prisma
  estabelecimento_has_tipo_habilitacao?: Array<{
    tipo_habilitacao_idtipo_habilitacao: number;
    descricao?: string;
  }>;
  estabelecimento_has_tipo_qualificacao?: Array<{
    tipo_qualificacao_idtipo_qualificacao: number;
    descricao?: string;
  }>;
}

export interface PaginationMeta {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface ColumnDefinition {
  key: keyof Estabelecimento;
  label: string;
}

export interface SearchParams {
  field: "all" | "nome" | "cnpj" | "cnes" | "cidade" | "bairro" | "ativo" | "natureza" | "habilitacoes" | "qualificacoes";
  term: string;
}

export const allColumns: ColumnDefinition[] = [
  { key: "codigo_unidade", label: "Código Unidade" },
  { key: "nome", label: "Nome" },
  { key: "cnes", label: "CNES" },
  { key: "cnpj", label: "CNPJ" },
  { key: "cidade", label: "Cidade" },
  { key: "bairro", label: "Bairro" },
  { key: "tipo_natureza_descricao", label: "Natureza" },
  { key: "ativo", label: "Ativo" },
  { key: "habilitacoes", label: "Habilitações" },
  { key: "qualificacoes", label: "Qualificações" },
];