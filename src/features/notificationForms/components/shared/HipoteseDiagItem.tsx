import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ListaSindromicaService } from '@/services/ListaSindromicaService';

interface HipoteseDiagItemProps {
  option: any;
  qtdSintomas: number;
  formData: any;
  checked: boolean;
  onChange: () => void;
  showAllHipoteses: boolean;
}

const HipoteseDiagItem: React.FC<HipoteseDiagItemProps> = ({
  option,
  qtdSintomas,
  formData,
  checked,
  onChange,
  showAllHipoteses,
}) => {
  const [showRelatedSymptoms, setShowRelatedSymptoms] = useState(false);
  const [relatedSymptoms, setRelatedSymptoms] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Efeito para carregar sintomas quando o popup é aberto
  useEffect(() => {
    if (!showRelatedSymptoms) return;
    
    const fetchRelatedSymptoms = async () => {
      try {
        setIsLoadingRelated(true);
        
        // Buscar sintomas relacionados da API
        const response = await ListaSindromicaService.getSintomasPorHipotese(option.idtipo_hipotese_diag.toString());
        
        // Mapear para o formato esperado
        const sintomas = response.map((sintoma: any) => ({
          id: sintoma.id.toString(),
          descricao: sintoma.sintoma
        }));
        
        setRelatedSymptoms(sintomas);
      } catch (error) {
        console.error('Erro ao buscar sintomas relacionados:', error);
        setRelatedSymptoms([]);
      } finally {
        setIsLoadingRelated(false);
      }
    };
    
    fetchRelatedSymptoms();
  }, [showRelatedSymptoms, option.idtipo_hipotese_diag]);

  return (
    <label
      className={`flex items-center gap-3 p-3 border ${
        qtdSintomas ? 'border-yellow-200' : 'border-gray-200'
      } rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group relative`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
      />
      <div className="flex flex-col">
        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
          {option.descricao}
        </span>
        
        {qtdSintomas ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-yellow-600">
              {qtdSintomas} {qtdSintomas === 1 ? 'sintoma relacionado' : 'sintomas relacionados'}
            </span>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowRelatedSymptoms(!showRelatedSymptoms);
              }}
              className="ml-1 text-blue-500 hover:text-blue-700 rounded-full w-5 h-5 flex items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Ver sintomas relacionados"
            >
              <span role="img" aria-label="Sintomas">🩺</span>
            </button>
            
            {/* Popup com sintomas relacionados */}
            {showRelatedSymptoms && (
              <div className="absolute z-10 top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 max-w-xs w-60 text-xs text-gray-700">
                <div className="font-medium mb-1 text-gray-900">Sintomas relacionados:</div>
                
                {isLoadingRelated ? (
                  <div className="flex items-center justify-center p-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-xs text-gray-600">Carregando sintomas...</span>
                  </div>
                ) : relatedSymptoms.length === 0 ? (
                  <div className="text-gray-500 italic">Nenhum sintoma específico encontrado.</div>
                ) : (
                  <ul className="list-disc pl-4 space-y-1 max-h-40 overflow-y-auto">
                    {relatedSymptoms.map(sintoma => {
                      // Verificar se este sintoma está selecionado
                      const isSelecionado = formData.sinaisESintomas.includes(sintoma.id);
                      
                      return (
                        <li key={sintoma.id} className={isSelecionado ? "text-green-600 font-medium" : ""}>
                          {sintoma.descricao}
                          {isSelecionado && (
                            <span className="ml-1 text-xs text-green-500">(selecionado)</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                
                <div className="absolute right-1 top-1">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowRelatedSymptoms(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : showAllHipoteses && (
          <span className="text-xs text-gray-400">
            Nenhum sintoma relacionado
          </span>
        )}
      </div>
    </label>
  );
};

export default HipoteseDiagItem;