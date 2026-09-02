/** Admin master — visibilidade, PUBLIC, upload de arquivos. */
export function canGovernObservaSusResources(roles?: string[]): boolean {
  if (!roles?.length) return false;
  return roles.some((role) => role === 'admin' || role === 'admin.estado');
}

/** Cadastro de painéis (sem governança). */
export function canEditObservaSusResources(roles?: string[]): boolean {
  if (!roles?.length) return false;
  return (
    canGovernObservaSusResources(roles) ||
    roles.includes('observasus.editor')
  );
}

/** Criar usuários e atribuir roles ObservaSUS. */
export function canManageObservaSusUsers(roles?: string[]): boolean {
  if (!roles?.length) return false;
  return (
    roles.some((role) => role === 'admin' || role.startsWith('admin.')) ||
    roles.includes('observasus.admin')
  );
}

export function isObservaSusOnlyAdmin(roles?: string[]): boolean {
  if (!roles?.length) return false;
  const hasObservasusAdmin = roles.includes('observasus.admin');
  const hasPlatformAdmin = roles.some((role) => role === 'admin' || role.startsWith('admin.'));
  return hasObservasusAdmin && !hasPlatformAdmin;
}

/** @deprecated use canEditObservaSusResources */
export function canAccessObservaSusResourceAdmin(roles?: string[]): boolean {
  return canEditObservaSusResources(roles);
}
