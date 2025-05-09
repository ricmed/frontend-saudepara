import { FormData } from "@/features/notificationForms/components/types";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { PDFDocument } from "pdf-lib";

// Interface para os dados exportados
interface ExportData {
  [key: string]: string | number | boolean | undefined;
}

// Interface para um item de notificação da lista
interface NotificacaoItem {
  id: number;
  paciente?: string;
  dataOcorrencia?: string;
  tipoAtendimento?: string;
  tipoEvento?: string;
  tipoEncerramento?: string;
  original?: any; // O objeto original com todos os dados detalhados
}

// Interface para as opções de exportação
export interface ExportOptions {
  eventoOptions: any[];
  publicoOptions: any[];
  paisOptions: any[];
  estadoOptions: any[];
  municipioOptions: any[];
  bairroOptions: any[];
  generoOptions: any[];
  racaOptions: any[];
  escolaridadeOptions: any[];
  atendimentoOptions: any[];
  sintomaOptions: any[];
  hipoteseDiagOptions: any[];
  traumaOptions: any[];
  estabelecimentoOptions: any[];
  encerramentoOptions: any[];
  cboOptions?: any[]; // Adicionado para suportar profissões
}

// ===================================================================
// PARTE 1: UTILITÁRIOS COMPARTILHADOS
// ===================================================================

// Função auxiliar para obter rótulos a partir de IDs e opções
const getLabelFromOptions = (
  value: string | undefined,
  options: any[],
  idField: string,
  descField: string = "descricao"
): string => {
  if (!value || !options || !Array.isArray(options) || options.length === 0)
    return value || "";

  // Verificação de tipo mais segura
  const option = options.find(
    (opt) =>
      opt &&
      typeof opt === "object" &&
      idField in opt &&
      String(opt[idField]) === String(value)
  );

  // Adicione este trecho para debug
  if (!option || !(descField in option)) {
    console.warn(`Não foi possível encontrar label para valor: ${value} no campo ${idField}. Options disponíveis:`, options);
  }

  // Verificar se a propriedade existe antes de acessá-la
  return option && typeof option === "object" && descField in option
    ? String(option[descField])
    : value || "";
};

// Função universal de formatação de datas
export const formatarDataUniversal = (dateString?: string | null): string => {
  if (!dateString) return "";

  // Logs para verificar o que está acontecendo
  console.log(`Data original: ${dateString}`);

  try {
    const date = new Date(dateString);
    console.log(`Data após criação do objeto Date: ${date.toISOString()}`);

    const offset = date.getTimezoneOffset() * 60000;
    console.log(`Offset em milissegundos: ${offset}`);

    const adjustedDate = new Date(date.getTime() + offset);
    console.log(`Data após ajuste: ${adjustedDate.toISOString()}`);

    const result = adjustedDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    console.log(`Resultado final formatado: ${result}`);
    return result;
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
};

// Função para calcular idade a partir da data de nascimento
const calculateAge = (dateString: string): string => {
  try {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age.toString();
  } catch (error) {
    console.error("Erro ao calcular idade:", error);
    return "";
  }
};

// Interface para armazenar o telefone separado em DDI e número nacional
interface ProcessedPhoneNumber {
  ddi: string;
  number: string;
}

// Função auxiliar para separar o DDI do número de telefone
const extractPhoneComponents = (
  phoneNumber: string | undefined,
  formData?: any
): ProcessedPhoneNumber => {
  // Debug para ver o que está recebendo
  console.log("[EXPORT DEBUG] Entrada extractPhoneComponents:", { 
    phoneNumber, 
    formDataDDI: formData && formData['ddi'] ? formData['ddi'] : "não disponível"
  });
  
  if (!phoneNumber) {
    // Se não tiver número telefônico, verificar se há DDI disponível no formData
    if (formData && formData['ddi']) {
      console.log("[EXPORT DEBUG] Usando apenas DDI do formData:", formData['ddi']);
      return { ddi: formData['ddi'], number: "" };
    }
    return { ddi: "", number: "" };
  }
  
  // Se o número já está formatado com +, extrair DDI diretamente
  if (phoneNumber.includes('+')) {
    const parts = phoneNumber.split(' ');
    const ddi = parts[0].replace(/\+/g, '');
    const number = parts.slice(1).join(' ');
    console.log(`[EXPORT DEBUG] Número já formatado, extraiu DDI: ${ddi}, Número: ${number}`);
    return { ddi, number };
  }
  
  // PRIORIDADE: Usar DDI do formData se disponível
  if (formData && formData['ddi']) {
    console.log(`[EXPORT DEBUG] Usando DDI do formData: ${formData['ddi']}, com número: ${phoneNumber}`);
    return { ddi: formData['ddi'], number: phoneNumber };
  }
  
  // Se não tem o +, mas tem espaço, pode ser que o + tenha sido removido
  if (phoneNumber.includes(' ')) {
    const parts = phoneNumber.split(' ');
    const possibleDDI = parts[0];
    // Verificar se parece um DDI (normalmente 1-3 dígitos)
    if (/^\d{1,3}$/.test(possibleDDI)) {
      const number = parts.slice(1).join(' ');
      console.log(`[EXPORT DEBUG] Número com formato padrão DDI: ${possibleDDI}, Número: ${number}`);
      return { ddi: possibleDDI, number };
    }
  }
  
  // Último recurso: verificar se é um número brasileiro pelo DDD e tamanho
  const numericPhone = phoneNumber.replace(/\D/g, '');
  
  // Lista de DDDs válidos no Brasil
  const validDDDs = [
    "11", "12", "13", "14", "15", "16", "17", "18", "19",
    "21", "22", "24", "27", "28",
    "31", "32", "33", "34", "35", "37", "38",
    "41", "42", "43", "44", "45", "46", "47", "48", "49",
    "51", "53", "54", "55",
    "61", "62", "63", "64", "65", "66", "67", "68", "69",
    "71", "73", "74", "75", "77", "79",
    "81", "82", "83", "84", "85", "86", "87", "88", "89",
    "91", "92", "93", "94", "95", "96", "97", "98", "99"
  ];
  
  if (numericPhone.length >= 10 && numericPhone.length <= 11) {
    const possibleDDD = numericPhone.substring(0, 2);
    if (validDDDs.includes(possibleDDD)) {
      console.log(`[EXPORT DEBUG] Detectado número brasileiro, DDI: 55, Número: ${numericPhone}`);
      return { ddi: "55", number: numericPhone };
    }
  }
  
  // Sem detecção, retornar sem DDI
  console.log(`[EXPORT DEBUG] Impossível determinar DDI, retornando apenas número: ${phoneNumber}`);
  return { ddi: "", number: phoneNumber };
};

// Manter a função anterior para compatibilidade com código existente
const processPhoneNumber = (phoneNumber: string | undefined): string => {
  if (!phoneNumber) return "";

  console.log(
    "[EXPORT] Processando número telefônico para exportação:",
    phoneNumber
  );

  // Se já contém o sinal de +, significa que o DDI foi preservado corretamente
  // Neste caso, simplesmente retornamos o número como está
  if (phoneNumber.includes("+")) {
    console.log(
      "[EXPORT] Número já tem formato completo com DDI:",
      phoneNumber
    );
    return phoneNumber;
  }

  // Se não tem o +, mas tem espaço, pode ser que o + tenha sido removido
  // Alguns sistemas ou processamentos podem remover o + mas manter o formato
  if (phoneNumber.includes(" ")) {
    const parts = phoneNumber.split(" ");
    const possibleDDI = parts[0];
    // Verificar se parece um DDI (normalmente 1-3 dígitos)
    if (/^\d{1,3}$/.test(possibleDDI)) {
      const fixedFormat = `+${possibleDDI} ${parts.slice(1).join(" ")}`;
      console.log("[EXPORT] Corrigindo formato adicionando +:", fixedFormat);
      return fixedFormat;
    }
  }

  // Último recurso: verificar se é um número brasileiro pelo DDD e tamanho
  const numericPhone = phoneNumber.replace(/\D/g, "");

  // Lista de DDDs válidos no Brasil
  const validDDDs = [
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "21",
    "22",
    "24",
    "27",
    "28",
    "31",
    "32",
    "33",
    "34",
    "35",
    "37",
    "38",
    "41",
    "42",
    "43",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
    "51",
    "53",
    "54",
    "55",
    "61",
    "62",
    "63",
    "64",
    "65",
    "66",
    "67",
    "68",
    "69",
    "71",
    "73",
    "74",
    "75",
    "77",
    "79",
    "81",
    "82",
    "83",
    "84",
    "85",
    "86",
    "87",
    "88",
    "89",
    "91",
    "92",
    "93",
    "94",
    "95",
    "96",
    "97",
    "98",
    "99",
  ];

  // Verificar se o formato parece um número brasileiro (DDD válido + 8-9 dígitos)
  if (numericPhone.length >= 10 && numericPhone.length <= 11) {
    const possibleDDD = numericPhone.substring(0, 2);

    if (validDDDs.includes(possibleDDD)) {
      // Verificar o padrão completo para ter mais certeza de que é brasileiro
      // Celular: DDD + 9 dígitos
      // Fixo: DDD + 8 dígitos
      const nationalPart = numericPhone.substring(2);
      if (
        (nationalPart.length === 9 && nationalPart.startsWith("9")) ||
        nationalPart.length === 8
      ) {
        const formattedNumber = `+55 ${numericPhone}`;
        console.log(
          "[EXPORT] Identificado como telefone brasileiro, adicionando +55:",
          formattedNumber
        );
        return formattedNumber;
      }
    }
  }

  // Se não conseguimos determinar um formato específico,
  // retornar o número conforme fornecido
  console.log("[EXPORT] Mantendo formato original:", phoneNumber);
  return phoneNumber;
};

// ===================================================================
// PARTE 2: EXPORTAÇÃO DE FORMULÁRIO INDIVIDUAL
// ===================================================================

// Helper function to format form data for export
const prepareDataForExport = (
  formData: FormData,
  exportOptions?: ExportOptions
): ExportData => {
  // Convert enum values to their readable labels using options if provided
  const getPublicoAtendidoLabel = (value: string): string => {
    if (exportOptions?.publicoOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.publicoOptions,
        "idtipo_publico"
      );
    }

    const map: Record<string, string> = {
      "1": "Visitante",
      "2": "Trabalhador",
      "3": "Autoridade",
    };
    return map[value] || value;
  };

  const getResidenteBelemLabel = (value: string): string => {
    const map: Record<string, string> = {
      "1": "SIM",
      "2": "NÃO",
      "3": "ESTRANGEIRO",
    };
    return map[value] || value;
  };

  const getIdentidadeGeneroLabel = (value: string): string => {
    if (exportOptions?.generoOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.generoOptions,
        "idtipo_genero"
      );
    }

    const map: Record<string, string> = {
      "1": "Mulher cisgênero",
      "2": "Homem cisgênero",
      "3": "Mulher transgênero",
      "4": "Homem transgênero",
      "5": "Travesti",
      "6": "Não binário",
      "7": "Não se aplica",
      "9": "Ignorado",
    };
    return map[value] || value;
  };

  const getGestanteLabel = (value: string): string => {
    const map: Record<string, string> = { "1": "Sim", "2": "Não" };
    return map[value] || value;
  };

  const getRacaLabel = (value: string): string => {
    if (exportOptions?.racaOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.racaOptions,
        "idtipo_raca"
      );
    }

    const map: Record<string, string> = {
      "1": "Branca",
      "2": "Preta",
      "3": "Amarela",
      "4": "Parda",
      "5": "Indígena",
      "9": "Ignorado",
    };
    return map[value] || value;
  };

  const getEscolaridadeLabel = (value: string): string => {
    if (exportOptions?.escolaridadeOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.escolaridadeOptions,
        "idtipo_escolaridade"
      );
    }

    const map: Record<string, string> = {
      "0": "Analfabeto",
      "1": "Ensino fundamental incompleto",
      "2": "Ensino fundamental completo",
      "3": "Ensino médio incompleto",
      "4": "Ensino médio completo",
      "5": "Ensino superior incompleto",
      "8": "Ensino superior completo",
      "9": "Pós-graduado",
      "10": "Ignorado",
      "11": "Não se aplica",
    };
    return map[value] || value;
  };

  const getTipoAtendimentoLabel = (value: string): string => {
    if (exportOptions?.atendimentoOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.atendimentoOptions,
        "idtipo_atendimento"
      );
    }

    const map: Record<string, string> = {
      "1": "Clínico",
      "2": "Trauma",
      "3": "Surto",
      "4": "Múltiplas vítimas",
      "5": "Incidente QBRN",
    };
    return map[value] || value;
  };

  const getTipoEncerramentoLabel = (value: string): string => {
    if (exportOptions?.encerramentoOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.encerramentoOptions,
        "idtipo_encerramento"
      );
    }

    const map: Record<string, string> = {
      "1": "Atendido e liberado",
      "2": "Internação",
      "3": "Observação",
      "4": "Transferido",
      "5": "Óbito",
    };
    return map[value] || value;
  };

  // Get sinais e sintomas labels
  const getSintomasLabels = (values: string[]): string => {
    if (!values || values.length === 0) return "";

    if (exportOptions?.sintomaOptions) {
      return values
        .map((value) =>
          getLabelFromOptions(
            value,
            exportOptions.sintomaOptions,
            "idtipo_sintoma"
          )
        )
        .join(", ");
    }

    return values.join(", ");
  };

  // Get hipótese diagnóstica labels
  const getHipoteseDiagLabels = (values: string[]): string => {
    if (!values || values.length === 0) return "";

    if (exportOptions?.hipoteseDiagOptions) {
      return values
        .map((value) =>
          getLabelFromOptions(
            value,
            exportOptions.hipoteseDiagOptions,
            "idtipo_hipotese_diag"
          )
        )
        .join(", ");
    }

    return values.join(", ");
  };

  // Get trauma labels
  const getTraumaLabels = (values: string[]): string => {
    if (!values || values.length === 0) return "";

    if (exportOptions?.traumaOptions) {
      return values
        .map((value) =>
          getLabelFromOptions(
            value,
            exportOptions.traumaOptions,
            "idtipo_trauma"
          )
        )
        .join(", ");
    }

    return values.join(", ");
  };

  // Get evento label
  const getEventoLabel = (value: string): string => {
    if (exportOptions?.eventoOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.eventoOptions,
        "idtipo_evento"
      );
    }
    return value;
  };

  // Get pais label
  const getPaisLabel = (value: string): string => {
    if (exportOptions?.paisOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.paisOptions,
        "idtipo_pais"
      );
    }
    return value;
  };

  // Get UF label
  const getUfLabel = (value: string): string => {
    if (exportOptions?.estadoOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.estadoOptions,
        "idtipo_estado"
      );
    }
    return value;
  };

  // Get municipio label
  const getMunicipioLabel = (value: string): string => {
    if (exportOptions?.municipioOptions) {
      return getLabelFromOptions(
        value,
        exportOptions.municipioOptions,
        "idtipo_municipio"
      );
    }
    return value;
  };

  // Funções aprimoradas para campos problemáticos

  // 1. Calcular idade a partir da data de nascimento
  const getAge = (): string => {
    if (formData.idade) return formData.idade;

    if (formData.dataNascimento) {
      return calculateAge(formData.dataNascimento);
    }

    return "";
  };

  // 2. Obter status de gestante com padrão baseado no gênero
  const getGestanteText = (): string => {
    if (formData.gestante) {
      return getGestanteLabel(formData.gestante);
    }

    // Valores padrão baseados no gênero
    if (
      formData.identidadeGenero === "1" ||
      formData.identidadeGenero === "3"
    ) {
      return "Não"; // Padrão para gêneros femininos
    }

    return "Não aplicável"; // Padrão para outros gêneros
  };

  // 3. Obter texto do bairro aprimorado
  const getBairroText = (): string => {
    // Verificar se é residente em Belém
    if (
      formData.residenteBelem === "2" ||
      formData.residenteBelem === "NÃO" ||
      formData.residenteBelem === "N"
    ) {
      return "";
    }
    if (!formData.bairro) return "";

    // Se for ID e temos options
    if (
      exportOptions?.bairroOptions &&
      typeof formData.bairro === "string" &&
      /^\d+$/.test(formData.bairro)
    ) {
      return getLabelFromOptions(
        formData.bairro,
        exportOptions.bairroOptions,
        "idtipo_bairro",
        "descricao"
      );
    }

    // Se for objeto com descrição
    if (typeof formData.bairro === "object" && formData.bairro !== null) {
      const bairroObj = formData.bairro as Record<string, any>;
      if ("descricao" in bairroObj && bairroObj.descricao)
        return bairroObj.descricao;
      if ("nome" in bairroObj && bairroObj.nome) return bairroObj.nome;
    }

    // Se for string direta
    return String(formData.bairro);
  };

  // 4. Obter texto da UF aprimorado
  const getUfText = (): string => {
    if (!formData.uf) return "";

    // Se for valor já resolvido pelo getUfLabel existente
    const labelFromExisting = getUfLabel(formData.uf);
    if (labelFromExisting !== formData.uf) return labelFromExisting;

    // Se for ID e temos options
    if (
      exportOptions?.estadoOptions &&
      typeof formData.uf === "string" &&
      /^\d+$/.test(formData.uf)
    ) {
      return getLabelFromOptions(
        formData.uf,
        exportOptions.estadoOptions,
        "idtipo_estado",
        "descricao"
      );
    }

    // Se for objeto com descrição
    if (typeof formData.uf === "object" && formData.uf !== null) {
      const ufObj = formData.uf as Record<string, any>;
      if ("descricao" in ufObj && ufObj.descricao) return ufObj.descricao;
      if ("nome" in ufObj && ufObj.nome) return ufObj.nome;
    }

    // Se for string direta
    return String(formData.uf);
  };

  // 5. Obter texto do município aprimorado
  const getMunicipioText = (): string => {
    if (!formData.municipio) return "";

    // Se for valor já resolvido pelo getMunicipioLabel existente
    const labelFromExisting = getMunicipioLabel(formData.municipio);
    if (labelFromExisting !== formData.municipio) return labelFromExisting;

    // Se for ID e temos options
    if (
      exportOptions?.municipioOptions &&
      typeof formData.municipio === "string" &&
      /^\d+$/.test(formData.municipio)
    ) {
      return getLabelFromOptions(
        formData.municipio,
        exportOptions.municipioOptions,
        "idtipo_municipio",
        "descricao"
      );
    }

    // Se for objeto com descrição
    if (typeof formData.municipio === "object" && formData.municipio !== null) {
      const municipioObj = formData.municipio as Record<string, any>;
      if ("descricao" in municipioObj && municipioObj.descricao)
        return municipioObj.descricao;
      if ("nome" in municipioObj && municipioObj.nome) return municipioObj.nome;
    }

    // Se for string direta
    return String(formData.municipio);
  };

  // 6. Obter profissão aprimorada
  const getProfissaoText = (): string => {
    if (!formData.profissao) return "";

    // Se for objeto com descrição (como tipo_cbo)
    if (typeof formData.profissao === "object" && formData.profissao !== null) {
      const profissaoObj = formData.profissao as Record<string, any>;
      if ("descricao" in profissaoObj && profissaoObj.descricao)
        return profissaoObj.descricao;
      if ("nome" in profissaoObj && profissaoObj.nome) return profissaoObj.nome;

      // Se tiver ID e temos options
      if (
        "id" in profissaoObj &&
        profissaoObj.id &&
        exportOptions?.cboOptions
      ) {
        return getLabelFromOptions(
          profissaoObj.id.toString(),
          exportOptions.cboOptions,
          "idtipo_cbo",
          "descricao"
        );
      }
    }

    // Se for ID e temos options
    if (
      typeof formData.profissao === "string" &&
      /^\d+$/.test(formData.profissao) &&
      exportOptions?.cboOptions
    ) {
      return getLabelFromOptions(
        formData.profissao,
        exportOptions.cboOptions,
        "idtipo_cbo",
        "descricao"
      );
    }

    // Se for string direta
    return String(formData.profissao);
  };

  // 7. Obter unidade notificadora aprimorada
  const getUnidadeNotificadoraText = (): string => {
    if (!formData.unidadeNotificadora) return "";

    // Se for ID e temos options
    if (
      exportOptions?.estabelecimentoOptions &&
      typeof formData.unidadeNotificadora === "string" &&
      /^\d+$/.test(formData.unidadeNotificadora)
    ) {
      return getLabelFromOptions(
        formData.unidadeNotificadora,
        exportOptions.estabelecimentoOptions,
        "idestabelecimento",
        "nome"
      );
    }

    // Se for objeto com nome ou descrição
    if (
      typeof formData.unidadeNotificadora === "object" &&
      formData.unidadeNotificadora !== null
    ) {
      const notificadora = formData.unidadeNotificadora as Record<string, any>;
      if ("nome" in notificadora && notificadora.nome) return notificadora.nome;
      if ("descricao" in notificadora && notificadora.descricao)
        return notificadora.descricao;
    }

    // Se for string direta
    return String(formData.unidadeNotificadora);
  };

  // 8. Obter local de encaminhamento aprimorado
  const getLocalEncaminhamentoText = (): string => {
    if (!formData.localEncaminhamento) return "";

    // Se temos options e é um ID
    if (
      exportOptions?.estabelecimentoOptions &&
      typeof formData.localEncaminhamento === "string" &&
      /^\d+$/.test(formData.localEncaminhamento)
    ) {
      return getLabelFromOptions(
        formData.localEncaminhamento,
        exportOptions.estabelecimentoOptions,
        "idestabelecimento",
        "nome"
      );
    }

    // Se for objeto com nome ou descrição
    if (
      typeof formData.localEncaminhamento === "object" &&
      formData.localEncaminhamento !== null
    ) {
      const encaminhamento = formData.localEncaminhamento as Record<
        string,
        any
      >;
      if ("nome" in encaminhamento && encaminhamento.nome)
        return encaminhamento.nome;
      if ("descricao" in encaminhamento && encaminhamento.descricao)
        return encaminhamento.descricao;
    }

    // Se for string direta
    return String(formData.localEncaminhamento);
  };

  // Extrair DDI e número de telefone separadamente
  const contatoTelefonicoProcessado = extractPhoneComponents(formData.contatoTelefonico, formData);
  const contatoLocalProcessado = extractPhoneComponents(formData.contatoLocal, formData);
  const contatoNotificadorProcessado = extractPhoneComponents(formData.contatoNotificador, formData);

  // Return formatted data ready for export
  return {
    // Seção 1: Dados Gerais
    Evento: getEventoLabel(formData.evento),
    "Público Atendido": getPublicoAtendidoLabel(formData.publicoAtendido),

    // Seção 2: Procedência do indivíduo
    "Residente em Belém": getResidenteBelemLabel(formData.residenteBelem),
    Bairro: getBairroText(),
    Município: getMunicipioText(),
    UF: getUfText(),
    "País de Procedência": getPaisLabel(formData.paisProcedencia),
    "Local de Hospedagem": formData.localHospedagem,
    "DDI Local": contatoLocalProcessado.ddi,
    "Contato do Local": contatoLocalProcessado.number,

    // Seção 3: Identificação do indivíduo
    "Nome do Paciente": formData.paciente,
    "Nome da Mãe": formData.nomeMae,
    "Data de Nascimento": formatarDataUniversal(formData.dataNascimento),
    Idade: getAge(),
    CPF: formData.cpf,
    "Identidade de Gênero": getIdentidadeGeneroLabel(formData.identidadeGenero),
    Gestante: getGestanteText(),
    Raça: getRacaLabel(formData.raca),
    Escolaridade: getEscolaridadeLabel(formData.escolaridade),
    Profissão: getProfissaoText(),
    "DDI Paciente": contatoTelefonicoProcessado.ddi,
    "Contato Telefônico": contatoTelefonicoProcessado.number,

    // Seção 4: Informações do atendimento
    "Tipo de Atendimento": getTipoAtendimentoLabel(formData.tipoAtendimento),
    "Sinais e Sintomas": Array.isArray(formData.sinaisESintomas)
      ? getSintomasLabels(formData.sinaisESintomas)
      : "",
    "Data de Início dos Sintomas": formatarDataUniversal(
      formData.dataInicioSintomas
    ),
    "Observação dos Sintomas": formData.observacaoSintomas,
    "Hipótese Diagnóstica": Array.isArray(formData.hipoteseDiagnostica)
      ? getHipoteseDiagLabels(formData.hipoteseDiagnostica)
      : "",
    "Observação da Hipótese": formData.observacaoHipotese,
    "Tipo de Trauma": Array.isArray(formData.tipoTrauma)
      ? getTraumaLabels(formData.tipoTrauma)
      : "",
    "Data da Ocorrência": formatarDataUniversal(formData.dataOcorrencia),
    "Observação do Trauma": formData.observacaoTrauma,
    "Relacionado a Surto":
      formData.relacionadoSurto === "1"
        ? "Sim"
        : formData.relacionadoSurto === "2"
          ? "Não"
          : "",
    "Observação do Incidente": formData.observacaoIncidente,

    // Seção 5: Informações da unidade notificadora
    "Data do Atendimento": formatarDataUniversal(formData.dataAtendimento),
    "Unidade Notificadora": getUnidadeNotificadoraText(),
    "Nome do Notificador": formData.nomeNotificador,
    "DDI Notificador": contatoNotificadorProcessado.ddi,
    "Contato do Notificador": contatoNotificadorProcessado.number,

    // Seção 6: Encerramento do Caso
    "Data de Encerramento": formatarDataUniversal(formData.dataEncerramento),
    "Tipo de Encerramento": getTipoEncerramentoLabel(formData.tipoEncerramento),
    "Local de Encaminhamento": getLocalEncaminhamentoText(),
  };
};

// Generate filename with patient info and date
const generateFilename = (formData: FormData, extension: string): string => {
  const patientName = formData.paciente
    ? formData.paciente.replace(/\s+/g, "_").substring(0, 20)
    : "Paciente";
  const date = new Date().toISOString().split("T")[0];
  return `Notificacao_${patientName}_${date}.${extension}`;
};

// Export to Excel format
export const exportToExcel = (
  formData: FormData,
  exportOptions?: ExportOptions
): boolean => {
  try {
    const data = prepareDataForExport(formData, exportOptions);

    // Convert data to CSV format first (Excel can open this)
    let csvContent = "\uFEFF"; // BOM for Excel to handle UTF-8 correctly

    // Add each field as a row
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        csvContent += `${key};${value}\n`;
      }
    });

    // Create the download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateFilename(formData, "xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

// Export to CSV format
export const exportToCSV = (
  formData: FormData,
  exportOptions?: ExportOptions
): boolean => {
  try {
    const data = prepareDataForExport(formData, exportOptions);

    // Create CSV content
    let csvContent = "Campo,Valor\n";

    // Add each field as a row
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Escape quotes in values
        const escapedValue = String(value).replace(/"/g, '""');
        csvContent += `"${key}","${escapedValue}"\n`;
      }
    });

    // Create the download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateFilename(formData, "csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw error;
  }
};

// Export to Word format
export const exportToWord = (
  formData: FormData,
  exportOptions?: ExportOptions
): boolean => {
  try {
    const data = prepareDataForExport(formData, exportOptions);

    // Create HTML content for Word
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Formulário de Notificação</title>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #2563EB; text-align: center; }
          .section { margin-top: 20px; }
          .section-title { background-color: #EFF6FF; padding: 5px; color: #1E40AF; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border: 1px solid #ddd; }
          th { background-color: #f2f2f2; font-weight: bold; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Formulário de Notificação</h1>
        
        <table>
          <tr>
            <th style="width: 30%;">Campo</th>
            <th style="width: 70%;">Valor</th>
          </tr>
    `;

    // Add each field as a row
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        htmlContent += `
          <tr>
            <td>${key}</td>
            <td>${value}</td>
          </tr>
        `;
      }
    });

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    // Create the download link
    const blob = new Blob([htmlContent], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateFilename(formData, "doc");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting to Word:", error);
    throw error;
  }
};

// Função de exportação atualizada
export const exportToPDF = (
  formData: FormData,
  exportOptions?: ExportOptions
): boolean => {
  try {
    const data = prepareDataForExport(formData, exportOptions);
    const doc = new jsPDF();

    // Dimensões e configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Adicionar título do documento
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Formulário de Notificação", pageWidth / 2, 15, {
      align: "center",
    });

    let currentY = 25;

    // Definir as seções e seus campos
    const sections = [
      {
        title: "1. Dados Gerais",
        fields: ["Evento", "Público Atendido"],
      },
      {
        title: "2. Procedência do indivíduo",
        fields: [
          "Residente em Belém",
          "Bairro",
          "Município",
          "UF",
          "País de Procedência",
          "Local de Hospedagem",
          "Contato do Local",
        ],
      },
      {
        title: "3. Identificação do indivíduo",
        fields: [
          "Nome do Paciente",
          "Nome da Mãe",
          "Data de Nascimento",
          "Idade",
          "CPF",
          "Identidade de Gênero",
          "Gestante",
          "Raça",
          "Escolaridade",
          "Profissão",
          "Contato Telefônico",
        ],
      },
      {
        title: "4. Informações do atendimento",
        fields: [
          "Tipo de Atendimento",
          "Sinais e Sintomas",
          "Data de Início dos Sintomas",
          "Observação dos Sintomas",
          "Hipótese Diagnóstica",
          "Observação da Hipótese",
          "Tipo de Trauma",
          "Data da Ocorrência",
          "Observação do Trauma",
          "Relacionado a Surto",
          "Observação do Incidente",
        ],
      },
      {
        title: "5. Informações da unidade notificadora",
        fields: [
          "Data do Atendimento",
          "Unidade Notificadora",
          "Nome do Notificador",
          "Contato do Notificador",
        ],
      },
      {
        title: "6. Encerramento do Caso",
        fields: [
          "Data de Encerramento",
          "Tipo de Encerramento",
          "Local de Encaminhamento",
        ],
      },
    ];

    // Processar cada seção
    for (const section of sections) {
      // Adicionar cabeçalho da seção
      doc.setFillColor(65, 105, 225); // Royal Blue
      doc.rect(10, currentY, pageWidth - 20, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(section.title, 12, currentY + 5.5);

      currentY += 10;

      // Preparar dados para a tabela
      const tableData = section.fields
        .filter(
          (field) =>
            data[field] !== undefined &&
            data[field] !== null &&
            String(data[field]).trim() !== ""
        )
        .map((field) => [field, data[field] ?? ""]);

      if (tableData.length > 0) {
        // Usar autoTable para essa seção
        doc.autoTable({
          startY: currentY,
          body: tableData,
          theme: "plain",
          styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 70 },
            1: { cellWidth: "auto" },
          },
          didDrawPage: (_data) => {
            // Adicionar rodapé em cada página
            const pageNumber = doc.getNumberOfPages();
            const text = `Gerado em ${new Date().toLocaleDateString("pt-BR")} - Página ${pageNumber}`;

            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(text, pageWidth - 10, pageHeight - 10, { align: "right" });
          },
          margin: { left: 10, right: 10 },
        });

        // Atualizar a posição Y após a tabela
        currentY = (doc as any).lastAutoTable.finalY + 10;
      } else {
        currentY += 5; // Espaço adicional se não houver campos
      }
    }

    // Atualizar todos os rodapés com o número total de páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString("pt-BR")} - Página ${i} de ${totalPages}`,
        pageWidth - 10,
        pageHeight - 10,
        { align: "right" }
      );
    }

    // Salvar o PDF
    doc.save(generateFilename(formData, "pdf"));
    return true;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return false;
  }
};

// ===================================================================
// PARTE 3: EXPORTAÇÃO EM MASSA DE NOTIFICAÇÕES DA LISTA
// ===================================================================

// Prepara dados de um objeto notificação para exportação
const formatNotificacaoForExport = (
  notificacao: NotificacaoItem,
  options?: ExportOptions
): ExportData => {
  // Acesse o objeto original contendo todos os dados detalhados
  const original = notificacao.original || {};
  const paciente = original.paciente || {};

  // 1. Função para calcular idade
  const getAge = (): string => {
    if (paciente.idade !== undefined && paciente.idade !== null) {
      return paciente.idade.toString();
    }

    if (paciente.data_nascimento) {
      try {
        const birthDate = new Date(paciente.data_nascimento);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        return age.toString();
      } catch (error) {
        console.error("Erro ao calcular idade:", error);
      }
    }

    return "";
  };

  // 2. Obter status de gestante aprimorado
  const getGestanteText = (): string => {
    if (paciente.gestante) {
      return paciente.gestante === "S" || paciente.gestante === "1"
        ? "Sim"
        : "Não";
    }

    const generoId = paciente.tipo_genero_idtipo_genero?.toString();
    if (generoId === "1" || generoId === "3") {
      // Mulher cis ou trans
      return "Não"; // Padrão para gêneros femininos sem status definido
    }

    return "Não aplicável"; // Padrão para outros gêneros
  };

  // 3. Função para obter profissão via tipo_cbo
  const getProfissaoText = (): string => {
    const paciente = notificacao.original?.paciente || {};

    // 1. Tentar via CBO ID com options
    if (options?.cboOptions && paciente.cbo_idcbo) {
      const cboId = paciente.cbo_idcbo.toString();

      // Encontrar a opção correta com fallbacks
      const cboOption = options.cboOptions.find(
        (opt) => String(opt.id) === cboId || String(opt.idtipo_cbo) === cboId
      );

      return cboOption?.descricao || `CBO ID: ${cboId}`;
    }

    // 2. Tentar via objeto expandido do relacionamento
    if (paciente.tipo_cbo?.descricao) {
      return paciente.tipo_cbo.descricao;
    }

    // 3. Fallback para campo direto ou código
    return paciente.profissao || paciente.cbo_idcbo || "";
  };

  // 4. Função para obter bairro
  const getBairroText = (): string => {
    // Verificar se é residente em Belém
    const residenteBelem = original.residente_belem || "";

    // Se não for residente em Belém (valor "N", "2" ou "NÃO"), retornar string vazia
    if (
      residenteBelem === "N" ||
      residenteBelem === "2" ||
      residenteBelem === "NÃO"
    ) {
      return "";
    }
    if (original.tipo_bairro && original.tipo_bairro.descricao) {
      return original.tipo_bairro.descricao;
    }

    if (options?.bairroOptions && original.tipo_bairro_idtipo_bairro) {
      return getLabelFromOptions(
        original.tipo_bairro_idtipo_bairro.toString(),
        options.bairroOptions,
        "idtipo_bairro",
        "descricao"
      );
    }

    return original.bairro || "";
  };

  // 5. Função para obter UF/Estado
  const getUfText = (): string => {
    if (original.tipo_estado && original.tipo_estado.descricao) {
      return original.tipo_estado.descricao;
    }

    if (options?.estadoOptions && original.tipo_estado_idtipo_estado) {
      return getLabelFromOptions(
        original.tipo_estado_idtipo_estado.toString(),
        options.estadoOptions,
        "idtipo_estado",
        "descricao"
      );
    }

    return "";
  };

  // 6. Função para obter Município
  const getMunicipioText = (): string => {
    if (original.tipo_municipio && original.tipo_municipio.descricao) {
      return original.tipo_municipio.descricao;
    }

    if (options?.municipioOptions && original.tipo_municipio_idtipo_municipio) {
      return getLabelFromOptions(
        original.tipo_municipio_idtipo_municipio.toString(),
        options.municipioOptions,
        "idtipo_municipio",
        "descricao"
      );
    }

    return original.municipio || "";
  };

  // 7. Função para local de encaminhamento
  const getLocalEncaminhamentoText = (): string => {
    if (
      original.estabelecimento_notificacao_estabelecimento_idestabelecimento_encaminhadoToestabelecimento
    ) {
      return (
        original
          .estabelecimento_notificacao_estabelecimento_idestabelecimento_encaminhadoToestabelecimento
          .nome || ""
      );
    }

    if (
      options?.estabelecimentoOptions &&
      original.estabelecimento_idestabelecimento_encaminhado
    ) {
      return getLabelFromOptions(
        original.estabelecimento_idestabelecimento_encaminhado.toString(),
        options.estabelecimentoOptions,
        "idestabelecimento",
        "nome"
      );
    }

    return "";
  };

  // 8. Função para unidade notificadora
  const getUnidadeNotificadoraText = (): string => {
    if (
      original.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento
    ) {
      return (
        original
          .estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento
          .nome || ""
      );
    }

    if (
      options?.estabelecimentoOptions &&
      original.estabelecimento_idestabelecimento
    ) {
      return getLabelFromOptions(
        original.estabelecimento_idestabelecimento.toString(),
        options.estabelecimentoOptions,
        "idestabelecimento",
        "nome"
      );
    }

    return "";
  };

  // Buscar sintomas, hipóteses e traumas (podem estar em diferentes formatos)
  const getSintomasText = (): string => {
    const sintomasArray = original.notificacao_has_tipo_sintoma || [];

    if (options?.sintomaOptions) {
      return sintomasArray
        .map((s: any) => {
          const sintomaId =
            s.tipo_sintoma_idtipo_sintoma ||
            (s.tipo_sintoma && s.tipo_sintoma.idtipo_sintoma);
          return getLabelFromOptions(
            sintomaId?.toString(),
            options.sintomaOptions,
            "idtipo_sintoma"
          );
        })
        .filter(Boolean)
        .join(", ");
    }

    return "";
  };

  // Obter hipótese diagnóstica aprimorada
  const getHipoteseText = (): string => {
    if (!original.tipo_hipotese_diag_idtipo_hipotese_diag) return "";

    // Tenta obter através do objeto relacionado
    if (original.tipo_hipotese_diag && original.tipo_hipotese_diag.descricao) {
      return original.tipo_hipotese_diag.descricao;
    }

    if (options?.hipoteseDiagOptions) {
      return getLabelFromOptions(
        original.tipo_hipotese_diag_idtipo_hipotese_diag?.toString(),
        options.hipoteseDiagOptions,
        "idtipo_hipotese_diag"
      );
    }

    return original.tipo_hipotese_diag_idtipo_hipotese_diag?.toString() || "";
  };

  // Obter tipo de trauma aprimorado
  const getTraumaText = (): string => {
    if (!original.tipo_trauma_idtipo_trauma) return "";

    // Tenta obter através do objeto relacionado
    if (original.tipo_trauma && original.tipo_trauma.descricao) {
      return original.tipo_trauma.descricao;
    }

    if (options?.traumaOptions) {
      return getLabelFromOptions(
        original.tipo_trauma_idtipo_trauma?.toString(),
        options.traumaOptions,
        "idtipo_trauma"
      );
    }

    return original.tipo_trauma_idtipo_trauma?.toString() || "";
  };

  // Função para obter valor de residente em Belém
  const getResidenteText = (): string => {
    const map: Record<string, string> = {
      S: "SIM",
      "1": "SIM",
      N: "NÃO",
      "2": "NÃO",
      "3": "ESTRANGEIRO",
    };
    return map[original.residente_belem] || original.residente_belem || "";
  };

  // Formato para surto
  const getSurtoText = (): string => {
    return original.surto === "S" || original.surto === "1" ? "Sim" : "Não";
  };

  // Extrair DDI e número de telefone separadamente para cada contato
  const contatoPacienteProcessado = extractPhoneComponents(paciente.contato, { ddi: paciente.ddi });
  const contatoLocalProcessado = extractPhoneComponents(original.contato_local_hospedagem, original);
  const contatoNotificadorProcessado = extractPhoneComponents(original.contato_notificador, original);

  // Construir objeto com todos os dados formatados
  return {
    // Dados Gerais
    Evento: getLabelFromOptions(
      original.tipo_evento_idtipo_evento?.toString(),
      options?.eventoOptions || [],
      "idtipo_evento"
    ),
    "Público Atendido": getLabelFromOptions(
      original.tipo_publico_idtipo_publico?.toString(),
      options?.publicoOptions || [],
      "idtipo_publico"
    ),

    // Procedência do indivíduo
    "Residente em Belém": getResidenteText(),
    "País de Procedência": getLabelFromOptions(
      original.tipo_pais_idtipo_pais?.toString(),
      options?.paisOptions || [],
      "idtipo_pais"
    ),
    UF: getUfText(), // Usando a função aprimorada
    Município: getMunicipioText(), // Usando a função aprimorada
    Bairro: getBairroText(), // Usando a função aprimorada
    "Local de Hospedagem": original.local_hospedagem || "",
    "DDI Local": contatoLocalProcessado.ddi,
    "Contato do Local": contatoLocalProcessado.number,

    // Identificação do indivíduo
    "Nome do Paciente": paciente.nome || "",
    "Nome da Mãe": paciente.nome_mae || "",
    "Data de Nascimento": formatarDataUniversal(paciente.data_nascimento),
    Idade: getAge(), // Usando a função aprimorada
    CPF: paciente.cpf || "",
    "Identidade de Gênero": getLabelFromOptions(
      paciente.tipo_genero_idtipo_genero?.toString(),
      options?.generoOptions || [],
      "idtipo_genero"
    ),
    Gestante: getGestanteText(), // Usando a função aprimorada
    Raça: getLabelFromOptions(
      paciente.tipo_raca_idtipo_raca?.toString(),
      options?.racaOptions || [],
      "idtipo_raca"
    ),
    Escolaridade: getLabelFromOptions(
      paciente.escolaridade_idescolaridade?.toString(),
      options?.escolaridadeOptions || [],
      "idtipo_escolaridade"
    ),
    Profissão: getProfissaoText(), // Usando a função aprimorada
    "DDI Paciente": contatoPacienteProcessado.ddi,
    "Contato Telefônico": contatoPacienteProcessado.number,

    // Informações do atendimento
    "Tipo de Atendimento": getLabelFromOptions(
      original.tipo_atendimento_idtipo_atendimento?.toString(),
      options?.atendimentoOptions || [],
      "idtipo_atendimento"
    ),
    "Sinais e Sintomas": getSintomasText(),
    "Data de Início dos Sintomas": formatarDataUniversal(
      original.data_inicio_sintomas
    ),
    "Observação dos Sintomas": original.observacao_sintomas || "",
    "Hipótese Diagnóstica": getHipoteseText(),
    "Observação da Hipótese":
      original.observacao_hiposete || original.observacao_hipotese || "",
    "Tipo de Trauma": getTraumaText(),
    "Data da Ocorrência": formatarDataUniversal(original.data_ocorrencia),
    "Observação do Trauma": original.observacao_trauma || "",
    "Relacionado a Surto": getSurtoText(),
    "Observação do Incidente":
      original.observavao_incidente || original.observacao_incidente || "",

    // Informações da unidade notificadora
    "Data do Atendimento": formatarDataUniversal(original.data_atendimento),
    "Unidade Notificadora": getUnidadeNotificadoraText(), // Usando a função aprimorada
    "Nome do Notificador": original.nome_notificador || "",
    "DDI Notificador": contatoNotificadorProcessado.ddi,
    "Contato do Notificador": contatoNotificadorProcessado.number,

    // Encerramento do Caso
    "Data de Encerramento": formatarDataUniversal(original.data_encerramento),
    "Tipo de Encerramento": getLabelFromOptions(
      original.tipo_encerramento_idtipo_encerramento?.toString(),
      options?.encerramentoOptions || [],
      "idtipo_encerramento"
    ),
    "Local de Encaminhamento": getLocalEncaminhamentoText(), // Usando a função aprimorada
  };
};

// ===================================================================
// PARTE 4: FUNÇÕES DE EXPORTAÇÃO EM MASSA
// ===================================================================

// Exportar lista para Excel
export const exportListToExcel = (
  notificacoes: NotificacaoItem[],
  exportOptions?: ExportOptions
): void => {
  try {
    if (!notificacoes || notificacoes.length === 0) {
      console.warn("Não há dados para exportar");
      return;
    }

    // Formatar dados para Excel
    const formattedData = notificacoes.map((item) =>
      formatNotificacaoForExport(item, exportOptions)
    );

    // Criar planilha Excel usando biblioteca XLSX
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Ajustar largura das colunas
    const columnsWidth = [
      { wch: 20 }, // Evento
      { wch: 15 }, // Público Atendido
      { wch: 15 }, // Residente em Belém
      { wch: 20 }, // País de Procedência
      { wch: 10 }, // UF
      { wch: 20 }, // Município
      { wch: 20 }, // Bairro
      { wch: 30 }, // Local de Hospedagem
      { wch: 15 }, // Contato do Local
      { wch: 40 }, // Nome do Paciente
      { wch: 40 }, // Nome da Mãe
      { wch: 15 }, // Data de Nascimento
      { wch: 8 }, // Idade
      { wch: 15 }, // CPF
      { wch: 20 }, // Identidade de Gênero
      { wch: 10 }, // Gestante
      { wch: 15 }, // Raça
      { wch: 25 }, // Escolaridade
      { wch: 25 }, // Profissão
      { wch: 15 }, // Contato Telefônico
      { wch: 20 }, // Tipo de Atendimento
      { wch: 60 }, // Sinais e Sintomas
      { wch: 15 }, // Data de Início dos Sintomas
      { wch: 40 }, // Observação dos Sintomas
      { wch: 30 }, // Hipótese Diagnóstica
      { wch: 40 }, // Observação da Hipótese
      { wch: 30 }, // Tipo de Trauma
      { wch: 15 }, // Data da Ocorrência
      { wch: 40 }, // Observação do Trauma
      { wch: 10 }, // Relacionado a Surto
      { wch: 40 }, // Observação do Incidente
      { wch: 15 }, // Data do Atendimento
      { wch: 30 }, // Unidade Notificadora
      { wch: 30 }, // Nome do Notificador
      { wch: 15 }, // Contato do Notificador
      { wch: 15 }, // Data de Encerramento
      { wch: 20 }, // Tipo de Encerramento
      { wch: 30 }, // Local de Encaminhamento
    ];

    worksheet["!cols"] = columnsWidth;

    // Ajustar formato de datas
    const dateFields = [
      "Data de Nascimento",
      "Data de Início dos Sintomas",
      "Data da Ocorrência",
      "Data do Atendimento",
      "Data de Encerramento",
    ];
    const header = Object.keys(formattedData[0] || {});
    for (let rowIdx = 1; rowIdx <= formattedData.length; rowIdx++) {
      for (let colIdx = 0; colIdx < header.length; colIdx++) {
        const field = header[colIdx];
        if (dateFields.includes(field)) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
          const cell = worksheet[cellRef];
          if (cell && cell.v) {
            // Aplicar formato de data diretamente sem criar objetos Date
            cell.t = "s"; // Manter como string
            cell.z = "dd/mm/yyyy"; // Formato visual
          }
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Notificações");

    // Nome do arquivo com data atual
    const currentDate = new Date().toISOString().split("T")[0];
    const fileName = `notificacoes_lista_${currentDate}.xlsx`;

    // Exportar o arquivo
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error("Erro ao exportar lista para Excel:", error);
    throw error;
  }
};

// Exportar lista para CSV
export const exportListToCSV = (
  notificacoes: NotificacaoItem[],
  exportOptions?: ExportOptions
): void => {
  try {
    if (!notificacoes || notificacoes.length === 0) {
      console.warn("Não há dados para exportar");
      return;
    }

    // Formatar dados para CSV
    const formattedData = notificacoes.map((item) =>
      formatNotificacaoForExport(item, exportOptions)
    );

    // Preparar cabeçalho com BOM para suportar acentos em Excel
    const csvHeader = "\uFEFF" + Object.keys(formattedData[0]).join(";") + "\n";

    // Função para escapar valores para CSV
    const escapeCSV = (
      value: string | number | boolean | undefined | null
    ): string => {
      if (value === undefined || value === null) return "";
      const str = String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    // Gerar conteúdo CSV
    let csvContent = csvHeader;
    formattedData.forEach((row) => {
      const values = Object.values(row)
        .map((val) => escapeCSV(val))
        .join(";");
      csvContent += values + "\n";
    });

    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const currentDate = new Date().toISOString().split("T")[0];
    const fileName = `notificacoes_lista_${currentDate}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // Limpar
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Erro ao exportar lista para CSV:", error);
    throw error;
  }
};

// Exportar lista para PDF (tabela em paisagem + fichas em retrato)
export const exportListToPDF = (
  notificacoes: NotificacaoItem[],
  exportOptions?: ExportOptions
): void => {
  try {
    if (!notificacoes || notificacoes.length === 0) {
      console.warn("Não há dados para exportar");
      return;
    }

    // Formatar dados para PDF
    const formattedData = notificacoes.map((item) =>
      formatNotificacaoForExport(item, exportOptions)
    );

    // Criar dois documentos separados com orientações diferentes
    // 1. Documento para tabela resumida (paisagem)
    const tabelaDoc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // 2. Documento para fichas detalhadas (retrato)
    const fichasDoc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // PARTE 1: TABELA RESUMIDA EM PAISAGEM
    // Configurar título e informações do documento
    tabelaDoc.setFontSize(16);
    tabelaDoc.setTextColor(63, 81, 181); // Azul da interface
    tabelaDoc.text("Relatório de Notificações", 15, 15);

    tabelaDoc.setFontSize(10);
    tabelaDoc.setTextColor(0, 0, 0);
    tabelaDoc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
      15,
      22
    );
    tabelaDoc.text(`Total de registros: ${notificacoes.length}`, 15, 27);

    // Selecionar campos relevantes para tabela inicial (mais completa, mas legível)
    const tabelaInicialFields = [
      "Nome do Paciente",
      "Idade",
      "Tipo de Atendimento",
      "Data da Ocorrência",
      "Evento",
      "Sinais e Sintomas",
      "Tipo de Encerramento",
      "Unidade Notificadora",
    ];

    // Tabela inicial expandida com mais colunas
    tabelaDoc.autoTable({
      startY: 32,
      head: [tabelaInicialFields],
      body: formattedData.map((item) =>
        tabelaInicialFields.map((field) => {
          // Limitar tamanho de textos longos para manter a tabela legível
          const value = String(item[field] || "");
          return field === "Sinais e Sintomas" && value.length > 40
            ? value.substring(0, 37) + "..."
            : value;
        })
      ),
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Nome do Paciente
        1: { cellWidth: 10 }, // Idade
        2: { cellWidth: 25 }, // Tipo de Atendimento
        3: { cellWidth: 22 }, // Data da Ocorrência
        4: { cellWidth: 25 }, // Evento
        5: { cellWidth: 50 }, // Sinais e Sintomas
        6: { cellWidth: 25 }, // Tipo de Encerramento
        7: { cellWidth: 40 }, // Unidade Notificadora
      },
      didDrawPage: (data) => {
        // Adicionar rodapé à página da tabela
        addFooter(tabelaDoc, 1, 1 + notificacoes.length); // 1 página de tabela + N páginas de fichas
      },
    });

    // PARTE 2: FICHAS DETALHADAS EM RETRATO
    // Definir seções agrupadas para as fichas detalhadas
    const sections = [
      {
        title: "Dados Gerais",
        fields: ["Evento", "Público Atendido"],
      },
      {
        title: "Identificação do Paciente",
        fields: [
          "Nome do Paciente",
          "Nome da Mãe",
          "Data de Nascimento",
          "Idade",
          "CPF",
          "Identidade de Gênero",
          "Gestante",
          "Raça",
          "Escolaridade",
          "Profissão",
          "Contato Telefônico",
        ],
      },
      {
        title: "Procedência",
        fields: [
          "Residente em Belém",
          "País de Procedência",
          "UF",
          "Município",
          "Bairro",
          "Local de Hospedagem",
          "Contato do Local",
        ],
      },
      {
        title: "Atendimento e Sintomas",
        fields: [
          "Tipo de Atendimento",
          "Data da Ocorrência",
          "Data do Atendimento",
          "Data de Início dos Sintomas",
          "Sinais e Sintomas",
          "Observação dos Sintomas",
        ],
      },
      {
        title: "Diagnóstico",
        fields: [
          "Hipótese Diagnóstica",
          "Observação da Hipótese",
          "Tipo de Trauma",
          "Observação do Trauma",
          "Relacionado a Surto",
          "Observação do Incidente",
        ],
      },
      {
        title: "Encerramento e Notificação",
        fields: [
          "Data de Encerramento",
          "Tipo de Encerramento",
          "Local de Encaminhamento",
          "Unidade Notificadora",
          "Nome do Notificador",
          "Contato do Notificador",
        ],
      },
    ];

    // Adicionar ficha detalhada para cada notificação em páginas separadas
    formattedData.forEach((item, index) => {
      if (index > 0) {
        // Adicionar nova página para cada ficha após a primeira
        fichasDoc.addPage();
      }

      // Cabeçalho da ficha
      fichasDoc.setFontSize(14);
      fichasDoc.setTextColor(63, 81, 181);
      fichasDoc.text(`Ficha de Notificação #${index + 1}`, 15, 15);

      fichasDoc.setFontSize(12);
      fichasDoc.text(
        `Paciente: ${item["Nome do Paciente"] || "Não informado"}`,
        15,
        22
      );

      let yPos = 30;

      // Adicionar cada seção
      sections.forEach((section) => {
        // Título da seção
        fichasDoc.setFillColor(230, 230, 250); // Azul claro
        fichasDoc.rect(15, yPos, 180, 8, "F");

        fichasDoc.setFontSize(11);
        fichasDoc.setTextColor(63, 81, 181);
        fichasDoc.text(section.title, 18, yPos + 5.5);

        yPos += 10;

        // Conteúdo da seção
        const sectionData = section.fields
          .filter(
            (field) =>
              item[field] !== undefined &&
              item[field] !== null &&
              String(item[field]).trim() !== ""
          )
          .map((field) => [field, String(item[field] || "")]);

        if (sectionData.length > 0) {
          // Verificar se a próxima tabela cabe na página atual, caso contrário adicionar nova página
          if (yPos > fichasDoc.internal.pageSize.height - 40) {
            fichasDoc.addPage();
            yPos = 15;
          }

          fichasDoc.autoTable({
            startY: yPos,
            head: [], // Sem cabeçalho
            body: sectionData,
            theme: "grid",
            styles: {
              fontSize: 9,
              cellPadding: 3,
            },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 60 },
              1: { cellWidth: "auto" },
            },
            margin: { left: 15, right: 15 },
          });

          yPos = (fichasDoc as any).lastAutoTable.finalY + 10;
        }
      });

      // Adicionar rodapé para cada página de ficha
      addFooter(fichasDoc, index + 2, 1 + notificacoes.length);
    });

    // Função auxiliar para adicionar rodapé com numeração correta
    function addFooter(doc: any, pageNumber: number, totalPages: number) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Página ${pageNumber} de ${totalPages}`,
        doc.internal.pageSize.getWidth() - 15,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    }

    // Nome do arquivo
    const currentDate = new Date().toISOString().split("T")[0];
    const fileName = `notificacoes_lista_${currentDate}.pdf`;

    // ABORDAGEM 1: Usar jspdf-merger para combinar os PDFs (mais confiável)
    combineAndExportPDFs();

    // Função para combinar e exportar os PDFs usando jspdf diretamente
    async function combineAndExportPDFs() {
      try {
        // Método 1: Tentar com pdf-lib
        await mergeWithPDFLib();
      } catch (e) {
        console.error("Erro ao mesclar com PDF-lib:", e);

        // Método 2: Se falhar, tentar com jsPDF.addPage (mais básico)
        try {
          const combinedDoc = new jsPDF();

          // Remover primeira página vazia
          combinedDoc.deletePage(1);

          // Adicionar a página da tabela (em paisagem)
          const tabelaPdfOutput = tabelaDoc.output("arraybuffer");
          const tabelaPdfBlob = new Blob([tabelaPdfOutput], {
            type: "application/pdf",
          });
          const tabelaPdfUrl = URL.createObjectURL(tabelaPdfBlob);
          combinedDoc.addPage("landscape");
          combinedDoc.setPage(1);
          combinedDoc.addFileToVFS("tabela.pdf", tabelaPdfOutput.toString());

          // Adicionar as páginas das fichas (em retrato)
          const fichasPdfOutput = fichasDoc.output("arraybuffer");

          // Para cada página em fichasDoc
          const fichasPagesCount = fichasDoc.getNumberOfPages();
          for (let i = 1; i <= fichasPagesCount; i++) {
            combinedDoc.addPage("portrait");
            // Não é possível copiar o conteúdo diretamente sem bibliotecas adicionais
          }

          combinedDoc.save(fileName);
        } catch (err) {
          console.error("Erro ao tentar método alternativo de mesclagem:", err);
          // Método 3: Último recurso, salvar os dois PDFs separadamente
          fallbackSave();
        }
      }
    }

    // Função para mesclar usando pdf-lib
    async function mergeWithPDFLib() {
      // Obter os bytes dos documentos
      const tabelaBytes = tabelaDoc.output("arraybuffer");
      const fichasBytes = fichasDoc.output("arraybuffer");

      // Criar novo documento
      const mergedPdf = await PDFDocument.create();

      // Carregar documentos fonte
      const tabelaPdf = await PDFDocument.load(tabelaBytes);
      const fichasPdf = await PDFDocument.load(fichasBytes);

      // Copiar todas as páginas
      // Primeiro da tabela (em paisagem)
      const tabelaPageIndices = Array.from(
        { length: tabelaPdf.getPageCount() },
        (_, i) => i
      );
      const tabelaPages = await mergedPdf.copyPages(
        tabelaPdf,
        tabelaPageIndices
      );

      // Depois das fichas (em retrato)
      const fichasPageIndices = Array.from(
        { length: fichasPdf.getPageCount() },
        (_, i) => i
      );
      const fichasPages = await mergedPdf.copyPages(
        fichasPdf,
        fichasPageIndices
      );

      // Adicionar as páginas na ordem correta
      // Primeiro as páginas da tabela
      tabelaPages.forEach((page) => mergedPdf.addPage(page));

      // Depois as páginas das fichas
      fichasPages.forEach((page) => mergedPdf.addPage(page));

      // Salvar o documento final
      const mergedBytes = await mergedPdf.save();

      // Criar um blob e fazer o download
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Limpar
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }

    // Função alternativa caso falhe a mesclagem
    function fallbackSave() {
      console.warn(
        "Não foi possível mesclar os documentos, salvando separadamente..."
      );

      // Salvar documento principal (tabela)
      tabelaDoc.save(`tabela_${fileName}`);

      // Salvar documento de fichas
      const fichasFileName = `fichas_${fileName}`;
      fichasDoc.save(fichasFileName);

      alert(
        "Não foi possível gerar um único PDF. Foram gerados dois arquivos separados: um com a tabela resumida e outro com as fichas detalhadas."
      );
    }
  } catch (error) {
    console.error("Erro ao exportar lista para PDF:", error);
    throw error;
  }
};
