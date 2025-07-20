import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface MapaFilters {
  tipo: string;
  natureza: string;
  radius: number;
}

export const useMapaFilters = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<MapaFilters>({
    tipo: 'todos',
    natureza: 'todos',
    radius: 5000
  });

  useEffect(() => {
    const tipoParam = searchParams.get('tipo');
    const naturezaParam = searchParams.get('natureza');
    const radiusParam = searchParams.get('radius');

    // Mapeia os tipos da URL para os tipos do sistema
    const tipoMapping: Record<string, string> = {
      'vacinacao': 'POSTO DE VACINAÇÃO',
      'alimentacao': 'RESTAURANTE',
      'lazer': 'PARQUE',
      'cultura': 'MUSEU',
      'saude': 'POSTO DE SAÚDE',
      'hospitais': 'HOSPITAL',
      'todos': 'todos'
    };

    setFilters({
      tipo: tipoParam ? (tipoMapping[tipoParam] || tipoParam) : 'todos',
      natureza: naturezaParam || 'todos',
      radius: radiusParam ? parseInt(radiusParam) : 5000
    });
  }, [searchParams]);

  return filters;
};
