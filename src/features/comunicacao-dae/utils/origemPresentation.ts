import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';
import { LocalizacaoTipo } from '@/features/dashboard/components/MapaDashboardDAE';

export const getOrigemTipoBadgeClass = (origemTipo?: string): string => {
  if (origemTipo === 'CRS') return 'bg-blue-100 text-blue-800';
  if (origemTipo === 'NHE') return 'bg-green-100 text-green-800';
  if (origemTipo === 'CIEVS') return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
};

export const getLocalizacaoModalHeaderBgClass = (tipo: LocalizacaoTipo): string => {
  if (tipo === 'NHE') return 'bg-green-50';
  if (tipo === 'CIEVS') return 'bg-purple-50';
  return 'bg-orange-50';
};

export const getLocalizacaoModalDotBgClass = (tipo: LocalizacaoTipo): string => {
  if (tipo === 'NHE') return 'bg-green-600';
  if (tipo === 'CIEVS') return 'bg-purple-600';
  return 'bg-orange-600';
};

export const buildOrigemStats = (comunicacoes: ComunicacaoDae[]) => {
  const stats = {
    total: comunicacoes.length,
    crs: 0,
    nhe: 0,
    cievs: 0
  };

  comunicacoes.forEach((c) => {
    if (c.origem_tipo === 'CRS') stats.crs++;
    else if (c.origem_tipo === 'NHE') stats.nhe++;
    else if (c.origem_tipo === 'CIEVS') stats.cievs++;
  });

  return stats;
};

export const getOrigemSeriesKey = (origemTipo: string): 'CRS' | 'NHE' | 'CIEVS' | null => {
  if (origemTipo === 'CRS') return 'CRS';
  if (origemTipo === 'NHE') return 'NHE';
  if (origemTipo === 'CIEVS') return 'CIEVS';
  return null;
};
