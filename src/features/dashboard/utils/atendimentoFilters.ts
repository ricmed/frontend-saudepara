export const ATENDIMENTO_TO_FILTER_KEY: Record<string, string> = {
  clinico: 'Clínico',
  'clínico': 'Clínico',
  trauma: 'Trauma',
  multiplas: 'Múltiplas Vítimas',
  'múltiplas vítimas': 'Múltiplas Vítimas',
  qbrn: 'Incidente QBRN',
  'incidente qbrn': 'Incidente QBRN'
};

export const ATENDIMENTO_CATEGORIES = [
  'clínico',
  'trauma',
  'múltiplas vítimas',
  'incidente qbrn'
];

type AtendimentoColors = {
  clinico: string;
  trauma: string;
  multiplas: string;
  qbrn: string;
};

export const getAtendimentoColorByDescription = (
  tipoAtendimento: string,
  atendimentoColors: AtendimentoColors,
  fallbackColor: string
): string => {
  const tipo = tipoAtendimento.toLowerCase();

  if (tipo.includes('clínico') || tipo.includes('clinico')) {
    return atendimentoColors.clinico;
  }
  if (tipo.includes('trauma')) {
    return atendimentoColors.trauma;
  }
  if (tipo.includes('múltiplas') || tipo.includes('multiplas')) {
    return atendimentoColors.multiplas;
  }
  if (tipo.includes('qbrn') || tipo.includes('incidente q')) {
    return atendimentoColors.qbrn;
  }

  return fallbackColor;
};

export const resolveAtendimentoDescricaoById = (
  idAtendimento: string | number,
  tipoAtendimentoMap: Record<string, string>,
  atendimentoOptions?: any[]
): string => {
  if (Object.keys(tipoAtendimentoMap).length > 0) {
    return tipoAtendimentoMap[String(idAtendimento)] || 'Desconhecido';
  }

  if (atendimentoOptions && atendimentoOptions.length > 0) {
    const atendimento = atendimentoOptions.find(
      (opt: any) => String(opt.idtipo_atendimento) === String(idAtendimento)
    );
    return atendimento?.descricao || 'Desconhecido';
  }

  return 'Desconhecido';
};

export const matchesAtendimentoType = (
  notificacao: any,
  tipoDesc: string,
  getAtendimentoDescById: (idAtendimento: string | number) => string
): boolean => {
  const tipoDescLower = tipoDesc.toLowerCase();

  const tipoId = notificacao?.original?.tipo_atendimento_idtipo_atendimento;
  if (tipoId !== undefined) {
    const desc = getAtendimentoDescById(tipoId);
    return desc.toLowerCase().includes(tipoDescLower);
  }

  if (notificacao?.original?.tipo_atendimento?.descricao) {
    return notificacao.original.tipo_atendimento.descricao
      .toLowerCase()
      .includes(tipoDescLower);
  }

  if (notificacao?.tipoAtendimento) {
    return notificacao.tipoAtendimento.toLowerCase().includes(tipoDescLower);
  }

  return false;
};

export const isAtendimentoCategory = (categoriaLower: string): boolean => {
  return ATENDIMENTO_CATEGORIES.some((tipo) => categoriaLower.includes(tipo));
};
