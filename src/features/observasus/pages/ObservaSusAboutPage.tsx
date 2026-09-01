import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Target, Eye, ShieldCheck } from 'lucide-react';
import { ObservaSusLayout } from '../layouts/ObservaSusLayout';
import { ObservaSusSectionHeader } from '../components/ObservaSusSectionHeader';
import { OBSERVASUS_IMAGES } from '../constants/observasusContent';

/** Texto institucional do portal WordPress original (vigilancia.saude.pa.gov.br). */
const WORDPRESS_ABOUT_TEXT =
  'O OBSERVASUS.PA tem o propósito de MONITORAR e ANALISAR sistematicamente os indicadores em saúde, AMPLIAR as discussões com as áreas técnicas da Secretaria de Estado da Saúde do Pará (SESPA) e atores envolvidos interinstitucionais, permitindo a identificação de problemas, bem como o estabelecimento de prioridades e a formulação de propostas de intervenção. O Observatório subsidia a tomada de decisão, o planejamento das ações e serviços de saúde, a caracterização da situação de saúde da população e os rearranjos dos processos de trabalho das atividades operacionais da SESPA. Com vistas a adoção de medidas oportunas, valorizando a gestão orientada para a melhoria de resultados de forma ágil e eficiente, localizado na sede da SESPA, na Tv. Lomas Valentina, 2190 – Belém – Pará.';

const MISSION_ITEMS = [
  {
    icon: Eye,
    title: 'Monitoramento sistemático',
    text: 'Consolidar dados e indicadores para acompanhar a situação de saúde do Pará de forma contínua.',
  },
  {
    icon: Target,
    title: 'Apoio à decisão',
    text: 'Fornecer informações estratégicas às áreas técnicas da SESPA para planejamento e priorização.',
  },
  {
    icon: ShieldCheck,
    title: 'Vigilância qualificada',
    text: 'Integrar painéis, bases e documentos em ambiente seguro, alinhado às políticas de saúde pública.',
  },
];

/**
 * Bloco introdutório no estilo do WordPress: mapa do Pará à esquerda (background contain)
 * e texto institucional à direita.
 */
function ObservaSusAboutIntro() {
  return (
    <section
      aria-labelledby="observasus-about-title"
      className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm"
    >
      <div className="grid lg:grid-cols-2 lg:min-h-[480px]">
        {/* Coluna do mapa — igual ao WordPress (sek-has-bg + contain) */}
        <div
          className="min-h-[280px] sm:min-h-[340px] lg:min-h-full bg-white bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${OBSERVASUS_IMAGES.mapOutline}')` }}
          role="img"
          aria-label="Mapa estilizado do Estado do Pará"
        />

        {/* Coluna do texto — conteúdo original WordPress */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 border-t lg:border-t-0 lg:border-l border-slate-100">
          <h2
            id="observasus-about-title"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase"
          >
            ObservaSUS.PA
          </h2>
          <h3 className="mt-3 text-base sm:text-lg font-bold uppercase text-blue-800 leading-snug">
            Observatório da Saúde do Estado do Pará
          </h3>
          <p className="mt-6 text-slate-700 leading-relaxed text-[15px] sm:text-base text-justify">
            {WORDPRESS_ABOUT_TEXT}
          </p>
          <div className="mt-6 flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0 text-blue-700 mt-0.5" aria-hidden />
            <span>Tv. Lomas Valentina, 2190 – Marco, Belém – PA</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ObservaSusAboutPage() {
  return (
    <ObservaSusLayout breadcrumbSuffix={[{ label: 'Sobre' }]}>
      <Link
        to="/observasus"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao ObservaSUS
      </Link>

      <ObservaSusAboutIntro />

      <div className="mt-14">
        <ObservaSusSectionHeader
          eyebrow="Missão"
          title="Compromissos do observatório"
          description="Pilares que orientam a evolução do ObservaSUS.PA dentro do ecossistema Saúde Pará."
        />
        <div className="grid sm:grid-cols-3 gap-4">
          {MISSION_ITEMS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-sm text-slate-500 leading-relaxed">
        O ObservaSUS.PA está sendo integrado ao{' '}
        <Link to="/" className="font-medium text-blue-700 hover:text-blue-800 underline underline-offset-2">
          Saúde Pará
        </Link>
        , mantendo o conteúdo institucional do portal de Vigilância em Saúde do Pará.
      </p>
    </ObservaSusLayout>
  );
}

export default ObservaSusAboutPage;
