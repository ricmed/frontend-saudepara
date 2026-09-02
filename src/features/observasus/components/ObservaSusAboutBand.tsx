import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function ObservaSusAboutBand() {
  return (
    <section
      id="about-observasus"
      aria-labelledby="observasus-about-heading"
      className="observasus-enter-delay-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-5 sm:px-7 sm:py-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Institucional</p>
          <h2
            id="observasus-about-heading"
            className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            Sobre o ObservaSUS.PA
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            Monitoramento sistemático de indicadores em saúde no Pará, com apoio às áreas técnicas da
            SESPA na identificação de prioridades e na tomada de decisão orientada por evidências.
          </p>
        </div>
        <Link
          to="/observasus/sobre"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 sm:self-center"
        >
          Conheça o ObservaSUS
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
