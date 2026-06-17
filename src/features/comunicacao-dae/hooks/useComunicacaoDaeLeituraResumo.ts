import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import ComunicacaoDaeService, { ComunicacaoDaeLeituraResumo } from '@/services/ComunicacaoDaeService';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
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

  const refresh = useCallback(async () => {
    if (!canUse) {
      setResumo(RESUMO_VAZIO);
      return;
    }

    try {
      let estabelecimentoId: number | undefined;
      try {
        const userAccess = await usuarioGestaoService.getUserAccess();
        if (userAccess?.isEstabelecimento && userAccess.estabelecimentoId) {
          estabelecimentoId = userAccess.estabelecimentoId;
        }
      } catch {
        /* escopo opcional */
      }

      const data = await ComunicacaoDaeService.getResumoLeitura(estabelecimentoId);
      setResumo(data);
    } catch {
      /* falha silenciosa — contadores são auxiliares */
    }
  }, [canUse]);

  useEffect(() => {
    refresh();

    const interval = window.setInterval(refresh, 60_000);
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const onLeituraAtualizada = () => refresh();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(COMUNICACAO_DAE_LEITURA_ATUALIZADA, onLeituraAtualizada);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(COMUNICACAO_DAE_LEITURA_ATUALIZADA, onLeituraAtualizada);
    };
  }, [refresh]);

  return { resumo, refresh };
}

/** @deprecated Use useComunicacaoDaeLeituraResumo */
export function useComunicacaoDaeNaoLidas(enabled = true) {
  const { resumo, refresh } = useComunicacaoDaeLeituraResumo(enabled);
  return { naoLidas: resumo.nao_lidas, refresh };
}
