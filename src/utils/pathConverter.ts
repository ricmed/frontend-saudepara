/**
 * Utilitários para conversão entre estruturas flat e nested
 * 
 * Flat: { "paciente_nome": "João" }
 * Nested: { "paciente": { "nome": "João" } }
 */

/**
 * Define um valor em um objeto usando notação de ponto
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

/**
 * Converte objeto flat em nested
 * 
 * @example
 * flatToNested({ "paciente_nome": "João", "paciente_cpf": "123" })
 * // { "paciente": { "nome": "João", "cpf": "123" } }
 */
export function flatToNested(flat: Record<string, any>, separator = '_'): Record<string, any> {
  const nested: Record<string, any> = {};
  
  Object.entries(flat).forEach(([key, value]) => {
    // Converter underscores em pontos
    const path = key.replace(new RegExp(separator, 'g'), '.');
    setNestedValue(nested, path, value);
  });
  
  return nested;
}

/**
 * Converte objeto nested em flat
 * 
 * @example
 * nestedToFlat({ "paciente": { "nome": "João", "cpf": "123" } })
 * // { "paciente_nome": "João", "paciente_cpf": "123" }
 */
export function nestedToFlat(
  nested: Record<string, any>,
  separator = '_',
  prefix = ''
): Record<string, any> {
  const flat: Record<string, any> = {};
  
  Object.entries(nested).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}${separator}${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Recursivo para objetos aninhados
      Object.assign(flat, nestedToFlat(value, separator, newKey));
    } else {
      // Valor primitivo
      flat[newKey] = value;
    }
  });
  
  return flat;
}

/**
 * Converte schema de formulário flat para nested
 * 
 * @example
 * convertSchemaToNested({
 *   sections: [{
 *     fields: [
 *       { key: "paciente_nome", label: "Nome" },
 *       { key: "paciente_cpf", label: "CPF" }
 *     ]
 *   }]
 * })
 * // {
 * //   sections: [{
 * //     fields: [
 * //       { key: "paciente.nome", label: "Nome" },
 * //       { key: "paciente.cpf", label: "CPF" }
 * //     ]
 * //   }]
 * // }
 */
export function convertSchemaToNested(schema: any, separator = '_'): any {
  const newSchema = JSON.parse(JSON.stringify(schema)); // Deep clone
  
  // Converter keys dos fields
  newSchema.sections?.forEach((section: any) => {
    section.fields?.forEach((field: any) => {
      if (field.key && field.key.includes(separator)) {
        field.key = field.key.replace(new RegExp(separator, 'g'), '.');
      }
    });
  });
  
  // Converter rules
  newSchema.rules?.forEach((rule: any) => {
    if (rule.when?.left && rule.when.left.includes(separator)) {
      rule.when.left = rule.when.left.replace(new RegExp(separator, 'g'), '.');
    }
    
    rule.then?.forEach((action: any) => {
      if (action.target && action.target.includes(separator)) {
        action.target = action.target.replace(new RegExp(separator, 'g'), '.');
      }
    });
    
    rule.else?.forEach((action: any) => {
      if (action.target && action.target.includes(separator)) {
        action.target = action.target.replace(new RegExp(separator, 'g'), '.');
      }
    });
  });
  
  return newSchema;
}

/**
 * Converte schema de formulário nested para flat
 */
export function convertSchemaToFlat(schema: any, separator = '_'): any {
  const newSchema = JSON.parse(JSON.stringify(schema)); // Deep clone
  
  // Converter keys dos fields
  newSchema.sections?.forEach((section: any) => {
    section.fields?.forEach((field: any) => {
      if (field.key && field.key.includes('.')) {
        field.key = field.key.replace(/\./g, separator);
      }
    });
  });
  
  // Converter rules
  newSchema.rules?.forEach((rule: any) => {
    if (rule.when?.left && rule.when.left.includes('.')) {
      rule.when.left = rule.when.left.replace(/\./g, separator);
    }
    
    rule.then?.forEach((action: any) => {
      if (action.target && action.target.includes('.')) {
        action.target = action.target.replace(/\./g, separator);
      }
    });
    
    rule.else?.forEach((action: any) => {
      if (action.target && action.target.includes('.')) {
        action.target = action.target.replace(/\./g, separator);
      }
    });
  });
  
  return newSchema;
}

/**
 * Detecta se um objeto usa estrutura flat ou nested
 */
export function detectStructure(obj: Record<string, any>): 'flat' | 'nested' | 'mixed' {
  let hasFlat = false;
  let hasNested = false;
  
  Object.entries(obj).forEach(([key, value]) => {
    if (key.includes('_')) {
      hasFlat = true;
    }
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      hasNested = true;
    }
  });
  
  if (hasFlat && hasNested) return 'mixed';
  if (hasNested) return 'nested';
  return 'flat';
}

/**
 * Conta profundidade máxima de um objeto nested
 */
export function getMaxDepth(obj: Record<string, any>, currentDepth = 1): number {
  let maxDepth = currentDepth;
  
  Object.values(obj).forEach((value) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const depth = getMaxDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  });
  
  return maxDepth;
}

/**
 * Sugestões de agrupamento baseado em prefixos comuns
 */
export function suggestGrouping(keys: string[], separator = '_'): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  
  keys.forEach((key) => {
    const parts = key.split(separator);
    
    if (parts.length > 1) {
      const prefix = parts[0];
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(key);
    }
  });
  
  // Filtrar grupos com apenas 1 item
  Object.keys(groups).forEach((prefix) => {
    if (groups[prefix].length < 2) {
      delete groups[prefix];
    }
  });
  
  return groups;
}
