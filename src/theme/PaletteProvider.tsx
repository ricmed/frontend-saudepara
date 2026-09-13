import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from '@/utils/axiosRetry';
import { useAuth } from '@/keycloak/AuthProvider';
import useUserPermissions from '@/hooks/useUserPermissions';
import {
  applyDocumentPalette,
  isAdminMasterRoles,
  isForcedSairePaletteUsername,
  normalizeUiPalette,
  type UiPalette,
} from '@/theme/palette';
import { useSaireEligibility } from '@/theme/useSaireEligibility';

type PaletteContextValue = {
  palette: UiPalette;
  preferredPalette: UiPalette;
  loading: boolean;
  isAdminMaster: boolean;
  canChoosePalette: boolean;
  isSaireNotificadora: boolean;
  setPalette: (palette: UiPalette) => Promise<void>;
  saving: boolean;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

function resolveEffectivePalette(params: {
  isAdminMaster: boolean;
  preferredPalette: UiPalette;
  forceSairePalette: boolean;
  eligibilityLoading: boolean;
}): UiPalette {
  if (params.isAdminMaster) {
    return params.preferredPalette;
  }
  if (params.eligibilityLoading && !params.forceSairePalette) {
    return 'default';
  }
  return params.forceSairePalette ? 'saire' : 'default';
}

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, loading: authLoading } = useAuth();
  const permissions = useUserPermissions();
  const [saving, setSaving] = useState(false);

  const isAdminMaster = useMemo(() => isAdminMasterRoles(user?.roles), [user?.roles]);
  const preferredPalette = useMemo(
    () => normalizeUiPalette(user?.uiPalette ?? user?.ui_palette),
    [user?.uiPalette, user?.ui_palette],
  );
  const forcedByUsername = useMemo(
    () => isForcedSairePaletteUsername(user?.username),
    [user?.username],
  );

  const eligibility = useSaireEligibility({
    estabelecimentoId: permissions.estabelecimentoId,
    permissionsLoading: permissions.loading || authLoading,
  });

  const forceSairePalette = eligibility.isSaireNotificadora || forcedByUsername;

  const palette = useMemo(
    () =>
      resolveEffectivePalette({
        isAdminMaster,
        preferredPalette,
        forceSairePalette,
        eligibilityLoading: eligibility.loading,
      }),
    [
      eligibility.loading,
      forceSairePalette,
      isAdminMaster,
      preferredPalette,
    ],
  );

  useEffect(() => {
    applyDocumentPalette(palette);
  }, [palette]);

  const setPalette = useCallback(
    async (next: UiPalette) => {
      if (!isAdminMaster) {
        throw new Error('Apenas admin master pode alterar a paleta');
      }
      setSaving(true);
      try {
        const { data } = await axios.put(
          '/api/auth/preferences/palette',
          { palette: next },
          { withCredentials: true },
        );
        setUser?.(data);
      } finally {
        setSaving(false);
      }
    },
    [isAdminMaster, setUser],
  );

  const value = useMemo<PaletteContextValue>(
    () => ({
      palette,
      preferredPalette,
      loading: authLoading || permissions.loading || eligibility.loading,
      isAdminMaster,
      canChoosePalette: isAdminMaster,
      isSaireNotificadora: eligibility.isSaireNotificadora,
      setPalette,
      saving,
    }),
    [
      authLoading,
      eligibility.isSaireNotificadora,
      eligibility.loading,
      isAdminMaster,
      palette,
      permissions.loading,
      preferredPalette,
      saving,
      setPalette,
    ],
  );

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    throw new Error('usePalette deve ser usado dentro de PaletteProvider');
  }
  return ctx;
}
