import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import ComunicacaoDaeService, {
  ComunicacaoDaeLeituraResumo,
  isComunicacaoDaeForbiddenError,
} from '@/services/ComunicacaoDaeService';
import { COMUNICACAO_DAE_LEITURA_ATUALIZADA } from '@/features/comunicacao-dae/comunicacaoDaeLeituraEvents';

const RESUMO_VAZIO: ComunicacaoDaeLeituraResumo = {
  todas: 0,
  nao_lidas: 0,
  lidas: 0,
};

function hasComunicacaoDaeRole(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some(
    (role) =>
      role === 'comunicacao.dae' ||
      role === 'admin' ||
      role === 'admin.estado' ||
      role === 'admin.crs',
  );
}

export function useComunicacaoDaeLeituraResumo(enabled = true) {
  const { user } = useAuth();
  const [resumo, setResumo] = useState<ComunicacaoDaeLeituraResumo>(RESUMO_VAZIO);
  const canUse = enabled && hasComunicacaoDaeRole(user?.roles);
  const lastRefreshAtRef = useRef(0);
  const MIN_REFRESH_MS = 5000;

  const refresh = useCallback(async () => {
    if (!canUse) {
      setResumo(RESUMO_VAZIO);
      return;
    }

    try {
      const data = await ComunicacaoDaeService.getResumoLeitura();
      setResumo(data);
      lastRefreshAtRef.current = Date.now();
    } catch (error) {
      setResumo(RESUMO_VAZIO);
      if (isComunicacaoDaeForbiddenError(error)) {
        console.warn('Acesso negado ao resumo de leitura das comunicações DAE.');
      }
    }
  }, [canUse]);

  const refreshIfStale = useCallback(() => {
    if (Date.now() - lastRefreshAtRef.current < MIN_REFRESH_MS) return;
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();

    const interval = window.setInterval(refresh, 60_000);
    const onFocus = () => refreshIfStale();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshIfStale();
    };
    const onLeituraAtualizada = () => refreshIfStale();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(COMUNICACAO_DAE_LEITURA_ATUALIZADA, onLeituraAtualizada);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(COMUNICACAO_DAE_LEITURA_ATUALIZADA, onLeituraAtualizada);
    };
  }, [refresh, refreshIfStale]);

  return { resumo, refresh };
}

/** @deprecated Use useComunicacaoDaeLeituraResumo */
export function useComunicacaoDaeNaoLidas(enabled = true) {
  const { resumo, refresh } = useComunicacaoDaeLeituraResumo(enabled);
  return { naoLidas: resumo.nao_lidas, refresh };
}
