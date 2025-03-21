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
    dataOcorrencia: string;
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
  
  // Interface para opções de seleção
  export interface SelectOption {
    value: string;
    label: string;
  }
  
  // Interface para estado de seções expandidas
  export interface ExpandedSections {
    dadosGerais: boolean;
    procedencia: boolean;
    identificacao: boolean;
    atendimento: boolean;
    unidadeNotificadora: boolean;
    encerramento: boolean;
  }
  
  // Tipos de eventos para o formulário
  export type FormChangeEvent = React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >;