import { describe, expect, it } from 'vitest';
import {
  canAccessSaireCaseCtaMunicipio,
  canAccessSaireCaseCtaRoles,
  canChooseUiPaletteRoles,
  isForcedSairePaletteMunicipio,
  resolveEffectivePalette,
  shouldShowPaletteSelector,
} from './palette';

describe('shouldShowPaletteSelector', () => {
  it('esconde o seletor quando só a azul original está ativa', () => {
    expect(shouldShowPaletteSelector({
      canChoosePalette: true,
      activeExtraPaletteCount: 0,
    })).toBe(false);
  });

  it('mostra o seletor quando há outra paleta ligada', () => {
    expect(shouldShowPaletteSelector({
      canChoosePalette: true,
      activeExtraPaletteCount: 1,
    })).toBe(true);
  });

  it('não mostra para quem não escolhe a paleta', () => {
    expect(shouldShowPaletteSelector({
      canChoosePalette: false,
      activeExtraPaletteCount: 2,
    })).toBe(false);
  });
});

describe('resolveEffectivePalette', () => {
  it('fica na azul original quando a paleta do Sairé está desligada', () => {
    expect(resolveEffectivePalette({
      sairePaletteEnabled: false,
      canChoosePalette: true,
      preferredPalette: 'saire',
      forceSairePalette: true,
      eligibilityLoading: false,
    })).toBe('default');
  });

  it('volta a rosa de quem já recebia quando a paleta está ligada', () => {
    expect(resolveEffectivePalette({
      sairePaletteEnabled: true,
      canChoosePalette: false,
      preferredPalette: 'default',
      forceSairePalette: true,
      eligibilityLoading: false,
    })).toBe('saire');
  });
});

describe('canAccessSaireCaseCtaRoles', () => {
  it('libera admin master e admin.estado (CIEVS estadual/oeste)', () => {
    expect(canAccessSaireCaseCtaRoles(['admin'])).toBe(true);
    expect(canAccessSaireCaseCtaRoles(['administrator'])).toBe(true);
    expect(canAccessSaireCaseCtaRoles(['admin.estado'])).toBe(true);
    expect(canAccessSaireCaseCtaRoles(['admin.estado', 'notificador'])).toBe(true);
  });

  it('não libera roles sem escopo estadual/master', () => {
    expect(canAccessSaireCaseCtaRoles(['admin.crs'])).toBe(false);
    expect(canAccessSaireCaseCtaRoles(['admin.municipio'])).toBe(false);
    expect(canAccessSaireCaseCtaRoles(['notificador'])).toBe(false);
    expect(canAccessSaireCaseCtaRoles([])).toBe(false);
    expect(canAccessSaireCaseCtaRoles(undefined)).toBe(false);
  });

  it('alinha com quem pode escolher a paleta', () => {
    expect(canAccessSaireCaseCtaRoles(['admin.estado'])).toBe(
      canChooseUiPaletteRoles(['admin.estado']),
    );
  });
});

describe('canAccessSaireCaseCtaMunicipio', () => {
  it('libera o nível municipal de Santarém', () => {
    expect(canAccessSaireCaseCtaMunicipio(265)).toBe(true);
    expect(canAccessSaireCaseCtaMunicipio('265')).toBe(true);
  });

  it('não libera outros municípios nem valor ausente', () => {
    expect(canAccessSaireCaseCtaMunicipio(170)).toBe(false);
    expect(canAccessSaireCaseCtaMunicipio(0)).toBe(false);
    expect(canAccessSaireCaseCtaMunicipio(undefined)).toBe(false);
    expect(canAccessSaireCaseCtaMunicipio(null)).toBe(false);
    expect(canAccessSaireCaseCtaMunicipio('Santarém')).toBe(false);
  });

  it('usa a mesma lista de municípios da paleta rosa', () => {
    expect(canAccessSaireCaseCtaMunicipio(265)).toBe(
      isForcedSairePaletteMunicipio(265),
    );
    expect(canAccessSaireCaseCtaMunicipio(170)).toBe(
      isForcedSairePaletteMunicipio(170),
    );
  });
});
