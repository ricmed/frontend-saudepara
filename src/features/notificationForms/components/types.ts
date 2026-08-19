// types.ts - Define FormData interface and other type definitions
import type { LocalidadeEventoDTO } from '@/features/notificationForms/types/index2';

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
    nomeMae: string;
    dataNascimento: string;
    idade: string;
    cpf: string;
    identidadeGenero: string;
    gestante: string;
    raca: string;
    escolaridade: string;
    profissao: string;
    profissaoSearch?: string;
    showProfissaoOptions?: boolean;
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

    // Seção 7: Campos de Auditoria (opcionais)
    created_at?: string;
    updated_at?: string;
    created_by_userid?: string;    // 🆕 ID do usuário que criou
    updated_by_userid?: string;    // 🆕 ID do usuário que atualizou
  }
  
  // Option item type for dropdowns
  export interface OptionItem {
    value: string;
    label: string;
  }
  
  // Export format type
  export type ExportFormat = "Excel" | "Word" | "CSV" | "PDF";