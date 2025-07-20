import React, { useState } from 'react';
import { MoreVertical, MapPin, RefreshCw, X, Volume2, VolumeX } from 'lucide-react';

interface DirectionsMock {
  // adicione aqui campos que você usa (ex: steps?)
  steps?: any[];
  route?: any;
  distance?: number;
  duration?: number;
}

export interface BotoesControleProps {
  directions: DirectionsMock | null;
  voiceGuidanceActive: boolean;
  onCentralizarUsuario: () => void;
  onCarregarDados: () => void;
  onLimparRota: () => void;
  onToggleVoiceGuidance: () => void;
}

export const BotoesControle: React.FC<BotoesControleProps> = ({
  directions,
  voiceGuidanceActive,
  onCentralizarUsuario,
  onCarregarDados,
  onLimparRota,
  onToggleVoiceGuidance,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Menu Flutuante */}
      {isMenuOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-2 mb-2">
          <div className="flex flex-col gap-2">
            {/* Botão de Minha Localização */}
            <button
              onClick={onCentralizarUsuario}
              className="p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-gray-700"
              title="Minha localização"
            >
              <MapPin className="h-5 w-5" />
              <span className="text-sm">Minha Localização</span>
            </button>

            {/* Botão de Atualizar Dados */}
            <button
              onClick={onCarregarDados}
              className="p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-gray-700"
              title="Atualizar estabelecimentos"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-sm">Atualizar Dados</span>
            </button>

            {/* Botão de Limpar Rota (condicional) */}
            {directions && (
              <button
                onClick={onLimparRota}
                className="p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                title="Limpar rota"
              >
                <X className="h-5 w-5" />
                <span className="text-sm">Limpar Rota</span>
              </button>
            )}

            {/* Botão de Orientação por Voz (condicional) */}
            {directions && (
              <button
                onClick={onToggleVoiceGuidance}
                className={`p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 ${
                  voiceGuidanceActive ? "text-blue-600" : "text-gray-700"
                }`}
                title={voiceGuidanceActive ? "Desativar voz" : "Ativar voz"}
              >
                {voiceGuidanceActive ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
                <span className="text-sm">
                  {voiceGuidanceActive ? "Desativar Voz" : "Ativar Voz"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Botão principal que abre/fecha o menu */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`p-3 rounded-full shadow-lg transition-colors ${
          isMenuOpen 
            ? "bg-blue-600 text-white hover:bg-blue-700" 
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        <MoreVertical className="h-6 w-6" />
      </button>
    </div>
  );
};

export default BotoesControle;