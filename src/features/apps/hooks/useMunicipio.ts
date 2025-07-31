// Hook para Município
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MunicipioService } from '@/services/MunicipioService'

export const useMunicipios = (page: number = 1, limit: number = 10, search: string = '', estadoId?: number) => {
  return useQuery({
    queryKey: ['municipios', page, limit, search, estadoId],
    queryFn: () => MunicipioService.getAllPaginated(page, limit, search, estadoId),
    staleTime: 1000 * 60 * 5,
  })
}

export const useMunicipio = (id: number) => {
  return useQuery({
    queryKey: ['municipio', id],
    queryFn: () => MunicipioService.getById(id),
    enabled: !!id,
  })
}

export const useCreateMunicipio = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ codigo, descricao, estadoId }: { codigo: string, descricao: string, estadoId: number }) => 
      MunicipioService.create(codigo, descricao, estadoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['municipios'] }),
  })
}

export const useUpdateMunicipio = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, codigo, descricao, estadoId }: { id: number, codigo: string, descricao: string, estadoId: number }) => 
      MunicipioService.update(id, codigo, descricao, estadoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['municipios'] })
      queryClient.invalidateQueries({ queryKey: ['municipio', variables.id] })
    },
  })
}

export const useDeleteMunicipio = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => MunicipioService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['municipios'] }),
  })
}
