import { describe, expect, it } from 'vitest';
import { canAccessSaireCaseCtaRoles, canChooseUiPaletteRoles } from './palette';

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
