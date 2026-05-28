import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useMapProvider } from '@/features/maps/leaflet/hooks/useMapProvider';
import { TILE_OPTIONS } from '@/features/maps/leaflet/config/tileProviders';

export interface MiniMapaResolvedAddress {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  estadoUf?: string;
  paisCodigo?: string;
}

type SearchResultItem = {
  id: string;
  place_name: string;
  center: [number, number];
  source: 'mapbox' | 'nominatim';
  feature?: any;
  nominatimAddress?: any;
};

interface MiniMapaProps {
  onLocationSelect: (lat: number, lng: number, meta?: { source: 'manual-map' | 'manual-search' }) => void;
  onAddressResolved?: (address: MiniMapaResolvedAddress) => void;
  initialLat?: string;
  initialLng?: string;
  className?: string;
  enableSearch?: boolean;
}

const MiniMapa: React.FC<MiniMapaProps> = ({
  onLocationSelect,
  onAddressResolved,
  initialLat,
  initialLng,
  className = "h-[300px] w-full",
  enableSearch = true,
}) => {
  // Para formulários, priorizamos Mapbox quando disponível.
  const { tileProvider, currentProvider, setCurrentProvider, isAvailable, mapboxApiKey } = useMapProvider({
    defaultProvider: 'mapbox',
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const lastUserInteractionAtRef = useRef<number>(0);
  const handleMapPickRef = useRef<(lat: number, lng: number) => void>(() => {});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const skipNextSearchRef = useRef(false);
  const searchCacheRef = useRef<Map<string, SearchResultItem[]>>(new Map());
  const inFlightSearchKeyRef = useRef<string>('');
  const searchSessionTokenRef = useRef<string>(`${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const searchRequestSeqRef = useRef(0);
  const reverseRequestSeqRef = useRef(0);

  const fetchWithRetryAfter = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    const response = await fetch(url, init);
    if (response.status !== 429) return response;
    const retryAfterRaw = response.headers.get('Retry-After');
    const retryAfterSeconds = Number(retryAfterRaw);
    const waitMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? Math.min(retryAfterSeconds * 1000, 5000)
      : 1200;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return fetch(url, init);
  }, []);

  const normalizeMapboxAddress = useCallback((feature: any, lat: number, lng: number): MiniMapaResolvedAddress => {
    const context = Array.isArray(feature?.context) ? feature.context : [];
    const pickContext = (prefix: string) => context.find((c: any) => String(c?.id || '').startsWith(`${prefix}.`));
    const region = pickContext('region');
    const place = pickContext('place');
    const country = pickContext('country');
    const postcode = pickContext('postcode');
    const neighborhood = pickContext('neighborhood') ?? pickContext('locality') ?? pickContext('district');
    const estadoUf =
      String(region?.short_code || '')
        .toUpperCase()
        .split('-')
        .pop() || '';
    const paisCodigo = String(country?.short_code || '').toUpperCase();
    const cep = String(postcode?.text || '').replace(/\D/g, '').slice(0, 8);

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: feature?.place_name || '',
      cep: cep || undefined,
      logradouro: feature?.text || undefined,
      numero: feature?.address ? String(feature.address) : undefined,
      bairro: neighborhood?.text || undefined,
      municipio: place?.text || undefined,
      estadoUf: estadoUf || undefined,
      paisCodigo: paisCodigo || undefined,
    };
  }, []);

  const normalizeNominatimAddress = useCallback((address: any, lat: number, lng: number, displayName?: string): MiniMapaResolvedAddress => {
    const cep = String(address?.postcode || '').replace(/\D/g, '').slice(0, 8);
    const road = String(address?.road || address?.pedestrian || address?.footway || '').trim();
    const number = String(address?.house_number || '').trim();
    const bairro = String(address?.suburb || address?.neighbourhood || address?.quarter || '').trim();
    const municipio = String(address?.city || address?.town || address?.village || address?.municipality || '').trim();
    const estado = String(address?.state || '').trim();
    const countryCode = String(address?.country_code || '').toUpperCase();

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: displayName || '',
      cep: cep || undefined,
      logradouro: road || undefined,
      numero: number || undefined,
      bairro: bairro || undefined,
      municipio: municipio || undefined,
      estadoUf: estado || undefined,
      paisCodigo: countryCode || undefined,
    };
  }, []);

  const stateNameToUf = useCallback((stateName: string): string => {
    const map: Record<string, string> = {
      'ACRE': 'AC',
      'ALAGOAS': 'AL',
      'AMAPA': 'AP',
      'AMAZONAS': 'AM',
      'BAHIA': 'BA',
      'CEARA': 'CE',
      'DISTRITO FEDERAL': 'DF',
      'ESPIRITO SANTO': 'ES',
      'GOIAS': 'GO',
      'MARANHAO': 'MA',
      'MATO GROSSO': 'MT',
      'MATO GROSSO DO SUL': 'MS',
      'MINAS GERAIS': 'MG',
      'PARA': 'PA',
      'PARAIBA': 'PB',
      'PARANA': 'PR',
      'PERNAMBUCO': 'PE',
      'PIAUI': 'PI',
      'RIO DE JANEIRO': 'RJ',
      'RIO GRANDE DO NORTE': 'RN',
      'RIO GRANDE DO SUL': 'RS',
      'RONDONIA': 'RO',
      'RORAIMA': 'RR',
      'SANTA CATARINA': 'SC',
      'SAO PAULO': 'SP',
      'SERGIPE': 'SE',
      'TOCANTINS': 'TO',
    };
    const normalized = String(stateName || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
    return map[normalized] || '';
  }, []);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!mapboxApiKey || !onAddressResolved) return;
      const requestSeq = ++reverseRequestSeqRef.current;
      try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(
          mapboxApiKey,
        )}&types=address,postcode,place,region,country,neighborhood,locality,district&language=pt-BR&limit=1`;
        const response = await fetchWithRetryAfter(endpoint);
        if (!response.ok) throw new Error('mapbox reverse geocode failed');
        const payload = await response.json();
        const feature = Array.isArray(payload?.features) ? payload.features[0] : null;
        if (!feature) throw new Error('mapbox reverse geocode empty');
        if (requestSeq === reverseRequestSeqRef.current) {
          onAddressResolved(normalizeMapboxAddress(feature, lat, lng));
        }
      } catch {
        // Fallback para Nominatim quando Mapbox falhar/retornar vazio.
        try {
          const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
          const response = await fetchWithRetryAfter(endpoint, { headers: { Accept: 'application/json' } });
          if (!response.ok) return;
          const payload = await response.json();
          const normalized = normalizeNominatimAddress(payload?.address, lat, lng, payload?.display_name);
          const ufFromState = normalized.estadoUf ? stateNameToUf(normalized.estadoUf) : '';
          if (requestSeq === reverseRequestSeqRef.current) {
            onAddressResolved({ ...normalized, estadoUf: ufFromState || normalized.estadoUf });
          }
        } catch {
          // Falha de fallback não deve quebrar interação do mapa.
        }
      }
    },
    [fetchWithRetryAfter, mapboxApiKey, normalizeMapboxAddress, normalizeNominatimAddress, onAddressResolved, stateNameToUf],
  );

  const handleMapPick = useCallback(
    (lat: number, lng: number) => {
      lastUserInteractionAtRef.current = Date.now();
      onLocationSelect(lat, lng, { source: 'manual-map' });
      void reverseGeocode(lat, lng);
    },
    [onLocationSelect, reverseGeocode],
  );

  useEffect(() => {
    handleMapPickRef.current = handleMapPick;
  }, [handleMapPick]);

  const searchLocations = useCallback(
    async (query: string) => {
      if (!enableSearch) return;
      const normalized = query.trim();
      if (normalized.length < 3) {
        setSearchResults([]);
        return;
      }
      const key = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      const cached = searchCacheRef.current.get(key);
      if (cached) {
        setSearchResults(cached);
        return;
      }
      if (inFlightSearchKeyRef.current === key) return;
      const requestSeq = ++searchRequestSeqRef.current;
      try {
        inFlightSearchKeyRef.current = key;
        setIsSearching(true);
        const mapped: SearchResultItem[] = [];

        if (mapboxApiKey) {
          const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            normalized,
          )}.json?access_token=${encodeURIComponent(mapboxApiKey)}&autocomplete=true&limit=6&language=pt-BR&country=BR&session_token=${encodeURIComponent(searchSessionTokenRef.current)}`;
          const response = await fetchWithRetryAfter(endpoint);
          if (response.ok) {
            const payload = await response.json();
            const mapboxResults = Array.isArray(payload?.features) ? payload.features : [];
            mapped.push(
              ...mapboxResults
                .filter((f: any) => Array.isArray(f?.center) && f.center.length >= 2)
                .map(
                  (f: any): SearchResultItem => ({
                    id: String(f.id),
                    place_name: String(f.place_name || ''),
                    center: [Number(f.center[0]), Number(f.center[1])],
                    source: 'mapbox',
                    feature: f,
                  }),
                ),
            );
          }
        }

        if (mapped.length === 0) {
          const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
            normalized,
          )}&addressdetails=1&countrycodes=br&limit=6`;
          const response = await fetchWithRetryAfter(endpoint, { headers: { Accept: 'application/json' } });
          if (response.ok) {
            const payload = await response.json();
            const nominatimResults = Array.isArray(payload) ? payload : [];
            mapped.push(
              ...nominatimResults
                .map((r: any): SearchResultItem | null => {
                  const lat = Number(r?.lat);
                  const lng = Number(r?.lon);
                  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                  return {
                    id: String(r?.place_id ?? `${lat},${lng}`),
                    place_name: String(r?.display_name || ''),
                    center: [lng, lat],
                    source: 'nominatim',
                    nominatimAddress: r?.address,
                  };
                })
                .filter(Boolean) as SearchResultItem[],
            );
          }
        }

        searchCacheRef.current.set(key, mapped);
        if (requestSeq === searchRequestSeqRef.current) {
          setSearchResults(mapped);
        }
      } catch {
        if (requestSeq === searchRequestSeqRef.current) {
          setSearchResults([]);
        }
      } finally {
        if (inFlightSearchKeyRef.current === key) inFlightSearchKeyRef.current = '';
        if (requestSeq === searchRequestSeqRef.current) {
          setIsSearching(false);
        }
      }
    },
    [enableSearch, fetchWithRetryAfter, mapboxApiKey],
  );

  useEffect(() => {
    if (currentProvider !== 'mapbox' && isAvailable('mapbox')) {
      setCurrentProvider('mapbox');
    }
  }, [currentProvider, isAvailable, setCurrentProvider]);

  const parseCoordinate = useCallback((value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const cleaned = value.replace(/\s/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? defaultValue : parsed;
  }, []);

  // Inicializa mapa UMA VEZ para preservar viewport/zoom do usuário.
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialPosition: [number, number] = [
      parseCoordinate(initialLat, -1.4558),
      parseCoordinate(initialLng, -48.4902),
    ];

    const map = L.map(mapRef.current, {
      center: initialPosition,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      dragging: true,
    });

    const tileLayer = L.tileLayer(tileProvider.url, {
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom,
      ...TILE_OPTIONS,
    }).addTo(map);
    currentTileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    const customIcon = L.divIcon({
      html: `<div style="
        background-color: #DC2626;
        width: 20px;
        height: 20px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
    });

    const marker = L.marker(initialPosition, {
      icon: customIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      handleMapPickRef.current(position.lat, position.lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      handleMapPickRef.current(lat, lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        currentTileLayerRef.current = null;
      }
    };
  // IMPORTANT: sem depender de coordenadas/tile provider aqui.
  // Isso evita destruir/recriar mapa durante interação do usuário.
  }, [parseCoordinate]);

  // Atualiza camada de tiles sem recriar mapa.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
      currentTileLayerRef.current = null;
    }
    currentTileLayerRef.current = L.tileLayer(tileProvider.url, {
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom,
      ...TILE_OPTIONS,
    }).addTo(map);
  }, [tileProvider.url, tileProvider.attribution, tileProvider.maxZoom]);

  // Sincroniza coordenadas externas sem "roubar" controle do usuário durante arraste/ajuste.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (Date.now() - lastUserInteractionAtRef.current < 1200) return;

    const lat = parseCoordinate(initialLat, NaN);
    const lng = parseCoordinate(initialLng, NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const current = marker.getLatLng();
    const changed = Math.abs(current.lat - lat) > 0.000001 || Math.abs(current.lng - lng) > 0.000001;
    if (!changed) return;

    marker.setLatLng([lat, lng]);
    map.panTo([lat, lng], { animate: true });
  }, [initialLat, initialLng, parseCoordinate]);

  useEffect(() => {
    if (!isSearchOpen) return;
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      void searchLocations(searchTerm);
    }, 280);
    return () => clearTimeout(t);
  }, [isSearchOpen, searchLocations, searchTerm]);

  const handleSelectSearchResult = useCallback(
    (item: SearchResultItem) => {
      const center = Array.isArray(item?.center) ? item.center : null;
      if (!center || center.length < 2) return;
      const [lng, lat] = center;
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 16);
      skipNextSearchRef.current = true;
      setSearchTerm('');
      setSearchResults([]);
      setIsSearchOpen(false);
      searchSessionTokenRef.current = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      lastUserInteractionAtRef.current = Date.now();
      onLocationSelect(lat, lng, { source: 'manual-search' });
      if (onAddressResolved) {
        if (item.source === 'mapbox' && item.feature) {
          onAddressResolved(normalizeMapboxAddress(item.feature, lat, lng));
        } else {
          const normalized = normalizeNominatimAddress(item.nominatimAddress, lat, lng, item.place_name);
          const ufFromState = normalized.estadoUf ? stateNameToUf(normalized.estadoUf) : '';
          onAddressResolved({ ...normalized, estadoUf: ufFromState || normalized.estadoUf });
        }
      }
    },
    [normalizeMapboxAddress, normalizeNominatimAddress, onAddressResolved, onLocationSelect, stateNameToUf],
  );

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className={className}
        style={{ minHeight: '300px' }}
      />
      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-xs z-[1000]">
        Clique ou arraste o marcador para selecionar a localização
      </div>
      {enableSearch ? (
        <div className="absolute top-2 right-2 w-[300px] max-w-[calc(100%-1rem)] z-[1000]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Buscar endereço/local (Mapbox)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded shadow bg-white"
          />
          {isSearchOpen && searchTerm.trim().length >= 3 && (
            <div className="mt-1 max-h-56 overflow-auto rounded border border-gray-200 bg-white shadow">
              {isSearching ? (
                <div className="px-3 py-2 text-xs text-gray-500">Buscando...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500">Nenhum local encontrado.</div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    {result.place_name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default MiniMapa;
