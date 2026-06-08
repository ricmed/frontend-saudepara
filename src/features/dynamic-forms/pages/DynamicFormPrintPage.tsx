import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';

import { FormRenderer } from '../components/FormRenderer';
import FormService, { type FormVersion } from '@/services/FormService';
import FormSubmissionService from '@/services/FormSubmissionService';
import { resolveFormRendererContext } from '../utils/sinanClinicalFields';
import { waitForFichaPrintData } from '../utils/fichaPrintChannel';
import '../styles/fichaPrint.css';

export const DynamicFormPrintPage: React.FC = () => {
  const { agravo, id } = useParams<{ agravo: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get('channel');
  const formFrom = searchParams.get('from');
  const navigate = useNavigate();

  const resolveFormReturnPath = (): string | null => {
    if (!agravo) return null;
    if (formFrom === 'visualizar' && id) {
      return `/private/formularios/${agravo}/visualizar/${id}`;
    }
    if (formFrom === 'editar' && id) {
      return `/private/formularios/${agravo}/editar/${id}`;
    }
    if (id) {
      return `/private/formularios/${agravo}/visualizar/${id}`;
    }
    return `/private/formularios/${agravo}/nova`;
  };

  const handleBack = () => {
    const returnPath = resolveFormReturnPath();
    if (returnPath) {
      navigate(returnPath);
      return;
    }
    navigate('/private/formularios');
  };

  const [formVersion, setFormVersion] = useState<FormVersion | null>(null);
  const [initialData, setInitialData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!agravo) return;
      try {
        setLoading(true);
        setError(null);

        const version = await FormService.getActiveVersion(agravo);
        if (cancelled) return;
        setFormVersion(version);

        const dataFromChannel = channelId ? await waitForFichaPrintData(channelId) : null;
        if (cancelled) return;

        if (id) {
          if (dataFromChannel != null) {
            setInitialData(dataFromChannel);
            return;
          }
          const submission = await FormSubmissionService.getSubmissionById(Number(id));
          if (cancelled) return;
          setInitialData((submission.data_json as Record<string, unknown>) ?? {});
          return;
        }

        if (dataFromChannel != null) {
          setInitialData(dataFromChannel);
          return;
        }

        setError('Não há dados para imprimir. Volte à ficha e abra a impressão novamente.');
      } catch (e) {
        if (cancelled) return;
        console.error('DynamicFormPrintPage load', e);
        setError('Não foi possível carregar a ficha para impressão.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [agravo, id, channelId]);

  if (loading) {
    return (
      <div className="ficha-print-root">
        <p className="text-gray-600 text-sm">Preparando visualização para impressão…</p>
      </div>
    );
  }

  if (error || !formVersion || !agravo) {
    return (
      <div className="ficha-print-root space-y-4">
        <p className="text-red-600 text-sm">{error ?? 'Formulário não encontrado.'}</p>
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

  const title = formVersion.form?.nome || formVersion.schema_json.title || 'Ficha de notificação';

  return (
    <>
      <div className="ficha-print-toolbar no-print">
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
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

      <div className="ficha-print-root">
        <FormRenderer
          formKey={agravo}
          schema={{
            ...formVersion.schema_json,
            title,
          }}
          initialData={initialData}
          readOnly
          showActions={false}
          printLayoutMode
          context={resolveFormRendererContext(agravo, formVersion.schema_json)}
          className="shadow-none"
        />
      </div>
    </>
  );
};
