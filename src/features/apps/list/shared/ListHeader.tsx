import { ArrowLeft, Plus, Search, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ListHeaderProps {
  title: string;
  searchPlaceholder: string;
  onSearch: (value: string) => void;
  searchValue: string;
  onNewClick: () => void;
  isProcessing: boolean;
  onMenuOpen: () => void;
  extraFilter?: React.ReactNode;
}

const ListHeader = ({
  title,
  searchPlaceholder,
  onSearch,
  searchValue,
  onNewClick,
  isProcessing,
  onMenuOpen,
  extraFilter
}: ListHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onMenuOpen}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <button
              onClick={() => navigate("/private/apps-auxiliares")}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              disabled={isProcessing}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            <h1 className="text-2xl font-bold">{title}</h1>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {extraFilter}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                autoComplete="off"
                disabled={isProcessing}
                aria-label="Campo de pesquisa"
              />
            </div>
          </div>

          <button
            onClick={onNewClick}
            className="flex items-center gap-2 px-6 py-2 bg-white text-blue-600 rounded-full hover:bg-gray-100 transition-colors shadow-md"
            disabled={isProcessing}
            aria-label="Novo registro"
          >
            <Plus className="h-5 w-5" />
            Novo
          </button>
        </div>
      </div>
    </header>
  );
};

export default ListHeader;