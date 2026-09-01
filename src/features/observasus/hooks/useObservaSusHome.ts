import { useQuery } from '@tanstack/react-query';
import { getObservaSusHome } from '../services/observasusService';

export function useObservaSusHome() {
  return useQuery({
    queryKey: ['observasus', 'home'],
    queryFn: getObservaSusHome,
    staleTime: 5 * 60 * 1000,
  });
}
