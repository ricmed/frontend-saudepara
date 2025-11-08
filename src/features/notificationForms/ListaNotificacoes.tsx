// src/features/notificationForms/ListaNotificacoes.tsx
import React, { useRef, useState, useMemo, useEffect } from "react";
import { CSVLink } from "react-csv";
import SideMenu from "@/features/home/components/SideMenu";
import TableHeader from "./components/TableHeader";
import NotificationTable from "./components/NotificationTable";
import Pagination from "./components/Pagination";
import TipoAtendimentoFilter, { TipoAtendimentoType } from "./components/TipoAtendimentoFilter";
import { useNotifications } from "./hooks/useNotifications";
import { useTableControls } from "./hooks/useTableControls";
import { allColumns, searchFields } from "./types";
import type { SearchParams } from "./types";
import { formatDate, compareValues, getValueForSorting, normalizeText } from "./utils";

import type { Notificacao } from "./types";

const ListaNotificacoes: React.FC = () => {
  // Custom hooks para gerenciar estado e lógica
  const notifications = useNotifications();
  const tableControls = useTableControls();
  
  // Estado do filtro de tipo de atendimento
  const [selectedTipoAtendimento, setSelectedTipoAtendimento] = useState<TipoAtendimentoType>(null);

  // Resetar para página 1 quando o filtro mudar e forçar carregamento de todos os dados
  useEffect(() => {
    notifications.setCurrentPage(1);
    
    // Se há um filtro ativo e não temos todas as notificações, buscar todas
    if (selectedTipoAtendimento && notifications.allNotificacoes.length === 0) {
      notifications.fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTipoAtendimento]);
  
  // Refs para CSVLink
  const csvLinkRef = useRef<any>(null);
  const csvLinkAllRef = useRef<any>(null);
  
  // Adicionar contexto de idioma


  // Usar allNotificacoes quando disponível (modo de ordenação local) ou notificacoes (paginação do servidor)
  const todasNotificacoes = notifications.allNotificacoes.length > 0 
    ? notifications.allNotificacoes 
    : notifications.notificacoes;

  // Filtrar notificações por tipo de atendimento e termo de busca
  const notificacoesFiltradas = useMemo(() => {
    let filtradas = todasNotificacoes;
    
    // Aplicar filtro de tipo de atendimento
    if (selectedTipoAtendimento) {
      filtradas = filtradas.filter((notificacao) => {
        const tipoAtendimento = notificacao.tipoAtendimento?.toLowerCase() || '';
        
        switch (selectedTipoAtendimento) {
          case 'clinico':
            return tipoAtendimento.includes('clínico') || tipoAtendimento.includes('clinico');
          case 'trauma':
            return tipoAtendimento.includes('trauma');
          case 'multiplas':
            return tipoAtendimento.includes('múltiplas') || tipoAtendimento.includes('multiplas') || 
                   tipoAtendimento.includes('vítimas') || tipoAtendimento.includes('vitimas');
          case 'qbrn':
            return tipoAtendimento.includes('qbrn');
          default:
            return true;
        }
      });
    }

    // Aplicar filtro de busca se houver um termo com 3 ou mais caracteres
    if (notifications.searchParams.term.length >= 3) {
      const searchTerm = normalizeText(notifications.searchParams.term);
      const searchField = notifications.searchParams.field;

      filtradas = filtradas.filter((notificacao) => {
        if (searchField === 'all') {
          return (
            normalizeText(notificacao.paciente).includes(searchTerm) ||
            normalizeText(notificacao.tipoEvento).includes(searchTerm) ||
            normalizeText(notificacao.tipoAtendimento).includes(searchTerm) ||
            normalizeText(notificacao.tipoEncerramento).includes(searchTerm) ||
            normalizeText(notificacao.original?.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento?.nome).includes(searchTerm)
          );
        }

        // Buscar em campos específicos
        switch (searchField) {
          case 'paciente':
            return normalizeText(notificacao.paciente).includes(searchTerm);
          case 'evento':
            return normalizeText(notificacao.tipoEvento).includes(searchTerm);
          case 'atendimento':
            return normalizeText(notificacao.tipoAtendimento).includes(searchTerm);
          case 'encerramento':
            return normalizeText(notificacao.tipoEncerramento).includes(searchTerm);
          case 'unidade_notificadora':
            return normalizeText(notificacao.original?.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento?.nome).includes(searchTerm);
          default:
            return true;
        }
      });
    }
    
    // Aplicar ordenação se estivermos usando dados locais
    if (notifications.allNotificacoes.length > 0 && notifications.sortKey) {
      filtradas = [...filtradas].sort((a, b) => {
        const aValue = getValueForSorting(a, notifications.sortKey as keyof Notificacao);
        const bValue = getValueForSorting(b, notifications.sortKey as keyof Notificacao);
        return compareValues(aValue, bValue, notifications.sortOrder);
      });
    }
    
    return filtradas;
  }, [todasNotificacoes, selectedTipoAtendimento, notifications.allNotificacoes.length, notifications.sortKey, notifications.sortOrder, notifications.searchParams.term, notifications.searchParams.field]);

  // Aplicar paginação local nas notificações filtradas
  const notificacoesPaginadas = useMemo(() => {
    const startIndex = (notifications.currentPage - 1) * notifications.itemsPerPage;
    const endIndex = startIndex + notifications.itemsPerPage;
    return notificacoesFiltradas.slice(startIndex, endIndex);
  }, [notificacoesFiltradas, notifications.currentPage, notifications.itemsPerPage]);

  // Calcular metadados de paginação para dados filtrados
  const paginationMetaFiltrada = useMemo(() => {
    const total = notificacoesFiltradas.length;
    const pages = Math.ceil(total / notifications.itemsPerPage);
    
    return {
      total,
      pages,
      currentPage: notifications.currentPage,
      perPage: notifications.itemsPerPage
    };
  }, [notificacoesFiltradas.length, notifications.itemsPerPage, notifications.currentPage]);

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
      />

      {/* Conteúdo principal */}
      <main className="w-full max-w-[98%] mx-auto px-1 sm:px-2 lg:px-3 xl:px-4 py-4 md:py-6 lg:py-8">
        {/* Filtro de Tipo de Atendimento */}
        <TipoAtendimentoFilter
          selectedTipo={selectedTipoAtendimento}
          onTipoChange={setSelectedTipoAtendimento}
        />

        <div className="overflow-x-auto overflow-y-visible">
          {/* Tabela de Notificações */}
          <NotificationTable 
            notificacoes={notificacoesPaginadas}
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
            paginationMeta={paginationMetaFiltrada}
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