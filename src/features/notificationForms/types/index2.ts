// types/index2.ts - Versão atualizada com timezone e campos de auditoria

// Interface para representar um arquivo no formulário
export interface ArquivoFormulario {
  id?: string; // ID temporário para arquivos novos, ou ID real para arquivos existentes
  file?: File; // Objeto File para arquivos novos (upload)
  nome: string; // Nome original do arquivo
  tamanho: number; // Tamanho em bytes
  tipo: string; // MIME type
  url?: string; // URL para download (apenas para arquivos já salvos)
  isExisting?: boolean; // Flag para identificar se é um arquivo já existente
  status?: 'pending' | 'uploading' | 'uploaded' | 'error'; // Status do upload
  error?: string; // Mensagem de erro se houver
}

// Configuração de limites para upload
export interface UploadConfig {
  maxFileSize: number; // Tamanho máximo por arquivo (em bytes)
  maxTotalSize: number; // Tamanho máximo total (em bytes)  
  maxFiles: number; // Número máximo de arquivos
  allowedTypes: string[]; // Tipos MIME permitidos
}

// Configuração padrão
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB por arquivo
  maxTotalSize: 50 * 1024 * 1024, // 50MB total
  maxFiles: 10, // Máximo 10 arquivos
  allowedTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/plain', // .txt
    'application/rtf' // .rtf
  ]
};

// Helper para validar tipos de arquivo
export const getFileTypeInfo = (mimeType: string) => {
  const typeMap: Record<string, { icon: string; color: string; label: string }> = {
    'application/pdf': { icon: '📄', color: 'text-red-600', label: 'PDF' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', color: 'text-blue-600', label: 'Word' },
    'application/msword': { icon: '📝', color: 'text-blue-600', label: 'Word' },
    'image/png': { icon: '🖼️', color: 'text-green-600', label: 'PNG' },
    'image/jpeg': { icon: '🖼️', color: 'text-green-600', label: 'JPEG' },
    'image/jpg': { icon: '🖼️', color: 'text-green-600', label: 'JPEG' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', color: 'text-emerald-600', label: 'Excel' },
    'application/vnd.ms-excel': { icon: '📊', color: 'text-emerald-600', label: 'Excel' },
    'text/plain': { icon: '📃', color: 'text-gray-600', label: 'Texto' },
    'application/rtf': { icon: '📄', color: 'text-purple-600', label: 'RTF' }
  };
  
  return typeMap[mimeType] || { icon: '📎', color: 'text-gray-500', label: 'Arquivo' };
};

// Helper para formatar tamanho de arquivo
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper para validar arquivo
export const validateFile = (file: File, config: UploadConfig = DEFAULT_UPLOAD_CONFIG): { valid: boolean; error?: string } => {
  // Verificar tipo
  if (!config.allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${config.allowedTypes.map(type => getFileTypeInfo(type).label).join(', ')}`
    };
  }
  
  // Verificar tamanho
  if (file.size > config.maxFileSize) {
    return { 
      valid: false, 
      error: `Arquivo muito grande. Tamanho máximo: ${formatFileSize(config.maxFileSize)}`
    };
  }
  
  // Verificar se o nome é muito longo
  if (file.name.length > 100) {
    return { 
      valid: false, 
      error: 'Nome do arquivo muito longo (máximo 100 caracteres)'
    };
  }
  
  return { valid: true };
};

// Helper para validar total de arquivos
export const validateTotalFiles = (arquivos: ArquivoFormulario[], config: UploadConfig = DEFAULT_UPLOAD_CONFIG): { valid: boolean; error?: string } => {
  // Verificar quantidade
  if (arquivos.length > config.maxFiles) {
    return { 
      valid: false, 
      error: `Número máximo de arquivos excedido (máximo: ${config.maxFiles})`
    };
  }
  
  // Verificar tamanho total
  const totalSize = arquivos.reduce((sum, arquivo) => sum + arquivo.tamanho, 0);
  if (totalSize > config.maxTotalSize) {
    return { 
      valid: false, 
      error: `Tamanho total excedido (máximo: ${formatFileSize(config.maxTotalSize)})`
    };
  }
  
  return { valid: true };
};

export type ModoLocalidadeEvento = 'NAO_USA' | 'OPCIONAL' | 'OBRIGATORIA';

export type TipoLocalidadeEvento = 'BAIRRO' | 'COMUNIDADE' | 'RAMAL';

export type EspecialLocalidadeEvento = 'NORMAL' | 'OUTRO' | 'NAO_INFORMADO';

export interface LocalidadeEventoDTO {
  id: number;
  nome: string;
  tipo: TipoLocalidadeEvento | null;
  especial: EspecialLocalidadeEvento;
  ribeirinha: boolean;
  latitude: number | null;
  longitude: number | null;
  exibir_mapa: boolean;
  ativo: boolean;
  ordem: number | null;
}

export interface LocalidadesEventoResponse {
  data: LocalidadeEventoDTO[];
}

// Interface FormData atualizada
export interface FormData {
  // Seção 1: Dados Gerais
  evento: string;
  publicoAtendido: string;
  localidadeEvento: string;
  localidadeEventoOutro: string;
  localidadeEventoAtual?: LocalidadeEventoDTO | null;

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
  idadeUnidade: 'anos' | 'meses';
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

  // Seção 7: Arquivos Anexos
  arquivos: ArquivoFormulario[];

  // 🆕 NOVOS CAMPOS: Timezone automático
  timezone_name?: string;        // ex: "America/Belem"
  timezone_offset_minutos?: number; // ex: -180

  // 🆕 NOVOS CAMPOS: Auditoria (só para exibição)
  created_at?: string;
  updated_at?: string;
  created_by_userid?: string;    // ID do usuário que criou
  updated_by_userid?: string;    // ID do usuário que atualizou
}

// 🆕 NOVA FUNÇÃO: Detectar timezone do usuário automaticamente
export const detectUserTimezone = (): { timezone_name: string; timezone_offset_minutos: number } => {
  try {
    // Detectar timezone usando Intl API
    const timezone_name = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Calcular offset em minutos
    const now = new Date();
    const timezone_offset_minutos = -now.getTimezoneOffset(); // Inverter sinal para padrão UTC
    
    // console.log(`🌍 Timezone detectado: ${timezone_name} (${timezone_offset_minutos} min)`);
    
    return {
      timezone_name,
      timezone_offset_minutos
    };
  } catch (error) {
    console.error('Erro ao detectar timezone:', error);
    
    // Fallback para Belém/Pará (Brasil)
    return {
      timezone_name: 'America/Belem',
      timezone_offset_minutos: -180
    };
  }
};

// 🆕 NOVA FUNÇÃO: Formatar data com timezone para envio
export const formatDateWithTimezone = (
  dateString: string, 
  timezone_name?: string,
  timezone_offset_minutos?: number
): string => {
  if (!dateString) return '';
  
  // Se a data já tem timezone (formato ISO completo), manter como está
  if (dateString.includes('T') && (dateString.includes('+') || dateString.match(/-\d{2}:\d{2}$/))) {
    return dateString;
  }
  
  try {
    // Detectar se é só data (YYYY-MM-DD) ou data-hora (YYYY-MM-DD HH:mm:ss)
    let isoDate: string;
    
    if (dateString.includes(' ')) {
      // Formato: "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
      isoDate = dateString.replace(' ', 'T');
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Formato: "YYYY-MM-DD" -> "YYYY-MM-DDTHH:mm:ss" (assumindo meio-dia)
      isoDate = `${dateString}T12:00:00`;
    } else {
      // Se já tem T, manter formato
      isoDate = dateString;
    }
    
    // Adicionar timezone offset se fornecido
    if (timezone_offset_minutos !== undefined) {
      const hours = Math.floor(Math.abs(timezone_offset_minutos) / 60);
      const minutes = Math.abs(timezone_offset_minutos) % 60;
      const sign = timezone_offset_minutos >= 0 ? '+' : '-';
      const offset = `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const result = `${isoDate}${offset}`;
      console.log(`📅 Data formatada: ${dateString} -> ${result}`);
      return result;
    }
    
    // Log do timezone_name para debug
    if (timezone_name) {
      console.log(`🌍 Formatando data para timezone: ${timezone_name}`);
    }
    
    return isoDate;
    
  } catch (error) {
    console.error('Erro ao formatar data com timezone:', error);
    return dateString; // Retornar original em caso de erro
  }
};

// Rest of existing interfaces...
export interface OptionType {
  id: string | number;
  descricao: string;
}

export interface EventoOption {
  idtipo_evento: number;
  descricao: string;
  ativo?: string; // 🆕 CAMPO ADICIONADO para compatibilidade
  modo_localidade_evento: ModoLocalidadeEvento;
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