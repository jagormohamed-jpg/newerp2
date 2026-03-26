// ============ Modules ============
export type AppModule =
  | 'dashboard'
  | 'accounts'
  | 'contacts'
  | 'inventory'
  | 'treasury'
  | 'invoices'
  | 'reports'
  | 'payroll'
  | 'users';

export const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: 'لوحة التحكم',
  accounts: 'الحسابات',
  contacts: 'جهات الاتصال',
  inventory: 'المخزن والأصناف',
  treasury: 'الخزينة والبنوك',
  invoices: 'الفواتير',
  reports: 'التقارير المالية',
  payroll: 'الرواتب والعمال',
  users: 'المستخدمين والصلاحيات',
};

// ============ Permissions ============
export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
  export: boolean;
}

export type PermissionKey = keyof ModulePermission;

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  view: 'عرض',
  create: 'إضافة',
  edit: 'تعديل',
  delete: 'حذف / عكس',
  print: 'طباعة',
  export: 'تصدير',
};

export type RolePermissions = Record<AppModule, ModulePermission>;

const fullPermission = (): ModulePermission => ({
  view: true, create: true, edit: true, delete: true, print: true, export: true,
});
const readOnly = (): ModulePermission => ({
  view: true, create: false, edit: false, delete: false, print: true, export: false,
});
const noAccess = (): ModulePermission => ({
  view: false, create: false, edit: false, delete: false, print: false, export: false,
});

export const buildFullPermissions = (): RolePermissions => ({
  dashboard: fullPermission(),
  accounts: fullPermission(),
  contacts: fullPermission(),
  inventory: fullPermission(),
  treasury: fullPermission(),
  invoices: fullPermission(),
  reports: fullPermission(),
  payroll: fullPermission(),
  users: fullPermission(),
});

export const buildAccountantPermissions = (): RolePermissions => ({
  dashboard: fullPermission(),
  accounts: fullPermission(),
  contacts: fullPermission(),
  inventory: readOnly(),
  treasury: fullPermission(),
  invoices: fullPermission(),
  reports: fullPermission(),
  payroll: readOnly(),
  users: noAccess(),
});

export const buildSalesPermissions = (): RolePermissions => ({
  dashboard: readOnly(),
  accounts: noAccess(),
  contacts: { view: true, create: true, edit: true, delete: false, print: false, export: false },
  inventory: readOnly(),
  treasury: noAccess(),
  invoices: { view: true, create: true, edit: false, delete: false, print: true, export: false },
  reports: noAccess(),
  payroll: noAccess(),
  users: noAccess(),
});

export const buildWarehousePermissions = (): RolePermissions => ({
  dashboard: readOnly(),
  accounts: noAccess(),
  contacts: readOnly(),
  inventory: fullPermission(),
  treasury: noAccess(),
  invoices: readOnly(),
  reports: noAccess(),
  payroll: noAccess(),
  users: noAccess(),
});

export const buildPayrollPermissions = (): RolePermissions => ({
  dashboard: readOnly(),
  accounts: noAccess(),
  contacts: noAccess(),
  inventory: noAccess(),
  treasury: noAccess(),
  invoices: noAccess(),
  reports: noAccess(),
  payroll: fullPermission(),
  users: noAccess(),
});

// ============ Role ============
export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  is_system: boolean;
  permissions: RolePermissions;
  created_at: string;
}

// ============ System User ============
export interface SystemUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role_id: string;
  avatar_color: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  notes: string;
}

// ============ Activity Log ============
export type LogAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'reverse'
  | 'print'
  | 'export'
  | 'view'
  | 'approve'
  | 'reject';

export const LOG_ACTION_LABELS: Record<LogAction, string> = {
  login: 'تسجيل دخول',
  logout: 'تسجيل خروج',
  create: 'إضافة',
  update: 'تعديل',
  delete: 'حذف',
  reverse: 'عكس عملية',
  print: 'طباعة',
  export: 'تصدير',
  view: 'عرض',
  approve: 'اعتماد',
  reject: 'رفض',
};

export const LOG_ACTION_COLORS: Record<LogAction, string> = {
  login: 'bg-green-50 text-green-700',
  logout: 'bg-gray-50 text-gray-600',
  create: 'bg-blue-50 text-blue-700',
  update: 'bg-amber-50 text-amber-700',
  delete: 'bg-red-50 text-red-700',
  reverse: 'bg-orange-50 text-orange-700',
  print: 'bg-purple-50 text-purple-700',
  export: 'bg-indigo-50 text-indigo-700',
  view: 'bg-slate-50 text-slate-600',
  approve: 'bg-teal-50 text-teal-700',
  reject: 'bg-rose-50 text-rose-700',
};

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: LogAction;
  module: AppModule;
  entity_type: string;
  entity_id: string;
  description: string;
  ip_address: string;
  created_at: string;
}

// ============ Context State ============
export interface UsersState {
  users: SystemUser[];
  roles: Role[];
  logs: ActivityLog[];
}
