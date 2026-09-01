import type { ObservaSusResourceStatus } from '../types/observasus';

const STATUS_LABELS: Record<ObservaSusResourceStatus, string> = {
  AVAILABLE: 'Disponível',
  MIGRATING: 'Em migração',
  COMING_SOON: 'Em breve',
  ARCHIVED: 'Arquivado',
};

export function formatObservaSusStatus(status: ObservaSusResourceStatus): string {
  return STATUS_LABELS[status];
}

export function formatObservaSusDate(isoDate?: string): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
