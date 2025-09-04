// Componente de Análise Histórica - Gráficos Temporais com Dados Reais
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  BarChart2, 
  LineChart, 
  PieChart,
  Download
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import NotificacaoService from '@/services/NotificacaoService';

interface HistoricalDataProps {
  className?: string;
}

interface TimeSeriesData {
  date: string;
  count: number;
  sintomas: number;
  hipoteses: number;
  municipios: number;
}

interface MonthlyData {
  month: string;
  notifications: number;
  growth: number;
}

interface TopItemData {
  name: string;
  value: number;
  percentage: number;
}

const HistoricalAnalysis: React.FC<HistoricalDataProps> = ({ className = "" }) => {
  const [loading, setLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topSintomas, setTopSintomas] = useState<TopItemData[]>([]);
  const [topMunicipios, setTopMunicipios] = useState<TopItemData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  // Carregar dados
  useEffect(() => {
    loadHistoricalData();
  }, [selectedPeriod]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      
      // Calcular datas baseado no período selecionado
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Buscar dados do período
      const service = NotificacaoService;
      const response = await service.getByPeriodo(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        1,
        1000 // Buscar muitos registros para análise
      );

      // Processar dados para série temporal
      const processedTimeSeriesData = processTimeSeriesData(response.data, selectedPeriod);
      setTimeSeriesData(processedTimeSeriesData);

      // Processar dados mensais
      const processedMonthlyData = processMonthlyData(response.data);
      setMonthlyData(processedMonthlyData);

      // Processar top sintomas e municípios
      const { sintomas, municipios } = processTopItems(response.data);
      setTopSintomas(sintomas);
      setTopMunicipios(municipios);

    } catch (error) {
      console.error('Erro ao carregar análise histórica:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTimeSeriesData = (data: any[], period: string): TimeSeriesData[] => {
    const groupedData: { [key: string]: any[] } = {};
    
    data.forEach(item => {
      const date = new Date(item.data_notificacao || item.created_at);
      let key: string;
      
      if (period === '7d' || period === '30d') {
        key = date.toISOString().split('T')[0]; // Diário
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Mensal
      }
      
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(item);
    });

    return Object.keys(groupedData)
      .sort()
      .map(date => ({
        date: formatDateForChart(date, period),
        count: groupedData[date].length,
        sintomas: groupedData[date].reduce((acc, item) => acc + (item.sintomas?.length || 0), 0),
        hipoteses: groupedData[date].reduce((acc, item) => acc + (item.hipoteses_diagnosticas?.length || 0), 0),
        municipios: new Set(groupedData[date].map(item => item.municipio?.id)).size
      }));
  };

  const processMonthlyData = (data: any[]): MonthlyData[] => {
    const monthlyGroups: { [key: string]: any[] } = {};
    
    data.forEach(item => {
      const date = new Date(item.data_notificacao || item.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyGroups[key]) {
        monthlyGroups[key] = [];
      }
      monthlyGroups[key].push(item);
    });

    const sortedMonths = Object.keys(monthlyGroups).sort();
    
    return sortedMonths.map((month, index) => {
      const notifications = monthlyGroups[month].length;
      const prevMonth = index > 0 ? monthlyGroups[sortedMonths[index - 1]]?.length || 0 : 0;
      const growth = prevMonth > 0 ? ((notifications - prevMonth) / prevMonth) * 100 : 0;
      
      return {
        month: formatMonthName(month),
        notifications,
        growth: Math.round(growth * 100) / 100
      };
    });
  };

  const processTopItems = (data: any[]) => {
    // Processar sintomas
    const sintomasCount: { [key: string]: number } = {};
    const municipiosCount: { [key: string]: number } = {};
    
    data.forEach(item => {
      // Sintomas
      if (item.sintomas) {
        item.sintomas.forEach((sintoma: any) => {
          const name = sintoma.descricao || sintoma.nome || 'Não informado';
          sintomasCount[name] = (sintomasCount[name] || 0) + 1;
        });
      }
      
      // Municípios
      const municipio = item.municipio?.descricao || 'Não informado';
      municipiosCount[municipio] = (municipiosCount[municipio] || 0) + 1;
    });

    const totalNotifications = data.length;
    
    const sintomas = Object.entries(sintomasCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / totalNotifications) * 100)
      }));

    const municipios = Object.entries(municipiosCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / totalNotifications) * 100)
      }));

    return { sintomas, municipios };
  };

  const formatDateForChart = (date: string, period: string): string => {
    if (period === '7d' || period === '30d') {
      return new Date(date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
    } else {
      const [year, month] = date.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }
  };

  const formatMonthName = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  const exportData = () => {
    const csvContent = [
      'Data,Notificações,Sintomas,Hipóteses,Municípios',
      ...timeSeriesData.map(item => 
        `${item.date},${item.count},${item.sintomas},${item.hipoteses},${item.municipios}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analise-historica-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Análise Histórica</h3>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Seletor de período */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>

            {/* Tipo de gráfico */}
            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-2 text-sm ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <LineChart className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-2 text-sm ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <BarChart2 className="h-4 w-4" />
              </button>
            </div>

            {/* Exportar */}
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando análise histórica...</p>
        </div>
      ) : (
        <div className="p-6 space-y-8">
          {/* Gráfico principal de série temporal */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Tendência de Notificações no Tempo</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <RechartsLineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="Notificações" />
                  </RechartsLineChart>
                ) : (
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" name="Notificações" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total de Notificações</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {timeSeriesData.reduce((acc, item) => acc + item.count, 0)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Média Diária</p>
                  <p className="text-2xl font-bold text-green-900">
                    {Math.round(timeSeriesData.reduce((acc, item) => acc + item.count, 0) / (timeSeriesData.length || 1))}
                  </p>
                </div>
                <BarChart2 className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pico Máximo</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {Math.max(...timeSeriesData.map(item => item.count), 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Municípios Únicos</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Math.max(...timeSeriesData.map(item => item.municipios), 0)}
                  </p>
                </div>
                <PieChart className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Gráficos de distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Sintomas */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Principais Sintomas</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={topSintomas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topSintomas.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Municípios */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Principais Municípios</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMunicipios} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Crescimento mensal */}
          {monthlyData.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Crescimento Mensal</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="notifications" stroke="#3B82F6" strokeWidth={2} name="Notificações" />
                    <Line type="monotone" dataKey="growth" stroke="#EF4444" strokeWidth={2} name="Crescimento %" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoricalAnalysis;
