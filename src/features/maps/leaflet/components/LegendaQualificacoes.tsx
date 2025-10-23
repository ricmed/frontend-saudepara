import React from 'react';
import { QUALIFICACOES_COP30 } from '../utils/qualificacoesCOP30';

interface LegendaQualificacoesProps {
  className?: string;
  mobile?: boolean;
}

/**
 * Componente de legenda para mostrar as cores das qualificações COP 30 no mapa
 */
export const LegendaQualificacoes: React.FC<LegendaQualificacoesProps> = ({ className = '', mobile = false }) => {
  if (mobile) {
    // Versão compacta para mobile
    return (
      <div className={`bg-white/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-200 p-1.5 ${className}`}>
        <h3 className="text-[9px] font-bold text-gray-800 mb-1">Legenda</h3>
        <div className="space-y-0.5">
          {/* Localização do usuário */}
          <div className="flex items-center gap-1 pb-0.5 border-b border-gray-200">
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: '12px', height: '12px' }}>
              <svg width="10" height="14" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.7 23.3 0 15 0z" 
                      fill="#EA4335" 
                      stroke="white" 
                      stroke-width="2"/>
                <circle cx="15" cy="15" r="7" fill="white"/>
                <circle cx="15" cy="15" r="4" fill="#EA4335"/>
              </svg>
            </div>
            <span className="text-[8px] text-gray-700 leading-tight font-medium">Você</span>
          </div>
          
          {/* Qualificações COP 30 */}
          {QUALIFICACOES_COP30.map((qual) => (
            <div key={qual.nome} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full border border-white shadow-sm flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: qual.cor,
                  color: qual.textColor,
                  fontSize: '6px',
                  fontWeight: 'bold'
                }}
              >
                {qual.letra}
              </div>
              <span className="text-[8px] text-gray-700 leading-tight">{qual.nome}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Versão desktop (original)
  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-3 ${className}`}>
      <h3 className="text-sm font-bold text-gray-800 mb-2">Legenda</h3>
      <div className="space-y-1.5">
        {/* Localização do usuário */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: '24px', height: '24px' }}>
            <svg width="20" height="28" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.7 23.3 0 15 0z" 
                    fill="#EA4335" 
                    stroke="white" 
                    stroke-width="2"/>
              <circle cx="15" cy="15" r="7" fill="white"/>
              <circle cx="15" cy="15" r="4" fill="#EA4335"/>
            </svg>
          </div>
          <span className="text-xs text-gray-700 leading-tight font-medium">Sua localização</span>
        </div>
        
        {/* Qualificações COP 30 */}
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
