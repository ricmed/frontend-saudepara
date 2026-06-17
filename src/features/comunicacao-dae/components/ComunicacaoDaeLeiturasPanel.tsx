import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Loader, Users } from 'lucide-react';
import ComunicacaoDaeService, { ComunicacaoDaeLeitura } from '@/services/ComunicacaoDaeService';
import { formatDateTimePtBr } from '@/features/comunicacao-dae/utils/dashboardFormatters';
import { COMUNICACAO_DAE_LEITURA_ATUALIZADA } from '@/features/comunicacao-dae/comunicacaoDaeLeituraEvents';

type Props = {
  comunicacaoId: number;
  isOnline: boolean;
};

export const ComunicacaoDaeLeiturasPanel: React.FC<Props> = ({ comunicacaoId, isOnline }) => {
  const [leituras, setLeituras] = useState<ComunicacaoDaeLeitura[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeituras = useCallback(async () => {
    if (!isOnline || !comunicacaoId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await ComunicacaoDaeService.getLeituras(comunicacaoId);
      setLeituras(data);
    } catch {
      setError('Não foi possível carregar quem visualizou esta comunicação.');
    } finally {
      setLoading(false);
    }
  }, [comunicacaoId, isOnline]);

  useEffect(() => {
    loadLeituras();
  }, [loadLeituras]);

  useEffect(() => {
    const onLeituraAtualizada = () => loadLeituras();
    window.addEventListener(COMUNICACAO_DAE_LEITURA_ATUALIZADA, onLeituraAtualizada);
    return () => window.removeEventListener(COMUNICACAO_DAE_LEITURA_ATUALIZADA, onLeituraAtualizada);
  }, [loadLeituras]);

  if (!isOnline) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-medium">
          <Eye className="h-4 w-4" />
          Visualizações
        </div>
        <p className="mt-2 text-amber-800">
          O registro de quem visualizou fica disponível quando você estiver online.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-indigo-100 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-semibold text-gray-900">Quem visualizou</h2>
        {!loading && (
          <span className="ml-auto text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
            {leituras.length} {leituras.length === 1 ? 'pessoa' : 'pessoas'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Loader className="h-4 w-4 animate-spin" />
          Carregando visualizações…
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : leituras.length === 0 ? (
        <p className="text-sm text-gray-600">
          Ninguém abriu esta comunicação no sistema ainda. Ao abrir a ficha, o acesso fica registrado com data e hora.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {leituras.map((leitura) => (
            <li key={`${leitura.user_id}-${leitura.lido_em}`} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <p className="text-sm font-medium text-gray-900">{leitura.nome}</p>
                <p className="text-xs text-gray-500">@{leitura.username}</p>
              </div>
              <p className="text-xs text-indigo-700 font-medium sm:text-right">
                {formatDateTimePtBr(leitura.lido_em)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ComunicacaoDaeLeiturasPanel;
