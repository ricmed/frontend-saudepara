import { useQuery } from '@tanstack/react-query';
import { getObservaSusDataStorageBySystem } from '../services/observasusService';
import type { ObservaSusResourceFilters } from '../types/observasus';

export function useObservaSusDataStorageSystem(
  systemSlug: string | undefined,
  filters: ObservaSusResourceFilters = {}
) {
  return useQuery({
    queryKey: ['observasus', 'datastorage', systemSlug, filters],
    queryFn: () => getObservaSusDataStorageBySystem(systemSlug!, filters),
    enabled: Boolean(systemSlug),
    staleTime: 2 * 60 * 1000,
  });
}
