import { describe, expect, it } from 'vitest';
import {
  canAccessSaireCaseCtaMunicipio,
  canAccessSaireCaseCtaRoles,
  canChooseUiPaletteRoles,
  isForcedSairePaletteMunicipio,
} from './palette';

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
