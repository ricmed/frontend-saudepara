/**
 * Cliente HTTP com interceptor automático de tokens
 * Adiciona token automaticamente e renova quando expira
 */

import storageTokenService from '@/services/storageTokenService';

interface RequestConfig extends RequestInit {
  url: string;
  retry?: boolean; // Flag interna para evitar loop infinito
}

class StorageHttpClient {
  private static instance: StorageHttpClient;
  private readonly STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL || 'https://api.hml.saude.pa.gov.br/storage-api';

  private constructor() {}

  static getInstance(): StorageHttpClient {
    if (!StorageHttpClient.instance) {
      StorageHttpClient.instance = new StorageHttpClient();
    }
    return StorageHttpClient.instance;
  }

  /**
   * Faz requisição HTTP com token automático
   */
  async request<T = any>(config: RequestConfig): Promise<T> {
    const { url, retry = true, ...fetchOptions } = config;

    try {
      // Obter token válido (renova automaticamente se necessário)
      const token = await storageTokenService.getValidToken();

      // Adicionar token no header
      const headers = new Headers(fetchOptions.headers);
      headers.set('Authorization', `Bearer ${token}`);

      // Fazer requisição
      const fullUrl = url.startsWith('http') ? url : `${this.STORAGE_BASE_URL}${url}`;
      
      console.log(`📡 ${fetchOptions.method || 'GET'} ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        headers,
      });

      // Se 401 e ainda não tentou retry, renovar token e tentar novamente
      if (response.status === 401 && retry) {
        console.warn('⚠️ Token rejeitado (401), forçando renovação...');
        
        // Forçar renovação do token
        const newToken = await storageTokenService.forceRefresh();
        
        // Retry com novo token (sem retry recursivo)
        headers.set('Authorization', `Bearer ${newToken}`);
        
        const retryResponse = await fetch(fullUrl, {
          ...fetchOptions,
          headers,
        });

        if (!retryResponse.ok) {
          throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
        }

        return await retryResponse.json();
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Tentar parsear JSON
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      // Se não for JSON, retornar response
      return response as any;

    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.request<T>({
      url,
      method: 'GET',
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>): Promise<T> {
    const headers = new Headers(config?.headers);
    
    let body: any;
    
    // Se for FormData, não definir Content-Type (browser define automaticamente)
    if (data instanceof FormData) {
      body = data;
    } else {
      // Se for JSON, definir Content-Type
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(data);
    }

    return this.request<T>({
      url,
      method: 'POST',
      body,
      ...config,
      headers,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>): Promise<T> {
    const headers = new Headers(config?.headers);
    
    let body: any;
    
    if (data instanceof FormData) {
      body = data;
    } else {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(data);
    }

    return this.request<T>({
      url,
      method: 'PUT',
      body,
      ...config,
      headers,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * Upload de arquivo com progresso
   */
  async uploadFile(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // Obter token válido
        const token = await storageTokenService.getValidToken();

        // Criar XMLHttpRequest para ter controle de progresso
        const xhr = new XMLHttpRequest();

        // Monitorar progresso
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              onProgress(progress);
            }
          });
        }

        // Handler de sucesso
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              resolve(xhr.responseText);
            }
          } else if (xhr.status === 401) {
            // Token expirado, tentar renovar e fazer retry
            storageTokenService.forceRefresh()
              .then(() => this.uploadFile(url, file, onProgress))
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error(`Upload falhou: ${xhr.status} ${xhr.statusText}`));
          }
        });

        // Handler de erro
        xhr.addEventListener('error', () => {
          reject(new Error('Erro de rede no upload'));
        });

        // Preparar FormData
        const formData = new FormData();
        formData.append('file', file);

        // Abrir conexão e enviar
        const fullUrl = url.startsWith('http') ? url : `${this.STORAGE_BASE_URL}${url}`;
        xhr.open('POST', fullUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);

      } catch (error) {
        reject(error);
      }
    });
  }
}

export default StorageHttpClient.getInstance();
