import React, { useState, useEffect } from 'react';
import { Users, Download } from 'lucide-react';
import { NotificacaoService } from '../../../services/NotificacaoService';

interface PiramideEtariaItem {
  faixaEtaria: string;
  homemCisgenero: number;
  mulherCisgenero: number;
  homemTransgenero: number;
  mulherTransgenero: number;
  travesti: number;
  naoBinario: number;
  ignorado: number;
  naoSeAplica: number;
  total: number;
}

interface PiramideEtariaChartProps {
  className?: string;
  toggleFilter?: (category: string, value: string) => void;
  activeFilters?: Record<string, any>;
  filteredData?: any[];
}

const PiramideEtariaChart: React.FC<PiramideEtariaChartProps> = ({ 
  className = "",
  toggleFilter,
  activeFilters = {},
  filteredData
}) => {
  const [data, setData] = useState<PiramideEtariaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Recarregar dados quando filteredData mudar (apenas se não há filtros ativos nos novos gráficos)
  useEffect(() => {
    if (filteredData && !activeFilters?.faixaEtaria) {
      loadData();
    }
  }, [filteredData, activeFilters?.faixaEtaria]);

  const getFaixaEtaria = (idadeMeses: number): string => {
    if (idadeMeses < 12) return 'Menor de 1 ano';
    
    const anos = Math.floor(idadeMeses / 12);
    
    if (anos >= 1 && anos <= 4) return '1-4 anos';
    if (anos >= 5 && anos <= 9) return '5-9 anos';
    if (anos >= 10 && anos <= 14) return '10-14 anos';
    if (anos >= 15 && anos <= 19) return '15-19 anos';
    if (anos >= 20 && anos <= 24) return '20-24 anos';
    if (anos >= 25 && anos <= 29) return '25-29 anos';
    if (anos >= 30 && anos <= 34) return '30-34 anos';
    if (anos >= 35 && anos <= 39) return '35-39 anos';
    if (anos >= 40 && anos <= 44) return '40-44 anos';
    if (anos >= 45 && anos <= 49) return '45-49 anos';
    if (anos >= 50 && anos <= 54) return '50-54 anos';
    if (anos >= 55 && anos <= 59) return '55-59 anos';
    if (anos >= 60 && anos <= 64) return '60-64 anos';
    if (anos >= 65 && anos <= 69) return '65-69 anos';
    if (anos >= 70 && anos <= 74) return '70-74 anos';
    if (anos >= 75 && anos <= 79) return '75-79 anos';
    
    return '80 ou mais anos';
  };

  // Função para classificar gênero de forma inclusiva com todas as categorias
  const classificarGenero = (descricaoGenero: string): keyof Omit<PiramideEtariaItem, 'faixaEtaria' | 'total'> => {
    if (!descricaoGenero) return 'ignorado';
    
    const genero = descricaoGenero.toLowerCase().trim();
    
    // Classificações específicas conforme solicitado
    if (genero.includes('homem cisgênero') || genero === 'homem cisgênero') {
      return 'homemCisgenero';
    }
    
    if (genero.includes('mulher cisgênero') || genero === 'mulher cisgênero') {
      return 'mulherCisgenero';
    }
    
    if (genero.includes('homem transgênero') || genero === 'homem transgênero') {
      return 'homemTransgenero';
    }
    
    if (genero.includes('mulher transgênero') || genero === 'mulher transgênero') {
      return 'mulherTransgenero';
    }
    
    if (genero.includes('travesti') || genero === 'travesti') {
      return 'travesti';
    }
    
    if (genero.includes('não binário') || genero === 'não binário' || genero.includes('nao binario')) {
      return 'naoBinario';
    }
    
    if (genero.includes('não se aplica') || genero === 'não se aplica' || genero.includes('nao se aplica')) {
      return 'naoSeAplica';
    }
    
    // Casos não específicos - classificar como ignorado
    return 'ignorado';
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Carregando dados para pirâmide etária...');
      
      // Usar dados filtrados se disponíveis, senão buscar todos
      let result;
      if (filteredData && filteredData.length > 0) {
        console.log('📊 Usando dados filtrados:', filteredData.length, 'registros');
        result = { data: filteredData };
      } else {
        // Usar endpoint existente de notificações com dados do paciente
        result = await NotificacaoService.getAll(1, 1000); // Buscar muitos registros
        console.log('📊 Dados recebidos:', result);
      }
      
      console.log('📊 Total de notificações:', result.data?.length || 0);
      
      // Processar dados para gerar pirâmide etária
      const grupos: { [key: string]: { 
        homemCisgenero: number; 
        mulherCisgenero: number; 
        homemTransgenero: number; 
        mulherTransgenero: number; 
        travesti: number; 
        naoBinario: number; 
        ignorado: number; 
        naoSeAplica: number; 
      } } = {};
      
      result.data.forEach((notificacao: any, index: number) => {
        console.log(`🔍 Processando notificação ${index + 1}:`, {
          id: notificacao.id,
          pacienteNome: notificacao.paciente,
          pacienteCompleto: notificacao.original?.paciente
        });
        
        // Os dados completos do paciente estão em notificacao.original.paciente
        const paciente = notificacao.original?.paciente;
        
        if (!paciente) {
          console.log(`   ⚠️ Notificação ${notificacao.id} sem dados de paciente em original.paciente`);
          return;
        }
        
        if (paciente.idade === null || paciente.idade === undefined) {
          console.log(`   ⚠️ Paciente ${paciente.idpaciente} sem idade informada`);
          return;
        }
        
        const faixa = getFaixaEtaria(paciente.idade);
        const generoDescricao = paciente.tipo_genero?.descricao;
        const generoClassificado = classificarGenero(generoDescricao);
        
        console.log(`   ✅ Paciente processado: ID=${paciente.idpaciente}, Nome=${paciente.nome}, Idade=${paciente.idade} meses, Faixa=${faixa}, Gênero Original=${generoDescricao}, Classificado=${generoClassificado}`);
        
        if (!grupos[faixa]) {
          grupos[faixa] = { 
            homemCisgenero: 0, 
            mulherCisgenero: 0, 
            homemTransgenero: 0, 
            mulherTransgenero: 0, 
            travesti: 0, 
            naoBinario: 0, 
            ignorado: 0, 
            naoSeAplica: 0 
          };
        }
        
        grupos[faixa][generoClassificado]++;
      });
      
      console.log('📈 Grupos etários processados:', grupos);
      
      // Converter para array ordenado
      const faixasOrdenadas = [
        'Menor de 1 ano', '1-4 anos', '5-9 anos', '10-14 anos', '15-19 anos',
        '20-24 anos', '25-29 anos', '30-34 anos', '35-39 anos', '40-44 anos',
        '45-49 anos', '50-54 anos', '55-59 anos', '60-64 anos', '65-69 anos',
        '70-74 anos', '75-79 anos', '80 ou mais anos'
      ];
      
      const processedData = faixasOrdenadas.map(faixa => {
        const grupo = grupos[faixa];
        return {
          faixaEtaria: faixa,
          homemCisgenero: grupo?.homemCisgenero || 0,
          mulherCisgenero: grupo?.mulherCisgenero || 0,
          homemTransgenero: grupo?.homemTransgenero || 0,
          mulherTransgenero: grupo?.mulherTransgenero || 0,
          travesti: grupo?.travesti || 0,
          naoBinario: grupo?.naoBinario || 0,
          ignorado: grupo?.ignorado || 0,
          naoSeAplica: grupo?.naoSeAplica || 0,
          total: (grupo?.homemCisgenero || 0) + (grupo?.mulherCisgenero || 0) + 
                 (grupo?.homemTransgenero || 0) + (grupo?.mulherTransgenero || 0) + 
                 (grupo?.travesti || 0) + (grupo?.naoBinario || 0) + 
                 (grupo?.ignorado || 0) + (grupo?.naoSeAplica || 0)
        };
      }).filter(item => item.total > 0);
      
      console.log('📊 Dados finais para o gráfico:', processedData);
      
      setData(processedData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados de pirâmide etária:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Faixa Etária', 'Homem Cisgênero', 'Mulher Cisgênero', 'Homem Transgênero', 'Mulher Transgênero', 'Travesti', 'Não Binário', 'Ignorado', 'Não se Aplica', 'Total'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        `"${item.faixaEtaria}",${item.homemCisgenero},${item.mulherCisgenero},${item.homemTransgenero},${item.mulherTransgenero},${item.travesti},${item.naoBinario},${item.ignorado},${item.naoSeAplica},${item.total}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `piramide-etaria-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para verificar se uma faixa etária está filtrada
  const isFaixaEtariaFiltered = (faixaEtaria: string) => {
    return activeFilters?.faixaEtaria === faixaEtaria;
  };

  // Função para obter a cor da barra baseada no filtro
  const getBarColor = (faixaEtaria: string, genero: string) => {
    const baseColors = {
      homemCisgenero: "#3B82F6",
      mulherCisgenero: "#EC4899",
      outros: "#8B5CF6"
    };
    
    if (!activeFilters || Object.keys(activeFilters).length === 0) {
      return baseColors[genero as keyof typeof baseColors] || baseColors.outros;
    }
    
    const isFiltered = isFaixaEtariaFiltered(faixaEtaria);
    const color = baseColors[genero as keyof typeof baseColors] || baseColors.outros;
    
    return isFiltered ? color : color + "80"; // 80 = transparência 50%
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-80">
          <div className="text-gray-500">Carregando dados da pirâmide etária...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-80">
          <div className="text-red-500">Erro: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Pirâmide Etária por Sexo</h3>
            <p className="text-sm text-gray-600">Distribuição de casos por faixa etária e sexo</p>
          </div>
        </div>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          title="Exportar dados"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>

      {/* Gráfico */}
      <div className="h-96">
        {data.length > 0 ? (
          <div className="h-full">
            {/* Pirâmide Etária Simplificada */}
            <div className="space-y-1 overflow-y-auto max-h-80">
              {data.slice().reverse().map((item) => {
                const maxValue = Math.max(...data.map(d => d.total));
                const totalMasculino = item.homemCisgenero + item.homemTransgenero;
                const totalFeminino = item.mulherCisgenero + item.mulherTransgenero + item.travesti;
                const outros = item.naoBinario + item.ignorado + item.naoSeAplica;
                
                return (
                  <div key={item.faixaEtaria} className="flex items-center">
                    {/* Lado esquerdo - Masculino */}
                    <div className="flex-1 flex justify-end pr-2">
                      <div 
                        className={`h-8 flex items-center justify-end pr-2 text-white text-sm font-medium rounded-l cursor-pointer hover:opacity-80 transition-all ${
                          isFaixaEtariaFiltered(item.faixaEtaria) ? 'ring-2 ring-blue-300' : ''
                        }`}
                        style={{ 
                          width: `${(totalMasculino / maxValue) * 100}%`,
                          backgroundColor: getBarColor(item.faixaEtaria, 'homemCisgenero'),
                          minWidth: totalMasculino > 0 ? '30px' : '0px'
                        }}
                        title={`Masculino: ${totalMasculino} (Homem Cis: ${item.homemCisgenero}, Homem Trans: ${item.homemTransgenero}) - Clique para filtrar`}
                        onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria)}
                      >
                        {totalMasculino > 0 && totalMasculino}
                      </div>
                    </div>
                    
                    {/* Centro - Label da faixa etária */}
                    <div 
                      className={`w-32 text-center text-sm font-medium bg-gray-100 py-2 px-3 rounded border-2 cursor-pointer hover:bg-gray-200 transition-colors ${
                        isFaixaEtariaFiltered(item.faixaEtaria) ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria)}
                      title={`${item.faixaEtaria} - Clique para filtrar`}
                    >
                      {item.faixaEtaria}
                    </div>
                    
                    {/* Lado direito - Feminino e Outros */}
                    <div className="flex-1 flex justify-start pl-2">
                      <div className="flex">
                        <div 
                          className={`h-8 flex items-center justify-start pl-2 text-white text-sm font-medium rounded-r cursor-pointer hover:opacity-80 transition-all ${
                            isFaixaEtariaFiltered(item.faixaEtaria) ? 'ring-2 ring-pink-300' : ''
                          }`}
                          style={{ 
                            width: `${(totalFeminino / maxValue) * 100}%`,
                            backgroundColor: getBarColor(item.faixaEtaria, 'mulherCisgenero'),
                            minWidth: totalFeminino > 0 ? '30px' : '0px'
                          }}
                          title={`Feminino: ${totalFeminino} (Mulher Cis: ${item.mulherCisgenero}, Mulher Trans: ${item.mulherTransgenero}, Travesti: ${item.travesti}) - Clique para filtrar`}
                          onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria)}
                        >
                          {totalFeminino > 0 && totalFeminino}
                        </div>
                        
                        {/* Outros - pequena barra adicional */}
                        {outros > 0 && (
                          <div 
                            className={`h-8 flex items-center justify-start pl-1 text-white text-xs rounded-r ml-1 cursor-pointer hover:opacity-80 transition-all ${
                              isFaixaEtariaFiltered(item.faixaEtaria) ? 'ring-2 ring-gray-300' : ''
                            }`}
                            style={{ 
                              width: `${(outros / maxValue) * 50}%`,
                              backgroundColor: getBarColor(item.faixaEtaria, 'outros'),
                              minWidth: '25px'
                            }}
                            title={`Outros: ${outros} (Não Binário: ${item.naoBinario}, Ignorado: ${item.ignorado}, Não se Aplica: ${item.naoSeAplica}) - Clique para filtrar`}
                            onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria)}
                          >
                            {outros}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Legenda simplificada */}
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Masculino</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                <span>Feminino</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>Outros</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Nenhum dado disponível para o período selecionado</div>
          </div>
        )}
      </div>

      {/* Resumo Detalhado */}
      {data.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-4 gap-3 text-center text-sm">
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-lg font-bold text-blue-600">
                {data.reduce((sum, item) => sum + item.homemCisgenero, 0)}
              </div>
              <div className="text-xs text-blue-600">Homem Cisgênero</div>
            </div>
            <div className="bg-pink-50 p-2 rounded">
              <div className="text-lg font-bold text-pink-600">
                {data.reduce((sum, item) => sum + item.mulherCisgenero, 0)}
              </div>
              <div className="text-xs text-pink-600">Mulher Cisgênero</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-lg font-bold text-purple-600">
                {data.reduce((sum, item) => sum + item.homemTransgenero, 0)}
              </div>
              <div className="text-xs text-purple-600">Homem Transgênero</div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="text-lg font-bold text-red-600">
                {data.reduce((sum, item) => sum + item.mulherTransgenero, 0)}
              </div>
              <div className="text-xs text-red-600">Mulher Transgênero</div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3 text-center text-sm">
            <div className="bg-green-50 p-2 rounded">
              <div className="text-lg font-bold text-green-600">
                {data.reduce((sum, item) => sum + item.travesti, 0)}
              </div>
              <div className="text-xs text-green-600">Travesti</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <div className="text-lg font-bold text-yellow-600">
                {data.reduce((sum, item) => sum + item.naoBinario, 0)}
              </div>
              <div className="text-xs text-yellow-600">Não Binário</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-lg font-bold text-gray-600">
                {data.reduce((sum, item) => sum + item.ignorado, 0)}
              </div>
              <div className="text-xs text-gray-600">Ignorado</div>
            </div>
            <div className="bg-orange-50 p-2 rounded">
              <div className="text-lg font-bold text-orange-600">
                {data.reduce((sum, item) => sum + item.naoSeAplica, 0)}
              </div>
              <div className="text-xs text-orange-600">Não se Aplica</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-indigo-50 p-3 rounded inline-block">
              <div className="text-2xl font-bold text-indigo-600">
                {data.reduce((sum, item) => sum + item.total, 0)}
              </div>
              <div className="text-sm text-indigo-600">Total Geral</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PiramideEtariaChart;
