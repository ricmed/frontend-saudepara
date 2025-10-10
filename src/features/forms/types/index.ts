// Arquivo completo para forms/types/index.ts

export interface OptionItem {
  id?: number;
  idtipo_qualificacao?: number;
  idtipo_habilitacao?: number;
  idtipo_estabelecimento?: number;
  tipo_estabelecimento_idtipo_estabelecimento?: number;
  descricao: string;
}

export interface EstabelecimentoData {
  id?: number;
  idestabelecimento?: number; // Mantido para compatibilidade
  codigo_unidade: string;
  nome: string;
  cnes?: string;
  cnpj?: string;
  cidade?: string;
  municipioId?: number | null; // 🆕 Campo de município
  logradouro?: string;
  bairro?: string;
  numero?: string;
  latitude?: string;
  longitude?: string;
  tipoEstabelecimentoId: number | null;
  tipoNaturezaId: number | null;
  tipoTurnoId: number | null;
  tipo_estabelecimento_idtipo_estabelecimento?: number; // Original do backend
  tipo_natureza_idtipo_natureza?: number; // Original do backend
  tipo_turno_idtipo_turno?: number; // Original do backend
  tipo_municipio_idtipo_municipio?: number | null; // 🆕 Campo de município no formato backend
  ativo: string;
  habilitacoes?: number[];
  habilitacoes_selecionadas?: Array<{
    id: number;
    descricao: string;
  }>;
  qualificacoes?: number[];
  tipo_estabelecimento_descricao?: string;
  tipo_natureza_descricao?: string;
  tipo_turno_descricao?: string;
  
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

export interface FormFieldProps {
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  name?: string;
  placeholder?: string;
  maxLength?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  error?: string;
  [key: string]: any;
}

export interface Item {
  id?: number;
  idtipo_qualificacao?: number;
  idtipo_habilitacao?: number;
  tipo_habilitacao_idtipo_habilitacao?: number;
  descricao: string;
  uniqueId?: string;
}

export interface DualSelectFieldProps {
  label: string;
  sourceItems: Item[];
  targetItems: Item[];
  onChange?: (selectedItems: Item[]) => void;
  onSourceItemsChange?: (availableItems: Item[]) => void;
}

export interface FieldErrors {
  [key: string]: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface SectionProps {
  estabelecimento: EstabelecimentoData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  fieldErrors: FieldErrors;
  loading?: boolean;
}