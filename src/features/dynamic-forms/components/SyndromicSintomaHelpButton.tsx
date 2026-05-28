import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

const OBSERVACAO_PADRAO = 'Manter o registro final no termo oficial da ficha.';

export interface SyndromicSintomaHelpButtonProps {
  termoOficial: string;
  aliases: string[];
  observacao?: string;
}

export const SyndromicSintomaHelpButton: React.FC<SyndromicSintomaHelpButtonProps> = ({
  termoOficial,
  aliases,
  observacao = OBSERVACAO_PADRAO,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const lista = aliases.filter(Boolean);

  if (lista.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowHelp(true);
        }}
        className="flex items-center justify-center w-7 h-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm hover:shadow-md"
        title={`Ver sinônimos de busca: ${termoOficial}`}
        aria-label={`Sinônimos de ${termoOficial}`}
      >
        <Info className="w-5 h-5" />
      </button>

      {showHelp ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowHelp(false)}
          role="presentation"
        >
          <div className="absolute inset-0 bg-black bg-opacity-25" />
          <div
            className="relative z-50 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="sintoma-help-title"
          >
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 rounded-t-lg">
              <div className="flex justify-between items-center gap-2">
                <h3 id="sintoma-help-title" className="font-medium text-blue-900 text-sm">
                  {termoOficial}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="text-blue-600 hover:text-blue-800 transition-colors shrink-0"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{observacao}</p>
              <p className="text-xs font-medium text-gray-900 mb-2">Também conhecido como:</p>
              <div className="flex flex-wrap gap-1">
                {lista.map((alias) => (
                  <span
                    key={alias}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SyndromicSintomaHelpButton;
