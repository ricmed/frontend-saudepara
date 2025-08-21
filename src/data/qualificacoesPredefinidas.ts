/**
 * Lista de qualificações predefinidas para filtros
 */
export const QUALIFICACOES_PREDEFINIDAS = [
  { id: "todas", nome: "Todas as Qualificações" },
  { id: "atendimento_viajantes", nome: "Atendimento Viajantes" },
  { id: "espacos_lazer_atividades_fisicas", nome: "Espaços de Lazer e de Atividades Físicas" },
  { id: "espacos_fiscalizados_vigilancia_sanitaria", nome: "Espaços Fiscalizados Pela Vigilância Sanitária" },
  { id: "espacos_irregulares", nome: "Espaços Irregulares" },
  { id: "estabelecimentos_fontes_radiologicas", nome: "Estabelecimentos com Fontes Radiológicas" },
  { id: "estabelecimentos_risco_quimico", nome: "Estabelecimentos com Risco Químico" },
  { id: "hospital_campanha", nome: "Hospital de Campanha" },
  { id: "hospital_referencia_qbrn", nome: "Hospital de Referência em QBRN" },
  { id: "laboratorios", nome: "Laboratórios" },
  { id: "laboratorios_referencia_qbrn", nome: "Laboratórios de Referência QBRN" },
  { id: "posto_atendimento_alternativo", nome: "Posto de Atendimento Alternativo" },
  { id: "posto_medico_avancado", nome: "Posto Médico Avançado" },
  { id: "remocao_aeromedica", nome: "Remoção Aeromédica" },
  { id: "remocao_viajantes", nome: "Remoção de Viajantes" },
  { id: "tipo_unidade", nome: "Tipo de Unidade" },
  { id: "unidades_saude_horario_extendido", nome: "Unidades de Saúde com Horário Extendido" },
  { id: "vacina_antirrabica", nome: "Vacina Antirábica" }
];

/**
 * Função para buscar qualificações que correspondem ao termo de pesquisa
 */
export const buscarQualificacoes = (termo: string): typeof QUALIFICACOES_PREDEFINIDAS => {
  if (!termo || termo === "todas") {
    return QUALIFICACOES_PREDEFINIDAS;
  }

  const termoLowerCase = termo.toLowerCase();
  return QUALIFICACOES_PREDEFINIDAS.filter(qualificacao => 
    qualificacao.nome.toLowerCase().includes(termoLowerCase) ||
    qualificacao.id.toLowerCase().includes(termoLowerCase)
  );
};

/**
 * Função para obter nome da qualificação por ID
 */
export const obterNomeQualificacao = (id: string): string => {
  const qualificacao = QUALIFICACOES_PREDEFINIDAS.find(q => q.id === id);
  return qualificacao ? qualificacao.nome : id;
};
