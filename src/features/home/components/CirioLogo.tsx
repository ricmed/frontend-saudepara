/** Logo oficial do Círio de Nazaré 2026. O arquivo em public tem espaço no nome. */
export const CIRIO_LOGO_PNG = '/images/logos/logo%20cirio%20de%20nazare%202026.png';

type CirioLogoProps = {
  className?: string;
  alt?: string;
  decorative?: boolean;
};

export function CirioLogoImg({
  className = 'h-14 w-auto object-contain mix-blend-screen',
  alt = 'Círio de Nazaré 2026',
  decorative = false,
}: CirioLogoProps) {
  return (
    <img
      src={CIRIO_LOGO_PNG}
      alt={decorative ? '' : alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}

/** A logo no fundo do botão. O preto do arquivo some sobre o azul. */
export function CirioLogoWatermark({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <img
        src={CIRIO_LOGO_PNG}
        alt=""
        className="absolute left-1/2 top-1/2 h-[150%] w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-80 mix-blend-screen"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
