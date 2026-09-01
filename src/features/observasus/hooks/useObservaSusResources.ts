import { useQuery } from '@tanstack/react-query';
import { getObservaSusResources } from '../services/observasusService';
import type { ObservaSusResourceFilters } from '../types/observasus';

export function useObservaSusResources(filters: ObservaSusResourceFilters = {}) {
  return useQuery({
    queryKey: ['observasus', 'resources', filters],
    queryFn: () => getObservaSusResources(filters),
    staleTime: 2 * 60 * 1000,
  });
}
