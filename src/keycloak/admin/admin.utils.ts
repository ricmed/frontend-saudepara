// utils/admin.utils.ts

import type { User, UserFilters, PaginationData } from  './types/admin.types';
import { STORAGE_KEYS, readStringWithLegacy } from '@/utils/storageKeys';

/**
 * Utilitários para formatação de dados
 */
export const formatUtils = {
  /**
   * Formatar data relativa (ex: "há 2 horas")
   */
  formatRelativeTime: (date: Date | string | number): string => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Agora mesmo';
    }

    const intervals = [
      { label: 'ano', seconds: 31536000 },
      { label: 'mês', seconds: 2592000 },
      { label: 'dia', seconds: 86400 },
      { label: 'hora', seconds: 3600 },
      { label: 'minuto', seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(diffInSeconds / interval.seconds);
      if (count > 0) {
        return `há ${count} ${interval.label}${count > 1 ? 's' : ''}`;
      }
    }

    return 'Agora mesmo';
  },

  /**
   * Formatar nome completo do usuário
   */
  formatUserName: (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.lastName) {
      return user.lastName;
    }
    return user.username;
  },

  /**
   * Formatar data para exibição
   */
  formatDate: (date: Date | string | number, locale = 'pt-BR'): string => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Formatar números com separadores
   */
  formatNumber: (num: number, locale = 'pt-BR'): string => {
    return new Intl.NumberFormat(locale).format(num);
  },

  /**
   * Formatar porcentagem
   */
  formatPercentage: (value: number, total: number, decimals = 1): string => {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
  },
};

/**
 * Utilitários para validação
 */
export const validationUtils = {
  /**
   * Validar email
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validar senha forte
   */
  isStrongPassword: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validar username - Mais permissivo
   */
  isValidUsername: (username: string): boolean => {
    // Username deve ter 3-50 caracteres, permite letras, números, pontos, hífens e underscores
    const usernameRegex = /^[a-zA-Z0-9._-]{3,50}$/;
    return usernameRegex.test(username);
  },

  /**
   * Validar nome
   */
  isValidName: (name: string): boolean => {
    // Nome deve ter 2-50 caracteres, apenas letras e espaços
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
    return nameRegex.test(name.trim());
  },
};

/**
 * Utilitários para manipulação de arrays
 */
export const arrayUtils = {
  /**
   * Filtrar usuários baseado nos filtros
   */
  filterUsers: (users: User[], filters: UserFilters): User[] => {
    return users.filter(user => {
      // Filtro de busca por texto
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const userText = `${user.username} ${user.firstName || ''} ${user.lastName || ''} ${user.email || ''}`.toLowerCase();
        if (!userText.includes(searchTerm)) {
          return false;
        }
      }

      // Filtro por status habilitado
      if (filters.enabled !== undefined && user.enabled !== filters.enabled) {
        return false;
      }

      // Filtro por email verificado
      if (filters.emailVerified !== undefined && user.emailVerified !== filters.emailVerified) {
        return false;
      }

      return true;
    });
  },

  /**
   * Ordenar usuários
   */
  sortUsers: (users: User[], field: keyof User, direction: 'asc' | 'desc' = 'asc'): User[] => {
    return [...users].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return direction === 'asc' ? 1 : -1;
      if (bValue === undefined) return direction === 'asc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return direction === 'asc' 
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      return 0;
    });
  },

  /**
   * Paginar array
   */
  paginateArray: <T>(array: T[], pagination: PaginationData): T[] => {
    const start = pagination.first;
    const end = start + pagination.max;
    return array.slice(start, end);
  },

  /**
   * Agrupar usuários por critério
   */
  groupUsers: (users: User[], groupBy: keyof User): Record<string, User[]> => {
    return users.reduce((groups, user) => {
      const key = String(user[groupBy] || 'undefined');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(user);
      return groups;
    }, {} as Record<string, User[]>);
  },
};

/**
 * Utilitários para manipulação de strings
 */
export const stringUtils = {
  /**
   * Capitalizar primeira letra
   */
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Converter para título (cada palavra com primeira letra maiúscula)
   */
  toTitleCase: (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  /**
   * Gerar slug a partir de string
   */
  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Truncar texto
   */
  truncate: (str: string, length: number, suffix = '...'): string => {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  },

  /**
   * Gerar iniciais do nome
   */
  getInitials: (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  },
};

/**
 * Utilitários para localStorage
 */
export const storageUtils = {
  /**
   * Salvar preferências do admin
   */
  saveAdminPreferences: (preferences: Record<string, any>): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.admin.preferences, JSON.stringify(preferences));
      localStorage.removeItem('adminPreferences');
    } catch (error) {
      console.warn('Não foi possível salvar preferências:', error);
    }
  },

  /**
   * Carregar preferências do admin
   */
  loadAdminPreferences: (): Record<string, any> => {
    try {
      const stored = readStringWithLegacy(STORAGE_KEYS.admin.preferences, ['adminPreferences']);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Não foi possível carregar preferências:', error);
      return {};
    }
  },

  /**
   * Salvar filtros da tabela
   */
  saveTableFilters: (tableId: string, filters: UserFilters): void => {
    try {
      const key = `${STORAGE_KEYS.admin.tableFiltersPrefix}.${tableId}`;
      localStorage.setItem(key, JSON.stringify(filters));
    } catch (error) {
      console.warn('Não foi possível salvar filtros:', error);
    }
  },

  /**
   * Carregar filtros da tabela
   */
  loadTableFilters: (tableId: string): UserFilters | null => {
    try {
      const key = `${STORAGE_KEYS.admin.tableFiltersPrefix}.${tableId}`;
      const stored = readStringWithLegacy(key, [`tableFilters_${tableId}`]);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Não foi possível carregar filtros:', error);
      return null;
    }
  },
};

/**
 * Utilitários para geração de dados
 */
export const generatorUtils = {
  /**
   * Gerar senha aleatória
   */
  generatePassword: (length = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Garantir pelo menos um de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Preencher o resto
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Embaralhar
    return password.split('').sort(() => Math.random() - 0.5).join('');
  },

  /**
   * Gerar ID único
   */
  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Gerar cores para gráficos
   */
  generateColors: (count: number): string[] => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
      '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
    ];
    
    if (count <= colors.length) {
      return colors.slice(0, count);
    }
    
    // Gerar cores adicionais se necessário
    const additionalColors = [];
    for (let i = colors.length; i < count; i++) {
      const hue = (i * 137.5) % 360; // Golden angle para distribuição uniforme
      additionalColors.push(`hsl(${hue}, 70%, 50%)`);
    }
    
    return [...colors, ...additionalColors];
  },
};

/**
 * Utilitários para exportação de dados
 */
export const exportUtils = {
  /**
   * Converter dados para CSV
   */
  toCSV: (data: any[], filename = 'export.csv'): void => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  /**
   * Converter dados para JSON
   */
  toJSON: (data: any[], filename = 'export.json'): void => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
};

/**
 * Utilitários para debounce e throttle
 */
export const performanceUtils = {
  /**
   * Debounce para otimizar buscas
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle para otimizar eventos frequentes
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
};

/**
 * Utilitários para tratamento de erros
 */
export const errorUtils = {
  /**
   * Extrair mensagem de erro legível
   */
  getErrorMessage: (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'Erro desconhecido. Tente novamente.';
  },

  /**
   * Verificar se é erro de rede
   */
  isNetworkError: (error: any): boolean => {
    return !navigator.onLine || 
           error?.code === 'NETWORK_ERROR' || 
           error?.message?.includes('fetch');
  },

  /**
   * Verificar se é erro de autenticação
   */
  isAuthError: (error: any): boolean => {
    return error?.response?.status === 401 || 
           error?.response?.status === 403;
  },
};

// Exportar todos os utilitários como default
export default {
  format: formatUtils,
  validation: validationUtils,
  array: arrayUtils,
  string: stringUtils,
  storage: storageUtils,
  generator: generatorUtils,
  export: exportUtils,
  performance: performanceUtils,
  error: errorUtils,
};