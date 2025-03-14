import { ChevronRight } from "lucide-react";

interface ExportMenuProps {
  isOpen: boolean;
  onExportCSV: (type: "page" | "all") => void;
  onExportExcel: (type: "page" | "all") => void;
  onExportPDF: (type: "page" | "all") => void;
}

export const ExportMenu = ({
  isOpen,
  onExportCSV,
  onExportExcel,
  onExportPDF,
}: ExportMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
      {/* CSV Options */}
      <div className="group relative flex items-center px-4 py-2 hover:bg-gray-50">
        <span className="text-sm text-gray-700">CSV</span>
        <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
        <div className="invisible group-hover:visible absolute left-full top-0 ml-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
          <button
            onClick={() => onExportCSV("page")}
            className="block w-full text-left text-sm text-gray-700 px-4 py-2 hover:bg-gray-50"
          >
            Página Atual
          </button>
          <button
            onClick={() => onExportCSV("all")}
            className="block w-full text-left text-sm text-gray-700 px-4 py-2 hover:bg-gray-50"
          >
            Todos os Registros
          </button>
        </div>
      </div>

      {/* Excel Options */}
      <div className="group relative flex items-center px-4 py-2 hover:bg-gray-50">
        <span className="text-sm text-gray-700">Excel</span>
        <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
        <div className="invisible group-hover:visible absolute left-full top-0 ml-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
          <button
            onClick={() => onExportExcel("page")}
            className="block w-full text-left text-sm text-gray-700 px-4 py-2 hover:bg-gray-50"
          >
            Página Atual
          </button>
          <button
            onClick={() => onExportExcel("all")}
            className="block w-full text-left text-sm text-gray-700 px-4 py-2 hover:bg-gray-50"
          >
            Todos os Registros
          </button>
        </div>
      </div>

      {/* PDF Options */}
      <div className="group relative flex items-center px-4 py-2 hover:bg-gray-50">
        <span className="text-sm text-gray-700">PDF</span>
        <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
        <div className="invisible group-hover:visible absolute left-full top-0 ml-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
          <button
            onClick={() => onExportPDF("page")}
            className="block w-full text-left text-sm text-gray-700 px-4 py-2 hover:bg-gray-50"
          >
            Página Atual
          </button>
          <button
            onClick={() => onExportPDF("all")}
            className="block w-full text-left text-sm text-gray-700 px-4 py-2 hover:bg-gray-50"
          >
            Todos os Registros
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportMenu;
