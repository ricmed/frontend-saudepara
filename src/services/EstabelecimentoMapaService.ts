import axios, { AxiosError } from 'axios';

const API_URL = getApiUrl('/estabelecimentos');

console.log('🔧 EstabelecimentoMapaService - Configuração API:', {
  server,
  port,
  API_URL
});

// Interface para o estabelecimento do mapa (compatível com o tipo Local existente)
export interface EstabelecimentoMapa {
  idestabelecimento: number;
  nome: string;
  cnes?: string;
  cidade?: string;
  logradouro?: string;
  bairro?: string;
  numero?: string;
  latitude: string;
  longitude: string;
  tipo_estabelecimento?: {
    idtipo_estabelecimento: number;
    descricao: string;
  };
  tipo_natureza?: {
    idtipo_natureza: number;
    descricao: string;
  };
  tipo_turno?: {
    idtipo_turno: number;
    descricao: string;
  };
  estabelecimento_has_tipo_habilitacao?: Array<{
    tipo_habilitacao: {
      idtipo_habilitacao: number;
      descricao: string;
    };
  }>;
  estabelecimento_has_tipo_qualificacao?: Array<{
    tipo_qualificacao: {
      idtipo_qualificacao: number;
      descricao: string;
    };
  }>;
}

// Interface para o tipo Local usado no mapa
export interface Local {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  endereco?: string;
  habilitacoes: string[];
  qualificacoes: string[];
  natureza: string;
  turno: string;
  cnes?: string;
  cnpj?: string;
  codigo_unidade?: string;
  ativo: boolean;
}

interface APIError {
  status: string;
  message: string;
}

const handleApiError = (error: AxiosError<APIError>) => {
  console.error('API Error:', error);
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro ao carregar estabelecimentos. Tente novamente mais tarde.'
  );
};

// Função para converter EstabelecimentoMapa para Local (compatibilidade com o mapa)
const mapToLocal = (estabelecimento: EstabelecimentoMapa): Local => {
  const endereco = [
    estabelecimento.logradouro,
    estabelecimento.numero,
    estabelecimento.bairro
  ].filter(Boolean).join(', ');

  // Extrair habilitações
  const habilitacoes = estabelecimento.estabelecimento_has_tipo_habilitacao?.map(
    h => h.tipo_habilitacao.descricao
  ) || [];

  // Extrair qualificações
  const qualificacoes = estabelecimento.estabelecimento_has_tipo_qualificacao?.map(
    q => q.tipo_qualificacao.descricao
  ) || [];

  // Debug: Log dos dados sendo mapeados
  console.log('🔄 Mapeando estabelecimento:', {
    nome: estabelecimento.nome,
    endereco_raw: {
      logradouro: estabelecimento.logradouro,
      numero: estabelecimento.numero,
      bairro: estabelecimento.bairro,
      cidade: estabelecimento.cidade
    },
    endereco_final: endereco,
    tipo_natureza: estabelecimento.tipo_natureza,
    tipo_turno: estabelecimento.tipo_turno,
    habilitacoes_count: habilitacoes.length,
    qualificacoes_count: qualificacoes.length
  });

  return {
    id: estabelecimento.cnes || estabelecimento.idestabelecimento.toString(),
    nome: estabelecimento.nome,
    lat: parseFloat(estabelecimento.latitude),
    lng: parseFloat(estabelecimento.longitude),
    endereco: endereco || estabelecimento.cidade || '',
    habilitacoes,
    qualificacoes,
    natureza: estabelecimento.tipo_natureza?.descricao || 'Não informado',
    turno: estabelecimento.tipo_turno?.descricao || 'Não informado', // Agora vem da API
    cnes: estabelecimento.cnes || '',
    cnpj: '',
    codigo_unidade: '',
    ativo: true, // Já vem filtrado como ativo da API
    // Manter também o ID original do estabelecimento para referência
    idestabelecimento: estabelecimento.idestabelecimento
  };
};

export const EstabelecimentoMapaService = {
  /**
   * Busca todos os estabelecimentos ativos para exibir no mapa
   * Substitui a leitura do arquivo Excel
   */
  getEstabelecimentosParaMapa: async (): Promise<Local[]> => {
    try {
      console.log('🚀 EstabelecimentoMapaService - Iniciando carregamento...');
      console.log('📡 URL da API:', `${API_URL}/mapa`);
      
      const response = await axios.get<EstabelecimentoMapa[]>(`${API_URL}/mapa`);
      
      console.log('✅ Resposta da API recebida:', {
        status: response.status,
        dataLength: response.data.length,
        primeiro: response.data[0] ? response.data[0].nome : 'nenhum'
      });
      
      // Converter para o formato esperado pelo mapa
      const locais = response.data
        .filter(estabelecimento => 
          estabelecimento.latitude && 
          estabelecimento.longitude &&
          estabelecimento.latitude !== '' &&
          estabelecimento.longitude !== ''
        )
        .map(mapToLocal);

      console.log(`✅ Estabelecimentos processados: ${locais.length} com coordenadas válidas`);
      
      return locais;
    } catch (error) {
      console.error('❌ Erro ao carregar estabelecimentos:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Detalhes do erro Axios:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      // Em caso de erro, retornar array vazio em vez de lançar exceção
      return [];
    }
  },

  /**
   * Extrai habilitações únicas dos estabelecimentos carregados
   */
  getHabilitacoesUnicas: (estabelecimentos: Local[]): Array<{id: string, nome: string}> => {
    // Coletar todas as habilitações de todos os estabelecimentos
    const todasHabilitacoes = estabelecimentos.flatMap(e => e.habilitacoes);
    const habilitacoesUnicas = Array.from(new Set(todasHabilitacoes));
    
    return [
      { id: "todas", nome: "Todas as Habilitações" },
      ...habilitacoesUnicas.map(habilitacao => ({ id: habilitacao, nome: habilitacao }))
    ];
  },

  /**
   * Extrai qualificações únicas dos estabelecimentos carregados
   */
  getQualificacoesUnicas: (estabelecimentos: Local[]): Array<{id: string, nome: string}> => {
    // Coletar todas as qualificações de todos os estabelecimentos
    const todasQualificacoes = estabelecimentos.flatMap(e => e.qualificacoes);
    const qualificacoesUnicas = Array.from(new Set(todasQualificacoes));
    
    return [
      { id: "todas", nome: "Todas as Qualificações" },
      ...qualificacoesUnicas.map(qualificacao => ({ id: qualificacao, nome: qualificacao }))
    ];
  }
};
