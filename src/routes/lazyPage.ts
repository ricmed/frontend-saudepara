import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Lazy com default export. */
export function lazyPage<P = object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
): LazyExoticComponent<ComponentType<P>> {
  return lazy(loader);
}

/**
 * Lazy com named export — crítico: sem isso a rota fica em branco.
 * Uso: lazyNamed(() => import('./X'), 'PublicDynamicFormPage')
 */
export function lazyNamed<TModule extends Record<string, ComponentType<any>>>(
  loader: () => Promise<TModule>,
  exportName: keyof TModule & string,
): LazyExoticComponent<ComponentType<any>> {
  return lazy(async () => {
    const mod = await loader();
    const Comp = mod[exportName];
    if (!Comp) {
      throw new Error(
        `[lazyNamed] Export "${exportName}" não encontrado no módulo`,
      );
    }
    return { default: Comp };
  });
}
