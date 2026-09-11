// src/features/notificationForms/components/LocalEncaminhamentoSelect.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Estabelecimento {
  idestabelecimento: number;
  nome: string;
}

interface LocalEncaminhamentoSelectProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  hasError?: boolean;
  options?: Estabelecimento[];
  helpText?: string;
  loading?: boolean;
}

const HELP_TEXT_PADRAO =
  'Campo opcional. Selecione SVO DVS SESPA ou INSTITUTO DE MEDICINA E ODONTOLOGIA LEGAL (IMOL), se for necessário encaminhamento para estes locais.';

// Cache simples para evitar múltiplas requisições
let estabelecimentosCache: Estabelecimento[] | null = null;

const LocalEncaminhamentoSelect: React.FC<LocalEncaminhamentoSelectProps> = ({
  value,
  onChange,
  hasError = false,
  options,
  helpText,
  loading = false,
}) => {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(options === undefined);

  useEffect(() => {
    if (options !== undefined) {
      setIsLoadingRemote(false);
      return;
    }

    const buscarEstabelecimentos = async () => {
      try {
        setIsLoadingRemote(true);
        if (estabelecimentosCache) {
          setEstabelecimentos(estabelecimentosCache);
          setIsLoadingRemote(false);
          return;
        }
        const response = await axios.get('/api/estabelecimentos/encaminhamento-especificos', {
          headers: { 'Accept': 'application/json' }
        });
        const estabelecimentosFinais: Estabelecimento[] = Array.isArray(response.data) ? response.data : [];
        estabelecimentosCache = estabelecimentosFinais;
        setEstabelecimentos(estabelecimentosFinais);
      } catch (error) {
        console.error('❌ Erro ao buscar estabelecimentos específicos:', error);
        estabelecimentosCache = [];
        setEstabelecimentos([]);
      } finally {
        setIsLoadingRemote(false);
      }
    };
    void buscarEstabelecimentos();
  }, [options]);

  const lista = options ?? estabelecimentos;
  const isLoading = options !== undefined ? loading : isLoadingRemote;

  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">
        Local de Encaminhamento
      </label>
      <select
        name="localEncaminhamento"
        data-testid="local-encaminhamento-obito"
        className={`w-full p-3 border rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${
          hasError ? 'border-red-500 bg-red-50' : 'border-gray-200'
        }`}
        value={value || ""}
        onChange={onChange}
        disabled={isLoading}
      >
        <option value="">-- Selecione (Opcional) --</option>
        {isLoading ? (
          <option value="" disabled>Carregando...</option>
        ) : (
          lista.map(est => (
            <option key={`enc_${est.idestabelecimento}`} value={String(est.idestabelecimento)}>
              {est.nome}
            </option>
          ))
        )}
      </select>
      <p className="mt-1 text-xs text-gray-500">
        {helpText ?? HELP_TEXT_PADRAO}
      </p>
    </div>
  );
};

export default LocalEncaminhamentoSelect;
