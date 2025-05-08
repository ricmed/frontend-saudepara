// src/features/notificationForms/ListaNotificacoes.tsx
import React, { useRef } from "react";
import { CSVLink } from "react-csv";
// Atualizar a importação do SideMenu
import SideMenu from "@/features/home/components/SideMenu";
import TableHeader from "./components/TableHeader";
import NotificationTable from "./components/NotificationTable";
import Pagination from "./components/Pagination";
import { useNotifications } from "./hooks/useNotifications";
import { useTableControls } from "./hooks/useTableControls";
import { allColumns, searchFields } from "./types";
import type { SearchParams } from "./types";
import { formatDate } from "./utils";
// Adicionar importação do contexto de linguagem
import { useLanguage } from "@/contexts/LanguageContext";

const ListaNotificacoes: React.FC = () => {
  // Custom hooks para gerenciar estado e lógica
  const notifications = useNotifications();
  const tableControls = useTableControls();
  
  // Refs para CSVLink
  const csvLinkRef = useRef<any>(null);
  const csvLinkAllRef = useRef<any>(null);
  
  // Adicionar contexto de idioma
  const { selectedLanguage, setSelectedLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho com Controles */}
      <TableHeader 
        onMenuOpen={() => tableControls.setIsMenuOpen(true)}
        searchParams={notifications.searchParams}
        onSearchChange={notifications.setSearchParams}
        onSearch={() => {
          if (notifications.searchParams.term.length >= 3) {
            notifications.setCurrentPage(1);
          }
        }}
        columnsMenuOpen={tableControls.isColumnsMenuOpen}
        onColumnsMenuToggle={tableControls.toggleColumnsMenu}
        columns={allColumns}
        selectedColumns={tableControls.selectedColumns}
        onToggleColumn={tableControls.handleToggleColumn}
        sortingMenuOpen={tableControls.isSortingMenuOpen}
        onSortingMenuToggle={tableControls.toggleSortingMenu}
        sortKey={String(notifications.sortKey)}
        sortOrder={notifications.sortOrder}
        onSortChange={notifications.handleSortChange}
        exportMenuOpen={tableControls.isExportMenuOpen}
        onExportMenuToggle={tableControls.toggleExportMenu}
        onExport={notifications.handleExport}
        searchFields={searchFields as { value: SearchParams['field']; label: string }[]}
      />

      {/* SideMenu atualizado com as props corretas */}
      <SideMenu 
        isOpen={tableControls.isMenuOpen} 
        onClose={() => tableControls.setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={(language) => setSelectedLanguage(language)}
      />

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="overflow-x-auto">
          {/* Tabela de Notificações */}
          <NotificationTable 
            notificacoes={notifications.notificacoes}
            isLoading={notifications.isLoading}
            error={notifications.error}
            onDismissError={() => notifications.setError(null)}
            selectedColumns={tableControls.selectedColumns}
            allColumns={allColumns}
            sortKey={notifications.sortKey}
            sortOrder={notifications.sortOrder}
            onSortChange={notifications.handleSortChange}
            onDelete={notifications.handleDelete}
            searchTerm={notifications.searchParams.term}
          />

          {/* Paginação */}
          <Pagination 
            paginationMeta={notifications.paginationMeta}
            currentPage={notifications.currentPage}
            itemsPerPage={notifications.itemsPerPage}
            onPageChange={notifications.handlePageChange}
            onItemsPerPageChange={(value) => {
              notifications.setItemsPerPage(value);
              notifications.setCurrentPage(1);
            }}
          />
        </div>
      </main>

      {/* Links invisíveis para exportação CSV */}
      <CSVLink
        data={notifications.notificacoes.map((notificacao) => ({
          paciente: notificacao.paciente || "",
          evento: notificacao.tipoEvento || "",
          data_ocorrencia: notificacao.dataOcorrencia || "",
          data_atendimento: formatDate(notificacao.original?.data_atendimento),
          tipo_atendimento: notificacao.tipoAtendimento || "",
          tipo_encerramento: notificacao.tipoEncerramento || "",
          unidade_notificadora:
            notificacao.original
              ?.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento
              ?.nome || "",
        }))}
        filename="notificacoes_pagina_atual.csv"
        style={{ display: "none" }}
        ref={csvLinkRef}
      />
      <CSVLink
        data={[]}
        filename="notificacoes_completo.csv"
        style={{ display: "none" }}
        ref={csvLinkAllRef}
      />
    </div>
  );
};

export default ListaNotificacoes;