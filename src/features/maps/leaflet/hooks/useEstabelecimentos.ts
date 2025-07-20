import { useState, useCallback } from 'react';
import { Local, TipoEstabelecimento } from '../types';
import { ListaDeEstabelecimentoService } from '@/services/ListaDeEstabelecimentoServ';

interface FiltrosEstabelecimentos {
  latitude?: number;
  longitude?: number;
  raio?: number; // em metros
  tipo?: string;
  natureza?: string;
  ativo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const useEstabelecimentos = () => {
  const [allPlaces, setAllPlaces] = useState<Local[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Local[]>([]);
  const [tiposEstabelecimentos, setTiposEstabelecimentos] = useState<TipoEstabelecimento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
    perPage: 20
  });

  // Converter dados do service para o formato do mapa
  const transformServiceData = useCallback((estabelecimentos: any[]): Local[] => {
    console.log('🔄 Transformando dados do service:', estabelecimentos.length);
    
    // Debug da estrutura completa do primeiro item
    if (estabelecimentos.length > 0) {
      console.log('📊 Estrutura do primeiro estabelecimento:', {
        ...estabelecimentos[0],
        // Mostrar apenas os campos principais para não poluir o log
        estabelecimento_has_tipo_habilitacao: estabelecimentos[0].estabelecimento_has_tipo_habilitacao?.length || 0,
        estabelecimento_has_tipo_qualificacao: estabelecimentos[0].estabelecimento_has_tipo_qualificacao?.length || 0
      });
    }
    
    return estabelecimentos
      .map(item => {
        // Debug dos dados recebidos (baseado na estrutura real do backend)
        console.log('📊 Item recebido:', {
          idestabelecimento: item.idestabelecimento,
          nome: item.nome,
          latitude: item.latitude,
          longitude: item.longitude,
          ativo: item.ativo,
          tipo: item.tipo_estabelecimento?.descricao,
          natureza: item.tipo_natureza?.descricao
        });

        // Converter coordenadas para números (no seu backend são strings)
        let lat = 0;
        let lng = 0;

        if (item.latitude && item.longitude) {
          lat = typeof item.latitude === 'string' ? parseFloat(item.latitude.trim()) : item.latitude;
          lng = typeof item.longitude === 'string' ? parseFloat(item.longitude.trim()) : item.longitude;
        }

        // Pular estabelecimentos sem coordenadas válidas
        if (!lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          console.warn('⚠️ Estabelecimento sem coordenadas válidas:', item.nome, { 
            latitude: item.latitude, 
            longitude: item.longitude,
            lat_convertido: lat, 
            lng_convertido: lng 
          });
          return null;
        }

        // Construir endereço
        const enderecoParts = [
          item.logradouro,
          item.numero,
          item.bairro,
          item.cidade
        ].filter(Boolean);
        
        const endereco = enderecoParts.length > 0 
          ? enderecoParts.join(', ') 
          : 'Endereço não informado';

        const local: Local = {
          id: item.idestabelecimento?.toString() || Math.random().toString(), // idestabelecimento é o campo correto
          nome: item.nome || 'Nome não informado',
          lat,
          lng,
          endereco,
          tipo: item.tipo_estabelecimento?.descricao || 'Não informado',
          natureza: item.tipo_natureza?.descricao || 'Não informado',
          turno: item.tipo_turno?.descricao || 'Não informado',
          cnes: item.cnes || '',
          ativo: item.ativo === 'S', // 'S' = ativo, 'N' = inativo
          // Campos adicionais
          cnpj: item.cnpj || '',
          codigo_unidade: item.codigo_unidade || ''
        };

        console.log('✅ Local transformado:', {
          id: local.id,
          nome: local.nome,
          lat: local.lat,
          lng: local.lng,
          tipo: local.tipo,
          natureza: local.natureza,
          ativo: local.ativo
        });

        return local;
      })
      .filter((item): item is Local => item !== null);
  }, []);

  // Carregar estabelecimentos usando o service existente
  const carregarEstabelecimentos = useCallback(async (filtros: FiltrosEstabelecimentos = {}) => {
    try {
      setIsLoading(true);
      
      console.log('📡 Carregando estabelecimentos via service...', filtros);

      // Usar o service existente para buscar todos os estabelecimentos
      const estabelecimentos = await ListaDeEstabelecimentoService.getAll();
      
      console.log('📊 Dados recebidos do service:', estabelecimentos.length);
      
      if (estabelecimentos.length === 0) {
        console.warn('⚠️ Nenhum estabelecimento retornado do service');
        setAllPlaces([]);
        setFilteredPlaces([]);
        return [];
      }

      // Transformar dados para formato do mapa (usar any[] para dados brutos)
      let locais = transformServiceData(estabelecimentos as any[]);
      
      console.log('✅ Locais transformados:', locais.length);
      
      // Aplicar filtro de localização (raio) se especificado
      if (filtros.latitude && filtros.longitude && filtros.raio) {
        console.log('🔍 Aplicando filtro de distância...', {
          center: [filtros.latitude, filtros.longitude],
          raio: filtros.raio
        });

        locais = filtrarPorDistancia(
          locais,
          filtros.latitude,
          filtros.longitude,
          filtros.raio
        );
        
        console.log('📍 Estabelecimentos após filtro de distância:', locais.length);
      }
      
      // Aplicar outros filtros se especificados
      if (filtros.tipo && filtros.tipo !== 'todos') {
        locais = locais.filter(est => est.tipo === filtros.tipo);
        console.log('🏥 Estabelecimentos após filtro de tipo:', locais.length);
      }
      
      if (filtros.natureza && filtros.natureza !== 'todos') {
        locais = locais.filter(est => est.natureza === filtros.natureza);
        console.log('🏛️ Estabelecimentos após filtro de natureza:', locais.length);
      }
      
      // ✅ COMENTADO TEMPORARIAMENTE - TODOS OS ESTABELECIMENTOS ESTÃO COMO 'N'
      // if (filtros.ativo !== undefined) {
      //   const ativoBoolean = filtros.ativo === 'S';
      //   locais = locais.filter(est => est.ativo === ativoBoolean);
      //   console.log('✅ Estabelecimentos após filtro de ativo:', locais.length);
      // } else {
      //   console.log('ℹ️ Exibindo todos os estabelecimentos (ativos e inativos):', locais.length);
      // }
      
      console.log('ℹ️ FILTRO DE ATIVO DESABILITADO - Exibindo todos os estabelecimentos:', locais.length);
      
      // Atualizar estados
      setAllPlaces(locais);
      setFilteredPlaces(locais);
      
      // Simular paginação
      setPagination({
        total: locais.length,
        pages: Math.ceil(locais.length / (filtros.limit || 100)),
        currentPage: filtros.page || 1,
        perPage: filtros.limit || 100
      });
      
      console.log('🎯 Resultado final:', {
        total: locais.length,
        comCoordenadas: locais.filter(l => l.lat && l.lng).length,
        tipos: [...new Set(locais.map(l => l.tipo))],
        naturezas: [...new Set(locais.map(l => l.natureza))]
      });
      
      return locais;
    } catch (error) {
      console.error('❌ Erro ao carregar estabelecimentos:', error);
      setAllPlaces([]);
      setFilteredPlaces([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [transformServiceData]);

  // Carregar tipos de estabelecimentos únicos
  const carregarTiposEstabelecimentos = useCallback(async () => {
    try {
      console.log('🏥 Carregando tipos de estabelecimentos...');
      
      // Buscar todos os estabelecimentos para extrair tipos únicos
      const estabelecimentos = await ListaDeEstabelecimentoService.getAll();
      
      console.log('📊 Estabelecimentos para extrair tipos:', estabelecimentos.length);
      
      // Extrair tipos únicos dos dados brutos
      const tiposUnicos = new Set<string>();
      
      (estabelecimentos as any[]).forEach(item => {
        if (item.tipo_estabelecimento?.descricao) {
          tiposUnicos.add(item.tipo_estabelecimento.descricao);
        }
      });
      
      const tipos: TipoEstabelecimento[] = [
        { id: 'todos', nome: 'Todos os Estabelecimentos' },
        ...Array.from(tiposUnicos)
          .sort()
          .map(tipo => ({ 
            id: tipo, 
            nome: tipo 
          }))
      ];
      
      console.log('✅ Tipos de estabelecimentos carregados:', tipos.length);
      console.log('📋 Tipos encontrados:', Array.from(tiposUnicos));
      
      setTiposEstabelecimentos(tipos);
      return tipos;
    } catch (error) {
      console.error('❌ Erro ao carregar tipos de estabelecimentos:', error);
      
      // Retornar tipos padrão em caso de erro
      const tiposDefault: TipoEstabelecimento[] = [
        { id: 'todos', nome: 'Todos os Estabelecimentos' }
      ];
      setTiposEstabelecimentos(tiposDefault);
      return tiposDefault;
    }
  }, []);

  // Buscar estabelecimentos próximos ao usuário
  const buscarEstabelecimentosProximos = useCallback(async (
    userLat: number,
    userLng: number,
    raio: number,
    filtros: Omit<FiltrosEstabelecimentos, 'latitude' | 'longitude' | 'raio'> = {}
  ) => {
    console.log('📍 Buscando estabelecimentos próximos:', { 
      userLat, 
      userLng, 
      raio,
      filtros 
    });
    
    return await carregarEstabelecimentos({
      ...filtros,
      latitude: userLat,
      longitude: userLng,
      raio
    });
  }, [carregarEstabelecimentos]);

  // Filtrar estabelecimentos por distância (fórmula de Haversine)
  const filtrarPorDistancia = useCallback((
    estabelecimentos: Local[],
    userLat: number,
    userLng: number,
    maxDistance: number
  ): Local[] => {
    return estabelecimentos.filter(est => {
      const distance = calcularDistancia(userLat, userLng, est.lat, est.lng);
      return distance <= maxDistance;
    }).sort((a, b) => {
      // Ordenar por distância crescente
      const distA = calcularDistancia(userLat, userLng, a.lat, a.lng);
      const distB = calcularDistancia(userLat, userLng, b.lat, b.lng);
      return distA - distB;
    });
  }, []);

  // Calcular distância entre dois pontos (Haversine)
  const calcularDistancia = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Raio da Terra em metros
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }, []);

  const toRad = useCallback((degrees: number): number => {
    return degrees * (Math.PI / 180);
  }, []);

  // Buscar estabelecimentos por termo
  const buscarPorTermo = useCallback(async (termo: string, filtros: FiltrosEstabelecimentos = {}) => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Buscando por termo:', termo);

      // Usar o service para busca paginada com termo
      const response = await ListaDeEstabelecimentoService.getAllPaginated(
        filtros.page || 1,
        filtros.limit || 100,
        { term: termo, field: 'all' },
        'nome',
        'asc'
      );

      console.log('📊 Resultados da busca:', response.data.length);

      const locais = transformServiceData(response.data as any[]);
      
      setAllPlaces(locais);
      setFilteredPlaces(locais);
      setPagination({
        total: response.meta.total,
        pages: response.meta.totalPages,
        currentPage: response.meta.page,
        perPage: response.meta.limit
      });

      return locais;
    } catch (error) {
      console.error('❌ Erro ao buscar por termo:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [transformServiceData]);

  // Função para refresh/reload dos dados
  const recarregarDados = useCallback(async () => {
    console.log('🔄 Recarregando todos os dados...');
    await carregarTiposEstabelecimentos();
    await carregarEstabelecimentos();
  }, [carregarEstabelecimentos, carregarTiposEstabelecimentos]);

  // Limpar filtros
  const limparFiltros = useCallback(() => {
    setFilteredPlaces(allPlaces);
  }, [allPlaces]);

  // Aplicar filtros locais (sem nova requisição)
  const aplicarFiltrosLocais = useCallback((
    tipo?: string,
    natureza?: string,
    userLat?: number,
    userLng?: number,
    raio?: number
  ) => {
    console.log('🔧 Aplicando filtros locais:', {
      tipo,
      natureza,
      userLat,
      userLng,
      raio,
      totalEstabelecimentos: allPlaces.length
    });

    let estabelecimentosFiltrados = [...allPlaces];

    // Filtrar por tipo
    if (tipo && tipo !== 'todos') {
      estabelecimentosFiltrados = estabelecimentosFiltrados.filter(est => est.tipo === tipo);
      console.log('🏥 Após filtro de tipo:', estabelecimentosFiltrados.length);
    }

    // Filtrar por natureza
    if (natureza && natureza !== 'todos') {
      estabelecimentosFiltrados = estabelecimentosFiltrados.filter(est => est.natureza === natureza);
      console.log('🏛️ Após filtro de natureza:', estabelecimentosFiltrados.length);
    }

    // Filtrar por distância se houver localização do usuário
    if (userLat && userLng && raio) {
      estabelecimentosFiltrados = filtrarPorDistancia(estabelecimentosFiltrados, userLat, userLng, raio);
      console.log('📍 Após filtro de distância:', estabelecimentosFiltrados.length);
    }

    setFilteredPlaces(estabelecimentosFiltrados);
    
    console.log('✅ Filtros aplicados. Resultado final:', estabelecimentosFiltrados.length);
    
    return estabelecimentosFiltrados;
  }, [allPlaces, filtrarPorDistancia]);

  return {
    // Estados
    allPlaces,
    filteredPlaces,
    tiposEstabelecimentos,
    isLoading,
    pagination,
    
    // Funções principais
    carregarEstabelecimentos,
    carregarTiposEstabelecimentos,
    buscarEstabelecimentosProximos,
    buscarPorTermo,
    recarregarDados,
    
    // Funções de filtro
    aplicarFiltrosLocais,
    limparFiltros,
    setFilteredPlaces,
    
    // Utilitários
    calcularDistancia,
    filtrarPorDistancia,
    transformServiceData
  };
};