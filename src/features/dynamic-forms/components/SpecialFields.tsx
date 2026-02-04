import React, { useState, useRef, useEffect } from 'react';
import type { FormField } from '@/services/FormService';
import { Upload, X, Download, MapPin, Loader2, Star } from 'lucide-react';

interface SpecialFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// ========== FILE UPLOAD (imagens, PDFs, documentos) ==========
export const FileUploadField: React.FC<SpecialFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Aceitar tipos de arquivo conforme configurado ou padrão
  const acceptedTypes = field.accept || 'image/*,.pdf,.doc,.docx';
  const maxSize = field.maxSize || 5 * 1024 * 1024; // 5MB padrão

  useEffect(() => {
    if (value?.base64) {
      setPreview(value.base64);
    }
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho
    if (file.size > maxSize) {
      alert(`Arquivo muito grande! Máximo: ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    try {
      setUploading(true);

      // Converter para base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        onChange({
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64,
          uploadedAt: new Date().toISOString()
        });

        // Preview para imagens
        if (file.type.startsWith('image/')) {
          setPreview(base64);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      alert('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = value?.type?.startsWith('image/');

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.helpText && (
        <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {!value ? (
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Tipos aceitos: {acceptedTypes.replace(/\*/g, 'todos')}
              <br />
              Tamanho máximo: {(maxSize / 1024 / 1024).toFixed(0)}MB
            </p>
          </div>
        ) : (
          <div>
            {isImage && preview ? (
              <div className="mb-3">
                <img 
                  src={preview} 
                  alt={value.name}
                  className="max-w-full h-auto max-h-64 mx-auto rounded border"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded mb-3">
                <Download className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">{value.type}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between bg-gray-50 rounded p-2">
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-gray-900 truncate">{value.name}</p>
                <p className="text-xs text-gray-500">
                  {(value.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== ASSINATURA DIGITAL (canvas) ==========
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

  useEffect(() => {
    if (value && canvasRef.current) {
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
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

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange(null);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full bg-white cursor-crosshair"
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
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// ========== GEOLOCALIZAÇÃO (lat/long) ==========
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
          timestamp: new Date().toISOString()
        });
        setLoading(false);
      },
      (err) => {
        setLocationError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const googleMapsUrl = value
    ? `https://www.google.com/maps?q=${value.latitude},${value.longitude}`
    : null;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {!value ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={disabled || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Obtendo localização...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Obter Localização Atual
              </>
            )}
          </button>
          {locationError && (
            <p className="text-red-500 text-sm mt-2">{locationError}</p>
          )}
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-xs text-gray-600">Latitude</label>
              <p className="text-sm font-medium">{value.latitude.toFixed(6)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-600">Longitude</label>
              <p className="text-sm font-medium">{value.longitude.toFixed(6)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={googleMapsUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 text-center"
            >
              Ver no Google Maps
            </a>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Remover
            </button>
          </div>
        </div>
      )}
      
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
        // Filtrar nas opções locais
        const filtered = (field.options || [])
          .filter(opt => opt.label.toLowerCase().includes(term.toLowerCase()))
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
