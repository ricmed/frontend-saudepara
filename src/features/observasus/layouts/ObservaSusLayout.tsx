import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Header from '@/features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { ObservaSusBreadcrumb } from '../components/ObservaSusBreadcrumb';

interface ObservaSusLayoutProps {
  children: ReactNode;
  breadcrumbSuffix?: { label: string; to?: string }[];
  /**
   * Viewer de painel: full-bleed, sem footer, chrome mínimo
   * para o embed ocupar quase toda a viewport.
   */
  immersive?: boolean;
}

export function ObservaSusLayout({
  children,
  breadcrumbSuffix = [],
  immersive = false,
}: ObservaSusLayoutProps) {
  const { selectedLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const breadcrumbItems = [
    { label: 'Saúde Pará', to: '/' },
    { label: 'ObservaSUS.PA', to: '/observasus' },
    ...breadcrumbSuffix,
  ];

  return (
    <div
      className={
        immersive
          ? 'flex min-h-dvh flex-col bg-slate-100'
          : 'min-h-screen bg-slate-50'
      }
    >
      <div className="shrink-0 bg-blue-700">
        <Header
          onMenuToggle={() => setIsMenuOpen(true)}
          isMobile={false}
          selectedLanguage={selectedLanguage}
        />
      </div>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {!immersive && (
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-800 md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      <main
        className={
          immersive
            ? 'flex min-h-0 flex-1 flex-col'
            : 'mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8'
        }
      >
        {!immersive && (
          <div className="mb-6">
            <ObservaSusBreadcrumb items={breadcrumbItems} />
          </div>
        )}
        {children}
      </main>

      {!immersive && <Footer selectedLanguage={selectedLanguage} />}
    </div>
  );
}
