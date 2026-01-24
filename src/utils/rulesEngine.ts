/**
 * Interpretador de regras condicionais para formulários dinâmicos
 * 
 * Suporta show/hide, required, disabled, setValue, clear
 */

import { FormRule } from '@/services/FormService';

export interface RuleEvaluationContext {
  formData: Record<string, any>;
  fieldStates: Record<string, FieldState>;
}

export interface FieldState {
  visible: boolean;
  required: boolean;
  disabled: boolean;
  value?: any;
}

/**
 * Avalia todas as regras e retorna o estado de cada campo
 */
export function evaluateRules(
  rules: FormRule[] | undefined,
  formData: Record<string, any>,
  defaultStates: Record<string, FieldState>
): Record<string, FieldState> {
  if (!rules || rules.length === 0) {
    return defaultStates;
  }

  // Clonar estados padrão
  const fieldStates = JSON.parse(JSON.stringify(defaultStates)) as Record<string, FieldState>;

  // Avaliar cada regra
  for (const rule of rules) {
    const conditionMet = evaluateCondition(rule.when, formData);
    const actions = conditionMet ? rule.then : (rule.else || []);

    // Aplicar ações
    for (const action of actions) {
      applyAction(action, fieldStates, formData);
    }
  }

  return fieldStates;
}

/**
 * Avalia uma condição (when)
 */
function evaluateCondition(when: FormRule['when'], formData: Record<string, any>): boolean {
  const { op, left, right } = when;
  
  // Obter valor do campo (suporta notação de ponto)
  const leftValue = getNestedValue(formData, left);

  switch (op) {
    case 'eq': // equals
    case '==':
      return leftValue == right;
    
    case 'neq': // not equals
    case '!=':
      return leftValue != right;
    
    case 'gt': // greater than
    case '>':
      return leftValue > right;
    
    case 'gte': // greater than or equal
    case '>=':
      return leftValue >= right;
    
    case 'lt': // less than
    case '<':
      return leftValue < right;
    
    case 'lte': // less than or equal
    case '<=':
      return leftValue <= right;
    
    case 'in': // in array
      return Array.isArray(right) && right.includes(leftValue);
    
    case 'notIn': // not in array
      return Array.isArray(right) && !right.includes(leftValue);
    
    case 'contains': // string contains
      return String(leftValue || '').includes(String(right));
    
    case 'startsWith': // string starts with
      return String(leftValue || '').startsWith(String(right));
    
    case 'endsWith': // string ends with
      return String(leftValue || '').endsWith(String(right));
    
    case 'isEmpty': // empty/null/undefined
      return !leftValue || leftValue === '' || (Array.isArray(leftValue) && leftValue.length === 0);
    
    case 'isNotEmpty': // has value
      return !!leftValue && leftValue !== '' && (!Array.isArray(leftValue) || leftValue.length > 0);
    
    default:
      console.warn(`Operador desconhecido: ${op}`);
      return false;
  }
}

/**
 * Aplica uma ação (then/else)
 */
function applyAction(
  action: { action: string; target: string; value?: any },
  fieldStates: Record<string, FieldState>,
  formData: Record<string, any>
): void {
  const { action: actionType, target, value } = action;

  // Inicializar estado se não existir
  if (!fieldStates[target]) {
    fieldStates[target] = {
      visible: true,
      required: false,
      disabled: false
    };
  }

  switch (actionType) {
    case 'show':
      fieldStates[target].visible = true;
      break;
    
    case 'hide':
      fieldStates[target].visible = false;
      break;
    
    case 'require':
    case 'setRequired':
      fieldStates[target].required = true;
      break;
    
    case 'unrequire':
    case 'setOptional':
      fieldStates[target].required = false;
      break;
    
    case 'enable':
      fieldStates[target].disabled = false;
      break;
    
    case 'disable':
      fieldStates[target].disabled = true;
      break;
    
    case 'setValue':
      fieldStates[target].value = value;
      // Também atualizar formData
      setNestedValue(formData, target, value);
      break;
    
    case 'clear':
      fieldStates[target].value = undefined;
      // Também limpar formData
      setNestedValue(formData, target, undefined);
      break;
    
    default:
      console.warn(`Ação desconhecida: ${actionType}`);
  }
}

/**
 * Obtém valor aninhado usando notação de ponto
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Define valor aninhado usando notação de ponto
 */
function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  if (value === undefined) {
    delete current[lastKey];
  } else {
    current[lastKey] = value;
  }
}

/**
 * Cria estados padrão para todos os campos
 */
export function createDefaultFieldStates(
  sections: Array<{ fields: Array<{ key: string; required?: boolean; hidden?: boolean; disabled?: boolean }> }>
): Record<string, FieldState> {
  const states: Record<string, FieldState> = {};
  
  for (const section of sections) {
    for (const field of section.fields) {
      states[field.key] = {
        visible: !field.hidden,
        required: !!field.required,
        disabled: !!field.disabled
      };
    }
  }
  
  return states;
}
