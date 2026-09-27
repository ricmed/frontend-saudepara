import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from '@/utils/axiosRetry';
import { useAuth } from '@/keycloak/AuthProvider';

export type AppInterruptorGrupo = 'paleta' | 'botao';

export type AppInterruptorItem = {
  grupo: AppInterruptorGrupo;
  chave: string;
  nome: string;
  descricao: string;
  ativo: boolean;
};

type AppInterruptorContextValue = {
  itens: AppInterruptorItem[];
  pronto: boolean;
  fonte: 'api' | 'padrao';
  isAtivo: (grupo: AppInterruptorGrupo, chave: string) => boolean;
  setAtivo: (grupo: AppInterruptorGrupo, chave: string, ativo: boolean) => Promise<void>;
};

export const APP_INTERRUPTOR_PADRAO: AppInterruptorItem[] = [
  {
    grupo: 'paleta',
    chave: 'saire',
    nome: 'Rosa do Sairé',
    descricao: 'Paleta rosa e cinza. Desligada, todo mundo fica na azul original.',
    ativo: false,
  },
  {
    grupo: 'botao',
    chave: 'saire',
    nome: 'Golfinho do Sairé',
    descricao: 'Atalho da comunicação de caso do Sairé na home de quem já tinha acesso.',
    ativo: false,
  },
];

let paletaSaireAtiva = false;

export function isSairePaletteAtiva(): boolean {
  return paletaSaireAtiva;
}

function publicarPaleta(itens: AppInterruptorItem[]) {
  paletaSaireAtiva = itens.some(
    (item) => item.grupo === 'paleta' && item.chave === 'saire' && item.ativo,
  );
}

function isItem(value: unknown): value is AppInterruptorItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as AppInterruptorItem;
  return (
    (item.grupo === 'paleta' || item.grupo === 'botao') &&
    typeof item.chave === 'string' &&
    typeof item.nome === 'string' &&
    typeof item.descricao === 'string' &&
    typeof item.ativo === 'boolean'
  );
}

function normalizarItens(payload: unknown): AppInterruptorItem[] | null {
  const lista = payload && typeof payload === 'object' && 'itens' in payload
    ? (payload as { itens?: unknown }).itens
    : null;
  if (!Array.isArray(lista)) return null;
  const itens = lista.filter(isItem);
  return itens.length > 0 ? itens : null;
}

const valorPadrao: AppInterruptorContextValue = {
  itens: APP_INTERRUPTOR_PADRAO,
  pronto: true,
  fonte: 'padrao',
  isAtivo: () => false,
  setAtivo: async () => {
    throw new Error('Interruptores ainda não carregados');
  },
};

const AppInterruptorContext = createContext<AppInterruptorContextValue>(valorPadrao);

export function AppInterruptorProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [itens, setItens] = useState<AppInterruptorItem[]>(APP_INTERRUPTOR_PADRAO);
  const [pronto, setPronto] = useState(false);
  const [fonte, setFonte] = useState<'api' | 'padrao'>('padrao');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      publicarPaleta(APP_INTERRUPTOR_PADRAO);
      setItens(APP_INTERRUPTOR_PADRAO);
      setFonte('padrao');
      setPronto(true);
      return;
    }

    let cancelado = false;
    setPronto(false);

    axios
      .get('/api/app-interruptor', { withCredentials: true })
      .then((response) => {
        if (cancelado) return;
        const recebidos = normalizarItens(response.data) ?? APP_INTERRUPTOR_PADRAO;
        publicarPaleta(recebidos);
        setItens(recebidos);
        setFonte(recebidos === APP_INTERRUPTOR_PADRAO ? 'padrao' : 'api');
      })
      .catch(() => {
        if (cancelado) return;
        publicarPaleta(APP_INTERRUPTOR_PADRAO);
        setItens(APP_INTERRUPTOR_PADRAO);
        setFonte('padrao');
      })
      .finally(() => {
        if (!cancelado) setPronto(true);
      });

    return () => {
      cancelado = true;
    };
  }, [loading, user]);

  const isAtivo = useCallback(
    (grupo: AppInterruptorGrupo, chave: string) =>
      itens.some((item) => item.grupo === grupo && item.chave === chave && item.ativo),
    [itens],
  );

  const setAtivo = useCallback(async (grupo: AppInterruptorGrupo, chave: string, ativo: boolean) => {
    const { data } = await axios.patch(
      `/api/app-interruptor/${grupo}/${chave}`,
      { ativo },
      { withCredentials: true },
    );
    const atualizado = isItem(data) ? data : null;
    setItens((atual) => {
      const proximo = atual.map((item) => {
        if (item.grupo !== grupo || item.chave !== chave) return item;
        return atualizado ?? { ...item, ativo };
      });
      publicarPaleta(proximo);
      return proximo;
    });
    setFonte('api');
  }, []);

  const value = useMemo<AppInterruptorContextValue>(
    () => ({ itens, pronto, fonte, isAtivo, setAtivo }),
    [fonte, isAtivo, itens, pronto, setAtivo],
  );

  return (
    <AppInterruptorContext.Provider value={value}>
      {children}
    </AppInterruptorContext.Provider>
  );
}

export function useAppInterruptores() {
  return useContext(AppInterruptorContext);
}
