import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/keycloak/AuthProvider';
import FormService, { type FormSchema, type FormSection, type FormField, type FormRule, type RuleCondition, type RuleAction } from '@/services/FormService';
import DatabaseService, { type TableColumn } from '@/services/DatabaseService';
import { Plus, Trash2, Save, Eye, Settings, GripVertical, X, Download, Upload, ChevronUp, ChevronDown, Code, FileEdit } from 'lucide-react';
import { FormRenderer } from '../components/FormRenderer';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';

export const FormBuilderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [agravoKey, setAgravoKey] = useState('');
  const [categoria, setCategoria] = useState('notificacao');
  const [schema, setSchema] = useState<FormSchema>({
    agravo: '',
    sections: []
  });

  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [activeField, setActiveField] = useState<{ sectionIdx: number; fieldIdx: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'rules'>('fields');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para configuração de banco de dados
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<Record<string, TableColumn[]>>({});
  const [loadingTables, setLoadingTables] = useState(false);

  useEffect(() => {
    if (id) {
      loadForm();
    }
    loadTables();
  }, [id]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const form = await FormService.getFormById(parseInt(id!));
      setFormName(form.nome);
      setFormDescription(form.descricao || '');
      setAgravoKey(form.agravo_key);
      setCategoria(form.categoria || 'notificacao');
      
      // Buscar versão ativa e carregar o schema
      if (form.active_version_id && form.versions) {
        const activeVersion = form.versions.find(v => v.id === form.active_version_id);
        if (activeVersion && activeVersion.schema_json) {
          setSchema(activeVersion.schema_json);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar formulário:', err);
      alert('Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      setLoadingTables(true);
      console.log('Carregando tabelas do banco...');
      const tables = await DatabaseService.getTables();
      console.log('Tabelas carregadas:', tables);
      setAvailableTables(tables);
    } catch (error) {
      console.error('Erro ao carregar tabelas:', error);
      alert('Erro ao carregar tabelas do banco de dados. Verifique se o backend está rodando.');
    } finally {
      setLoadingTables(false);
    }
  };

  const loadColumns = async (table: string) => {
    if (availableColumns[table]) return; // Já carregou
    
    try {
      const columns = await DatabaseService.getColumns(table);
      setAvailableColumns(prev => ({ ...prev, [table]: columns }));
    } catch (error) {
      console.error('Erro ao carregar colunas:', error);
    }
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: 'Nova Seção',
      order: schema.sections.length + 1,
      fields: []
    };
    setSchema({ ...schema, sections: [...schema.sections, newSection] });
    setActiveSection(schema.sections.length);
  };

  const updateSection = (idx: number, updates: Partial<FormSection>) => {
    const newSections = [...schema.sections];
    newSections[idx] = { ...newSections[idx], ...updates };
    setSchema({ ...schema, sections: newSections });
  };

  const deleteSection = (idx: number) => {
    const newSections = schema.sections.filter((_, i) => i !== idx);
    setSchema({ ...schema, sections: newSections });
    if (activeSection === idx) setActiveSection(null);
  };

  const moveSectionUp = (idx: number) => {
    if (idx === 0) return;
    const newSections = [...schema.sections];
    [newSections[idx - 1], newSections[idx]] = [newSections[idx], newSections[idx - 1]];
    // Atualizar order
    newSections.forEach((section, i) => section.order = i + 1);
    setSchema({ ...schema, sections: newSections });
  };

  const moveSectionDown = (idx: number) => {
    if (idx === schema.sections.length - 1) return;
    const newSections = [...schema.sections];
    [newSections[idx], newSections[idx + 1]] = [newSections[idx + 1], newSections[idx]];
    // Atualizar order
    newSections.forEach((section, i) => section.order = i + 1);
    setSchema({ ...schema, sections: newSections });
  };

  const moveFieldUp = (sectionIdx: number, fieldIdx: number) => {
    if (fieldIdx === 0) return;
    const newSections = [...schema.sections];
    const fields = newSections[sectionIdx].fields;
    [fields[fieldIdx - 1], fields[fieldIdx]] = [fields[fieldIdx], fields[fieldIdx - 1]];
    // Atualizar order
    fields.forEach((field, i) => field.order = i + 1);
    setSchema({ ...schema, sections: newSections });
  };

  const moveFieldDown = (sectionIdx: number, fieldIdx: number) => {
    const newSections = [...schema.sections];
    const fields = newSections[sectionIdx].fields;
    if (fieldIdx === fields.length - 1) return;
    [fields[fieldIdx], fields[fieldIdx + 1]] = [fields[fieldIdx + 1], fields[fieldIdx]];
    // Atualizar order
    fields.forEach((field, i) => field.order = i + 1);
    setSchema({ ...schema, sections: newSections });
  };

  const addField = (sectionIdx: number) => {
    const newField: FormField = {
      key: `field_${Date.now()}`,
      type: 'text',
      label: 'Novo Campo',
      required: false,
      order: schema.sections[sectionIdx].fields.length + 1,
      maxLength: 255,
      addressFields: ['cep', 'state', 'city', 'street', 'neighborhood', 'number', 'complement', 'reference']
    };
    
    const newSections = [...schema.sections];
    newSections[sectionIdx].fields.push(newField);
    setSchema({ ...schema, sections: newSections });
    setActiveField({ sectionIdx, fieldIdx: newSections[sectionIdx].fields.length - 1 });
  };

  const updateField = (sectionIdx: number, fieldIdx: number, updates: Partial<FormField>) => {
    const newSections = [...schema.sections];
    newSections[sectionIdx].fields[fieldIdx] = {
      ...newSections[sectionIdx].fields[fieldIdx],
      ...updates
    };
    setSchema({ ...schema, sections: newSections });
  };

  const deleteField = (sectionIdx: number, fieldIdx: number) => {
    const newSections = [...schema.sections];
    newSections[sectionIdx].fields = newSections[sectionIdx].fields.filter((_, i) => i !== fieldIdx);
    setSchema({ ...schema, sections: newSections });
    if (activeField?.sectionIdx === sectionIdx && activeField?.fieldIdx === fieldIdx) {
      setActiveField(null);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const userId = user?.sub || user?.id;
      if (!userId) {
        alert('Usuário não autenticado');
        console.error('user object:', user);
        return;
      }

      const formData = {
        nome: formName,
        agravo_key: agravoKey,
        descricao: formDescription,
        created_by: userId
      };

      let formId: number;
      if (id) {
        await FormService.updateForm(parseInt(id), formData);
        formId = parseInt(id);
      } else {
        const newForm = await FormService.createForm(formData);
        formId = newForm.id;
      }

      // Criar versão e publicar automaticamente
      const schemaToSave = {
        ...schema,
        agravo: agravoKey
      };

      const version = await FormService.createVersion(formId, {
        schema_json: schemaToSave,
        ui_json: {},
        rules_json: {},
        published_by: userId
      });

      // Publicar a versão automaticamente para o formulário ficar disponível
      await FormService.publishVersion(formId, version.id, userId);

      alert('Formulário salvo e publicado com sucesso!');
      navigate('/private/formularios-admin');
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      alert(`Erro ao salvar formulário: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      metadata: {
        formName,
        agravoKey,
        formDescription,
        categoria,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      },
      schema
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formulario_${agravoKey || 'novo'}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Validar estrutura básica
        if (!importedData.schema || !importedData.metadata) {
          alert('Arquivo JSON inválido! Deve conter "schema" e "metadata".');
          return;
        }

        // Carregar dados
        setFormName(importedData.metadata.formName || '');
        setAgravoKey(importedData.metadata.agravoKey || '');
        setFormDescription(importedData.metadata.formDescription || '');
        setCategoria(importedData.metadata.categoria || 'notificacao');
        setSchema(importedData.schema);

        alert('Formulário importado com sucesso!');
      } catch (err) {
        console.error('Erro ao importar JSON:', err);
        alert('Erro ao ler arquivo JSON. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);

    // Limpar input para permitir reimportar o mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ========== FUNÇÕES DE REGRAS ==========
  
  const addRule = () => {
    const newRule: FormRule = {
      when: {
        op: 'eq',
        left: '',
        right: ''
      },
      then: [],
      else: []
    };
    setSchema({
      ...schema,
      rules: [...(schema.rules || []), newRule]
    });
  };

  const updateRule = (idx: number, updates: Partial<FormRule>) => {
    const newRules = [...(schema.rules || [])];
    newRules[idx] = { ...newRules[idx], ...updates };
    setSchema({ ...schema, rules: newRules });
  };

  const deleteRule = (idx: number) => {
    const newRules = (schema.rules || []).filter((_, i) => i !== idx);
    setSchema({ ...schema, rules: newRules });
  };

  const updateRuleCondition = (ruleIdx: number, updates: Partial<RuleCondition>) => {
    const newRules = [...(schema.rules || [])];
    newRules[ruleIdx].when = { ...newRules[ruleIdx].when, ...updates };
    setSchema({ ...schema, rules: newRules });
  };

  const addRuleAction = (ruleIdx: number, type: 'then' | 'else') => {
    const newAction: RuleAction = {
      action: 'show',
      target: ''
    };
    const newRules = [...(schema.rules || [])];
    newRules[ruleIdx][type] = [...(newRules[ruleIdx][type] || []), newAction];
    setSchema({ ...schema, rules: newRules });
  };

  const updateRuleAction = (ruleIdx: number, type: 'then' | 'else', actionIdx: number, updates: Partial<RuleAction>) => {
    const newRules = [...(schema.rules || [])];
    const actions = [...(newRules[ruleIdx][type] || [])];
    actions[actionIdx] = { ...actions[actionIdx], ...updates };
    newRules[ruleIdx][type] = actions;
    setSchema({ ...schema, rules: newRules });
  };

  const deleteRuleAction = (ruleIdx: number, type: 'then' | 'else', actionIdx: number) => {
    const newRules = [...(schema.rules || [])];
    newRules[ruleIdx][type] = (newRules[ruleIdx][type] || []).filter((_, i) => i !== actionIdx);
    setSchema({ ...schema, rules: newRules });
  };

  // Obter lista de todos os campos disponíveis para usar nas regras
  const getAllFieldKeys = (): string[] => {
    const keys: string[] = [];
    schema.sections?.forEach(section => {
      section.fields?.forEach(field => {
        if (field.key) keys.push(field.key);
      });
    });
    return keys;
  };

  const fieldTypes = [
    { value: 'text', label: '📝 Texto' },
    { value: 'number', label: '🔢 Número' },
    { value: 'date', label: '📅 Data' },
    { value: 'datetime', label: '🕐 Data e Hora' },
    { value: 'time', label: '⏰ Hora' },
    { value: 'email', label: '📧 Email' },
    { value: 'phone', label: '📱 Telefone' },
    { value: 'international-phone', label: '🌍 Telefone Internacional' },
    { value: 'cpf', label: '🆔 CPF' },
    { value: 'address', label: '🏠 Endereço Completo' },
    { value: 'textarea', label: '📄 Texto Longo' },
    { value: 'checkbox', label: '☑️ Checkbox' },
    { value: 'checkbox-group', label: '☑️ Grupo de Checkboxes' },
    { value: 'radio', label: '🔘 Radio Button' },
    { value: 'select', label: '📋 Seleção' },
    { value: 'select-search', label: '🔍 Seleção com Busca' },
    { value: 'multi-select', label: '📋 Seleção Múltipla' },
    { value: 'file', label: '📁 Upload de Arquivo' },
    { value: 'signature', label: '✍️ Assinatura Digital' },
    { value: 'geolocation', label: '🌍 Geolocalização' },
    { value: 'autocomplete', label: '🔍 Autocomplete' },
    { value: 'color', label: '🎨 Seletor de Cor' },
    { value: 'slider', label: '🎚️ Slider' },
    { value: 'rating', label: '⭐ Avaliação (Estrelas)' },
    { value: 'google-address', label: '🗺️ Endereço (Google Maps)' }
  ];

  return (
    <AppPageLayout
      title={id ? 'Editar Formulário' : 'Novo Formulário'}
      subtitle="Construtor visual de formulários SINAN/e-SUS"
      icon={<FileEdit className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      backPath="/private/formularios-admin"
      headerActions={
        <div className="flex gap-2">
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md flex items-center gap-2"
            title="Exportar formulário como JSON"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md flex items-center gap-2"
            title="Importar formulário de JSON"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            onClick={() => setShowPreview(true)}
            className="px-3 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center gap-2"
            disabled={schema.sections.length === 0}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-2 font-medium"
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurações Gerais */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Formulário *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ex: Dengue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código do Agravo *
                  </label>
                  <input
                    type="text"
                    value={agravoKey}
                    onChange={(e) => setAgravoKey(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ex: DENGUE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="notificacao">Notificação</option>
                    <option value="investigacao">Investigação</option>
                    <option value="encerramento">Encerramento</option>
                  </select>
                </div>

                <button
                  onClick={addSection}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Seção
                </button>
              </div>
            </div>
          </div>

          {/* Editor de Seções e Campos */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs de Navegação */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('fields')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'fields'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings className="inline h-4 w-4 mr-2" />
                    Campos ({schema.sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0)})
                  </button>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'rules'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Code className="inline h-4 w-4 mr-2" />
                    Regras ({(schema.rules || []).length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Conteúdo da Aba de Campos */}
            {activeTab === 'fields' && (
              <>
            {schema.sections.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">Nenhuma seção criada ainda</p>
                <button
                  onClick={addSection}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeira Seção
                </button>
              </div>
            ) : (
              schema.sections.map((section, sectionIdx) => (
                <div key={section.id} className="bg-white rounded-lg shadow">
                  {/* Cabeçalho da Seção */}
                  <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      {activeSection === sectionIdx ? (
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(sectionIdx, { title: e.target.value })}
                          className="flex-1 px-2 py-1 border border-blue-300 rounded"
                          autoFocus
                        />
                      ) : (
                        <h3 
                          className="font-semibold text-gray-900 cursor-pointer flex-1"
                          onClick={() => setActiveSection(sectionIdx)}
                        >
                          {section.title}
                        </h3>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveSectionUp(sectionIdx)}
                        disabled={sectionIdx === 0}
                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveSectionDown(sectionIdx)}
                        disabled={sectionIdx === schema.sections.length - 1}
                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => addField(sectionIdx)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Campo
                      </button>
                      <button
                        onClick={() => deleteSection(sectionIdx)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Campos da Seção */}
                  <div className="p-4 space-y-3">
                    {section.fields.length === 0 ? (
                      <p className="text-gray-400 text-sm italic">
                        Nenhum campo nesta seção
                      </p>
                    ) : (
                      section.fields.map((field, fieldIdx) => (
                        <div
                          key={field.key}
                          className={`border rounded p-3 ${
                            activeField?.sectionIdx === sectionIdx && activeField?.fieldIdx === fieldIdx
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                          onClick={() => setActiveField({ sectionIdx, fieldIdx })}
                        >
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-4">
                              <label className="text-xs text-gray-600">Label</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(sectionIdx, fieldIdx, { label: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="text-xs text-gray-600">Nome técnico</label>
                              <input
                                type="text"
                                value={field.key}
                                onChange={(e) => updateField(sectionIdx, fieldIdx, { key: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-600">Tipo</label>
                              <select
                                value={field.type}
                                onChange={(e) => updateField(sectionIdx, fieldIdx, { type: e.target.value as any })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              >
                                {fieldTypes.map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-3 flex items-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveFieldUp(sectionIdx, fieldIdx);
                                }}
                                disabled={fieldIdx === 0}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Mover para cima"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveFieldDown(sectionIdx, fieldIdx);
                                }}
                                disabled={fieldIdx === section.fields.length - 1}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Mover para baixo"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteField(sectionIdx, fieldIdx);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Excluir campo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-4">
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={field.required || false}
                                onChange={(e) => updateField(sectionIdx, fieldIdx, { required: e.target.checked })}
                                className="rounded"
                              />
                              Obrigatório
                            </label>
                            <input
                              type="text"
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(sectionIdx, fieldIdx, { placeholder: e.target.value })}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                              placeholder="Placeholder..."
                            />
                            {(field.type === 'text' || field.type === 'textarea') && (
                              <div className="flex items-center gap-1">
                                <label className="text-xs text-gray-600 whitespace-nowrap">Máx. caracteres:</label>
                                <input
                                  type="number"
                                  value={field.maxLength ?? ''}
                                  onChange={(e) => updateField(sectionIdx, fieldIdx, { maxLength: e.target.value ? Number(e.target.value) : undefined })}
                                  onBlur={(e) => {
                                    if (!e.target.value) {
                                      const defaultValue = field.type === 'text' ? 255 : 1500;
                                      updateField(sectionIdx, fieldIdx, { maxLength: defaultValue });
                                    }
                                  }}
                                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                  min="1"
                                  max="5000"
                                  placeholder={field.type === 'text' ? '255' : '1500'}
                                />
                              </div>
                            )}
                            {field.type === 'number' && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">Min:</label>
                                  <input
                                    type="number"
                                    value={field.min ?? ''}
                                    onChange={(e) => updateField(sectionIdx, fieldIdx, { min: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">Max:</label>
                                  <input
                                    type="number"
                                    value={field.max ?? ''}
                                    onChange={(e) => updateField(sectionIdx, fieldIdx, { max: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                    placeholder="999999"
                                  />
                                </div>
                              </div>
                            )}
                            {(field.type === 'checkbox-group' || field.type === 'radio' || field.type === 'select' || field.type === 'select-search' || field.type === 'multi-select') && (
                              <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                {/* Seletor de Origem dos Dados */}
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Origem dos Dados:
                                  </label>
                                  <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`dataSource_${sectionIdx}_${fieldIdx}`}
                                        checked={!field.dataSource || field.dataSource === 'manual'}
                                        onChange={() => updateField(sectionIdx, fieldIdx, { 
                                          dataSource: 'manual',
                                          dataTable: undefined,
                                          dataValueColumn: undefined,
                                          dataLabelColumn: undefined
                                        })}
                                        className="w-3 h-3 text-blue-600"
                                      />
                                      <span className="ml-2 text-xs text-gray-700">Manual</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`dataSource_${sectionIdx}_${fieldIdx}`}
                                        checked={field.dataSource === 'database'}
                                        onChange={() => updateField(sectionIdx, fieldIdx, { 
                                          dataSource: 'database',
                                          options: undefined
                                        })}
                                        className="w-3 h-3 text-blue-600"
                                      />
                                      <span className="ml-2 text-xs text-gray-700">Banco de Dados</span>
                                    </label>
                                  </div>
                                </div>

                                {/* Configuração Manual */}
                                {(!field.dataSource || field.dataSource === 'manual') && (
                                  <>
                                    <div className="flex justify-between items-center mb-2">
                                      <label className="block text-xs font-medium text-gray-700">
                                        Opções:
                                      </label>
                                      <button
                                        onClick={() => {
                                          const newOption = { value: `option_${Date.now()}`, label: 'Nova Opção' };
                                          updateField(sectionIdx, fieldIdx, { 
                                            options: [...(field.options || []), newOption] 
                                          });
                                        }}
                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                      >
                                        + Adicionar Opção
                                      </button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {(field.options || []).map((option, optIdx) => (
                                        <div key={optIdx} className="flex gap-2 items-center">
                                          <input
                                            type="text"
                                            value={option.label}
                                            onChange={(e) => {
                                              const newOptions = [...(field.options || [])];
                                              newOptions[optIdx] = { ...newOptions[optIdx], label: e.target.value };
                                              updateField(sectionIdx, fieldIdx, { options: newOptions });
                                            }}
                                            placeholder="Nome da opção"
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                          />
                                          <input
                                            type="text"
                                            value={option.value}
                                            onChange={(e) => {
                                              const newOptions = [...(field.options || [])];
                                              newOptions[optIdx] = { ...newOptions[optIdx], value: e.target.value };
                                              updateField(sectionIdx, fieldIdx, { options: newOptions });
                                            }}
                                            placeholder="Valor"
                                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded"
                                          />
                                          <button
                                            onClick={() => {
                                              const newOptions = (field.options || []).filter((_, i) => i !== optIdx);
                                              updateField(sectionIdx, fieldIdx, { options: newOptions });
                                            }}
                                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))}
                                      {(!field.options || field.options.length === 0) && (
                                        <p className="text-xs text-gray-500 text-center py-2">Nenhuma opção adicionada</p>
                                      )}
                                    </div>
                                  </>
                                )}

                                {/* Configuração de Banco de Dados */}
                                {field.dataSource === 'database' && (
                                  <div className="space-y-3">
                                    {/* Seletor de Tabela */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Tabela:
                                      </label>
                                      <select
                                        value={field.dataTable || ''}
                                        onChange={(e) => {
                                          const table = e.target.value;
                                          updateField(sectionIdx, fieldIdx, { 
                                            dataTable: table,
                                            dataValueColumn: undefined,
                                            dataLabelColumn: undefined
                                          });
                                          if (table) loadColumns(table);
                                        }}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                        disabled={loadingTables}
                                      >
                                        <option value="">
                                          {loadingTables ? 'Carregando...' : 'Selecione uma tabela'}
                                        </option>
                                        {availableTables.map(table => (
                                          <option key={table} value={table}>{table}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Seletor de Coluna de Valor */}
                                    {field.dataTable && (
                                      <>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Coluna para Valor:
                                          </label>
                                          <select
                                            value={field.dataValueColumn || ''}
                                            onChange={(e) => updateField(sectionIdx, fieldIdx, { dataValueColumn: e.target.value })}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                          >
                                            <option value="">Selecione uma coluna</option>
                                            {(availableColumns[field.dataTable] || []).map(col => (
                                              <option key={col.name} value={col.name}>
                                                {col.name} ({col.type})
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Seletor de Coluna de Label */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Coluna para Nome:
                                          </label>
                                          <select
                                            value={field.dataLabelColumn || ''}
                                            onChange={(e) => updateField(sectionIdx, fieldIdx, { dataLabelColumn: e.target.value })}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                          >
                                            <option value="">Selecione uma coluna</option>
                                            {(availableColumns[field.dataTable] || []).map(col => (
                                              <option key={col.name} value={col.name}>
                                                {col.name} ({col.type})
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {field.dataValueColumn && field.dataLabelColumn && (
                                          <p className="text-xs text-green-600">
                                            ✓ Configurado: {field.dataTable}.{field.dataValueColumn} → {field.dataLabelColumn}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {field.type === 'address' && (
                              <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Campos do Endereço a Exibir:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { value: 'cep', label: 'CEP' },
                                    { value: 'state', label: 'Estado' },
                                    { value: 'city', label: 'Cidade' },
                                    { value: 'street', label: 'Rua' },
                                    { value: 'neighborhood', label: 'Bairro' },
                                    { value: 'number', label: 'Número' },
                                    { value: 'complement', label: 'Complemento' },
                                    { value: 'reference', label: 'Ponto de Referência' },
                                  ].map((option) => (
                                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer text-xs">
                                      <input
                                        type="checkbox"
                                        checked={(field.addressFields || []).includes(option.value)}
                                        onChange={(e) => {
                                          const current = field.addressFields || [];
                                          const updated = e.target.checked
                                            ? [...current, option.value]
                                            : current.filter(f => f !== option.value);
                                          updateField(sectionIdx, fieldIdx, { addressFields: updated });
                                        }}
                                        className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-gray-700">{option.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
              </>
            )}

            {/* Conteúdo da Aba de Regras */}
            {activeTab === 'rules' && (
              <div className="space-y-4">
                {/* Header de Regras */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Regras Condicionais</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Controle visibilidade, obrigatoriedade e valores baseado em condições
                      </p>
                    </div>
                    <button
                      onClick={addRule}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Nova Regra
                    </button>
                  </div>
                </div>

                {/* Lista de Regras */}
                {(schema.rules || []).length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Code className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma regra criada ainda</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Regras permitem: mostrar/ocultar campos, tornar obrigatórios, desabilitar, definir valores
                    </p>
                    <button
                      onClick={addRule}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Primeira Regra
                    </button>
                  </div>
                ) : (
                  (schema.rules || []).map((rule, ruleIdx) => {
                    const availableFields = getAllFieldKeys();
                    
                    return (
                      <div key={ruleIdx} className="bg-white rounded-lg shadow">
                        {/* Cabeçalho da Regra */}
                        <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Code className="h-5 w-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-900">
                              Regra #{ruleIdx + 1}
                              {rule.description && <span className="text-sm font-normal text-gray-600 ml-2">- {rule.description}</span>}
                            </h4>
                          </div>
                          <button
                            onClick={() => deleteRule(ruleIdx)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Descrição da Regra */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descrição (opcional)
                            </label>
                            <input
                              type="text"
                              value={rule.description || ''}
                              onChange={(e) => updateRule(ruleIdx, { description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Ex: Mostra campo gestante apenas para sexo feminino"
                            />
                          </div>

                          {/* Condição WHEN */}
                          <div className="border-l-4 border-blue-500 pl-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">
                              QUANDO (Condição)
                            </h5>
                            <div className="grid grid-cols-12 gap-3">
                              <div className="col-span-4">
                                <label className="block text-xs text-gray-600 mb-1">Campo</label>
                                <select
                                  value={rule.when.left || ''}
                                  onChange={(e) => updateRuleCondition(ruleIdx, { left: e.target.value })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Selecione...</option>
                                  {availableFields.map(key => (
                                    <option key={key} value={key}>{key}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-3">
                                <label className="block text-xs text-gray-600 mb-1">Operador</label>
                                <select
                                  value={rule.when.op}
                                  onChange={(e) => updateRuleCondition(ruleIdx, { op: e.target.value as any })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                                >
                                  <option value="eq">= (igual)</option>
                                  <option value="neq">≠ (diferente)</option>
                                  <option value="gt">&gt; (maior)</option>
                                  <option value="gte">≥ (maior/igual)</option>
                                  <option value="lt">&lt; (menor)</option>
                                  <option value="lte">≤ (menor/igual)</option>
                                  <option value="in">∈ (contém em lista)</option>
                                  <option value="notIn">∉ (não contém)</option>
                                  <option value="contains">contém texto</option>
                                  <option value="startsWith">começa com</option>
                                  <option value="endsWith">termina com</option>
                                  <option value="isEmpty">está vazio</option>
                                  <option value="isNotEmpty">não está vazio</option>
                                </select>
                              </div>
                              <div className="col-span-5">
                                <label className="block text-xs text-gray-600 mb-1">
                                  Valor {['in', 'notIn'].includes(rule.when.op) && '(separado por vírgula)'}
                                </label>
                                <input
                                  type="text"
                                  value={
                                    Array.isArray(rule.when.right)
                                      ? rule.when.right.join(', ')
                                      : (rule.when.right || '')
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const newValue = ['in', 'notIn'].includes(rule.when.op)
                                      ? value.split(',').map(v => v.trim()).filter(v => v)
                                      : value;
                                    updateRuleCondition(ruleIdx, { right: newValue });
                                  }}
                                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                                  placeholder={['isEmpty', 'isNotEmpty'].includes(rule.when.op) ? '(sem valor)' : 'valor...'}
                                  disabled={['isEmpty', 'isNotEmpty'].includes(rule.when.op)}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Ações THEN */}
                          <div className="border-l-4 border-green-500 pl-4">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-sm font-semibold text-gray-700">
                                ENTÃO (Ações se verdadeiro)
                              </h5>
                              <button
                                onClick={() => addRuleAction(ruleIdx, 'then')}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Adicionar Ação
                              </button>
                            </div>
                            
                            {(rule.then || []).length === 0 ? (
                              <p className="text-sm text-gray-400 italic">Nenhuma ação definida</p>
                            ) : (
                              <div className="space-y-2">
                                {(rule.then || []).map((action, actionIdx) => (
                                  <div key={actionIdx} className="flex gap-2 items-start">
                                    <select
                                      value={action.action}
                                      onChange={(e) => updateRuleAction(ruleIdx, 'then', actionIdx, { action: e.target.value as any })}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="show">Mostrar</option>
                                      <option value="hide">Ocultar</option>
                                      <option value="require">Tornar obrigatório</option>
                                      <option value="unrequire">Tornar opcional</option>
                                      <option value="enable">Habilitar</option>
                                      <option value="disable">Desabilitar</option>
                                      <option value="setValue">Definir valor</option>
                                      <option value="clear">Limpar valor</option>
                                    </select>
                                    
                                    <select
                                      value={action.target}
                                      onChange={(e) => updateRuleAction(ruleIdx, 'then', actionIdx, { target: e.target.value })}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Selecione campo...</option>
                                      {availableFields.map(key => (
                                        <option key={key} value={key}>{key}</option>
                                      ))}
                                    </select>

                                    {action.action === 'setValue' && (
                                      <input
                                        type="text"
                                        value={action.value || ''}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'then', actionIdx, { value: e.target.value })}
                                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Valor..."
                                      />
                                    )}
                                    
                                    <button
                                      onClick={() => deleteRuleAction(ruleIdx, 'then', actionIdx)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Ações ELSE */}
                          <div className="border-l-4 border-orange-500 pl-4">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-sm font-semibold text-gray-700">
                                SENÃO (Ações se falso)
                              </h5>
                              <button
                                onClick={() => addRuleAction(ruleIdx, 'else')}
                                className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Adicionar Ação
                              </button>
                            </div>
                            
                            {(rule.else || []).length === 0 ? (
                              <p className="text-sm text-gray-400 italic">Nenhuma ação definida</p>
                            ) : (
                              <div className="space-y-2">
                                {(rule.else || []).map((action, actionIdx) => (
                                  <div key={actionIdx} className="flex gap-2 items-start">
                                    <select
                                      value={action.action}
                                      onChange={(e) => updateRuleAction(ruleIdx, 'else', actionIdx, { action: e.target.value as any })}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="show">Mostrar</option>
                                      <option value="hide">Ocultar</option>
                                      <option value="require">Tornar obrigatório</option>
                                      <option value="unrequire">Tornar opcional</option>
                                      <option value="enable">Habilitar</option>
                                      <option value="disable">Desabilitar</option>
                                      <option value="setValue">Definir valor</option>
                                      <option value="clear">Limpar valor</option>
                                    </select>
                                    
                                    <select
                                      value={action.target}
                                      onChange={(e) => updateRuleAction(ruleIdx, 'else', actionIdx, { target: e.target.value })}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Selecione campo...</option>
                                      {availableFields.map(key => (
                                        <option key={key} value={key}>{key}</option>
                                      ))}
                                    </select>

                                    {action.action === 'setValue' && (
                                      <input
                                        type="text"
                                        value={action.value || ''}
                                        onChange={(e) => updateRuleAction(ruleIdx, 'else', actionIdx, { value: e.target.value })}
                                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Valor..."
                                      />
                                    )}
                                    
                                    <button
                                      onClick={() => deleteRuleAction(ruleIdx, 'else', actionIdx)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
      </div>

      {/* Modal de Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{formName || 'Preview do Formulário'}</h2>
                <p className="text-sm text-gray-500 mt-1">Visualização de como o formulário será exibido</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Corpo do Modal com Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white rounded-lg shadow p-6">
                {schema.sections.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Adicione seções e campos para visualizar o formulário</p>
                  </div>
                ) : (
                  <FormRenderer
                    schema={schema}
                    data={{}}
                    onChange={() => {}}
                    readOnly={true}
                  />
                )}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleSave();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Formulário
              </button>
            </div>
          </div>
        </div>
      )}
    </AppPageLayout>
  );
};
