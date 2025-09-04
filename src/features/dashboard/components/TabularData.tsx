// Componente de Dados Tabulares - Tabela Interativa com Dados Reais
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import NotificacaoService from '@/services/NotificacaoService';

interface NotificationData {
  id: number;
  data_notificacao: string;
  paciente_nome: string;
  municipio_descricao: string;
  estabelecimento_descricao: string;
  sintomas: string[];
  hipoteses_diagnosticas: string[];
  status: string;
  created_at: string;
}

interface TabularDataProps {
  className?: string;
  appliedFilters?: any;
}

interface SortConfig {
  key: keyof NotificationData | null;
  direction: 'asc' | 'desc' | null;
}

const TabularData: React.FC<TabularDataProps> = ({ className = "" }) => {
  const [data, setData] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'data_notificacao', 'paciente_nome', 'municipio_descricao', 
    'estabelecimento_descricao', 'sintomas', 'status'
  ]);

  // Colunas disponíveis
  const availableColumns = [
    { key: 'data_notificacao', label: 'Data Notificação', width: '120px' },
    { key: 'paciente_nome', label: 'Paciente', width: '150px' },
    { key: 'municipio_descricao', label: 'Município', width: '120px' },
    { key: 'estabelecimento_descricao', label: 'Estabelecimento', width: '180px' },
    { key: 'sintomas', label: 'Sintomas', width: '200px' },
    { key: 'hipoteses_diagnosticas', label: 'Hipóteses Diagnósticas', width: '200px' },
    { key: 'status', label: 'Status', width: '100px' },
    { key: 'created_at', label: 'Criado em', width: '120px' }
  ];

  // Carregar dados
  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      const service = NotificacaoService;
      const response = await service.getAll(currentPage, pageSize);
      
      console.log('🔍 DEBUG - Resposta completa da API:', response);
      console.log('🔍 DEBUG - Primeiro item dos dados:', response.data[0]);
      
      // Transformar dados para formato da tabela usando adapter output
      const transformedData: NotificationData[] = response.data.map((item: any) => {
        const original = item.original || {};
        return {
          id: item.id,
          data_notificacao: item.dataOcorrencia || (original.created_at ? new Date(original.created_at).toLocaleDateString('pt-BR') : '-'),
          paciente_nome: item.paciente || '-',
          municipio_descricao: original.municipio?.descricao || original.tipo_municipio?.descricao || '-',
          estabelecimento_descricao: original.estabelecimento?.nome || original.estabelecimento?.descricao || original.tipo_estabelecimento?.descricao || '-',
          sintomas: Array.isArray(original.notificacao_has_tipo_sintoma)
            ? original.notificacao_has_tipo_sintoma.map((s: any) => s.tipo_sintoma?.descricao || s.descricao || String(s)).join(', ')
            : [],
          hipoteses_diagnosticas: Array.isArray(original.notificacao_has_tipo_hipotese_diag)
            ? original.notificacao_has_tipo_hipotese_diag.map((h: any) => h.tipo_hipotese_diag?.descricao || h.descricao || String(h)).join(', ')
            : [],
          status: original.ativo === 'S' ? 'Ativo' : original.ativo === 'N' ? 'Inativo' : original.status || '-',
          created_at: original.created_at ? new Date(original.created_at).toLocaleDateString('pt-BR') : '-'
        };
      });

      console.log('🔍 DEBUG - Dados transformados:', transformedData);
      setData(transformedData);
      setTotalRecords(response.meta?.total || response.data.length);
    } catch (error) {
      console.error('Erro ao carregar dados tabulares:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dados
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.paciente_nome.toLowerCase().includes(searchLower) ||
        item.municipio_descricao.toLowerCase().includes(searchLower) ||
        item.estabelecimento_descricao.toLowerCase().includes(searchLower) ||
        item.sintomas.join(', ').toLowerCase().includes(searchLower) ||
        item.hipoteses_diagnosticas.join(', ').toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Controle de ordenação
  const handleSort = (key: keyof NotificationData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Renderizar ícone de ordenação
  const renderSortIcon = (columnKey: keyof NotificationData) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  // Exportar dados
  const exportToCSV = () => {
    const headers = selectedColumns.map(col => 
      availableColumns.find(ac => ac.key === col)?.label || col
    );
    
    const csvContent = [
      headers.join(','),
      ...sortedData.map(row => 
        selectedColumns.map(col => {
          const value = row[col as keyof NotificationData];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dados-tabulares-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Paginação
  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Table className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Dados Tabulares</h3>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Seletor de colunas */}
            <div className="relative">
              <select 
                multiple 
                value={selectedColumns}
                onChange={(e) => setSelectedColumns(Array.from(e.target.selectedOptions, option => option.value))}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                size={3}
              >
                {availableColumns.map(col => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Botões de exportação */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel/CSV
            </button>
          </div>
        </div>

        {/* Barra de busca */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, município, estabelecimento, sintomas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Itens por página:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando dados...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selectedColumns.map(columnKey => {
                  const column = availableColumns.find(col => col.key === columnKey);
                  if (!column) return null;
                  
                  return (
                    <th
                      key={columnKey}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      style={{ width: column.width }}
                      onClick={() => handleSort(columnKey as keyof NotificationData)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {renderSortIcon(columnKey as keyof NotificationData)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {selectedColumns.map(columnKey => (
                    <td key={columnKey} className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {columnKey === 'status' ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          row.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {row[columnKey as keyof NotificationData]}
                        </span>
                      ) : (
                        <span title={String(row[columnKey as keyof NotificationData])}>
                          {String(row[columnKey as keyof NotificationData])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalRecords)} a{' '}
            {Math.min(currentPage * pageSize, totalRecords)} de {totalRecords} registros
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="px-3 py-1 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabularData;
