import { ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginacaoProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  isProcessing: boolean;
  onPageChange: (newPage: number) => void;
}

const Paginacao = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  isProcessing,
  onPageChange,
}: PaginacaoProps) => {
  const getVisiblePages = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const getDisplayRange = () => {
    if (totalItems === 0) return { start: 0, end: 0 };
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return { start, end };
  };

  const handlePageChange = (newPage: number) => {
    if (isProcessing) return;
    if (newPage < 1 || newPage > totalPages) return;
    onPageChange(newPage);
  };

  return (
    <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        {totalItems === 0 ? (
          "Nenhum registro encontrado"
        ) : (
          <>
            Mostrando {getDisplayRange().start} a {getDisplayRange().end} de{" "}
            {totalItems} registro{totalItems !== 1 && "s"}
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || isProcessing}
          className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isProcessing}
          className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          Anterior
        </button>

        {totalPages > 0 &&
          getVisiblePages().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 rounded-md ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              disabled={isProcessing}
              aria-label={`Página ${page}`}
            >
              {page}
            </button>
          ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isProcessing}
          className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Próxima página"
        >
          Próximo
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || isProcessing}
          className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Paginacao;