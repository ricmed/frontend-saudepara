import React from 'react';
import { QUALIFICACOES_COP30 } from '../utils/qualificacoesCOP30';

interface LegendaQualificacoesProps {
  className?: string;
}

/**
 * Componente de legenda para mostrar as cores das qualificações COP 30 no mapa
 */
export const LegendaQualificacoes: React.FC<LegendaQualificacoesProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-3 ${className}`}>
      <h3 className="text-sm font-bold text-gray-800 mb-2">Legenda</h3>
      <div className="space-y-1.5">
        {QUALIFICACOES_COP30.map((qual) => (
          <div key={qual.nome} className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0"
              style={{ 
                backgroundColor: qual.cor,
                color: qual.textColor,
                fontSize: '8px',
                fontWeight: 'bold'
              }}
            >
              {qual.letra}
            </div>
            <span className="text-xs text-gray-700 leading-tight">{qual.nome}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
