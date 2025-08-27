// src/features/notificationForms/components/NotificationTable.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { Notificacao, ColumnDefinition } from '../types';
import { formatDate } from '../utils';

interface NotificationTableProps {
  notificacoes: Notificacao[];
  isLoading: boolean;
  error: string | null;
  onDismissError: () => void;
  selectedColumns: string[];
  allColumns: ColumnDefinition[];
  sortKey: keyof Notificacao;
  sortOrder: "asc" | "desc";
  onSortChange: (key: string | keyof Notificacao) => void;
  onDelete: (id: number) => void;
  searchTerm?: string;
}

const NotificationTable: React.FC<NotificationTableProps> = ({
  notificacoes,
  isLoading,
  error,
  onDismissError,
  selectedColumns,
  allColumns,
  sortKey,
  sortOrder,
  onSortChange,
  onDelete,
  searchTerm = "",
}) => {
  const navigate = useNavigate();

  const renderCellContent = (notificacao: Notificacao, key: string) => {
    switch (key) {
      case "paciente":
        return (
          <div className="font-medium text-gray-900">
            {notificacao.paciente}
          </div>
        );
      case "tipo_evento":
        return notificacao.tipoEvento;
      case "data_ocorrencia":
        return notificacao.dataOcorrencia;
      case "data_atendimento":
        return formatDate(notificacao.original?.data_atendimento);
      case "tipo_atendimento":
        return notificacao.tipoAtendimento;
      case "tipo_encerramento":
        return notificacao.tipoEncerramento;
      case "unidade_notificadora":
        return notificacao.original
          ?.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento
          ?.nome || "";
      // 🆕 NOVOS CASOS: Campos de auditoria
      case "created_by_userid":
        return (
          <div className="text-sm text-gray-600">
            {notificacao.original?.created_by_userid || "—"}
          </div>
        );
      case "updated_by_userid":
        return (
          <div className="text-sm text-gray-600">
            {notificacao.original?.updated_by_userid || "—"}
          </div>
        );
      case "created_at":
        return formatDate(notificacao.original?.created_at);
      case "updated_at":
        return formatDate(notificacao.original?.updated_at);
      default:
        return String(notificacao[key] || "");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={onDismissError}
            className="text-red-700 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Mobile: Cards Layout */}
      <div className="block md:hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Carregando...</p>
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>
              {searchTerm
                ? `Nenhuma notificação encontrada para "${searchTerm}"`
                : "Nenhuma notificação cadastrada"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notificacoes.map((notificacao) => (
              <div
                key={notificacao.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() =>
                  navigate(
                    `/private/comunicacao-de-caso/editar/${notificacao.id}`
                  )
                }
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {notificacao.paciente || 'Paciente não informado'}
                    </h3>
                    <div className="mt-1 text-sm text-gray-600 space-y-1">
                      {notificacao.tipoEvento && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Evento:</span>
                          <span>{notificacao.tipoEvento}</span>
                        </div>
                      )}
                      {notificacao.dataOcorrencia && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Ocorrência:</span>
                          <span>{formatDate(notificacao.dataOcorrencia)}</span>
                        </div>
                      )}
                      {notificacao.tipoAtendimento && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Atendimento:</span>
                          <span>{notificacao.tipoAtendimento}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/private/comunicacao-de-caso/editar/${notificacao.id}`
                        );
                      }}
                      className="p-3 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notificacao.id);
                      }}
                      className="p-3 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors touch-manipulation"
                      title="Excluir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600 text-white">
            <tr>
              {allColumns
                .filter((col) => selectedColumns.includes(col.key))
                .map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      {col.label}
                      {col.sortable !== false && (
                        <button
                          onClick={() => onSortChange(col.key as keyof Notificacao)}
                          className="ml-1 focus:outline-none text-white"
                          aria-label={sortOrder === "asc" ? "Ordenar decrescente" : "Ordenar crescente"}
                          title={sortOrder === "asc" ? "Ordenar decrescente" : "Ordenar crescente"}
                        >
                          {sortKey === col.key ? (
                            sortOrder === "asc" ? (
                              <span>▲</span>
                            ) : (
                              <span>▼</span>
                            )
                          ) : (
                            <span className="text-blue-200">▼</span>
                          )}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan={selectedColumns.length + 1}
                  className="px-6 py-4 text-center"
                >
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : notificacoes.length === 0 ? (
              <tr>
                <td
                  colSpan={selectedColumns.length + 1}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  {searchTerm
                    ? `Nenhuma notificação encontrada para "${searchTerm}"`
                    : "Nenhuma notificação cadastrada"}
                </td>
              </tr>
            ) : (
              notificacoes.map((notificacao) => (
                <tr
                  key={notificacao.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/private/comunicacao-de-caso/editar/${notificacao.id}`
                    )
                  }
                >
                  {allColumns
                    .filter((col) => selectedColumns.includes(col.key))
                    .map((col) => (
                      <td
                        key={`${notificacao.id}-${col.key}`}
                        className="px-6 py-4 whitespace-nowrap"
                      >
                        {renderCellContent(notificacao, col.key)}
                      </td>
                    ))}
                  {/* Botões de ação */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div
                      className="flex items-center justify-end space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/private/comunicacao-de-caso/editar/${notificacao.id}`
                          );
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(notificacao.id);
                        }}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationTable;