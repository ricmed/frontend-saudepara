import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from '@/utils/axiosRetry';
import { useAuth } from '@/keycloak/AuthProvider';
import useUserPermissions from '@/hooks/useUserPermissions';
import {
  applyDocumentPalette,
  canChooseUiPaletteRoles,
  isForcedSairePaletteMunicipio,
  isForcedSairePaletteUsername,
  normalizeUiPalette,
  resolveEffectivePalette,
  type UiPalette,
} from '@/theme/palette';
import { useSaireEligibility } from '@/theme/useSaireEligibility';
import { useAppInterruptores } from '@/features/apps/AppInterruptorProvider';

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

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, loading: authLoading } = useAuth();
  const permissions = useUserPermissions();
  const interruptores = useAppInterruptores();
  const [saving, setSaving] = useState(false);

  const canChoosePalette = useMemo(
    () => canChooseUiPaletteRoles(user?.roles),
    [user?.roles],
  );
  const preferredPalette = useMemo(
    () => normalizeUiPalette(user?.uiPalette ?? user?.ui_palette),
    [user?.uiPalette, user?.ui_palette],
  );
  const forcedByUsername = useMemo(
    () => isForcedSairePaletteUsername(user?.username),
    [user?.username],
  );
  const forcedByMunicipio = useMemo(
    () => isForcedSairePaletteMunicipio(permissions.municipioId),
    [permissions.municipioId],
  );

  const eligibility = useSaireEligibility({
    estabelecimentoId: permissions.estabelecimentoId,
    permissionsLoading: permissions.loading || authLoading,
  });

  const forceSairePalette =
    eligibility.isSaireNotificadora || forcedByUsername || forcedByMunicipio;

  const palette = useMemo(
    () =>
      resolveEffectivePalette({
        sairePaletteEnabled: interruptores.isAtivo('paleta', 'saire'),
        canChoosePalette,
        preferredPalette,
        forceSairePalette,
        eligibilityLoading: eligibility.loading,
      }),
    [
      canChoosePalette,
      eligibility.loading,
      forceSairePalette,
      interruptores,
      preferredPalette,
    ],
  );

  useEffect(() => {
    applyDocumentPalette(palette);
  }, [palette]);

  const setPalette = useCallback(
    async (next: UiPalette) => {
      if (!canChoosePalette) {
        throw new Error('Sem permissão para alterar a paleta');
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
    [canChoosePalette, setUser],
  );

  const value = useMemo<PaletteContextValue>(
    () => ({
      palette,
      preferredPalette,
      loading: authLoading || permissions.loading || eligibility.loading,
      isAdminMaster: canChoosePalette,
      canChoosePalette,
      isSaireNotificadora: eligibility.isSaireNotificadora,
      setPalette,
      saving,
    }),
    [
      authLoading,
      canChoosePalette,
      eligibility.isSaireNotificadora,
      eligibility.loading,
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
