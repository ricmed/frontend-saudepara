// notificacaoAdapter.ts - VERSÃO ATUALIZADA com suporte a arquivos

// Interface genérica para entidades de notificação
interface NotificacaoGenerica {
  [key: string]: any;
}

// Interface para os dados do formulário frontend
import { type FormData, ArquivoFormulario, detectUserTimezone, formatDateWithTimezone } from '@/features/notificationForms/types/index2';
import { formatLocalDateForBackend } from './timezoneHelper';
import axios from "axios";
// import indexedDBService from '@/services/indexedDB'; // COMENTADO - SERÁ USADO NO FUTURO
// import syncService from '@/services/syncService';     // COMENTADO - SERÁ USADO NO FUTURO
import { toast } from 'react-toastify';
import { calcularIdadeAutomatica } from '@/features/notificationForms/hooks/useNotificationForm';

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
  // Pega apenas a parte da data, ignorando o fuso horário
  return dateString.split("T")[0];
};

// 🆕 FUNÇÃO OTIMIZADA: Processar data com timezone para envio ao backend
const processarDataParaUTC = (
  dateString: string | null | undefined, 
  timezone_name?: string, 
  timezone_offset_minutos?: number
): string => {
  if (!dateString) return "";
  
  try {
    // Usar a função helper otimizada
    const resultado = formatLocalDateForBackend(dateString, timezone_name, timezone_offset_minutos);
    console.log(`🔄 processarDataParaUTC: ${dateString} -> ${resultado}`);
    return resultado;
  } catch (error) {
    console.error('Erro ao processar data para UTC:', error);
    
    // Fallback para a função anterior em caso de erro
    if (timezone_name || timezone_offset_minutos !== undefined) {
      const resultado = formatDateWithTimezone(dateString, timezone_name, timezone_offset_minutos);
      console.log(`🔄 processarDataParaUTC (fallback): ${dateString} -> ${resultado}`);
      return resultado;
    }
    
    // Se não tem timezone, tentar detectar automaticamente
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) || dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      const timezoneInfo = detectUserTimezone();
      const resultado = formatDateWithTimezone(dateString, timezoneInfo.timezone_name, timezoneInfo.timezone_offset_minutos);
      console.log(`🔄 processarDataParaUTC (auto-detect): ${dateString} -> ${resultado}`);
      return resultado;
    }
    
    // Fallback final: retornar como está
    console.log(`🔄 processarDataParaUTC (sem alteração): ${dateString}`);
    return dateString;
  }
};

/**
 * Formata dados do backend para o formato esperado pelo frontend (FormData)
 * ✅ CORRIGIDO: Agora processa a lista de arquivos recebida diretamente.
 * @param backendData Dados recebidos da API
 */
export const formatFromBackend = async (
  backendData: any // Usando 'any' para flexibilidade com os dados da API
): Promise<FormData | null> => {
  if (!backendData) return null;

  console.log("[ADAPTER] Dados recebidos do backend para formatação:", backendData);

  // Converter valores de residente_belem para o formato do formulário
  const residenteBelem =
    backendData.residente_belem === "S"
      ? "1"
      : backendData.residente_belem === "N"
      ? "2"       : "3";

  // Buscar sintomas com método melhorado e aguardar resultado
  const sinaisESintomas = await extractSintomasStrings(backendData);
  console.log("Sintomas extraídos:", sinaisESintomas);
  
  // Buscar hipóteses diagnósticas com suporte a múltiplas
  const hipotesesDiagnosticas = await formatFromBackendHipoteses(backendData);
  console.log("Hipóteses extraídas:", hipotesesDiagnosticas);
  
  // Buscar local de encaminhamento
  let localEncaminhamento = extractLocalEncaminhamento(backendData);
  
  // ✅ CORREÇÃO: Mapear diretamente os arquivos que vêm com a notificação.
  let arquivos: ArquivoFormulario[] = [];
  if (backendData.arquivos && Array.isArray(backendData.arquivos)) {
    const server = import.meta.env.VITE_API_SERVER;
    const port = import.meta.env.VITE_API_PORT;

    arquivos = backendData.arquivos.map((arquivo: any) => ({
      id: arquivo.id.toString(),
      nome: arquivo.nome_original || arquivo.nome || 'Arquivo sem nome',
      tamanho: arquivo.tamanho || 0,
      tipo: arquivo.tipo_mime || arquivo.tipo || 'application/octet-stream',
      url: `${server}:${port}/api/arquivos/${arquivo.id}/download`,
      isExisting: true, // Marcar como já existente no servidor
      status: 'uploaded' as const, // Definir o status como 'uploaded'
    }));
    
    console.log(`[ADAPTER] Mapeados ${arquivos.length} arquivos existentes da notificação.`);
  } else {
    console.log("[ADAPTER] Nenhum arquivo existente encontrado nos dados da notificação.");
  }
  
  let idade = "";
  let idadeMeses = "";
  let idadeUnidade: 'anos' | 'meses' = 'anos'; // Default

  // O backend agora envia a IDADE TOTAL EM MESES no campo 'idade'
  const totalMonthsFromBackend = backendData.paciente?.idade;

  if (totalMonthsFromBackend !== null && totalMonthsFromBackend !== undefined) {
    const totalMonths = Number(totalMonthsFromBackend);
    
    // Calcula anos e meses a partir do total de meses
    idade = Math.floor(totalMonths / 12).toString();
    idadeMeses = totalMonths.toString();
    
    // Define a unidade padrão para a UI
    idadeUnidade = totalMonths >= 12 ? 'anos' : 'meses';
    
    console.log(`Idade do backend (meses): ${totalMonths}. Convertido para: ${idade} anos e ${idadeMeses} meses. Unidade: ${idadeUnidade}`);
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
    idadeMeses,
    idadeUnidade,
    cpf: backendData.paciente?.cpf || "",
    identidadeGenero:
      backendData.paciente?.tipo_genero_idtipo_genero?.toString() || "",
    gestante: backendData.paciente?.gestante || "",   // ✅ mantém "S" ou "N" conforme veio do backend
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
    hipoteseDiagnostica: hipotesesDiagnosticas,
    observacaoHipotese: backendData.observacao_hiposete || "",
    // 🔧 CORREÇÃO: Extrair múltiplos traumas do array notificacao_has_tipo_trauma
    tipoTrauma: backendData.notificacao_has_tipo_trauma && Array.isArray(backendData.notificacao_has_tipo_trauma)
      ? backendData.notificacao_has_tipo_trauma.map((trauma: any) => trauma.tipo_trauma_idtipo_trauma.toString())
      : (backendData.tipo_trauma_idtipo_trauma ? [backendData.tipo_trauma_idtipo_trauma.toString()] : []),
    observacaoTrauma: backendData.observacao_trauma || "",
    relacionadoSurto: "", // REMOVIDO: campo relacionadoSurto não é mais usado
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
    
    // 🆕 NOVA SEÇÃO 7: Arquivos Anexos
    arquivos: arquivos,

    // 🆕 CAMPOS DE TIMEZONE (se existirem no backend)
    timezone_name: backendData.timezone_name || undefined,
    timezone_offset_minutos: backendData.timezone_offset_minutos !== undefined ? 
      backendData.timezone_offset_minutos : undefined,

    // 🆕 CAMPOS DE AUDITORIA (se existirem no backend)
    created_at: backendData.created_at || undefined,
    updated_at: backendData.updated_at || undefined,
    created_by_userid: backendData.created_by_userid || undefined,
    updated_by_userid: backendData.updated_by_userid || undefined,
  };
  
  console.log("FormData processado:", {
    contatoTelefonico: formData.contatoTelefonico,
    contatoNotificador: formData.contatoNotificador,
    sinaisESintomas: formData.sinaisESintomas,
    hipoteseDiagnostica: formData.hipoteseDiagnostica,
    localEncaminhamento: formData.localEncaminhamento,
    tipoEncerramento: formData.tipoEncerramento,
    arquivos: formData.arquivos.length // 🆕 LOG DOS ARQUIVOS
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

  const pacienteId = trimmedData.pacienteId ? Number(trimmedData.pacienteId) : null;

  // *** LÓGICA MELHORADA PARA PROCESSAR IDADE EM MESES ***
  let idadeParaBackend = null;
  
  if (trimmedData.dataNascimento && trimmedData.dataNascimento.trim() !== '') {
    // Se há data de nascimento, recalcular idade para garantir precisão
    const idadeCalculada = calcularIdadeAutomatica(trimmedData.dataNascimento);
    idadeParaBackend = parseInt(idadeCalculada.idadeMeses) || null;
    console.log(`Idade calculada a partir da data de nascimento: ${idadeParaBackend} meses`);
  } else if (trimmedData.idadeMeses && trimmedData.idadeMeses.trim() !== '') {
    // Se não há data de nascimento mas há idade em meses
    idadeParaBackend = parseInt(trimmedData.idadeMeses);
    console.log(`Usando idade em meses informada: ${idadeParaBackend} meses`);
  } else if (trimmedData.idade && trimmedData.idade.trim() !== '') {
    // Se só há idade em anos, converter para meses
    idadeParaBackend = parseInt(trimmedData.idade) * 12;
    console.log(`Convertendo idade em anos para meses: ${trimmedData.idade} anos = ${idadeParaBackend} meses`);
  }

  console.log(`Idade final para o backend: ${idadeParaBackend} meses`);

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

  // 🆕 LOG DOS ARQUIVOS NO ENVIO
  console.log("Arquivos no formulário para envio:", {
    total: trimmedData.arquivos?.length || 0,
    novos: trimmedData.arquivos?.filter(a => !a.isExisting).length || 0,
    existentes: trimmedData.arquivos?.filter(a => a.isExisting).length || 0
  });

  // 🔧 CORREÇÃO: Detectar timezone automaticamente se não estiver presente
  const timezoneInfo = trimmedData.timezone_name && trimmedData.timezone_offset_minutos !== undefined
    ? { timezone_name: trimmedData.timezone_name, timezone_offset_minutos: trimmedData.timezone_offset_minutos }
    : detectUserTimezone();

  console.log('🌍 Timezone detectado para envio:', timezoneInfo);

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
    estabelecimento_idestabelecimento: parseInt(trimmedData.unidadeNotificadora) || null,
    tipo_encerramento_idtipo_encerramento: parseInt(trimmedData.tipoEncerramento) || null,
    // Adiciona campo surto com valor padrão
    surto: "N",

    // 🆕 CAMPOS DE TIMEZONE: SEMPRE incluir informações de timezone detectadas
    timezone_name: timezoneInfo.timezone_name,
    timezone_offset_minutos: timezoneInfo.timezone_offset_minutos,

    // IMPORTANTE: Adicione estes campos sempre, mesmo que vazios
    observavao_incidente: trimmedData.observacaoIncidente || "",
    observacao_sintomas: trimmedData.observacaoSintomas || "",
    observacao_hiposete: trimmedData.observacaoHipotese || "",
    observacao_trauma: trimmedData.observacaoTrauma || "",

    ddi: trimmedData.ddi || "55", // Adicionar o campo ddi

    // Adicionar telefone do paciente no payload para notificações novas
    // Para edições este campo não deve ser enviado pois não faz parte da tabela de notificação
    ...(isUpdate ? {} : { contato_paciente: trimmedData.contatoTelefonico || "" }),

    // *** ADICIONAR IDADE EM MESES PARA O BACKEND ***
    ...(idadeParaBackend !== null && { idade_paciente_meses: idadeParaBackend }),

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
      data_inicio_sintomas: processarDataParaUTC(
        trimmedData.dataInicioSintomas,
        timezoneInfo.timezone_name,
        timezoneInfo.timezone_offset_minutos
      ),
    }),
    ...(trimmedData.observacaoSintomas && {
      observacao_sintomas: trimmedData.observacaoSintomas || "",
    }),
    tipo_hipotese_diag_idtipo_hipotese_diag: 
      trimmedData.hipoteseDiagnostica.length > 0
        ? parseInt(trimmedData.hipoteseDiagnostica[0]) || null
        : null,
    ...(trimmedData.observacaoHipotese && {
      observacao_hiposete: trimmedData.observacaoHipotese || "",
    }),
    // 🔧 CORREÇÃO: Enviar traumas como array para suporte a múltiplos traumas
    ...(trimmedData.tipoTrauma.length > 0 && {
      traumas: trimmedData.tipoTrauma.map(trauma => parseInt(trauma))
    }),
    ...(trimmedData.observacaoTrauma && {
      observacao_trauma: trimmedData.observacaoTrauma || "",
    }),
    ...(trimmedData.observacaoIncidente && {
      observavao_incidente: trimmedData.observacaoIncidente || "",
    }),
    ...(trimmedData.dataAtendimento && {
      data_atendimento: processarDataParaUTC(
        trimmedData.dataAtendimento,
        timezoneInfo.timezone_name,
        timezoneInfo.timezone_offset_minutos
      ),
    }),
    ...(trimmedData.nomeNotificador && {
      nome_notificador: trimmedData.nomeNotificador,
    }),
    ...(trimmedData.contatoNotificador && {
      contato_notificador: trimmedData.contatoNotificador.substring(0, 15)
    }),
    ...(trimmedData.dataEncerramento && {
      data_encerramento: processarDataParaUTC(
        trimmedData.dataEncerramento,
        timezoneInfo.timezone_name,
        timezoneInfo.timezone_offset_minutos
      ),
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
 * 🆕 NOVA FUNÇÃO: Processar upload de arquivos de uma notificação
 * @param notificacaoId ID da notificação
 * @param arquivos Array de arquivos do formulário
 */
export const processarArquivosNotificacao = async (
  notificacaoId: number,
  arquivos: ArquivoFormulario[]
): Promise<void> => {
  console.log('\n🚀 ===== UPLOAD DE ARQUIVOS (LÓGICA CENTRALIZADA) =====');
  console.log('📋 Notificação ID:', notificacaoId);
  console.log('📁 Total de arquivos no formData:', arquivos.length);
  console.log('💾 Storage disponível no início:', (window as any).fileStorage?.size || 0);

  const arquivosNovos = arquivos.filter(arquivo => !arquivo.isExisting);
  console.log(`🆕 Encontrados ${arquivosNovos.length} arquivos novos para upload.`);

  if (arquivosNovos.length === 0) {
    console.log('📭 Nenhum arquivo novo para enviar. Finalizando.');
    return;
  }

  if (!(window as any).fileStorage) {
    console.error('❌ ERRO CRÍTICO: window.fileStorage não existe no momento do upload!');
    throw new Error('O sistema de armazenamento de arquivos não foi inicializado.');
  }

  const formDataApi = new FormData();
  let arquivosAnexadosContador = 0;

  for (const arquivo of arquivosNovos) {
    console.log(`\n🔍 Processando para anexo: ${arquivo.nome} (ID: ${arquivo.id})`);

    if (!arquivo.id) {
      console.warn(`    L ⚠️ Arquivo [${arquivo.nome}] sem ID, será ignorado.`);
      continue;
    }

    const file = (window as any).fileStorage.get(arquivo.id);

    if (file instanceof File) {
      // O nome do campo 'arquivos' DEVE corresponder ao esperado pelo seu backend (multer)
      formDataApi.append('arquivos', file, file.name);
      arquivosAnexadosContador++;
      console.log(`    L ✅ Anexado ao FormData: ${file.name}`);
    } else {
      console.error(`    L ❌ ERRO: Não foi possível encontrar o File para o ID [${arquivo.id}]. Tipo encontrado: ${typeof file}`);
    }
  }

  if (arquivosAnexadosContador === 0) {
    console.error('❌ ERRO CRÍTICO: Nenhum arquivo válido foi anexado ao FormData, apesar de haver arquivos novos. O upload será abortado.');
    throw new Error('Falha ao encontrar os arquivos para upload. Por favor, adicione-os novamente.');
  }

  console.log(`\n📦 FormData final pronto com ${arquivosAnexadosContador} arquivo(s). Enviando para o backend...`);

  try {
    const server = import.meta.env.VITE_API_SERVER;
    const port = import.meta.env.VITE_API_PORT;
    const url = `${server}:${port}/api/notificacao/${notificacaoId}/arquivos`;

    await axios.post(url, formDataApi, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 // Timeout de 2 minutos para uploads
    });

    console.log('✅ Upload concluído com sucesso!');

    // Limpar apenas os arquivos que foram enviados com sucesso
    arquivosNovos.forEach(arquivo => {
      if (arquivo.id) {
        (window as any).fileStorage.delete(arquivo.id);
      }
    });
    console.log('🧹 Storage limpo após o upload.');

  } catch (error) {
    console.error('❌ ERRO DURANTE O UPLOAD PARA A API:', error);
    // Lançar o erro novamente para que a função `salvarNotificacaoCompleta` possa capturá-lo
    throw new Error('Falha ao enviar arquivos para o servidor.');
  }
};

/**
 * Função principal para salvar uma notificação completa (incluindo sintomas e arquivos)
 * Versão atualizada com suporte a arquivos e exclusão
 * @param formData Dados do formulário (agora com arquivos_para_excluir)
 * @param isUpdate Indica se é uma atualização
 * @param notificacaoId ID da notificação (apenas para atualizações)
 */
export const salvarNotificacaoCompleta = async (
  formData: any, // Usando 'any' para acomodar o novo campo arquivos_para_excluir
  isUpdate: boolean = false,
  notificacaoId?: number
): Promise<any> => {
  
  console.log("DADOS DO FORM ANTES DE ENVIAR:", formData);
  console.log("Dados antes de salvar - Tipo residente:", formData.residenteBelem, "País:", formData.paisProcedencia);
  
  const server = import.meta.env.VITE_API_SERVER;
  const port = import.meta.env.VITE_API_PORT;
  
  // Verificar campos obrigatórios
  if (!formData.evento) console.warn("Campo obrigatório ausente: evento");
  if (!formData.publicoAtendido) console.warn("Campo obrigatório ausente: publicoAtendido");
  if (!formData.pacienteId) console.warn("Campo obrigatório ausente: pacienteId");
  if (!formData.residenteBelem) console.warn("Campo obrigatório ausente: residenteBelem");
  if (!formData.paisProcedencia) console.warn("Campo obrigatório ausente: paisProcedencia");
  if (!formData.tipoAtendimento) console.warn("Campo obrigatório ausente: tipoAtendimento");
  if (!formData.tipoEncerramento) console.warn("Campo obrigatório ausente: tipoEncerramento");
  
  // Formatar dados para o backend
  const payloadBackend = formatToBackend(formData, isUpdate);
  
  console.log("PAYLOAD APÓS FORMATAÇÃO:", payloadBackend);
  
  try {
    let response;
    let savedNotificacaoId;
    
    if (isUpdate && notificacaoId) {
      // Atualizar notificação existente
      console.log(`Enviando atualização para notificação ${notificacaoId}:`, JSON.stringify(payloadBackend, null, 2));
      
      // Ajustes adicionais para o payload de atualização (se necessário)
      // Garantir que o ID do paciente está correto
      if (!payloadBackend.paciente_idpaciente) {
        console.error("ERRO: ID do paciente ausente na atualização!");
      }
      
      // ✅ NOVO: Usar axios diretamente para manter compatibilidade
      response = await axios.put(`${server}:${port}/api/notificacao/${notificacaoId}`, payloadBackend);
      savedNotificacaoId = notificacaoId;
    } else {
      // Criar nova notificação
      console.log("Enviando notificação para criação:", JSON.stringify(payloadBackend, null, 2));
      
      // Verificações específicas para criação
      if (!payloadBackend.paciente_idpaciente) {
        console.error("ERRO: ID do paciente é obrigatório para criar notificação!");
        throw new Error("ID do paciente não informado");
      }
      
      if (!payloadBackend.tipo_evento_idtipo_evento) {
        console.error("ERRO: Tipo de evento é obrigatório!");
        throw new Error("Tipo de evento não informado");
      }
      
      if (!payloadBackend.tipo_publico_idtipo_publico) {
        console.error("ERRO: Público atendido é obrigatório!");
        throw new Error("Público atendido não informado");
      }
      
      if (!payloadBackend.tipo_encerramento_idtipo_encerramento) {
        console.error("ERRO: Tipo de encerramento é obrigatório!");
        throw new Error("Tipo de encerramento não informado");
      }
      
      try {
        // ✅ NOVO: Usar axios diretamente para manter compatibilidade
        response = await axios.post(`${server}:${port}/api/notificacao`, payloadBackend);
        savedNotificacaoId = response.data.idnotificacao;
        console.log(`Notificação criada com ID: ${savedNotificacaoId}`);
      } catch (postError: any) {
        // Log mais detalhado do erro de POST
        console.error("Erro detalhado na criação:", postError);
        console.error("Status:", postError.response?.status);
        console.error("Erro completo:", JSON.stringify(postError.response?.data || {}, null, 2));
        
        if (postError.response?.data?.errors) {
          console.error("Campos com erro:", postError.response.data.errors);
        }
        
        throw postError; // Repassar o erro
      }
    }

    // Extrair IDs dos sintomas do formulário
    const sintomasIds = formData.sinaisESintomas?.map((id: any) => parseInt(id)) || [];
    
    // Extrair IDs das hipóteses do formulário
    const hipotesesIds = formData.hipoteseDiagnostica?.map((id: any) => parseInt(id)) || [];
    
    // Chamar função para salvar sintomas em endpoint separado
    if (sintomasIds.length > 0 || isUpdate) {
      try {
        await salvarSintomasViaApi(savedNotificacaoId, sintomasIds);
      } catch (error) {
        console.error("Erro ao salvar sintomas:", error);
        toast.warning('Notificação salva, mas houve erro ao salvar sintomas.');
      }
    }
    
    // Chamar função para salvar hipóteses em endpoint separado
    if (hipotesesIds.length > 0 || isUpdate) {
      try {
        await salvarHipotesesViaApi(savedNotificacaoId, hipotesesIds);
      } catch (error) {
        console.error("Erro ao salvar hipóteses:", error);
        toast.warning('Notificação salva, mas houve erro ao salvar hipóteses diagnósticas.');
      }
    }
    
    // ✅ NOVO: Processar exclusão de arquivos ANTES do upload de novos
    // Esta lógica processa a lista de IDs de arquivos que foram marcados para exclusão
    // no hook useNotificationForm e os remove do servidor
    if (formData.arquivos_para_excluir && formData.arquivos_para_excluir.length > 0) {
      try {
        console.log(`[ADAPTER] Solicitando exclusão de ${formData.arquivos_para_excluir.length} arquivos:`, formData.arquivos_para_excluir);
        
        // Excluir arquivos individualmente
        // Nota: Pode ser otimizado para operação em batch no futuro
        for (const arquivoId of formData.arquivos_para_excluir) {
          try {
            await axios.delete(`${server}:${port}/api/arquivos/${arquivoId}`);
            console.log(`[ADAPTER] ✅ Arquivo ID ${arquivoId} excluído com sucesso.`);
          } catch (deleteError) {
            console.error(`[ADAPTER] ❌ Erro ao excluir arquivo ID ${arquivoId}:`, deleteError);
            // Continua tentando excluir os outros arquivos mesmo se um falhar
          }
        }
        
        console.log(`[ADAPTER] Processamento de exclusão concluído.`);
      } catch (error) {
        console.error("Erro ao excluir arquivos antigos:", error);
        toast.warning('Notificação salva, mas houve erro ao remover alguns arquivos antigos.');
      }
    }
    
    // ✅ NOVO: Processar upload de novos arquivos
    if (formData.arquivos && formData.arquivos.length > 0) {
      try {
        // Filtrar apenas arquivos novos (não existentes)
        const novosArquivos = formData.arquivos.filter((a: ArquivoFormulario) => !a.isExisting);
        
        if (novosArquivos.length > 0) {
          console.log(`[ADAPTER] Processando upload de ${novosArquivos.length} novos arquivos.`);
          await processarArquivosNotificacao(savedNotificacaoId, novosArquivos);
        } else {
          console.log('[ADAPTER] Nenhum arquivo novo para upload.');
        }
      } catch (error) {
        console.error("Erro ao processar arquivos:", error);
        toast.warning('Notificação salva, mas houve erro ao processar arquivos anexados.');
      }
    }
    
    toast.success('Notificação salva com sucesso!');
    return response.data || response;
  } catch (error: any) {
    console.error("Erro ao salvar notificação:", error);
    
    // Log detalhado do erro para diagnóstico
    if (error.response) {
      console.error("Detalhes da resposta de erro:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data, null, 2)
      });
      
      // Mostra exatamente quais campos têm problemas
      if (error.response.data?.errors) {
        console.error("Erros por campo:", error.response.data.errors);
        const errorFields = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors
          : [error.response.data.errors];
          
        errorFields.forEach((err: any) => {
          // Mostrar detalhes de cada campo com erro
          if (err.field && err.message) {
            console.error(`Erro no campo ${err.field}: ${err.message}`);
          } else {
            console.error("Erro não estruturado:", err);
          }
        });
      }
      
      // Mostrar mensagem específica do erro
      if (error.response.data?.message) {
        toast.error(`Erro: ${error.response.data.message}`);
      } else {
        toast.error('Erro ao salvar a notificação. Por favor, tente novamente.');
      }
    } else {
      toast.error('Erro de comunicação com o servidor. Verifique sua conexão.');
    }
    
    throw error;
  }
};

/**
 * Função para buscar notificação do servidor
 * Versão simplificada sem suporte offline
 * @param id ID da notificação
 */
export const buscarNotificacao = async (id: number): Promise<FormData | null> => {
  try {
    const server = import.meta.env.VITE_API_SERVER;
    const port = import.meta.env.VITE_API_PORT;
    
    const response = await axios.get(`${server}:${port}/api/notificacao/${id}`);
    return await formatFromBackend(response.data);
  } catch (error) {
    console.error('Erro ao buscar notificação:', error);
    toast.error('Erro ao buscar dados da notificação.');
    throw error;
  }
};

/**
 * Função auxiliar para buscar sintomas via API quando necessário
 */
async function fetchSintomasForNotificacao(notificacaoId: number): Promise<any[]> {
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
 * Extrai os IDs das hipóteses diagnósticas a partir de uma notificação formatada (ATUALIZADA)
 */
export const extractHipotesesIds = (notificacao: NotificacaoGenerica): number[] => {
  if ("hipoteseDiagnostica" in notificacao && Array.isArray(notificacao.hipoteseDiagnostica)) {
    return notificacao.hipoteseDiagnostica.map((id: string) => parseInt(id));
  }
  
  // Verificar estrutura has_hipotese (múltiplas)
  if (notificacao.notificacao_has_hipotese_diag && Array.isArray(notificacao.notificacao_has_hipotese_diag)) {
    return notificacao.notificacao_has_hipotese_diag.map((item: any) => 
      item.tipo_hipotese_diag_idtipo_hipotese_diag || item.tipo_hipotese_diag?.idtipo_hipotese_diag
    ).filter(id => id !== undefined);
  }
  
  // Fallback para campo single (compatibilidade)
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
  // Primeiro, tentar extrair do campo formatado para frontend
  if ("tipoTrauma" in notificacao && Array.isArray(notificacao.tipoTrauma)) {
    return notificacao.tipoTrauma.map((id: string) => parseInt(id));
  }
  
  // 🔧 CORREÇÃO: Extrair do array notificacao_has_tipo_trauma (novo formato)
  if (notificacao.notificacao_has_tipo_trauma && Array.isArray(notificacao.notificacao_has_tipo_trauma)) {
    return notificacao.notificacao_has_tipo_trauma.map((trauma: any) => trauma.tipo_trauma_idtipo_trauma);
  }
  
  // Fallback para campo single (compatibilidade com dados antigos)
  if (notificacao.tipo_trauma_idtipo_trauma) {
    return [notificacao.tipo_trauma_idtipo_trauma];
  }
  
  return [];
};

/**
 * Extrai hipóteses diagnósticas de uma notificação (suporte a múltiplas)
 */
export const formatFromBackendHipoteses = async (backendData: any): Promise<string[]> => {
  const hipoteses: string[] = [];
  
  console.log("🔍 Buscando hipóteses em:", Object.keys(backendData));
  
  // CORREÇÃO: Nome correto do campo é notificacao_has_tipo_hipotese_diag
  if (backendData.notificacao_has_tipo_hipotese_diag && 
      Array.isArray(backendData.notificacao_has_tipo_hipotese_diag)) {
    
    console.log("✅ Encontradas múltiplas hipóteses:", backendData.notificacao_has_tipo_hipotese_diag.length);
    
    backendData.notificacao_has_tipo_hipotese_diag.forEach((item: any) => {
      let hipoteseId = null;
      
      if (item.tipo_hipotese_diag_idtipo_hipotese_diag) {
        hipoteseId = item.tipo_hipotese_diag_idtipo_hipotese_diag;
      } else if (item.tipo_hipotese_diag?.idtipo_hipotese_diag) {
        hipoteseId = item.tipo_hipotese_diag.idtipo_hipotese_diag;
      }
      
      if (hipoteseId) {
        hipoteses.push(hipoteseId.toString());
        console.log(`✅ Hipótese múltipla encontrada: ID ${hipoteseId} - ${item.tipo_hipotese_diag?.descricao || 'Sem descrição'}`);
      }
    });
  }
  
  // Se não há estrutura múltipla, verificar campo single (compatibilidade)
  if (hipoteses.length === 0 && backendData.tipo_hipotese_diag_idtipo_hipotese_diag) {
    hipoteses.push(backendData.tipo_hipotese_diag_idtipo_hipotese_diag.toString());
    console.log(`⚠️ Hipótese única encontrada (campo legacy): ${backendData.tipo_hipotese_diag_idtipo_hipotese_diag}`);
  }
  
  // Se ainda não temos hipóteses e há ID da notificação, buscar via API
  if (hipoteses.length === 0 && backendData.idnotificacao) {
    console.log(`🔍 Nenhuma hipótese encontrada para notificação ${backendData.idnotificacao}, tentando buscar via API...`);
    
    try {
      const hipotesesApi = await fetchHipotesesForNotificacao(backendData.idnotificacao);
      if (hipotesesApi.length > 0) {
        console.log("📡 Hipóteses buscadas via API:", hipotesesApi);
        hipotesesApi.forEach((hipotese: any) => {
          if (hipotese.idtipo_hipotese_diag) {
            hipoteses.push(hipotese.idtipo_hipotese_diag.toString());
          } else if (hipotese.tipo_hipotese_diag_idtipo_hipotese_diag) {
            hipoteses.push(hipotese.tipo_hipotese_diag_idtipo_hipotese_diag.toString());
          } else if (hipotese.tipo_hipotese_diag?.idtipo_hipotese_diag) {
            hipoteses.push(hipotese.tipo_hipotese_diag.idtipo_hipotese_diag.toString());
          }
        });
      }
    } catch (err) {
      console.error("❌ Erro ao buscar hipóteses:", err);
    }
  }
  
  console.log(`📊 Total de hipóteses extraídas: ${hipoteses.length}`, hipoteses);
  return hipoteses;
};

/**
 * Formata hipóteses para envio ao backend (suporte a múltiplas)
 */
export const formatToBackendHipoteses = (hipotesesIds: string[]) => {
  // Para compatibilidade com backend atual, ainda enviar a primeira como campo single
  const primeiraHipotese = hipotesesIds.length > 0 ? parseInt(hipotesesIds[0]) || null : null;
  
  // Preparar array de hipóteses para endpoint separado
  const todasHipoteses = hipotesesIds.map(id => parseInt(id)).filter(id => !isNaN(id));
  
  return {
    // Manter compatibilidade com campo single
    tipo_hipotese_diag_idtipo_hipotese_diag: primeiraHipotese,
    // Adicionar informação sobre múltiplas hipóteses
    hipoteses_para_salvar: todasHipoteses
  };
};

/**
 * Salva as hipóteses diagnósticas associadas a uma notificação via API separada
 * @param notificacaoId ID da notificação
 * @param hipotesesIds Array de IDs das hipóteses
 */
export const salvarHipotesesViaApi = async (notificacaoId: number, hipotesesIds: number[]): Promise<void> => {
  const server = import.meta.env.VITE_API_SERVER;
  const port = import.meta.env.VITE_API_PORT;
  
  try {
    await axios.post(`${server}:${port}/api/notificacao/${notificacaoId}/hipoteses`, {
      hipoteses: hipotesesIds
    });
    
    console.log(`Hipóteses salvas com sucesso para notificação ${notificacaoId}:`, hipotesesIds);
  } catch (error) {
    console.error(`Erro ao salvar hipóteses para notificação ${notificacaoId}:`, error);
    throw new Error('Falha ao salvar hipóteses diagnósticas. Por favor, tente novamente.');
  }
};

/**
 * Função auxiliar para buscar hipóteses via API quando necessário
 */
async function fetchHipotesesForNotificacao(notificacaoId: number): Promise<any[]> {
  const server = import.meta.env.VITE_API_SERVER;
  const port = import.meta.env.VITE_API_PORT;
  
  try {
    // ROTA CORRETA que você criou
    const response = await axios.get(`${server}:${port}/api/notificacao/${notificacaoId}/hipoteses-diagnosticas`);
    
    console.log("📡 Response da API de hipóteses:", response.data);
    
    // A rota retorna array direto
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Ou se vier dentro de data
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ Erro ao buscar hipóteses para notificação ${notificacaoId}:`, error);
    return [];
  }
}

/**
 * Função de compatibilidade - alias para extractHipotesesIds
 * @deprecated Use extractHipotesesIds instead
 */
export const extractHipoteseDiagnosticaIds = extractHipotesesIds;