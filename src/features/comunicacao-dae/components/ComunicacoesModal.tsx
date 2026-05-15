import React, { useMemo } from 'react';
import { Edit, Eye, FileText, Search, X } from 'lucide-react';
import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';
import { formatDateTimePtBr } from '@/features/comunicacao-dae/utils/dashboardFormatters';
import { getOrigemTipoBadgeClass } from '@/features/comunicacao-dae/utils/origemPresentation';

type ComunicacoesModalProps = {
  isOpen: boolean;
  comunicacoes: ComunicacaoDae[];
  modalSearchTerm: string;
  onSearchTermChange: (value: string) => void;
  onClose: () => void;
  onOpenView: (comunicacao: ComunicacaoDae) => void;
  onOpenEdit: (comunicacao: ComunicacaoDae) => void;
};

export const ComunicacoesModal: React.FC<ComunicacoesModalProps> = ({
  isOpen,
  comunicacoes,
  modalSearchTerm,
  onSearchTermChange,
  onClose,
  onOpenView,
  onOpenEdit,
}) => {
  const comunicacoesOrdenadas = useMemo(() => {
    return [...comunicacoes].sort((a, b) => {
      return new Date(b.data_comunicacao).getTime() - new Date(a.data_comunicacao).getTime();
    });
  }, [comunicacoes]);

  const comunicacoesPesquisadas = useMemo(() => {
    return comunicacoesOrdenadas.filter((com) => {
      if (!modalSearchTerm) return true;
      const termo = modalSearchTerm.toLowerCase();
      return (
        com.id_comunicacao?.toString().includes(termo) ||
        com.nome_paciente?.toLowerCase().includes(termo) ||
        com.dae?.nome?.toLowerCase().includes(termo) ||
        com.tipo_municipio?.descricao?.toLowerCase().includes(termo) ||
        com.tipo_municipio_residencia?.descricao?.toLowerCase().includes(termo) ||
        com.origem_tipo?.toLowerCase().includes(termo)
      );
    });
  }, [comunicacoesOrdenadas, modalSearchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Comunicações DAE</h2>
                <p className="text-sm text-gray-600">
                  {comunicacoesPesquisadas.length} de {comunicacoesOrdenadas.length} comunicação(ões)
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar por ID, paciente, DAE, município, origem..."
              value={modalSearchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            {modalSearchTerm && (
              <button
                onClick={() => onSearchTermChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-180px)] sm:max-h-[calc(85vh-200px)]">
          {comunicacoesPesquisadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhuma comunicação encontrada</p>
              <p className="text-sm">Tente ajustar os filtros ou o termo de pesquisa</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comunicacoesPesquisadas.map((com) => (
                <div
                  key={com.id_comunicacao}
                  className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ID / Paciente</p>
                        <p className="font-semibold text-gray-900">#{com.id_comunicacao}</p>
                        <p className="text-sm text-gray-700">{com.nome_paciente || 'Não informado'}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">DAE / Origem</p>
                        <p className="text-sm font-medium text-gray-900">{com.dae?.nome || 'Não informado'}</p>
                        <p className="text-sm">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getOrigemTipoBadgeClass(
                              com.origem_tipo
                            )}`}
                          >
                            {com.origem_tipo}
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Município Ocorrência / Residência</p>
                        <p className="text-sm text-gray-700">
                          Ocor.: {com.tipo_municipio?.descricao || 'Não informado'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Res.: {com.tipo_municipio_residencia?.descricao || 'Não informado'}
                        </p>
                        <p className="text-xs text-gray-600">{formatDateTimePtBr(com.data_comunicacao)}</p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2">
                      <button
                        onClick={() => onOpenView(com)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Visualizar em modal"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenEdit(com)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Editar em modal"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-600">Total: {comunicacoesPesquisadas.length} comunicação(ões)</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
