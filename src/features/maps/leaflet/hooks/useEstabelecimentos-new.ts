import { useState, useCallback } from 'react';
import { Local, TipoHabilitacao, TipoQualificacao } from '../types';
import { EstabelecimentoMapaService } from '@/services/EstabelecimentoMapaService';

export const useEstabelecimentos = () => {
  const [allPlaces, setAllPlaces] = useState<Local[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Local[]>([]);
  const [tiposHabilitacoes, setTiposHabilitacoes] = useState<TipoHabilitacao[]>([]);
  const [tiposQualificacoes, setTiposQualificacoes] = useState<TipoQualificacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para converter dados da API para o formato do Leaflet
  const mapToLeafletLocal = (estabelecimentos: any[]): Local[] => {
    return estabelecimentos.map(estabelecimento => {
      const endereco = [
        estabelecimento.logradouro,
        estabelecimento.numero,
        estabelecimento.bairro
      ].filter(Boolean).join(', ');

      // Extrair habilitações
      const habilitacoes = estabelecimento.estabelecimento_has_tipo_habilitacao?.map(
        (h: any) => h.tipo_habilitacao.descricao
      ) || [];

      // Extrair qualificações
      const qualificacoes = estabelecimento.estabelecimento_has_tipo_qualificacao?.map(
        (q: any) => q.tipo_qualificacao.descricao
      ) || [];

      return {
        id: estabelecimento.cnes || estabelecimento.idestabelecimento.toString(),
        nome: estabelecimento.nome,
        lat: parseFloat(estabelecimento.latitude),
        lng: parseFloat(estabelecimento.longitude),
        endereco: endereco || estabelecimento.cidade || '',
        habilitacoes,
        qualificacoes,
        natureza: estabelecimento.tipo_natureza?.descricao || 'Não informado',
        turno: 'Não informado', // Este campo não vem da API atual
        cnes: estabelecimento.cnes || '',
        cnpj: estabelecimento.cnpj || '',
        codigo_unidade: estabelecimento.codigo_unidade || '',
        ativo: true // Já vem filtrado como ativo da API
      };
    });
  };

  const carregarDadosAPI = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('Carregando estabelecimentos ativos da API...');
      
      // Buscar estabelecimentos ativos da API usando o mesmo serviço do Google Maps
      const estabelecimentosAPI = await EstabelecimentoMapaService.getEstabelecimentosParaMapa();
      
      // Converter para o formato do Leaflet (que tem campos adicionais como ativo)
      const estabelecimentos = mapToLeafletLocal(estabelecimentosAPI as any[]);
      
      setAllPlaces(estabelecimentos);

      // Extrair habilitações e qualificações únicas dos estabelecimentos
      const habilitacoes = EstabelecimentoMapaService.getHabilitacoesUnicas(estabelecimentosAPI);
      const qualificacoes = EstabelecimentoMapaService.getQualificacoesUnicas(estabelecimentosAPI);
      
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
