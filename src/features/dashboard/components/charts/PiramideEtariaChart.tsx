import React, { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import ChartExportMenu from '../../../../components/common/ChartExportMenu';

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
  toggleFilter?: (category: string, value: string, multiSelect?: boolean) => void;
  activeFilters?: Record<string, any>;
  filteredData?: any[];
  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
}

const PiramideEtariaChart: React.FC<PiramideEtariaChartProps> = ({ 
  className = "",
  exportMenu, // 🆕 Prop para menu de exportação personalizado
  toggleFilter,
  activeFilters = {},
  filteredData
}) => {
  const [data, setData] = useState<PiramideEtariaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ctrlPressedRef = useRef(false);

  // Rastrear tecla Ctrl pressionada
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        ctrlPressedRef.current = true;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        ctrlPressedRef.current = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Recarregar dados quando filteredData mudar
  useEffect(() => {
    loadData();
  }, [filteredData]); // Reagir a qualquer mudança em filteredData (incluindo quando fica vazio)

  // Função para calcular faixa etária - DEVE MANTER O MESMO FORMATO do NotificationDashboard
  const getFaixaEtaria = (idadeMeses: number): string => {
    if (idadeMeses < 12) return 'Menor de 1 ano';
    
    const anos = Math.floor(idadeMeses / 12);
    
    // ✅ CORRIGIDO: Usar o mesmo formato que o NotificationDashboard ("1 a 4 anos" em vez de "1-4 anos")
    if (anos >= 1 && anos <= 4) return '1 a 4 anos';
    if (anos >= 5 && anos <= 9) return '5 a 9 anos';
    if (anos >= 10 && anos <= 14) return '10 a 14 anos';
    if (anos >= 15 && anos <= 19) return '15 a 19 anos';
    if (anos >= 20 && anos <= 24) return '20 a 24 anos';
    if (anos >= 25 && anos <= 29) return '25 a 29 anos';
    if (anos >= 30 && anos <= 34) return '30 a 34 anos';
    if (anos >= 35 && anos <= 39) return '35 a 39 anos';
    if (anos >= 40 && anos <= 44) return '40 a 44 anos';
    if (anos >= 45 && anos <= 49) return '45 a 49 anos';
    if (anos >= 50 && anos <= 54) return '50 a 54 anos';
    if (anos >= 55 && anos <= 59) return '55 a 59 anos';
    if (anos >= 60 && anos <= 64) return '60 a 64 anos';
    if (anos >= 65 && anos <= 69) return '65 a 69 anos';
    if (anos >= 70 && anos <= 74) return '70 a 74 anos';
    if (anos >= 75 && anos <= 79) return '75 a 79 anos';
    
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
      
      // 🆕 CORREÇÃO: SEMPRE usar dados filtrados (mesmo se vazio), nunca fazer fallback para API
      // Isso garante que respeitamos TODOS os filtros (evento + data + outros)
      if (filteredData === undefined) {
        console.log('⏳ PiramideEtaria - Aguardando dados filtrados...');
        setLoading(false);
        return;
      }
      
      console.log('📊 PiramideEtaria - Usando dados filtrados:', filteredData.length, 'registros');
      const result = { data: filteredData };
      
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
      
      // ✅ CORRIGIDO: Converter para array ordenado com formato consistente
      const faixasOrdenadas = [
        'Menor de 1 ano', '1 a 4 anos', '5 a 9 anos', '10 a 14 anos', '15 a 19 anos',
        '20 a 24 anos', '25 a 29 anos', '30 a 34 anos', '35 a 39 anos', '40 a 44 anos',
        '45 a 49 anos', '50 a 54 anos', '55 a 59 anos', '60 a 64 anos', '65 a 69 anos',
        '70 a 74 anos', '75 a 79 anos', '80 ou mais anos'
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

  // Função para verificar se uma faixa etária está filtrada
  const isFaixaEtariaFiltered = (faixaEtaria: string) => {
    const filterValue = activeFilters?.faixaEtaria;
    if (!filterValue) return false;
    if (Array.isArray(filterValue)) {
      return filterValue.includes(faixaEtaria);
    }
    return filterValue === faixaEtaria;
  };

  // Função para obter a cor da barra baseada no filtro
  // Cores seguindo as recomendações: azuis para masculino, rosa/vermelho para feminino, roxo para NB, cinza para ignorado/NSA
  const getBarColor = (faixaEtaria: string, genero: string) => {
    const baseColors = {
      homemCisgenero: "#3B82F6",      // Azul forte
      homemTransgenero: "#60A5FA",    // Azul mais claro (menor saturação)
      mulherCisgenero: "#EC4899",     // Rosa/Pink forte
      mulherTransgenero: "#F472B6",   // Rosa mais claro (menor saturação)
      travesti: "#EF4444",            // Vermelho
      naoBinario: "#8B5CF6",          // Roxo/Teal neutro
      ignorado: "#9CA3AF",            // Cinza
      naoSeAplica: "#D1D5DB"          // Cinza mais claro
    };
    
    const color = baseColors[genero as keyof typeof baseColors] || baseColors.ignorado;
    
    // Verificar se há filtro de faixa etária ativo
    const filterValue = activeFilters?.faixaEtaria;
    const hasFaixaEtariaFilter = filterValue !== null && filterValue !== undefined;
    
    // Se não há filtro ou se esta faixa está selecionada, usar cor normal
    if (!hasFaixaEtariaFilter || isFaixaEtariaFiltered(faixaEtaria)) {
      return color;
    }
    
    // Se há filtro ativo mas esta faixa não está selecionada, usar cor com transparência
    return color + "4D"; // 4D = transparência ~30%
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
            <h3 className="text-xl font-semibold text-gray-900">Pirâmide Etária por Identidade de Gênero</h3>
            <p className="text-sm text-gray-600">Distribuição de casos por faixa etária e identidade de gênero</p>
          </div>
        </div>
        
        {exportMenu || (
          <ChartExportMenu 
            chartId="piramide-etaria-completa" 
            chartData={data.map(item => ({ name: item.faixaEtaria, value: item.total }))} 
            chartTitle="Pirâmide Etária por Identidade de Gênero" 
            buttonVariant="icon"
          />
        )}
      </div>

      {/* Gráfico */}
      <div id="piramide-etaria-completa" className="min-h-96">
        {data.length > 0 ? (
          <div className="grid grid-cols-12 gap-4">
            {/* Pirâmide Principal (cols 1-9) */}
            <div className="col-span-9">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Pirâmide Principal - Masculino × Feminino</h4>
              <div className="space-y-1 overflow-y-auto max-h-[500px]">
                {data.slice().reverse().map((item) => {
                  const maxValue = Math.max(...data.map(d => 
                    Math.max(
                      d.homemCisgenero + d.homemTransgenero,
                      d.mulherCisgenero + d.mulherTransgenero + d.travesti
                    )
                  ));
                  
                  // Identidades masculinas (empilhadas)
                  const homemCis = item.homemCisgenero;
                  const homemTrans = item.homemTransgenero;
                  const totalMasculino = homemCis + homemTrans;
                  
                  // Identidades femininas (empilhadas)
                  const mulherCis = item.mulherCisgenero;
                  const mulherTrans = item.mulherTransgenero;
                  const travesti = item.travesti;
                  const totalFeminino = mulherCis + mulherTrans + travesti;
                  
                  return (
                    <div key={item.faixaEtaria} className="flex items-center">
                      {/* Lado esquerdo - MASCULINO (empilhado: Cis + Trans) */}
                      <div className="flex-1 flex justify-end pr-0.5">
                        <div className="flex h-8 rounded-l overflow-hidden" style={{ width: `${(totalMasculino / maxValue) * 100}%`, minWidth: totalMasculino > 0 ? '30px' : '0' }}>
                          {/* Homem Trans (mais claro, aparece primeiro visualmente à esquerda) */}
                          {homemTrans > 0 && (
                            <div 
                              className={`flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all ${
                                isFaixaEtariaFiltered(item.faixaEtaria) ? 'ring-2 ring-blue-300' : ''
                              }`}
                              style={{ 
                                width: `${(homemTrans / totalMasculino) * 100}%`,
                                backgroundColor: getBarColor(item.faixaEtaria, 'homemTransgenero'),
                                minWidth: '20px'
                              }}
                              title={`Homem Transgênero: ${homemTrans} - Clique para filtrar`}
                              onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria, ctrlPressedRef.current)}
                            >
                              {homemTrans}
                            </div>
                          )}
                          {/* Homem Cis (mais escuro, predominante) */}
                          {homemCis > 0 && (
                            <div 
                              className={`flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-all ${
                                isFaixaEtariaFiltered(item.faixaEtaria) ? 'ring-2 ring-blue-300' : ''
                              }`}
                              style={{ 
                                width: `${(homemCis / totalMasculino) * 100}%`,
                                backgroundColor: getBarColor(item.faixaEtaria, 'homemCisgenero'),
                                minWidth: '20px'
                              }}
                              title={`Homem Cisgênero: ${homemCis} - Clique para filtrar`}
                              onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria, ctrlPressedRef.current)}
                            >
                              {homemCis}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Centro - Label da faixa etária */}
                      <div 
                        className={`w-32 text-center text-xs font-bold bg-gray-100 py-2 px-2 rounded border-2 cursor-pointer hover:bg-gray-200 transition-colors ${
                          isFaixaEtariaFiltered(item.faixaEtaria) ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria, ctrlPressedRef.current)}
                        title={`${item.faixaEtaria} - Clique para filtrar`}
                      >
                        {item.faixaEtaria}
                      </div>
                      
                      {/* Lado direito - FEMININO (empilhado: Cis + Trans + Travesti) */}
                      <div className="flex-1 flex justify-start pl-0.5">
                        <div className="flex h-8 rounded-r overflow-hidden" style={{ width: `${(totalFeminino / maxValue) * 100}%`, minWidth: totalFeminino > 0 ? '30px' : '0' }}>
                          {/* Mulher Cis (mais escura, predominante) */}
                          {mulherCis > 0 && (
                            <div 
                              className={`flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-all ${
                                isFaixaEtariaFiltered(item.faixaEtaria) ? 'ring-2 ring-pink-300' : ''
                              }`}
                              style={{ 
                                width: `${(mulherCis / totalFeminino) * 100}%`,
                                backgroundColor: getBarColor(item.faixaEtaria, 'mulherCisgenero'),
                                minWidth: '20px'
                              }}
                              title={`Mulher Cisgênero: ${mulherCis} - Clique para filtrar`}
                              onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria, ctrlPressedRef.current)}
                            >
                              {mulherCis}
                            </div>
                          )}
                          {/* Mulher Trans (mais clara) */}
                          {mulherTrans > 0 && (
                            <div 
                              className={`flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all ${
                                isFaixaEtariaFiltered(item.faixaEtaria) ? 'ring-2 ring-pink-300' : ''
                              }`}
                              style={{ 
                                width: `${(mulherTrans / totalFeminino) * 100}%`,
                                backgroundColor: getBarColor(item.faixaEtaria, 'mulherTransgenero'),
                                minWidth: '20px'
                              }}
                              title={`Mulher Transgênero: ${mulherTrans} - Clique para filtrar`}
                              onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria, ctrlPressedRef.current)}
                            >
                              {mulherTrans}
                            </div>
                          )}
                          {/* Travesti (vermelho) */}
                          {travesti > 0 && (
                            <div 
                              className={`flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all ${
                                isFaixaEtariaFiltered(item.faixaEtaria) ? 'ring-2 ring-red-300' : ''
                              }`}
                              style={{ 
                                width: `${(travesti / totalFeminino) * 100}%`,
                                backgroundColor: getBarColor(item.faixaEtaria, 'travesti'),
                                minWidth: '20px'
                              }}
                              title={`Travesti: ${travesti} - Clique para filtrar`}
                              onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria, ctrlPressedRef.current)}
                            >
                              {travesti}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Painéis Auxiliares (cols 10-12) */}
            <div className="col-span-3 space-y-6">
              {/* Painel Não Binário */}
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <h4 className="text-xs font-semibold text-purple-800 mb-2">Não Binário</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {data.slice().reverse().map((item) => {
                    const maxNB = Math.max(...data.map(d => d.naoBinario), 1);
                    return item.naoBinario > 0 ? (
                      <div key={`nb-${item.faixaEtaria}`} className="flex items-center gap-1">
                        <div className="w-16 text-xs text-gray-700 truncate" title={item.faixaEtaria}>
                          {item.faixaEtaria.split(' ')[0]}
                        </div>
                        <div 
                          className="h-5 rounded flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-90"
                          style={{ 
                            width: `${(item.naoBinario / maxNB) * 100}%`,
                            backgroundColor: getBarColor(item.faixaEtaria, 'naoBinario'),
                            minWidth: '20px'
                          }}
                          title={`Não Binário: ${item.naoBinario} (${item.faixaEtaria})`}
                          onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria, ctrlPressedRef.current)}
                        >
                          {item.naoBinario}
                        </div>
                      </div>
                    ) : null;
                  })}
                  {data.every(d => d.naoBinario === 0) && (
                    <div className="text-xs text-gray-500 italic text-center py-2">Sem registros</div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-purple-200 text-center">
                  <span className="text-lg font-bold text-purple-700">
                    {data.reduce((sum, item) => sum + item.naoBinario, 0)}
                  </span>
                  <div className="text-xs text-purple-600">Total</div>
                </div>
              </div>
              
              {/* Painel Ignorado/NSA */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Qualidade do Dado</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {data.slice().reverse().map((item) => {
                    const totalQualidade = item.ignorado + item.naoSeAplica;
                    const maxQual = Math.max(...data.map(d => d.ignorado + d.naoSeAplica), 1);
                    return totalQualidade > 0 ? (
                      <div key={`qual-${item.faixaEtaria}`} className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-16 text-xs text-gray-700 truncate" title={item.faixaEtaria}>
                            {item.faixaEtaria.split(' ')[0]}
                          </div>
                          {item.ignorado > 0 && (
                            <div 
                              className="h-5 rounded flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-90"
                              style={{ 
                                width: `${(item.ignorado / maxQual) * 100}%`,
                                backgroundColor: getBarColor(item.faixaEtaria, 'ignorado'),
                                minWidth: '20px'
                              }}
                              title={`Ignorado: ${item.ignorado} (${item.faixaEtaria})`}
                              onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria, ctrlPressedRef.current)}
                            >
                              {item.ignorado}
                            </div>
                          )}
                          {item.naoSeAplica > 0 && (
                            <div 
                              className="h-5 rounded flex items-center justify-center text-gray-700 text-xs font-medium cursor-pointer hover:opacity-90 ml-0.5"
                              style={{ 
                                width: `${(item.naoSeAplica / maxQual) * 100}%`,
                                backgroundColor: getBarColor(item.faixaEtaria, 'naoSeAplica'),
                                minWidth: '20px'
                              }}
                              title={`Não se Aplica: ${item.naoSeAplica} (${item.faixaEtaria})`}
                              onClick={() => toggleFilter && toggleFilter('faixaEtaria', item.faixaEtaria, ctrlPressedRef.current)}
                            >
                              {item.naoSeAplica}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })}
                  {data.every(d => d.ignorado === 0 && d.naoSeAplica === 0) && (
                    <div className="text-xs text-gray-500 italic text-center py-2">Sem registros</div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-300 text-center">
                  <div className="flex justify-around text-xs">
                    <div>
                      <span className="font-bold text-gray-700">{data.reduce((sum, item) => sum + item.ignorado, 0)}</span>
                      <div className="text-gray-600">Ignorado</div>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">{data.reduce((sum, item) => sum + item.naoSeAplica, 0)}</span>
                      <div className="text-gray-600">NSA</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Nenhum dado disponível para o período selecionado</div>
          </div>
        )}

      {/* Legenda ordenada: Cis → Trans → Travesti → NB → Ignorado → NSA */}
      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
              <span className="font-medium">Homem Cisgênero</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#60A5FA' }}></div>
              <span className="font-medium">Homem Transgênero</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#EC4899' }}></div>
              <span className="font-medium">Mulher Cisgênero</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#F472B6' }}></div>
              <span className="font-medium">Mulher Transgênero</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#EF4444' }}></div>
              <span className="font-medium">Travesti</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
              <span className="font-medium">Não Binário</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#9CA3AF' }}></div>
              <span className="font-medium">Ignorado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#D1D5DB' }}></div>
              <span className="font-medium">Não se Aplica</span>
            </div>
          </div>
        </div>
      )}

      {/* Resumo Detalhado com Cards */}
      {data.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 text-center">Resumo por Identidade de Gênero</h4>
          
          {/* Primeira linha: Identidades Binárias */}
          <div className="grid grid-cols-5 gap-3 text-center text-sm">
            <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
              <div className="text-2xl font-bold text-blue-700">
                {data
                  .filter(item => !activeFilters?.faixaEtaria || isFaixaEtariaFiltered(item.faixaEtaria))
                  .reduce((sum, item) => sum + item.homemCisgenero, 0)}
              </div>
              <div className="text-xs text-blue-600 font-medium mt-1">Homem Cisgênero</div>
            </div>
            <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">
                {data
                  .filter(item => !activeFilters?.faixaEtaria || isFaixaEtariaFiltered(item.faixaEtaria))
                  .reduce((sum, item) => sum + item.homemTransgenero, 0)}
              </div>
              <div className="text-xs text-blue-500 font-medium mt-1">Homem Transgênero</div>
            </div>
            <div className="p-3 rounded-lg border-2 border-pink-200 bg-pink-50">
              <div className="text-2xl font-bold text-pink-700">
                {data
                  .filter(item => !activeFilters?.faixaEtaria || isFaixaEtariaFiltered(item.faixaEtaria))
                  .reduce((sum, item) => sum + item.mulherCisgenero, 0)}
              </div>
              <div className="text-xs text-pink-600 font-medium mt-1">Mulher Cisgênero</div>
            </div>
            <div className="p-3 rounded-lg border-2 border-pink-200 bg-pink-50">
              <div className="text-2xl font-bold text-pink-600">
                {data
                  .filter(item => !activeFilters?.faixaEtaria || isFaixaEtariaFiltered(item.faixaEtaria))
                  .reduce((sum, item) => sum + item.mulherTransgenero, 0)}
              </div>
              <div className="text-xs text-pink-500 font-medium mt-1">Mulher Transgênero</div>
            </div>
            <div className="p-3 rounded-lg border-2 border-red-200 bg-red-50">
              <div className="text-2xl font-bold text-red-600">
                {data
                  .filter(item => !activeFilters?.faixaEtaria || isFaixaEtariaFiltered(item.faixaEtaria))
                  .reduce((sum, item) => sum + item.travesti, 0)}
              </div>
              <div className="text-xs text-red-600 font-medium mt-1">Travesti</div>
            </div>
          </div>
          
          {/* Segunda linha: Não Binário e Qualidade do Dado */}
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="p-3 rounded-lg border-2 border-purple-200 bg-purple-50">
              <div className="text-2xl font-bold text-purple-700">
                {data
                  .filter(item => !activeFilters?.faixaEtaria || isFaixaEtariaFiltered(item.faixaEtaria))
                  .reduce((sum, item) => sum + item.naoBinario, 0)}
              </div>
              <div className="text-xs text-purple-600 font-medium mt-1">Não Binário</div>
            </div>
            <div className="p-3 rounded-lg border-2 border-gray-300 bg-gray-50">
              <div className="text-2xl font-bold text-gray-700">
                {data
                  .filter(item => !activeFilters?.faixaEtaria || isFaixaEtariaFiltered(item.faixaEtaria))
                  .reduce((sum, item) => sum + item.ignorado, 0)}
              </div>
              <div className="text-xs text-gray-600 font-medium mt-1">Ignorado</div>
            </div>
            <div className="p-3 rounded-lg border-2 border-gray-300 bg-gray-50">
              <div className="text-2xl font-bold text-gray-700">
                {data
                  .filter(item => !activeFilters?.faixaEtaria || isFaixaEtariaFiltered(item.faixaEtaria))
                  .reduce((sum, item) => sum + item.naoSeAplica, 0)}
              </div>
              <div className="text-xs text-gray-600 font-medium mt-1">Não se Aplica</div>
            </div>
          </div>
          
          {/* Total Geral */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-lg inline-block shadow-lg">
              <div className="text-3xl font-bold text-white">
                {data
                  .filter(item => !activeFilters?.faixaEtaria || isFaixaEtariaFiltered(item.faixaEtaria))
                  .reduce((sum, item) => sum + item.total, 0)}
              </div>
              <div className="text-sm text-indigo-100 font-medium mt-1">Total Geral de Casos</div>
            </div>
          </div>
        </div>
      )}
      </div> {/* Fim do div piramide-etaria-completa */}
    </div>
  );
};

export default PiramideEtariaChart;
