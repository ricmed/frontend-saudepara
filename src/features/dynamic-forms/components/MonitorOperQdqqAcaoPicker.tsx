import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormSubmissionService, { type FormSubmission } from '@/services/FormSubmissionService';
import {
  listQdqqProgramacoesAbertas,
  type QdqqCrsFiltro,
} from '../utils/monitorOperQdqqEscolha';

type Props = {
  formVersionId?: number;
  formKey?: string;
  crsFiltro?: QdqqCrsFiltro | null;
  competencia?: string | null;
  chooseError?: string | null;
};

export const MonitorOperQdqqAcaoPicker: React.FC<Props> = ({
  formVersionId,
  formKey,
  crsFiltro,
  competencia,
  chooseError,
}) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const options = listQdqqProgramacoesAbertas(rows, crsFiltro, competencia);
  const competenciaInformada = /^\d{4}-\d{2}$/.test(String(competencia ?? '').trim());

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      if (!formVersionId) {
        setLoadError('Não foi possível listar as programações do QDQQ.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const loaded = await FormSubmissionService.getSubmissionsAllPagesWithFormPayload(formVersionId);
        if (cancel) return;
        setRows(loaded);
      } catch {
        if (!cancel) setLoadError('Não foi possível carregar as ações já cadastradas no QDQQ.');
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    void run();
    return () => {
      cancel = true;
    };
  }, [formVersionId]);

  return (
    <div className="mb-4 md:col-span-2">
      <label htmlFor="monitor-oper-qdqq-acao" className="block text-sm font-medium text-gray-700 mb-1">
        Ação já cadastrada no QDQQ
        <span className="text-red-500 ml-1">*</span>
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Escolha a programação. Em seguida você só marca se ela foi executada.
      </p>
      {loading ? <p className="text-sm text-gray-500">Carregando programações…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
      {!loading && !loadError && options.length === 0 ? (
        <p className="text-sm text-amber-900">
          {competenciaInformada
            ? 'Nenhuma programação QDQQ nesta competência.'
            : crsFiltro && !crsFiltro.todos && crsFiltro.ids.length > 0
              ? 'Nenhuma programação QDQQ em aberto para esta regional.'
              : 'Nenhuma programação QDQQ em aberto.'}
        </p>
      ) : null}
      {!loading && options.length > 0 ? (
        <select
          id="monitor-oper-qdqq-acao"
          data-testid="monitor-oper-qdqq-acao"
          className={`w-full px-3 py-2 border rounded-md bg-white ${
            chooseError ? 'border-red-500' : 'border-gray-300'
          }`}
          defaultValue=""
          onChange={(event) => {
            const picked = event.target.value;
            if (!picked || !formKey) return;
            navigate(`/private/formularios/${formKey}/editar/${picked}?relato=1`);
          }}
        >
          <option value="">Selecione a ação programada</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {chooseError ? <p className="mt-1 text-sm text-red-600">{chooseError}</p> : null}
    </div>
  );
};
