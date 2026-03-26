import React from 'react';
import { Link } from 'react-router';
import { UserCog, Shield, Users, Key, List, Lock } from 'lucide-react';

export function UsersDashboard() {
  // Mock data since users module uses its own context
  const stats = {
    totalUsers: 3,
    activeUsers: 2,
    roles: 3,
    admins: 1,
  };

  const roles = [
    { name: 'مدير النظام', users: 1, permissions: 'كامل', color: 'bg-red-100 text-red-700' },
    { name: 'محاسب', users: 1, permissions: 'محاسبة + تقارير', color: 'bg-blue-100 text-blue-700' },
    { name: 'موظف', users: 1, permissions: 'عرض فقط', color: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl flex items-center gap-2 text-foreground">
            <UserCog className="w-6 h-6 text-violet-600" /> لوحة تحكم المستخدمين والصلاحيات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة المستخدمين والأدوار والصلاحيات</p>
        </div>
        <Link to="/users/manage" className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors">
          <List className="w-4 h-4" /> إدارة المستخدمين
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-violet-600 mx-auto mb-2" />
          <p className="text-xs text-violet-600 mb-1">إجمالي المستخدمين</p>
          <p className="text-2xl text-violet-800">{stats.totalUsers}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-emerald-600 mb-1">مستخدمين نشطين</p>
          <p className="text-2xl text-emerald-800">{stats.activeUsers}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-blue-600 mb-1">الأدوار</p>
          <p className="text-2xl text-blue-800">{stats.roles}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <Key className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-xs text-red-600 mb-1">مديرين</p>
          <p className="text-2xl text-red-800">{stats.admins}</p>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm text-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" /> الأدوار والصلاحيات</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {roles.map(role => (
            <div key={role.name} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-lg text-xs ${role.color}`}>{role.name}</span>
                <span className="text-muted-foreground">{role.users} مستخدم</span>
              </div>
              <span className="text-xs text-muted-foreground">{role.permissions}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-amber-800">ملاحظة أمنية</p>
          <p className="text-xs text-amber-600 mt-1">يجب ربط النظام بـ Supabase Auth لتفعيل نظام تسجيل الدخول والصلاحيات الحقيقي. حالياً يعمل بنظام محلي للتطوير.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { title: 'إدارة المستخدمين', path: '/users/manage', icon: <Users className="w-5 h-5" />, color: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
          { title: 'إعدادات الأدوار', path: '/users/manage', icon: <Shield className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
          { title: 'إعدادات الشركة', path: '/company-settings', icon: <Key className="w-5 h-5" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
        ].map(a => (
          <Link key={a.title} to={a.path} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${a.color}`}>
            {a.icon}
            <span className="text-sm">{a.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
