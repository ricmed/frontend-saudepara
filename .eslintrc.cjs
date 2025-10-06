module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', 'node_modules'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    React: 'readonly',
    JSX: 'readonly',
    NodeJS: 'readonly',
    RequestInit: 'readonly',
    EventListener: 'readonly',
  },
  rules: {
    // Desabilitar regras que são muito restritivas para este projeto
    'react-refresh/only-export-components': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-inner-declarations': 'off',
    'no-prototype-builtins': 'off',
    'no-case-declarations': 'off',
    'no-useless-escape': 'off',
    'no-console': 'off',
    'no-empty': 'off',
    
    // Manter apenas regras críticas
    'no-debugger': 'error',
  },
}