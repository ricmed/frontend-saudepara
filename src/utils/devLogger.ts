/**
 * Utilitário para logs condicionais em desenvolvimento
 * Em produção, os logs são desabilitados para melhor performance
 */

const isDevelopment = import.meta.env.DEV;

// Controle fino: desabilitar logs detalhados mesmo em dev para performance
const ENABLE_VERBOSE_LOGS = false;

export const devLog = {
  /**
   * Log normal - sempre exibido em dev
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log verboso - apenas se ENABLE_VERBOSE_LOGS = true
   * Use para logs de debug detalhados que podem impactar performance
   */
  verbose: (...args: any[]) => {
    if (isDevelopment && ENABLE_VERBOSE_LOGS) {
      console.log(...args);
    }
  },

  /**
   * Warning - sempre exibido
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Error - sempre exibido
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Info - apenas em dev
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

export default devLog;
