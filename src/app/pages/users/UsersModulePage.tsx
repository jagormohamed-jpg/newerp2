import React, { useState, useMemo } from 'react';
import {
  Users, ShieldCheck, Activity, Plus, Edit2, Power, Search,
  Filter, Download, Trash2, Eye, EyeOff, Lock, UserCog,
  CircleCheck, XCircle, Clock, ChevronDown, Copy, AlertTriangle,
  LogIn, LogOut, Pencil, FilePlus, FileX, Printer, FileDown,
  RotateCcw, BadgeCheck, BadgeX, X
} from 'lucide-react';
import { useUsers } from '../../context/UsersContext';
import type {
  SystemUser, Role, ActivityLog, LogAction, AppModule,
  RolePermissions, ModulePermission, PermissionKey,
} from '../../types/users';
import {
  MODULE_LABELS, PERMISSION_LABELS, LOG_ACTION_LABELS, LOG_ACTION_COLORS,
  buildFullPermissions,
} from '../../types/users';

const ALL_MODULES = Object.keys(MODULE_LABELS) as AppModule[];
const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

const AVATAR_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500',
];

const ROLE_COLORS = [
  'bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700',
];

const ACTION_ICON: Record<LogAction, React.ReactNode> = {
  login: <LogIn className="w-3.5 h-3.5" />,
  logout: <LogOut className="w-3.5 h-3.5" />,
  create: <FilePlus className="w-3.5 h-3.5" />,
  update: <Pencil className="w-3.5 h-3.5" />,
  delete: <FileX className="w-3.5 h-3.5" />,
  reverse: <RotateCcw className="w-3.5 h-3.5" />,
  print: <Printer className="w-3.5 h-3.5" />,
  export: <FileDown className="w-3.5 h-3.5" />,
  view: <Eye className="w-3.5 h-3.5" />,
  approve: <BadgeCheck className="w-3.5 h-3.5" />,
  reject: <BadgeX className="w-3.5 h-3.5" />,
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ============================================================
// TAB: المستخدمون
// ============================================================
function UsersTab() {
  const { users, roles, addUser, updateUser, toggleUserStatus, getRoleById } = useUsers();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const emptyForm = {
    username: '', full_name: '', email: '', phone: '',
    role_id: '', avatar_color: 'bg-blue-500', is_active: true, notes: '', password: '',
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase())
      || u.username.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role_id === filterRole;
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'active' && u.is_active)
      || (filterStatus === 'inactive' && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  }), [users, search, filterRole, filterStatus]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (u: SystemUser) => {
    setForm({ ...u, password: '' });
    setEditingId(u.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.username.trim() || !form.role_id) return;
    const { password, ...data } = form;
    if (editingId) {
      updateUser(editingId, data);
    } else {
      addUser(data);
    }
    setShowForm(false);
    setForm(emptyForm);
  };

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg text-foreground">إدارة المستخدمين</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {users.filter(u => u.is_active).length} مستخدم نشط من أصل {users.length}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          مستخدم جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو اسم المستخدم أو البريد..."
              className="w-full pr-9 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">كل الأدوار</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">معطل</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(user => {
          const role = getRoleById(user.role_id);
          return (
            <div key={user.id} className={`bg-white rounded-xl border border-border p-4 transition-all ${!user.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full ${user.avatar_color} flex items-center justify-center text-white text-sm shrink-0`}>
                    {initials(user.full_name)}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {user.is_active ? <CircleCheck className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {user.is_active ? 'نشط' : 'معطل'}
                </span>
              </div>

              <div className="space-y-1.5 mb-3">
                {role && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className={`px-2 py-0.5 rounded-full text-xs ${role.color}`}>{role.name}</span>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3.5 h-3.5 shrink-0">@</span>
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3.5 h-3.5 shrink-0 text-center">#</span>
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{user.last_login ? formatRelative(user.last_login) : 'لم يسجل دخول'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(user)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className={`p-1.5 rounded-lg transition-colors ${user.is_active ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}
                    title={user.is_active ? 'تعطيل' : 'تفعيل'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground text-sm">
            لا توجد نتائج تطابق البحث
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base text-foreground">
                {editingId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-muted rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Avatar color picker */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">لون الصورة الرمزية</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, avatar_color: c }))}
                      className={`w-7 h-7 rounded-full ${c} transition-transform ${form.avatar_color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm text-foreground mb-1.5">الاسم الكامل <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">اسم المستخدم <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">الدور <span className="text-red-500">*</span></label>
                  <select
                    value={form.role_id}
                    onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  >
                    <option value="">اختر الدور</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">رقم الهاتف</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="col-span-2 relative">
                  <label className="block text-sm text-foreground mb-1.5">
                    {editingId ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور'}
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute left-3 top-9 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-foreground mb-1.5">ملاحظات</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="user_active"
                    checked={form.is_active}
                    onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="user_active" className="text-sm text-foreground">مستخدم نشط</label>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  {editingId ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-border rounded-lg hover:bg-muted text-sm">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: الأدوار والصلاحيات
// ============================================================
function RolesTab() {
  const { roles, users, addRole, updateRole, deleteRole, updateRolePermissions } = useUsers();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [localPerms, setLocalPerms] = useState<RolePermissions | null>(null);
  const [permsDirty, setPermsDirty] = useState(false);

  const roleForm = { name: '', description: '', color: ROLE_COLORS[0] };
  const [rForm, setRForm] = useState(roleForm);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const selectRole = (id: string) => {
    setSelectedRoleId(id);
    setLocalPerms(null);
    setPermsDirty(false);
  };

  const startEditPerms = () => {
    if (selectedRole) {
      setLocalPerms(JSON.parse(JSON.stringify(selectedRole.permissions)));
      setPermsDirty(false);
    }
  };

  const togglePerm = (mod: AppModule, perm: PermissionKey) => {
    if (!localPerms) return;
    const current = localPerms[mod][perm];
    const updated: RolePermissions = {
      ...localPerms,
      [mod]: { ...localPerms[mod], [perm]: !current },
    };
    // If disabling view, disable everything
    if (perm === 'view' && current) {
      const allOff: ModulePermission = { view: false, create: false, edit: false, delete: false, print: false, export: false };
      updated[mod] = allOff;
    }
    // If enabling any other perm, enable view too
    if (perm !== 'view' && !current && !localPerms[mod].view) {
      updated[mod] = { ...updated[mod], view: true };
    }
    setLocalPerms(updated);
    setPermsDirty(true);
  };

  const toggleAllModule = (mod: AppModule, value: boolean) => {
    if (!localPerms) return;
    const allPerms: ModulePermission = value
      ? { view: true, create: true, edit: true, delete: true, print: true, export: true }
      : { view: false, create: false, edit: false, delete: false, print: false, export: false };
    setLocalPerms({ ...localPerms, [mod]: allPerms });
    setPermsDirty(true);
  };

  const savePerms = () => {
    if (!localPerms || !selectedRole) return;
    updateRolePermissions(selectedRole.id, localPerms);
    setLocalPerms(null);
    setPermsDirty(false);
  };

  const cancelPerms = () => {
    setLocalPerms(null);
    setPermsDirty(false);
  };

  const perms = localPerms || selectedRole?.permissions;

  const openAddRole = () => {
    setRForm(roleForm);
    setEditingRoleId(null);
    setShowRoleForm(true);
  };

  const openEditRole = (r: Role) => {
    setRForm({ name: r.name, description: r.description, color: r.color });
    setEditingRoleId(r.id);
    setShowRoleForm(true);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rForm.name.trim()) return;
    if (editingRoleId) {
      updateRole(editingRoleId, rForm);
    } else {
      addRole({ ...rForm, permissions: buildFullPermissions() });
    }
    setShowRoleForm(false);
  };

  const usersInRole = (roleId: string) => users.filter(u => u.role_id === roleId).length;

  return (
    <div className="flex gap-5 h-full min-h-[600px]">
      {/* Left: Roles list */}
      <div className="w-64 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">الأدوار ({roles.length})</span>
          <button
            onClick={openAddRole}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            دور جديد
          </button>
        </div>
        <div className="space-y-1.5">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => selectRole(role.id)}
              className={`w-full text-right p-3 rounded-lg border transition-all ${selectedRoleId === role.id ? 'border-blue-500 bg-blue-50' : 'border-border bg-white hover:bg-muted/50'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs ${role.color}`}>{role.name}</span>
                {role.is_system && <Lock className="w-3 h-3 text-muted-foreground" title="دور النظام" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{role.description}</p>
              <p className="text-xs text-blue-600 mt-1">{usersInRole(role.id)} مستخدم</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Permissions Matrix */}
      <div className="flex-1 bg-white rounded-xl border border-border overflow-hidden">
        {selectedRole ? (
          <div className="flex flex-col h-full">
            {/* Role header */}
            <div className="p-4 border-b border-border flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-3 py-1 rounded-full text-sm ${selectedRole.color}`}>{selectedRole.name}</span>
                  {selectedRole.is_system && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      دور النظام
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
              </div>
              <div className="flex gap-2">
                {!permsDirty && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditRole(selectedRole)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg hover:bg-muted text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      تعديل
                    </button>
                    {!selectedRole.is_system && (
                      <button
                        onClick={() => deleteRole(selectedRole.id)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    )}
                    <button
                      onClick={startEditPerms}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      تعديل الصلاحيات
                    </button>
                  </div>
                )}
                {permsDirty && (
                  <div className="flex gap-2">
                    <button
                      onClick={savePerms}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
                    >
                      <CircleCheck className="w-3.5 h-3.5" />
                      حفظ الصلاحيات
                    </button>
                    <button
                      onClick={cancelPerms}
                      className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg hover:bg-muted text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions table */}
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-right text-xs text-muted-foreground w-40">الوحدة</th>
                    {ALL_PERMISSIONS.map(p => (
                      <th key={p} className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                        {PERMISSION_LABELS[p]}
                      </th>
                    ))}
                    {localPerms && (
                      <th className="px-3 py-2.5 text-center text-xs text-muted-foreground">الكل</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ALL_MODULES.map(mod => {
                    const mp = perms?.[mod];
                    if (!mp) return null;
                    const allEnabled = ALL_PERMISSIONS.every(p => mp[p]);
                    return (
                      <tr key={mod} className="hover:bg-muted/20">
                        <td className="px-4 py-3 text-sm text-foreground">{MODULE_LABELS[mod]}</td>
                        {ALL_PERMISSIONS.map(perm => (
                          <td key={perm} className="px-3 py-3 text-center">
                            {localPerms ? (
                              <input
                                type="checkbox"
                                checked={mp[perm]}
                                onChange={() => togglePerm(mod, perm)}
                                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                              />
                            ) : (
                              mp[perm]
                                ? <CircleCheck className="w-4 h-4 text-green-500 mx-auto" />
                                : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                            )}
                          </td>
                        ))}
                        {localPerms && (
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={allEnabled}
                              onChange={e => toggleAllModule(mod, e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            اختر دوراً لعرض صلاحياته
          </div>
        )}
      </div>

      {/* Role Form Modal */}
      {showRoleForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base text-foreground">{editingRoleId ? 'تعديل الدور' : 'إضافة دور جديد'}</h3>
              <button onClick={() => setShowRoleForm(false)} className="p-1.5 hover:bg-muted rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-foreground mb-1.5">اسم الدور <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={rForm.name}
                  onChange={e => setRForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1.5">الوصف</label>
                <textarea
                  value={rForm.description}
                  onChange={e => setRForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-2">لون الدور</label>
                <div className="flex gap-2 flex-wrap">
                  {ROLE_COLORS.map(c => {
                    const [bg, txt] = c.split(' ');
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setRForm(p => ({ ...p, color: c }))}
                        className={`px-3 py-1 rounded-full text-xs ${c} transition-transform ${rForm.color === c ? 'scale-110 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      >
                        {rForm.name || 'مثال'}
                      </button>
                    );
                  })}
                </div>
              </div>
              {!editingRoleId && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg">
                  سيتم منح الدور الجديد كامل الصلاحيات. يمكنك تعديلها بعد الإنشاء من جدول الصلاحيات.
                </p>
              )}
              <div className="flex gap-2 pt-2 border-t border-border">
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  {editingRoleId ? 'حفظ التعديلات' : 'إنشاء الدور'}
                </button>
                <button type="button" onClick={() => setShowRoleForm(false)} className="px-5 py-2.5 border border-border rounded-lg hover:bg-muted text-sm">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: سجل النشاط
// ============================================================
function LogsTab() {
  const { logs, users, roles, clearLogs } = useUsers();
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterModule, setFilterModule] = useState<AppModule | ''>('');
  const [filterAction, setFilterAction] = useState<LogAction | ''>('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const filtered = useMemo(() => logs.filter(l => {
    const matchSearch = l.description.toLowerCase().includes(search.toLowerCase())
      || l.user_name.toLowerCase().includes(search.toLowerCase())
      || l.entity_id.toLowerCase().includes(search.toLowerCase());
    const matchUser = !filterUser || l.user_id === filterUser;
    const matchModule = !filterModule || l.module === filterModule;
    const matchAction = !filterAction || l.action === filterAction;
    return matchSearch && matchUser && matchModule && matchAction;
  }), [logs, search, filterUser, filterModule, filterAction]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const uniqueActions = [...new Set(logs.map(l => l.action))] as LogAction[];

  // Stats
  const todayCount = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const createCount = logs.filter(l => l.action === 'create').length;
  const updateCount = logs.filter(l => l.action === 'update').length;
  const loginCount = logs.filter(l => l.action === 'login').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg text-foreground">سجل نشاط النظام</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {logs.length} عملية مسجلة
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted text-sm transition-colors">
            <Download className="w-4 h-4" />
            تصدير
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            مسح السجل
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'اليوم', value: todayCount, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'عمليات إضافة', value: createCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'عمليات تعديل', value: updateCount, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'تسجيلات دخول', value: loginCount, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-lg p-3`}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="بحث في الوصف أو المستخدم..."
              className="w-full pr-9 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={filterUser}
            onChange={e => { setFilterUser(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">كل المستخدمين</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          <select
            value={filterModule}
            onChange={e => { setFilterModule(e.target.value as AppModule | ''); setPage(1); }}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">كل الوحدات</option>
            {ALL_MODULES.map(m => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
          </select>
          <select
            value={filterAction}
            onChange={e => { setFilterAction(e.target.value as LogAction | ''); setPage(1); }}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">كل العمليات</option>
            {uniqueActions.map(a => <option key={a} value={a}>{LOG_ACTION_LABELS[a]}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {filtered.length} نتيجة
          {filtered.length !== logs.length ? ` من أصل ${logs.length}` : ''}
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">الوقت</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">المستخدم</th>
                <th className="px-4 py-3 text-center text-xs text-muted-foreground">العملية</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">الوحدة</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">التفاصيل</th>
                <th className="px-4 py-3 text-center text-xs text-muted-foreground">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    لا توجد سجلات تطابق البحث
                  </td>
                </tr>
              ) : paginated.map(log => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    <p>{formatRelative(log.created_at)}</p>
                    <p className="text-[10px]">{formatDateTime(log.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{log.user_name}</p>
                    <p className="text-xs text-muted-foreground">{log.user_role}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${LOG_ACTION_COLORS[log.action]}`}>
                      {ACTION_ICON[log.action]}
                      {LOG_ACTION_LABELS[log.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    {MODULE_LABELS[log.module]}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{log.description}</p>
                    {log.entity_id && (
                      <p className="text-xs text-muted-foreground">{log.entity_type}: {log.entity_id}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {log.ip_address}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              صفحة {page} من {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs border transition-colors ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-border hover:bg-muted'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN MODULE
// ============================================================
const TABS = [
  { id: 'users', label: 'المستخدمون', icon: <Users className="w-4 h-4" /> },
  { id: 'roles', label: 'الأدوار والصلاحيات', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'logs', label: 'سجل النشاط', icon: <Activity className="w-4 h-4" /> },
] as const;

type TabId = typeof TABS[number]['id'];

export function UsersModulePage() {
  const [activeTab, setActiveTab] = useState<TabId>('users');
  const { users, logs, roles } = useUsers();

  const activeCount = users.filter(u => u.is_active).length;
  const todayLogs = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">المستخدمون والصلاحيات</h1>
          <p className="text-sm text-muted-foreground">إدارة المستخدمين وأدوارهم وصلاحياتهم ومتابعة سجل النشاط</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center px-3 py-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-muted-foreground">المستخدمون النشطون</p>
            <p className="text-lg text-blue-600">{activeCount}</p>
          </div>
          <div className="text-center px-3 py-2 bg-purple-50 rounded-lg">
            <p className="text-xs text-muted-foreground">عمليات اليوم</p>
            <p className="text-lg text-purple-600">{todayLogs}</p>
          </div>
          <div className="text-center px-3 py-2 bg-green-50 rounded-lg">
            <p className="text-xs text-muted-foreground">الأدوار</p>
            <p className="text-lg text-green-600">{roles.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'logs' && <LogsTab />}
    </div>
  );
}
