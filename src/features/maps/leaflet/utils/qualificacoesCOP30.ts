/**
 * Configurações das qualificações COP 30
 * Cada qualificação tem uma cor e letra únicas para diferenciação no mapa
 */

export interface QualificacaoCOP30Config {
  nome: string;
  letra: string;
  cor: string;
  textColor: string;
}

export const QUALIFICACOES_COP30: QualificacaoCOP30Config[] = [
  {
    nome: "Postos de atendimento - COP 30",
    letra: "PA",
    cor: "#FF6B6B",      // Vermelho coral
    textColor: "#FFFFFF"
  },
  {
    nome: "Postos fixos de atendimento - Cúpula dos povos - COP 30",
    letra: "PF",
    cor: "#4ECDC4",      // Turquesa
    textColor: "#FFFFFF"
  },
  {
    nome: "Posto fixo de atendimento - Aldeia COP 30",
    letra: "AL",
    cor: "#95E1D3",      // Verde água
    textColor: "#000000"
  },
  {
    nome: "Usinas da Paz - COP 30",
    letra: "UP",
    cor: "#F38181",      // Rosa coral
    textColor: "#FFFFFF"
  },
  {
    nome: "Unidades de Pronto Atendimento - COP 30",
    letra: "UPA",
    cor: "#AA96DA",      // Roxo claro
    textColor: "#FFFFFF"
  },
  {
    nome: "Centros de Atenção Psicossocial - COP 30",
    letra: "CAPS",
    cor: "#FCBAD3",      // Rosa claro
    textColor: "#000000"
  },
  {
    nome: "Alojamentos - COP 30",
    letra: "ALO",
    cor: "#A8D8EA",      // Azul claro
    textColor: "#000000"
  },
  {
    nome: "Vacinação - COP 30",
    letra: "VAC",
    cor: "#FFD93D",      // Amarelo
    textColor: "#000000"
  }
];

/**
 * Busca a configuração de uma qualificação pelo nome
 * Retorna uma configuração padrão se não encontrar
 */
export const getQualificacaoConfig = (qualificacao: string): QualificacaoCOP30Config => {
  // Busca exata
  const config = QUALIFICACOES_COP30.find(q => q.nome === qualificacao);
  if (config) return config;

  // Busca parcial (case-insensitive)
  const configParcial = QUALIFICACOES_COP30.find(q => 
    q.nome.toLowerCase().includes(qualificacao.toLowerCase()) ||
    qualificacao.toLowerCase().includes(q.nome.toLowerCase())
  );
  if (configParcial) return configParcial;

  // Configuração padrão se não encontrar
  return {
    nome: qualificacao,
    letra: "?",
    cor: "#999999",      // Cinza
    textColor: "#FFFFFF"
  };
};

/**
 * Obtém a primeira qualificação COP 30 de um estabelecimento
 * Retorna null se não encontrar nenhuma qualificação COP 30
 */
export const getPrimeiraQualificacaoCOP30 = (qualificacoes: string[]): QualificacaoCOP30Config | null => {
  for (const qualificacao of qualificacoes) {
    const config = QUALIFICACOES_COP30.find(q => 
      q.nome === qualificacao || 
      q.nome.toLowerCase().includes(qualificacao.toLowerCase()) ||
      qualificacao.toLowerCase().includes(q.nome.toLowerCase())
    );
    if (config) return config;
  }
  return null;
};
