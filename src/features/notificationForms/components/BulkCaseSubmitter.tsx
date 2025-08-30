// src/features/notificationForms/components/BulkCaseSubmitter.tsx
import React, { useState } from 'react';
import { Upload, Users, Loader, CheckCircle, XCircle, Info } from 'lucide-react';
import { FormData } from '../types/index2';
import NotificacaoService from '@/services/NotificacaoService';

interface BulkCaseSubmitterProps {
  cases: FormData[];
  onSubmissionComplete: (results: SubmissionResult[]) => void;
  onClose: () => void;
}

interface SubmissionResult {
  case: FormData;
  success: boolean;
  id?: number;
  error?: string;
}

const BulkCaseSubmitter: React.FC<BulkCaseSubmitterProps> = ({
  cases,
  onSubmissionComplete,
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SubmissionResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const submitCases = async () => {
    setIsSubmitting(true);
    setResults([]);
    setCurrentIndex(0);
    
    const submissionResults: SubmissionResult[] = [];
    
    for (let i = 0; i < cases.length; i++) {
      setCurrentIndex(i + 1);
      
      try {
        // Simular delay para mostrar progresso
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await NotificacaoService.create(cases[i]);
        
        submissionResults.push({
          case: cases[i],
          success: true,
          id: response.id
        });
        
      } catch (error: any) {
        submissionResults.push({
          case: cases[i],
          success: false,
          error: error.message || 'Erro desconhecido'
        });
      }
    }
    
    setResults(submissionResults);
    setIsSubmitting(false);
    setShowResults(true);
    onSubmissionComplete(submissionResults);
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Resultados da Submissão em Massa
            </h3>
          </div>
          
          <div className="p-6">
            {/* Resumo */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Sucesso</span>
                </div>
                <p className="text-2xl font-bold text-green-800">{successCount}</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Erros</span>
                </div>
                <p className="text-2xl font-bold text-red-800">{errorCount}</p>
              </div>
            </div>
            
            {/* Lista de resultados */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${
                    result.success 
                      ? 'bg-green-50 border-green-400' 
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {result.case.paciente || `Caso ${index + 1}`}
                    </span>
                    {result.success ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">ID: {result.id}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Erro</span>
                      </div>
                    )}
                  </div>
                  {!result.success && result.error && (
                    <p className="text-sm text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 border-t bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Submissão em Massa
          </h3>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium">{cases.length} casos para enviar</p>
              <p className="text-sm text-gray-500">
                Todos os casos serão salvos automaticamente
              </p>
            </div>
          </div>
          
          {isSubmitting && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm">
                  Enviando caso {currentIndex} de {cases.length}...
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentIndex / cases.length) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Atenção:</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Esta operação criará {cases.length} notificações no sistema. 
              O processo pode levar alguns minutos para ser concluído.
            </p>
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={submitCases}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar Todos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkCaseSubmitter;
