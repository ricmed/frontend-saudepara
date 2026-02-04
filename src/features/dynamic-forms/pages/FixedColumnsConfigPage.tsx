import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Wand2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Database,
  Settings
} from 'lucide-react';
import axios from 'axios';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';

// Criar instância do axios com mesma configuração do FormService
const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

interface AvailableField {
  key: string;
  label: string;
  type: string;
  section: string;
  fixedColumnName: string;
  isMarked: boolean;
  hasFixedColumn: boolean;
}

interface FixedColumnsData {
  formId: number;
  versionId: number;
  totalAvailable: number;
  totalMarked: number;
  fields: AvailableField[];
}

const FixedColumnsConfigPage: React.FC = () => {
  const { formId, versionId } = useParams<{ formId: string; versionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<FixedColumnsData | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFixedColumnsData();
  }, [formId, versionId]);

  const loadFixedColumnsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/forms/${formId}/versions/${versionId}/fixed-columns/available`;
      const response = await api.get(url);
      
      if (response.data.success) {
        setData(response.data.data);
        // Inicializar seleção com campos já marcados
        const marked = new Set(
          response.data.data.fields
            .filter((f: AvailableField) => f.isMarked)
            .map((f: AvailableField) => f.key)
        );
        setSelectedFields(marked);
        
        // Expandir todas as seções por padrão
        const sections = new Set(response.data.data.fields.map((f: AvailableField) => f.section));
        setExpandedSections(sections);
      }
    } catch (err: any) {
      console.error('Erro ao carregar campos fixos:', err);
      setError(err.response?.data?.message || 'Erro ao carregar campos fixos');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMark = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await api.post(
        `/forms/${formId}/versions/${versionId}/fixed-columns/auto-mark`
      );
      
      if (response.data.success) {
        setSuccess('Campos marcados automaticamente!');
        await loadFixedColumnsData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao marcar campos automaticamente');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    try {
      setSaving(true);
      setError(null);

      const currentMarked = new Set(data.fields.filter(f => f.isMarked).map(f => f.key));
      const mark = Array.from(selectedFields).filter(k => !currentMarked.has(k));
      const unmark = Array.from(currentMarked).filter(k => !selectedFields.has(k));

      const response = await api.put(
        `/forms/${formId}/versions/${versionId}/fixed-columns`,
        { mark, unmark }
      );

      if (response.data.success) {
        setSuccess('Configuração salva com sucesso!');
        await loadFixedColumnsData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleField = (fieldKey: string) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
      } else {
        newSet.add(fieldKey);
      }
      return newSet;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const groupBySection = (fields: AvailableField[]) => {
    const grouped: Record<string, AvailableField[]> = {};
    fields.forEach(field => {
      if (!grouped[field.section]) {
        grouped[field.section] = [];
      }
      grouped[field.section].push(field);
    });
    return grouped;
  };

  if (loading) {
    return (
      <AppPageLayout
        title="Configurar Colunas Fixas"
        subtitle="Modelo Híbrido SINAN"
        icon={<Settings className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  if (!data) {
    return (
      <AppPageLayout
        title="Configurar Colunas Fixas"
        subtitle="Modelo Híbrido SINAN"
        icon={<Settings className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">Dados não encontrados</span>
        </div>
      </AppPageLayout>
    );
  }

  const groupedFields = groupBySection(data.fields);
  const hasChanges = data.fields.some(
    f => f.isMarked !== selectedFields.has(f.key)
  );

  return (
    <AppPageLayout
      title="Configurar Colunas Fixas"
      subtitle="Modelo Híbrido SINAN"
      icon={<Settings className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      headerActions={
        <div className="flex gap-2">
          <button
            onClick={handleAutoMark}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            Auto-Marcar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-2 font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <span className="sr-only">Fechar</span>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-800">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <span className="sr-only">Fechar</span>
            ×
          </button>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Modelo Híbrido SINAN
            </h2>
            <p className="text-gray-600 text-sm">
              Campos marcados como fixos serão salvos em colunas separadas no banco de dados,
              permitindo consultas mais rápidas. Os demais campos serão salvos em JSON.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {selectedFields.size} de {data.totalAvailable} marcados
              </span>
            </div>
            <button
              onClick={handleAutoMark}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Wand2 className="h-4 w-4" />
              Marcar Automaticamente
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      {/* Fields by Section */}
      <div className="space-y-4 mb-6">
        {Object.entries(groupedFields).map(([section, fields]) => {
          const isExpanded = expandedSections.has(section);
          const sectionMarkedCount = fields.filter(f => selectedFields.has(f.key)).length;
          
          return (
            <div key={section} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-800">{section}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    {sectionMarkedCount}/{fields.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 divide-y divide-gray-100">
                  {fields.map(field => (
                    <div
                      key={field.key}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="flex items-center h-6 mt-0.5">
                          <input
                            type="checkbox"
                            checked={selectedFields.has(field.key)}
                            onChange={() => handleToggleField(field.key)}
                            disabled={!field.hasFixedColumn}
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Field Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{field.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5 font-mono">{field.key}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {field.type}
                              </span>
                              {field.hasFixedColumn ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                  <Database className="h-3 w-3 mr-1" />
                                  {field.fixedColumnName}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                  Sem coluna fixa
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-800">
            <strong>Dica:</strong> Use "Marcar Automaticamente" para marcar todos os campos
            que possuem colunas fixas disponíveis no banco de dados (61 campos SINAN).
          </p>
        </div>
      </div>

      {/* Debug Info - Apenas quando não há campos */}
      {data.totalAvailable === 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                ⚠️ Nenhum campo com coluna fixa disponível
              </p>
              <p className="text-sm text-yellow-800 mb-3">
                O modelo híbrido SINAN permite marcar campos para serem salvos em colunas fixas do banco de dados, 
                mas este formulário não possui campos que correspondem aos 61 campos SINAN pré-definidos.
              </p>
              
              <div className="bg-yellow-100 rounded-md p-3 mb-3">
                <p className="text-sm font-medium text-yellow-900 mb-2">
                  📝 Como usar colunas fixas:
                </p>
                <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1 ml-2">
                  <li>Edite o formulário no Form Builder</li>
                  <li>Use chaves (keys) específicas dos campos SINAN ao criar os campos</li>
                  <li>Volte aqui e marque os campos desejados como fixos</li>
                </ol>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-yellow-900 hover:text-yellow-800">
                  📋 Ver exemplos de chaves válidas (61 campos SINAN)
                </summary>
                <div className="mt-2 bg-white rounded-md p-3 space-y-2 text-xs">
                  <div>
                    <strong className="text-yellow-900">Notificação:</strong>
                    <p className="text-gray-600 ml-2">notificacao.dt_notificacao, notificacao.municipio_notificacao_ibge, notificacao.estabelecimento_cnes</p>
                  </div>
                  <div>
                    <strong className="text-yellow-900">Paciente - Identificação:</strong>
                    <p className="text-gray-600 ml-2">paciente.nome, paciente.cpf, paciente.cns, paciente.data_nascimento, paciente.nome_mae</p>
                  </div>
                  <div>
                    <strong className="text-yellow-900">Paciente - Sociodemográfico:</strong>
                    <p className="text-gray-600 ml-2">paciente.sexo, paciente.raca_cor, paciente.escolaridade, paciente.ocupacao_cbo, paciente.gestante</p>
                  </div>
                  <div>
                    <strong className="text-yellow-900">Endereço:</strong>
                    <p className="text-gray-600 ml-2">residencia.uf, residencia.municipio_ibge, residencia.cep, residencia.logradouro, residencia.bairro</p>
                  </div>
                  <div>
                    <strong className="text-yellow-900">Clínica:</strong>
                    <p className="text-gray-600 ml-2">clinica.data_inicio_sintomas, clinica.relacionado_trabalho, agravo_cid</p>
                  </div>
                  <div>
                    <strong className="text-yellow-900">Hospitalização:</strong>
                    <p className="text-gray-600 ml-2">hospitalizacao.ocorreu, hospitalizacao.data_internacao, hospitalizacao.cnes</p>
                  </div>
                  <div>
                    <strong className="text-yellow-900">Desfecho:</strong>
                    <p className="text-gray-600 ml-2">desfecho.classificacao_final, desfecho.evolucao_caso, desfecho.data_evolucao</p>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </AppPageLayout>
  );
};

export default FixedColumnsConfigPage;
