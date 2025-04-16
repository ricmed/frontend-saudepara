// Interface genérica para entidades de notificação
interface NotificacaoGenerica {
  [key: string]: any;
}

// Interface para os dados do formulário frontend
import { FormData } from "@/features/notificationForms/NotificationForm";
import axios from "axios";
import indexedDBService from '@/services/indexedDB';
import syncService from '@/services/syncService';
import { toast } from 'react-toastify';

// Função auxiliar para conversão de datas UTC para local
const convertUTCDateToLocal = (dateString: string): Date => {
  const date = new Date(dateString);
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
};

// Função auxiliar para formatação universal de datas
const formatarDataUniversal = (dateString: string): string => {
  try {
    const date = convertUTCDateToLocal(dateString);
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return date.toLocaleDateString("pt-BR", {
      timeZone: userTimeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return "Data inválida";
  }
};

// Função para processar datas com ajuste de fuso horário
const processarData = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  return convertUTCDateToLocal(dateString).toISOString().split("T")[0];
};

// Função para converter datas locais para UTC
const processarDataParaUTC = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};

/**
 * Formata dados do backend para o formato esperado pelo frontend (FormData)
 * @param backendData Dados recebidos da API
 */
export const formatFromBackend = async (
  backendData: NotificacaoGenerica
): Promise<FormData | null> => {
  if (!backendData) return null;

  // Log de depuração para visualizar a estrutura completa dos dados
  console.log("Dados recebidos do backend:", JSON.stringify(backendData, null, 2));

  // Converter valores de surto e residente_belem para o formato do formulário
  const residenteBelem =
    backendData.residente_belem === "S"
      ? "1"
      : backendData.residente_belem === "N"
      ? "2"
      : "3";

  // Mapear o campo tipo_bairro_idtipo_bairro para bairro
  const bairroId = backendData.tipo_bairro_idtipo_bairro ?
    backendData.tipo_bairro_idtipo_bairro.toString() : "";

  const relacionadoSurto = backendData.surto === "S" ? "1" : "2";

  // Buscar sintomas com método melhorado e aguardar resultado
  const sinaisESintomas = await extractSintomasStrings(backendData);
  console.log("Sintomas extraídos:", sinaisESintomas);

  // Buscar local de encaminhamento
  let localEncaminhamento = extractLocalEncaminhamento(backendData);

  // Calcular idade a partir da data de nascimento se disponível
  let idade = backendData.paciente?.idade?.toString() || "";
  if (!idade && backendData.paciente?.data_nascimento) {
    const birthDate = convertUTCDateToLocal(backendData.paciente.data_nascimento);
    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    );
    
    idade = String(todayUTC.getFullYear() - birthDate.getUTCFullYear());
    
    if (
      todayUTC.getMonth() < birthDate.getUTCMonth() ||
      (todayUTC.getMonth() === birthDate.getUTCMonth() && 
       todayUTC.getDate() < birthDate.getUTCDate())
    ) {
      idade = String(parseInt(idade) - 1);
    }
  }

  // Processar contatos telefônicos - versão melhorada
let contatoTelefonico = "";
let contatoNotificador = "";
let ddi = backendData.paciente?.ddi || "55"; // Começa com o DDI do backend

// Contato do paciente
if (backendData.paciente?.contato) {
  // Se o contato começa com +, extrair o DDI dele
  if (backendData.paciente.contato.startsWith('+') && backendData.paciente.contato.includes(' ')) {
    const parts = backendData.paciente.contato.split(' ');
    // Atualizar o DDI a partir do número (mais confiável)
    ddi = parts[0].replace('+', '');
    // Armazenar apenas o número
    contatoTelefonico = parts.slice(1).join(' ');
  } else {
    // Se não tem formato +XX, usar o valor completo
    contatoTelefonico = backendData.paciente.contato;
  }
} else if (backendData.paciente?.telefone) {
  contatoTelefonico = backendData.paciente.telefone;
} else if (backendData.paciente?.celular) {
  contatoTelefonico = backendData.paciente.celular;
}

// Contato do notificador
if (backendData.contato_notificador) {
  // Se o contato começa com +, extrair apenas o número
  if (backendData.contato_notificador.startsWith('+') && backendData.contato_notificador.includes(' ')) {
    const parts = backendData.contato_notificador.split(' ');
    // Armazenar apenas o número (não precisamos do DDI do notificador)
    contatoNotificador = parts.slice(1).join(' ');
  } else {
    contatoNotificador = backendData.contato_notificador;
  }
} else if (backendData.telefone_notificador) {
  contatoNotificador = backendData.telefone_notificador;
} else if (backendData.celular_notificador) {
  contatoNotificador = backendData.celular_notificador;
}

  // Criar objeto de formulário com dados do backend
  const formData: FormData = {
    // Seção 1: Dados Gerais
    evento: backendData.tipo_evento_idtipo_evento?.toString() || "",
    publicoAtendido: backendData.tipo_publico_idtipo_publico?.toString() || "",
    ddi: ddi,

    // Seção 2: Procedência do indivíduo
    residenteBelem,
    bairro: backendData.tipo_bairro_idtipo_bairro?.toString() || "",
    municipio: backendData.tipo_municipio_idtipo_municipio?.toString() || "",
    uf: backendData.tipo_estado_idtipo_estado?.toString() || "",
    paisProcedencia: backendData.tipo_pais_idtipo_pais?.toString() || "",
    localHospedagem: backendData.local_hospedagem || "",
    contatoLocal: backendData.contato_local_hospedagem || "",

    // Seção 3: Identificação do indivíduo
    paciente: backendData.paciente?.nome || "",
    pacienteId: backendData.paciente_idpaciente || undefined,
    nomeMae: backendData.paciente?.nome_mae || "",
    dataNascimento: processarData(backendData.paciente?.data_nascimento),
    idade,
    cpf: backendData.paciente?.cpf || "",
    identidadeGenero:
      backendData.paciente?.tipo_genero_idtipo_genero?.toString() || "",
    gestante: backendData.paciente?.gestante === "S" ? "1" : "2",
    raca: backendData.paciente?.tipo_raca_idtipo_raca?.toString() || "",
    escolaridade:
      backendData.paciente?.escolaridade_idescolaridade?.toString() || "",
    profissao: backendData.paciente?.cbo_idcbo?.toString() || "",
    profissaoSearch: "",
    showProfissaoOptions: false,
    contatoTelefonico,

    // Seção 4: Informações do atendimento
    tipoAtendimento:
      backendData.tipo_atendimento_idtipo_atendimento?.toString() || "",
    sinaisESintomas,
    dataInicioSintomas: processarData(backendData.data_inicio_sintomas),
    observacaoSintomas: backendData.observacao_sintomas || "",
    hipoteseDiagnostica: backendData.tipo_hipotese_diag_idtipo_hipotese_diag
      ? [backendData.tipo_hipotese_diag_idtipo_hipotese_diag.toString()]
      : [],
    observacaoHipotese: backendData.observacao_hiposete || "",
    tipoTrauma: backendData.tipo_trauma_idtipo_trauma
      ? [backendData.tipo_trauma_idtipo_trauma.toString()]
      : [],
    dataOcorrencia: processarData(backendData.data_ocorrencia),
    observacaoTrauma: backendData.observacao_trauma || "",
    relacionadoSurto,
    observacaoIncidente: backendData.observavao_incidente || "",

    // Seção 5: Informações da unidade notificadora
    dataAtendimento: processarData(backendData.data_atendimento),
    unidadeNotificadora:
      backendData.estabelecimento_idestabelecimento?.toString() || "",
    nomeNotificador: backendData.nome_notificador || "",
    contatoNotificador,

    // Seção 6: Encerramento do Caso
    dataEncerramento: processarData(backendData.data_encerramento),
    tipoEncerramento:
      backendData.tipo_encerramento_idtipo_encerramento?.toString() || "",
    localEncaminhamento,
  };

  console.log("FormData processado:", {
    contatoTelefonico: formData.contatoTelefonico,
    contatoNotificador: formData.contatoNotificador,
    sinaisESintomas: formData.sinaisESintomas,
    localEncaminhamento: formData.localEncaminhamento,
    tipoEncerramento: formData.tipoEncerramento
  });

  return formData;
};

/**
 * Extrai strings de IDs de sintomas de uma notificação
 */
export async function extractSintomasStrings(notificacao: NotificacaoGenerica): Promise<string[]> {
  const sinaisESintomas: string[] = [];
  
  console.log("Extraindo sintomas de:", notificacao.notificacao_has_tipo_sintoma);

  if (notificacao.notificacao_has_tipo_sintoma && 
      Array.isArray(notificacao.notificacao_has_tipo_sintoma)) {
    
    notificacao.notificacao_has_tipo_sintoma.forEach((item: any) => {
      let sintomaId = null;
      
      if (item.tipo_sintoma_idtipo_sintoma) {
        sintomaId = item.tipo_sintoma_idtipo_sintoma;
      } else if (item.tipo_sintoma?.idtipo_sintoma) {
        sintomaId = item.tipo_sintoma.idtipo_sintoma;
      }
      
      if (sintomaId) {
        sinaisESintomas.push(sintomaId.toString());
        console.log(`Sintoma encontrado: ID ${sintomaId}`);
      }
    });
  }

  if (sinaisESintomas.length === 0 && notificacao.idnotificacao) {
    console.log(`Nenhum sintoma encontrado para notificação ${notificacao.idnotificacao}`);
    
    try {
      const sintomas = await fetchSintomasForNotificacao(notificacao.idnotificacao);
      if (sintomas.length > 0) {
        console.log("Sintomas buscados via API:", sintomas);
        sintomas.forEach((sintoma: any) => {
          if (sintoma.tipo_sintoma_idtipo_sintoma) {
            sinaisESintomas.push(sintoma.tipo_sintoma_idtipo_sintoma.toString());
          } else if (sintoma.tipo_sintoma?.idtipo_sintoma) {
            sinaisESintomas.push(sintoma.tipo_sintoma.idtipo_sintoma.toString());
          }
        });
      }
    } catch (err) {
      console.error("Erro ao buscar sintomas:", err);
    }
  }

  return sinaisESintomas;
}

/**
 * Extrai o local de encaminhamento de uma notificação
 */
export function extractLocalEncaminhamento(notificacao: NotificacaoGenerica): string {
  let localEncaminhamento = '';
  
  // Check for estabelecimento_idestabelecimento_encaminhado first (this is the correct field name)
  if (notificacao.estabelecimento_idestabelecimento_encaminhado) {
    const encaminhamentoId = notificacao.estabelecimento_idestabelecimento_encaminhado;
    console.log(`Local de encaminhamento encontrado em 'estabelecimento_idestabelecimento_encaminhado': ${encaminhamentoId}`);
    return encaminhamentoId.toString();
  }
  
  // Then check legacy field names
  if (notificacao.local_encaminhamento) {
    console.log(`Local de encaminhamento encontrado no campo 'local_encaminhamento': ${notificacao.local_encaminhamento}`);
    return notificacao.local_encaminhamento.toString();
  }
  
  const possibleFields = [
    'localencaminhamento',
    'unidade_encaminhamento',
    'encaminhamento_local',
    'encaminhado_para'
  ];
  
  for (const field of possibleFields) {
    if (notificacao[field]) {
      localEncaminhamento = notificacao[field];
      console.log(`Local de encaminhamento encontrado no campo: ${field}`);
      return localEncaminhamento;
    }
  }
  
  if (notificacao.tipo_encerramento_idtipo_encerramento === 3) {
    console.log("Notificação é do tipo 'Transferido' mas não tem local definido");
  }

  return localEncaminhamento;
}

/**
 * Formata dados do frontend para o formato esperado pelo backend
 * @param frontendData Dados do formulário de frontend
 * @param isUpdate Indica se é uma atualização (true) ou criação (false)
 */
export const formatToBackend = (frontendData: FormData, isUpdate: boolean = false): NotificacaoGenerica => {
  const trimFields = <T extends Record<string, any>>(data: T): T => {
    const result: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      result[key] = typeof value === "string" ? value.trim() : value;
    });

    return result as T;
  };

  const trimmedData = trimFields(frontendData);

  // Converter valores específicos
  const residenteBelem =
  trimmedData.residenteBelem === "1"
  ? "S"
  : "N"; // Tanto "2" (não residente BR) quanto "3" (estrangeiro) mapeiam para "N"

  const surto = trimmedData.relacionadoSurto === "1" ? "S" : "N";

  const pacienteId = trimmedData.pacienteId ? Number(trimmedData.pacienteId) : null;

  // Processar o local de encaminhamento (conforme esperado pelo backend)
  let estabelecimentoEncaminhado = null;
  if (trimmedData.localEncaminhamento) {
    // Se é um número numérico, use diretamente
    if (!isNaN(Number(trimmedData.localEncaminhamento))) {
      estabelecimentoEncaminhado = parseInt(trimmedData.localEncaminhamento);
    }
    // Para casos de transferência onde pode ser uma string, mantenha a string
    else {
      estabelecimentoEncaminhado = trimmedData.localEncaminhamento;
    }
  }
  
  // Log especial para debug do campo de encaminhamento
  console.log("Processando campo de encaminhamento:", {
    original: trimmedData.localEncaminhamento,
    tipo: typeof trimmedData.localEncaminhamento,
    convertido: estabelecimentoEncaminhado,
    tipoEncerramento: trimmedData.tipoEncerramento
  });

  // Construir payload para o backend com datas ajustadas para UTC
  const payload: NotificacaoGenerica = {
    tipo_evento_idtipo_evento: parseInt(trimmedData.evento) || null,
    tipo_publico_idtipo_publico: parseInt(trimmedData.publicoAtendido) || null,
    paciente_idpaciente: pacienteId,
    residente_belem: residenteBelem,
    tipo_pais_idtipo_pais: trimmedData.residenteBelem === "3" 
  ? parseInt(trimmedData.paisProcedencia) || null 
  : 105, // Brasil para opções 1 e 2
    tipo_atendimento_idtipo_atendimento: parseInt(trimmedData.tipoAtendimento) || null,
    data_ocorrencia: processarDataParaUTC(trimmedData.dataOcorrencia) || new Date().toISOString().split("T")[0],
    surto,
    estabelecimento_idestabelecimento: parseInt(trimmedData.unidadeNotificadora) || null,
    tipo_encerramento_idtipo_encerramento: parseInt(trimmedData.tipoEncerramento) || null,

    // IMPORTANTE: Adicione estes campos sempre, mesmo que vazios
    observavao_incidente: trimmedData.observacaoIncidente || "",
    observacao_sintomas: trimmedData.observacaoSintomas || "",
    observacao_hiposete: trimmedData.observacaoHipotese || "",
    observacao_trauma: trimmedData.observacaoTrauma || "",

    ddi: trimmedData.ddi || "55", // Adicionar o campo ddi

    // Adicionar telefone do paciente no payload para notificações novas
    // Para edições este campo não deve ser enviado pois não faz parte da tabela de notificação
    ...(isUpdate ? {} : { contato_paciente: trimmedData.contatoTelefonico || "" }),

    // Campos opcionais
    ...(trimmedData.bairro && { 
      tipo_bairro_idtipo_bairro: parseInt(trimmedData.bairro) || null 
    }),
    ...(trimmedData.uf && {
      tipo_estado_idtipo_estado: parseInt(trimmedData.uf) || null,
    }),
    ...(trimmedData.municipio && {
      tipo_municipio_idtipo_municipio: parseInt(trimmedData.municipio) || null,
    }),
    local_hospedagem: trimmedData.localHospedagem || "", 
    contato_local_hospedagem: trimmedData.contatoLocal || "",
    ...(trimmedData.dataInicioSintomas && {
      data_inicio_sintomas: processarDataParaUTC(trimmedData.dataInicioSintomas),
    }),
    ...(trimmedData.observacaoSintomas && {
      observacao_sintomas: trimmedData.observacaoSintomas || "",
    }),
    ...(trimmedData.hipoteseDiagnostica.length > 0 && {
      tipo_hipotese_diag_idtipo_hipotese_diag:
        parseInt(trimmedData.hipoteseDiagnostica[0]) || null,
    }),
  ...(trimmedData.observacaoHipotese && {
    observacao_hiposete: trimmedData.observacaoHipotese || "",
  }),
  tipo_trauma_idtipo_trauma: trimmedData.tipoTrauma.length > 0 
    ? parseInt(trimmedData.tipoTrauma[0]) 
    : null,
  ...(trimmedData.observacaoTrauma && {
    observacao_trauma: trimmedData.observacaoTrauma || "",
    }),
    ...(trimmedData.observacaoIncidente && {
      observavao_incidente: trimmedData.observacaoIncidente || "",
    }),
    ...(trimmedData.dataAtendimento && {
      data_atendimento: processarDataParaUTC(trimmedData.dataAtendimento),
    }),
    ...(trimmedData.nomeNotificador && {
      nome_notificador: trimmedData.nomeNotificador,
    }),
    ...(trimmedData.contatoNotificador && {
      contato_notificador: trimmedData.contatoNotificador.substring(0, 15)
    }),
    ...(trimmedData.dataEncerramento && {
      data_encerramento: processarDataParaUTC(trimmedData.dataEncerramento),
    }),
    
    // CORREÇÃO: Usar o nome de campo correto conforme esperado pelo backend
    // Inserir apenas quando tipoEncerramento é 3 (transferido) ou 4 (óbito) ou quando o valor existe
    ...((["3", "4"].includes(trimmedData.tipoEncerramento) || estabelecimentoEncaminhado) 
      ? { estabelecimento_idestabelecimento_encaminhado: estabelecimentoEncaminhado } 
      : {})
  };

  console.log("Enviando payload para o backend:", JSON.stringify(payload, null, 2));

  return payload;
};

/**
 * Salva os sintomas associados a uma notificação via API separada
 * @param notificacaoId ID da notificação
 * @param sintomasIds Array de IDs dos sintomas
 */
export const salvarSintomasViaApi = async (notificacaoId: number, sintomasIds: number[]): Promise<void> => {
  const server = import.meta.env.VITE_API_SERVER;
  const port = import.meta.env.VITE_API_PORT;
  
  try {
    await axios.post(`${server}:${port}/api/notificacao/${notificacaoId}/sintomas`, {
      sintomas: sintomasIds
    });
    
    console.log(`Sintomas salvos com sucesso para notificação ${notificacaoId}`);
  } catch (error) {
    console.error(`Erro ao salvar sintomas para notificação ${notificacaoId}:`, error);
    throw new Error('Falha ao salvar sintomas. Por favor, tente novamente.');
  }
};

/**
 * Função principal para salvar uma notificação completa (incluindo sintomas)
 * com suporte para modo offline
 * @param formData Dados do formulário
 * @param isUpdate Indica se é uma atualização
 * @param notificacaoId ID da notificação (apenas para atualizações)
 */
export const salvarNotificacaoCompleta = async (
  formData: FormData, 
  isUpdate: boolean = false,
  notificacaoId?: number
): Promise<any> => {

  console.log("DADOS DO FORM ANTES DE ENVIAR:", formData);
  console.log("Dados antes de salvar - Tipo residente:", formData.residenteBelem, "País:", formData.paisProcedencia);

  // Sempre salvar localmente primeiro
  const localId = await indexedDBService.saveNotificacao(formData, isUpdate, notificacaoId);

  // Se estiver offline, retornar o ID local e informar ao usuário
  if (!syncService.isNetworkAvailable()) {
    toast.info('Você está offline. Os dados foram salvos localmente e serão sincronizados quando houver conexão.', {
      icon: '📴',
    });
    
    return { id: localId, idnotificacao: localId };
  }
  
  const server = import.meta.env.VITE_API_SERVER;
  const port = import.meta.env.VITE_API_PORT;
  
  // Formatar dados para o backend
  const payloadBackend = formatToBackend(formData, isUpdate);
  
  console.log("PAYLOAD APÓS FORMATAÇÃO:", payloadBackend);
  
  try {
    let response;
    let savedNotificacaoId;
    
    if (isUpdate && notificacaoId) {
      // Atualizar notificação existente
      try {
        console.log(`Enviando atualização para notificação ${notificacaoId}:`, JSON.stringify(payloadBackend, null, 2));
        response = await axios.put(`${server}:${port}/api/notificacao/${notificacaoId}`, payloadBackend);
        savedNotificacaoId = notificacaoId;
      } catch (error: any) {
        // Log detalhado do erro para diagnóstico
        console.error("Erro detalhado ao atualizar notificação:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          payload: payloadBackend
        });
        
        // Informar o usuário que os dados foram salvos localmente
        toast.warning('Não foi possível enviar para o servidor. Os dados foram salvos localmente e serão sincronizados depois.', {
          icon: '🔄',
        });
        
        return { id: localId, idnotificacao: localId };
      }
    } else {
      // Criar nova notificação
      try {
        console.log("Enviando notificação para criação:", JSON.stringify(payloadBackend, null, 2));
        response = await axios.post(`${server}:${port}/api/notificacao`, payloadBackend);
        savedNotificacaoId = response.data.idnotificacao;
        console.log(`Notificação criada com ID: ${savedNotificacaoId}`);
      } catch (error: any) {
        // Log detalhado do erro para diagnóstico
        console.error("Erro detalhado ao criar notificação:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          payload: payloadBackend
        });
        
        // Informar o usuário que os dados foram salvos localmente
        toast.warning('Não foi possível enviar para o servidor. Os dados foram salvos localmente e serão sincronizados depois.', {
          icon: '🔄',
        });
        
        return { id: localId, idnotificacao: localId };
      }
    }
    
    // Extrair IDs dos sintomas do formulário
    const sintomasIds = formData.sinaisESintomas.map(id => parseInt(id));
    
    // Chamar função para salvar sintomas em endpoint separado
    if (sintomasIds.length > 0 || isUpdate) {
      try {
        await salvarSintomasViaApi(savedNotificacaoId, sintomasIds);
      } catch (error) {
        console.error("Erro ao salvar sintomas:", error);
        toast.warning('Notificação salva, mas houve erro ao salvar sintomas.');
      }
    }
    
    // Marcar a notificação como sincronizada no IndexedDB
    await indexedDBService.markNotificacaoAsSynced(localId);
    
    return response.data;
  } catch (error) {
    console.error("Erro ao salvar notificação:", error);
    toast.error('Erro ao salvar. Os dados estão armazenados localmente e serão sincronizados quando possível.');
    return { id: localId, idnotificacao: localId, syncPending: true };
  }
};

/**
 * Função para buscar notificação com suporte offline
 * @param id ID da notificação
 */
export const buscarNotificacao = async (id: number): Promise<FormData | null> => {
  // Se estiver online, buscar do servidor primeiro
  if (syncService.isNetworkAvailable()) {
    try {
      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      
      const response = await axios.get(`${server}:${port}/api/notificacao/${id}`);
      const data = await formatFromBackend(response.data);
      
      // Salvar localmente para acesso offline futuro
      if (data) {
        await indexedDBService.saveNotificacao(data, true, id);
        await indexedDBService.markNotificacaoAsSynced(id);
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar notificação do servidor:', error);
      toast.warning('Não foi possível buscar do servidor. Tentando dados locais...');
      // Cair para o cache local se houver erro
    }
  } else {
    toast.info('Você está offline. Buscando dados do armazenamento local.');
  }
  
  // Buscar do armazenamento local
  return await indexedDBService.getNotificacao(id);
};

/**
 * Função auxiliar para buscar sintomas via API quando necessário
 */
async function fetchSintomasForNotificacao(notificacaoId: number): Promise<any[]> {
  // Se offline, retornar array vazio
  if (!syncService.isNetworkAvailable()) {
    return [];
  }
  
  const server = import.meta.env.VITE_API_SERVER;
  const port = import.meta.env.VITE_API_PORT;
  
  try {
    const response = await axios.get(`${server}:${port}/api/notificacao/${notificacaoId}/sintomas`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Erro ao buscar sintomas para notificação ${notificacaoId}:`, error);
    return [];
  }
}

/**
 * Formata a resposta da API de listagem para o formato esperado pelo componente de tabela
 */
export const formatListResponse = (apiResponse: any) => {
  if (!apiResponse?.data && !apiResponse?.items) {
    return {
      data: [],
      meta: { total: 0, totalPages: 1, page: 1, limit: 10 },
    };
  }
  
  // Compatibilidade com diferentes formatos de resposta
  const items = apiResponse.data || apiResponse.items || [];
  
  // Lidar com diferentes formatos de metadados de paginação
  const meta = apiResponse.meta ||
  apiResponse.pagination || {
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 10,
  };
  
  // Normalizar metadados
  const formattedMeta = {
    total: meta.total || 0,
    totalPages: meta.totalPages || meta.pages || 1,
    page: meta.page || meta.currentPage || 1,
    limit: meta.limit || meta.perPage || 10,
  };
  
  // Processar dados para exibição com formatação universal
  const formattedData = items.map((item: NotificacaoGenerica) => {
    // Recuperar informações mais relevantes para exibição em lista
    const pacienteNome = item.paciente?.nome || "N/A";
    const dataOcorrencia = item.data_ocorrencia
      ? formatarDataUniversal(item.data_ocorrencia)
      : "N/A";
    const tipoAtendimento = item.tipo_atendimento?.descricao || "N/A";
    const tipoEvento = item.tipo_evento?.descricao || "N/A";
    const tipoEncerramento = item.tipo_encerramento?.descricao || "N/A";
    
    return {
      id: item.idnotificacao,
      paciente: pacienteNome,
      dataOcorrencia,
      tipoAtendimento,
      tipoEvento,
      tipoEncerramento,
      // Manter o objeto original para acesso detalhado
      original: item,
    };
  });
  
  return {
    data: formattedData,
    meta: formattedMeta,
  };
};

/**
 * Extrai os IDs dos sintomas a partir de uma notificação formatada
 */
export const extractSintomasIds = (
  notificacao: NotificacaoGenerica
): number[] => {
  if (
    "sinaisESintomas" in notificacao &&
    Array.isArray(notificacao.sinaisESintomas)
  ) {
    return notificacao.sinaisESintomas.map((id: string) => parseInt(id));
  }
  if (
    "notificacao_has_tipo_sintoma" in notificacao &&
    Array.isArray(notificacao.notificacao_has_tipo_sintoma)
  ) {
    return notificacao.notificacao_has_tipo_sintoma.map(
      (item: any) => item.tipo_sintoma_idtipo_sintoma
    );
  }
  
  return [];
};

/**
 * Extrai os IDs das hipóteses diagnósticas a partir de uma notificação formatada
 */
export const extractHipoteseDiagnosticaIds = (
  notificacao: NotificacaoGenerica
): number[] => {
  if (
    "hipoteseDiagnostica" in notificacao &&
    Array.isArray(notificacao.hipoteseDiagnostica)
  ) {
    return notificacao.hipoteseDiagnostica.map((id: string) => parseInt(id));
  }
  if (notificacao.tipo_hipotese_diag_idtipo_hipotese_diag) {
    return [notificacao.tipo_hipotese_diag_idtipo_hipotese_diag];
  }
  
  return [];
};

/**
 * Extrai os IDs dos tipos de trauma a partir de uma notificação formatada
 */
export const extractTraumaIds = (
  notificacao: NotificacaoGenerica
): number[] => {
  if ("tipoTrauma" in notificacao && Array.isArray(notificacao.tipoTrauma)) {
    return notificacao.tipoTrauma.map((id: string) => parseInt(id));
  }
  if (notificacao.tipo_trauma_idtipo_trauma) {
    return [notificacao.tipo_trauma_idtipo_trauma];
  }
  
  return [];
};