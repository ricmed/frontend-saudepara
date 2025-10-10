import { useState, useCallback, useEffect } from 'react';
import { Local, TipoHabilitacao, TipoQualificacao, TipoEstabelecimento } from '../types';
import { EstabelecimentoMapaService } from '@/services/EstabelecimentoMapaService';
import { EstabelecimentoService } from '@/services/EstabelecimentoService';

export const useEstabelecimentos = () => {
  const [allPlaces, setAllPlaces] = useState<Local[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Local[]>([]);
  const [tiposHabilitacoes, setTiposHabilitacoes] = useState<TipoHabilitacao[]>([]);
  const [tiposQualificacoes, setTiposQualificacoes] = useState<TipoQualificacao[]>([]);
  const [tiposEstabelecimentos, setTiposEstabelecimentos] = useState<TipoEstabelecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregarDadosAPI = useCallback(async () => {
    try {
      console.log('🚀 useEstabelecimentos - Iniciando carregamento...');
      setIsLoading(true);
      
      console.log('🔄 Carregando estabelecimentos ativos da API...');
      
      // Buscar estabelecimentos já convertidos do service
      const estabelecimentos = await EstabelecimentoMapaService.getEstabelecimentosParaMapa();
      console.log('📡 Dados recebidos da API (já convertidos):', estabelecimentos);
      console.log('📊 Total de estabelecimentos na API:', estabelecimentos.length);
      
      if (estabelecimentos.length > 0) {
        console.log('🔍 Primeiro estabelecimento já convertido:', estabelecimentos[0]);
      } else {
        console.warn('⚠️ Nenhum estabelecimento foi retornado da API');
      }
      
      // Filtrar estabelecimentos com endereço válido e converter para o tipo esperado
      const estabelecimentosValidos = estabelecimentos
        .filter(est => est.endereco !== undefined)
        .map(est => ({ ...est, endereco: est.endereco! }));
      
      console.log('✅ Estabelecimentos válidos:', estabelecimentosValidos.length);
      setAllPlaces(estabelecimentosValidos);

      // Extrair habilitações e qualificações únicas dos estabelecimentos já convertidos
      const habilitacoes = EstabelecimentoMapaService.getHabilitacoesUnicas(estabelecimentos);
      const qualificacoes = EstabelecimentoMapaService.getQualificacoesUnicas(estabelecimentos);
      
      setTiposHabilitacoes(habilitacoes);
      setTiposQualificacoes(qualificacoes);

      // Buscar tipos de estabelecimentos da API dedicada
      console.log('🔄 Carregando tipos de estabelecimentos da API...');
      try {
        const tiposEstabAPI = await EstabelecimentoService.getAllForSelect();
        console.log('📡 Tipos de estabelecimento recebidos:', tiposEstabAPI);
        
        // Mapear para o formato esperado
        const tiposFormatados: TipoEstabelecimento[] = [
          { id: "todos", nome: "Todos os Tipos" },
          ...tiposEstabAPI.map(tipo => ({
            id: tipo.idtipo_estabelecimento.toString(),
            nome: tipo.descricao
          }))
        ];
        
        setTiposEstabelecimentos(tiposFormatados);
        console.log('✅ Tipos de estabelecimento formatados:', tiposFormatados.length);
      } catch (error) {
        console.error('❌ Erro ao carregar tipos de estabelecimento, usando fallback:', error);
        // Fallback: extrair dos estabelecimentos carregados
        const tiposEstab = EstabelecimentoMapaService.getTiposEstabelecimentosUnicos(estabelecimentos);
        setTiposEstabelecimentos(tiposEstab);
      }

      console.log(`✅ ${estabelecimentos.length} estabelecimentos ativos carregados com sucesso`);
      console.log(`📊 ${habilitacoes.length - 1} habilitações únicas encontradas`);
      console.log(`📊 ${qualificacoes.length - 1} qualificações únicas encontradas`);
      
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Erro ao carregar estabelecimentos da API:", error);
      setIsLoading(false);
    }
  }, []);

  // Manter compatibilidade com o código existente
  const carregarEstabelecimentos = carregarDadosAPI;

  // Carregar dados automaticamente quando o hook é inicializado
  useEffect(() => {
    carregarDadosAPI();
  }, [carregarDadosAPI]);

  // Atualizar filteredPlaces quando allPlaces mudar
  useEffect(() => {
    console.log('🔄 Atualizando filteredPlaces. allPlaces:', allPlaces.length);
    setFilteredPlaces(allPlaces);
    console.log('✅ filteredPlaces atualizado para:', allPlaces.length, 'estabelecimentos');
  }, [allPlaces]);

  return {
    allPlaces,
    filteredPlaces,
    setFilteredPlaces,
    tiposHabilitacoes,
    tiposQualificacoes,
    tiposEstabelecimentos,
    isLoading,
    carregarEstabelecimentos, // Mantém o nome existente para compatibilidade
    carregarDadosAPI          // Novo nome mais descritivo
  };
};

/**
 * Hook para aplicar filtros aos estabelecimentos
 */
export const useEstabelecimentosFiltrados = (
  allPlaces: Local[],
  tipoEstabelecimentoSelecionado: string,
  naturezaSelecionada: string
): Local[] => {
  console.log('🔍 Aplicando filtros:', {
    total: allPlaces.length,
    tipoSelecionado: tipoEstabelecimentoSelecionado,
    naturezaSelecionada
  });

  // Se não há estabelecimentos, retornar array vazio
  if (!allPlaces || allPlaces.length === 0) {
    console.log('⚠️ Nenhum estabelecimento disponível para filtrar');
    return [];
  }

  const filtered = allPlaces.filter(place => {
    // Filtro por tipo de estabelecimento
    if (tipoEstabelecimentoSelecionado && 
        tipoEstabelecimentoSelecionado !== "Todos os Tipos" && 
        tipoEstabelecimentoSelecionado !== "todos") {
      
      // Debug: Verificar o que está sendo comparado
      if (place.tipoEstabelecimento !== tipoEstabelecimentoSelecionado) {
        console.log('❌ Filtrado por tipo:', {
          estabelecimento: place.nome,
          tipoEstabelecimento: place.tipoEstabelecimento,
          tipoSelecionado: tipoEstabelecimentoSelecionado
        });
        return false;
      }
    }

    // Filtro por natureza
    if (naturezaSelecionada && naturezaSelecionada !== "todos") {
      const naturezaPlace = place.natureza?.toLowerCase() || '';
      const naturezaFiltro = naturezaSelecionada.toLowerCase();
      
      if (naturezaFiltro === "público") {
        if (!naturezaPlace.includes("público") && 
            !naturezaPlace.includes("publico") && 
            !naturezaPlace.includes("municipal") &&
            !naturezaPlace.includes("estadual") &&
            !naturezaPlace.includes("federal")) {
          return false;
        }
      } else if (naturezaFiltro === "privado") {
        if (!naturezaPlace.includes("privado")) {
          return false;
        }
      }
    }

    return true;
  });

  console.log('✅ Estabelecimentos após filtros:', filtered.length);
  
  // Debug: Mostrar alguns estabelecimentos filtrados
  if (filtered.length > 0) {
    console.log('📋 Primeiros 3 estabelecimentos filtrados:', 
      filtered.slice(0, 3).map(p => ({
        nome: p.nome,
        tipo: p.tipoEstabelecimento,
        natureza: p.natureza
      }))
    );
  }
  
  return filtered;
};
