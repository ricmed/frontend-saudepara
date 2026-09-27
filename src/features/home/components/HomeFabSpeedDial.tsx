import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { BotoRosaIcon } from '@/features/home/components/BotoRosaIcon';
import { SaireLogoWatermark } from '@/features/home/components/SaireLogo';
import { CirioLogoImg, CirioLogoWatermark } from '@/features/home/components/CirioLogo';

type HomeFabSpeedDialProps = {
  showSaire: boolean;
  showCirio: boolean;
  showDae: boolean;
  onSaireClick: () => void;
  onCirioClick: () => void;
  onDaeClick: () => void;
  saireLabel: string;
  cirioLabel: string;
  daeLabel: string;
};

type FabAction = {
  key: string;
  label: string;
  onClick: () => void;
  className: string;
  icon: ReactNode;
  watermark?: ReactNode;
};

const cirioButtonClass =
  'bg-[#12355B] hover:bg-[#1a4d8c]';
const saireButtonClass =
  'bg-[#ff4d94] hover:bg-gradient-to-br hover:from-[#ff4d94] hover:to-[#656B6F]';

/**
 * FAB central da home mobile: um atalho direto, ou as opções acima do botão.
 */
export const HomeFabSpeedDial: React.FC<HomeFabSpeedDialProps> = ({
  showSaire,
  showCirio,
  showDae,
  onSaireClick,
  onCirioClick,
  onDaeClick,
  saireLabel,
  cirioLabel,
  daeLabel,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const actions: FabAction[] = [];
  if (showCirio) {
    actions.push({
      key: 'cirio',
      label: cirioLabel,
      onClick: onCirioClick,
      className: cirioButtonClass,
      icon: <CirioLogoImg className="h-8 w-8 object-contain mix-blend-screen" decorative />,
      watermark: <CirioLogoWatermark />,
    });
  }
  if (showSaire) {
    actions.push({
      key: 'saire',
      label: saireLabel,
      onClick: onSaireClick,
      className: saireButtonClass,
      icon: <BotoRosaIcon className="h-7 w-7" />,
      watermark: <SaireLogoWatermark />,
    });
  }
  if (showDae) {
    actions.push({
      key: 'dae',
      label: daeLabel,
      onClick: onDaeClick,
      className: 'bg-blue-600 hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-800',
      icon: <FileText className="h-6 w-6 text-white" />,
    });
  }

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

  if (actions.length === 0) {
    return <div className="w-12" />;
  }

  if (actions.length === 1) {
    const action = actions[0];
    return (
      <div className="relative w-12 flex justify-center">
        <button
          type="button"
          className={`absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full shadow-lg flex items-center justify-center ring-4 ring-white overflow-hidden ${action.className}`}
          onClick={action.onClick}
          title={action.label}
          aria-label={action.label}
        >
          {action.watermark}
          <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            {action.icon}
          </span>
        </button>
      </div>
    );
  }

  const principal = actions[0];

  return (
    <div ref={rootRef} className="relative w-12 flex justify-center">
      {open && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className={`relative overflow-hidden flex items-center gap-2 rounded-full pl-2 pr-4 py-2 shadow-xl text-white ${action.className}`}
              aria-label={action.label}
            >
              {action.watermark}
              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                {action.icon}
              </span>
              <span className="relative z-10 max-w-[9.5rem] text-left text-xs font-semibold leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className={`absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full shadow-lg flex items-center justify-center ring-4 ring-white transition-transform overflow-hidden ${
          open ? 'bg-gray-800 rotate-45' : principal.className
        }`}
        onClick={() => setOpen((value) => !value)}
        title={open ? 'Fechar' : 'Nova comunicação'}
        aria-expanded={open}
        aria-label={open ? 'Fechar opções' : 'Abrir opções de comunicação'}
      >
        {!open && principal.watermark}
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
