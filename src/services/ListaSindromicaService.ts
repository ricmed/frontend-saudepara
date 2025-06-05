// ===== VERSÃO MELHORADA DO ListaSindromicaService =====

import axios from 'axios';
import indexedDBService from '@/services/indexedDB';

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

      const idsArray = [...new Set(sintomasIds.map(id => parseInt(id)))];
      let hipoteses: HipoteseSindromica[] = [];

      // ✅ VERIFICAR CACHE OFFLINE PRIMEIRO
      if (!navigator.onLine) {
        console.log('📱 Modo offline: buscando hipóteses diagnósticas em cache...');
        
        hipoteses = await this.getHipotesesOffline(idsArray);
        
        if (hipoteses.length > 0) {
          console.log(`✅ Hipóteses filtradas offline: ${hipoteses.length} registros`);
        } else {
          console.warn('Nenhuma hipótese diagnóstica encontrada offline.');
        }
      } else {
        // ✅ MODO ONLINE: usar API normal com fallback
        try {
          const server = import.meta.env.VITE_API_SERVER;
          const port = import.meta.env.VITE_API_PORT;
          
          const response = await axios.get(`${server}:${port}/api/lista-sindromica`, {
            params: { ids: idsArray.join(',') }
          });
          
          hipoteses = response.data || [];
          
          // ✅ SALVAR NO CACHE PARA USO FUTURO (formato padronizado)
          if (hipoteses.length > 0) {
            await this.salvarHipotesesNoCache(hipoteses, idsArray);
          }
          
        } catch (apiError) {
          console.warn('⚠️ API de lista sindrômica falhou, tentando cache...');
          hipoteses = await this.getHipotesesOffline(idsArray);
          
          if (hipoteses.length > 0) {
            console.log(`✅ Usando cache offline: ${hipoteses.length} hipóteses`);
          } else {
            throw apiError;
          }
        }
      }

      return hipoteses;
      
    } catch (error) {
      console.error('Erro ao buscar hipóteses diagnósticas:', error);
      return [];
    }
  }

  static async getSintomasPorHipotese(hipoteseId: string): Promise<SintomaRelacionado[]> {
    try {
      if (!hipoteseId) {
        return [];
      }

      let sintomas: SintomaRelacionado[] = [];

      // ✅ VERIFICAR CACHE OFFLINE PRIMEIRO
      if (!navigator.onLine) {
        console.log('📱 Modo offline: buscando sintomas por hipótese em cache...');
        
        sintomas = await this.getSintomasOffline(hipoteseId);
        
        if (sintomas.length > 0) {
          console.log(`✅ Sintomas encontrados offline: ${sintomas.length} registros`);
        } else {
          console.warn(`Nenhum sintoma encontrado offline para hipótese ${hipoteseId}.`);
        }
      } else {
        // ✅ MODO ONLINE: usar API normal com fallback
        try {
          const server = import.meta.env.VITE_API_SERVER;
          const port = import.meta.env.VITE_API_PORT;
          
          const response = await axios.get(`${server}:${port}/api/lista-sindromica/sintomas`, {
            params: { hipotese_id: hipoteseId }
          });
          
          sintomas = response.data || [];
          
        } catch (apiError) {
          console.warn('⚠️ API de sintomas por hipótese falhou, tentando cache...');
          sintomas = await this.getSintomasOffline(hipoteseId);
          
          if (sintomas.length > 0) {
            console.log(`✅ Usando cache offline: ${sintomas.length} sintomas`);
          } else {
            throw apiError;
          }
        }
      }

      return sintomas;
      
    } catch (error) {
      console.error('Erro ao buscar sintomas relacionados à hipótese:', error);
      return [];
    }
  }

  // ===== MÉTODOS AUXILIARES PRIVADOS =====

  /**
   * Busca hipóteses relacionadas aos sintomas no cache offline
   */
  private static async getHipotesesOffline(sintomasIds: number[]): Promise<HipoteseSindromica[]> {
    try {
      // 1. Tentar buscar dados específicos da lista sindrômica
      const listaSindromicaCache = await indexedDBService.getOpcoes('lista-sindromica');
      
      if (listaSindromicaCache && listaSindromicaCache.length > 0) {
        const hipotesesRelacionadas: HipoteseSindromica[] = [];
        
        listaSindromicaCache.forEach((item: any) => {
          if (item.sintomas && Array.isArray(item.sintomas)) {
            const sintomasComuns = item.sintomas.filter((sintoma: any) => 
              sintomasIds.includes(parseInt(sintoma.id))
            );
            
            if (sintomasComuns.length > 0) {
              hipotesesRelacionadas.push({
                id: item.id,
                qtd: sintomasComuns.length,
                hipotese: item.hipotese || item.descricao
              });
            }
          }
        });
        
        // Ordenar por quantidade de sintomas relacionados
        return hipotesesRelacionadas.sort((a, b) => b.qtd - a.qtd);
      }

      // 2. Fallback: correlação baseada em hipóteses e sintomas em cache
      return await this.correlacionarSintomasHipoteses(sintomasIds);
      
    } catch (error) {
      console.error('Erro ao buscar hipóteses offline:', error);
      return [];
    }
  }

  /**
   * Busca sintomas relacionados a uma hipótese no cache offline
   */
  private static async getSintomasOffline(hipoteseId: string): Promise<SintomaRelacionado[]> {
    try {
      const cachedDados = await indexedDBService.getOpcoes('lista-sindromica');
      
      if (cachedDados && cachedDados.length > 0) {
        const hipotese = cachedDados.find((h: any) => h.id === parseInt(hipoteseId));
        
        if (hipotese && hipotese.sintomas && Array.isArray(hipotese.sintomas)) {
          return hipotese.sintomas;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar sintomas offline:', error);
      return [];
    }
  }

  /**
   * Correlaciona sintomas com hipóteses usando cache quando dados específicos não estão disponíveis
   */
  private static async correlacionarSintomasHipoteses(sintomasIds: number[]): Promise<HipoteseSindromica[]> {
    try {
      const [sintomasCache, hipotesesCache] = await Promise.all([
        indexedDBService.getOpcoes('sintomas'),
        indexedDBService.getOpcoes('hipoteses-diagnosticas')
      ]);
      
      if (!sintomasCache || !hipotesesCache) {
        return [];
      }

      // Buscar descrições dos sintomas selecionados
      const sintomasSelecionados = sintomasCache.filter((sintoma: any) => 
        sintomasIds.includes(parseInt(sintoma.idtipo_sintoma))
      );
      
      if (sintomasSelecionados.length === 0) {
        return [];
      }

      // Extrair palavras-chave dos sintomas
      const palavrasChave = sintomasSelecionados.map((sintoma: any) => 
        this.extrairPalavrasChave(sintoma.descricao)
      ).flat();
      
      const hipotesesRelacionadas: HipoteseSindromica[] = [];

      // Buscar hipóteses que podem estar relacionadas por palavras-chave
      hipotesesCache.forEach((hipotese: any) => {
        const descricaoHipotese = (hipotese.descricao || '').toLowerCase();
        let pontuacao = 0;
        
        palavrasChave.forEach(palavra => {
          if (descricaoHipotese.includes(palavra.toLowerCase())) {
            pontuacao++;
          }
        });
        
        // Adicionar bonus por múltiplas correspondências
        if (pontuacao > 1) {
          pontuacao = Math.floor(pontuacao * 1.5);
        }
        
        if (pontuacao > 0) {
          hipotesesRelacionadas.push({
            id: hipotese.idtipo_hipotese_diag,
            qtd: pontuacao,
            hipotese: hipotese.descricao
          });
        }
      });

      // Ordenar por pontuação (maior primeiro)
      return hipotesesRelacionadas.sort((a, b) => b.qtd - a.qtd);
      
    } catch (error) {
      console.error('Erro na correlação sintomas-hipóteses:', error);
      return [];
    }
  }

  /**
   * Salva hipóteses no cache para uso offline futuro
   */
  private static async salvarHipotesesNoCache(hipoteses: HipoteseSindromica[], sintomasIds: number[]): Promise<void> {
    try {
      const existingData = await indexedDBService.getOpcoes('lista-sindromica') || [];
      const mergedData = [...existingData];
      
      hipoteses.forEach((newHipotese: any) => {
        const existingIndex = mergedData.findIndex((existing: any) => existing.id === newHipotese.id);
        
        if (existingIndex >= 0) {
          // Atualizar existente
          mergedData[existingIndex] = {
            ...mergedData[existingIndex],
            ...newHipotese,
            // Manter sintomas se existirem
            sintomas: mergedData[existingIndex].sintomas || []
          };
        } else {
          // Adicionar novo
          mergedData.push({
            ...newHipotese,
            sintomas: [] // Será preenchido quando buscar sintomas específicos
          });
        }
      });
      
      await indexedDBService.saveOpcoes('lista-sindromica', mergedData);
      
    } catch (error) {
      console.error('Erro ao salvar hipóteses no cache:', error);
    }
  }

  /**
   * Extrai palavras-chave importantes de sintomas para correlação
   */
  private static extrairPalavrasChave(descricao: string): string[] {
    if (!descricao) return [];
    
    const palavrasIgnorar = [
      'de', 'da', 'do', 'na', 'no', 'em', 'com', 'por', 'para', 'a', 'o', 'e', 'ou',
      'que', 'se', 'não', 'mas', 'como', 'mais', 'uma', 'um', 'sua', 'seu', 'dos', 'das'
    ];
    
    return descricao.toLowerCase()
      .split(/[\s,.-]+/)
      .filter(palavra => 
        palavra.length > 3 && 
        !palavrasIgnorar.includes(palavra) &&
        !/^\d+$/.test(palavra) // Excluir números puros
      )
      .slice(0, 10); // Limitar a 10 palavras mais relevantes
  }

  // ===== MÉTODOS PÚBLICOS ADICIONAIS =====

  /**
   * Verifica se há dados sindrômicos disponíveis offline
   */
  static async temDadosOffline(): Promise<boolean> {
    try {
      const cached = await indexedDBService.getOpcoes('lista-sindromica');
      return !!(cached && cached.length > 0);
    } catch {
      return false;
    }
  }

  /**
   * Limpa dados sindrômicos do cache
   */
  static async limparCache(): Promise<void> {
    try {
      await indexedDBService.saveOpcoes('lista-sindromica', []);
      console.log('✅ Cache da lista sindrômica limpo');
    } catch (error) {
      console.error('Erro ao limpar cache da lista sindrômica:', error);
    }
  }

  /**
   * Estatísticas do cache offline
   */
  static async getEstatisticasCache(): Promise<{hipoteses: number, temSintomas: number}> {
    try {
      const cached = await indexedDBService.getOpcoes('lista-sindromica') || [];
      const temSintomas = cached.filter((item: any) => item.sintomas && item.sintomas.length > 0).length;
      
      return {
        hipoteses: cached.length,
        temSintomas
      };
    } catch {
      return { hipoteses: 0, temSintomas: 0 };
    }
  }
}