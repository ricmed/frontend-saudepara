import { Paciente } from "@/services/PacienteService";

// Interface FormData
export interface FormData {
  // Seção 1: Dados Gerais
  evento: string;
  publicoAtendido: string;

  // Seção 2: Procedência do indivíduo
  residenteBelem: string;
  bairro: string;
  municipio: string;
  uf: string;
  paisProcedencia: string;
  localHospedagem: string;
  contatoLocal: string;

  // Seção 3: Identificação do indivíduo
  paciente: string;
  pacienteId?: number;
  nomeMae: string;
  dataNascimento: string;
  idade: string;
  idadeMeses: string; 
  idadeUnidade: 'anos' | 'meses'; // <-- CAMPO ADICIONADO AQUI
  cpf: string;
  identidadeGenero: string;
  gestante: string;
  raca: string;
  escolaridade: string;
  profissao: string;
  profissaoSearch?: string;
  showProfissaoOptions?: boolean;
  ddi: string;
  contatoTelefonico: string;

  // Seção 4: Informações do atendimento
  tipoAtendimento: string;
  sinaisESintomas: string[];
  dataInicioSintomas: string;
  observacaoSintomas: string;
  hipoteseDiagnostica: string[];
  observacaoHipotese: string;
  tipoTrauma: string[];
  observacaoTrauma: string;
  relacionadoSurto: string;
  observacaoIncidente: string;

  // Seção 5: Informações da unidade notificadora
  dataAtendimento: string;
  unidadeNotificadora: string;
  nomeNotificador: string;
  contatoNotificador: string;

  // Seção 6: Encerramento do Caso
  dataEncerramento: string;
  tipoEncerramento: string;
  localEncaminhamento: string;
}

// Option interfaces for select fields
export interface OptionType {
  id: string | number;
  descricao: string;
}

export interface EventoOption {
  idtipo_evento: number;
  descricao: string;
}

export interface PublicoOption {
  idtipo_publico: number;
  descricao: string;
}

export interface PaisOption {
  idtipo_pais: number;
  descricao: string;
}

export interface EstadoOption {
  idtipo_estado: number;
  descricao: string;
}

export interface MunicipioOption {
  idtipo_municipio: number;
  descricao: string;
}

export interface BairroOption {
  idtipo_bairro: number;
  descricao: string;
}

export interface GeneroOption {
  idtipo_genero: number;
  descricao: string;
}

export interface RacaOption {
  idtipo_raca: number;
  descricao: string;
}

export interface EscolaridadeOption {
  idtipo_escolaridade: number;
  descricao: string;
}

export interface AtendimentoOption {
  idtipo_atendimento: number;
  descricao: string;
}

export interface SintomaOption {
  idtipo_sintoma: number;
  descricao: string;
}

export interface HipoteseDiagOption {
  idtipo_hipotese_diag: number;
  descricao: string;
}

export interface TraumaOption {
  idtipo_trauma: number;
  descricao: string;
}

export interface EstabelecimentoOption {
  idestabelecimento: number;
  descricao: string;
  nome: string;
}

export interface EncerramentoOption {
  idtipo_encerramento: number;
  descricao: string;
}

// Export types for form props
export interface FormSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleCheckboxChange?: (field: keyof FormData, value: string) => void;
  handleContatoLocalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isExpanded: boolean;
  toggleSection: () => void;
  isLoadingMunicipios: boolean;
  ufError?: string;
  paisOptions: PaisOption[];
  handleValidationError: (name: string, error: string | null) => void;
}

export interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  options?: { value: string | number; label: string }[];
  maxLength?: number;
}

export interface NotificationFormProps {
  isEditMode?: boolean;
  id?: string;
}