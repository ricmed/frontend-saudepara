import { describe, expect, it } from 'vitest';
import {
  CATALOG_CACHE_VERSION,
  shouldClearCatalogsOnBuild,
} from './appBuildCachePolicy';

describe('shouldClearCatalogsOnBuild', () => {
  it('nao zera catalogo na primeira visita nem em bugfix', () => {
    expect(shouldClearCatalogsOnBuild(null)).toBe(false);
    expect(shouldClearCatalogsOnBuild(CATALOG_CACHE_VERSION)).toBe(false);
  });

  it('so zera quando a versao do catalogo muda de proposito', () => {
    expect(shouldClearCatalogsOnBuild('0')).toBe(true);
  });
});
