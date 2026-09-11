// ✅ Configuração de Vigilância Epidemiológica baseada no Guia MS
import { findRuleByHypothesis, normalize, GVS_RULES } from '../../../shared/vigilancia.config';
import { getNotificacaoHipoteseNomes } from '../utils/hipotesesNotificacao';

export type Severidade = 'critico' | 'urgente' | 'atencao';

// Re-exportar funções importantes
export { normalize, findRuleByHypothesis, GVS_RULES };

// Função para criar matcher robusto
export const makeMatcher = (lista: string[]) => {
  const base = lista.map(normalize);
  return (texto: string) => {
    const norm = normalize(texto);
    return base.some(k => norm.includes(k) || k.includes(norm));
  };
};

// ✅ Configuração baseada no Guia de Vigilância em Saúde (GVS 2024)
export const VigilanciaConfig = {
  // Thresholds para alertas
  thresholds: {
    clusterPorEstabelecimento: 3,
    volume24h: 15,
    casosPediatricos: 2,
    concentracaoGeografica: 5,
  },

  // Parsing robusto de datas
  parseData: (v?: string | Date) => v ? new Date(v) : null,
  
  // Normalizar texto
  normalizar: normalize,

  // Criar matcher
  criarMatcher: makeMatcher
};

// ✅ Tipos para alertas
export interface AlertaEpidemiologico {
  id: string;
  tipo: Severidade;
  titulo: string;
  descricao: string;
  timestamp: Date;
  lido: boolean;
  dados: {
    criterioLegal?: string;
    prazoNotificacao?: string;
    orgaoNotificar?: string;
    acaoRecomendada?: string;
    [key: string]: any;
  };
}

// ✅ Engine de detecção de alertas baseada no GVS 2024
export const detectarAlertas = (notificacoes: any[]): AlertaEpidemiologico[] => {
  const alertas: AlertaEpidemiologico[] = [];
  const agora = new Date();

  // � HELPER: Verificar se é trauma (excluir de análise de surto)
  const isTrauma = (notif: any): boolean => {
    const tipoAtendimento = notif.original?.tipo_atendimento?.descricao || 
                           notif.tipo_atendimento?.descricao || '';
    return /trauma|traumat|acidente/i.test(tipoAtendimento);
  };

  // 🔧 HELPER: Extrair nome da hipótese
  const getHipoteseNome = (notif: any): string => {
    return getNotificacaoHipoteseNomes(notif)[0] || '';
  };

  // 1. 🚨 ALERTAS BASEADOS NAS REGRAS GVS (principais) - POR HIPÓTESE
  const hipotesesProcessadas = new Set<string>();
  
  notificacoes.forEach((notif) => {
    // ❌ IGNORAR traumas para alertas de surto
    if (isTrauma(notif)) return;

    const hipoteseNome = getHipoteseNome(notif);
    const match = findRuleByHypothesis(hipoteseNome);
    if (!match) return;

    const { key, rule } = match;
    const normalizedKey = normalize(key);
    
    // Evitar duplicatas no mesmo bucket de 5min
    const bucket5 = Math.floor(agora.getTime() / (5*60*1000));
    const alertaId = `${rule.priority}-${normalizedKey.replace(/\s+/g, '_')}-${bucket5}`;
    
    if (hipotesesProcessadas.has(alertaId)) return;
    hipotesesProcessadas.add(alertaId);

    // Mapear prioridade GVS para tipo de alerta
    const tipoAlerta: Severidade = 
      rule.priority === 'critical' ? 'critico' :
      rule.priority === 'high' ? 'urgente' : 'atencao';

    const prazo = rule.notifyAsap 
      ? 'Notificar imediatamente (ASAP)'
      : rule.notifyWithinHours 
        ? `Notificar em até ${rule.notifyWithinHours}h`
        : 'Conforme protocolo local';

    const titulo = 
      rule.priority === 'critical' ? '🚨 CASO CRÍTICO (GVS)' :
      rule.priority === 'high' ? '⚠️ Caso de Vigilância' :
      '📌 Atenção Epidemiológica';

    alertas.push({
      id: alertaId,
      tipo: tipoAlerta,
      titulo,
      descricao: [
        `Hipótese: ${hipoteseNome || key}`,
        `• ${prazo}`,
        rule.whoToNotify ? `• Acionar: ${rule.whoToNotify.join(', ')}` : null,
        rule.sinanForm ? `• Ficha: ${rule.sinanForm}` : null
      ].filter(Boolean).join('  \n'),
      timestamp: agora,
      lido: false,
      dados: {
        ...notif,
        gvsRule: rule,
        gvsKey: key,
        criterioLegal: rule.sinanForm ? `${rule.sinanForm} - Portaria GM/MS nº 264/2020` : 'GVS 2024',
        prazoNotificacao: prazo,
        orgaoNotificar: rule.whoToNotify?.join(', '),
        acaoRecomendada: rule.clinicalActions?.join('; '),
        acaoCampo: rule.fieldActions?.join('; '),
        doenca: hipoteseNome || key
      }
    });
  });

  // 2. 🦠 ANÁLISE DE SURTO POR HIPÓTESE ESPECÍFICA (excluindo traumas)
  // Agrupar notificações por hipótese diagnóstica
  const notificacoesPorHipotese = new Map<string, any[]>();
  
  notificacoes.forEach((notif) => {
    // ❌ IGNORAR traumas
    if (isTrauma(notif)) return;
    
    const hipoteseNome = getHipoteseNome(notif);
    if (!hipoteseNome) return;
    
    if (!notificacoesPorHipotese.has(hipoteseNome)) {
      notificacoesPorHipotese.set(hipoteseNome, []);
    }
    notificacoesPorHipotese.get(hipoteseNome)!.push(notif);
  });

  // Analisar cada hipótese separadamente
  notificacoesPorHipotese.forEach((casos, hipotese) => {
    const totalCasos = casos.length;
    
    // 🔍 Verificar se a hipótese pode causar surto (doenças transmissíveis)
    const match = findRuleByHypothesis(hipotese);
    const podeCausarSurto = match && (match.rule.priority === 'critical' || match.rule.priority === 'high');
    
    // Thresholds específicos por tipo de doença
    const thresholdSurto = match?.rule.priority === 'critical' ? 3 : 5; // Doenças críticas: 3+ casos; Outras: 5+ casos
    
    if (podeCausarSurto && totalCasos >= thresholdSurto) {
      const bucket = Math.floor(agora.getTime() / (60*60*1000));
      const alertaId = `surto-${normalize(hipotese).replace(/\s+/g, '_')}-${bucket}`;
      
      alertas.push({
        id: alertaId,
        tipo: 'critico',
        titulo: `🦠 POSSÍVEL SURTO: ${hipotese.toUpperCase()}`,
        descricao: `${totalCasos} casos de ${hipotese} detectados. Número de casos sugere possível surto epidemiológico. Requer investigação imediata e medidas de controle.`,
        timestamp: agora,
        lido: false,
        dados: {
          hipotese: hipotese,
          totalCasos: totalCasos,
          criterioLegal: 'Guia de Vigilância em Saúde - Investigação de Surtos',
          acaoRecomendada: `Investigação epidemiológica imediata. Identificar fonte e implementar medidas de controle.`,
          acaoCampo: 'Visita aos casos, busca ativa, investigação de contactantes'
        }
      });
    }
  });

  // 3. 📍 CONCENTRAÇÃO GEOGRÁFICA POR HIPÓTESE (possível surto localizado)
  notificacoesPorHipotese.forEach((casos, hipotese) => {
    const match = findRuleByHypothesis(hipotese);
    const podeCausarSurto = match && (match.rule.priority === 'critical' || match.rule.priority === 'high');
    
    if (!podeCausarSurto) return; // Só analisar doenças que podem causar surto
    
    // Agrupar por estabelecimento
    const porEstabelecimento: Record<string, { nome: string; qtd: number }> = {};
    
    casos.forEach((notif, index) => {
      const possiveisEstabelecimentos = [
        notif.original?.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento,
        notif.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento,
        notif.original?.estabelecimento_idestabelecimento,
        notif.estabelecimento_idestabelecimento,
        notif.original?.estabelecimento,
        notif.estabelecimento
      ];

      let estabelecimentoEncontrado = null;
      for (const est of possiveisEstabelecimentos) {
        if (est && (est.nome || est.idestabelecimento)) {
          estabelecimentoEncontrado = est;
          break;
        }
      }

      const id = estabelecimentoEncontrado?.idestabelecimento ?? `sem_id_${index}`;
      const nome = estabelecimentoEncontrado?.nome ?? 'Estabelecimento não informado';
      
      if (!porEstabelecimento[id]) porEstabelecimento[id] = { nome, qtd: 0 };
      porEstabelecimento[id].qtd++;
    });
    
    // Alertar se concentração em estabelecimento específico
    Object.entries(porEstabelecimento).forEach(([id, estabelecimento]) => {
      const { nome, qtd } = estabelecimento;
      const thresholdConcentracao = match?.rule.priority === 'critical' ? 2 : 3;
      
      const isEstabelecimentoValido = !id.startsWith('sem_id') && 
                                     !/não informado|sem informação|desconhecido/i.test(nome) &&
                                     nome.trim().length > 0;
      
      if (qtd >= thresholdConcentracao && isEstabelecimentoValido) {
        const bucket = Math.floor(agora.getTime() / 60000);
        const alertaId = `concentracao-${normalize(hipotese)}-${id}-${bucket}`;
        
        alertas.push({
          id: alertaId,
          tipo: 'urgente',
          titulo: `📍 CONCENTRAÇÃO: ${hipotese.toUpperCase()}`,
          descricao: `${qtd} casos de ${hipotese} em ${nome}. Concentração geográfica pode indicar surto localizado. Investigar fonte comum.`,
          timestamp: agora,
          lido: false,
          dados: { 
            hipotese: hipotese,
            estabelecimento: nome, 
            quantidade: qtd,
            criterioLegal: 'Guia de Vigilância em Saúde - Investigação de Surtos',
            acaoRecomendada: 'Investigação de fonte comum, busca ativa de casos'
          }
        });
      }
    });
  });

  // 4. 📈 AUMENTO SÚBITO POR HIPÓTESE nas últimas 24h
  notificacoesPorHipotese.forEach((casos, hipotese) => {
    const match = findRuleByHypothesis(hipotese);
    const podeCausarSurto = match && (match.rule.priority === 'critical' || match.rule.priority === 'high');
    
    if (!podeCausarSurto) return;
    
    const ultimas24h = casos.filter(notif => {
      const d = VigilanciaConfig.parseData(notif.original?.data_notificacao) ?? VigilanciaConfig.parseData(notif.created_at);
      if (!d || isNaN(d.getTime())) return false;
      return (agora.getTime() - d.getTime()) <= 24*60*60*1000;
    });

    const thresholdVolume24h = match.rule.priority === 'critical' ? 3 : 5;
    
    if (ultimas24h.length >= thresholdVolume24h) {
      const bucket = Math.floor(agora.getTime() / (60*60*1000));
      
      alertas.push({
        id: `volume-24h-${normalize(hipotese)}-${bucket}`,
        tipo: 'critico',
        titulo: `📈 AUMENTO SÚBITO: ${hipotese.toUpperCase()}`,
        descricao: `${ultimas24h.length} casos de ${hipotese} nas últimas 24 horas. Aumento súbito pode indicar surto em evolução. Investigação imediata necessária.`,
        timestamp: agora,
        lido: false,
        dados: {
          hipotese: hipotese,
          casosUltimas24h: ultimas24h.length,
          criterioLegal: 'Guia de Vigilância em Saúde - Detecção de Surtos',
          acaoRecomendada: 'Investigação epidemiológica imediata, identificar e controlar fonte'
        }
      });
    }
  });

  // 5. 👶 CASOS PEDIÁTRICOS (grupo prioritário) - apenas para doenças transmissíveis
  notificacoesPorHipotese.forEach((casos, hipotese) => {
    const match = findRuleByHypothesis(hipotese);
    const podeCausarSurto = match && (match.rule.priority === 'critical' || match.rule.priority === 'high');
    
    if (!podeCausarSurto) return;
    
    const casosPediatricos = casos.filter(notif => {
      const idade = notif.paciente?.idade || notif.original?.paciente?.idade;
      return idade !== null && idade !== undefined && Number(idade) < 60; // < 5 anos (60 meses)
    });

    if (casosPediatricos.length >= 2) { // 2+ casos pediátricos já é relevante
      const bucket = Math.floor(agora.getTime() / (60*60*1000));
      
      alertas.push({
        id: `pediatrico-${normalize(hipotese)}-${bucket}`,
        tipo: 'urgente',
        titulo: `👶 CASOS PEDIÁTRICOS: ${hipotese.toUpperCase()}`,
        descricao: `${casosPediatricos.length} casos de ${hipotese} em menores de 5 anos. Crianças são grupo prioritário. Verificar cobertura vacinal e medidas de prevenção.`,
        timestamp: agora,
        lido: false,
        dados: {
          hipotese: hipotese,
          totalCasosPediatricos: casosPediatricos.length,
          idades: casosPediatricos.map(c => c.paciente?.idade || c.original?.paciente?.idade).filter(Boolean),
          criterioLegal: 'Guia de Vigilância em Saúde - Vigilância Pediátrica',
          acaoRecomendada: 'Verificar situação vacinal, avaliar medidas de prevenção e controle'
        }
      });
    }
  });

  return alertas;
};

export default VigilanciaConfig;
