import { Link } from 'react-router-dom';
import { Activity, BarChart3, BookOpen, Database } from 'lucide-react';
import { OBSERVASUS_IMAGES } from '../constants/observasusContent';

const HERO_ACTIONS = [
  {
    to: '/observasus/paineis',
    label: 'Explorar indicadores',
    icon: BarChart3,
    variant: 'primary' as const,
  },
  {
    to: '/observasus/dados',
    label: 'Acessar DataStorage',
    icon: Database,
    variant: 'secondary' as const,
  },
  {
    to: '/observasus/paineis/manual-paineis',
    label: 'Manual dos painéis',
    icon: BookOpen,
    variant: 'secondary' as const,
  },
] as const;

function heroActionClass(variant: 'primary' | 'secondary') {
  if (variant === 'primary') {
    return 'bg-blue-700 text-white hover:bg-blue-800 border-transparent';
  }
  return 'border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50/40';
}

export function ObservaSusHero() {
  return (
    <section className="observasus-enter overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid lg:grid-cols-[1fr_minmax(260px,380px)]">
        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.07]"
            style={{ backgroundImage: `url('${OBSERVASUS_IMAGES.heroBackground}')` }}
            aria-hidden
          />

          <div className="relative">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              Vigilância em Saúde · Pará
            </p>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              OBSERVASUS<span className="text-blue-700">.PA</span>
            </h1>
            <p className="mt-1 text-base font-semibold text-slate-700 sm:text-lg">
              Observatório da Saúde do Estado do Pará
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Dados, indicadores e informações estratégicas para apoiar a vigilância em saúde e a
              tomada de decisão orientada por evidências no território paraense.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {HERO_ACTIONS.map(({ to, label, icon: Icon, variant }) => (
                <Link
                  key={to}
                  to={to}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${heroActionClass(variant)}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-stretch bg-blue-800 px-6 py-8 sm:px-8 lg:px-6">
          <figure className="flex w-full flex-col justify-center">
            <img
              src={OBSERVASUS_IMAGES.mapOutline}
              alt="Mapa do Estado do Pará"
              className="mx-auto h-auto w-full max-h-[240px] object-contain opacity-95 lg:max-h-[280px]"
              width={360}
              height={360}
              loading="eager"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
