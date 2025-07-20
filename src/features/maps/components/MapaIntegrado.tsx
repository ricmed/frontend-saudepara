import React, { useEffect } from 'react';
import MapaLocais from '@/features/maps/google';
import { useMapaFilters } from '../hooks/useMapaFilters';

interface MapaIntegradoProps {
  initialTipo?: string;
  initialNatureza?: string;
  initialRadius?: number;
  className?: string;
}

const MapaIntegrado: React.FC<MapaIntegradoProps> = ({ 
  initialTipo,
  initialNatureza,
  initialRadius,
  className
}) => {
  // Usa os filtros da URL
  const filters = useMapaFilters();

  // Passa os filtros como props para o componente do mapa
  // Nota: Vamos modificar o MapaLocais para aceitar esses filtros
  return (
    <div className={className}>
      <MapaLocais 
        initialFilters={filters}
      />
    </div>
  );
};

export default MapaIntegrado;
