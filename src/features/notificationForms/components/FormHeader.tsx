import React from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Download,
  FileChartColumnIncreasing,
  FileSpreadsheet,
  FileText,
  Files,
  Save,
  Plus,
  X
} from 'lucide-react';

interface FormHeaderProps {
  isExportDropdownOpen: boolean;
  toggleExportDropdown: () => void;
  handleExport: (format: string) => void;
  handleReset: () => void;
}

const FormHeader: React.FC<FormHeaderProps> = ({
  isExportDropdownOpen,
  toggleExportDropdown,
  handleExport,
  handleReset
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 shadow-lg sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 text-white">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <ClipboardList className="h-8 w-8" />
          <h1 className="text-2xl font-semibold">
            Formulário de Notificação
          </h1>
        </div>

        <div className="relative flex items-center gap-3">
          {/* Botão Exportar com Dropdown */}
          <div className="relative">
            <button
              onClick={toggleExportDropdown}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>

            {/* Dropdown de Exportação */}
            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={() => handleExport("Word")}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                    role="menuitem"
                  >
                    <FileChartColumnIncreasing className="h-4 w-4" /> Word
                  </button>
                  <button
                    onClick={() => handleExport("Excel")}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                    role="menuitem"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Excel
                  </button>
                  <button
                    onClick={() => handleExport("CSV")}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                    role="menuitem"
                  >
                    <FileText className="h-4 w-4" /> CSV
                  </button>
                  <button
                    onClick={() => handleExport("PDF")}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                    role="menuitem"
                  >
                    <Files className="h-4 w-4" /> PDF
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="h-6 w-px bg-white/20 mx-2" /> {/* Separador */}
          {/* Botões de Ação (CABEÇALHO) */}
          <button
            type="submit"
            form="notification-form"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Registro
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
        </div>
      </div>
    </header>
  );
};

export default FormHeader;