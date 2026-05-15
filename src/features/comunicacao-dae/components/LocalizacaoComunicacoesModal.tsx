import React, { useMemo } from 'react';
import { Edit, Eye, FileText, X } from 'lucide-react';
import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';
import { LocalizacaoMapa } from '@/features/dashboard/components/MapaDashboardDAE';
import {
  filterComunicacoesByLocalizacao,
  formatDateOnlyPtBr,
  formatTimeOnlyPtBr,
} from '@/features/comunicacao-dae/utils/dashboardFormatters';
import {
  getLocalizacaoModalDotBgClass,
  getLocalizacaoModalHeaderBgClass,
} from '@/features/comunicacao-dae/utils/origemPresentation';

type LocalizacaoComunicacoesModalProps = {
  isOpen: boolean;
  selectedLocalizacao: LocalizacaoMapa | null;
  dadosFiltrados: ComunicacaoDae[];
  onClose: () => void;
  onOpenView: (comunicacao: ComunicacaoDae) => void;
  onOpenEdit: (comunicacao: ComunicacaoDae) => void;
};

export const LocalizacaoComunicacoesModal: React.FC<LocalizacaoComunicacoesModalProps> = ({
  isOpen,
  selectedLocalizacao,
  dadosFiltrados,
  onClose,
  onOpenView,
  onOpenEdit,
}) => {
  const comunicacoesLocalizacao = useMemo(() => {
    if (!selectedLocalizacao) return [];
    return filterComunicacoesByLocalizacao(dadosFiltrados, selectedLocalizacao.id);
  }, [dadosFiltrados, selectedLocalizacao]);

  if (!isOpen || !selectedLocalizacao) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-4 sm:p-6 border-b flex items-start sm:items-center justify-between gap-3 ${getLocalizacaoModalHeaderBgClass(
            selectedLocalizacao.tipo
          )}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${getLocalizacaoModalDotBgClass(selectedLocalizacao.tipo)}`} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedLocalizacao.nome}</h3>
              <p className="text-sm text-gray-600">
                {selectedLocalizacao.tipo} • {selectedLocalizacao.fichasCount} ficha(s)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Endereco:</strong> {selectedLocalizacao.endereco}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 mb-3">Comunicacoes Relacionadas</h4>

            {comunicacoesLocalizacao.map((comunicacao, index) => (
              <div
                key={comunicacao.id_comunicacao}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {comunicacao.nome_paciente || 'Nome não informado'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <strong>Data:</strong> {formatDateOnlyPtBr(comunicacao.data_comunicacao)}
                      </div>
                      <div>
                        <strong>Hora:</strong> {formatTimeOnlyPtBr(comunicacao.data_comunicacao)}
                      </div>
                      <div>
                        <strong>Município (Ocorrência):</strong> {comunicacao.tipo_municipio?.descricao || 'N/A'}
                      </div>
                      <div>
                        <strong>Município (Residência):</strong>{' '}
                        {comunicacao.tipo_municipio_residencia?.descricao || 'N/A'}
                      </div>
                      <div>
                        <strong>DAE:</strong> {comunicacao.dae?.nome || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onOpenView(comunicacao)}
                      className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      title="Visualizar em modal"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver
                    </button>
                    <button
                      onClick={() => onOpenEdit(comunicacao)}
                      className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      title="Editar em modal"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {comunicacoesLocalizacao.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma comunicação encontrada para esta localização</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
