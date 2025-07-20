import React, { useState, useCallback } from 'react';
import { Marker } from '@react-google-maps/api';
import { LatLngLiteral } from '../types';
import { MAP_CONFIG } from '@/api/maps';

interface UserLocationMarkerProps {
  userLocation: LatLngLiteral;
  hasRoute: boolean;
  isApiLoaded: boolean;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  userLocation,
  hasRoute,
  isApiLoaded
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageLoadError(true);
  }, []);

  // Só renderiza se a API estiver carregada e as classes necessárias disponíveis
  if (!isApiLoaded || !google?.maps?.Size || !google?.maps?.Point) {
    return null;
  }

  // Escolhe o ícone baseado no estado da rota e se houve erro no carregamento
  const getIconUrl = () => {
    if (imageLoadError) {
      return MAP_CONFIG.markerIcons.user.fallback;
    }
    return hasRoute 
      ? MAP_CONFIG.markerIcons.user.destination 
      : MAP_CONFIG.markerIcons.user.normal;
  };

  const iconUrl = getIconUrl();

  return (
    <Marker
      position={userLocation}
      title={hasRoute ? 'Sua posição na rota' : 'Você está aqui'}
      icon={{
        url: iconUrl,
        scaledSize: new google.maps.Size(
          MAP_CONFIG.markerIcons.user.size, 
          MAP_CONFIG.markerIcons.user.size
        ),
        anchor: new google.maps.Point(
          MAP_CONFIG.markerIcons.user.size / 2, 
          MAP_CONFIG.markerIcons.user.size
        ),
      }}
      zIndex={1000}
      animation={google.maps.Animation.DROP}
      onLoad={() => {
        // Testa se a imagem carrega corretamente
        if (!imageLoadError && iconUrl.startsWith('./')) {
          const img = new Image();
          img.onerror = handleImageError;
          img.src = iconUrl;
        }
      }}
    />
  );
};

export default UserLocationMarker;
