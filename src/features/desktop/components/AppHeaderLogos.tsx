const LOGOS = {
  brasao: '/images/logos/logo-brasao-governo-pa.png',
  sespa: '/images/logos/Logo Topo Sespa.png',
  nivs: '/images/logos/logo-nivs-header.png',
  saudePara: '/images/logos/Logo Topo Saude Para.png',
} as const;

interface AppHeaderLogosProps {
  compact?: boolean;
  className?: string;
}

/**
 * Faixa institucional do header azul: brasão + SESPA (branco) + NIVS + Saúde Pará.
 * Assets preparados em public/images/logos/ — sem recorte/blend no CSS.
 */
export function AppHeaderLogos({ compact = false, className = '' }: AppHeaderLogosProps) {
  const brasao = compact ? 'h-9 w-auto shrink-0 sm:h-10' : 'h-10 w-auto shrink-0 sm:h-11';
  const sespa = compact ? 'h-9 w-auto shrink-0 sm:h-10' : 'h-10 w-auto shrink-0 sm:h-11';
  const nivs = compact ? 'h-9 w-auto shrink-0 sm:h-10' : 'h-10 w-auto shrink-0 sm:h-11';
  const saude = compact
    ? 'h-8 w-auto shrink-0 object-contain sm:h-9 lg:h-10'
    : 'h-9 w-auto shrink-0 object-contain sm:h-10';

  return (
    <div className={`flex shrink-0 items-center gap-2 sm:gap-3 ${className}`.trim()}>
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <img
          src={LOGOS.brasao}
          alt="Governo do Estado do Pará"
          className={`${brasao} hidden sm:block`}
          draggable={false}
        />
        <img
          src={LOGOS.sespa}
          alt="Secretaria de Estado de Saúde Pública do Pará"
          className={sespa}
          draggable={false}
        />
      </div>

      <span className="hidden h-8 w-px shrink-0 bg-white/30 sm:block" aria-hidden />

      <img
        src={LOGOS.nivs}
        alt="Núcleo de Informação em Vigilância em Saúde — NIVS"
        className={`${nivs} hidden sm:block`}
        draggable={false}
      />

      <img
        src={LOGOS.saudePara}
        alt="Saúde Pará"
        className={saude}
        draggable={false}
      />
    </div>
  );
}

export default AppHeaderLogos;
