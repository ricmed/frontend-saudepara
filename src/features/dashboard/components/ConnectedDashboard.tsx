import React from 'react';
import { DashboardProvider } from '../context/DashboardContext';
import FilterControls from './FilterControls';
import { PublicoAtendidoChart } from './charts';
// Importar outros gráficos conforme necessário

// Dados de exemplo (em um cenário real, viriam de uma API)
const SAMPLE_DATA = [
  {
    id: 1,
    publico_atendido: 'Adulto',
    tipo_atendimento: 'Urgência',
    sexo: 'Masculino',
    raca_cor: 'Branco',
    sintomas: ['Febre', 'Dor de cabeça'],
    tipo_trauma: null,
    hipotese_diagnostica: 'Dengue',
    faixa_etaria: '30-39 anos',
    estabelecimento: 'UPA Central',
    desfecho: 'Alta',
    municipio: 'Belém',
  },
  {
    id: 2,
    publico_atendido: 'Criança',
    tipo_atendimento: 'Consulta',
    sexo: 'Feminino',
    raca_cor: 'Pardo',
    sintomas: ['Tosse', 'Febre'],
    tipo_trauma: null,
    hipotese_diagnostica: 'Pneumonia',
    faixa_etaria: '5-9 anos',
    estabelecimento: 'UBS Norte',
    desfecho: 'Alta',
    municipio: 'Ananindeua',
  },
  // Adicionar mais dados de exemplo...
];

interface ConnectedDashboardProps {
  data?: any[];
  className?: string;
}

const ConnectedDashboard: React.FC<ConnectedDashboardProps> = ({ 
  data = SAMPLE_DATA,
  className = ""
}) => {
  return (
    <DashboardProvider initialData={data}>
      <div className={`space-y-6 ${className}`}>
        {/* Cabeçalho */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Dashboard Interativo de Saúde - Pará
          </h1>
          <p className="text-gray-600">
            Clique em qualquer elemento dos gráficos para filtrar todos os outros.
            Similar ao comportamento do Power BI.
          </p>
        </div>

        {/* Controles de filtros */}
        <FilterControls rawData={data} />

        {/* Grid de gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gráfico de Público Atendido (com contexto) */}
          <div className="lg:col-span-1">
            <PublicoAtendidoChart rawData={data} />
          </div>

          {/* Placeholder para outros gráficos */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📊</div>
                <h3 className="font-medium">Tipo de Atendimento</h3>
                <p className="text-sm mt-2">
                  (Aguardando conversão para contexto global)
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">👥</div>
                <h3 className="font-medium">Sexo</h3>
                <p className="text-sm mt-2">
                  (Aguardando conversão para contexto global)
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🎨</div>
                <h3 className="font-medium">Raça/Cor</h3>
                <p className="text-sm mt-2">
                  (Aguardando conversão para contexto global)
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🔬</div>
                <h3 className="font-medium">Hipóteses Diagnósticas</h3>
                <p className="text-sm mt-2">
                  (Aguardando conversão para contexto global)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            💡 Como funciona a comunicação entre gráficos:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Clique em qualquer barra ou fatia para aplicar um filtro</li>
            <li>Todos os outros gráficos serão automaticamente filtrados</li>
            <li>Clique novamente no mesmo item para remover o filtro</li>
            <li>Os gráficos com filtros ativos aparecem destacados com bordas azuis</li>
            <li>Use o painel de controle acima para ver todos os filtros ativos</li>
            <li>O contador de registros mostra quantos dados estão sendo exibidos</li>
          </ul>
        </div>
      </div>
    </DashboardProvider>
  );
};

export default ConnectedDashboard;
