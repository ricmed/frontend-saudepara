import { Link } from 'react-router-dom';
import { Activity, BarChart3, BookOpen, Database } from 'lucide-react';
import { OBSERVASUS_IMAGES } from '../constants/observasusContent';

export function ObservaSusHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-blue-100/80 shadow-xl shadow-blue-900/10">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${OBSERVASUS_IMAGES.heroBackground}')` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/88 to-white/55" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/5 via-transparent to-transparent" aria-hidden />

      <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:py-16">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <img
                src={OBSERVASUS_IMAGES.sespaLogo}
                alt="Secretaria de Estado de Saúde Pública do Pará"
                className="h-10 sm:h-12 w-auto"
              />
              <span className="hidden sm:block h-8 w-px bg-slate-300" aria-hidden />
              <img
                src={OBSERVASUS_IMAGES.saudeParaLogo}
                alt="Saúde Pará"
                className="h-9 sm:h-10 w-auto"
              />
            </div>

            <p className="inline-flex items-center gap-2 rounded-full bg-blue-700/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-800 mb-4">
              <Activity className="h-3.5 w-3.5" />
              Vigilância em Saúde · Pará
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              OBSERVASUS<span className="text-blue-700">.PA</span>
            </h1>
            <p className="mt-3 text-lg sm:text-xl font-semibold text-slate-700">
              Observatório da Saúde do Estado do Pará
            </p>
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
              Dados, indicadores e informações estratégicas para apoiar a vigilância em saúde
              e a tomada de decisão orientada por evidências no território paraense.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link
                to="/observasus/paineis"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
              >
                <BarChart3 className="h-4 w-4" />
                Explorar indicadores
              </Link>
              <Link
                to="/observasus/dados"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-700/20 bg-white/80 px-6 py-3.5 text-sm font-semibold text-blue-800 transition hover:border-blue-700/40 hover:bg-white"
              >
                <Database className="h-4 w-4" />
                Acessar DataStorage
              </Link>
              <Link
                to="/observasus/paineis/manual-paineis"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300/80 bg-white/70 px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-white"
              >
                <BookOpen className="h-4 w-4" />
                Manual dos painéis
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 rounded-full bg-blue-400/10 blur-2xl" aria-hidden />
              <div className="relative rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 p-8 shadow-2xl shadow-blue-900/30">
                <img
                  src={OBSERVASUS_IMAGES.mapOutline}
                  alt="Mapa estilizado do Estado do Pará"
                  className="w-full h-auto opacity-95 drop-shadow-lg"
                />
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-white/10 px-2 py-3">
                    <p className="text-2xl font-bold text-white">6</p>
                    <p className="text-[10px] uppercase tracking-wide text-blue-100">Painéis</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-2 py-3">
                    <p className="text-2xl font-bold text-white">5</p>
                    <p className="text-[10px] uppercase tracking-wide text-blue-100">Sistemas</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-2 py-3">
                    <p className="text-2xl font-bold text-white">24/7</p>
                    <p className="text-[10px] uppercase tracking-wide text-blue-100">Monitoramento</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
