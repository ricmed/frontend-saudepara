import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, MapPin, Filter, X, Trash2, Edit, Eye, Menu, Download, ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet } from 'lucide-react';
import ComunicacaoDaeService, { ComunicacaoDae, ComunicacaoDaeFilters } from '@/services/ComunicacaoDaeService';
import { SideMenu } from '@/features/home/components/SideMenu';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService'; // 🔒 Importar service de permissões
import {
  exportarComunicacoesDaeCSV,
  exportarComunicacoesDaeExcel,
  exportarComunicacoesDaePDF,
  ComunicacaoDaeExportData
} from './components/exportUtilities';

// Tipos para pesquisa
type SearchField = 'all' | 'nome_paciente' | 'origem' | 'dae' | 'municipio';

interface SearchParams {
  term: string;
  field: SearchField;
}

// Tipos para ordenação
type SortableField = 'id_comunicacao' | 'data_comunicacao' | 'nome_paciente' | 'origem_tipo' | 'municipio';

interface SortConfig {
  key: SortableField | null;
  direction: 'asc' | 'desc' | null;
}

const searchFields = [
  { value: 'all' as SearchField, label: 'Todos os campos' },
  { value: 'nome_paciente' as SearchField, label: 'Nome do Paciente' },
  { value: 'origem' as SearchField, label: 'Origem' },
  { value: 'dae' as SearchField, label: 'DAE' },
  { value: 'municipio' as SearchField, label: 'Município' },
];

const ComunicacaoDaePage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoDae[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ComunicacaoDaeFilters>({});
  const [tempFilters, setTempFilters] = useState<ComunicacaoDaeFilters>({});

  // Exportação
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Pesquisa
  const [searchParams, setSearchParams] = useState<SearchParams>({ term: '', field: 'all' });
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [filteredComunicacoes, setFilteredComunicacoes] = useState<ComunicacaoDae[]>([]);

  // Ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [sortedComunicacoes, setSortedComunicacoes] = useState<ComunicacaoDae[]>([]);

  useEffect(() => {
    loadComunicacoes();
  }, [currentPage, filters]);

  // Fechar dropdown de pesquisa ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Aplicar filtro de pesquisa
  useEffect(() => {
    if (!searchParams.term || searchParams.term.length < 3) {
      setFilteredComunicacoes(comunicacoes);
      return;
    }

    const searchTerm = searchParams.term.toLowerCase();
    const filtered = comunicacoes.filter((com) => {
      switch (searchParams.field) {
        case 'nome_paciente':
          return com.nome_paciente?.toLowerCase().includes(searchTerm);
        case 'origem':
          return com.origem_tipo?.toLowerCase().includes(searchTerm);
        case 'dae':
          return com.dae?.nome?.toLowerCase().includes(searchTerm);
        case 'municipio':
          return com.tipo_municipio?.descricao?.toLowerCase().includes(searchTerm);
        case 'all':
        default:
          return (
            com.nome_paciente?.toLowerCase().includes(searchTerm) ||
            com.origem_tipo?.toLowerCase().includes(searchTerm) ||
            com.dae?.nome?.toLowerCase().includes(searchTerm) ||
            com.tipo_municipio?.descricao?.toLowerCase().includes(searchTerm)
          );
      }
    });

    setFilteredComunicacoes(filtered);
  }, [searchParams, comunicacoes]);

  // Aplicar ordenação nos dados filtrados
  useEffect(() => {
    if (!sortConfig.key) {
      setSortedComunicacoes(filteredComunicacoes);
      return;
    }

    const sorted = [...filteredComunicacoes].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'id_comunicacao':
          aValue = a.id_comunicacao;
          bValue = b.id_comunicacao;
          break;
        case 'data_comunicacao':
          aValue = new Date(a.data_comunicacao).getTime();
          bValue = new Date(b.data_comunicacao).getTime();
          break;
        case 'nome_paciente':
          aValue = a.nome_paciente?.toLowerCase() || '';
          bValue = b.nome_paciente?.toLowerCase() || '';
          break;
        case 'origem_tipo':
          aValue = a.origem_tipo?.toLowerCase() || '';
          bValue = b.origem_tipo?.toLowerCase() || '';
          break;
        case 'municipio':
          aValue = a.tipo_municipio?.descricao?.toLowerCase() || '';
          bValue = b.tipo_municipio?.descricao?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setSortedComunicacoes(sorted);
  }, [filteredComunicacoes, sortConfig]);

  const loadComunicacoes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🔒 BUSCAR PERMISSÕES DO USUÁRIO
      let filtrosComPermissoes = { ...filters };
      
      try {
        console.log('🔒 Verificando permissões do usuário para comunicações DAE...');
        const userAccess = await usuarioGestaoService.getUserAccess();
        
        if (userAccess) {
          console.log('📋 Permissões do usuário:', userAccess);
          
          // Se o usuário tem acesso apenas a um estabelecimento, aplicar filtro
          if (userAccess.isEstabelecimento && userAccess.estabelecimentoId) {
            console.log(`🔒 Aplicando filtro de segurança: estabelecimento ID ${userAccess.estabelecimentoId}`);
            filtrosComPermissoes.estabelecimento_id = userAccess.estabelecimentoId;
          }
          // TODO: Implementar filtros para município e estado no futuro
          else if (userAccess.isMunicipio && userAccess.municipioId) {
            console.log(`🔒 Usuário de município: ${userAccess.municipioId} (filtro não implementado ainda)`);
          } else if (userAccess.isEstado && userAccess.estadoId) {
            console.log(`🔒 Usuário de estado: ${userAccess.estadoId} (filtro não implementado ainda)`);
          } else {
            console.log('✅ Usuário com acesso total - sem filtros de segurança');
          }
        }
      } catch (permError) {
        console.warn('⚠️ Erro ao verificar permissões, continuando sem filtros:', permError);
      }
      
      const response = await ComunicacaoDaeService.getAll(currentPage, itemsPerPage, filtrosComPermissoes);
      setComunicacoes(response.data);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar comunicações');
      console.error('Erro ao carregar comunicações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta comunicação?')) return;

    try {
      await ComunicacaoDaeService.delete(id);
      loadComunicacoes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir comunicação');
    }
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setTempFilters({});
    setCurrentPage(1);
    setShowFilters(false);
  };

  // Funções de ordenação
  const handleSort = (key: SortableField) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (columnKey: SortableField) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf', type: 'page' | 'all') => {
    try {
      let dataToExport: ComunicacaoDae[] = [];

      if (type === 'all') {
        // Buscar todas as comunicações com filtros aplicados
        const response = await ComunicacaoDaeService.getAll(1, 9999, filters);
        dataToExport = response.data;
      } else {
        // Usar página atual
        dataToExport = comunicacoes;
      }

      const filename = type === 'all' 
        ? 'comunicacoes_dae_completo' 
        : `comunicacoes_dae_pagina_${currentPage}`;

      // Converter para formato de exportação
      const exportData = dataToExport as ComunicacaoDaeExportData[];

      // Exportar no formato escolhido
      switch (format) {
        case 'csv':
          exportarComunicacoesDaeCSV(exportData, filename);
          break;
        case 'excel':
          exportarComunicacoesDaeExcel(exportData, filename);
          break;
        case 'pdf':
          exportarComunicacoesDaePDF(exportData, filename);
          break;
      }

      setShowExportMenu(false);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      setError('Erro ao exportar dados');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrigemBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'CRS': return 'bg-blue-100 text-blue-800';
      case 'NHE': return 'bg-green-100 text-green-800';
      case 'CIEVS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header com Azul Padrão */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Lado esquerdo - Menu e Título */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Comunicação DAE
                </h1>
                <p className="text-sm text-blue-100 mt-0.5">
                  Gerenciar Doenças, Agravos e Eventos
                </p>
              </div>
            </div>
            
            {/* Lado direito - Botões de Ação */}
            <div className="flex items-center space-x-3">
              {/* Botão Exportar */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 shadow-md"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium hidden sm:inline">Exportar</span>
                </button>

                {/* Menu de Exportação */}
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-30 overflow-hidden">
                    <div className="py-1">
                      {/* Exportar Página Atual */}
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-xs font-semibold text-gray-700 uppercase">Página Atual</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExport('csv', 'page')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('excel', 'page')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium">Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('pdf', 'page')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium">PDF</span>
                      </button>

                      {/* Exportar Tudo */}
                      <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-200 mt-1">
                        <span className="text-xs font-semibold text-gray-700 uppercase">Exportação Completa</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExport('csv', 'all')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">CSV Completo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('excel', 'all')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium">Excel Completo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('pdf', 'all')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium">PDF Completo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Nova Comunicação */}
              <button
                onClick={() => navigate('/private/comunicacao-dae/nova')}
                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-md font-medium"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nova Comunicação</span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros e Pesquisa */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-700 text-white' 
                    : 'bg-blue-500 text-white hover:bg-blue-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filtros</span>
                {Object.keys(filters).length > 0 && (
                  <span className="ml-1 bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {Object.keys(filters).length}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Barra de Pesquisa */}
            <div className="flex-1 max-w-xl">
              <div className="relative flex items-center">
                {/* Dropdown de campos de pesquisa */}
                <div className="relative" ref={searchDropdownRef}>
                  <button
                    onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                    className="h-10 px-3 bg-blue-500 hover:bg-blue-700 text-white rounded-l-lg border-r border-blue-400 transition-colors flex items-center space-x-1 text-sm font-medium"
                  >
                    <span className="hidden sm:inline">
                      {searchFields.find(f => f.value === searchParams.field)?.label || 'Todos'}
                    </span>
                    <span className="sm:hidden">Campo</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isSearchDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
                      {searchFields.map((field) => (
                        <button
                          key={field.value}
                          onClick={() => {
                            setSearchParams({ ...searchParams, field: field.value });
                            setIsSearchDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                            searchParams.field === field.value 
                              ? 'bg-blue-50 text-blue-700 font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          {field.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo de texto */}
                <input
                  type="text"
                  value={searchParams.term}
                  onChange={(e) => setSearchParams({ ...searchParams, term: e.target.value })}
                  placeholder="Pesquisar (mín. 3 caracteres)..."
                  className="flex-1 h-10 px-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {/* Botão de busca/limpar */}
                {searchParams.term ? (
                  <button
                    onClick={() => setSearchParams({ ...searchParams, term: '' })}
                    className="h-10 px-3 bg-blue-500 hover:bg-blue-700 text-white rounded-r-lg transition-colors"
                    title="Limpar pesquisa"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    className="h-10 px-3 bg-blue-500 text-white rounded-r-lg cursor-default"
                    disabled
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchParams.term && searchParams.term.length < 3 && (
                <p className="text-xs text-blue-100 mt-1 ml-1">
                  Digite pelo menos 3 caracteres para pesquisar
                </p>
              )}
            </div>

            {/* Informações de Registros */}
            <div className="text-sm text-blue-100">
              <span className="font-semibold text-white">{filteredComunicacoes.length}</span> de <span className="font-semibold text-white">{total}</span> comunicações
            </div>
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Painel de Filtros Expansível */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data Início
                </label>
                <input
                  type="date"
                  value={tempFilters.data_inicio || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, data_inicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data Fim
                </label>
                <input
                  type="date"
                  value={tempFilters.data_fim || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, data_fim: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Origem
                </label>
                <select
                  value={tempFilters.origem_tipo || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, origem_tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Todas</option>
                  <option value="CRS">CRS</option>
                  <option value="NHE">NHE</option>
                  <option value="CIEVS">CIEVS</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleClearFilters}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Limpar Filtros
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-medium"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="w-full max-w-[98%] mx-auto px-1 sm:px-2 lg:px-3 xl:px-4 py-4 md:py-6 lg:py-8">
        {/* Alert de Erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start justify-between shadow-sm animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <X className="w-5 h-5 text-red-500 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Estado de Carregamento */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Carregando comunicações...</p>
          </div>
        ) : filteredComunicacoes.length === 0 ? (
          /* Estado Vazio */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma comunicação encontrada
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {Object.keys(filters).length > 0 || searchParams.term.length >= 3
                ? 'Não encontramos comunicações com os filtros ou pesquisa aplicados. Tente ajustar os critérios.'
                : 'Comece criando uma nova comunicação DAE para gerenciar doenças, agravos e eventos.'}
            </p>
            <button
              onClick={() => navigate('/private/comunicacao-dae/nova')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Comunicação
            </button>
          </div>
        ) : (
          <>
            {/* Tabela de Comunicações */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200/60 transition-colors"
                        onClick={() => handleSort('id_comunicacao')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Nº Comunicação</span>
                          {renderSortIcon('id_comunicacao')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200/60 transition-colors"
                        onClick={() => handleSort('data_comunicacao')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Data</span>
                          {renderSortIcon('data_comunicacao')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200/60 transition-colors"
                        onClick={() => handleSort('nome_paciente')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Paciente</span>
                          {renderSortIcon('nome_paciente')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200/60 transition-colors"
                        onClick={() => handleSort('origem_tipo')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Origem</span>
                          {renderSortIcon('origem_tipo')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        DAE
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200/60 transition-colors"
                        onClick={() => handleSort('municipio')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Município</span>
                          {renderSortIcon('municipio')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Anexos
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sortedComunicacoes.map((comunicacao, index) => (
                      <tr 
                        key={comunicacao.id_comunicacao} 
                        className={`transition-colors duration-150 hover:bg-blue-50/50 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-blue-600">
                            #{comunicacao.id_comunicacao}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(comunicacao.data_comunicacao)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {comunicacao.nome_paciente}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getOrigemBadgeColor(comunicacao.origem_tipo)}`}>
                            {comunicacao.origem_tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {comunicacao.dae?.nome || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {comunicacao.tipo_municipio?.descricao || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FileText className="w-3 h-3 mr-1.5" />
                            {comunicacao.comunicacao_dae_anexo?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/private/comunicacao-dae/${comunicacao.id_comunicacao}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => navigate(`/private/comunicacao-dae/editar/${comunicacao.id_comunicacao}`)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(Number(comunicacao.id_comunicacao))}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginação Moderna */}
            {totalPages > 1 && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Informações de Registros */}
                  <div className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
                    <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, total)}</span> de{' '}
                    <span className="font-semibold text-gray-900">{total}</span> registros
                  </div>

                  {/* Controles de Paginação */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                      title="Primeira página"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Anterior
                    </button>
                    
                    {/* Indicador de Página */}
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm">
                      Página {currentPage} de {totalPages}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Próxima
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                      title="Última página"
                    >
                      »»
                    </button>
                  </div>

                  {/* Seletor de Itens por Página */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 font-medium">Itens por página:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ComunicacaoDaePage;
