import React from 'react';
import { TempoViagem } from '../types';
import { MODOS_TRANSPORTE } from '../utils/constants';

interface InfoTemposViagemProps {
  temposViagem: TempoViagem[];
  modoTransporteSelecionado: string;
  onModoSelect: (modo: string) => void;
}

export const InfoTemposViagem: React.FC<InfoTemposViagemProps> = ({
  temposViagem,
  modoTransporteSelecionado,
  onModoSelect,
}) => {
  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-24 md:w-64 
      bg-white p-4 rounded-lg shadow-lg z-40">
      <h3 className="font-bold mb-2">Tempo estimado por transporte:</h3>
      <div className="space-y-2">
        {temposViagem.map(({ modo, duracao, distancia }) => {
          const modoInfo = MODOS_TRANSPORTE.find((m) => m.modo === modo);
          return (
            <button
              key={modo}
              onClick={() => onModoSelect(modo)}
              className={`w-full flex items-center justify-between p-2 rounded 
                transition-colors focus:outline-none focus:ring-2 
                focus:ring-blue-500 focus:ring-offset-2
                ${
                  modoTransporteSelecionado === modo
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-gray-100"
                }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{modoInfo?.icone}</span>
                <span>{modoInfo?.label}</span>
              </span>
              <span className="text-sm text-gray-600">
                {duracao} ({distancia})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};