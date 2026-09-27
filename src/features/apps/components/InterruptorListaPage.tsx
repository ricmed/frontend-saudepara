import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/keycloak/AuthProvider';
import { SideMenu } from '@/features/home/components/SideMenu';
import { BotoRosaIcon } from '@/features/home/components/BotoRosaIcon';
import { SaireLogoWatermark } from '@/features/home/components/SaireLogo';
import { CirioLogoImg, CirioLogoWatermark } from '@/features/home/components/CirioLogo';
import {
  useAppInterruptores,
  type AppInterruptorGrupo,
  type AppInterruptorItem,
} from '@/features/apps/AppInterruptorProvider';

type InterruptorListaPageProps = {
  grupo: AppInterruptorGrupo;
  titulo: string;
  texto: string;
};

function Trilho({
  ativo,
  salvando,
  rotuloLigado,
  rotuloDesligado,
  corKnob,
}: {
  ativo: boolean;
  salvando: boolean;
  rotuloLigado: string;
  rotuloDesligado: string;
  corKnob: string;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`relative h-8 w-14 rounded-full ${ativo ? 'bg-white' : 'bg-white/35'}`}
        aria-hidden
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full shadow transition-transform ${
            ativo ? 'translate-x-7' : 'translate-x-1'
          }`}
          style={{ background: ativo ? corKnob : '#ffffff' }}
        />
      </span>
      <span className="text-base font-semibold text-white">
        {salvando ? 'Salvando…' : ativo ? rotuloLigado : rotuloDesligado}
      </span>
    </span>
  );
}

function AmostraPaleta({ tom }: { tom: 'azul' | 'rosa' }) {
  const barra = tom === 'rosa' ? '#ff4d94' : '#1d4ed8';
  const botao = tom === 'rosa' ? '#ff4d94' : '#2563eb';
  const apoio = tom === 'rosa' ? '#656B6F' : '#1e3a8a';

  return (
    <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-2xl bg-white shadow-lg">
      <div className="flex h-11 items-center gap-2 px-3" style={{ background: barra }}>
        <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
        <span className="h-2 w-16 rounded-full bg-white/70" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-2.5 w-24 rounded-full" style={{ background: apoio }} />
        <div className="h-10 rounded-xl" style={{ background: botao }} />
        <div className="flex gap-2">
          <div className="h-2 flex-1 rounded-full bg-slate-200" />
          <div className="h-2 w-10 rounded-full" style={{ background: apoio }} />
        </div>
      </div>
    </div>
  );
}

function CartaoBase({
  children,
  className,
  onClick,
  disabled,
  ativo,
  rotulo,
}: {
  children: ReactNode;
  className: string;
  onClick?: () => void;
  disabled?: boolean;
  ativo?: boolean;
  rotulo: string;
}) {
  if (!onClick) {
    return (
      <article className={className} aria-label={rotulo}>
        {children}
      </article>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label={rotulo}
      disabled={disabled}
      onClick={onClick}
      className={`${className} text-left transition-transform duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100`}
    >
      {children}
    </button>
  );
}

function useAlternar(
  item: AppInterruptorItem,
  podeAlterar: boolean,
  onToggle: (item: AppInterruptorItem) => Promise<void>,
) {
  const [salvando, setSalvando] = useState(false);

  const alternar = async () => {
    if (!podeAlterar || salvando) return;
    setSalvando(true);
    try {
      await onToggle(item);
    } catch {
      toast.error('Não foi possível salvar. O servidor ainda não recebeu essa atualização.');
    } finally {
      setSalvando(false);
    }
  };

  return { salvando, alternar };
}

function CartaoPaleta({
  item,
  podeAlterar,
  onToggle,
}: {
  item: AppInterruptorItem;
  podeAlterar: boolean;
  onToggle: (item: AppInterruptorItem) => Promise<void>;
}) {
  const { salvando, alternar } = useAlternar(item, podeAlterar, onToggle);
  const rosa = item.chave === 'saire';
  const fundo = item.ativo
    ? rosa
      ? 'bg-gradient-to-br from-[#ff4d94] to-[#656B6F]'
      : 'bg-gradient-to-br from-blue-600 to-blue-800'
    : 'bg-gradient-to-br from-slate-400 to-slate-500';

  return (
    <CartaoBase
      className={`relative flex min-h-[420px] flex-col items-center gap-6 overflow-hidden rounded-2xl p-8 shadow-xl ${fundo}`}
      onClick={podeAlterar ? () => void alternar() : undefined}
      disabled={!podeAlterar || salvando}
      ativo={item.ativo}
      rotulo={`${item.nome}, ${item.ativo ? 'ligada' : 'desligada'}`}
    >
      <AmostraPaleta tom={rosa ? 'rosa' : 'azul'} />
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white">{item.nome}</h3>
        <p className="mt-3 text-base leading-relaxed text-white/90">{item.descricao}</p>
      </div>
      <div className="mt-auto">
        <Trilho
          ativo={item.ativo}
          salvando={salvando}
          rotuloLigado="Ligada"
          rotuloDesligado="Desligada"
          corKnob={rosa ? '#ff4d94' : '#2563eb'}
        />
      </div>
    </CartaoBase>
  );
}

function CartaoBotao({
  item,
  podeAlterar,
  onToggle,
}: {
  item: AppInterruptorItem;
  podeAlterar: boolean;
  onToggle: (item: AppInterruptorItem) => Promise<void>;
}) {
  const { salvando, alternar } = useAlternar(item, podeAlterar, onToggle);
  const golfinho = item.chave === 'saire';
  const cirio = item.chave === 'cirio';
  const fundo = !item.ativo
    ? 'bg-slate-400'
    : cirio
      ? 'bg-[#12355B]'
      : golfinho
        ? 'bg-[#ff4d94] hover:bg-gradient-to-r hover:from-[#ff4d94] hover:to-[#656B6F]'
        : 'bg-blue-600';

  return (
    <CartaoBase
      className={`relative flex min-h-[420px] flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl p-8 shadow-xl ${fundo}`}
      onClick={podeAlterar ? () => void alternar() : undefined}
      disabled={!podeAlterar || salvando}
      ativo={item.ativo}
      rotulo={`${item.nome}, ${item.ativo ? 'ligado' : 'desligado'}`}
    >
      {golfinho && item.ativo && <SaireLogoWatermark />}
      {cirio && item.ativo && <CirioLogoWatermark />}
      <div className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-inner ${cirio ? 'bg-[#0c2440]' : 'bg-white/20'}`}>
        {golfinho ? (
          <BotoRosaIcon className="h-12 w-12" />
        ) : cirio ? (
          <CirioLogoImg className="h-16 w-16 object-contain mix-blend-screen" decorative />
        ) : (
          <span className="text-lg font-bold text-white">Aa</span>
        )}
      </div>
      <div className="relative z-10 text-center">
        <h3 className="text-2xl font-bold text-white">{item.nome}</h3>
        <p className="mt-3 text-base leading-relaxed text-white/90">{item.descricao}</p>
        {golfinho && (
          <p className="mt-4 text-lg font-semibold text-white">
            Faça a comunicação de caso aqui
          </p>
        )}
        {cirio && (
          <p className="mt-4 text-lg font-semibold text-white">
            Faça a comunicação de caso aqui
          </p>
        )}
      </div>
      <div className="relative z-10 mt-auto">
        <Trilho
          ativo={item.ativo}
          salvando={salvando}
          rotuloLigado="Ligado"
          rotuloDesligado="Desligado"
          corKnob={cirio ? '#12355B' : golfinho ? '#ff4d94' : '#2563eb'}
        />
      </div>
    </CartaoBase>
  );
}

function InterruptorListaPage({ grupo, titulo, texto }: InterruptorListaPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { itens, pronto, fonte, setAtivo } = useAppInterruptores();
  const [menuAberto, setMenuAberto] = useState(false);
  const podeAlterar = !!user?.roles?.includes('admin');
  const lista = itens.filter((item) => item.grupo === grupo);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            className="rounded-lg p-2 text-white transition-colors hover:bg-blue-700"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/private/apps-auxiliares')}
            className="rounded-lg p-2 text-white transition-colors hover:bg-blue-700"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-white">{titulo}</h1>
        </div>
      </header>

      <SideMenu isOpen={menuAberto} onClose={() => setMenuAberto(false)} />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">{titulo}</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">{texto}</p>
        </div>

        {!podeAlterar && (
          <p className="mx-auto mb-8 max-w-3xl text-center text-sm text-slate-600">
            Só o administrador liga ou desliga estes itens.
          </p>
        )}

        {pronto && fonte === 'padrao' && podeAlterar && (
          <p className="mx-auto mb-8 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
            A lista no servidor não respondeu. Os interruptores ficam no padrão até essa leitura funcionar.
          </p>
        )}

        <div className={`mx-auto grid grid-cols-1 gap-8 ${grupo === 'paleta' || lista.length > 1 ? 'max-w-5xl md:grid-cols-2' : 'max-w-md'}`}>
          {grupo === 'paleta' && (
            <article
              className="flex min-h-[420px] flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 shadow-xl"
              aria-label="Azul original, sempre ligada"
            >
              <AmostraPaleta tom="azul" />
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white">Azul original</h3>
                <p className="mt-3 text-base leading-relaxed text-white/90">
                  Fica no ar o tempo todo. É a paleta de todo mundo quando as outras estão desligadas.
                </p>
              </div>
              <p className="mt-auto text-base font-semibold text-white">Sempre ligada</p>
            </article>
          )}

          {lista.map((item) =>
            grupo === 'paleta' ? (
              <CartaoPaleta
                key={`${item.grupo}-${item.chave}`}
                item={item}
                podeAlterar={podeAlterar}
                onToggle={(alvo) => setAtivo(alvo.grupo, alvo.chave, !alvo.ativo)}
              />
            ) : (
              <CartaoBotao
                key={`${item.grupo}-${item.chave}`}
                item={item}
                podeAlterar={podeAlterar}
                onToggle={(alvo) => setAtivo(alvo.grupo, alvo.chave, !alvo.ativo)}
              />
            ),
          )}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-blue-200 bg-blue-50 p-6">
          <p className="text-base leading-relaxed text-blue-950">
            {grupo === 'paleta'
              ? 'Com mais de uma paleta ligada, o menu lateral volta a deixar escolher a cor. Com só a azul, esse seletor fica oculto.'
              : 'O golfinho ligado aparece para quem já tinha acesso ao Sairé. O Círio de Nazaré 2026 ligado aparece para o notificador, o município e a unidade de qualquer cidade marcada nesse evento, para a CRS que tenha alguma dessas cidades e para o estado. Desligado, o botão some para todo mundo.'}
          </p>
        </div>
      </main>
    </div>
  );
}

export function PaletaDeCoresPage() {
  return (
    <InterruptorListaPage
      grupo="paleta"
      titulo="Paleta de cores"
      texto="Cada paleta liga ou desliga para todo mundo que entra no app."
    />
  );
}

export function BotoesAuxiliaresPage() {
  return (
    <InterruptorListaPage
      grupo="botao"
      titulo="Botões auxiliares"
      texto="Cada botão liga ou desliga o atalho que aparece depois do login."
    />
  );
}
