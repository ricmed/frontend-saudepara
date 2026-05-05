import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Wand2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Database,
  Settings,
  Info,
  Layers
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

const TECHNICAL_PREF_KEY = 'sp_fixedColumns_showTechnical_v1';

/** Rótulos amigáveis para tipos de campo (modo simples). */
const fieldTypeLabelPt = (type: string): string => {
  const map: Record<string, string> = {
    text: 'Texto',
    textarea: 'Texto longo',
    number: 'Número',
    date: 'Data',
    datetime: 'Data e hora',
    select: 'Lista de opções',
    'select-search': 'Lista com busca',
    radio: 'Opções (única)',
    cpf: 'CPF',
    cns: 'CNS',
    cep: 'CEP',
    passaporte: 'Passaporte',
    idade: 'Idade',
    checkbox: 'Sim/Não',
    'checkbox-group': 'Várias opções',
    phone: 'Telefone',
    'international-phone': 'Telefone',
    email: 'E-mail',
  };
  return map[type] || type;
};

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
  /** Modo simples: esconde chaves técnicas e nomes de coluna do banco (público-alvo: vigilância/gestão). */
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(() => {
    try {
      return sessionStorage.getItem(TECHNICAL_PREF_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!formId || !versionId || Number.isNaN(Number(formId)) || Number.isNaN(Number(versionId))) {
      setLoading(false);
      setError(
        'Não foi possível abrir esta configuração. Volte ao editor do formulário (administração SINAN), aba Campos, e use o botão “Campos Fixos (SINAN)” — assim o sistema abre o endereço certo.'
      );
      setData(null);
      return;
    }
    loadFixedColumnsData();
  }, [formId, versionId]);

  const loadFixedColumnsData = async () => {
    if (!formId || !versionId) return;
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
      const msg = err.response?.data?.message || 'Erro ao carregar campos fixos';
      const is404 = err.response?.status === 404;
      setError(
        is404
          ? `${msg} Verifique se este formulário/versão existe no banco de dados em uso (ex.: banco local vs. homologação).`
          : msg
      );
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

  const toggleTechnicalDetails = () => {
    setShowTechnicalDetails((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(TECHNICAL_PREF_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (loading) {
    return (
      <AppPageLayout
        title="Busca rápida nos dados da ficha"
        subtitle="Escolha quais respostas viram filtros e relatórios mais ágeis"
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
        title="Busca rápida nos dados da ficha"
        subtitle="Escolha quais respostas viram filtros e relatórios mais ágeis"
        icon={<Settings className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error || 'Dados não encontrados'}</span>
        </div>
        {formId ? (
          <button
            type="button"
            onClick={() => navigate(`/private/formularios-admin/editar/${formId}`)}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao editor
          </button>
        ) : null}
      </AppPageLayout>
    );
  }

  const groupedFields = groupBySection(data.fields);
  const hasChanges = data.fields.some(
    f => f.isMarked !== selectedFields.has(f.key)
  );
  const canSave = data.fields.length > 0 && !saving && hasChanges;

  return (
    <AppPageLayout
      title="Busca rápida nos dados da ficha"
      subtitle="Notificação SINAN — quem configura costuma ser vigilância ou coordenação; use “Detalhes técnicos” só se a TI pedir."
      icon={<Settings className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              navigate(`/private/formularios-admin/editar/${formId}`)
            }
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao editor
          </button>
          <button
            type="button"
            onClick={toggleTechnicalDetails}
            className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium border ${
              showTechnicalDetails
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title="Mostra ou esconde nomes internos usados pelo sistema e pela TI"
          >
            <Layers className="h-4 w-4 shrink-0" />
            {showTechnicalDetails ? 'Modo simples' : 'Detalhes técnicos (TI)'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Salvar alterações
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
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600 shrink-0" />
                O que esta tela faz?
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                Ao marcar um item abaixo, você diz que aquela informação da ficha é importante para{' '}
                <strong>filtros, painéis e relatórios</strong> saírem mais rápido. O restante das respostas
                continua guardado normalmente no sistema — só não entra nesse “atalho” de busca.
              </p>
              {!showTechnicalDetails ? (
                <p className="text-gray-500 text-xs leading-relaxed">
                  Dica: se não souber o que marcar, use o botão roxo para marcar automaticamente os itens
                  que o sistema já prevê para a ficha padrão (notificação, paciente e residência).
                </p>
              ) : (
                <p className="text-gray-600 text-xs leading-relaxed font-mono bg-gray-50 border border-gray-100 rounded px-2 py-1.5">
                  Técnico: campos marcados são persistidos também em colunas indexadas da tabela de
                  envios; demais campos permanecem principalmente em <code className="text-xs">data_json</code>.
                </p>
              )}
            </div>
            <div className="flex flex-col sm:items-end gap-3 shrink-0">
              <div className="bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedFields.size} de {data.totalAvailable} em busca rápida
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoMark}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              >
                <Wand2 className="h-4 w-4 shrink-0" />
                Marcar o que o sistema recomenda
              </button>
            </div>
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
                  <h3 className="text-lg font-semibold text-gray-800 text-left">{section}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                    {sectionMarkedCount} de {fields.length} destaques
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
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{field.label}</p>
                              {showTechnicalDetails ? (
                                <p className="text-xs text-gray-500 mt-0.5 font-mono break-all">{field.key}</p>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:flex-shrink-0">
                              {showTechnicalDetails ? (
                                <span
                                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                                  title="Tipo de preenchimento no formulário"
                                >
                                  {field.type}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                  {fieldTypeLabelPt(field.type)}
                                </span>
                              )}
                              {field.hasFixedColumn ? (
                                showTechnicalDetails ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 max-w-[min(100%,12rem)]">
                                    <Database className="h-3 w-3 mr-1 shrink-0" />
                                    <span className="truncate">{field.fixedColumnName}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
                                    Pode usar em busca rápida
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-900 border border-amber-100">
                                  Só no formulário completo
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
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1">
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>Para a equipe:</strong> priorize dados que todo mundo consulta (município, data da
            notificação, nome, CNS, etc.). Itens muito específicos do agravo podem ficar só no
            formulário completo. Em dúvida, peça orientação à TI ou use{' '}
            <strong>Marcar o que o sistema recomenda</strong> acima.
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
                Nenhum dado deste formulário entra no modo “busca rápida” padrão
              </p>
              <p className="text-sm text-yellow-800 mb-3">
                Esta função vale para a ficha de notificação quando os campos seguem os nomes padrão
                (notificação, paciente, residência). Este formulário ainda não tem itens compatíveis com
                essa lista.
              </p>
              
              <div className="bg-yellow-100 rounded-md p-3 mb-3">
                <p className="text-sm font-medium text-yellow-900 mb-2">
                  O que fazer na prática:
                </p>
                <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1 ml-2">
                  <li>Edite o formulário no Form Builder</li>
                  <li>Use chaves (keys) específicas dos campos SINAN ao criar os campos</li>
                  <li>Volte aqui e marque os campos desejados como fixos</li>
                </ol>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-yellow-900 hover:text-yellow-800">
                  📋 Ver exemplos de chaves válidas (Ficha de Notificação)
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
                    <strong className="text-yellow-900">Dados do indivíduo:</strong>
                    <p className="text-gray-600 ml-2">paciente.escolaridade, paciente.ocupacao_cbo, paciente.atividade_cnae, paciente.situacao_rua, paciente.profissional_saude, paciente.privado_liberdade, paciente.com_deficiencia, paciente.gestante</p>
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
