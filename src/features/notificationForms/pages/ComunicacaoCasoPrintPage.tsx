import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';

import ComunicacaoCasoPrintFicha from '@/features/notificationForms/components/ComunicacaoCasoPrintFicha';
import {
  waitForComunicacaoCasoPrintData,
  type ComunicacaoCasoPrintPayload,
} from '@/features/notificationForms/utils/comunicacaoCasoPrintChannel';
import '@/features/dynamic-forms/styles/fichaPrint.css';

export const ComunicacaoCasoPrintPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get('channel');
  const formFrom = searchParams.get('from');
  const navigate = useNavigate();

  const [payload, setPayload] = useState<ComunicacaoCasoPrintPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveReturnPath = (fromPayload?: string): string => {
    if (fromPayload) return fromPayload;
    if (formFrom === 'editar' && id) {
      return `/private/comunicacao-de-caso/editar/${id}`;
    }
    return '/private/comunicacao-de-caso/nova';
  };

  const handleBack = () => {
    navigate(payload?.returnPath || resolveReturnPath());
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!channelId) {
          setError('Não há dados para imprimir. Volte à ficha e abra a impressão novamente.');
          return;
        }
        const data = await waitForComunicacaoCasoPrintData(channelId);
        if (cancelled) return;
        if (!data) {
          setError('Não foi possível receber a ficha para impressão. Volte e abra novamente.');
          return;
        }
        setPayload(data);
      } catch (err) {
        if (cancelled) return;
        console.error('ComunicacaoCasoPrintPage load', err);
        setError('Não foi possível carregar a ficha para impressão.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  if (loading) {
    return (
      <div className="ficha-print-root">
        <p className="text-sm text-gray-600">Preparando visualização para impressão…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="ficha-print-root space-y-4">
        <p className="text-sm text-red-600">{error ?? 'Ficha não encontrada.'}</p>
        <button
          type="button"
          className="no-print inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="ficha-print-toolbar no-print">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Ficha de Comunicação de Caso
          </p>
          <p className="text-xs text-slate-500">
            Visualização para impressão — use Ctrl+P ou &quot;Salvar como PDF&quot; no diálogo do navegador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </div>
      </div>

      <ComunicacaoCasoPrintFicha
        data={payload.data}
        modoLocalidadeEvento={payload.modoLocalidadeEvento}
        isSaire={payload.isSaire}
        eventoNome={payload.eventoNome}
      />
    </>
  );
};

export default ComunicacaoCasoPrintPage;
