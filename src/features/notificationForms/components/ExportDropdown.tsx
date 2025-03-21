// ExportDropdown.tsx
import React from 'react';
import { 
  FileChartColumnIncreasing, 
  FileSpreadsheet, 
  FileText, 
  Files, 
  Download
} from "lucide-react";
import { 
  exportToExcel, 
  exportToCSV, 
  exportToWord, 
  exportToPDF 
} from "./exportUtilities";
import { FormData } from "@/features/notificationForms/components/types";

interface ExportDropdownProps {
  formData: FormData;
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ 
  formData, 
  isOpen, 
  onToggle, 
  onClose 
}) => {
  // Handle export action
  const handleExport = (format: string) => {
    try {
      switch (format) {
        case "Excel":
          exportToExcel(formData);
          break;
        case "Word":
          exportToWord(formData);
          break;
        case "CSV":
          exportToCSV(formData);
          break;
        case "PDF":
          exportToPDF(formData);
          break;
        default:
          alert(`Export to ${format} is not supported`);
      }
      
      // Close dropdown after export
      if (onClose) onClose();
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      alert(`Failed to export to ${format}. Please try again.`);
    }
  };

  return (
    <div className="relative">
      {/* Export button with dropdown toggle */}
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
        type="button"
      >
        <Download className="h-4 w-4" />
        Exportar
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleExport("Word")}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
              role="menuitem"
              type="button"
            >
              <FileChartColumnIncreasing className="h-4 w-4" /> Word
            </button>
            <button
              onClick={() => handleExport("Excel")}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
              role="menuitem"
              type="button"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
            <button
              onClick={() => handleExport("CSV")}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
              role="menuitem"
              type="button"
            >
              <FileText className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={() => handleExport("PDF")}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
              role="menuitem"
              type="button"
            >
              <Files className="h-4 w-4" /> PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;