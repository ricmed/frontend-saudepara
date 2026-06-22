import React, { useMemo } from 'react';
import { Local } from '../types';
import { getTiposUnicos } from '../utils/tiposEstabelecimentoConfig';

interface LegendaQualificacoesProps {
  className?: string;
  mobile?: boolean;
  places?: Local[];
}

const UserPin: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={Math.round(size * 1.4)}
    viewBox="0 0 30 42"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.7 23.3 0 15 0z"
      fill="#EA4335"
      stroke="white"
      strokeWidth="2"
    />
    <circle cx="15" cy="15" r="7" fill="white" />
    <circle cx="15" cy="15" r="4" fill="#EA4335" />
  </svg>
);

export const LegendaQualificacoes: React.FC<LegendaQualificacoesProps> = ({
  className = '',
  mobile = false,
  places = [],
}) => {
  const tipos = useMemo(() => getTiposUnicos(places), [places]);

  if (mobile) {
    return (
      <div
        className={`bg-white/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-200 p-1.5 w-[155px] ${className}`}
      >
        <h3 className="text-[9px] font-bold text-gray-700 mb-1 uppercase tracking-wide">
          Legenda
        </h3>

        {/* Usuário */}
        <div className="flex items-center gap-1 pb-0.5 border-b border-gray-100 mb-0.5">
          <div className="flex items-center justify-center flex-shrink-0 w-3 h-3">
            <UserPin size={10} />
          </div>
          <span className="text-[8px] text-gray-600 font-medium">Você</span>
        </div>

        {/* Lista rolável */}
        <div
          className="overflow-y-auto space-y-0.5"
          style={{ maxHeight: '180px' }}
        >
          {tipos.map(({ tipo, sigla, cor }) => (
            <div key={tipo} className="flex items-center gap-1">
              <div
                className="flex-shrink-0 w-4 h-4 rounded-full border border-white shadow-sm flex items-center justify-center"
                style={{ backgroundColor: cor }}
                title={tipo}
              >
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: sigla.length <= 2 ? '6px' : '5px',
                    fontWeight: 'bold',
                    lineHeight: 1,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {sigla.length > 3 ? sigla.slice(0, 3) : sigla}
                </span>
              </div>
              <span className="text-[7px] text-gray-600 leading-tight truncate max-w-[110px]">
                {tipo}
              </span>
            </div>
          ))}

          {places.length === 0 && (
            <p className="text-[7px] text-gray-400 italic">Carregando...</p>
          )}
        </div>

        {tipos.length > 5 && (
          <p className="text-[6px] text-gray-400 mt-0.5 text-center">↕ role para ver mais</p>
        )}
      </div>
    );
  }

  // Desktop — altura máxima com scroll interno
  return (
    <div
      className={`bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-[230px] flex flex-col ${className}`}
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex-shrink-0">
        Tipos de Estabelecimento
      </h3>

      {/* Pin do usuário — fixo, fora do scroll */}
      <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100 mb-1 flex-shrink-0">
        <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
          <UserPin size={18} />
        </div>
        <span className="text-xs text-gray-600 font-medium">Sua localização</span>
      </div>

      {/* Lista rolável */}
      <div className="overflow-y-auto flex-1 space-y-1 pr-0.5">
        {tipos.map(({ tipo, sigla, cor }) => (
          <div key={tipo} className="flex items-center gap-2">
            <div
              className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
              style={{ backgroundColor: cor }}
              title={tipo}
            >
              <span
                style={{
                  color: '#FFFFFF',
                  fontSize:
                    sigla.length <= 2 ? '8px' : sigla.length === 3 ? '7px' : '6px',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  letterSpacing: '-0.5px',
                }}
              >
                {sigla.length > 4 ? sigla.slice(0, 4) : sigla}
              </span>
            </div>
            <span className="text-xs text-gray-600 leading-tight truncate" title={tipo}>
              {tipo}
            </span>
          </div>
        ))}

        {places.length === 0 && (
          <p className="text-xs text-gray-400 italic">Carregando estabelecimentos...</p>
        )}
      </div>

      {/* Rodapé fixo */}
      {places.length > 0 && (
        <p className="text-[10px] text-gray-400 pt-1.5 border-t border-gray-100 mt-1 flex-shrink-0">
          {places.length.toLocaleString('pt-BR')} estabelecimento{places.length !== 1 ? 's' : ''} no mapa
        </p>
      )}
    </div>
  );
};
