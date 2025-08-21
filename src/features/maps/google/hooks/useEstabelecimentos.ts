import { useState, useCallback } from 'react';
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
      
      console.log('Carregando estabelecimentos ativos da API...');
      
      // Buscar estabelecimentos ativos da API
      const estabelecimentos = await EstabelecimentoMapaService.getEstabelecimentosParaMapa();
      
      setAllPlaces(estabelecimentos);

      // Extrair habilitações e qualificações únicas dos estabelecimentos
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
  const carregarDadosExcel = carregarDadosAPI;

  return {
    allPlaces,
    filteredPlaces,
    setFilteredPlaces,
    tiposHabilitacoes,
    tiposQualificacoes,
    isLoading,
    carregarDadosExcel, // Mantém o nome para compatibilidade
    carregarDadosAPI    // Novo nome mais descritivo
  };
};