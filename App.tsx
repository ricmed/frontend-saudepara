import { BrowserRouter as Router } from "react-router-dom";
import { Suspense, useEffect, useMemo, useState } from 'react';
import indexedDBService from '@/services/indexedDB';
import syncService from '@/services/syncService';
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppRoutes } from "@/routes/AppRoutes";

function App() {
  const isHomologacao = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname.toLowerCase();
    const viteEnv = (import.meta as any)?.env?.VITE_ENV as string | undefined;
    const apiServer = (import.meta as any)?.env?.VITE_API_SERVER as string | undefined;

    return (
      host.includes('.hml.') ||
      host.includes('app.hml.saude.pa.gov.br') ||
      (viteEnv || '').toLowerCase().includes('homolog') ||
      (apiServer || '').toLowerCase().includes('.hml.')
    );
  }, []);

  const [showHomologacaoWarning, setShowHomologacaoWarning] = useState(false);

  // *** ADICIONAR ESTE useEffect PARA INICIALIZAR SISTEMA OFFLINE ***
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        await indexedDBService.init();
        syncService.startPeriodicSync(); // Iniciar sync periódico
        console.log('✅ Sistema offline inicializado');
      } catch (error) {
        console.error('❌ Erro ao inicializar offline:', error);
      }
    };

    initializeOffline();

    // Cleanup no unmount
    return () => {
      syncService.stopPeriodicSync();
    };
  }, []);

  useEffect(() => {
    if (!isHomologacao) return;
    try {
      const alreadyAck = window.sessionStorage.getItem('hml_warning_ack_v1') === '1';
      if (!alreadyAck) setShowHomologacaoWarning(true);
    } catch {
      setShowHomologacaoWarning(true);
    }
  }, [isHomologacao]);
  
  return (
    <LanguageProvider>
      {showHomologacaoWarning && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl animate-fadeIn">
            <div className="mb-3 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                <span className="font-semibold">ATENÇÃO!</span>
                <span className="text-sm">Ambiente de homologação</span>
              </div>
            </div>

            <h2 className="mb-3 text-left text-xl font-bold text-gray-900">
              Esta versão é apenas para fins de teste.
            </h2>

            <p className="mb-4 text-left text-gray-700">
              Dados inseridos neste ambiente serão <span className="font-semibold">descartados</span>. Para acessar o
              ambiente com dados reais, acesse{' '}
              <a className="font-semibold text-blue-700 underline" href="https://app.saude.pa.gov.br">
                app.saude.pa.gov.br
              </a>
              .
            </p>

            <p className="mb-6 text-left text-gray-700">
              Caso queira apenas fazer testes no aplicativo, você pode prosseguir.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
                onClick={() => {
                  try {
                    window.sessionStorage.setItem('hml_warning_ack_v1', '1');
                  } catch {
                    // ignore
                  }
                  setShowHomologacaoWarning(false);
                }}
              >
                Prosseguir
              </button>
              <a
                className="rounded-lg bg-blue-700 px-4 py-2 text-center font-semibold text-white hover:bg-blue-800"
                href="https://app.saude.pa.gov.br"
                target="_blank"
                rel="noreferrer"
              >
                Ir para produção
              </a>
            </div>
          </div>
        </div>
      )}
      <Router>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-600">Carregando...</div>}>
          <AppRoutes />
        </Suspense>
      </Router>
    </LanguageProvider>
  );
}

export default App;