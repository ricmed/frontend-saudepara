import React from 'react';

export type ListPaginationBarProps = {
  page: number;
  totalPages: number;
  total: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  disabled?: boolean;
  itemsPerPageId?: string;
  itemsPerPageTestId?: string;
};

/**
 * Card de paginação no padrão Comunicação DAE
 * (Mostrando X–Y de Z + ««/»» + seletor de itens).
 */
export const ListPaginationBar: React.FC<ListPaginationBarProps> = ({
  page,
  totalPages,
  total,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  disabled = false,
  itemsPerPageId = 'list-items-per-page',
  itemsPerPageTestId = 'list-items-per-page',
}) => {
  const from = total > 0 ? (page - 1) * itemsPerPage + 1 : 0;
  const to = Math.min(page * itemsPerPage, total);

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="text-sm text-gray-600 text-center lg:text-left">
          Mostrando <span className="font-semibold text-gray-900">{from}</span> a{' '}
          <span className="font-semibold text-gray-900">{to}</span> de{' '}
          <span className="font-semibold text-gray-900">{total}</span> registros
        </div>

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={disabled || page <= 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
              title="Primeira página"
            >
              ««
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={disabled || page <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Anterior
            </button>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm">
              Página {page} de {totalPages}
            </div>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={disabled || page >= totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Próxima
            </button>
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={disabled || page >= totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
              title="Última página"
            >
              »»
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-2 w-full lg:w-auto">
          <label htmlFor={itemsPerPageId} className="text-sm text-gray-600 font-medium whitespace-nowrap">
            Itens por página:
          </label>
          <select
            id={itemsPerPageId}
            data-testid={itemsPerPageTestId}
            value={itemsPerPage}
            disabled={disabled}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ListPaginationBar;
