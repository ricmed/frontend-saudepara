import React from 'react';
import { Edit, FileText, X } from 'lucide-react';
import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';

type ComunicacaoFichaModalProps = {
  isOpen: boolean;
  selectedComunicacao: ComunicacaoDae | null;
  mode: 'view' | 'edit';
  onClose: () => void;
};

export const ComunicacaoFichaModal: React.FC<ComunicacaoFichaModalProps> = ({
  isOpen,
  selectedComunicacao,
  mode,
  onClose,
}) => {
  if (!isOpen || !selectedComunicacao) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-3 sm:p-4"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between p-4 border-b text-white rounded-t-lg ${
            mode === 'edit'
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}
        >
          <h3 className="text-sm sm:text-lg font-semibold flex items-center gap-2 flex-wrap">
            {mode === 'edit' ? <Edit className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            {mode === 'edit' ? 'Editar' : 'Visualizar'} Comunicacao DAE - ID:{' '}
            {selectedComunicacao.id_comunicacao}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              mode === 'edit' ? 'hover:bg-green-700' : 'hover:bg-blue-700'
            }`}
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <iframe
            src={
              mode === 'edit'
                ? `/private/comunicacao-dae/editar/${selectedComunicacao.id_comunicacao}`
                : `/private/comunicacao-dae/${selectedComunicacao.id_comunicacao}`
            }
            className="w-full h-full border-0"
            title={`${mode === 'edit' ? 'Edicao' : 'Visualizacao'} da Comunicacao DAE`}
          />
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
