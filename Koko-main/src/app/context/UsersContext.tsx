import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  SystemUser, Role, ActivityLog, LogAction, AppModule,
  UsersState, RolePermissions,
} from '../types/users';
import {
  buildFullPermissions, buildAccountantPermissions,
  buildSalesPermissions, buildWarehousePermissions, buildPayrollPermissions,
} from '../types/users';
import { toast } from 'sonner';

const uid = () => Math.random().toString(36).substr(2, 9);

// ============ Default Roles ============
const defaultRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'مدير النظام',
    description: 'صلاحيات كاملة على جميع أجزاء النظام',
    color: 'bg-red-100 text-red-700',
    is_system: true,
    permissions: buildFullPermissions(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'role-accountant',
    name: 'محاسب',
    description: 'إدارة الحسابات والفواتير والخزينة والتقارير',
    color: 'bg-blue-100 text-blue-700',
    is_system: true,
    permissions: buildAccountantPermissions(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'role-sales',
    name: 'مندوب مبيعات',
    description: 'إنشاء فواتير مبيعات وإدارة جهات الاتصال',
    color: 'bg-green-100 text-green-700',
    is_system: true,
    permissions: buildSalesPermissions(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'role-warehouse',
    name: 'أمين مخزن',
    description: 'إدارة المخزن والأصناف وحركة البضاعة',
    color: 'bg-amber-100 text-amber-700',
    is_system: true,
    permissions: buildWarehousePermissions(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'role-payroll',
    name: 'مشرف رواتب',
    description: 'إدارة الرواتب والعمال والحضور والانصراف',
    color: 'bg-purple-100 text-purple-700',
    is_system: true,
    permissions: buildPayrollPermissions(),
    created_at: new Date().toISOString(),
  },
];

// ============ Default Users ============
const defaultUsers: SystemUser[] = [
  {
    id: 'u1',
    username: 'admin',
    full_name: 'مدير النظام',
    email: 'admin@company.com',
    phone: '01000000000',
    role_id: 'role-admin',
    avatar_color: 'bg-red-500',
    is_active: true,
    last_login: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    notes: 'الحساب الرئيسي للنظام',
  },
  {
    id: 'u2',
    username: 'accountant1',
    full_name: 'أحمد محمد السيد',
    email: 'ahmed@company.com',
    phone: '01012345678',
    role_id: 'role-accountant',
    avatar_color: 'bg-blue-500',
    is_active: true,
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    notes: '',
  },
  {
    id: 'u3',
    username: 'sales1',
    full_name: 'محمد خالد عمر',
    email: 'mohamed@company.com',
    phone: '01123456789',
    role_id: 'role-sales',
    avatar_color: 'bg-green-500',
    is_active: true,
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    notes: '',
  },
  {
    id: 'u4',
    username: 'warehouse1',
    full_name: 'سامي حسن إبراهيم',
    email: 'sami@company.com',
    phone: '01234567890',
    role_id: 'role-warehouse',
    avatar_color: 'bg-amber-500',
    is_active: true,
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    notes: '',
  },
  {
    id: 'u5',
    username: 'payroll1',
    full_name: 'نورا عبد الرحمن',
    email: 'noura@company.com',
    phone: '01098765432',
    role_id: 'role-payroll',
    avatar_color: 'bg-purple-500',
    is_active: false,
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    notes: 'موقف مؤقتاً',
  },
];

// ============ Default Logs ============
function buildDefaultLogs(): ActivityLog[] {
  const now = Date.now();
  const m = (mins: number) => new Date(now - 1000 * 60 * mins).toISOString();

  return [
    { id: 'log1', user_id: 'u1', user_name: 'مدير النظام', user_role: 'مدير النظام', action: 'login', module: 'dashboard', entity_type: 'جلسة', entity_id: '', description: 'تسجيل دخول إلى النظام', ip_address: '192.168.1.1', created_at: m(5) },
    { id: 'log2', user_id: 'u2', user_name: 'أحمد محمد السيد', user_role: 'محاسب', action: 'create', module: 'invoices', entity_type: 'فاتورة مبيعات', entity_id: 'SI-0045', description: 'إنشاء فاتورة مبيعات رقم SI-0045 بقيمة 15,200 ج.م', ip_address: '192.168.1.2', created_at: m(12) },
    { id: 'log3', user_id: 'u3', user_name: 'محمد خالد عمر', user_role: 'مندوب مبيعات', action: 'create', module: 'invoices', entity_type: 'فاتورة مبيعات', entity_id: 'SI-0044', description: 'إنشاء فاتورة مبيعات رقم SI-0044 بقيمة 8,500 ج.م', ip_address: '192.168.1.5', created_at: m(28) },
    { id: 'log4', user_id: 'u4', user_name: 'سامي حسن إبراهيم', user_role: 'أمين مخزن', action: 'update', module: 'inventory', entity_type: 'صنف', entity_id: 'لاب توب Dell', description: 'تعديل بيانات صنف: لاب توب Dell - تحديث الحد الأدنى للمخزون', ip_address: '192.168.1.7', created_at: m(45) },
    { id: 'log5', user_id: 'u2', user_name: 'أحمد محمد السيد', user_role: 'محاسب', action: 'print', module: 'reports', entity_type: 'تقرير', entity_id: 'ميزان المراجعة', description: 'طباعة ميزان المراجعة للفترة من 01/01/2025 إلى 31/01/2025', ip_address: '192.168.1.2', created_at: m(60) },
    { id: 'log6', user_id: 'u1', user_name: 'مدير النظام', user_role: 'مدير النظام', action: 'create', module: 'users', entity_type: 'مستخدم', entity_id: 'u5', description: 'إضافة مستخدم جديد: نورا عبد الرحمن بدور مشرف رواتب', ip_address: '192.168.1.1', created_at: m(90) },
    { id: 'log7', user_id: 'u2', user_name: 'أحمد محمد السيد', user_role: 'محاسب', action: 'create', module: 'treasury', entity_type: 'قبض', entity_id: 'REC-0023', description: 'تسجيل قبض من شركة النور للتجارة بمبلغ 5,000 ج.م', ip_address: '192.168.1.2', created_at: m(120) },
    { id: 'log8', user_id: 'u3', user_name: 'محمد خالد عمر', user_role: 'مندوب مبيعات', action: 'login', module: 'dashboard', entity_type: 'جلسة', entity_id: '', description: 'تسجيل دخول إلى النظام', ip_address: '192.168.1.5', created_at: m(150) },
    { id: 'log9', user_id: 'u1', user_name: 'مدير النظام', user_role: 'مدير النظام', action: 'update', module: 'users', entity_type: 'صلاحيات', entity_id: 'role-sales', description: 'تعديل صلاحيات دور: مندوب مبيعات', ip_address: '192.168.1.1', created_at: m(180) },
    { id: 'log10', user_id: 'u4', user_name: 'سامي حسن إبراهيم', user_role: 'أمين مخزن', action: 'login', module: 'dashboard', entity_type: 'جلسة', entity_id: '', description: 'تسجيل دخول إلى النظام', ip_address: '192.168.1.7', created_at: m(240) },
    { id: 'log11', user_id: 'u2', user_name: 'أحمد محمد السيد', user_role: 'محاسب', action: 'export', module: 'reports', entity_type: 'تقرير', entity_id: 'قائمة الدخل', description: 'تصدير قائمة الدخل بصيغة Excel', ip_address: '192.168.1.2', created_at: m(300) },
    { id: 'log12', user_id: 'u1', user_name: 'مدير النظام', user_role: 'مدير النظام', action: 'update', module: 'accounts', entity_type: 'حساب', entity_id: 'الصندوق الرئيسي', description: 'تعديل بيانات حساب: الصندوق الرئيسي', ip_address: '192.168.1.1', created_at: m(360) },
    { id: 'log13', user_id: 'u3', user_name: 'محمد خالد عمر', user_role: 'مندوب مبيعات', action: 'create', module: 'contacts', entity_type: 'جهة اتصال', entity_id: 'شركة الأندلس', description: 'إضافة عميل جديد: شركة الأندلس للتجارة', ip_address: '192.168.1.5', created_at: m(420) },
    { id: 'log14', user_id: 'u2', user_name: 'أحمد محمد السيد', user_role: 'محاسب', action: 'reverse', module: 'invoices', entity_type: 'فاتورة مبيعات', entity_id: 'SI-0039', description: 'عكس فاتورة مبيعات رقم SI-0039 - سبب: خطأ في الأسعار', ip_address: '192.168.1.2', created_at: m(480) },
    { id: 'log15', user_id: 'u5', user_name: 'نورا عبد الرحمن', user_role: 'مشرف رواتب', action: 'login', module: 'dashboard', entity_type: 'جلسة', entity_id: '', description: 'تسجيل دخول إلى النظام', ip_address: '192.168.1.9', created_at: m(600) },
    { id: 'log16', user_id: 'u5', user_name: 'نورا عبد الرحمن', user_role: 'مشرف رواتب', action: 'create', module: 'payroll', entity_type: 'مسير رواتب', entity_id: 'يناير 2025', description: 'إنشاء مسير رواتب شهر يناير 2025', ip_address: '192.168.1.9', created_at: m(620) },
    { id: 'log17', user_id: 'u5', user_name: 'نورا عبد الرحمن', user_role: 'مشرف رواتب', action: 'logout', module: 'dashboard', entity_type: 'جلسة', entity_id: '', description: 'تسجيل خروج من النظام', ip_address: '192.168.1.9', created_at: m(700) },
    { id: 'log18', user_id: 'u4', user_name: 'سامي حسن إبراهيم', user_role: 'أمين مخزن', action: 'create', module: 'inventory', entity_type: 'تحويل مخزني', entity_id: 'TRF-0012', description: 'إنشاء تحويل مخزني من المخزن الرئيسي إلى مخزن الفرع', ip_address: '192.168.1.7', created_at: m(800) },
    { id: 'log19', user_id: 'u1', user_name: 'مدير النظام', user_role: 'مدير النظام', action: 'update', module: 'users', entity_type: 'مستخدم', entity_id: 'u5', description: 'تعطيل حساب المستخدم: نورا عبد الرحمن', ip_address: '192.168.1.1', created_at: m(900) },
    { id: 'log20', user_id: 'u2', user_name: 'أحمد محمد السيد', user_role: 'محاسب', action: 'create', module: 'invoices', entity_type: 'فاتورة مشتريات', entity_id: 'PI-0018', description: 'تسجيل فاتورة مشتريات من مصنع السلام بقيمة 24,600 ج.م', ip_address: '192.168.1.2', created_at: m(1000) },
  ];
}

// ============ Context ============
interface UsersContextType {
  users: SystemUser[];
  roles: Role[];
  logs: ActivityLog[];
  // Users
  addUser: (data: Omit<SystemUser, 'id' | 'created_at' | 'last_login'>) => void;
  updateUser: (id: string, data: Partial<SystemUser>) => void;
  toggleUserStatus: (id: string) => void;
  // Roles
  addRole: (data: Omit<Role, 'id' | 'created_at' | 'is_system'>) => void;
  updateRole: (id: string, data: Partial<Omit<Role, 'id' | 'is_system' | 'created_at'>>) => void;
  deleteRole: (id: string) => void;
  updateRolePermissions: (roleId: string, permissions: RolePermissions) => void;
  // Logs
  logActivity: (entry: Omit<ActivityLog, 'id' | 'created_at'>) => void;
  clearLogs: () => void;
  getRoleById: (id: string) => Role | undefined;
  getCurrentUser: () => SystemUser;
}

const UsersContext = createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<SystemUser[]>(defaultUsers);
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [logs, setLogs] = useState<ActivityLog[]>(buildDefaultLogs);

  const getRoleById = useCallback((id: string) => roles.find(r => r.id === id), [roles]);

  const getCurrentUser = useCallback((): SystemUser => {
    return users.find(u => u.id === 'u1')!;
  }, [users]);

  const logActivity = useCallback((entry: Omit<ActivityLog, 'id' | 'created_at'>) => {
    const newLog: ActivityLog = {
      ...entry,
      id: uid(),
      created_at: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  const addUser = useCallback((data: Omit<SystemUser, 'id' | 'created_at' | 'last_login'>) => {
    const newUser: SystemUser = {
      ...data,
      id: uid(),
      last_login: null,
      created_at: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    const role = roles.find(r => r.id === data.role_id);
    logActivity({
      user_id: 'u1',
      user_name: 'مدير النظام',
      user_role: 'مدير النظام',
      action: 'create',
      module: 'users',
      entity_type: 'مستخدم',
      entity_id: newUser.id,
      description: `إضافة مستخدم جديد: ${data.full_name} بدور ${role?.name || ''}`,
      ip_address: '192.168.1.1',
    });
    toast.success(`تم إضافة المستخدم ${data.full_name}`);
  }, [roles, logActivity]);

  const updateUser = useCallback((id: string, data: Partial<SystemUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    const user = users.find(u => u.id === id);
    logActivity({
      user_id: 'u1',
      user_name: 'مدير النظام',
      user_role: 'مدير النظام',
      action: 'update',
      module: 'users',
      entity_type: 'مستخدم',
      entity_id: id,
      description: `تعديل بيانات المستخدم: ${user?.full_name}`,
      ip_address: '192.168.1.1',
    });
    toast.success('تم حفظ التعديلات');
  }, [users, logActivity]);

  const toggleUserStatus = useCallback((id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const newStatus = !u.is_active;
        logActivity({
          user_id: 'u1',
          user_name: 'مدير النظام',
          user_role: 'مدير النظام',
          action: 'update',
          module: 'users',
          entity_type: 'مستخدم',
          entity_id: id,
          description: `${newStatus ? 'تفعيل' : 'تعطيل'} حساب المستخدم: ${u.full_name}`,
          ip_address: '192.168.1.1',
        });
        toast.success(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} المستخدم ${u.full_name}`);
        return { ...u, is_active: newStatus };
      }
      return u;
    }));
  }, [logActivity]);

  const addRole = useCallback((data: Omit<Role, 'id' | 'created_at' | 'is_system'>) => {
    const newRole: Role = {
      ...data,
      id: uid(),
      is_system: false,
      created_at: new Date().toISOString(),
    };
    setRoles(prev => [...prev, newRole]);
    logActivity({
      user_id: 'u1',
      user_name: 'مدير النظام',
      user_role: 'مدير النظام',
      action: 'create',
      module: 'users',
      entity_type: 'دور',
      entity_id: newRole.id,
      description: `إضافة دور جديد: ${data.name}`,
      ip_address: '192.168.1.1',
    });
    toast.success(`تم إضافة الدور ${data.name}`);
  }, [logActivity]);

  const updateRole = useCallback((id: string, data: Partial<Omit<Role, 'id' | 'is_system' | 'created_at'>>) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    const role = roles.find(r => r.id === id);
    logActivity({
      user_id: 'u1',
      user_name: 'مدير النظام',
      user_role: 'مدير النظام',
      action: 'update',
      module: 'users',
      entity_type: 'دور',
      entity_id: id,
      description: `تعديل دور: ${role?.name}`,
      ip_address: '192.168.1.1',
    });
    toast.success('تم حفظ التعديلات');
  }, [roles, logActivity]);

  const deleteRole = useCallback((id: string) => {
    const role = roles.find(r => r.id === id);
    if (role?.is_system) {
      toast.error('لا يمكن حذف الأدوار الافتراضية للنظام');
      return;
    }
    const hasUsers = users.some(u => u.role_id === id);
    if (hasUsers) {
      toast.error('لا يمكن حذف دور مرتبط بمستخدمين. قم بتغيير دور المستخدمين أولاً');
      return;
    }
    setRoles(prev => prev.filter(r => r.id !== id));
    logActivity({
      user_id: 'u1',
      user_name: 'مدير النظام',
      user_role: 'مدير النظام',
      action: 'delete',
      module: 'users',
      entity_type: 'دور',
      entity_id: id,
      description: `حذف دور: ${role?.name}`,
      ip_address: '192.168.1.1',
    });
    toast.success(`تم حذف الدور ${role?.name}`);
  }, [roles, users, logActivity]);

  const updateRolePermissions = useCallback((roleId: string, permissions: RolePermissions) => {
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions } : r));
    const role = roles.find(r => r.id === roleId);
    logActivity({
      user_id: 'u1',
      user_name: 'مدير النظام',
      user_role: 'مدير النظام',
      action: 'update',
      module: 'users',
      entity_type: 'صلاحيات',
      entity_id: roleId,
      description: `تحديث صلاحيات دور: ${role?.name}`,
      ip_address: '192.168.1.1',
    });
    toast.success('تم حفظ الصلاحيات');
  }, [roles, logActivity]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    toast.success('تم مسح سجل النشاط');
  }, []);

  return (
    <UsersContext.Provider value={{
      users, roles, logs,
      addUser, updateUser, toggleUserStatus,
      addRole, updateRole, deleteRole, updateRolePermissions,
      logActivity, clearLogs,
      getRoleById, getCurrentUser,
    }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers must be used inside UsersProvider');
  return ctx;
}
