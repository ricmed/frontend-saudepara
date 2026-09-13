import React, { useEffect, useRef, useState } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { BotoRosaIcon } from '@/features/home/components/BotoRosaIcon';
import { SaireLogoWatermark } from '@/features/home/components/SaireLogo';

type HomeFabSpeedDialProps = {
  showSaire: boolean;
  showDae: boolean;
  onSaireClick: () => void;
  onDaeClick: () => void;
  saireLabel: string;
  daeLabel: string;
};

/**
 * FAB central da home mobile: ao tocar, as opções sobem acima do botão
 * (speed dial), sem navegar para outra tela.
 */
export const HomeFabSpeedDial: React.FC<HomeFabSpeedDialProps> = ({
  showSaire,
  showDae,
  onSaireClick,
  onDaeClick,
  saireLabel,
  daeLabel,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  if (!showSaire && !showDae) {
    return <div className="w-12" />;
  }

  if (showSaire && !showDae) {
    return (
      <div className="relative w-12 flex justify-center">
        <button
          type="button"
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-[#ff4d94] to-[#e11d70] shadow-lg flex items-center justify-center ring-4 ring-white overflow-hidden"
          onClick={onSaireClick}
          title={saireLabel}
          aria-label={saireLabel}
        >
          <SaireLogoWatermark />
          <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <BotoRosaIcon className="h-7 w-7" />
          </span>
        </button>
      </div>
    );
  }

  if (!showSaire && showDae) {
    return (
      <div className="relative w-12 flex justify-center">
        <button
          type="button"
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-blue-600 shadow-lg flex items-center justify-center ring-4 ring-white"
          onClick={onDaeClick}
          title={daeLabel}
          aria-label={daeLabel}
        >
          <FileText className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative w-12 flex justify-center">
      {open && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSaireClick();
            }}
            className="relative overflow-hidden flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff4d94] to-[#e11d70] pl-2 pr-4 py-2 shadow-xl text-white transition-all duration-200 ease-out"
            aria-label={saireLabel}
          >
            <SaireLogoWatermark />
            <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <BotoRosaIcon className="h-7 w-7" />
            </span>
            <span className="relative z-10 max-w-[9.5rem] text-left text-xs font-semibold leading-tight">
              {saireLabel}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDaeClick();
            }}
            className="flex items-center gap-2 rounded-full bg-blue-600 pl-2 pr-4 py-2 shadow-xl text-white transition-all duration-200 ease-out"
            aria-label={daeLabel}
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <FileText className="h-5 w-5 text-white" />
              <Plus className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-green-500 p-0.5 text-white" />
            </span>
            <span className="max-w-[9.5rem] text-left text-xs font-semibold leading-tight">
              {daeLabel}
            </span>
          </button>
        </div>
      )}

      <button
        type="button"
        className={`absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full shadow-lg flex items-center justify-center ring-4 ring-white transition-transform overflow-hidden ${
          open
            ? 'bg-gray-800 rotate-45'
            : 'bg-gradient-to-br from-[#ff4d94] to-[#e11d70]'
        }`}
        onClick={() => setOpen((value) => !value)}
        title={open ? 'Fechar' : 'Nova comunicação'}
        aria-expanded={open}
        aria-label={open ? 'Fechar opções' : 'Abrir opções de comunicação'}
      >
        {!open && <SaireLogoWatermark />}
        {open ? (
          <X className="relative z-10 w-6 h-6 text-white" />
        ) : (
          <Plus className="relative z-10 w-7 h-7 text-white" />
        )}
      </button>
    </div>
  );
};

export default HomeFabSpeedDial;
