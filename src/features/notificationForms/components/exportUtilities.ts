import { FormData } from "@/features/notificationForms/components/types";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { PDFDocument } from "pdf-lib";
import { getRealCreationDate } from "@/utils/offlineIdUtils";
import { usaLocalidadeEvento } from "@/features/notificationForms/utils/procedenciaResidencia";
import type { ModoLocalidadeEvento } from "@/features/notificationForms/types/index2";
import {
  EXPORT_BAIRRO_COLUMN,
  EXPORT_LOCALIDADE_COLUMN,
  EXPORT_LOCALIDADE_OUTRO_COLUMN,
  getExportResidenteColumnLabel,
} from "@/features/notificationForms/components/exportColumns";
import {
  looksLikeNumericId,
  resolveCatalogLabel,
  resolveCboLabel,
} from "@/features/notificationForms/utils/exportCatalogLabels";

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
  localidadeEventoOptions?: any[];
  modoLocalidadeEvento?: ModoLocalidadeEvento;
}

// ===================================================================
// PARTE 1: UTILITÁRIOS COMPARTILHADOS
// ===================================================================

// Função auxiliar para obter rótulos a partir de IDs e opções
const getLabelFromOptions = (
  value: string | undefined,
  options: any[] | undefined,
  idField: string,
  descField: string = "descricao"
): string => {
  return resolveCatalogLabel(value, options, idField, descField);
};

const catalogThenMap = (
  value: string,
  options: any[] | undefined,
  idField: string,
  map: Record<string, string>,
): string => {
  if (options?.length) {
    const label = getLabelFromOptions(value, options, idField);
    if (label) return label;
  }
  if (map[value]) return map[value];
  return looksLikeNumericId(value) ? "" : value || "";
};

// Função universal de formatação de datas - 🆕 ATUALIZADA com timezone
import { detectUserTimezone } from '@/features/notificationForms/types/index2';

// 🆕 Função para formatar data de nascimento SEM timezone
// Data de nascimento é uma data "pura" e não deve sofrer ajuste de fuso horário
export const formatarDataNascimento = (dateString?: string | null): string => {
  if (!dateString) return "";

  try {
    // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
    const dateOnly = dateString.split("T")[0];
    const [year, month, day] = dateOnly.split("-");
    
    // Retornar formatado como DD/MM/YYYY
    const result = `${day}/${month}/${year}`;
    console.log(`Data de nascimento: ${dateString} -> ${result} (sem conversão de timezone)`);
    return result;
  } catch (error) {
    console.error("Erro ao formatar data de nascimento:", error);
    return "Data inválida";
  }
};

export const formatarDataUniversal = (dateString?: string | null): string => {
  if (!dateString) return "";

  console.log(`Data original: ${dateString}`);

  try {
    const date = new Date(dateString);
    console.log(`Data após criação do objeto Date: ${date.toISOString()}`);

    // 🆕 USAR timezone do usuário detectado automaticamente
    const { timezone_name } = detectUserTimezone();
    
    const result = date.toLocaleDateString("pt-BR", {
      timeZone: timezone_name,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    console.log(`Resultado final formatado com timezone (${timezone_name}): ${result}`);
    return result;
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
};

// 🆕 Função para formatar data E hora com timezone (usado para created_at e updated_at)
export const formatarDataHoraUniversal = (dateString?: string | null): string => {
  if (!dateString) return "";

  console.log(`[formatarDataHoraUniversal] Data original: ${dateString}`);

  try {
    const date = new Date(dateString);
    console.log(`[formatarDataHoraUniversal] Data após criação do objeto Date: ${date.toISOString()}`);

    // Usar timezone America/Belem como no dashboard
    const timezone_name = 'America/Belem';
    
    const result = date.toLocaleString("pt-BR", {
      timeZone: timezone_name,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    console.log(`[formatarDataHoraUniversal] Resultado final formatado com timezone (${timezone_name}): ${result}`);
    return result;
  } catch (error) {
    console.error("[formatarDataHoraUniversal] Erro ao formatar data e hora:", error);
    return "Data inválida";
  }
};

// Função para calcular idade a partir da data de nascimento
// 🆕 Atualizada para mostrar em meses/anos conforme especificação
const calculateAge = (dateString: string): string => {
  try {
    const birthDate = new Date(dateString);
    const today = new Date();
    
    // Calcular diferença em meses
    let totalMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;
    totalMonths += today.getMonth() - birthDate.getMonth();
    
    // Ajustar se o dia ainda não chegou no mês atual
    if (today.getDate() < birthDate.getDate()) {
      totalMonths--;
    }
    
    // Garantir que não seja negativo
    if (totalMonths < 0) {
      totalMonths = 0;
    }
    
    // Aplicar as regras de formatação
    if (totalMonths === 1) {
      return "1 mês";
    } else if (totalMonths >= 2 && totalMonths <= 11) {
      return `${totalMonths} meses`;
    } else if (totalMonths >= 12 && totalMonths < 24) {
      return "1 ano";
    } else if (totalMonths >= 24) {
      const years = Math.floor(totalMonths / 12);
      return years === 1 ? "1 ano" : `${years} anos`;
    } else {
      // Menos de 1 mês
      return "0 meses";
    }
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

// ===================================================================
// PARTE 2: EXPORTAÇÃO DE FORMULÁRIO INDIVIDUAL
// ===================================================================

// Helper function to format form data for export
export const prepareDataForExport = (
  formData: FormData,
  exportOptions?: ExportOptions
): ExportData => {
  // Convert enum values to their readable labels using options if provided
  const getPublicoAtendidoLabel = (value: string): string => {
    return catalogThenMap(value, exportOptions?.publicoOptions, "idtipo_publico", {
      "1": "Visitante",
      "2": "Trabalhador",
      "3": "Autoridade",
    });
  };

  const getResidenteBelemLabel = (value: string): string => {
    const map: Record<string, string> = {
      "1": "SIM",
      "2": "NÃO", 
      "3": "ESTRANGEIRO",
      "S": "SIM",          // ✅ ADICIONADO: valores do backend
      "N": "NÃO",          // ✅ ADICIONADO: valores do backend
      "E": "ESTRANGEIRO",  // ✅ ADICIONADO: valor do backend para estrangeiro
    };
    return map[value] || value;
  };

  const getIdentidadeGeneroLabel = (value: string): string => {
    return catalogThenMap(value, exportOptions?.generoOptions, "idtipo_genero", {
      "1": "Mulher cisgênero",
      "2": "Homem cisgênero",
      "3": "Mulher transgênero",
      "4": "Homem transgênero",
      "5": "Travesti",
      "6": "Não binário",
      "7": "Não se aplica",
      "9": "Ignorado",
    });
  };

  const getGestanteLabel = (value: string): string => {
    const map: Record<string, string> = {
      "1": "Sim",
      "2": "Não",
      S: "Sim",
      N: "Não",
      T1: "1º trimestre",
      T2: "2º trimestre",
      T3: "3º trimestre",
      TI: "Idade gestacional ignorada",
      NA: "Não se aplica",
      "9": "Ignorado",
    };
    return map[value] || value;
  };

  const getRacaLabel = (value: string): string => {
    return catalogThenMap(value, exportOptions?.racaOptions, "idtipo_raca", {
      "1": "Branca",
      "2": "Preta",
      "3": "Amarela",
      "4": "Parda",
      "5": "Indígena",
      "9": "Ignorado",
    });
  };

  const getEscolaridadeLabel = (value: string): string => {
    return catalogThenMap(
      value,
      exportOptions?.escolaridadeOptions,
      "idtipo_escolaridade",
      {
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
      },
    );
  };

  const getTipoAtendimentoLabel = (value: string): string => {
    return catalogThenMap(
      value,
      exportOptions?.atendimentoOptions,
      "idtipo_atendimento",
      {
        "1": "Clínico",
        "2": "Trauma",
        "3": "Surto",
        "4": "Múltiplas vítimas",
        "5": "Incidente QBRN",
      },
    );
  };

  const getTipoEncerramentoLabel = (value: string): string => {
    return catalogThenMap(
      value,
      exportOptions?.encerramentoOptions,
      "idtipo_encerramento",
      {
        "1": "Atendido e liberado",
        "2": "Internação",
        "3": "Observação",
        "4": "Transferido",
        "5": "Óbito",
      },
    );
  };

  // Get sinais e sintomas labels
  const getSintomasLabels = (values: string[]): string => {
    if (!values || values.length === 0) return "";

    return values
      .map((value) =>
        getLabelFromOptions(
          value,
          exportOptions?.sintomaOptions,
          "idtipo_sintoma"
        )
      )
      .filter(Boolean)
      .join(", ");
  };

  const getHipoteseDiagLabels = (values: string[]): string => {
    if (!values || values.length === 0) return "";

    return values
      .map((value) =>
        getLabelFromOptions(
          value,
          exportOptions?.hipoteseDiagOptions,
          "idtipo_hipotese_diag"
        )
      )
      .filter(Boolean)
      .join(", ");
  };

  const getTraumaLabels = (values: string[]): string => {
    if (!values || values.length === 0) return "";

    return values
      .map((value) =>
        getLabelFromOptions(
          value,
          exportOptions?.traumaOptions,
          "idtipo_trauma"
        )
      )
      .filter(Boolean)
      .join(", ");
  };

  const getEventoLabel = (value: string): string => {
    return getLabelFromOptions(
      value,
      exportOptions?.eventoOptions,
      "idtipo_evento"
    );
  };

  const getLocalidadeEventoText = (): string => {
    if (!formData.localidadeEvento) return "";

    if (
      formData.localidadeEventoAtual?.id.toString() ===
      formData.localidadeEvento
    ) {
      return `${formData.localidadeEventoAtual.nome}${
        formData.localidadeEventoAtual.ativo ? "" : " (inativa)"
      }`;
    }

    if (exportOptions?.localidadeEventoOptions) {
      return getLabelFromOptions(
        formData.localidadeEvento,
        exportOptions.localidadeEventoOptions,
        "id",
        "nome",
      );
    }

    return looksLikeNumericId(formData.localidadeEvento)
      ? ""
      : formData.localidadeEvento;
  };

  const isLocalidadeEventoOutro = (): boolean => {
    const selected =
      exportOptions?.localidadeEventoOptions?.find(
        option => String(option.id) === String(formData.localidadeEvento),
      ) ?? formData.localidadeEventoAtual;

    return selected?.especial === "OUTRO";
  };

  // Get pais label
  const getPaisLabel = (value: string): string => {
    return getLabelFromOptions(
      value,
      exportOptions?.paisOptions,
      "idtipo_pais"
    );
  };

  const getUfLabel = (value: string): string => {
    return getLabelFromOptions(
      value,
      exportOptions?.estadoOptions,
      "idtipo_estado"
    );
  };

  const getMunicipioLabel = (value: string): string => {
    return getLabelFromOptions(
      value,
      exportOptions?.municipioOptions,
      "idtipo_municipio"
    );
  };

  // Funções aprimoradas para campos problemáticos

  // 1. Calcular idade a partir da data de nascimento
  const getAge = (): string => {
    // CORREÇÃO: Usar idadeMeses (que tem o valor total em meses) ao invés de idade (que tem anos)
    if (formData.idadeMeses) {
      // Verificar se é um número (sempre em meses)
      const idadeNum = typeof formData.idadeMeses === 'string' ? parseInt(formData.idadeMeses) : formData.idadeMeses;
      if (!isNaN(idadeNum)) {
        // Lógica: 0-11 são meses literais, 12+ são meses convertidos para anos
        if (idadeNum === 0) {
          return "0 meses";
        } else if (idadeNum === 1) {
          return "1 mês";
        } else if (idadeNum >= 2 && idadeNum <= 11) {
          return `${idadeNum} meses`;
        } else if (idadeNum >= 12 && idadeNum < 24) {
          return "1 ano";
        } else if (idadeNum >= 24) {
          const years = Math.floor(idadeNum / 12);
          return years === 1 ? "1 ano" : `${years} anos`;
        }
      }
    }

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
      formData.identidadeGenero === "3" ||
      formData.identidadeGenero === "6"
    ) {
      return "Não"; // Padrão quando gestante se aplica e não foi informado
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

    return getLabelFromOptions(
      String(formData.bairro),
      exportOptions?.bairroOptions,
      "idtipo_bairro",
      "descricao"
    );
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
      if ("sigla" in ufObj && ufObj.sigla) return ufObj.sigla;
    }

    return getLabelFromOptions(
      String(formData.uf),
      exportOptions?.estadoOptions,
      "idtipo_estado",
      "descricao"
    );
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

    return getLabelFromOptions(
      String(formData.municipio),
      exportOptions?.municipioOptions,
      "idtipo_municipio",
      "descricao"
    );
  };

  // 6. Obter profissão aprimorada
  const getProfissaoText = (): string => {
    if (!formData.profissao) return "";
    return resolveCboLabel(formData.profissao, exportOptions?.cboOptions);
  };

  // 7. Obter unidade notificadora aprimorada
  const getUnidadeNotificadoraText = (): string => {
    if (!formData.unidadeNotificadora) return "";

    if (
      typeof formData.unidadeNotificadora === "object" &&
      formData.unidadeNotificadora !== null
    ) {
      const notificadora = formData.unidadeNotificadora as Record<string, any>;
      if ("nome" in notificadora && notificadora.nome) return notificadora.nome;
      if ("descricao" in notificadora && notificadora.descricao)
        return notificadora.descricao;
    }

    return getLabelFromOptions(
      String(formData.unidadeNotificadora),
      exportOptions?.estabelecimentoOptions,
      "idestabelecimento",
      "nome"
    );
  };

  const getLocalEncaminhamentoText = (): string => {
    if (!formData.localEncaminhamento) return "";

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

    return getLabelFromOptions(
      String(formData.localEncaminhamento),
      exportOptions?.estabelecimentoOptions,
      "idestabelecimento",
      "nome"
    );
  };

  // Extrair DDI e número de telefone separadamente
  const contatoTelefonicoProcessado = extractPhoneComponents(formData.contatoTelefonico, formData);
  const contatoLocalProcessado = extractPhoneComponents(formData.contatoLocal, formData);
  const contatoNotificadorProcessado = extractPhoneComponents(formData.contatoNotificador, formData);

  const modoExportacao = exportOptions?.modoLocalidadeEvento ?? "NAO_USA";
  const usaLocalidade = usaLocalidadeEvento(modoExportacao);

  // Return formatted data ready for export
  return {
    // Seção 1: Dados Gerais
    Evento: getEventoLabel(formData.evento),
    "Público Atendido": getPublicoAtendidoLabel(formData.publicoAtendido),
    ...(usaLocalidade
      ? {
          [EXPORT_LOCALIDADE_COLUMN]: getLocalidadeEventoText(),
          ...(isLocalidadeEventoOutro() && formData.localidadeEventoOutro
            ? { [EXPORT_LOCALIDADE_OUTRO_COLUMN]: formData.localidadeEventoOutro }
            : {}),
        }
      : {}),

    // Seção 2: Procedência do indivíduo
    [getExportResidenteColumnLabel(modoExportacao)]: getResidenteBelemLabel(
      formData.residenteBelem,
    ),
    ...(usaLocalidade ? {} : { [EXPORT_BAIRRO_COLUMN]: getBairroText() }),
    Município: getMunicipioText(),
    UF: getUfText(),
    "País de Procedência": getPaisLabel(formData.paisProcedencia),
    "Local de Hospedagem": formData.localHospedagem,
    "DDI Local": contatoLocalProcessado.ddi,
    "Contato do Local": contatoLocalProcessado.number,

    // Seção 3: Identificação do indivíduo
    "Nome do Paciente": formData.paciente,
    "Nome da Mãe": formData.nomeMae,
    "Data de Nascimento": formatarDataNascimento(formData.dataNascimento),
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

    // Seção 7: Campos de Auditoria
    "Data e Hora de Criação Original": formData.created_offline 
      ? formatarDataHoraUniversal(getRealCreationDate(formData))
      : formatarDataHoraUniversal(formData.created_at),
    "Data e Hora de Sincronização": formData.created_offline && formData.created_at
      ? formatarDataHoraUniversal(formData.created_at)
      : "—",
    "Data e Hora de Atualização": formatarDataHoraUniversal(formData.updated_at),
    "Criado por (ID)": formData.created_by_userid || "—",
    "Atualizado por (ID)": formData.updated_by_userid || "—",
    
    // Seção 8: Rastreamento Offline
    "Device ID": formData.device_id || "—",
    "Criado Offline": formData.created_offline ? "Sim" : "Não",
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

export const exportToPDF = async (
  formData: FormData,
  exportOptions?: ExportOptions
): Promise<boolean> => {
  try {
    const { exportarComunicacaoCasoDocumentoPDF } = await import(
      "./caseFormDocumentExporter"
    );
    await exportarComunicacaoCasoDocumentoPDF(formData, exportOptions);
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
export const formatNotificacaoForExport = (
  notificacao: NotificacaoItem,
  options?: ExportOptions
): ExportData => {
  // Acesse o objeto original contendo todos os dados detalhados
  const original = notificacao.original || {};
  const paciente = original.paciente || {};

  // 1. Função para calcular idade
  const getAge = (): string => {
    // Se já tem a idade calculada, priorizar ela
    if (paciente.idade !== undefined && paciente.idade !== null) {
      // Verificar se é um número (sempre em meses)
      const idadeNum = typeof paciente.idade === 'string' ? parseInt(paciente.idade) : paciente.idade;
      if (!isNaN(idadeNum)) {
        // Lógica: 0-11 são meses literais, 12+ são meses convertidos para anos
        if (idadeNum === 0) {
          return "0 meses";
        } else if (idadeNum === 1) {
          return "1 mês";
        } else if (idadeNum >= 2 && idadeNum <= 11) {
          return `${idadeNum} meses`;
        } else if (idadeNum >= 12 && idadeNum < 24) {
          return "1 ano";
        } else if (idadeNum >= 24) {
          const years = Math.floor(idadeNum / 12);
          return years === 1 ? "1 ano" : `${years} anos`;
        }
      }
    }

    if (paciente.data_nascimento) {
      return calculateAge(paciente.data_nascimento);
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
    if (generoId === "1" || generoId === "3" || generoId === "6") {
      // Mulher cis, mulher trans ou não binário
      return "Não"; // Padrão quando gestante se aplica e não foi informado
    }

    return "Não aplicável"; // Padrão para outros gêneros
  };

  // 3. Função para obter profissão via tipo_cbo
  const getProfissaoText = (): string => {
    const paciente = notificacao.original?.paciente || {};

    const fromRelation = resolveCboLabel(paciente.tipo_cbo);
    if (fromRelation) return fromRelation;

    return resolveCboLabel(
      paciente.cbo_idcbo ?? paciente.profissao,
      options?.cboOptions,
    );
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

    return looksLikeNumericId(original.bairro) ? "" : original.bairro || "";
  };

  const getLocalidadeEventoText = (): string => {
    const locality = original.localidade_evento;
    if (locality && typeof locality === "object" && locality.nome) {
      return locality.ativo === false
        ? `${locality.nome} (inativa)`
        : String(locality.nome);
    }

    const localityId =
      original.localidade_evento_id ?? notificacao.localidade_evento_id;
    if (options?.localidadeEventoOptions && localityId) {
      return getLabelFromOptions(
        String(localityId),
        options.localidadeEventoOptions,
        "id",
        "nome"
      );
    }

    return "";
  };

  const getLocalidadeOutroText = (): string => {
    return original.localidade_evento_outro || "";
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

    return looksLikeNumericId(original.municipio)
      ? ""
      : original.municipio || "";
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

    return getLabelFromOptions(
      original.tipo_hipotese_diag_idtipo_hipotese_diag?.toString(),
      options?.hipoteseDiagOptions,
      "idtipo_hipotese_diag"
    );
  };

  // Obter tipo de trauma aprimorado - usando notificacao_has_tipo_trauma (N:N)
  const getTraumaText = (): string => {
    console.log("[EXPORT DEBUG - Tipo Trauma] Original data:", {
      notificacao_has_tipo_trauma: original.notificacao_has_tipo_trauma,
      has_traumaOptions: !!options?.traumaOptions,
      traumaOptions_length: options?.traumaOptions?.length || 0
    });

    // Verificar se existe o array de traumas (relacionamento N:N)
    const traumas = original.notificacao_has_tipo_trauma;
    
    if (!traumas || !Array.isArray(traumas) || traumas.length === 0) {
      console.log("[EXPORT DEBUG - Tipo Trauma] Sem traumas associados, retornando vazio");
      return "";
    }

    // Extrair descrições dos traumas
    const traumaDescricoes: string[] = [];
    
    traumas.forEach((traumaRel: any) => {
      const traumaId = traumaRel.tipo_trauma_idtipo_trauma;
      
      // Tentar obter do objeto relacionado primeiro
      if (traumaRel.tipo_trauma && traumaRel.tipo_trauma.descricao) {
        traumaDescricoes.push(traumaRel.tipo_trauma.descricao);
        return;
      }
      
      // Senão, buscar nas opções
      if (options?.traumaOptions && traumaId) {
        const label = getLabelFromOptions(
          String(traumaId),
          options.traumaOptions,
          "idtipo_trauma"
        );
        if (label) {
          traumaDescricoes.push(label);
        }
      }
    });

    const result = traumaDescricoes.join(", ");
    console.log("[EXPORT DEBUG - Tipo Trauma] Resultado final:", result);
    return result;
  };

  // Função para obter valor de residente em Belém
  const getResidenteText = (): string => {
    const map: Record<string, string> = {
      S: "SIM",
      "1": "SIM",
      N: "NÃO",
      "2": "NÃO",
      "3": "ESTRANGEIRO",
      E: "ESTRANGEIRO",  // ✅ ADICIONADO: valor do backend para estrangeiro
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

  // 🆕 DEBUG: Verificar observações no objeto original
  console.log("[EXPORT DEBUG - Observações] Valores no original:", {
    observacao_sintomas: original.observacao_sintomas,
    observacao_hipotese: original.observacao_hipotese,
    observacao_hiposete: original.observacao_hiposete,
    observacao_trauma_direto: original.observacao_trauma,
    observacao_trauma_array: original.notificacao_has_tipo_trauma?.[0]?.observacao_trauma,
    notificacao_has_tipo_trauma: original.notificacao_has_tipo_trauma,
    observacao_incidente: original.observacao_incidente,
    observavao_incidente: original.observavao_incidente
  });

  const modoExportacao = options?.modoLocalidadeEvento ?? "NAO_USA";
  const usaLocalidade = usaLocalidadeEvento(modoExportacao);

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
    ...(usaLocalidade
      ? {
          [EXPORT_LOCALIDADE_COLUMN]: getLocalidadeEventoText(),
          [EXPORT_LOCALIDADE_OUTRO_COLUMN]: getLocalidadeOutroText(),
        }
      : {}),

    // Procedência do indivíduo
    [getExportResidenteColumnLabel(modoExportacao)]: getResidenteText(),
    "País de Procedência": getLabelFromOptions(
      original.tipo_pais_idtipo_pais?.toString(),
      options?.paisOptions || [],
      "idtipo_pais"
    ),
    UF: getUfText(), // Usando a função aprimorada
    Município: getMunicipioText(), // Usando a função aprimorada
    ...(usaLocalidade ? {} : { [EXPORT_BAIRRO_COLUMN]: getBairroText() }),
    "Local de Hospedagem": original.local_hospedagem || "",
    "DDI Local": contatoLocalProcessado.ddi,
    "Contato do Local": contatoLocalProcessado.number,

    // Identificação do indivíduo
    "Nome do Paciente": paciente.nome || "",
    "Nome da Mãe": paciente.nome_mae || "",
    "Data de Nascimento": formatarDataNascimento(paciente.data_nascimento),
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
    "Observação do Trauma": (() => {
      // A observação do trauma está dentro do array notificacao_has_tipo_trauma
      const traumas = original.notificacao_has_tipo_trauma;
      if (traumas && Array.isArray(traumas) && traumas.length > 0) {
        return traumas[0].observacao_trauma || "";
      }
      // Fallback para campos antigos
      return original.observacao_trauma || "";
    })(),
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

    // Campos de Auditoria
    "Data e Hora de Criação Original": original.created_offline 
      ? formatarDataHoraUniversal(getRealCreationDate(original))
      : formatarDataHoraUniversal(original.created_at),
    "Data e Hora de Sincronização": original.created_offline && original.created_at
      ? formatarDataHoraUniversal(original.created_at)
      : "—",
    "Data e Hora de Atualização": formatarDataHoraUniversal(original.updated_at),
    "Criado por (ID)": original.created_by_userid || "—",
    "Atualizado por (ID)": original.updated_by_userid || "—",
    
    // Rastreamento Offline
    "Device ID": original.device_id || "—",
    "Criado Offline": original.created_offline ? "Sim" : "Não",
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
      { wch: 20 }, // Data e Hora de Criação Original
      { wch: 20 }, // Data e Hora de Sincronização
      { wch: 20 }, // Data e Hora de Atualização
      { wch: 15 }, // Criado por (ID)
      { wch: 15 }, // Atualizado por (ID)
      { wch: 25 }, // Device ID
      { wch: 15 }, // Criado Offline
    ];

    worksheet["!cols"] = columnsWidth;

    // Ajustar formato de datas (campos que são apenas data)
    const dateFields = [
      "Data de Nascimento",
      "Data de Início dos Sintomas",
      "Data da Ocorrência",
      "Data do Atendimento",
      "Data de Encerramento",
    ];
    
    // Campos de data e hora (formato diferente)
    const dateTimeFields = [
      "Data e Hora de Criação Original",
      "Data e Hora de Sincronização",
      "Data e Hora de Atualização",
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
        } else if (dateTimeFields.includes(field)) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
          const cell = worksheet[cellRef];
          if (cell && cell.v) {
            // Aplicar formato de data e hora
            cell.t = "s"; // Manter como string
            cell.z = "dd/mm/yyyy hh:mm:ss"; // Formato visual data e hora
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
export const exportListToPDF = async (
  notificacoes: NotificacaoItem[],
  exportOptions?: ExportOptions
): Promise<void> => {
  try {
    if (!notificacoes || notificacoes.length === 0) {
      console.warn("Não há dados para exportar");
      return;
    }

    // Formatar dados para PDF
    const formattedData = notificacoes.map((item) =>
      formatNotificacaoForExport(item, exportOptions)
    );

    // Documento para tabela resumida (paisagem)
    const tabelaDoc = new jsPDF({
      orientation: "landscape",
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
      didDrawPage: (_data) => {
        // Adicionar rodapé à página da tabela
        addFooter(tabelaDoc, 1, 1 + notificacoes.length); // 1 página de tabela + N páginas de fichas
      },
    });

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

    const currentDate = new Date().toISOString().split("T")[0];
    const fileName = `notificacoes_lista_${currentDate}.pdf`;

    const { buildComunicacoesCasoDocumentosPdfBytes } = await import(
      "./caseFormDocumentExporter"
    );
    const fichasBytes = await buildComunicacoesCasoDocumentosPdfBytes(
      notificacoes,
      exportOptions
    );

    try {
      const tabelaBytes = tabelaDoc.output("arraybuffer");
      const mergedPdf = await PDFDocument.create();
      const tabelaPdf = await PDFDocument.load(tabelaBytes);
      const fichasPdf = await PDFDocument.load(fichasBytes);

      const tabelaPages = await mergedPdf.copyPages(
        tabelaPdf,
        tabelaPdf.getPageIndices()
      );
      const fichasPages = await mergedPdf.copyPages(
        fichasPdf,
        fichasPdf.getPageIndices()
      );
      tabelaPages.forEach((page) => mergedPdf.addPage(page));
      fichasPages.forEach((page) => mergedPdf.addPage(page));

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      console.error("Erro ao mesclar com PDF-lib:", e);
      tabelaDoc.save(`tabela_${fileName}`);
      const fichasBlob = new Blob([fichasBytes], { type: "application/pdf" });
      const fichasUrl = URL.createObjectURL(fichasBlob);
      const fichasLink = document.createElement("a");
      fichasLink.href = fichasUrl;
      fichasLink.download = `fichas_${fileName}`;
      document.body.appendChild(fichasLink);
      fichasLink.click();
      document.body.removeChild(fichasLink);
      URL.revokeObjectURL(fichasUrl);
      alert(
        "Não foi possível gerar um único PDF. Foram gerados dois arquivos separados: um com a tabela resumida e outro com as fichas detalhadas."
      );
    }
  } catch (error) {
    console.error("Erro ao exportar lista para PDF:", error);
    throw error;
  }
};

// ===================================================================
// PARTE 5: NOVAS OPÇÕES DE EXPORTAÇÃO PDF
// ===================================================================

// Tipo para definir o tipo de exportação PDF
export type PDFExportType = 'table' | 'forms' | 'both';

// Exportar lista APENAS como tabela resumida (paisagem)
export const exportListToPDFTableOnly = (
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

    // Criar documento em paisagem
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Configurar título e informações do documento
    doc.setFontSize(16);
    doc.setTextColor(63, 81, 181);
    doc.text("Relatório de Notificações - Tabela Resumida", 15, 15);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
      15,
      22
    );
    doc.text(`Total de registros: ${notificacoes.length}`, 15, 27);

    // Selecionar campos para tabela (versão expandida mas ainda legível)
    const tabelaFields = [
      "Nome do Paciente",
      "Idade",
      "Tipo de Atendimento",
      "Data da Ocorrência",
      "Evento",
      "Sinais e Sintomas",
      "Tipo de Encerramento",
      "Unidade Notificadora",
    ];

    // Criar tabela
    doc.autoTable({
      startY: 32,
      head: [tabelaFields],
      body: formattedData.map((item) =>
        tabelaFields.map((field) => {
          const value = String(item[field] || "");
          // Limitar tamanho de textos longos para manter legibilidade
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
        // Adicionar rodapé
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.getWidth() - 15,
          doc.internal.pageSize.getHeight() - 10,
          { align: "right" }
        );
      },
    });

    // Nome do arquivo
    const currentDate = new Date().toISOString().split("T")[0];
    const fileName = `tabela_notificacoes_${currentDate}.pdf`;

    // Salvar o documento
    doc.save(fileName);
    
  } catch (error) {
    console.error("Erro ao exportar tabela PDF:", error);
    throw error;
  }
};

// Exportar lista APENAS como fichas detalhadas (retrato)
export const exportListToPDFFormsOnly = async (
  notificacoes: NotificacaoItem[],
  exportOptions?: ExportOptions
): Promise<void> => {
  try {
    if (!notificacoes || notificacoes.length === 0) {
      console.warn("Não há dados para exportar");
      return;
    }

    const { exportarComunicacoesCasoDocumentosPDF } = await import(
      "./caseFormDocumentExporter"
    );
    await exportarComunicacoesCasoDocumentosPDF(notificacoes, exportOptions);
  } catch (error) {
    console.error("Erro ao exportar fichas PDF:", error);
    throw error;
  }
};

export const exportListToPDFWithOptions = async (
  notificacoes: NotificacaoItem[],
  exportOptions?: ExportOptions,
  pdfType: PDFExportType = "both"
): Promise<void> => {
  switch (pdfType) {
    case "table":
      exportListToPDFTableOnly(notificacoes, exportOptions);
      break;
    case "forms":
      await exportListToPDFFormsOnly(notificacoes, exportOptions);
      break;
    case "both":
    default:
      await exportListToPDF(notificacoes, exportOptions);
      break;
  }
};
