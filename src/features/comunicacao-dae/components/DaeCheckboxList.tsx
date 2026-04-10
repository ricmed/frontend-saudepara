import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Check, AlertCircle } from 'lucide-react';
import { Dae } from '@/services/DaeService';
import { searchMatches } from '@/utils/searchUtils';

interface DaeCheckboxListProps {
  daes: Dae[];
  selectedDaeId: number;
  onChange: (daeId: number) => void;
  error?: string;
}

const DaeCheckboxList: React.FC<DaeCheckboxListProps> = ({
  daes,
  selectedDaeId,
  onChange,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Capturar o DAE selecionado APENAS no carregamento inicial
  // Não atualizar durante a interação do usuário
  const initialSelectedDaeId = useRef<number | null>(null);
  const hasSetInitialValue = useRef(false);
  
  useEffect(() => {
    // Define apenas uma vez quando selectedDaeId for carregado do backend (> 0)
    if (!hasSetInitialValue.current && selectedDaeId > 0) {
      initialSelectedDaeId.current = selectedDaeId;
      hasSetInitialValue.current = true;
    }
  }, [selectedDaeId]);

  // Filtrar e ordenar DAEs
  const filteredDaes = useMemo(() => {
    let result = [...daes]; // Criar cópia para não mutar o original
    
    // Aplicar filtro de busca (ignora maiúsculas, acentos, cedilhas)
    if (searchTerm) {
      result = result.filter(dae =>
        searchMatches(dae.nome, searchTerm) ||
        searchMatches(dae.codigo, searchTerm)
      );
    }
    
    // Ordenar: apenas se houver um DAE selecionado INICIALMENTE (do banco)
    // Não reordena durante a seleção do usuário
    if (initialSelectedDaeId.current && initialSelectedDaeId.current > 0) {
      result.sort((a, b) => {
        if (a.id_dae === initialSelectedDaeId.current) return -1;
        if (b.id_dae === initialSelectedDaeId.current) return 1;
        return 0;
      });
    }
    
    return result;
  }, [daes, searchTerm, initialSelectedDaeId.current]);

  return (
    <div className="space-y-4">
      {/* Label e Contador */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Doença, Agravo ou Evento (DAE)
          <span className="text-red-500 ml-1">*</span>
        </label>
        {selectedDaeId > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">1 selecionado</span>
          </div>
        )}
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou código CID..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lista de Checkboxes */}
      {filteredDaes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">
            {searchTerm 
              ? `Nenhum DAE encontrado para "${searchTerm}"`
              : 'Nenhum DAE disponível'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredDaes.map((dae) => {
            const isSelected = selectedDaeId === dae.id_dae;
            
            return (
              <label
                key={dae.id_dae}
                className={`
                  flex items-start gap-3 p-5 rounded-xl cursor-pointer transition-all duration-200 min-h-[100px]
                  ${isSelected 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md scale-[1.02]' 
                    : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-center h-6 mt-0.5">
                  <input
                    type="radio"
                    name="dae-selection"
                    checked={isSelected}
                    onChange={() => onChange(dae.id_dae)}
                    className="w-6 h-6 rounded-full border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-medium transition-colors leading-relaxed ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {dae.nome}
                    </span>
                    {isSelected && (
                      <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  
                  {dae.codigo && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        CID: {dae.codigo}
                      </span>
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Mensagem de ajuda */}
      <p className="text-xs text-gray-500 flex items-start gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>Selecione a doença, agravo ou evento que está sendo comunicado</span>
      </p>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* CSS personalizado para scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
};

export default DaeCheckboxList;
