// Hook para País
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PaisService } from '@/services/PaisService'

export const usePaises = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['paises', page, limit, search],
    queryFn: () => PaisService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const usePais = (id: number) => {
  return useQuery({
    queryKey: ['pais', id],
    queryFn: () => PaisService.getById(id),
    enabled: !!id,
  })
}

export const useCreatePais = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => PaisService.create(descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paises'] }),
  })
}

export const useUpdatePais = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      PaisService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paises'] })
      queryClient.invalidateQueries({ queryKey: ['pais', variables.id] })
    },
  })
}

export const useDeletePais = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => PaisService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paises'] }),
  })
}

export const useCheckPaisExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      PaisService.checkExisting(descricao, excludeId),
  })
}
