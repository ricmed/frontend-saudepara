// src/features/notificationForms/hooks/useTableControls.ts
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

export const useTableControls = () => {
  // Menus de controle
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
  const [isSortingMenuOpen, setIsSortingMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // Controle de colunas
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "paciente",
    "tipo_evento",
    "data_ocorrencia",
    "tipo_atendimento",
    "tipo_encerramento",
  ]);

  // Ref para detectar cliques fora dos menus
  const menuRef = useRef<HTMLDivElement>(null);

  // Monitorar cliques fora dos menus para fechá-los
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsColumnsMenuOpen(false);
        setIsSortingMenuOpen(false);
        setIsExportMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Função para alternar visibilidade de colunas
  const handleToggleColumn = (colKey: string) => {
    if (selectedColumns.includes(colKey)) {
      // Não permitir que remova todas as colunas
      if (selectedColumns.length > 1) {
        setSelectedColumns(selectedColumns.filter((key) => key !== colKey));
      } else {
        toast.warning("É necessário manter pelo menos uma coluna visível");
      }
    } else {
      setSelectedColumns([...selectedColumns, colKey]);
    }
  };

  // Funções para alternar menus
  const toggleColumnsMenu = () => {
    setIsColumnsMenuOpen(!isColumnsMenuOpen);
    setIsSortingMenuOpen(false);
    setIsExportMenuOpen(false);
  };

  const toggleSortingMenu = () => {
    setIsSortingMenuOpen(!isSortingMenuOpen);
    setIsColumnsMenuOpen(false);
    setIsExportMenuOpen(false);
  };

  const toggleExportMenu = () => {
    setIsExportMenuOpen(!isExportMenuOpen);
    setIsSortingMenuOpen(false);
    setIsColumnsMenuOpen(false);
  };

  return {
    // Estados
    isMenuOpen,
    isColumnsMenuOpen,
    isSortingMenuOpen,
    isExportMenuOpen,
    selectedColumns,
    menuRef,
    
    // Funções
    setIsMenuOpen,
    handleToggleColumn,
    toggleColumnsMenu,
    toggleSortingMenu,
    toggleExportMenu
  };
};