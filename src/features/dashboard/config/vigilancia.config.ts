// ✅ Configuração de Vigilância Epidemiológica baseada no Guia MS
import { findRuleByHypothesis, normalize, GVS_RULES } from '../../../shared/vigilancia.config';

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

  // 1. 🚨 ALERTAS BASEADOS NAS REGRAS GVS (principais)
  const hipotesesProcessadas = new Set<string>();
  
  notificacoes.forEach((notif) => {
    const hipoteseNome = (
      notif.hipoteseDiagnostico ||
      notif.tipo_hipotese_diag?.descricao ||
      notif.original?.tipo_hipotese_diag?.descricao ||
      ''
    );

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

  // 3. 📍 CONCENTRAÇÃO GEOGRÁFICA (possível surto) - MELHORADA
  const porEstabelecimento: Record<string, { nome: string; qtd: number }> = notificacoes.reduce((acc, notif, index) => {
    // Buscar estabelecimento em diferentes locais da estrutura
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
    
    if (!acc[id]) acc[id] = { nome, qtd: 0 };
    acc[id].qtd++;
    return acc;
  }, {} as Record<string, { nome: string; qtd: number }>);

  Object.entries(porEstabelecimento).forEach(([id, estabelecimento]) => {
    const { nome, qtd } = estabelecimento;
    
    // ✅ CORREÇÃO: Não gerar alertas para estabelecimentos sem informação válida
    const isEstabelecimentoValido = !id.startsWith('sem_id') && 
                                   !/não informado|sem informação|desconhecido/i.test(nome) &&
                                   nome.trim().length > 0;
    
    if (qtd >= VigilanciaConfig.thresholds.clusterPorEstabelecimento && isEstabelecimentoValido) {
      const bucket = Math.floor(agora.getTime() / 60000);
      const alertaId = `concentracao-${id}-${bucket}`;
      
      alertas.push({
        id: alertaId,
        tipo: 'atencao',
        titulo: '📍 CONCENTRAÇÃO DE CASOS - INVESTIGAÇÃO EPIDEMIOLÓGICA',
        descricao: `${qtd} casos registrados em ${nome}. Concentração pode indicar surto localizado. Recomenda-se investigação epidemiológica.`,
        timestamp: agora,
        lido: false,
        dados: { 
          estabelecimento: nome, 
          quantidade: qtd,
          criterioLegal: 'Guia de Vigilância em Saúde - Investigação de Surtos',
          acaoRecomendada: 'Investigação epidemiológica de campo'
        }
      });
    }
  });

  // 4. 📈 AUMENTO SÚBITO DE CASOS (análise temporal) - MELHORADA
  const ultimas24h = notificacoes.filter(notif => {
    const d = VigilanciaConfig.parseData(notif.original?.data_notificacao) ?? VigilanciaConfig.parseData(notif.created_at);
    if (!d || isNaN(d.getTime())) return false;
    return (agora.getTime() - d.getTime()) <= 24*60*60*1000;
  });

  if (ultimas24h.length >= VigilanciaConfig.thresholds.volume24h) {
    const bucket = Math.floor(agora.getTime() / (60*60*1000)); // Agrupa por hora
    
    alertas.push({
      id: `volume-24h-${bucket}`,
      tipo: 'critico',
      titulo: '📈 AUMENTO SÚBITO DE NOTIFICAÇÕES',
      descricao: `${ultimas24h.length} notificações nas últimas 24 horas. Aumento pode indicar surto ou evento de saúde pública. Análise epidemiológica recomendada.`,
      timestamp: agora,
      lido: false,
      dados: {
        casosUltimas24h: ultimas24h.length,
        criterioLegal: 'Guia de Vigilância em Saúde - Detecção de Surtos',
        acaoRecomendada: 'Investigação epidemiológica imediata'
      }
    });
  }

  // 5. 👶 CASOS PEDIÁTRICOS (grupo prioritário)
  const casosPediatricos = notificacoes.filter(notif => {
    const idade = notif.paciente?.idade || notif.original?.paciente?.idade;
    return idade !== null && idade !== undefined && Number(idade) < 5;
  });

  if (casosPediatricos.length >= VigilanciaConfig.thresholds.casosPediatricos) {
    alertas.push({
      id: `pediatrico-${Math.floor(agora.getTime() / (60*60*1000))}`,
      tipo: 'urgente',
      titulo: '👶 ATENÇÃO: CASOS PEDIÁTRICOS',
      descricao: `${casosPediatricos.length} casos em menores de 5 anos identificados. Crianças são grupo prioritário para vigilância epidemiológica. Verificar cobertura vacinal e medidas de prevenção.`,
      timestamp: agora,
      lido: false,
      dados: {
        totalCasosPediatricos: casosPediatricos.length,
        idades: casosPediatricos.map(c => c.paciente?.idade || c.original?.paciente?.idade).filter(Boolean),
        criterioLegal: 'Guia de Vigilância em Saúde - Vigilância Pediátrica',
        acaoRecomendada: 'Verificar situação vacinal e medidas de prevenção'
      }
    });
  }

  return alertas;
};

export default VigilanciaConfig;
