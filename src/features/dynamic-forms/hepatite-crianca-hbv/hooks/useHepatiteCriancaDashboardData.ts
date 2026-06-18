import { useCallback, useState } from 'react';
import FormService from '@/services/FormService';
import FormResponsesService from '@/services/FormResponsesService';
import { HEPATITE_CRIANCA_HBV_FORM_KEY } from '../constants';
import { normalizeHepatiteSubmission } from '../utils/normalizeSubmission';
import { loadMunicipioLabelMaps, type MunicipioLabelMaps } from '../utils/municipioIbgeLabels';
import { loadReferenceLabelMaps } from '../utils/referenceLabelMaps';
import type { HepatiteCriancaSubmission, ReferenceLabelMaps } from '../types';

export function useHepatiteCriancaDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<HepatiteCriancaSubmission[]>([]);
  const [municipioMaps, setMunicipioMaps] = useState<MunicipioLabelMaps>({ byIbge: {}, byId: {} });
  const [referenceMaps, setReferenceMaps] = useState<ReferenceLabelMaps>({ raca: {}, escolaridade: {} });
  const [formNome, setFormNome] = useState('Criança Exposta ao HBV/HCV');
  const [lastUpdate, setLastUpdate] = useState('');

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [form, maps, refs] = await Promise.all([
        FormService.getFormByKey(HEPATITE_CRIANCA_HBV_FORM_KEY),
        loadMunicipioLabelMaps(),
        loadReferenceLabelMaps(),
      ]);
      setMunicipioMaps(maps);
      setReferenceMaps(refs);
      if (form?.nome) setFormNome(form.nome);

      if (!form?.id) {
        setSubmissions([]);
      } else {
        const rows = await FormResponsesService.listAllResponses(form.id, { status: 'submitted' });
        setSubmissions(
          rows.map((row) => normalizeHepatiteSubmission(row.id, row.data_json ?? {})),
        );
      }
      setLastUpdate(new Date().toLocaleString('pt-BR'));
    } catch {
      setError('Erro ao carregar dados do dashboard');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    submissions,
    municipioMaps,
    referenceMaps,
    formNome,
    lastUpdate,
    loadAllData,
    setError,
  };
}
