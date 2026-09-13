/** Assets compactos da logo Sairé (UI). Original grande fica em `logo saire.png`. */
export const SAIRE_LOGO_COMPACT_WEBP = '/images/logos/logo-saire-compact.webp';
export const SAIRE_LOGO_COMPACT_PNG = '/images/logos/logo-saire-compact.png';

type SaireLogoProps = {
  className?: string;
  alt?: string;
  decorative?: boolean;
};

export function SaireLogoImg({
  className = 'h-10 w-10 object-contain',
  alt = 'Festival do Sairé',
  decorative = false,
}: SaireLogoProps) {
  return (
    <picture>
      <source srcSet={SAIRE_LOGO_COMPACT_WEBP} type="image/webp" />
      <img
        src={SAIRE_LOGO_COMPACT_PNG}
        alt={decorative ? '' : alt}
        className={className}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

/** Marca d'água leve da logo no fundo do botão rosa. */
export function SaireLogoWatermark({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <picture>
        <source srcSet={SAIRE_LOGO_COMPACT_WEBP} type="image/webp" />
        <img
          src={SAIRE_LOGO_COMPACT_PNG}
          alt=""
          className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.18] mix-blend-soft-light"
          loading="lazy"
          decoding="async"
        />
      </picture>
    </div>
  );
}
