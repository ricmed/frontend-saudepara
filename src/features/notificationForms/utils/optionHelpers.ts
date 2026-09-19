import { normalizeText } from './formUtils';

type NormalizeLabelsOptions = {
  includeNome?: boolean;
};

export const normalizeOptionLabels = <T extends Record<string, any>>(
  options: T[] | undefined | null,
  config: NormalizeLabelsOptions = {}
): T[] => {
  if (!options) return [];

  return options.map((option) => {
    const normalized = { ...option };
    if (normalized.descricao) {
      normalized.descricao = normalizeText(normalized.descricao);
    }
    if (config.includeNome && normalized.nome) {
      normalized.nome = normalizeText(normalized.nome);
    }
    return normalized;
  });
};

export const normalizeGeneroOptions = <T extends Record<string, any>>(
  options: T[] | undefined | null,
): Array<T & { idtipo_genero: number; descricao: string }> => {
  return normalizeOptionLabels(options, { includeNome: true })
    .map((option) => {
      const id = Number(option.idtipo_genero ?? option.id ?? option.value);
      const descricao = String(option.descricao || option.label || option.nome || '');
      return { ...option, idtipo_genero: id, descricao };
    })
    .filter((option) => Number.isFinite(option.idtipo_genero) && option.descricao);
};

export const orderOptionsByPriorityIncludes = <T extends { descricao: string }>(
  options: T[],
  priorities: string[]
): T[] => {
  return [...options].sort((a, b) => {
    const posA = priorities.findIndex((item) => a.descricao.includes(item));
    const posB = priorities.findIndex((item) => b.descricao.includes(item));
    if (posA !== -1 && posB !== -1) return posA - posB;
    if (posA !== -1) return -1;
    if (posB !== -1) return 1;
    return 0;
  });
};
