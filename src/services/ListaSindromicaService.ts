import axios from 'axios';

interface HipoteseSindromica {
  id: number;       // ID da hipótese diagnóstica
  qtd: number;      // Quantidade de sintomas relacionados  
  hipotese: string; // Descrição da hipótese
}

interface SintomaRelacionado {
  id: number;       // ID do sintoma
  sintoma: string;  // Descrição do sintoma
}

export class ListaSindromicaService {
  static async getHipotesesPorSintomas(sintomasIds: string[]): Promise<HipoteseSindromica[]> {
    try {
      // Só chama a API se houver sintomas selecionados
      if (!sintomasIds.length) {
        return [];
      }

      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      
      // Converte os IDs para números e remove duplicados
      const idsArray = [...new Set(sintomasIds.map(id => parseInt(id)))];
      
      // Usa o formato exato da URL conforme documentado
      const response = await axios.get(`${server}:${port}/api/lista-sindromica`, {
        params: { ids: idsArray.join(',') }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar hipóteses diagnósticas:', error);
      return [];
    }
  }

  static async getSintomasPorHipotese(hipoteseId: string): Promise<SintomaRelacionado[]> {
    try {
      // Validação básica
      if (!hipoteseId) {
        return [];
      }

      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      
      // Endpoint para buscar sintomas relacionados a uma hipótese
      const response = await axios.get(`${server}:${port}/api/lista-sindromica/sintomas`, {
        params: { hipotese_id: hipoteseId }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar sintomas relacionados à hipótese:', error);
      return [];
    }
  }
}