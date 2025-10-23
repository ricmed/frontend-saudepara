import { useNavigate } from 'react-router-dom';

interface UseMapaNavigationOptions {
  tipo?: string;
  natureza?: string;
  radius?: number;
  fullScreen?: boolean;
}

export const useMapaNavigation = () => {
  const navigate = useNavigate();

  const navigateToMapa = (options: UseMapaNavigationOptions = {}) => {
    const { tipo, natureza, radius, fullScreen = false } = options;
    
    // Constrói os parâmetros da URL
    const params = new URLSearchParams();
    if (tipo && tipo !== 'todos') params.set('tipo', tipo);
    if (natureza && natureza !== 'todos') params.set('natureza', natureza);
    if (radius) params.set('radius', radius.toString());

    const queryString = params.toString();
    const basePath = fullScreen ? '/mapa/fullscreen' : '/mapa';
    const finalPath = queryString ? `${basePath}?${queryString}` : basePath;

    navigate(finalPath);
  };

  const navigateToMapaFullScreen = (options: Omit<UseMapaNavigationOptions, 'fullScreen'> = {}) => {
    navigateToMapa({ ...options, fullScreen: true });
  };

  return {
    navigateToMapa,
    navigateToMapaFullScreen
  };
};
