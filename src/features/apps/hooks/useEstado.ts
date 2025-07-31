import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EstadoService } from '@/services/EstadoService'

// Hook para listar estados com paginação
export const useEstados = (
  page: number = 1, 
  limit: number = 10, 
  search: string = ''
) => {
  return useQuery({
    queryKey: ['estados', page, limit, search],
    queryFn: () => EstadoService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para buscar estado por ID
export const useEstado = (id: number) => {
  return useQuery({
    queryKey: ['estado', id],
    queryFn: () => EstadoService.getById(id),
    enabled: !!id, // Só executa se tem ID
  })
}

// Hook para criar estado
export const useCreateEstado = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ codigo, descricao }: { codigo: string, descricao: string }) => EstadoService.create(codigo, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados'] })
    },
  })
}

// Hook para atualizar estado
export const useUpdateEstado = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, codigo, descricao }: { id: number, codigo: string, descricao: string }) => 
      EstadoService.update(id, codigo, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estados'] })
      queryClient.invalidateQueries({ queryKey: ['estado', variables.id] })
    },
  })
}

// Hook para deletar estado
export const useDeleteEstado = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => EstadoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados'] })
    },
  })
}

// Hook para verificar se estado já existe
export const useCheckEstadoExisting = () => {
  return useMutation({
    mutationFn: ({ codigo, excludeId }: { codigo: string, excludeId?: number }) =>
      EstadoService.checkExisting(codigo, excludeId),
  })
}
