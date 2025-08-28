// Hook para processar dados de estabelecimentos para o mapa
import { useMemo } from 'react';

interface EstabelecimentoMapa {
  id: number;
  nome: string;
  latitude?: number;
  longitude?: number;
  totalAtendimentos: number;
  atendimentosUrgentes: number;
  endereco?: string;
  cnes?: string;
  percentualUrgencia: number;
}

interface UseEstabelecimentosMapaProps {
  notificacoes: any[];
}

/**
 * Hook para processar dados de estabelecimentos para exibição no mapa
 * Agrupa atendimentos por estabelecimento e calcula métricas
 */
export const useEstabelecimentosMapa = ({ notificacoes }: UseEstabelecimentosMapaProps) => {
  
  const estabelecimentosMapa = useMemo(() => {
    if (!notificacoes || notificacoes.length === 0) {
      return [];
    }

    try {
      // Agrupar por estabelecimento
      const estabelecimentosMap = new Map<number, {
        dados: any;
        atendimentos: any[];
        urgentes: any[];
      }>();

      notificacoes.forEach((notificacao) => {
        const estabelecimento = 
          notificacao.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento ||
          notificacao.original?.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento;

        if (estabelecimento) {
          const id = estabelecimento.idestabelecimento;
          
          if (!estabelecimentosMap.has(id)) {
            estabelecimentosMap.set(id, {
              dados: estabelecimento,
              atendimentos: [],
              urgentes: []
            });
          }

          const entrada = estabelecimentosMap.get(id)!;
          entrada.atendimentos.push(notificacao);

          // Verificar se é atendimento urgente
          const isUrgente = 
            notificacao.tipo_evento?.descricao?.toLowerCase().includes('trauma') ||
            notificacao.tipo_evento?.descricao?.toLowerCase().includes('surto') ||
            notificacao.relacionado_surto === 'S' ||
            notificacao.tipo_atendimento?.descricao?.toLowerCase().includes('urgência') ||
            notificacao.tipo_atendimento?.descricao?.toLowerCase().includes('emergência');

          if (isUrgente) {
            entrada.urgentes.push(notificacao);
          }
        }
      });

      // Converter para array final
      const resultado: EstabelecimentoMapa[] = Array.from(estabelecimentosMap.entries())
        .map(([id, dados]) => {
          const totalAtendimentos = dados.atendimentos.length;
          const atendimentosUrgentes = dados.urgentes.length;
          const percentualUrgencia = totalAtendimentos > 0 
            ? Math.round((atendimentosUrgentes / totalAtendimentos) * 100) 
            : 0;

          return {
            id,
            nome: dados.dados.nome || `Estabelecimento ${id}`,
            latitude: parseFloat(dados.dados.latitude) || undefined,
            longitude: parseFloat(dados.dados.longitude) || undefined,
            totalAtendimentos,
            atendimentosUrgentes,
            endereco: dados.dados.endereco || dados.dados.logradouro || undefined,
            cnes: dados.dados.cnes || undefined,
            percentualUrgencia
          };
        })
        .filter(item => item.totalAtendimentos > 0) // Só estabelecimentos com atendimentos
        .sort((a, b) => b.totalAtendimentos - a.totalAtendimentos); // Ordenar por volume

      return resultado;

    } catch (error) {
      console.error('Erro ao processar estabelecimentos para mapa:', error);
      return [];
    }
  }, [notificacoes]);

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    if (estabelecimentosMapa.length === 0) {
      return {
        totalEstabelecimentos: 0,
        estabelecimentoMaiorVolume: null,
        estabelecimentoMaiorPercentualUrgencia: null,
        mediaAtendimentosPorEstabelecimento: 0,
        totalAtendimentosUrgentes: 0
      };
    }

    const totalAtendimentosUrgentes = estabelecimentosMapa.reduce(
      (sum, item) => sum + item.atendimentosUrgentes, 0
    );

    const estabelecimentoMaiorVolume = estabelecimentosMapa.reduce((max, current) =>
      current.totalAtendimentos > max.totalAtendimentos ? current : max
    );

    const estabelecimentoMaiorPercentualUrgencia = estabelecimentosMapa.reduce((max, current) =>
      current.percentualUrgencia > max.percentualUrgencia ? current : max
    );

    const mediaAtendimentosPorEstabelecimento = Math.round(
      estabelecimentosMapa.reduce((sum, item) => sum + item.totalAtendimentos, 0) / 
      estabelecimentosMapa.length
    );

    return {
      totalEstabelecimentos: estabelecimentosMapa.length,
      estabelecimentoMaiorVolume,
      estabelecimentoMaiorPercentualUrgencia,
      mediaAtendimentosPorEstabelecimento,
      totalAtendimentosUrgentes
    };
  }, [estabelecimentosMapa]);

  // Estabelecimentos com coordenadas válidas para o mapa
  const estabelecimentosComCoordenadas = useMemo(() => {
    return estabelecimentosMapa.filter(item => 
      item.latitude && 
      item.longitude && 
      !isNaN(item.latitude) && 
      !isNaN(item.longitude) &&
      item.latitude >= -90 && item.latitude <= 90 &&
      item.longitude >= -180 && item.longitude <= 180
    );
  }, [estabelecimentosMapa]);

  return {
    estabelecimentosMapa,
    estabelecimentosComCoordenadas,
    estatisticas
  };
};
