// types/admin.types.ts

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: number;
  attributes?: Record<string, string[]>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  composite?: boolean;
  clientRole?: boolean;
  containerId?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  start: number;
  lastAccess: number;
  clients: Record<string, string>;
}

export interface AdminStats {
  totalUsers: number;
  totalRoles: number;
  recentEvents: number;
  timestamp: string;
}

export interface UserFormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  emailVerified: boolean;
  password?: string;
  confirmPassword?: string;
  temporaryPassword: boolean;
}

export interface UserFilters {
  search: string;
  enabled?: boolean;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface PaginationData {
  first: number;
  max: number;
  total: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  id?: string;
}

export interface PasswordResetData {
  password: string;
  confirmPassword: string;
  temporary: boolean;
}

export interface BulkAction {
  type: 'enable' | 'disable' | 'delete' | 'verify-email' | 'logout';
  userIds: string[];
}

export interface RealmEvent {
  id: string;
  time: number;
  type: string;
  realmId: string;
  clientId: string;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  error?: string;
  details?: Record<string, string>;
}

export interface UserGroup {
  id: string;
  name: string;
  path: string;
  attributes?: Record<string, string[]>;
  subGroups?: UserGroup[];
}

export interface ClientRole {
  id: string;
  name: string;
  description?: string;
  clientRole: boolean;
  containerId: string;
  composite: boolean;
}

export interface UserRoleMapping {
  realmRoles: Role[];
  clientRoles: Record<string, ClientRole[]>;
}

// Utilitários para formulários
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'checkbox' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
}

export interface FormError {
  field: string;
  message: string;
}

// Estados da aplicação
export interface AdminAppState {
  currentView: 'dashboard' | 'users' | 'roles' | 'settings' | 'reports';
  loading: boolean;
  notification: Notification | null;
  selectedUsers: string[];
  filters: UserFilters;
  pagination: PaginationData;
}

// Configurações de tabela
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectItems?: (items: string[]) => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (item: T) => void;
    type?: 'default' | 'danger' | 'warning';
  }>;
}

// Hooks personalizados
export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseApiReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (params?: any) => Promise<T>;
  reset: () => void;
}

// Constantes
export const USER_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  EMAIL_VERIFIED: 'email-verified',
  EMAIL_NOT_VERIFIED: 'email-not-verified',
} as const;

export const ADMIN_PERMISSIONS = {
  MANAGE_USERS: 'manage-users',
  MANAGE_ROLES: 'manage-roles',
  VIEW_REPORTS: 'view-reports',
  SYSTEM_ADMIN: 'admin',
} as const;

export const PAGINATION_SIZES = [10, 20, 50, 100] as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];
export type PaginationSize = typeof PAGINATION_SIZES[number];