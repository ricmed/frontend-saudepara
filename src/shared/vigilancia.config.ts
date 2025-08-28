// vigilancia.config.ts
// Configuração de vigilância epidemiológica baseada no Guia de Vigilância em Saúde (GVS) 2024
// Regras oficiais do Ministério da Saúde do Brasil

export type Severidade = 'low' | 'medium' | 'high' | 'critical';

export type ProtocolRule = {
  priority: Severidade;
  notifyWithinHours?: number; // prazo formal (ex.: 24h)
  notifyAsap?: boolean;       // "o mais rápido possível" / imediato
  whoToNotify?: string[];     // atores a acionar
  sinanForm?: string;         // ficha Sinan
  clinicalActions?: string[]; // condutas na assistência
  fieldActions?: string[];    // ações de VE/território
  investigationNotes?: string;
  synonyms?: string[];        // sinônimos/variações
};

export const normalize = (s: string) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// ————————————————————————————————————————————————————————————————
// Regras do Guia de Vigilância em Saúde 2024 - Ministério da Saúde
// Adaptadas para o sistema local com sinônimos das hipóteses reais do banco
// ————————————————————————————————————————————————————————————————

export const GVS_RULES: Record<string, ProtocolRule> = {
  // —— PRIORIDADE CRÍTICA (Notificação Imediata) ——
  'botulismo': {
    priority: 'critical',
    notifyAsap: true,
    whoToNotify: ['VE municipal', 'VE estadual', 'Vigilância Sanitária'],
    sinanForm: 'Botulismo',
    clinicalActions: ['Soro/antitoxina conforme protocolo', 'Suporte intensivo'],
    fieldActions: ['Rastrear fonte alimentar', 'Investigação imediata'],
    synonyms: ['BOTULISMO', 'toxinismo botulinico']
  },
  
  'febre amarela': {
    priority: 'critical',
    notifyAsap: true,
    whoToNotify: ['VE municipal', 'VE estadual', 'CIEVS'],
    sinanForm: 'Febre Amarela',
    clinicalActions: ['Coletar amostras conforme fluxo', 'Suporte conforme gravidade'],
    fieldActions: ['Investigação imediata', 'Avaliar bloqueio/varredura vacinal'],
    synonyms: ['FEBRE AMARELA', 'fa', 'yellow fever']
  },
  
  'doenca meningococica': {
    priority: 'critical',
    notifyAsap: true,
    whoToNotify: ['VE municipal', 'VE estadual', 'CIEVS'],
    sinanForm: 'Doença Meningocócica',
    clinicalActions: ['Isolamento respiratório', 'Antibióticoterapia imediata', 'Quimioprofilaxia contactantes'],
    fieldActions: ['Investigação de surto', 'Identificar contactantes íntimos'],
    synonyms: ['DOENÇA MENINGOCÓCICA', 'meningite meningococica', 'meningocócica']
  },
  
  'paralisia flacida aguda': {
    priority: 'critical',
    notifyAsap: true,
    whoToNotify: ['VE municipal', 'VE estadual', 'CIEVS'],
    sinanForm: 'Paralisia Flácida Aguda/Poliomielite',
    clinicalActions: ['Suporte ventilatório conforme necessário', 'Coleta de amostras'],
    fieldActions: ['Busca ativa', 'Verificar cobertura vacinal'],
    synonyms: ['PARALISIA FLÁCIDA AGUDA', 'pfa', 'poliomielite']
  },
  
  'sarampo': {
    priority: 'critical',
    notifyAsap: true,
    whoToNotify: ['VE municipal', 'VE estadual'],
    sinanForm: 'Sarampo',
    clinicalActions: ['Isolamento respiratório', 'Vitamina A'],
    fieldActions: ['Bloqueio vacinal', 'Busca ativa'],
    synonyms: ['SARAMPO', 'measles']
  },
  
  'difteria': {
    priority: 'critical',
    notifyAsap: true,
    whoToNotify: ['VE municipal', 'VE estadual'],
    sinanForm: 'Difteria',
    clinicalActions: ['Soro antidiftérico', 'Isolamento respiratório'],
    fieldActions: ['Quimioprofilaxia de contatos', 'Busca ativa'],
    synonyms: ['DFTERIA', 'difteria']
  },
  
  'colera': {
    priority: 'critical',
    notifyAsap: true,
    whoToNotify: ['VE municipal', 'VE estadual'],
    sinanForm: 'Cólera',
    clinicalActions: ['Hidratação vigorosa', 'Isolamento entérico'],
    fieldActions: ['Investigação de fonte', 'Busca ativa'],
    synonyms: ['CÓLERA', 'vibrio cholerae']
  },
  
  'febre nilo ocidental': {
    priority: 'critical',
    notifyAsap: true,
    whoToNotify: ['VE municipal', 'VE estadual'],
    sinanForm: 'Febre do Nilo Ocidental',
    clinicalActions: ['Suporte sintomático', 'Vigilância neurológica'],
    fieldActions: ['Controle vetorial', 'Busca ativa'],
    synonyms: ['FEBRE DO NILO OCIDENTAL', 'west nile']
  },

  // —— PRIORIDADE ALTA (24 Horas) ——
  'dengue': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Dengue',
    clinicalActions: ['Hidratação adequada', 'Vigilância de sinais de alarme'],
    fieldActions: ['Controle vetorial', 'Busca ativa'],
    synonyms: ['DENGUE', 'aedica', 'aedes aegypti']
  },
  
  'chikungunya': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Chikungunya',
    clinicalActions: ['Tratamento sintomático', 'Vigilância de complicações'],
    fieldActions: ['Controle vetorial', 'Busca ativa'],
    synonyms: ['CHIKUNGUNYA', 'febre chikungunya']
  },
  
  'zika': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Zika',
    clinicalActions: ['Acompanhamento de gestantes', 'Vigilância de microcefalia'],
    fieldActions: ['Controle vetorial', 'Busca ativa'],
    synonyms: ['ZIKA VÍRUS', 'ZIKA', 'zika virus']
  },
  
  'malaria': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Malária',
    clinicalActions: ['Diagnóstico e tratamento imediato'],
    fieldActions: ['Busca ativa no LPI', 'Orientação de proteção individual'],
    synonyms: ['MALÁRIA', 'p falciparum', 'p vivax', 'plasmodium', 'impaludismo']
  },
  
  'leptospirose': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Leptospirose',
    clinicalActions: ['Hospitalizar graves', 'Solicitar sorologia/Lacen'],
    fieldActions: ['Identificar LPI/exposição', 'Ações de roedores'],
    synonyms: ['LEPTOSPITOSE', 'leptospira']
  },
  
  'tuberculose': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Tuberculose',
    clinicalActions: ['Tratamento supervisionado', 'TDO'],
    fieldActions: ['Busca ativa de contatos', 'Investigação de contatos'],
    synonyms: ['TUBERCULOSE', 'tb', 'koch']
  },
  
  'coqueluche': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Coqueluche',
    clinicalActions: ['Antibióticoterapia precoce', 'Isolamento respiratório'],
    fieldActions: ['Quimioprofilaxia de contatos', 'Busca ativa'],
    synonyms: ['COQUELUCHE', 'pertussis']
  },
  
  'caxumba': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Caxumba',
    clinicalActions: ['Isolamento até remissão', 'Vigilância de complicações'],
    fieldActions: ['Verificar cobertura vacinal', 'Busca ativa'],
    synonyms: ['CAXUMBA', 'parotidite']
  },
  
  'chagas aguda': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Doença de Chagas Aguda',
    clinicalActions: ['Tratamento específico', 'Hospitalização conforme gravidade'],
    fieldActions: ['Investigação vetorial', 'Busca ativa'],
    synonyms: ['DOENÇA DE CHAGAS AGUDA', 'chagas aguda', 'tripanossomíase']
  },
  
  'leishmaniose visceral': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Leishmaniose Visceral',
    clinicalActions: ['Tratamento específico urgente', 'Hospitalização'],
    fieldActions: ['Controle de reservatórios', 'Busca ativa'],
    synonyms: ['LEISHMANIOSE VISCERAL', 'calazar']
  },
  
  'influenza': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Influenza',
    clinicalActions: ['Tratamento antiviral precoce', 'Isolamento'],
    fieldActions: ['Monitoramento de surtos', 'Busca ativa'],
    synonyms: ['INFLUENZA SAZONAL', 'gripe', 'h1n1']
  },
  
  'covid': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'COVID-19',
    clinicalActions: ['Isolamento', 'Suporte conforme gravidade'],
    fieldActions: ['Rastreamento de contatos', 'Busca ativa'],
    synonyms: ['COVID 19', 'COVID-19', 'coronavirus']
  },
  
  'febre tifoide': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Febre Tifóide',
    clinicalActions: ['Antibióticoterapia específica', 'Isolamento entérico'],
    fieldActions: ['Investigação de fonte', 'Busca ativa'],
    synonyms: ['FEBRE TIFÓIDE', 'tifo']
  },
  
  'rubeola': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Rubéola/SRC',
    clinicalActions: ['Coleta conforme protocolo', 'Atenção a gestantes'],
    fieldActions: ['Verificar cobertura vacinal e comunicantes'],
    synonyms: ['RUBÉOLA', 'rubéola']
  },
  
  'tetano': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Tétano Acidental',
    clinicalActions: ['Soro antitetânico', 'Suporte intensivo'],
    fieldActions: ['Verificar cobertura vacinal'],
    synonyms: ['TÉTANO ACIDENTAL', 'tetano']
  },
  
  'outras meningites': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal'],
    sinanForm: 'Meningite',
    clinicalActions: ['Punção lombar urgente', 'Antibióticoterapia empírica'],
    fieldActions: ['Investigação de contatos'],
    synonyms: ['OUTRAS MENINGITES', 'meningite viral', 'meningite bacteriana']
  },
  
  'doencas hidricas': {
    priority: 'high',
    notifyWithinHours: 24,
    whoToNotify: ['VE municipal', 'Vigilância Sanitária'],
    sinanForm: 'DTA',
    clinicalActions: ['Hidratação', 'Investigação etiológica'],
    fieldActions: ['Investigação de fonte', 'Ações de saneamento'],
    synonyms: ['DOENÇAS DE TRANSMISSÃO HÍDRICA E ALIMENTAR', 'dta']
  },

  // —— PRIORIDADE MÉDIA (7 Dias) ——
  'hanseniase': {
    priority: 'medium',
    notifyWithinHours: 168, // 7 dias
    whoToNotify: ['VE municipal'],
    sinanForm: 'Hanseníase',
    clinicalActions: ['Poliquimioterapia', 'Avaliação de incapacidades'],
    fieldActions: ['Busca ativa de contatos', 'Educação em saúde'],
    synonyms: ['HANSENIASE', 'lepra']
  },
  
  'leishmaniose tegumentar': {
    priority: 'medium',
    notifyWithinHours: 168, // 7 dias
    whoToNotify: ['VE municipal'],
    sinanForm: 'Leishmaniose Tegumentar',
    clinicalActions: ['Tratamento específico', 'Acompanhamento ambulatorial'],
    fieldActions: ['Controle de reservatórios', 'Busca ativa'],
    synonyms: ['LEISHMANIOSE TEG. AMERICANA', 'leishmaniose cutanea']
  },
  
  'varicela': {
    priority: 'medium',
    notifyWithinHours: 168, // 7 dias
    whoToNotify: ['VE municipal'],
    sinanForm: 'Varicela',
    clinicalActions: ['Isolamento até lesões secarem', 'Vigilância de complicações'],
    fieldActions: ['Verificar cobertura vacinal', 'Busca ativa'],
    synonyms: ['VARICELA', 'catapora']
  },
  
  'herpes zoster': {
    priority: 'medium',
    notifyWithinHours: 168, // 7 dias
    whoToNotify: ['VE municipal'],
    sinanForm: 'Herpes Zoster',
    clinicalActions: ['Tratamento sintomático', 'Vigilância de complicações'],
    fieldActions: ['Orientação sobre prevenção'],
    synonyms: ['HERPES ZOSTER', 'cobreiro']
  },
  
  'rotavirus': {
    priority: 'medium',
    notifyWithinHours: 168, // 7 dias
    whoToNotify: ['VE municipal'],
    sinanForm: 'Rotavírus',
    clinicalActions: ['Hidratação', 'Isolamento entérico'],
    fieldActions: ['Investigação de surto', 'Busca ativa'],
    synonyms: ['ROTAVIROSE', 'rotavirus']
  }
};

// Função para buscar uma regra por hipótese diagnóstica
export const findRuleByHypothesis = (hypothesis: string): { key: string; rule: ProtocolRule } | null => {
  const text = normalize(hypothesis);
  if (!text) return null;

  // 1) Match por chave canônica
  for (const [key, rule] of Object.entries(GVS_RULES)) {
    const k = normalize(key);
    if (text.includes(k) || k.includes(text)) {
      return { key, rule };
    }
  }

  // 2) Match por sinônimos
  for (const [key, rule] of Object.entries(GVS_RULES)) {
    for (const syn of rule.synonyms || []) {
      const s = normalize(syn);
      if (s && (text.includes(s) || s.includes(text))) {
        return { key, rule };
      }
    }
  }

  return null;
};

// Configuração de thresholds de vigilância
export const VigilanciaConfig = {
  thresholds: {
    clusterPorEstabelecimento: 3,
    volume24h: 15,
    casosPediatricos: 2,
  },
  normalizar: normalize,
};
