// src/features/notificationForms/components/MockDataControls.tsx
import React, { useState } from 'react';
import { 
  Shuffle, 
  Users, 
  Plane, 
  AlertTriangle, 
  Utensils,
  ChevronDown,
  Dices,
  Sparkles,
  Upload
} from 'lucide-react';
import { 
  aplicarCasoAleatorioAoFormulario, 
  aplicarPreset, 
  gerarMultiplosCasos,
  PRESETS_CASOS 
} from '../utils/mockDataGenerator';
import { FormData } from '../types/index2';
import BulkCaseSubmitter from './BulkCaseSubmitter';

interface MockDataControlsProps {
  setFormData: (data: FormData) => void;
  setErrors?: (errors: any) => void;
  onMultipleCasesGenerated?: (cases: FormData[]) => void;
}

const MockDataControls: React.FC<MockDataControlsProps> = ({ 
  setFormData, 
  setErrors,
  onMultipleCasesGenerated 
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState(5);
  const [showBulkSubmitter, setShowBulkSubmitter] = useState(false);
  const [casesForSubmission, setCasesForSubmission] = useState<FormData[]>([]);

  const handleRandomCase = () => {
    aplicarCasoAleatorioAoFormulario(setFormData, setErrors);
  };

  const handlePreset = (preset: keyof typeof PRESETS_CASOS) => {
    aplicarPreset(preset, setFormData, setErrors);
    setShowPresets(false);
  };

  const handleBulkGeneration = () => {
    if (onMultipleCasesGenerated) {
      const casos = gerarMultiplosCasos(bulkQuantity);
      onMultipleCasesGenerated(casos);
      setShowBulkOptions(false);
    }
  };

  const handleGenerateAndSubmit = () => {
    const casos = gerarMultiplosCasos(bulkQuantity);
    setCasesForSubmission(casos);
    setShowBulkSubmitter(true);
    setShowBulkOptions(false);
  };

  const handleSubmissionComplete = (results: any[]) => {
    console.log('Resultados da submissão:', results);
    // Aqui você pode adicionar lógica adicional, como atualizar o dashboard
  };

  const handleCloseBulkSubmitter = () => {
    setShowBulkSubmitter(false);
    setCasesForSubmission([]);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-sm font-semibold text-purple-800">
          🎲 Gerador de Casos Fictícios
        </h3>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
          Para Testes
        </span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {/* Botão de caso aleatório principal */}
        <button
          type="button"
          onClick={handleRandomCase}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Shuffle className="h-4 w-4" />
          Gerar Caso Aleatório
        </button>

        {/* Dropdown de presets */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Dices className="h-4 w-4" />
            Presets Específicos
            <ChevronDown className={`h-4 w-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
          </button>
          
          {showPresets && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border z-50 min-w-48">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => handlePreset('turista_dengue')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  <Plane className="h-4 w-4 text-orange-500" />
                  Turista com Dengue
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('local_trauma')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Morador Local - Trauma
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('surto_alimentar')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  <Utensils className="h-4 w-4 text-green-500" />
                  Surto Alimentar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Opções de geração em massa (se callback fornecido) */}
        {onMultipleCasesGenerated && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBulkOptions(!showBulkOptions)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Users className="h-4 w-4" />
              Gerar Múltiplos
              <ChevronDown className={`h-4 w-4 transition-transform ${showBulkOptions ? 'rotate-180' : ''}`} />
            </button>
            
            {showBulkOptions && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border z-50 min-w-48">
                <div className="p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade de casos:
                  </label>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      value={bulkQuantity}
                      onChange={(e) => setBulkQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                      min="1"
                      max="50"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-xs text-gray-500">(máx 50)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkGeneration}
                    className="w-full px-3 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 transition-colors mb-2"
                  >
                    Gerar {bulkQuantity} casos
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAndSubmit}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Gerar e Enviar {bulkQuantity} casos
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-700 leading-relaxed">
          💡 <strong>Dica:</strong> Os dados gerados são fictícios e realistas, incluindo nomes, CPFs válidos, 
          telefones de Belém/PA e sintomas coerentes com o tipo de atendimento. 
          Perfeito para testes do dashboard!
        </p>
      </div>

      {/* Modal de submissão em massa */}
      {showBulkSubmitter && (
        <BulkCaseSubmitter
          cases={casesForSubmission}
          onSubmissionComplete={handleSubmissionComplete}
          onClose={handleCloseBulkSubmitter}
        />
      )}
    </div>
  );
};

export default MockDataControls;
