import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import ComunicacaoDaeService from '@/services/ComunicacaoDaeService';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
import { COMUNICACAO_DAE_LEITURA_ATUALIZADA } from '@/features/comunicacao-dae/comunicacaoDaeLeituraEvents';

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

export function useComunicacaoDaeNaoLidas(enabled = true) {
  const { user } = useAuth();
  const [naoLidas, setNaoLidas] = useState(0);
  const canUse = enabled && hasComunicacaoDaeRole(user?.roles);

  const refresh = useCallback(async () => {
    if (!canUse) {
      setNaoLidas(0);
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

      const { total } = await ComunicacaoDaeService.getContagemNaoLidas(estabelecimentoId);
      setNaoLidas(total);
    } catch {
      /* falha silenciosa — badge é auxiliar */
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

  return { naoLidas, refresh };
}
