// Definindo tipo genérico para entidades
interface EstabelecimentoGenerico {
  [key: string]: any; // Permite acessar qualquer propriedade
}

/**
 * Formata dados do backend para o formato esperado pelo frontend
 * @param backendData Dados recebidos da API
 */
export const formatFromBackend = (backendData: EstabelecimentoGenerico): EstabelecimentoGenerico | null => {
  if (!backendData) return null;
  
  // Criar objeto base copiando todas as propriedades originais
  const formattedData: EstabelecimentoGenerico = { ...backendData };
  
  // Adicionar aliases para o frontend, garantindo que sejam números ou null
if ('tipo_estabelecimento_idtipo_estabelecimento' in backendData) {
  formattedData.tipoEstabelecimentoId = backendData.tipo_estabelecimento_idtipo_estabelecimento !== undefined && backendData.tipo_estabelecimento_idtipo_estabelecimento !== null
    ? Number(backendData.tipo_estabelecimento_idtipo_estabelecimento)
    : null;
}

if ('tipo_natureza_idtipo_natureza' in backendData) {
  formattedData.tipoNaturezaId = backendData.tipo_natureza_idtipo_natureza !== undefined && backendData.tipo_natureza_idtipo_natureza !== null
    ? Number(backendData.tipo_natureza_idtipo_natureza)
    : null;
}

if ('tipo_turno_idtipo_turno' in backendData) {
  formattedData.tipoTurnoId = backendData.tipo_turno_idtipo_turno !== undefined && backendData.tipo_turno_idtipo_turno !== null
    ? Number(backendData.tipo_turno_idtipo_turno)
    : null;
}
  
  // Processar habilitações (se disponíveis)
  if (backendData.estabelecimento_has_tipo_habilitacao && 
    Array.isArray(backendData.estabelecimento_has_tipo_habilitacao)) {
  // Transformar para o formato que o componente DualSelectField espera
  formattedData.habilitacoes = backendData.estabelecimento_has_tipo_habilitacao.map((h: any) => ({
    id: h.tipo_habilitacao_idtipo_habilitacao,         // Esse campo é o que o frontend usa para comparação
    idtipo_habilitacao: h.tipo_habilitacao_idtipo_habilitacao,  // Esse campo é o que o backend precisa
    descricao: h.tipo_habilitacao?.descricao || '',
    codigo: h.tipo_habilitacao?.codigo || ''
  }));
} else {
  formattedData.habilitacoes = [];
}
  
  // Processar qualificações (se disponíveis)
  if (backendData.estabelecimento_has_tipo_qualificacao && 
      Array.isArray(backendData.estabelecimento_has_tipo_qualificacao)) {
    formattedData.qualificacoes = backendData.estabelecimento_has_tipo_qualificacao.map(
      (q: any) => q.tipo_qualificacao_idtipo_qualificacao
    );
  }
  
  // Preservar objetos de relacionamento e descrições
  if (backendData.tipo_estabelecimento) {
    // Preservar o objeto completo
    formattedData.tipo_estabelecimento = backendData.tipo_estabelecimento;
    
    // Adicionar descrição para compatibilidade com componentes
    if (!formattedData.tipo_estabelecimento_descricao && backendData.tipo_estabelecimento.descricao) {
      formattedData.tipo_estabelecimento_descricao = backendData.tipo_estabelecimento.descricao;
    }
  }
  
  if (backendData.tipo_natureza) {
    formattedData.tipo_natureza = backendData.tipo_natureza;
    
    if (!formattedData.tipo_natureza_descricao && backendData.tipo_natureza.descricao) {
      formattedData.tipo_natureza_descricao = backendData.tipo_natureza.descricao;
    }
  }
  
  if (backendData.tipo_turno) {
    formattedData.tipo_turno = backendData.tipo_turno;
    
    if (!formattedData.tipo_turno_descricao && backendData.tipo_turno.descricao) {
      formattedData.tipo_turno_descricao = backendData.tipo_turno.descricao;
    }
  }
  
  return formattedData;
};

/**
 * Formata dados do frontend para o formato esperado pelo backend
 * @param frontendData Dados do formulário de frontend
 * @param isUpdate Indica se é uma atualização (true) ou criação (false)
 */
export const formatToBackend = (frontendData: EstabelecimentoGenerico, isUpdate: boolean = false): EstabelecimentoGenerico => {
  // Remover espaços em branco dos campos de string
  const trimFields = (data: EstabelecimentoGenerico): EstabelecimentoGenerico => {
    const result: EstabelecimentoGenerico = {};
    
    Object.entries(data).forEach(([key, value]) => {
      result[key] = typeof value === 'string' ? value.trim() : value;
    });
    
    return result;
  };
  
  const trimmedData = trimFields(frontendData);
  
  // Construir payload base
  const payload: EstabelecimentoGenerico = {};
  
  // Copiar propriedades básicas
  if ('codigo_unidade' in trimmedData) payload.codigo_unidade = trimmedData.codigo_unidade || '';
  if ('nome' in trimmedData) payload.nome = trimmedData.nome || '';
  if ('cnes' in trimmedData) payload.cnes = trimmedData.cnes || '';
  if ('cnpj' in trimmedData) payload.cnpj = trimmedData.cnpj || '';
  if ('cidade' in trimmedData) payload.cidade = trimmedData.cidade || '';
  if ('logradouro' in trimmedData) payload.logradouro = trimmedData.logradouro || '';
  if ('bairro' in trimmedData) payload.bairro = trimmedData.bairro || '';
  if ('numero' in trimmedData) payload.numero = trimmedData.numero || '';
  if ('latitude' in trimmedData) payload.latitude = trimmedData.latitude || '';
  if ('longitude' in trimmedData) payload.longitude = trimmedData.longitude || '';
  if ('ativo' in trimmedData) payload.ativo = trimmedData.ativo || 'N';
  
  // Mapear IDs de tipos
  if ('tipo_estabelecimento_idtipo_estabelecimento' in trimmedData) {
    payload.tipo_estabelecimento_idtipo_estabelecimento = 
      Number(trimmedData.tipo_estabelecimento_idtipo_estabelecimento) || null;
  } else if ('tipoEstabelecimentoId' in trimmedData) {
    payload.tipo_estabelecimento_idtipo_estabelecimento = 
      Number(trimmedData.tipoEstabelecimentoId) || null;
  }
  
  if ('tipo_natureza_idtipo_natureza' in trimmedData) {
    payload.tipo_natureza_idtipo_natureza = 
      Number(trimmedData.tipo_natureza_idtipo_natureza) || null;
  } else if ('tipoNaturezaId' in trimmedData) {
    payload.tipo_natureza_idtipo_natureza = 
      Number(trimmedData.tipoNaturezaId) || null;
  }
  
  if ('tipo_turno_idtipo_turno' in trimmedData) {
    payload.tipo_turno_idtipo_turno = 
      Number(trimmedData.tipo_turno_idtipo_turno) || null;
  } else if ('tipoTurnoId' in trimmedData) {
    payload.tipo_turno_idtipo_turno = 
      trimmedData.tipoTurnoId ? Number(trimmedData.tipoTurnoId) : null;
  }
  
  // Processar habilitações para a estrutura de relação correta
  if ('habilitacoes' in trimmedData && Array.isArray(trimmedData.habilitacoes)) {
    // Para atualização, usar formato de deleteMany/create
    if (isUpdate) {
      payload.estabelecimento_has_tipo_habilitacao = {
        deleteMany: {}, // Remover todas as relações existentes
        create: trimmedData.habilitacoes.map((idOrItem: any) => {
          const id = typeof idOrItem === 'number' ? idOrItem : (idOrItem.idtipo_habilitacao || idOrItem.id);
          return {
            tipo_habilitacao_idtipo_habilitacao: Number(id)
          };
        })
      };
    } 
    // Para criação, usar apenas formato de create
    else {
      payload.estabelecimento_has_tipo_habilitacao = {
        create: trimmedData.habilitacoes.map((idOrItem: any) => {
          const id = typeof idOrItem === 'number' ? idOrItem : (idOrItem.idtipo_habilitacao || idOrItem.id);
          return {
            tipo_habilitacao_idtipo_habilitacao: Number(id)
          };
        })
      };
    }
  }
  
  // Processar qualificações para a estrutura de relação correta
  if ('qualificacoes' in trimmedData && Array.isArray(trimmedData.qualificacoes)) {
    // Para atualização, usar formato de deleteMany/create
    if (isUpdate) {
      payload.estabelecimento_has_tipo_qualificacao = {
        deleteMany: {}, // Remover todas as relações existentes
        create: trimmedData.qualificacoes.map((id: number) => ({
          tipo_qualificacao_idtipo_qualificacao: Number(id)
        }))
      };
    } 
    // Para criação, usar apenas formato de create
    else {
      payload.estabelecimento_has_tipo_qualificacao = {
        create: trimmedData.qualificacoes.map((id: number) => ({
          tipo_qualificacao_idtipo_qualificacao: Number(id)
        }))
      };
    }
  }
  
  return payload;
};

/**
 * Converte o valor de ativo para formato de exibição
 */
export const formatAtivo = (ativo: string): string => {
  return ativo === 'S' ? 'Sim' : 'Não';
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
  
  // Aqui está o problema - precisa verificar 'pagination' também!
  const meta = apiResponse.meta || apiResponse.pagination || { 
    total: 0, 
    totalPages: 1, 
    page: 1, 
    limit: 10 
  };
  
  // Se os campos estiverem em formato diferente, mapeá-los corretamente
  const formattedMeta = {
    total: meta.total || 0,
    totalPages: meta.totalPages || meta.pages || 1,
    page: meta.page || meta.currentPage || 1,
    limit: meta.limit || meta.perPage || 10
  };
  
  return {
    data: items.map((item: EstabelecimentoGenerico) => ({
      ...formatFromBackend(item),
      ativo: formatAtivo(item.ativo)
    })),
    meta: formattedMeta
  };
};

/**
 * Extrai os IDs de habilitações a partir de um estabelecimento formatado
 */
export const extractHabilitacoesIds = (estabelecimento: EstabelecimentoGenerico): number[] => {
  if ('habilitacoes' in estabelecimento && Array.isArray(estabelecimento.habilitacoes)) {
    return estabelecimento.habilitacoes.map((h: any) => 
      typeof h === 'number' ? h : h.tipo_habilitacao_idtipo_habilitacao
    );
  }
  
  if ('estabelecimento_has_tipo_habilitacao' in estabelecimento && 
      Array.isArray(estabelecimento.estabelecimento_has_tipo_habilitacao)) {
    return estabelecimento.estabelecimento_has_tipo_habilitacao.map((h: any) => 
      h.tipo_habilitacao_idtipo_habilitacao
    );
  }
  
  return [];
};

/**
 * Extrai os IDs de qualificações a partir de um estabelecimento formatado
 */
export const extractQualificacoesIds = (estabelecimento: EstabelecimentoGenerico): number[] => {
  if ('qualificacoes' in estabelecimento && Array.isArray(estabelecimento.qualificacoes)) {
    return estabelecimento.qualificacoes.map((q: any) => 
      typeof q === 'number' ? q : q.tipo_qualificacao_idtipo_qualificacao
    );
  }
  
  if ('estabelecimento_has_tipo_qualificacao' in estabelecimento && 
      Array.isArray(estabelecimento.estabelecimento_has_tipo_qualificacao)) {
    return estabelecimento.estabelecimento_has_tipo_qualificacao.map((q: any) => 
      q.tipo_qualificacao_idtipo_qualificacao
    );
  }
  
  return [];
};