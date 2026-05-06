import React, { useState, useRef, useEffect } from 'react';
import type { FormField } from '@/services/FormService';
import { searchMatches } from '@/utils/searchUtils';
import imageCompression from 'browser-image-compression';
import { Upload, X, Download, MapPin, Loader2, Star, FileText, Eye, Trash2 } from 'lucide-react';
import MiniMapa from '@/features/maps/leaflet/components/MiniMapa';
import { getRuntimeApiBaseOrigin } from '@/config/runtimeApiBase';
import { clampNoteInRange } from '@/utils/linearScaleNote';

interface SpecialFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Chamado quando o processamento/upload do arquivo inicia ou termina (para desabilitar envio do formulário). */
  onUploadingChange?: (uploading: boolean) => void;
}

// ========== FILE UPLOAD (múltiplos arquivos, barra de progresso, download/visualizar – estilo DAE) ==========
const maxSizeMBCompress = 2;
type FileValueItem = { name: string; type: string; size: number; base64: string; uploadedAt?: string };

function normalizeFileValue(value: any): FileValueItem[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v): v is FileValueItem => v && typeof v.base64 === 'string');
  if (value.base64) return [value as FileValueItem];
  return [];
}

export const FileUploadField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
  onUploadingChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const acceptedTypes = field.accept || 'image/*,.pdf,.doc,.docx';
  const maxSizeBytes = field.maxSize ?? 10 * 1024 * 1024;
  const maxFiles = Math.min(Math.max(field.maxFiles ?? 10, 1), 10);

  const list = normalizeFileValue(value);
  const totalBytes = list.reduce((s, f) => s + (f.size || 0), 0);
  const percentage = maxSizeBytes > 0 ? Math.min((totalBytes / maxSizeBytes) * 100, 100) : 0;

  useEffect(() => {
    if (!uploading) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploading]);

  const shouldCompress = (file: File): boolean => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    return imageTypes.includes(file.type.toLowerCase());
  };

  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: maxSizeMBCompress,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type === 'image/heic' ? 'image/jpeg' : undefined,
      };
      const compressed = await imageCompression(file, options);
      return new File([compressed], file.name, { type: compressed.type, lastModified: Date.now() });
    } catch {
      return file;
    }
  };

  const fileToItem = (file: File, base64: string): FileValueItem => ({
    name: file.name,
    type: file.type,
    size: file.size,
    base64,
    uploadedAt: new Date().toISOString(),
  });

  const processFile = async (file: File) => {
    if (list.length >= maxFiles) {
      alert(`Máximo de ${maxFiles} arquivo(s) permitido(s).`);
      return;
    }
    if (file.size > maxSizeBytes) {
      alert(`Arquivo muito grande! Tamanho máximo total: ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB`);
      return;
    }
    const newTotal = totalBytes + file.size;
    if (newTotal > maxSizeBytes) {
      alert(`O tamanho total dos anexos não pode passar ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB. Atual: ${(totalBytes / 1024 / 1024).toFixed(2)}MB.`);
      return;
    }
    try {
      setUploading(true);
      onUploadingChange?.(true);
      let toRead = file;
      if (shouldCompress(file)) toRead = await compressImage(file);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(toRead);
      });
      onChange([...list, fileToItem(toRead, base64)]);
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      alert('Erro ao processar o arquivo');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) setIsDragging(true);
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
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const handleRemove = (index: number) => {
    const next = list.filter((_, i) => i !== index);
    onChange(next.length ? next : null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = (item: FileValueItem) => {
    try {
      const link = document.createElement('a');
      link.href = item.base64;
      link.download = item.name || 'arquivo';
      link.click();
    } catch {
      window.open(item.base64, '_blank');
    }
  };

  const handleView = (item: FileValueItem) => {
    if (item.type?.startsWith('image/')) {
      window.open(item.base64, '_blank');
    } else {
      handleDownload(item);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const maxSizeMB = maxSizeBytes / (1024 * 1024);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.helpText && (
        <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
      )}

      {/* Barra de progresso (estilo DAE) */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-blue-900 font-medium">
            📎 Anexos: {list.length}/{maxFiles}
          </p>
          <p className="text-sm text-blue-900 font-medium">
            {(totalBytes / 1024 / 1024).toFixed(2)}MB / {maxSizeMB.toFixed(0)}MB
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              percentage < 50 ? 'bg-green-500' : percentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-blue-700 mt-2">
          💡 Máximo de {maxFiles} arquivo(s), tamanho total até {maxSizeMB.toFixed(0)}MB
        </p>
      </div>

      {/* Lista de arquivos com Download / Visualizar / Remover */}
      {list.length > 0 && (
        <div className="space-y-2 mb-3">
          {list.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center justify-between bg-white p-3 rounded-xl border-2 border-gray-200 hover:border-blue-200 shadow-sm"
            >
              <div className="flex items-center gap-3 truncate min-w-0">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleView(item)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title={item.type?.startsWith('image/') ? 'Visualizar' : 'Baixar'}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zona de adicionar (só se ainda pode adicionar) */}
      {list.length < maxFiles && totalBytes < maxSizeBytes && (
        <label
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed
            transition-all duration-200 cursor-pointer
            ${disabled || uploading ? 'opacity-60 cursor-not-allowed' : ''}
            ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}
          `}
        >
          <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-center">
            <span className="text-sm font-medium text-gray-700">
              {uploading ? 'Processando...' : isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste para adicionar'}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Tipos: {acceptedTypes.replace(/\*/g, 'todos')} · Máx. {maxSizeMB.toFixed(0)}MB total · até {maxFiles} arquivo(s)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
        </label>
      )}

      {list.length < maxFiles && (
        <p className="text-xs text-gray-500 mt-2">
          ℹ️ Imagens podem ser comprimidas automaticamente
        </p>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== ASSINATURA DIGITAL (Dispositivo = canvas + toque | Gov.br = API) ==========
export type SignatureValue =
  | string
  | { type: 'govbr'; signatureBase64: string; certificatePem?: string; signedAt?: string };

function isGovBrSignature(value: any): value is { type: 'govbr'; signatureBase64: string; certificatePem?: string; signedAt?: string } {
  return value && typeof value === 'object' && value.type === 'govbr' && typeof value.signatureBase64 === 'string';
}

export const SignatureField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signingMode, setSigningMode] = useState<'device' | 'govbr'>(() =>
    isGovBrSignature(value) ? 'govbr' : 'device'
  );
  const [govBrLoading, setGovBrLoading] = useState(false);
  const [govBrError, setGovBrError] = useState<string | null>(null);

  useEffect(() => {
    if (value && canvasRef.current && typeof value === 'string') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = value;
      }
    }
  }, []);

  const getCoords = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || signingMode !== 'device') return;
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const { x, y } = getCoords(canvas, e.clientX, e.clientY);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const { x, y } = getCoords(canvas, e.clientX, e.clientY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || signingMode !== 'device') return;
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const touch = e.touches[0];
    if (ctx && canvas && touch) {
      const { x, y } = getCoords(canvas, touch.clientX, touch.clientY);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const touch = e.touches[0];
    if (ctx && canvas && touch) {
      const { x, y } = getCoords(canvas, touch.clientX, touch.clientY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    if (signingMode === 'govbr') {
      onChange(null);
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange(null);
    }
  };

  const startGovBrSign = async () => {
    if (disabled) return;
    setGovBrError(null);
    setGovBrLoading(true);
    try {
      const baseUrl = getRuntimeApiBaseOrigin();
      const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname + window.location.search);
      const state = encodeURIComponent(JSON.stringify({ fieldKey: field.key, redirectUri: window.location.href }));
      const url = `${baseUrl}/api/forms/govbr-signature/authorize?redirect_uri=${redirectUri}&state=${state}`;
      window.location.href = url;
    } catch (err: any) {
      setGovBrError(err?.message || 'Erro ao iniciar assinatura Gov.br');
      setGovBrLoading(false);
    }
  };

  const hasValue = value != null && (typeof value === 'string' ? value.length > 0 : isGovBrSignature(value));

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Escolha do método: Dispositivo ou Gov.br (cards estilo DAE) */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          type="button"
          onClick={() => { setSigningMode('device'); setGovBrError(null); if (isGovBrSignature(value)) onChange(null); }}
          disabled={disabled}
          className={`rounded-xl border-2 p-3 text-left transition flex items-center gap-2 ${
            signingMode === 'device'
              ? 'border-blue-600 bg-blue-50 text-blue-800'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${disabled ? 'opacity-60' : ''}`}
        >
          <span className="text-xl">📱</span>
          <span className="font-medium">Dispositivo</span>
          <span className="text-xs text-gray-500 ml-auto">Desenhar na tela</span>
        </button>
        <button
          type="button"
          onClick={() => { setSigningMode('govbr'); setGovBrError(null); if (typeof value === 'string') onChange(null); }}
          disabled={disabled}
          className={`rounded-xl border-2 p-3 text-left transition flex items-center gap-2 ${
            signingMode === 'govbr'
              ? 'border-blue-600 bg-blue-50 text-blue-800'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${disabled ? 'opacity-60' : ''}`}
        >
          <span className="text-xl">🏛️</span>
          <span className="font-medium">Gov.br</span>
          <span className="text-xs text-gray-500 ml-auto">Certificado digital</span>
        </button>
      </div>

      {signingMode === 'device' && (
        <>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className="w-full bg-white cursor-crosshair touch-none"
              style={{ touchAction: 'none' }}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={clearSignature}
              disabled={disabled}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Limpar
            </button>
          </div>
        </>
      )}

      {signingMode === 'govbr' && (
        <div className="space-y-2">
          {hasValue && isGovBrSignature(value) && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              ✓ Assinado com Gov.br
              {value.signedAt && (
                <span className="block text-xs text-green-600 mt-1">
                  Em {new Date(value.signedAt).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={startGovBrSign}
            disabled={disabled || govBrLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1351b4] text-white hover:bg-[#0d3d8a] disabled:opacity-50 flex items-center gap-2"
          >
            {govBrLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecionando…
              </>
            ) : (
              <>Assinar com Gov.br</>
            )}
          </button>
          {govBrError && <p className="text-red-500 text-sm">{govBrError}</p>}
          <p className="text-xs text-gray-500">
            Requer identidade Gov.br Prata ou Ouro. Você será redirecionado para autenticar.
          </p>
        </div>
      )}

      {signingMode === 'govbr' && hasValue && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={clearSignature}
            disabled={disabled}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Limpar assinatura
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== GEOLOCALIZAÇÃO (lat/long + minimapa – padrão qualificação estabelecimentos) ==========
export const GeoLocationField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [latInput, setLatInput] = useState(() =>
    value?.latitude != null ? String(value.latitude) : ''
  );
  const [lngInput, setLngInput] = useState(() =>
    value?.longitude != null ? String(value.longitude) : ''
  );

  useEffect(() => {
    if (value?.latitude != null && value?.longitude != null) {
      setLatInput(String(value.latitude));
      setLngInput(String(value.longitude));
    } else {
      setLatInput('');
      setLngInput('');
    }
  }, [value?.latitude, value?.longitude]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador');
      return;
    }
    setLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
        setLoading(false);
      },
      (err) => {
        setLocationError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    onChange({
      latitude: lat,
      longitude: lng,
      timestamp: new Date().toISOString(),
    });
  };

  const commitInputs = () => {
    const lat = parseFloat(latInput.replace(/,/g, '.'));
    const lng = parseFloat(lngInput.replace(/,/g, '.'));
    if (latInput === '' && lngInput === '') {
      onChange(null);
      return;
    }
    if (!isNaN(lat) && !isNaN(lng)) {
      onChange({ latitude: lat, longitude: lng, timestamp: new Date().toISOString() });
    }
  };

  const hasValidCoords = value?.latitude != null && value?.longitude != null;
  const googleMapsUrl = hasValidCoords
    ? `https://www.google.com/maps?q=${value.latitude},${value.longitude}`
    : null;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex.: -1.4558"
                value={latInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/,/g, '.');
                  if (v === '' || /^-?\d*\.?\d*$/.test(v)) setLatInput(v);
                }}
                onBlur={commitInputs}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex.: -48.4902"
                value={lngInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/,/g, '.');
                  if (v === '' || /^-?\d*\.?\d*$/.test(v)) setLngInput(v);
                }}
                onBlur={commitInputs}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={disabled || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Obtendo localização...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Obter minha localização
                </>
              )}
            </button>
            {googleMapsUrl && (
              <>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-1"
                >
                  Ver no Google Maps
                </a>
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  disabled={disabled}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Remover
                </button>
              </>
            )}
          </div>
          {locationError && <p className="text-red-500 text-sm">{locationError}</p>}
        </div>
        <div className="min-h-[300px] rounded-lg overflow-hidden border border-gray-200">
          <MiniMapa
            initialLat={value?.latitude != null ? String(value.latitude) : undefined}
            initialLng={value?.longitude != null ? String(value.longitude) : undefined}
            onLocationSelect={handleLocationSelect}
            className="h-full min-h-[300px] w-full"
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== AUTOCOMPLETE AVANÇADO ==========
export const AutocompleteField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm && searchTerm.length >= (field.minChars || 2)) {
      fetchSuggestions(searchTerm);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  const fetchSuggestions = async (term: string) => {
    try {
      setLoading(true);

      // Se tiver URL de API customizada
      if (field.autocompleteUrl) {
        const response = await fetch(`${field.autocompleteUrl}?q=${encodeURIComponent(term)}`);
        const data = await response.json();
        setSuggestions(data);
      } else {
        // Filtrar nas opções locais (ignora maiúsculas, acentos, cedilhas)
        const filtered = (field.options || [])
          .filter(opt => searchMatches(opt.label, term))
          .map(opt => opt.label)
          .slice(0, 10);
        setSuggestions(filtered);
      }
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: string) => {
    setSearchTerm(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="mb-4 relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setShowSuggestions(true)}
        disabled={disabled}
        placeholder={field.placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />

      {showSuggestions && suggestions.length > 0 && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSuggestions(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading && (
              <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            )}
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </>
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== COLOR PICKER ==========
export const ColorPickerField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const presetColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AAB7B8'
  ];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 w-20 border-2 border-gray-300 rounded cursor-pointer disabled:opacity-50"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          disabled={disabled}
          maxLength={7}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Cores pré-definidas */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            disabled={disabled}
            className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform disabled:opacity-50"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== SLIDER (range) ==========
export const SliderField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const min = field.min || 0;
  const max = field.max || 100;
  const step = field.step || 1;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value || min}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
        />
        <span className="text-lg font-semibold text-gray-900 w-16 text-right">
          {value || min}
        </span>
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== STAR RATING ==========
export const StarRatingField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const maxStars = field.maxStars || 5;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: maxStars }).map((_, index) => {
            const starValue = index + 1;
            const isFilled = starValue <= (hoverRating || value || 0);
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => onChange(starValue)}
                onMouseEnter={() => !disabled && setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={disabled}
                className="focus:outline-none disabled:opacity-50 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    isFilled
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-none text-gray-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
        
        {value && (
          <span className="text-sm font-medium text-gray-700">
            {value} / {maxStars}
          </span>
        )}
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

function linearScaleLabelByValue(field: FormField, low: number, high: number): Map<number, string> {
  const m = new Map<number, string>();
  if (field.scalePointLabels && field.scalePointLabels.length > 0) {
    for (const r of field.scalePointLabels) {
      const v = clampNoteInRange(Number(r.value), low, high, low);
      const t = String(r.label ?? '').trim();
      if (t) m.set(v, t);
    }
    return m;
  }
  const lo = (field.scaleLowLabel || '').trim();
  const hi = (field.scaleHighLabel || '').trim();
  if (lo) m.set(low, lo);
  if (hi) m.set(high, hi);
  return m;
}

// ========== LINEAR SCALE (valores discretos, rótulos por nota) ==========
export const LinearScaleField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const rawMin = Number(field.min ?? 1);
  const rawMax = Number(field.max ?? 5);
  const low = Math.min(Math.floor(rawMin), Math.floor(rawMax));
  const high = Math.max(Math.floor(rawMin), Math.floor(rawMax));
  const step = Math.max(1, Math.floor(Number(field.step) || 1));

  const ticks: number[] = [];
  for (let v = low; v <= high; v += step) {
    ticks.push(v);
    if (ticks.length > 24) break;
  }

  const labelByValue = linearScaleLabelByValue(field, low, high);
  const selected =
    value === '' || value === undefined || value === null ? null : Number(value);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.helpText ? <p className="text-xs text-gray-600 mb-2">{field.helpText}</p> : null}

      <div className="rounded-lg border border-gray-200 bg-gray-50/90 px-3 py-4">
        <div className="overflow-x-auto pb-1">
          <div
            className="flex flex-nowrap justify-between gap-2 min-w-min px-1"
            role="radiogroup"
            aria-label={field.label}
          >
            {ticks.map((n) => {
              const isSel = selected !== null && Number.isFinite(selected) && selected === n;
              const colLabel = labelByValue.get(n) || '';
              return (
                <div key={n} className="flex flex-col items-center gap-1 flex-1 min-w-[2.25rem]">
                  <span
                    className="text-[10px] text-center leading-tight text-gray-600 max-w-[6rem] min-h-[2.5rem] flex items-end justify-center px-0.5"
                    title={colLabel || undefined}
                  >
                    {colLabel}
                  </span>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSel}
                    aria-label={colLabel ? `${n}: ${colLabel}` : String(n)}
                    disabled={disabled}
                    onClick={() => onChange(n)}
                    className={`h-9 w-9 shrink-0 rounded-full border-2 text-xs font-semibold tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 ${
                      isSel
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-gray-300 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50/60'
                    }`}
                  >
                    {n}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {ticks.length >= 24 ? (
          <p className="text-[11px] text-amber-800 mt-2">
            Intervalo grande: mostrando os primeiros valores. Ajuste mínimo, máximo ou passo no editor.
          </p>
        ) : null}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== GOOGLE MAPS ADDRESS SEARCH ==========
export const GoogleMapsAddressField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Nota: Requer Google Maps API Key configurada
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      
      // Usar Google Places Autocomplete API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&language=pt-BR&components=country:br`
      );
      
      const data = await response.json();
      
      if (data.predictions) {
        setSuggestions(data.predictions);
      }
    } catch (err) {
      console.error('Erro ao buscar endereço:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (placeId: string, description: string) => {
    try {
      // Buscar detalhes do lugar
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}&language=pt-BR`
      );
      
      const data = await response.json();
      const place = data.result;

      onChange({
        address: description,
        placeId: placeId,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        formattedAddress: place.formatted_address,
        addressComponents: place.address_components
      });

      setSearchTerm(description);
      setShowSuggestions(false);
    } catch (err) {
      console.error('Erro ao obter detalhes do endereço:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchAddress(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="mb-4 relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type="text"
          value={value?.address || searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          disabled={disabled}
          placeholder="Digite o endereço para buscar..."
          className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSuggestions(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelect(suggestion.place_id, suggestion.description)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0"
              >
                <MapPin className="inline h-4 w-4 text-gray-400 mr-2" />
                {suggestion.description}
              </button>
            ))}
          </div>
        </>
      )}

      {!GOOGLE_API_KEY && (
        <p className="text-yellow-600 text-xs mt-1">
          ⚠️ Google Maps API Key não configurada. Defina VITE_GOOGLE_MAPS_API_KEY
        </p>
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== ADDRESS FIELD (Endereço com CEP BrasilAPI) ==========
export const AddressField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  // Campos configuráveis - quais campos devem aparecer
  const enabledFields = field.addressFields || ['cep', 'state', 'city', 'street', 'neighborhood', 'number', 'complement', 'reference'];
  
  // Valor padrão
  const addressData = value || {
    cep: '',
    state: '',
    city: '',
    street: '',
    neighborhood: '',
    number: '',
    complement: '',
    reference: ''
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    // Atualiza o CEP
    onChange({ ...addressData, cep: cleanCep });
    setCepError('');

    // Se o CEP tiver 8 dígitos, busca os dados
    if (cleanCep.length === 8) {
      try {
        setLoading(true);
        const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        
        if (!response.ok) {
          throw new Error('CEP não encontrado');
        }

        const data = await response.json();
        
        // Preenche os campos automaticamente
        onChange({
          ...addressData,
          cep: cleanCep,
          state: data.state || '',
          city: data.city || '',
          street: data.street || '',
          neighborhood: data.neighborhood || ''
        });
      } catch (err) {
        setCepError('CEP não encontrado');
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFieldChange = (fieldName: string, fieldValue: string) => {
    onChange({ ...addressData, [fieldName]: fieldValue });
  };

  const formatCep = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-3">
        {/* CEP */}
        {enabledFields.includes('cep') && (
          <div className="relative">
            <label className="block text-xs text-gray-600 mb-1">CEP</label>
            <div className="relative">
              <input
                type="text"
                value={formatCep(addressData.cep || '')}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                disabled={disabled || field.disabled}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  cepError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                } ${disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>
            {cepError && <p className="text-red-500 text-xs mt-1">{cepError}</p>}
          </div>
        )}

        {/* Estado e Cidade na mesma linha */}
        <div className="grid grid-cols-2 gap-3">
          {enabledFields.includes('state') && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Estado</label>
              <input
                type="text"
                value={addressData.state || ''}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                placeholder="UF"
                maxLength={2}
                disabled={disabled || field.disabled}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 ${
                  disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          )}

          {enabledFields.includes('city') && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cidade</label>
              <input
                type="text"
                value={addressData.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="Cidade"
                disabled={disabled || field.disabled}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 ${
                  disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          )}
        </div>

        {/* Endereço */}
        {enabledFields.includes('street') && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Endereço</label>
            <input
              type="text"
              value={addressData.street || ''}
              onChange={(e) => handleFieldChange('street', e.target.value)}
              placeholder="Rua, Avenida, etc."
              disabled={disabled || field.disabled}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 ${
                disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>
        )}

        {/* Bairro e Número na mesma linha */}
        <div className="grid grid-cols-2 gap-3">
          {enabledFields.includes('neighborhood') && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bairro</label>
              <input
                type="text"
                value={addressData.neighborhood || ''}
                onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
                placeholder="Bairro"
                disabled={disabled || field.disabled}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 ${
                  disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          )}

          {enabledFields.includes('number') && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Número</label>
              <input
                type="text"
                value={addressData.number || ''}
                onChange={(e) => handleFieldChange('number', e.target.value)}
                placeholder="Nº"
                disabled={disabled || field.disabled}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 ${
                  disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          )}
        </div>

        {/* Complemento */}
        {enabledFields.includes('complement') && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Complemento</label>
            <input
              type="text"
              value={addressData.complement || ''}
              onChange={(e) => handleFieldChange('complement', e.target.value)}
              placeholder="Apto, Bloco, etc."
              disabled={disabled || field.disabled}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 ${
                disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>
        )}

        {/* Ponto de Referência */}
        {enabledFields.includes('reference') && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              <MapPin className="inline w-3 h-3 mr-1" />
              Ponto de Referência
            </label>
            <input
              type="text"
              value={addressData.reference || ''}
              onChange={(e) => handleFieldChange('reference', e.target.value)}
              placeholder="Ex: Próximo ao mercado, ao lado da praça..."
              disabled={disabled || field.disabled}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 ${
                disabled || field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>
        )}
      </div>

      {field.helpText && <p className="text-xs text-gray-500 mt-2">{field.helpText}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
