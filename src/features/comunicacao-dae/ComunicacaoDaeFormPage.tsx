import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Upload, FileText, Download, Trash2, ArrowLeft } from 'lucide-react';
import ComunicacaoDaeService, { CreateComunicacaoDaeData, OrigemTipo, TipoAnexo, ComunicacaoDae, ComunicacaoDaeAnexo } from '@/services/ComunicacaoDaeService';
import DaeService, { Dae } from '@/services/DaeService';
import NheService, { Nhe } from '@/services/NheService';
import CievsService, { Cievs } from '@/services/CievsService';
import CrsService, { Crs } from '@/services/CrsService';
import { MunicipioService } from '@/services/MunicipioService';
import SideMenu from '@/features/home/components/SideMenu';

interface Municipio {
  idtipo_municipio: number;
  codigo: string;
  descricao: string;
  tipo_estado_idtipo_estado: number;
}

const ComunicacaoDaeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dados do formulário
  const [formData, setFormData] = useState<CreateComunicacaoDaeData>({
    data_comunicacao: new Date().toISOString().slice(0, 16),
    nome_paciente: '',
    observacao_descricao: '',
    id_municipio_ocorrencia: 0,
    origem_tipo: 'CRS' as OrigemTipo,
    origem_id: 0,
    id_dae: 0,
  });

  // Dados adicionais para exibição
  const [comunicacaoCompleta, setComunicacaoCompleta] = useState<ComunicacaoDae | null>(null);

  // Listas para selects
  const [daes, setDaes] = useState<Dae[]>([]);
  const [nhes, setNhes] = useState<Nhe[]>([]);
  const [cievsList, setCievsList] = useState<Cievs[]>([]);
  const [crsList, setCrsList] = useState<Crs[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);

  // Anexos
  const [anexos, setAnexos] = useState<ComunicacaoDaeAnexo[]>([]);
  const [fichaFile, setFichaFile] = useState<File | null>(null);
  const [relatorioFile, setRelatorioFile] = useState<File | null>(null);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);

  useEffect(() => {
    loadSelectOptions();
    if (isEditMode && id) {
      loadComunicacao(Number(id));
    }
  }, [id]);

  const loadSelectOptions = async () => {
    try {
      const [daesRes, nhesRes, cievsRes, crsRes, municipiosRes] = await Promise.all([
        DaeService.getAll(1, 100),
        NheService.getAll(1, 100),
        CievsService.getAll(1, 100),
        CrsService.getAll(1, 100),
        MunicipioService.getAll(),
      ]);

      setDaes(daesRes.data);
      setNhes(nhesRes.data);
      setCievsList(cievsRes.data);
      setCrsList(crsRes.data);
      setMunicipios(municipiosRes);
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
      setError('Erro ao carregar dados do formulário');
    }
  };

  const loadComunicacao = async (comunicacaoId: number) => {
    try {
      setLoadingData(true);
      const data = await ComunicacaoDaeService.getById(comunicacaoId);
      setComunicacaoCompleta(data);
      
      setFormData({
        data_comunicacao: new Date(data.data_comunicacao).toISOString().slice(0, 16),
        nome_paciente: data.nome_paciente,
        observacao_descricao: data.observacao_descricao || '',
        id_municipio_ocorrencia: data.id_municipio_ocorrencia,
        origem_tipo: data.origem_tipo,
        origem_id: data.origem_id,
        id_dae: data.id_dae,
      });

      if (data.comunicacao_dae_anexo) {
        setAnexos(data.comunicacao_dae_anexo);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar comunicação');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.nome_paciente.trim()) {
      setError('Nome do paciente é obrigatório');
      return;
    }
    if (!formData.id_municipio_ocorrencia) {
      setError('Município de ocorrência é obrigatório');
      return;
    }
    if (!formData.origem_id) {
      setError('Origem da comunicação é obrigatória');
      return;
    }
    if (!formData.id_dae) {
      setError('DAE é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let comunicacaoId: number;

      if (isEditMode && id) {
        // Atualizar comunicação existente
        const updated = await ComunicacaoDaeService.update(Number(id), formData);
        comunicacaoId = Number(updated.id_comunicacao);
        alert('Comunicação atualizada com sucesso!');
      } else {
        // Criar nova comunicação
        const created = await ComunicacaoDaeService.create(formData);
        comunicacaoId = Number(created.id_comunicacao);
        
        // Fazer upload dos anexos se houver
        if (fichaFile || relatorioFile) {
          await uploadAnexos(comunicacaoId);
        }
        
        alert('Comunicação criada com sucesso!');
      }

      navigate('/private/comunicacao-dae');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar comunicação');
      console.error('Erro ao salvar:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadAnexos = async (comunicacaoId: number) => {
    setUploadingAnexo(true);
    try {
      const uploads: Promise<any>[] = [];

      if (fichaFile) {
        uploads.push(
          ComunicacaoDaeService.addAnexo(comunicacaoId, fichaFile, 'FICHA_NOTIFICACAO')
        );
      }

      if (relatorioFile) {
        uploads.push(
          ComunicacaoDaeService.addAnexo(comunicacaoId, relatorioFile, 'RELATORIO_INVESTIGACAO')
        );
      }

      await Promise.all(uploads);
    } catch (err: any) {
      console.error('Erro ao fazer upload dos anexos:', err);
      throw err;
    } finally {
      setUploadingAnexo(false);
    }
  };

  const handleAddAnexo = async (tipo: TipoAnexo, file: File) => {
    if (!isEditMode || !id) {
      // Modo de criação: apenas armazena o arquivo
      if (tipo === 'FICHA_NOTIFICACAO') {
        setFichaFile(file);
      } else {
        setRelatorioFile(file);
      }
      return;
    }

    // Modo de edição: faz upload imediatamente
    try {
      setUploadingAnexo(true);
      const anexo = await ComunicacaoDaeService.addAnexo(Number(id), file, tipo);
      setAnexos(prev => [...prev, anexo]);
      alert('Anexo adicionado com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao adicionar anexo');
    } finally {
      setUploadingAnexo(false);
    }
  };

  const handleRemoveAnexo = async (anexoId: number) => {
    if (!confirm('Tem certeza que deseja remover este anexo?')) return;

    try {
      await ComunicacaoDaeService.removeAnexo(anexoId);
      setAnexos(prev => prev.filter(a => a.id_anexo !== anexoId));
      alert('Anexo removido com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao remover anexo');
    }
  };

  const handleDownloadAnexo = async (anexo: ComunicacaoDaeAnexo) => {
    try {
      await ComunicacaoDaeService.downloadAnexoWithName(anexo);
    } catch (err: any) {
      alert('Erro ao fazer download do anexo');
    }
  };

  const getOrigemOptions = () => {
    switch (formData.origem_tipo) {
      case 'CRS': return crsList;
      case 'NHE': return nhes;
      case 'CIEVS': return cievsList;
      default: return [];
    }
  };

  const getAnexoByTipo = (tipo: TipoAnexo) => {
    return anexos.find(a => a.tipo_anexo === tipo);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Editar Comunicação DAE' : 'Nova Comunicação DAE'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Formulário de Comunicação de Doenças Agravos e Eventos
                </p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/private/comunicacao-dae')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Formulário */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <span className="text-red-800">{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Principal */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados da Comunicação</h2>
            
            {/* Nº da Comunicação (somente em modo de edição) */}
            {isEditMode && comunicacaoCompleta && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Nº da Comunicação: <span className="text-2xl">#{comunicacaoCompleta.id_comunicacao}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origem Da Comunicação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2. Origem Da Comunicação <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.origem_tipo}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      origem_tipo: e.target.value as OrigemTipo,
                      origem_id: 0 // Reset origem_id quando mudar o tipo
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="CRS">CRS (abre lista com os CRS)</option>
                  <option value="NHE">NHE (abre lista dos hospitais com NHE)</option>
                  <option value="CIEVS">UNIDADE CIEVS (abre unidades da rede CIEVS)</option>
                </select>
              </div>

              {/* Seleção específica da origem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecione a {formData.origem_tipo} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.origem_id}
                  onChange={(e) => setFormData({ ...formData, origem_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Selecione...</option>
                  {getOrigemOptions().map((option: any) => (
                    <option 
                      key={option.id_crs || option.id_nhe || option.id_cievs} 
                      value={option.id_crs || option.id_nhe || option.id_cievs}
                    >
                      {option.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data da comunicação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  3. Data da Comunicação <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.data_comunicacao}
                  onChange={(e) => setFormData({ ...formData, data_comunicacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Município De Ocorrência */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4. Município De Ocorrência <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_municipio_ocorrencia}
                  onChange={(e) => setFormData({ ...formData, id_municipio_ocorrencia: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Selecione...</option>
                  {municipios.map((municipio) => (
                    <option key={municipio.idtipo_municipio} value={municipio.idtipo_municipio}>
                      {municipio.descricao}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome Do Paciente */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  5. Nome Do Paciente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome_paciente}
                  onChange={(e) => setFormData({ ...formData, nome_paciente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome completo do paciente"
                  maxLength={150}
                  required
                />
              </div>

              {/* DAE */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  6. DAE: abre lista de DAE <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_dae}
                  onChange={(e) => setFormData({ ...formData, id_dae: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Selecione...</option>
                  {daes.map((dae) => (
                    <option key={dae.id_dae} value={dae.id_dae}>
                      {dae.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observação/Descrição Do Caso */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  7. Observação/Descrição Do Caso
                </label>
                <textarea
                  value={formData.observacao_descricao}
                  onChange={(e) => setFormData({ ...formData, observacao_descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Descreva o caso..."
                  maxLength={1500}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.observacao_descricao?.length || 0}/1500 caracteres
                </p>
              </div>
            </div>
          </div>

          {/* Card de Anexos */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Anexos</h2>
            
            {/* Anexo 1: Ficha De Notificação */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                8. Anexo - Ficha De Notificação
              </label>
              
              {isEditMode && getAnexoByTipo('FICHA_NOTIFICACAO') ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-800">
                      {getAnexoByTipo('FICHA_NOTIFICACAO')?.nome_arquivo_original}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadAnexo(getAnexoByTipo('FICHA_NOTIFICACAO')!)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAnexo(getAnexoByTipo('FICHA_NOTIFICACAO')!.id_anexo)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : fichaFile ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-800">{fichaFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFichaFile(null)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (isEditMode && id) {
                            handleAddAnexo('FICHA_NOTIFICACAO', file);
                          } else {
                            setFichaFile(file);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Anexo 2: Relatório De Investigação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                9. Anexo - Relatório De Investigação
              </label>
              
              {isEditMode && getAnexoByTipo('RELATORIO_INVESTIGACAO') ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-800">
                      {getAnexoByTipo('RELATORIO_INVESTIGACAO')?.nome_arquivo_original}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadAnexo(getAnexoByTipo('RELATORIO_INVESTIGACAO')!)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAnexo(getAnexoByTipo('RELATORIO_INVESTIGACAO')!.id_anexo)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : relatorioFile ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-800">{relatorioFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRelatorioFile(null)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (isEditMode && id) {
                            handleAddAnexo('RELATORIO_INVESTIGACAO', file);
                          } else {
                            setRelatorioFile(file);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {uploadingAnexo && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">Fazendo upload do anexo...</p>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/private/comunicacao-dae')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploadingAnexo}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploadingAnexo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditMode ? 'Atualizar' : 'Salvar'} Comunicação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ComunicacaoDaeFormPage;
