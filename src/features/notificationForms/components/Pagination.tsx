// src/features/notificationForms/components/Pagination.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft as ArrowLeftIcon, 
  ArrowRight, 
  ChevronFirst, 
  ChevronLast 
} from 'lucide-react';
import { PaginationMeta } from '../types';

interface PaginationProps {
  paginationMeta: PaginationMeta;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  paginationMeta,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  const [tempPage, setTempPage] = useState(currentPage.toString());

  // Atualizar tempPage quando currentPage mudar externamente
  useEffect(() => {
    setTempPage(currentPage.toString());
  }, [currentPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remover caracteres não numéricos
    setTempPage(e.target.value.replace(/\D/g, ""));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tempPage) {
      onPageChange(Number(tempPage));
    }
  };

  const handleBlur = () => {
    if (tempPage) {
      onPageChange(Number(tempPage));
    } else {
      setTempPage(currentPage.toString());
    }
  };

  return (
    <div className="px-6 py-4 border-t flex flex-wrap items-center justify-between">
      <div className="text-sm text-gray-500">
        Mostrando{" "}
        {paginationMeta.total > 0
          ? (currentPage - 1) * itemsPerPage + 1
          : 0}{" "}
        a {Math.min(currentPage * itemsPerPage, paginationMeta.total)}{" "}
        de {paginationMeta.total} notificações
      </div>

      <div className="flex items-center mt-2 sm:mt-0">
        <span className="text-sm text-gray-700 mr-2">
          Itens por página:
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="mr-4 border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`rounded-md p-1 ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="sr-only">Primeira página</span>
            <ChevronFirst className="h-5 w-5" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`rounded-md p-1 ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="sr-only">Página anterior</span>
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-1">Página</span>
            <input
              type="text"
              value={tempPage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-12 text-center border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
            <span className="text-sm text-gray-700 ml-1">
              de {paginationMeta.pages}
            </span>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= paginationMeta.pages}
            className={`rounded-md p-1 ${
              currentPage >= paginationMeta.pages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="sr-only">Próxima página</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => onPageChange(paginationMeta.pages)}
            disabled={currentPage >= paginationMeta.pages}
            className={`rounded-md p-1 ${
              currentPage >= paginationMeta.pages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="sr-only">Última página</span>
            <ChevronLast className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;