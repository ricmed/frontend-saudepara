// DataTable.tsx
import React from 'react';
interface DataTableProps<T> {
    data: T[];
    columns: {
      header: string;
      accessor: keyof T;
      align?: 'left' | 'right' | 'center';
      render?: (value: any, item: T) => React.ReactNode;
    }[];
    loading: boolean;
    error: string | null;
    onDismissError: () => void;
    renderActions?: (item: T) => React.ReactNode;
    emptyMessage: string;
    searchTerm?: string;
  }
  
  export const DataTable = <T extends object>({
    data,
    columns,
    loading,
    error,
    onDismissError,
    renderActions,
    emptyMessage,
    searchTerm
  }: DataTableProps<T>) => {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-4 flex justify-between items-center animate-fade-in">
            <span>{error}</span>
            <button
              onClick={onDismissError}
              className="text-red-700 hover:text-red-800"
              aria-label="Fechar erro"
            >
              ×
            </button>
          </div>
        )}
  
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`px-8 py-4 text-${column.align || 'left'} text-sm font-semibold text-blue-600 uppercase`}
                    >
                      {column.header}
                    </th>
                  ))}
                  {renderActions && (
                    <th className="px-8 py-4 text-right text-sm font-semibold text-blue-600 uppercase">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (renderActions ? 1 : 0)}
                      className="px-8 py-6 text-center text-gray-500"
                    >
                      {searchTerm ? "Nenhum resultado encontrado" : emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors`}
                    >
                      {columns.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className={`px-8 py-4 text-gray-600 text-${column.align || 'left'}`}
                        >
                          {column.render 
                            ? column.render(item[column.accessor], item)
                            : String(item[column.accessor])
                          }
                        </td>
                      ))}
                      {renderActions && (
                        <td className="px-8 py-4 text-right">
                          {renderActions(item)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };