import axios from 'axios';

// Configuração da API para admin
export const adminApi = axios.create({
  baseURL: '/admin-scoped', // Usar proxy do Vite
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para log de requisições
adminApi.interceptors.request.use(
  (config) => {
    console.log(`🔍 Admin API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Admin API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para log de respostas
adminApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Admin API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Admin API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

export default adminApi;
