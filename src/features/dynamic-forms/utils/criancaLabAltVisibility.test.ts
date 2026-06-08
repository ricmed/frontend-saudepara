import { describe, expect, it } from 'vitest';
import { shouldShowCriancaLabAlt } from './criancaLabAltVisibility';

describe('shouldShowCriancaLabAlt', () => {
  it('exibe ALT quando HBsAg é reagente', () => {
    expect(shouldShowCriancaLabAlt('1')).toBe(true);
  });

  it('oculta ALT quando HBsAg não é reagente', () => {
    expect(shouldShowCriancaLabAlt('2')).toBe(false);
    expect(shouldShowCriancaLabAlt('4')).toBe(false);
    expect(shouldShowCriancaLabAlt('')).toBe(false);
  });
});
