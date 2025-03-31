// Interface genérica para entidades de notificação
interface NotificacaoGenerica {
    [key: string]: any; // Permite acessar qualquer propriedade
  }
  
  // Interface para os dados do formulário frontend
  import { FormData } from '@/features/notificationForms/NotificationForm';
  
  /**
   * Formata dados do backend para o formato esperado pelo frontend (FormData)
   * @param backendData Dados recebidos da API
   */
  export const formatFromBackend = (backendData: NotificacaoGenerica): FormData | null => {
    if (!backendData) return null;
    
    // Converter valores de surto e residente_belem para o formato do formulário
    const residenteBelem = backendData.residente_belem === 'S' ? "1" : 
                            backendData.residente_belem === 'N' ? "2" : "3";
    
    const relacionadoSurto = backendData.surto === 'S' ? "1" : "2";
    
    // Obter sintomas (tratando diferentes estruturas de dados possíveis)
    const sinaisESintomas: string[] = [];
    if (backendData.notificacao_has_tipo_sintoma && 
        Array.isArray(backendData.notificacao_has_tipo_sintoma)) {
      backendData.notificacao_has_tipo_sintoma.forEach((item: any) => {
        if (item.tipo_sintoma_idtipo_sintoma) {
          sinaisESintomas.push(item.tipo_sintoma_idtipo_sintoma.toString());
        }
      });
    }
    
    // Criar objeto de formulário com dados do backend
    const formData: FormData = {
      // Seção 1: Dados Gerais
      evento: backendData.tipo_evento_idtipo_evento?.toString() || "",
      publicoAtendido: backendData.tipo_publico_idtipo_publico?.toString() || "",
  
      // Seção 2: Procedência do indivíduo
      residenteBelem,
      bairro: backendData.bairro || "",
      municipio: backendData.tipo_municipio_idtipo_municipio?.toString() || "",
      uf: backendData.tipo_estado_idtipo_estado?.toString() || "",
      paisProcedencia: backendData.tipo_pais_idtipo_pais?.toString() || "",
      localHospedagem: backendData.local_hospedagem || "",
      contatoLocal: backendData.contato_local_hospedagem || "",
  
      // Seção 3: Identificação do indivíduo
      paciente: backendData.paciente?.nome || "",
      nomeMae: backendData.paciente?.nome_mae || "",
      dataNascimento: backendData.paciente?.data_nascimento 
        ? new Date(backendData.paciente.data_nascimento).toISOString().split('T')[0] 
        : "",
      idade: backendData.paciente?.idade?.toString() || "",
      cpf: backendData.paciente?.cpf || "",
      identidadeGenero: backendData.paciente?.tipo_genero_idtipo_genero?.toString() || "",
      gestante: backendData.paciente?.gestante === 'S' ? "1" : "2",
      raca: backendData.paciente?.tipo_raca_idtipo_raca?.toString() || "",
      escolaridade: backendData.paciente?.escolaridade_idescolaridade?.toString() || "",
      profissao: backendData.paciente?.cbo_idcbo?.toString() || "",
      profissaoSearch: "",
      showProfissaoOptions: false,
      contatoTelefonico: backendData.paciente?.contato || "",
  
      // Seção 4: Informações do atendimento
      tipoAtendimento: backendData.tipo_atendimento_idtipo_atendimento?.toString() || "",
      sinaisESintomas,
      dataInicioSintomas: backendData.data_inicio_sintomas 
        ? new Date(backendData.data_inicio_sintomas).toISOString().split('T')[0] 
        : "",
      observacaoSintomas: backendData.observacao_sintomas || "",
      hipoteseDiagnostica: backendData.tipo_hipotese_diag_idtipo_hipotese_diag 
        ? [backendData.tipo_hipotese_diag_idtipo_hipotese_diag.toString()] 
        : [],
      observacaoHipotese: backendData.observacao_hiposete || "",
      tipoTrauma: backendData.tipo_trauma_idtipo_trauma 
        ? [backendData.tipo_trauma_idtipo_trauma.toString()] 
        : [],
      dataOcorrencia: backendData.data_ocorrencia 
        ? new Date(backendData.data_ocorrencia).toISOString().split('T')[0] 
        : "",
      observacaoTrauma: backendData.observacao_trauma || "",
      relacionadoSurto,
      observacaoIncidente: backendData.observavao_incidente || "",
  
      // Seção 5: Informações da unidade notificadora
      dataAtendimento: backendData.data_atendimento 
        ? new Date(backendData.data_atendimento).toISOString().split('T')[0] 
        : "",
      unidadeNotificadora: backendData.estabelecimento_idestabelecimento?.toString() || "",
      nomeNotificador: backendData.nome_notificador || "",
      contatoNotificador: backendData.contato_notificador || "",
  
      // Seção 6: Encerramento do Caso
      dataEncerramento: backendData.data_encerramento 
        ? new Date(backendData.data_encerramento).toISOString().split('T')[0] 
        : "",
      tipoEncerramento: backendData.tipo_encerramento_idtipo_encerramento?.toString() || "",
      localEncaminhamento: backendData.local_encaminhamento || "",
    };
    
    return formData;
  };
  
  /**
   * Formata dados do frontend para o formato esperado pelo backend
   * @param frontendData Dados do formulário de frontend
   * @param isUpdate Indica se é uma atualização (true) ou criação (false)
   */
  export const formatToBackend = (frontendData: FormData, isUpdate: boolean = false): NotificacaoGenerica => {
    // Remover espaços em branco dos campos de string
    const trimFields = <T extends Record<string, any>>(data: T): T => {
      const result: Record<string, any> = {};
      
      Object.entries(data).forEach(([key, value]) => {
        result[key] = typeof value === 'string' ? value.trim() : value;
      });
      
      return result as T;
    };
    
    const trimmedData = trimFields(frontendData);
    
    // Converter valores específicos
    const residenteBelem = trimmedData.residenteBelem === "1" ? 'S' : 'N';
    const surto = trimmedData.relacionadoSurto === "1" ? 'S' : 'N';
    
    // Converter ID do paciente a partir do nome - isso exigirá lógica adicional
    // no componente para garantir que temos o ID real do paciente
    const pacienteId = trimmedData.paciente ? parseInt(trimmedData.paciente) : null;
    
    // Construir payload para o backend
    const payload: NotificacaoGenerica = {
      // Campos obrigatórios
      tipo_evento_idtipo_evento: parseInt(trimmedData.evento) || null,
      tipo_publico_idtipo_publico: parseInt(trimmedData.publicoAtendido) || null,
      paciente_idpaciente: pacienteId,
      residente_belem: residenteBelem,
      tipo_pais_idtipo_pais: parseInt(trimmedData.paisProcedencia) || null,
      tipo_atendimento_idtipo_atendimento: parseInt(trimmedData.tipoAtendimento) || null,
      data_ocorrencia: trimmedData.dataOcorrencia || new Date().toISOString().split('T')[0],
      surto,
      estabelecimento_idestabelecimento: parseInt(trimmedData.unidadeNotificadora) || null,
      tipo_encerramento_idtipo_encerramento: parseInt(trimmedData.tipoEncerramento) || null,
      
      // Campos opcionais - apenas adicionar se tiverem valor
      ...(trimmedData.bairro && { bairro: trimmedData.bairro }),
      ...(trimmedData.uf && { tipo_estado_idtipo_estado: parseInt(trimmedData.uf) || null }),
      ...(trimmedData.municipio && { tipo_municipio_idtipo_municipio: parseInt(trimmedData.municipio) || null }),
      ...(trimmedData.localHospedagem && { local_hospedagem: trimmedData.localHospedagem }),
      ...(trimmedData.contatoLocal && { contato_local_hospedagem: trimmedData.contatoLocal }),
      ...(trimmedData.dataInicioSintomas && { data_inicio_sintomas: trimmedData.dataInicioSintomas }),
      ...(trimmedData.observacaoSintomas && { observacao_sintomas: trimmedData.observacaoSintomas }),
      
      // Hipótese diagnóstica (primeiro item do array se existir)
      ...(trimmedData.hipoteseDiagnostica.length > 0 && { 
        tipo_hipotese_diag_idtipo_hipotese_diag: parseInt(trimmedData.hipoteseDiagnostica[0]) || null 
      }),
      
      ...(trimmedData.observacaoHipotese && { observacao_hiposete: trimmedData.observacaoHipotese }),
      
      // Tipo de trauma (primeiro item do array se existir)
      ...(trimmedData.tipoTrauma.length > 0 && { 
        tipo_trauma_idtipo_trauma: parseInt(trimmedData.tipoTrauma[0]) || null 
      }),
      
      ...(trimmedData.observacaoTrauma && { observacao_trauma: trimmedData.observacaoTrauma }),
      ...(trimmedData.observacaoIncidente && { observavao_incidente: trimmedData.observacaoIncidente }),
      ...(trimmedData.dataAtendimento && { data_atendimento: trimmedData.dataAtendimento }),
      ...(trimmedData.nomeNotificador && { nome_notificador: trimmedData.nomeNotificador }),
      ...(trimmedData.contatoNotificador && { contato_notificador: trimmedData.contatoNotificador }),
      ...(trimmedData.dataEncerramento && { data_encerramento: trimmedData.dataEncerramento }),
      ...(trimmedData.localEncaminhamento && { local_encaminhamento: trimmedData.localEncaminhamento }),
    };
    
    // Tratamento especial para sinais e sintomas - criar estrutura de relações
    if (trimmedData.sinaisESintomas.length > 0) {
      if (isUpdate) {
        // Para atualização, deletar todas relações existentes e criar novas
        payload.notificacao_has_tipo_sintoma = {
          deleteMany: {}, // Remove todas as relações existentes
          create: trimmedData.sinaisESintomas.map(id => ({
            tipo_sintoma_idtipo_sintoma: parseInt(id)
          }))
        };
      } else {
        // Para criação, apenas criar as relações
        payload.notificacao_has_tipo_sintoma = {
          create: trimmedData.sinaisESintomas.map(id => ({
            tipo_sintoma_idtipo_sintoma: parseInt(id)
          }))
        };
      }
    }
    
    return payload;
  };
  
  /**
   * Formata a resposta da API de listagem para o formato esperado pelo componente de tabela
   */
  export const formatListResponse = (apiResponse: any) => {
    if (!apiResponse?.data && !apiResponse?.items) {
      return { 
        data: [], 
        meta: { total: 0, totalPages: 1, page: 1, limit: 10 } 
      };
    }
    
    // Compatibilidade com diferentes formatos de resposta
    const items = apiResponse.data || apiResponse.items || [];
    
    // Lidar com diferentes formatos de metadados de paginação
    const meta = apiResponse.meta || apiResponse.pagination || { 
      total: 0, 
      totalPages: 1, 
      page: 1, 
      limit: 10 
    };
    
    // Normalizar metadados
    const formattedMeta = {
      total: meta.total || 0,
      totalPages: meta.totalPages || meta.pages || 1,
      page: meta.page || meta.currentPage || 1,
      limit: meta.limit || meta.perPage || 10
    };
    
    // Processar dados para exibição
    const formattedData = items.map((item: NotificacaoGenerica) => {
      // Recuperar informações mais relevantes para exibição em lista
      const pacienteNome = item.paciente?.nome || 'N/A';
      const dataOcorrencia = item.data_ocorrencia 
        ? new Date(item.data_ocorrencia).toLocaleDateString('pt-BR') 
        : 'N/A';
      const tipoAtendimento = item.tipo_atendimento?.descricao || 'N/A';
      const tipoEvento = item.tipo_evento?.descricao || 'N/A';
      const tipoEncerramento = item.tipo_encerramento?.descricao || 'N/A';
      
      return {
        id: item.idnotificacao,
        paciente: pacienteNome,
        dataOcorrencia,
        tipoAtendimento,
        tipoEvento,
        tipoEncerramento,
        // Manter o objeto original para acesso detalhado
        original: item
      };
    });
    
    return {
      data: formattedData,
      meta: formattedMeta
    };
  };
  
  /**
   * Extrai os IDs dos sintomas a partir de uma notificação formatada
   */
  export const extractSintomasIds = (notificacao: NotificacaoGenerica): number[] => {
    if ('sinaisESintomas' in notificacao && Array.isArray(notificacao.sinaisESintomas)) {
      return notificacao.sinaisESintomas.map((id: string) => parseInt(id));
    }
    
    if ('notificacao_has_tipo_sintoma' in notificacao && 
        Array.isArray(notificacao.notificacao_has_tipo_sintoma)) {
      return notificacao.notificacao_has_tipo_sintoma.map((item: any) => 
        item.tipo_sintoma_idtipo_sintoma);
    }
    
    return [];
  };
  
  /**
   * Extrai os IDs das hipóteses diagnósticas a partir de uma notificação formatada
   */
  export const extractHipoteseDiagnosticaIds = (notificacao: NotificacaoGenerica): number[] => {
    if ('hipoteseDiagnostica' in notificacao && Array.isArray(notificacao.hipoteseDiagnostica)) {
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
  export const extractTraumaIds = (notificacao: NotificacaoGenerica): number[] => {
    if ('tipoTrauma' in notificacao && Array.isArray(notificacao.tipoTrauma)) {
      return notificacao.tipoTrauma.map((id: string) => parseInt(id));
    }
    
    if (notificacao.tipo_trauma_idtipo_trauma) {
      return [notificacao.tipo_trauma_idtipo_trauma];
    }
    
    return [];
  };