import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import useUserPermissions from '@/hooks/useUserPermissions';
import { TiposEventoService } from '@/services/EventoService';
import { useAppInterruptores } from '@/features/apps/AppInterruptorProvider';
import {
  isCirioEventDescription,
  podeVerBotaoCirio,
} from '@/features/notificationForms/utils/cirioEvento';
import { cidadesDoUsuarioParaEvento } from '@/features/notificationForms/utils/cidadesDoUsuarioParaEvento';
import {
  eventoVisivelParaUsuario,
  idsAbrangencia,
  escopoEventoDoUsuario,
} from '@/features/notificationForms/utils/eventoAbrangenciaUsuario';

export type CirioHomeCtaState = {
  loading: boolean;
  showCirioCaseButton: boolean;
  cirioEventId: number | null;
};

function eventoAtivo(ativo: unknown): boolean {
  return ativo === 'S' || ativo === undefined || ativo === null || ativo === true;
}

/**
 * Botão da home do Círio de Nazaré 2026 para notificador, município e unidade
 * de uma cidade da lista, para a CRS que tenha alguma dessas cidades,
 * para o estado e para o admin master.
 */
export function useCirioHomeCta(): CirioHomeCtaState {
  const { user } = useAuth();
  const permissions = useUserPermissions();
  const interruptores = useAppInterruptores();
  const [loading, setLoading] = useState(true);
  const [cirioEventId, setCirioEventId] = useState<number | null>(null);
  const [cidadeDoUsuario, setCidadeDoUsuario] = useState(false);
  const roles = user?.roles ?? [];
  const nivel = String(permissions.nivel ?? '').toLowerCase();
  const isEstado = permissions.isEstado || roles.includes('admin.estado');
  const isUnidade =
    nivel === 'unidade' ||
    nivel === 'estabelecimento' ||
    roles.includes('admin.unidade');
  const isMunicipio = permissions.isMunicipio || roles.includes('admin.municipio');
  const isCrs = permissions.isCrs || roles.includes('admin.crs');

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      if (permissions.loading) return;
      setLoading(true);
      try {
        let eventos = await TiposEventoService.getAll().catch(() => []);
        if (!Array.isArray(eventos) || eventos.length === 0) {
          eventos = await TiposEventoService.getAllAtivos().catch(() => []);
        }
        const cidades = await cidadesDoUsuarioParaEvento({
          municipioId: permissions.municipioId,
          crsId: permissions.crsId,
          isCrs: permissions.isCrs || roles.includes('admin.crs'),
        });
        const escopo = escopoEventoDoUsuario(permissions, cidades);
        const cirio = (eventos || [])
          .filter(
            (evento) =>
              eventoAtivo(evento.ativo) &&
              isCirioEventDescription(evento.descricao) &&
              eventoVisivelParaUsuario(evento, escopo),
          )
          .sort((a, b) => Number(b.idtipo_evento) - Number(a.idtipo_evento))[0];

        if (cancelado) return;
        if (!cirio) {
          setCirioEventId(null);
          setCidadeDoUsuario(false);
          return;
        }

        const ids = idsAbrangencia(cirio) ?? [];
        setCirioEventId(Number(cirio.idtipo_evento));
        setCidadeDoUsuario(cidades.some((id) => ids.includes(id)));
      } catch {
        if (!cancelado) {
          setCirioEventId(null);
          setCidadeDoUsuario(false);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [
    permissions.loading,
    permissions.municipioId,
    permissions.isAdmin,
    permissions.isEstado,
    permissions.isCrs,
    permissions.crsId,
    permissions.nivel,
    permissions.isMunicipio,
    user?.roles,
  ]);

  const showCirioCaseButton = podeVerBotaoCirio({
    interruptorLigado: interruptores.isAtivo('botao', 'cirio'),
    eventoEncontrado: cirioEventId != null,
    isNotificador: permissions.isNotificador,
    isUnidade,
    isMunicipio,
    isCrs,
    cidadeNaLista: cidadeDoUsuario,
    isEstado,
    isAdmin: permissions.isAdmin,
  });

  return useMemo(
    () => ({
      loading: loading || permissions.loading || !interruptores.pronto,
      showCirioCaseButton,
      cirioEventId,
    }),
    [cidadeDoUsuario, cirioEventId, interruptores.pronto, loading, permissions.loading, showCirioCaseButton],
  );
}
