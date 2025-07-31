import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GeneroService } from '@/services/GeneroService'

// Hook para listar gêneros com paginação
export const useGeneros = (
  page: number = 1, 
  limit: number = 10, 
  search: string = ''
) => {
  return useQuery({
    queryKey: ['generos', page, limit, search],
    queryFn: () => GeneroService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para buscar gênero por ID
export const useGenero = (id: number) => {
  return useQuery({
    queryKey: ['genero', id],
    queryFn: () => GeneroService.getById(id),
    enabled: !!id, // Só executa se tem ID
  })
}

// Hook para criar gênero
export const useCreateGenero = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (descricao: string) => GeneroService.create(descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generos'] })
    },
  })
}

// Hook para atualizar gênero
export const useUpdateGenero = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      GeneroService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['generos'] })
      queryClient.invalidateQueries({ queryKey: ['genero', variables.id] })
    },
  })
}

// Hook para deletar gênero
export const useDeleteGenero = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => GeneroService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generos'] })
    },
  })
}

// Hook para verificar se gênero já existe
export const useCheckGeneroExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      GeneroService.checkExisting(descricao, excludeId),
  })
}
