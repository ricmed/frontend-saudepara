// components/FileUploadSection.tsx - Componente de upload de arquivos
import React, { useCallback, useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Download, 
  Eye, 
  AlertCircle, 
  CheckCircle,
  Loader,
  Paperclip,
  FileText
} from 'lucide-react';
import { 
  ArquivoFormulario, 
  DEFAULT_UPLOAD_CONFIG, 
  UploadConfig,
  validateFile,
  validateTotalFiles,
  formatFileSize,
  getFileTypeInfo
} from '@/features/notificationForms/types/index2';

interface FileUploadSectionProps {
  arquivos: ArquivoFormulario[];
  onChange: (arquivos: ArquivoFormulario[]) => void;
  onRemove: (id: string) => void; // Adicionar prop para remoção
  onValidationError: (error: string | null) => void;
  config?: UploadConfig;
  disabled?: boolean;
  error?: string;
}

// Componente principal de upload de arquivos
const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  arquivos,
  onChange,
  onRemove, // Usar a prop
  onValidationError,
  config = DEFAULT_UPLOAD_CONFIG,
  disabled = false,
  error
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gerar ID único para arquivos novos
  const generateId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calcular estatísticas dos arquivos
  const stats = {
    count: arquivos.length,
    totalSize: arquivos.reduce((sum, arquivo) => sum + arquivo.tamanho, 0),
    pending: arquivos.filter(a => a.status === 'pending').length,
    uploading: arquivos.filter(a => a.status === 'uploading').length,
    uploaded: arquivos.filter(a => a.status === 'uploaded' || a.isExisting).length,
    errors: arquivos.filter(a => a.status === 'error').length
  };

  // Processar arquivos selecionados
  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const novosArquivos: ArquivoFormulario[] = [];
    const erros: string[] = [];

    fileArray.forEach(file => {
      // Validar arquivo individual
      const validation = validateFile(file, config);
      if (!validation.valid) {
        erros.push(`${file.name}: ${validation.error}`);
        return;
      }

      // Verificar duplicatas
      const isDuplicate = arquivos.some(arquivo => 
        arquivo.nome === file.name && arquivo.tamanho === file.size
      );

      if (isDuplicate) {
        erros.push(`${file.name}: Arquivo já adicionado`);
        return;
      }

      // Criar objeto do arquivo
      const novoArquivo: ArquivoFormulario = {
        id: generateId(),
        file,
        nome: file.name,
        tamanho: file.size,
        tipo: file.type,
        status: 'pending',
        isExisting: false
      };

      novosArquivos.push(novoArquivo);
    });

    // Verificar limite total após adicionar novos arquivos
    const arquivosAtualizados = [...arquivos, ...novosArquivos];
    const totalValidation = validateTotalFiles(arquivosAtualizados, config);
    
    if (!totalValidation.valid) {
      onValidationError(totalValidation.error!);
      return;
    }

    if (erros.length > 0) {
      onValidationError(`Erros encontrados:\n${erros.join('\n')}`);
      // Ainda assim adiciona os arquivos válidos
    } else {
      onValidationError(null);
    }

    onChange(arquivosAtualizados);
  }, [arquivos, config, onChange, onValidationError]);

  // Handlers de drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  // Handler para seleção via input
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Limpar input para permitir reselecionar o mesmo arquivo
    e.target.value = '';
  }, [processFiles]);

  // APENAS ajuste a função removeFile para usar a prop do pai
  const removeFile = useCallback((id: string) => {
    onRemove(id); // Chame a função do pai (que vem do hook)
    onValidationError(null); // Limpa o erro ao remover um arquivo
  }, [onRemove, onValidationError]);

  // Abrir seletor de arquivos
  const openFileSelector = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Simular download (para arquivos existentes)
  const handleDownload = (arquivo: ArquivoFormulario) => {
    if (arquivo.url) {
      window.open(arquivo.url, '_blank');
    } else if (arquivo.file) {
      // Para arquivos novos, criar URL temporária
      const url = URL.createObjectURL(arquivo.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = arquivo.nome;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Preview de arquivo (para imagens)
  const handlePreview = (arquivo: ArquivoFormulario) => {
    if (arquivo.tipo.startsWith('image/')) {
      let url: string;
      if (arquivo.file) {
        url = URL.createObjectURL(arquivo.file);
      } else if (arquivo.url) {
        url = arquivo.url;
      } else {
        return;
      }
      
      // Abrir em nova janela
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={config.allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="text-center">
          <Upload className={`mx-auto h-12 w-12 mb-4 ${
            isDragOver ? 'text-blue-500' : 'text-gray-400'
          }`} />
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {isDragOver ? 'Solte os arquivos aqui' : 'Adicionar arquivos'}
            </p>
            <p className="text-sm text-gray-500">
              Arraste e solte ou clique para selecionar
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>
                Tipos aceitos: PDF, Word, Excel, Imagens (PNG/JPEG), TXT
              </p>
              <p>
                Máximo: {config.maxFiles} arquivos • {formatFileSize(config.maxFileSize)} por arquivo • {formatFileSize(config.maxTotalSize)} total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {arquivos.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Paperclip className="h-4 w-4" />
                {stats.count} arquivo{stats.count !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-500">
                {formatFileSize(stats.totalSize)} / {formatFileSize(config.maxTotalSize)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {stats.uploaded > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {stats.uploaded} enviado{stats.uploaded !== 1 ? 's' : ''}
                </span>
              )}
              {stats.uploading > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Loader className="h-4 w-4 animate-spin" />
                  {stats.uploading} enviando
                </span>
              )}
              {stats.errors > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {stats.errors} erro{stats.errors !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((stats.totalSize / config.maxTotalSize) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Lista de Arquivos */}
      {arquivos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Arquivos anexados
          </h4>
          
          <div className="space-y-2">
            {arquivos.map((arquivo) => {
              const fileInfo = getFileTypeInfo(arquivo.tipo);
              
              return (
                <div
                  key={arquivo.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border transition-all
                    ${arquivo.status === 'error' 
                      ? 'border-red-200 bg-red-50' 
                      : arquivo.status === 'uploaded' || arquivo.isExisting
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg" title={fileInfo.label}>
                      {fileInfo.icon}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {arquivo.nome}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatFileSize(arquivo.tamanho)}</span>
                        <span className={fileInfo.color}>{fileInfo.label}</span>
                        {arquivo.status && arquivo.status !== 'uploaded' && (
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${arquivo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              arquivo.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                              arquivo.status === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          `}>
                            {arquivo.status === 'pending' ? 'Pendente' :
                             arquivo.status === 'uploading' ? 'Enviando...' :
                             arquivo.status === 'error' ? 'Erro' : arquivo.status}
                          </span>
                        )}
                      </div>
                      {arquivo.error && (
                        <p className="text-xs text-red-600 mt-1">{arquivo.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-3">
                    {/* Preview para imagens */}
                    {arquivo.tipo.startsWith('image/') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(arquivo);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Download */}
                    {(arquivo.isExisting || arquivo.status === 'uploaded') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(arquivo);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Remover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(arquivo.id!);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remover"
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <div className="font-medium">Erro nos arquivos:</div>
            <div className="whitespace-pre-line">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;