import { useMemo } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import useUserPermissions from '@/hooks/useUserPermissions';
import { canAccessSaireCaseCtaRoles } from '@/theme/palette';
import { useSaireEligibility } from '@/theme/useSaireEligibility';

export type SaireHomeCtaState = {
  loading: boolean;
  /** Unidade notificadora do Sairé, admin master ou escopo estadual com evento ativo. */
  showSaireCaseButton: boolean;
  /** Role de Comunicação DAE (ou admin equivalente). */
  canAccessComunicacaoDae: boolean;
  /** Evento Sairé ativo encontrado (se houver). */
  saireEventId: number | null;
};

/**
 * CTA da home para unidades notificadoras do Festival do Sairé,
 * admin master (`admin`) e escopo estadual (`admin.estado` — CIEVS estadual/oeste).
 */
export function useSaireHomeCta(): SaireHomeCtaState {
  const { user } = useAuth();
  const permissions = useUserPermissions();

  const canSeeSaireByRole = useMemo(
    () => canAccessSaireCaseCtaRoles(user?.roles),
    [user?.roles],
  );

  const canAccessComunicacaoDae = useMemo(
    () =>
      !!user?.roles?.some((role: string) =>
        ['comunicacao.dae', 'admin', 'administrator', 'admin.estado', 'admin.crs'].includes(role),
      ),
    [user?.roles],
  );

  const eligibility = useSaireEligibility({
    estabelecimentoId: permissions.estabelecimentoId,
    permissionsLoading: permissions.loading,
  });

  const showSaireCaseButton =
    eligibility.hasActiveSaireEvent &&
    (canSeeSaireByRole || eligibility.isSaireNotificadora);

  return {
    loading: eligibility.loading,
    showSaireCaseButton,
    canAccessComunicacaoDae,
    saireEventId: eligibility.saireEventId,
  };
}
