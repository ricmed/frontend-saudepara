import { useNavigate } from 'react-router-dom';
import { BarChart3, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslations';
import { Language } from '@/i18n/types';

interface ObservaSusHighlightBannerProps {
  selectedLanguage?: Language;
}

export function ObservaSusHighlightBanner({ selectedLanguage }: ObservaSusHighlightBannerProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(selectedLanguage || 'pt-BR');

  return (
    <section className="max-w-6xl mx-auto px-6 -mt-2 mb-4">
      <button
        type="button"
        onClick={() => navigate('/observasus')}
        className="group w-full text-left overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 shadow-xl shadow-blue-900/15 transition hover:shadow-2xl hover:shadow-blue-900/25 hover:-translate-y-0.5"
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6">
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-right"
            style={{ backgroundImage: "url('/images/Observasus/Fundo.jpeg')" }}
            aria-hidden
          />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                ObservaSUS.PA
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-white">
                {t('observasus.highlight.title')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-blue-100 leading-relaxed">
                {t('observasus.highlight.description')}
              </p>
            </div>
          </div>
          <div className="relative shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-900 transition group-hover:bg-blue-50">
            {t('observasus.highlight.cta')}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </button>
    </section>
  );
}
