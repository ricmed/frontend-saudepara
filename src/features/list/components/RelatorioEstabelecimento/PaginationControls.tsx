import { PaginationMeta } from "../../types/estabelecimento";

interface PaginationControlsProps {
  paginationMeta: PaginationMeta;
  currentPage: number;
  itemsPerPage: number;
  tempPage: string;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onTempPageChange: (page: string) => void;
}

export const PaginationControls = ({
  paginationMeta,
  currentPage,
  itemsPerPage,
  tempPage,
  onPageChange,
  onItemsPerPageChange,
  onTempPageChange,
}: PaginationControlsProps) => {
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTempPageChange(e.target.value);
  };

  const handlePageInputBlur = () => {
    const page = Number(tempPage);
    if (page >= 1 && page <= paginationMeta.totalPages) {
      onPageChange(page);
    } else {
      onTempPageChange(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handlePageInputBlur();
    }
  };

  // Funções helper internas para calcular corretamente os índices
  const showingFrom = () => {
    if (paginationMeta.total === 0) return 0;
    return Math.min((currentPage - 1) * itemsPerPage + 1, paginationMeta.total);
  };

  const showingTo = () => {
    if (paginationMeta.total === 0) return 0;
    return Math.min(currentPage * itemsPerPage, paginationMeta.total);
  };

  // Função para gerar números de página de forma adaptativa
  const generatePageNumbers = () => {
    const totalPages = Math.max(1, paginationMeta.totalPages);
    const currentPageNum = Math.min(currentPage, totalPages);
    
    const pages = [];
    const maxButtons = 5;
    
    if (totalPages <= maxButtons) {
      // Mostrar todas as páginas se tiver poucas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar página 1
      pages.push(1);
      
      // Mostrar elipses se necessário
      if (currentPageNum > 3) {
        pages.push("...");
      }
      
      // Páginas ao redor da atual
      const start = Math.max(2, currentPageNum - 1);
      const end = Math.min(totalPages - 1, currentPageNum + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Mostrar elipses se necessário
      if (currentPageNum < totalPages - 2) {
        pages.push("...");
      }
      
      // Mostrar última página
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Total de páginas (mínimo 1)
  const totalPages = Math.max(1, paginationMeta.totalPages);
  // Total de registros
  const total = paginationMeta.total || 0;
  // Se tem registros ou não
  const hasRecords = total > 0;

  return (
    <div className="flex justify-between items-center px-8 py-4 border-t border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Mostrando {showingFrom()} a {showingTo()} de {total} registros
        </span>

        <select
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        {/* Botão início */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || !hasRecords}
          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
          title="Primeira página"
        >
          ≪
        </button>

        {/* Botão anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || !hasRecords}
          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
          title="Página anterior"
        >
          ＜
        </button>

        {/* Input de página */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Página</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={tempPage}
            onChange={handlePageInputChange}
            onKeyDown={handlePageInputKeyDown}
            onBlur={handlePageInputBlur}
            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
            disabled={!hasRecords}
          />
          <span className="text-sm text-gray-600">
            de {totalPages}
          </span>
        </div>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {generatePageNumbers().map((pageNum, idx) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-1">
                ...
              </span>
            ) : (
              <button
                key={`page-${pageNum}`}
                onClick={() => onPageChange(Number(pageNum))}
                className={`px-3 py-1 rounded ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                disabled={!hasRecords}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        {/* Botão próximo */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || !hasRecords}
          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
          title="Próxima página"
        >
          ＞
        </button>

        {/* Botão final */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || !hasRecords}
          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
          title="Última página"
        >
          ≫
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;