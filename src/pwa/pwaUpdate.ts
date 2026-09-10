type PwaUpdateListener = (needsRefresh: boolean) => void;

const listeners = new Set<PwaUpdateListener>();
let applyUpdateFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
let needsRefresh = false;

export const subscribePwaUpdate = (listener: PwaUpdateListener): (() => void) => {
  listeners.add(listener);
  listener(needsRefresh);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyPwaNeedsRefresh = (): void => {
  needsRefresh = true;
  listeners.forEach((listener) => listener(true));
};

export const dismissPwaUpdatePrompt = (): void => {
  needsRefresh = false;
  listeners.forEach((listener) => listener(false));
};

export const setPwaApplyUpdate = (
  applyUpdate: ((reloadPage?: boolean) => Promise<void>) | null,
): void => {
  applyUpdateFn = applyUpdate;
};

export const applyPwaUpdate = async (): Promise<void> => {
  if (!applyUpdateFn) {
    return;
  }
  await applyUpdateFn(true);
};
