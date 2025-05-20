// src/features/notificationForms/types/index.ts
export interface Notificacao {
    // Campos formatados retornados pela API
    id: number;
    paciente: string;
    tipoAtendimento: string;
    tipoEvento: string;
    tipoEncerramento: string;
  
    // Campo que contém todos os dados originais detalhados
    original?: {
      idnotificacao: number;
      data_atendimento?: string;
      paciente: {
        idpaciente: number;
        nome: string;
      };
      tipo_evento: {
        idtipo_evento: number;
        descricao: string;
      };
      tipo_atendimento: {
        idtipo_atendimento: number;
        descricao: string;
      };
      tipo_encerramento: {
        idtipo_encerramento: number;
        descricao: string;
      };
      estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento?: {
        idestabelecimento: number;
        nome: string;
      };
    };
  
    [key: string]: any; // Para permitir outras propriedades
  }
  
  export interface PaginationMeta {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  }
  
  export interface SearchParams {
    term: string;
    field: "all" | "paciente" | "evento" | "atendimento" | "encerramento";
  }
  
  export interface ColumnDefinition {
    key: string;
    label: string;
    sortable?: boolean;
  }
  
  // Colunas disponíveis para exibição
  export const allColumns: ColumnDefinition[] = [
    { key: "paciente", label: "Paciente", sortable: true },
    { key: "tipo_evento", label: "Evento", sortable: true },
    { key: "data_atendimento", label: "Data Atendimento", sortable: true },
    { key: "tipo_atendimento", label: "Tipo Atendimento", sortable: false },
    { key: "tipo_encerramento", label: "Tipo Encerramento", sortable: false },
    {
      key: "unidade_notificadora",
      label: "Unidade Notificadora",
      sortable: false,
    },
  ];
  
  // Campos de busca disponíveis para a dropdown
  export const searchFields: { value: SearchParams['field']; label: string }[] = [
    { value: "all", label: "Todos os campos" },
    { value: "paciente", label: "Paciente" },
    { value: "evento", label: "Evento" },
    { value: "atendimento", label: "Tipo Atendimento" },
    { value: "encerramento", label: "Tipo Encerramento" },
  ];
  
  export interface ExportOptions {
    eventoOptions: any[];
    publicoOptions: any[];
    paisOptions: any[];
    estadoOptions: any[];
    municipioOptions: any[];
    bairroOptions: any[];
    cboOptions: any[];
    generoOptions: any[];
    racaOptions: any[];
    escolaridadeOptions: any[];
    atendimentoOptions: any[];
    sintomaOptions: any[];
    hipoteseDiagOptions: any[];
    traumaOptions: any[];
    estabelecimentoOptions: any[];
    encerramentoOptions: any[];
  }

  export type { FormSectionProps } from './index2';