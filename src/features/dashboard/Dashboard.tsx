// components/NotificationDashboard.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { processarDadosDashboard, ExportOptions, NotificacaoItem } from '@/features/notificationForms/components/exportUtilities';

interface DashboardProps {
  notificacoes: NotificacaoItem[];
  exportOptions: ExportOptions;
}

const NotificationDashboard = ({ notificacoes, exportOptions }: DashboardProps) => {
  const processedData = processarDadosDashboard(notificacoes, exportOptions);
  
  // Cores para os gráficos
  const COLORS = ['#3b5bdb', '#e05297', '#047481', '#374151', '#1a3cad'];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard de Notificações</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de Total de Notificações */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total de Notificações</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {processedData.totalNotificacoes.toLocaleString()}
          </p>
        </div>

        {/* Gráfico de Distribuição por Evento */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Tipo de Evento</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.distribuicaoEventos}
                  dataKey="quantidade"
                  nameKey="evento"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {processedData.distribuicaoEventos.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Distribuição por Tipo de Atendimento */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipos de Atendimento</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.distribuicaoEventos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="evento" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Evolução Temporal */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução Temporal das Ocorrências</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.evolucaoOcorrencias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDashboard;