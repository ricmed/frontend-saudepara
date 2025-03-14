export interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  
  export interface Local {
    id: string;
    nome: string;
    endereco: string;
    lat: number;
    lng: number;
    natureza: 'PÚBLICO' | 'PRIVADO';
  }

  export type SupportedLanguage = 'pt-BR' | 'en-US' | 'es-ES';

  export type GeolocationErrorType = 
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "BROWSER_NOT_SUPPORTED"
  | "DEFAULT";

export interface GeolocationConfig {
  options: PositionOptions;
  errors: Record<GeolocationErrorType, string>;
}