import { useEffect, useState } from 'react';
import {
  applyPwaUpdate,
  dismissPwaUpdatePrompt,
  subscribePwaUpdate,
} from '@/pwa/pwaUpdate';

export const PwaUpdateBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribePwaUpdate(setVisible), []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 rounded-lg bg-blue-700 px-4 py-3 text-white shadow-lg"
      data-testid="pwa-update-banner"
      role="status"
    >
      <p className="text-sm">
        Há uma atualização do app. Salve o que estiver preenchendo e clique em
        Atualizar.
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
          data-testid="pwa-update-later"
          onClick={dismissPwaUpdatePrompt}
        >
          Agora não
        </button>
        <button
          type="button"
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
          data-testid="pwa-update-now"
          onClick={() => {
            void applyPwaUpdate();
          }}
        >
          Atualizar
        </button>
      </div>
    </div>
  );
};
