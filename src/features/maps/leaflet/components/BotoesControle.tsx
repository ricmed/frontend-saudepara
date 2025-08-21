import React, { useState } from 'react';
import { MoreVertical, MapPin, RefreshCw, X, Volume2, VolumeX } from 'lucide-react';

interface DirectionsMock {
  // adicione aqui campos que você usa (ex: steps?)
  steps?: any[];
  route?: any;
  distance?: number;
  duration?: number;
}

interface RouteInfo {
  hasRoute: boolean;
  isCalculating: boolean;
  distance?: string;
  duration?: string;
}

export interface BotoesControleProps {
  directions: DirectionsMock | null;
  voiceGuidanceActive: boolean;
  routeInfo?: RouteInfo;
  onCentralizarUsuario: () => void;
  onCarregarDados: () => void;
  onLimparRota: () => void;
  onToggleVoiceGuidance: () => void;
}

export const BotoesControle: React.FC<BotoesControleProps> = ({
  directions,
  voiceGuidanceActive,
  routeInfo = { hasRoute: false, isCalculating: false },
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
            {/* Informações da rota ativa */}
            {routeInfo.hasRoute && routeInfo.distance && routeInfo.duration && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="text-xs font-medium text-blue-800 mb-1">Rota Ativa</div>
                <div className="text-xs text-blue-700">
                  <div>Distância: {routeInfo.distance}</div>
                  <div>Tempo: {routeInfo.duration}</div>
                </div>
              </div>
            )}

            {/* Indicador de carregamento da rota */}
            {routeInfo.isCalculating && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <div className="text-xs text-yellow-800 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-600"></div>
                  Calculando rota...
                </div>
              </div>
            )}

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
            {(directions || routeInfo.hasRoute) && (
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