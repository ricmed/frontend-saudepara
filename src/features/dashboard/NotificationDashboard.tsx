import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  User, Activity, FileText, 
  AlertCircle, Clock, Filter, Download, ArrowLeft,
  RefreshCw, ClipboardList, BookOpen, 
  Heart, Award, Briefcase, GraduationCap, 
  Bell, Users, Building, FileImage, FileSearch2,
  ChevronDown, File
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Definição de tipos
interface DataItem {
  name: string;
  value: number;
  fill?: string;
}

const NotificationDashboard = () => {
  // Mock data para o dashboard
  const totalNotifications = 11207;
  const clinicalCases = 4434;
  const traumaCases = 3128;
  const outbreakCases = 1580;
  
  // Estado para filtragem interativa
  const [loading, setLoading] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState('Todos');
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Dados base
  const racaData = [
    { name: 'Branca', value: 2860 },
    { name: 'Preta', value: 1570 },
    { name: 'Amarela', value: 320 },
    { name: 'Parda', value: 5720 },
    { name: 'Indígena', value: 420 },
    { name: 'Ignorado', value: 317 }
  ];
  
  const escolaridadeData = [
    { name: 'Analfabeto', value: 425 },
    { name: 'Ensino fundamental incompleto', value: 1820 },
    { name: 'Ensino fundamental completo', value: 1246 },
    { name: 'Ensino médio incompleto', value: 1355 },
    { name: 'Ensino médio completo', value: 3255 },
    { name: 'Ensino superior incompleto', value: 958 },
    { name: 'Ensino superior completo', value: 1628 },
    { name: 'Pós-graduado', value: 285 },
    { name: 'Ignorado', value: 235 }
  ];
  
  const unidadeNotificadoraData = [
    { name: 'Hospital Metropolitano', value: 2354 },
    { name: 'Hospital Pronto Socorro Municipal', value: 1879 },
    { name: 'Hospital Universitário JBB', value: 1458 },
    { name: 'Hospital Regional Dr. Abelardo Santos', value: 1235 },
    { name: 'Hospital Geral de Belém', value: 985 },
    { name: 'Hospital Porto Dias', value: 856 },
    { name: 'Hospital Ophir Loyola', value: 725 },
    { name: 'Hospital Gaspar Vianna', value: 689 }
  ];
  
  const identidadeGeneroData = [
    { name: 'Mulher cisgênero', value: 5240, fill: '#FF9980' },
    { name: 'Homem cisgênero', value: 4875, fill: '#80B3FF' },
    { name: 'Mulher transgênero', value: 280, fill: '#FF80BF' },
    { name: 'Homem transgênero', value: 175, fill: '#80FFFF' },
    { name: 'Travesti', value: 95, fill: '#BF80FF' },
    { name: 'Não binário', value: 120, fill: '#FFFF80' },
    { name: 'Não se aplica', value: 198, fill: '#CCCCCC' },
    { name: 'Ignorado', value: 224, fill: '#999999' }
  ];
  
  const sintomasData = [
    { name: 'Febre', value: 4258, fill: '#3366CC' },
    { name: 'Tosse', value: 3645, fill: '#DC3912' },
    { name: 'Cefaleia', value: 3125, fill: '#FF9900' },
    { name: 'Artralgia', value: 2856, fill: '#109618' },
    { name: 'Mialgia', value: 2654, fill: '#990099' },
    { name: 'Dispneia', value: 1985, fill: '#0099C6' },
    { name: 'Diarreia', value: 1756, fill: '#DD4477' },
    { name: 'Coriza', value: 1654, fill: '#66AA00' },
    { name: 'Náuseas', value: 1562, fill: '#B82E2E' },
    { name: 'Dor Abdominal', value: 1432, fill: '#316395' }
  ];
  
  const tipoAtendimentoData = [
    { name: 'Clínico', value: 4434, fill: '#3366CC' },
    { name: 'Trauma', value: 3128, fill: '#DC3912' },
    { name: 'Surto', value: 1580, fill: '#FF9900' },
    { name: 'Múltiplas vítimas', value: 1255, fill: '#109618' },
    { name: 'Incidente QBRN', value: 810, fill: '#990099' }
  ];
  
  const publicoAtendidoData = [
    { name: 'Visitante', value: 6845, fill: '#3366CC' },
    { name: 'Trabalhador', value: 3256, fill: '#DC3912' },
    { name: 'Autoridade', value: 1106, fill: '#FF9900' }
  ];
  
  const hipoteseDiagnosticaData = [
    { name: 'Reação Alérgica', value: 1856, fill: '#3366CC' },
    { name: 'Intoxicação Alimentar', value: 1235, fill: '#DC3912' },
    { name: 'Estresse Térmico', value: 985, fill: '#FF9900' },
    { name: 'Evento Diabetes', value: 865, fill: '#109618' },
    { name: 'Evento Hipertensão', value: 723, fill: '#990099' },
    { name: 'Exposição IST', value: 425, fill: '#0099C6' },
    { name: 'Agulhada Intencional', value: 156, fill: '#DD4477' },
    { name: 'Outras Hipóteses', value: 4962, fill: '#66AA00' }
  ];
  
  const traumaData = [
    { name: 'Queda', value: 1254 },
    { name: 'Contusão', value: 856 },
    { name: 'Entorse/Luxação', value: 625 },
    { name: 'Fratura', value: 485 },
    { name: 'Lesão por Violência', value: 325 },
    { name: 'Acidente com moto', value: 285 },
    { name: 'Acidente com automóvel', value: 256 },
    { name: 'Outros traumas', value: 625 }
  ];
  
  // Estado para os dados filtrados de cada categoria
  const [filteredRaca, setFilteredRaca] = useState(racaData);
  const [filteredEscolaridade, setFilteredEscolaridade] = useState(escolaridadeData);
  const [filteredUnidades, setFilteredUnidades] = useState(unidadeNotificadoraData);
  const [filteredSintomas, setFilteredSintomas] = useState(sintomasData);
  const [filteredTipoAtendimento, setFilteredTipoAtendimento] = useState(tipoAtendimentoData);
  const [filteredPublico, setFilteredPublico] = useState(publicoAtendidoData);
  const [filteredHipoteses, setFilteredHipoteses] = useState(hipoteseDiagnosticaData);
  const [filteredTrauma, setFilteredTrauma] = useState(traumaData);
  const [filteredGenero, setFilteredGenero] = useState(identidadeGeneroData);
  
  // Aplicar filtros quando uma categoria é selecionada
  useEffect(() => {
    if (!selectedCategory) {
      // Restaurar dados originais
      setFilteredRaca(racaData);
      setFilteredEscolaridade(escolaridadeData);
      setFilteredUnidades(unidadeNotificadoraData);
      setFilteredSintomas(sintomasData);
      setFilteredTipoAtendimento(tipoAtendimentoData);
      setFilteredPublico(publicoAtendidoData);
      setFilteredHipoteses(hipoteseDiagnosticaData);
      setFilteredTrauma(traumaData);
      setFilteredGenero(identidadeGeneroData);
      return;
    }
    
    // Função para simular filtragem
    const getFilteredValue = (value: number) => {
      // Simular filtragem reduzindo valores por uma quantidade aleatória
      const reductionFactor = 0.4 + Math.random() * 0.4; // entre 40% e 80% do original
      return Math.round(value * reductionFactor);
    };
    
    // Filtrar cada conjunto de dados
    setFilteredRaca(racaData.map(item => ({
      ...item,
      value: getFilteredValue(item.value)
    })));
    
    setFilteredEscolaridade(escolaridadeData.map(item => ({
      ...item,
      value: getFilteredValue(item.value)
    })));
    
    setFilteredUnidades(unidadeNotificadoraData.map(item => ({
      ...item,
      value: getFilteredValue(item.value)
    })));
    
    setFilteredSintomas(sintomasData.map(item => ({
      ...item,
      value: getFilteredValue(item.value)
    })));
    
    setFilteredTipoAtendimento(tipoAtendimentoData.map(item => ({
      ...item,
      value: getFilteredValue(item.value)
    })));
    
    setFilteredPublico(publicoAtendidoData.map(item => ({
      ...item,
      value: getFilteredValue(item.value)
    })));
    
    setFilteredHipoteses(hipoteseDiagnosticaData.map(item => ({
      ...item,
      value: getFilteredValue(item.value)
    })));
    
    setFilteredTrauma(traumaData.map(item => ({
      ...item,
      value: getFilteredValue(item.value)
    })));
    
    setFilteredGenero(identidadeGeneroData.map(item => ({
      ...item,
      value: getFilteredValue(item.value)
    })));
    
  }, [selectedCategory]);
  
  const eventoOptions = ['Todos', 'COP30', 'Carnaval', 'Copa do Mundo Feminina', 'Círio de Nazaré'];
  
  const COLORS = ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395'];
  
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastUpdate(new Date().toLocaleString());
    }, 1000);
  };
  
  const handleEventoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEvento(e.target.value);
    setSelectedCategory(e.target.value !== 'Todos' ? e.target.value : null);
  };
  
  // Handler para charts que retornam dados diretos
  const handleDirectChartClick = (name: string) => {
    if (selectedCategory === name) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(name);
    }
  };
  
  // Handler para o botão de voltar
  const handleBackButton = () => {
    window.history.back();
  };

  // Referência para o conteúdo principal do dashboard
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Handlers de exportação com implementação real
  const handleExportPdf = async () => {
    setShowExportDropdown(false);
    
    if (!dashboardRef.current) return;
    
    try {
      // Mostrar mensagem de carregamento
      const loadingToast = alert('Gerando PDF...');
      
      // Capturar o dashboard como uma imagem
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Calcular proporções para o PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Criar novo documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Adicionar título
      pdf.setFontSize(16);
      pdf.text('Dashboard de Notificações - SESPA', 105, 15, { align: 'center' });
      
      // Adicionar data de geração
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
      
      // Adicionar imagem do dashboard
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.7), 
        'JPEG', 
        0, 30, 
        imgWidth, 
        imgHeight
      );
      
      // Download do PDF
      pdf.save(`dashboard_notificacoes_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar PDF. Por favor, tente novamente.');
    }
  };

  const handleExportWord = () => {
    setShowExportDropdown(false);
    
    if (!dashboardRef.current) return;
    
    try {
      // Capturar o conteúdo do dashboard
      const dashboardHTML = dashboardRef.current.innerHTML;
      
      // Criar um documento HTML que será compatível com Word
      const htmlDocument = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Dashboard de Notificações - SESPA</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .dashboard-export { max-width: 100%; }
            h1 { color: #1a56db; text-align: center; }
            .export-date { text-align: center; color: #666; margin-bottom: 30px; }
            .chart-container { margin: 20px 0; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>Dashboard de Notificações - SESPA</h1>
          <p class="export-date">Gerado em: ${new Date().toLocaleString()}</p>
          
          <div class="dashboard-export">
            <p>Total de Notificações: ${totalNotifications.toLocaleString()}</p>
            <p>Casos Clínicos: ${clinicalCases.toLocaleString()}</p>
            <p>Casos de Trauma: ${traumaCases.toLocaleString()}</p>
            <p>Surtos: ${outbreakCases.toLocaleString()}</p>
            <p>Período: ${selectedEvento}</p>
            
            <!-- Os gráficos serão representados como dados tabulares -->
            <div class="chart-container">
              <h2>Distribuição por Tipo de Atendimento</h2>
              <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
                <tr><th>Tipo</th><th>Quantidade</th></tr>
                ${filteredTipoAtendimento.map(item => `<tr><td>${item.name}</td><td>${item.value.toLocaleString()}</td></tr>`).join('')}
              </table>
            </div>
            
            <div class="chart-container">
              <h2>Distribuição por Público Atendido</h2>
              <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
                <tr><th>Público</th><th>Quantidade</th></tr>
                ${filteredPublico.map(item => `<tr><td>${item.name}</td><td>${item.value.toLocaleString()}</td></tr>`).join('')}
              </table>
            </div>
            
            <!-- Mais tabelas para outros dados -->
          </div>
        </body>
        </html>
      `;
      
      // Criar um blob e um link para download
      const blob = new Blob([htmlDocument], { type: 'application/msword' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `dashboard_notificacoes_${new Date().toISOString().split('T')[0]}.doc`;
      
      // Simular clique para iniciar o download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar para Word:', error);
      alert('Erro ao gerar documento Word. Por favor, tente novamente.');
    }
  };

  const handleExportPng = async () => {
    setShowExportDropdown(false);
    
    if (!dashboardRef.current) return;
    
    try {
      // Capturar o dashboard como uma imagem
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, // Melhorar qualidade
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Criar um link para download
      const link = document.createElement('a');
      link.download = `dashboard_notificacoes_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // Simular clique para iniciar o download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      alert('Erro ao gerar imagem. Por favor, tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-6">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 text-white mb-4 md:mb-0">
            <button
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Voltar"
              onClick={handleBackButton}
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <ClipboardList className="h-7 w-7" />
            <h1 className="text-xl md:text-2xl font-semibold">
              NOTIFICAÇÕES DURANTE EVENTOS EPIDEMIOLÓGICOS (NDEE)
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded text-white text-sm">
              <Clock className="h-4 w-4" />
              <span>Última atualização: {lastUpdate}</span>
            </div>
            
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Dados
            </button>
            
            {/* Botão de exportação com dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                onBlur={() => setTimeout(() => setShowExportDropdown(false), 200)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {showExportDropdown && (
                <div className="absolute right-0 mt-1 bg-white rounded shadow-lg py-1 z-20 min-w-[160px]">
                  <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <FileSearch2 className="h-4 w-4 text-red-500" />
                    Exportar PDF
                  </button>
                  <button
                    onClick={handleExportWord}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <File className="h-4 w-4 text-blue-500" />
                    Exportar Word
                  </button>
                  <button
                    onClick={handleExportPng}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <FileImage className="h-4 w-4 text-green-500" />
                    Exportar PNG
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Seção de Filtros */}
      <div className="max-w-7xl mx-auto mt-4 px-4">
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-blue-800">
            <Filter className="h-5 w-5" />
            <span className="font-medium">Filtro:</span>
          </div>
          
          <div className="flex-1">
            <div className="w-full md:w-64">
              <label className="block text-sm text-gray-600 mb-1">Evento</label>
              <select
                value={selectedEvento}
                onChange={handleEventoChange}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                {eventoOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          
          {selectedCategory && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span>Filtro ativo: {selectedCategory}</span>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="hover:bg-blue-200 rounded-full p-1"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Painel Principal - Adicionada referência */}
      <main ref={dashboardRef} className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {/* Cards de Resumo */}
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setSelectedCategory(null)}>
          <div className="p-3 bg-blue-100 text-blue-800 rounded-full">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Total de Notificações</h3>
            <p className="text-2xl font-bold text-blue-800">{totalNotifications.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => handleDirectChartClick('Clínico')}>
          <div className="p-3 bg-green-100 text-green-800 rounded-full">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Casos Clínicos</h3>
            <p className="text-2xl font-bold text-green-800">{clinicalCases.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => handleDirectChartClick('Trauma')}>
          <div className="p-3 bg-red-100 text-red-800 rounded-full">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Casos de Trauma</h3>
            <p className="text-2xl font-bold text-red-800">{traumaCases.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => handleDirectChartClick('Surto')}>
          <div className="p-3 bg-yellow-100 text-yellow-800 rounded-full">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Surtos</h3>
            <p className="text-2xl font-bold text-yellow-800">{outbreakCases.toLocaleString()}</p>
          </div>
        </div>
        
        {/* MOVIDO: Gráfico de Público Atendido (na parte superior) - ALTERADO PARA ROSCA */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-yellow-700" />
            <h3 className="text-sm font-medium text-gray-700">Distribuição por Público Atendido</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredPublico}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent ? (percent * 100).toFixed(0) : 0)}%`}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleDirectChartClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {filteredPublico.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                  formatter={(value) => [value.toLocaleString(), 'Notificações']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Gráfico de Tipo de Atendimento */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-700" />
            <h3 className="text-sm font-medium text-gray-700">Distribuição por Tipo de Atendimento</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredTipoAtendimento}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent ? (percent * 100).toFixed(0) : 0)}%`}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleDirectChartClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {filteredTipoAtendimento.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                  formatter={(value) => [value.toLocaleString(), 'Notificações']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* MODIFICADO: Unidades Notificadoras (agora em colunas) */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-orange-700" />
            <h3 className="text-sm font-medium text-gray-700">Unidades Notificadoras</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={filteredUnidades}
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 'dataMax']} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 10 }}
                  width={140} 
                />
                <Tooltip 
                  formatter={(value) => [value.toLocaleString(), 'Notificações']}
                  contentStyle={{ backgroundColor: '#fff' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8" 
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleDirectChartClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {filteredUnidades.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* MODIFICADO: Hipóteses Diagnósticas (agora em barras verticais como Sintomas) */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-purple-700" />
            <h3 className="text-sm font-medium text-gray-700">Hipóteses Diagnósticas</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredHipoteses}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#666" 
                  width={140}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                  formatter={(value) => [value.toLocaleString(), 'Notificações']}
                />
                <Bar 
                  dataKey="value" 
                  onClick={(data) => {
                    if (data && data.name) {
                      handleDirectChartClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {filteredHipoteses.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill || COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* MODIFICADO: Distribuição por Raça (agora em barras horizontais como Escolaridade) */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-green-700" />
            <h3 className="text-sm font-medium text-gray-700">Distribuição por Raça</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredRaca}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#666" 
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                  formatter={(value) => [value.toLocaleString(), 'Notificações']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3366CC" 
                  radius={[0, 4, 4, 0]} 
                  onClick={(data) => {
                    if (data && data.name) {
                      handleDirectChartClick(data.name);
                    }
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Escolaridade */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-blue-700" />
            <h3 className="text-sm font-medium text-gray-700">Distribuição por Escolaridade</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredEscolaridade}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 130, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#666" 
                  width={130}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                  formatter={(value) => [value.toLocaleString(), 'Notificações']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3366CC" 
                  radius={[0, 4, 4, 0]} 
                  onClick={(data) => {
                    if (data && data.name) {
                      handleDirectChartClick(data.name);
                    }
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Principais Sinais e Sintomas */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-700" />
            <h3 className="text-sm font-medium text-gray-700">Principais Sinais e Sintomas</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredSintomas.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#666" 
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                  formatter={(value) => [value.toLocaleString(), 'Notificações']}
                />
                <Bar 
                  dataKey="value" 
                  onClick={(data) => {
                    if (data && data.name) {
                      handleDirectChartClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {filteredSintomas.slice(0, 10).map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill || COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Tipos de Trauma */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-700" />
            <h3 className="text-sm font-medium text-gray-700">Tipos de Trauma</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} width={730} height={250} data={filteredTrauma}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                <Radar
                  name="Ocorrências"
                  dataKey="value"
                  stroke="#DC3912"
                  fill="#DC3912"
                  fillOpacity={0.6}
                  onClick={(event) => {
                    // Get the index from clicking the radar point
                    const dataIndex = (event as any)?.activeTooltipIndex;
                    if (dataIndex !== undefined && filteredTrauma[dataIndex]) {
                      handleDirectChartClick(filteredTrauma[dataIndex].name);
                    }
                  }}
                  cursor="pointer"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                  formatter={(value) => [value.toLocaleString(), 'Notificações']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Identidade de Gênero - ALTERADO PARA BARRAS HORIZONTAIS */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-700" />
            <h3 className="text-sm font-medium text-gray-700">Distribuição por Identidade de Gênero</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredGenero}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 130, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#666" 
                  width={130}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                  formatter={(value) => [value.toLocaleString(), 'Notificações']}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleDirectChartClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {filteredGenero.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill || COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
      
      {/* Rodapé */}
      <footer className="max-w-7xl mx-auto p-4 text-center text-xs text-gray-500 mt-4">
        <p>© 2025 Secretaria de Saúde Pública do Pará - SESPA. Todos os direitos reservados.</p>
        <p className="mt-1">Portal Saúde Pará</p>
      </footer>
    </div>
  );
};

export default NotificationDashboard;