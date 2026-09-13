import { useMemo } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import useUserPermissions from '@/hooks/useUserPermissions';
import { isAdminMasterRoles } from '@/theme/palette';
import { useSaireEligibility } from '@/theme/useSaireEligibility';

export type SaireHomeCtaState = {
  loading: boolean;
  /** Unidade notificadora do Sairé e/ou admin master com evento ativo. */
  showSaireCaseButton: boolean;
  /** Role de Comunicação DAE (ou admin equivalente). */
  canAccessComunicacaoDae: boolean;
  /** Evento Sairé ativo encontrado (se houver). */
  saireEventId: number | null;
};

/**
 * CTA da home para unidades notificadoras do Festival do Sairé
 * e para admin master (role `admin`).
 */
export function useSaireHomeCta(): SaireHomeCtaState {
  const { user } = useAuth();
  const permissions = useUserPermissions();

  const isAdminMaster = useMemo(() => isAdminMasterRoles(user?.roles), [user?.roles]);

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
    eligibility.hasActiveSaireEvent && (isAdminMaster || eligibility.isSaireNotificadora);

  return {
    loading: eligibility.loading,
    showSaireCaseButton,
    canAccessComunicacaoDae,
    saireEventId: eligibility.saireEventId,
  };
}
