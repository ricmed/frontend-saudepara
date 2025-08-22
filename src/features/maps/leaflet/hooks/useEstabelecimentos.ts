import { useState, useCallback, useEffect } from 'react';
import { Local, TipoHabilitacao, TipoQualificacao } from '../types';
import { EstabelecimentoMapaService } from '@/services/EstabelecimentoMapaService';

export const useEstabelecimentos = () => {
  const [allPlaces, setAllPlaces] = useState<Local[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Local[]>([]);
  const [tiposHabilitacoes, setTiposHabilitacoes] = useState<TipoHabilitacao[]>([]);
  const [tiposQualificacoes, setTiposQualificacoes] = useState<TipoQualificacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregarDadosAPI = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Carregando estabelecimentos ativos da API...');
      
      // Buscar estabelecimentos já convertidos do service
      const estabelecimentos = await EstabelecimentoMapaService.getEstabelecimentosParaMapa();
      console.log('📡 Dados recebidos da API (já convertidos):', estabelecimentos);
      console.log('📊 Total de estabelecimentos na API:', estabelecimentos.length);
      
      if (estabelecimentos.length > 0) {
        console.log('🔍 Primeiro estabelecimento já convertido:', estabelecimentos[0]);
      }
      
      // Filtrar estabelecimentos com endereço válido e converter para o tipo esperado
      const estabelecimentosValidos = estabelecimentos
        .filter(est => est.endereco !== undefined)
        .map(est => ({ ...est, endereco: est.endereco! }));
      
      setAllPlaces(estabelecimentosValidos);

      // Extrair habilitações e qualificações únicas dos estabelecimentos já convertidos
      const habilitacoes = EstabelecimentoMapaService.getHabilitacoesUnicas(estabelecimentos);
      const qualificacoes = EstabelecimentoMapaService.getQualificacoesUnicas(estabelecimentos);
      
      setTiposHabilitacoes(habilitacoes);
      setTiposQualificacoes(qualificacoes);

      console.log(`${estabelecimentos.length} estabelecimentos ativos carregados com sucesso`);
      console.log(`${habilitacoes.length - 1} habilitações únicas encontradas`);
      console.log(`${qualificacoes.length - 1} qualificações únicas encontradas`);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar estabelecimentos da API:", error);
      setIsLoading(false);
    }
  }, []);

  // Manter compatibilidade com o código existente
  const carregarEstabelecimentos = carregarDadosAPI;

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
    isLoading,
    carregarEstabelecimentos, // Mantém o nome existente para compatibilidade
    carregarDadosAPI          // Novo nome mais descritivo
  };
};
