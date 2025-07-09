// components/sections/AttachmentsSection.tsx - Seção de anexos para o formulário
import React from 'react';
import { Paperclip, ChevronDown, ChevronRight } from 'lucide-react';
import FileUploadSection from '../FileUploadSection';
import { FormSectionProps, ArquivoFormulario } from '@/features/notificationForms/types/index2';

interface AttachmentsSectionProps extends Omit<FormSectionProps, 'handleCheckboxChange' | 'handleContatoLocalChange' | 'handleChange' | 'setFormData' | 'isLoadingMunicipios' | 'paisOptions'> {
  // Esta função deve ser a handleArquivosChange do useNotificationForm hook
  // Ela gerencia a lista completa de arquivos e sincroniza com window.fileStorage
  onArquivosChange: (arquivos: ArquivoFormulario[]) => void;
  // Função para remover arquivos individuais (também usa handleArquivosChange internamente)
  onRemoveFile: (id: string) => void;
}

const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  formData,
  errors,
  handleValidationError,
  isExpanded,
  toggleSection,
  onArquivosChange,
  onRemoveFile // Receba a nova prop
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Cabeçalho da seção - seguindo o padrão das outras seções */}
      <button
        type="button"
        onClick={toggleSection}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Paperclip className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Arquivos Anexos
            </h3>
            <p className="text-sm text-gray-500">
              Adicione documentos relacionados ao caso
              {formData.arquivos && formData.arquivos.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {formData.arquivos.length} arquivo{formData.arquivos.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-6 space-y-6">
          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="font-medium text-blue-900 mb-2">ℹ️ Sobre os anexos:</div>
            <ul className="space-y-1 text-blue-800">
              <li>• Anexe documentos relacionados ao caso (relatórios, exames, imagens, etc.)</li>
              <li>• Arquivos aceitos: PDF, Word, Excel, PNG, JPEG, TXT</li>
              <li>• Máximo: 10 arquivos por ficha</li>
              <li>• Tamanho máximo: 10MB por arquivo, 50MB total</li>
            </ul>
          </div>

          <FileUploadSection
            arquivos={formData.arquivos || []}
            // ✅ Esta prop onChange recebe a handleArquivosChange do hook
            // que gerencia arquivos de forma centralizada e sincroniza com window.fileStorage
            onChange={onArquivosChange}
            // ✅ Função para remover arquivos individuais
            onRemove={onRemoveFile}
            onValidationError={(error) => handleValidationError('arquivos', error)}
            error={errors.arquivos}
          />
        </div>
      )}
    </div>
  );
};

export default AttachmentsSection;