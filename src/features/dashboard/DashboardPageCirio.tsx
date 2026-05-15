// src/pages/DashboardPageCirio.tsx - Dashboard do Círio de Nazaré otimizado
import React from 'react';
import EnhancedNotificationDashboard from '@/features/dashboard/NotificationDashboardCirio';
import { useDashboardDataLoader } from '@/features/dashboard/hooks/useDashboardDataLoader';

const DashboardPageCirio: React.FC = () => {
  const { notificacoes, exportOptions, loading, error, setNotificacoes } = useDashboardDataLoader();

  // 🔧 Callback para quando o dashboard filho atualizar dados
  const handleDataRefresh = React.useCallback((newData: any[]) => {
    console.log(`🔄 DashboardPageCirio: Recebendo ${newData.length} notificações do componente filho`);
    setNotificacoes(newData);
  }, []);

  // Componente para mostrar durante o carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          {/* Spinner de carregamento simples com CSS */}
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Carregando dados para o dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Isso pode levar alguns instantes.</p>
        </div>
      </div>
    );
  }

  // Componente para mostrar em caso de erro
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Erro</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Renderizar o dashboard com os dados carregados (mesmo se estiver vazio)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <EnhancedNotificationDashboard 
        notificacoes={notificacoes}
        exportOptions={exportOptions}
        onDataRefresh={handleDataRefresh}
      />
    </div>
  );
};

export default DashboardPageCirio;