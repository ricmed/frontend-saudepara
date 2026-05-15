import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';

export const formatDateTimePtBr = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const formatDateOnlyPtBr = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};

export const formatTimeOnlyPtBr = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleTimeString('pt-BR');
  } catch {
    return dateString;
  }
};

export const matchesComunicacaoByLocalizacaoId = (
  comunicacao: ComunicacaoDae,
  localizacaoId: string
): boolean => {
  const [tipo, id] = localizacaoId.split('-');
  const origemId = Number(id);
  if (!tipo || !Number.isFinite(origemId)) return false;

  return comunicacao.origem_tipo === tipo.toUpperCase() && comunicacao.origem_id === origemId;
};

export const filterComunicacoesByLocalizacao = (
  comunicacoes: ComunicacaoDae[],
  localizacaoId: string
): ComunicacaoDae[] => {
  return comunicacoes.filter((c) => matchesComunicacaoByLocalizacaoId(c, localizacaoId));
};
