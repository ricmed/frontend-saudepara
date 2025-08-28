// Hook para processar dados de atendimentos por hora com timezone e filtro por data
import { useState, useMemo } from 'react';

interface AtendimentoPorHora {
  hora: string;
  quantidade: number;
  urgencia: number;
  datetime: Date;
}

interface UseAtendimentosPorHoraProps {
  notificacoes: any[];
  timezone?: string;
  dataFiltro?: string | null; // Nova prop para filtrar por data específica (formato YYYY-MM-DD)
}

/**
 * Hook para processar atendimentos por hora considerando timezone local e filtro por data
 * Usado para análise de fluxo hospitalar e identificação de picos
 */
export const useAtendimentosPorHora = ({ 
  notificacoes, 
  timezone = 'America/Belem',
  dataFiltro = null
}: UseAtendimentosPorHoraProps) => {
  const [loading, setLoading] = useState(true);

  // ✅ NOVO: Extrair datas únicas disponíveis das notificações
  const datasDisponiveis = useMemo(() => {
    console.log('🔍 [DATAS DEBUG] Calculando datas disponíveis:', {
      totalNotificacoes: notificacoes?.length || 0
    });

    if (!notificacoes || notificacoes.length === 0) return [];

    const datas = new Set<string>();

    notificacoes.forEach((notificacao) => {
      const dataAtendimento = notificacao.data_atendimento || notificacao.original?.data_atendimento;
      
      if (dataAtendimento) {
        try {
          const dataLocal = new Date(dataAtendimento);
          const dataFormatada = dataLocal.toISOString().split('T')[0]; // YYYY-MM-DD
          
          console.log('🔍 [DATAS DEBUG] Data processada para lista:', {
            original: dataAtendimento,
            formatada: dataFormatada,
            dataLocal: dataLocal.toString()
          });
          
          datas.add(dataFormatada);
        } catch (error) {
          console.warn('Erro ao processar data para lista:', error);
        }
      }
    });

    const datasArray = Array.from(datas).sort().reverse(); // Ordenar por data (mais recente primeiro)
    console.log('🔍 [DATAS DEBUG] Datas encontradas:', datasArray);
    return datasArray;
  }, [notificacoes]);

  // Processar dados com timezone local e filtro por data
  const atendimentosPorHora = useMemo(() => {
    console.log('🔍 [HOOK DEBUG] Processando atendimentos:', {
      totalNotificacoes: notificacoes?.length || 0,
      dataFiltro,
      datasDisponiveis: datasDisponiveis.length
    });

    if (!notificacoes || notificacoes.length === 0) {
      setLoading(false);
      return [];
    }

    try {
      // Criar objeto para contar atendimentos por hora
      const horasCount: { [key: string]: { quantidade: number; urgencia: number } } = {};

      // Inicializar todas as horas (0-23)
      for (let i = 0; i < 24; i++) {
        const hora = i.toString().padStart(2, '0') + ':00';
        horasCount[hora] = { quantidade: 0, urgencia: 0 };
      }

      // Processar cada notificação
      let notificacoesProcessadas = 0;
      let notificacoesFiltradas = 0;

      notificacoes.forEach((notificacao) => {
        const dataAtendimento = notificacao.data_atendimento || notificacao.original?.data_atendimento;
        
        if (dataAtendimento) {
          try {
            const dataLocal = new Date(dataAtendimento);
            const dataNotificacao = dataLocal.toISOString().split('T')[0]; // YYYY-MM-DD

            // ✅ FILTRO POR DATA: Se uma data específica foi selecionada, filtrar apenas essa data
            if (dataFiltro && dataNotificacao !== dataFiltro) {
              console.log('🔍 [FILTRO DEBUG] Notificação filtrada:', {
                dataNotificacao,
                dataFiltro,
                iguais: dataNotificacao === dataFiltro
              });
              notificacoesFiltradas++;
              return; // Pular esta notificação
            }

            console.log('🔍 [ACEITA DEBUG] Notificação aceita:', {
              dataNotificacao,
              dataFiltro,
              aceita: true
            });

            notificacoesProcessadas++;
            const hora = dataLocal.getHours().toString().padStart(2, '0') + ':00';
            
            if (horasCount[hora]) {
              horasCount[hora].quantidade++;
              
              // Considerar urgente se for trauma ou surto
              const isUrgente = 
                notificacao.tipo_evento?.descricao?.toLowerCase().includes('trauma') ||
                notificacao.tipo_evento?.descricao?.toLowerCase().includes('surto') ||
                notificacao.relacionado_surto === 'S';
              
              if (isUrgente) {
                horasCount[hora].urgencia++;
              }
            }
          } catch (error) {
            console.warn('Erro ao processar data de atendimento:', error);
          }
        }
      });

      console.log('🔍 [HOOK DEBUG] Resultado do processamento:', {
        notificacoesProcessadas,
        notificacoesFiltradas,
        dataFiltro,
        totalOriginal: notificacoes.length
      });

      // Converter para array ordenado
      const resultado: AtendimentoPorHora[] = Object.entries(horasCount)
        .map(([hora, dados]) => ({
          hora,
          quantidade: dados.quantidade,
          urgencia: dados.urgencia,
          datetime: new Date(`2000-01-01T${hora}:00`)
        }))
        .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

      setLoading(false);
      return resultado;

    } catch (error) {
      console.error('Erro ao processar atendimentos por hora:', error);
      setLoading(false);
      return [];
    }
  }, [notificacoes, timezone, dataFiltro]); // ✅ CORREÇÃO: Adicionar dataFiltro nas dependências

  // Estatísticas derivadas
  const estatisticas = useMemo(() => {
    if (atendimentosPorHora.length === 0) {
      return {
        totalAtendimentos: 0,
        horarioPico: null,
        horarioMenorFluxo: null,
        mediaHoraria: 0,
        percentualUrgencia: 0
      };
    }

    const totalAtendimentos = atendimentosPorHora.reduce((sum, item) => sum + item.quantidade, 0);
    const totalUrgencias = atendimentosPorHora.reduce((sum, item) => sum + item.urgencia, 0);
    
    const horarioPico = atendimentosPorHora.reduce((max, current) => 
      current.quantidade > max.quantidade ? current : max
    );
    
    const horarioMenorFluxo = atendimentosPorHora.reduce((min, current) => 
      current.quantidade < min.quantidade ? current : min
    );

    return {
      totalAtendimentos,
      horarioPico: horarioPico.hora,
      horarioMenorFluxo: horarioMenorFluxo.hora,
      mediaHoraria: Math.round(totalAtendimentos / 24),
      percentualUrgencia: totalAtendimentos > 0 ? Math.round((totalUrgencias / totalAtendimentos) * 100) : 0
    };
  }, [atendimentosPorHora]);

  return {
    atendimentosPorHora,
    estatisticas,
    loading,
    datasDisponiveis, // ✅ NOVO: Lista de datas disponíveis para o seletor
    dataAtual: dataFiltro // ✅ NOVO: Data atualmente selecionada
  };
};
