// src/features/notificationForms/hooks/useTableControls.ts
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { PDFExportType } from '@/features/notificationForms/components/exportUtilities';

export const useTableControls = () => {
  // Menus de controle
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
  const [isSortingMenuOpen, setIsSortingMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // Novos estados para controle de exportação PDF
  const [isPdfOptionsOpen, setIsPdfOptionsOpen] = useState(false);
  const [selectedPdfType, setSelectedPdfType] = useState<PDFExportType>('both');
  
  // Controle de colunas - 🆕 ATUALIZADO: Incluir created_at e unidade_notificadora por padrão
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "paciente",
    "tipo_evento",
    "data_ocorrencia",
    "tipo_atendimento",
    "tipo_encerramento",
    "unidade_notificadora", // 🆕 Unidade notificadora
    "created_at", // 🆕 Data de criação sempre visível
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
        setIsPdfOptionsOpen(false);
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
    setIsPdfOptionsOpen(false);
  };

  const toggleSortingMenu = () => {
    setIsSortingMenuOpen(!isSortingMenuOpen);
    setIsColumnsMenuOpen(false);
    setIsExportMenuOpen(false);
    setIsPdfOptionsOpen(false);
  };

  const toggleExportMenu = () => {
    setIsExportMenuOpen(!isExportMenuOpen);
    setIsSortingMenuOpen(false);
    setIsColumnsMenuOpen(false);
    setIsPdfOptionsOpen(false);
  };

  // Nova função para alternar opções de PDF
  const togglePdfOptions = () => {
    setIsPdfOptionsOpen(!isPdfOptionsOpen);
  };

  // Nova função para definir tipo de PDF
  const handlePdfTypeSelect = (pdfType: PDFExportType) => {
    setSelectedPdfType(pdfType);
    setIsPdfOptionsOpen(false);
  };
  return {
    // Estados
    isMenuOpen,
    isColumnsMenuOpen,
    isSortingMenuOpen,
    isExportMenuOpen,
    selectedColumns,
    menuRef,
    
    // Novos estados para PDF
    isPdfOptionsOpen,
    selectedPdfType,
    
    // Funções
    setIsMenuOpen,
    handleToggleColumn,
    toggleColumnsMenu,
    toggleSortingMenu,
    toggleExportMenu,
    
    // Novas funções para PDF
    togglePdfOptions,
    handlePdfTypeSelect
  };
};