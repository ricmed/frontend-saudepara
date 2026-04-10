import React, { useRef, ChangeEvent } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadWithCompressionProps {
  label: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente de upload de arquivos com compressão automática de imagens
 * - Comprime imagens grandes (JPEG, PNG, HEIC) antes do upload
 * - Mantém outros tipos de arquivo inalterados
 * - Mostra preview do arquivo selecionado
 */
const FileUploadWithCompression: React.FC<FileUploadWithCompressionProps> = ({
  label,
  file,
  onFileSelect,
  accept = '*',
  maxSizeMB = 2,
  disabled = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  /**
   * Verifica se o arquivo é uma imagem que deve ser comprimida
   */
  const shouldCompress = (file: File): boolean => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    return imageTypes.includes(file.type.toLowerCase());
  };

  /**
   * Comprime imagem usando browser-image-compression
   */
  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: maxSizeMB, // Tamanho máximo em MB
      maxWidthOrHeight: 1920, // Redimensionar para no máximo 1920px
      useWebWorker: true, // Usar Web Worker para não bloquear UI
      fileType: file.type === 'image/heic' ? 'image/jpeg' : undefined, // Converter HEIC para JPEG
    };

    try {
      console.log(`📸 Comprimindo imagem: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      const compressedFile = await imageCompression(file, options);
      console.log(`✅ Imagem comprimida: ${compressedFile.name} (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // Manter o nome original do arquivo
      return new File([compressedFile], file.name, {
        type: compressedFile.type,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('❌ Erro ao comprimir imagem:', error);
      // Em caso de erro, retorna o arquivo original
      return file;
    }
  };

  /**
   * Processa arquivo selecionado (comprime se necessário)
   */
  const processFile = async (selectedFile: File) => {
    if (!selectedFile) {
      onFileSelect(null);
      return;
    }

    // Se for imagem, comprimir antes de passar para o componente pai
    if (shouldCompress(selectedFile)) {
      const compressedFile = await compressImage(selectedFile);
      onFileSelect(compressedFile);
    } else {
      onFileSelect(selectedFile);
    }
  };

  /**
   * Handler para seleção de arquivo
   */
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handlers para drag & drop
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  /**
   * Handler para remover arquivo
   */
  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Formata tamanho do arquivo para exibição
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {file ? (
        /* Preview do arquivo selecionado */
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={disabled}
            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remover arquivo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* Botão de upload com drag & drop */
        <label
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center justify-center gap-2 p-6
            border-2 border-dashed rounded-lg
            cursor-pointer transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isDragging 
              ? 'border-blue-500 bg-blue-100 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-center">
            <span className="text-sm font-medium text-gray-700">
              {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste arquivo'}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {isDragging ? '📂 Pronto para receber' : '📎 Arraste e solte ou clique para selecionar'}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />
        </label>
      )}

      {/* Informação sobre compressão de imagens */}
      {!file && (
        <p className="text-xs text-gray-500 mt-1">
          ℹ️ Imagens grandes serão comprimidas automaticamente
        </p>
      )}
    </div>
  );
};

export default FileUploadWithCompression;
