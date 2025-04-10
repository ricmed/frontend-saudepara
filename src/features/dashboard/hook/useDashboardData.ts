// hooks/useDashboardData.ts
import { processarDadosDashboard } from '@/features/notificationForms/components/exportUtilities';
import { NotificacaoItem, ExportOptions } from '@/features/notificationForms/components/types';

export const useDashboardData = (notificacoes: NotificacaoItem[], options: ExportOptions) => {
  const processarDados = () => {
    return processarDadosDashboard(notificacoes, options);
  };

  return { processarDados };
};