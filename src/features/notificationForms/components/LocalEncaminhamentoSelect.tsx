// src/features/notificationForms/components/LocalEncaminhamentoSelect.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LocalEncaminhamentoSelectProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  hasError?: boolean;
}

interface Estabelecimento {
  idestabelecimento: number;
  nome: string;
}

// Cache simples para evitar múltiplas requisições
let estabelecimentosCache: Estabelecimento[] | null = null;

const LocalEncaminhamentoSelect: React.FC<LocalEncaminhamentoSelectProps> = ({
  value,
  onChange,
  hasError = false
}) => {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const buscarEstabelecimentos = async () => {
      try {
        setIsLoading(true);
        if (estabelecimentosCache) {
          setEstabelecimentos(estabelecimentosCache);
          setIsLoading(false);
          return;
        }
        // Buscar diretamente do endpoint específico
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
        setIsLoading(false);
      }
    };
    buscarEstabelecimentos();
  }, []);

  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">
        Local de Encaminhamento
      </label>
      <select
        name="localEncaminhamento"
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
          estabelecimentos.map(est => (
            <option key={`enc_${est.idestabelecimento}`} value={String(est.idestabelecimento)}>
              {est.nome}
            </option>
          ))
        )}
      </select>
      <p className="mt-1 text-xs text-gray-500">
        Campo opcional. Selecione SVO DVS SESPA ou INSTITUTO DE MEDICINA E ODONTOLOGIA LEGAL (IMOL), se for
        necessário encaminhamento para estes locais.
      </p>
    </div>
  );
};

export default LocalEncaminhamentoSelect;