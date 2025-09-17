// src/features/notificationForms/components/TableHeader.tsx
import React, { useRef } from 'react';
import { Menu, ArrowLeft, Plus, ChevronUp, ChevronDown, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import ColumnsMenu from './ColumnsMenu';
import SortingMenu from './SortingMenu';
import ExportMenu from './ExportMenu';
import { ColumnDefinition, SearchParams } from '../types';

interface TableHeaderProps {
  onMenuOpen: () => void;
  searchParams: SearchParams;
  onSearchChange: (params: SearchParams) => void;
  onSearch: () => void;
  columnsMenuOpen: boolean;
  onColumnsMenuToggle: () => void;
  columns: ColumnDefinition[];
  selectedColumns: string[];
  onToggleColumn: (key: string) => void;
  sortingMenuOpen: boolean;
  onSortingMenuToggle: () => void;
  sortKey: string;
  sortOrder: "asc" | "desc";
  onSortChange: (key: string) => void;
  exportMenuOpen: boolean;
  onExportMenuToggle: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf', type: 'page' | 'all') => void;
  searchFields: { value: SearchParams['field']; label: string }[];
}

const TableHeader: React.FC<TableHeaderProps> = ({
  onMenuOpen,
  searchParams,
  onSearchChange,
  onSearch,
  columnsMenuOpen,
  onColumnsMenuToggle,
  columns,
  selectedColumns,
  onToggleColumn,
  sortingMenuOpen,
  onSortingMenuToggle,
  sortKey,
  sortOrder,
  onSortChange,
  exportMenuOpen,
  onExportMenuToggle,
  onExport,
  searchFields
}) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Mobile Layout: Two rows */}
        <div className="block md:hidden">
          {/* First row: Navigation and title */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onMenuOpen}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold flex-1">
              Lista de Comunicações
            </h1>
          </div>

          {/* Second row: Action buttons - responsive */}
          <div className="flex gap-2 overflow-x-auto">
            {/* Botão Colunas - apenas ícone */}
            <div className="relative">
              <button
                onClick={onColumnsMenuToggle}
                className="p-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Colunas"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <ColumnsMenu 
                isOpen={columnsMenuOpen} 
                columns={columns}
                selectedColumns={selectedColumns}
                onToggleColumn={onToggleColumn}
              />
            </div>

            {/* Botão Ordenação - apenas ícone */}
            <div className="relative">
              <button
                onClick={onSortingMenuToggle}
                className="p-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Ordenação"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>
              <SortingMenu 
                isOpen={sortingMenuOpen}
                columns={columns}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
              />
            </div>

            {/* Botão Exportar - apenas ícone */}
            <div className="relative">
              <button
                onClick={onExportMenuToggle}
                className="p-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Exportar"
              >
                <Download className="h-5 w-5" />
              </button>
              <ExportMenu 
                isOpen={exportMenuOpen}
                onExport={onExport}
                isLoading={false}
              />
            </div>

            {/* Botão Nova Comunicação - apenas ícone */}
            <button
              onClick={() => navigate("/private/comunicacao-de-caso/nova")}
              className="p-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors ml-auto touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Nova Comunicação de Caso"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Third row: Search bar */}
          <div className="mt-3">
            <SearchBar 
              searchParams={searchParams}
              fields={searchFields}
              onSearchChange={onSearchChange}
              onSearch={onSearch}
              realTimeSearch={true}
              placeholder="Buscar..."
              minSearchLength={3}
              debounceTime={300}
            />
          </div>
        </div>

        {/* Desktop Layout: Single row */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuOpen}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold">
              Lista de Formulários de Comunicação de Caso Cadastrados
            </h1>
          </div>

          {/* Grupo de botões à direita */}
          <div ref={menuRef} className="flex items-center gap-2 ml-auto">
            {/* Botão Colunas */}
            <div className="relative">
              <button
                onClick={() => {
                  onColumnsMenuToggle();
                }}
                className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                Colunas
                {columnsMenuOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <ColumnsMenu 
                isOpen={columnsMenuOpen} 
                columns={columns}
                selectedColumns={selectedColumns}
                onToggleColumn={onToggleColumn}
              />
            </div>

            {/* Botão Ordenação */}
            <div className="relative">
              <button
                onClick={onSortingMenuToggle}
                className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                Ordenação
                {sortingMenuOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <SortingMenu 
                isOpen={sortingMenuOpen}
                columns={columns}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
              />
            </div>

            {/* Botão Exportar */}
            <div className="relative">
              <button
                onClick={onExportMenuToggle}
                className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
                {exportMenuOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <ExportMenu 
                isOpen={exportMenuOpen}
                onExport={onExport}
                isLoading={false}
              />
            </div>

            {/* Campo de busca */}
            <SearchBar 
              searchParams={searchParams}
              fields={searchFields}
              onSearchChange={onSearchChange}
              onSearch={onSearch}
              realTimeSearch={true}
              placeholder="Buscar por paciente, evento ou atendimento..."
              minSearchLength={3}
              debounceTime={300}
            />

            {/* Botão Nova Notificação */}
            <button
              onClick={() => navigate("/private/comunicacao-de-caso/nova")}
              className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nova Comunicação de Caso
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TableHeader;