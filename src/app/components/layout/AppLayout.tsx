import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, BookOpen, Users, Package, Warehouse, Landmark, Building2,
  FileText, ShoppingCart, Receipt, CreditCard, DollarSign, BookOpenCheck,
  ClipboardList, Scale, TrendingUp, FileSearch, ChevronDown, ChevronLeft, Lock,
  Menu, X, ArrowLeftRight, Cloud, CloudOff, Loader2, Database, UserCog,
  Building, Clock, CalendarDays, Wallet, Calculator, BarChart3, FileSpreadsheet, Settings,
  Factory, Workflow, Wrench, Shield, LogOut, GitBranch, ChevronUp
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { useAuth } from '../../context/AuthContext';

interface NavGroup {
  title: string;
  icon: React.ReactNode;
  dashboardPath: string;
  items: { title: string; path: string; icon: React.ReactNode }[];
}

const navGroups: NavGroup[] = [
  {
    title: 'الحسابات',
    icon: <BookOpenCheck className="w-4 h-4" />,
    dashboardPath: '/app/accounts',
    items: [
      { title: 'شجرة الحسابات', path: '/app/accounts/tree', icon: <BookOpenCheck className="w-4 h-4" /> },
    ],
  },
  {
    title: 'جهات الاتصال',
    icon: <Users className="w-4 h-4" />,
    dashboardPath: '/app/contacts',
    items: [
      { title: 'إدارة جهات الاتصال', path: '/app/contacts/list', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    title: 'المخازن والأصناف',
    icon: <Package className="w-4 h-4" />,
    dashboardPath: '/app/inventory',
    items: [
      { title: 'إدارة المخازن والأصناف', path: '/app/inventory/manage', icon: <Package className="w-4 h-4" /> },
      { title: 'جرد المخزون', path: '/app/inventory/adjustment', icon: <ClipboardList className="w-4 h-4" /> },
    ],
  },
  {
    title: 'الخزينة والبنوك',
    icon: <Landmark className="w-4 h-4" />,
    dashboardPath: '/app/treasury',
    items: [
      { title: 'إدارة الخزينة والبنوك', path: '/app/treasury/manage', icon: <Landmark className="w-4 h-4" /> },
    ],
  },
  {
    title: 'الفواتير',
    icon: <FileText className="w-4 h-4" />,
    dashboardPath: '/app/invoices',
    items: [
      { title: 'إدارة الفواتير', path: '/app/invoices/manage', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    title: 'التقارير المالية',
    icon: <BarChart3 className="w-4 h-4" />,
    dashboardPath: '/app/reports',
    items: [
      { title: 'دفتر اليومية وميزان المراجعة', path: '/app/reports/journal', icon: <BookOpenCheck className="w-4 h-4" /> },
      { title: 'الميزانية العمومية', path: '/app/reports/balance-sheet', icon: <Scale className="w-4 h-4" /> },
      { title: 'أعمار الديون', path: '/app/reports/aging', icon: <Clock className="w-4 h-4" /> },
      { title: 'التدفقات النقدية', path: '/app/reports/cash-flow', icon: <TrendingUp className="w-4 h-4" /> },
      { title: 'إقفال السنة المالية', path: '/app/reports/fiscal-closing', icon: <Lock className="w-4 h-4" /> },
    ],
  },
  {
    title: 'الرواتب والموظفين',
    icon: <UserCog className="w-4 h-4" />,
    dashboardPath: '/app/payroll',
    items: [
      { title: 'الاقسام', path: '/app/payroll/departments', icon: <Building className="w-4 h-4" /> },
      { title: 'الموظفين', path: '/app/payroll/employees', icon: <Users className="w-4 h-4" /> },
      { title: 'فواتير الانتاج', path: '/app/payroll/production-invoices', icon: <FileText className="w-4 h-4" /> },
      { title: 'ساعات العمل', path: '/app/payroll/work-hours', icon: <Clock className="w-4 h-4" /> },
      { title: 'الحضور والانصراف', path: '/app/payroll/attendance', icon: <CalendarDays className="w-4 h-4" /> },
      { title: 'المعاملات المالية', path: '/app/payroll/transactions', icon: <Wallet className="w-4 h-4" /> },
      { title: 'معالجة الرواتب', path: '/app/payroll/processing', icon: <Calculator className="w-4 h-4" /> },
      { title: 'التقارير', path: '/app/payroll/reports', icon: <BarChart3 className="w-4 h-4" /> },
      { title: 'كشف حساب موظف', path: '/app/payroll/employee-statement', icon: <FileSpreadsheet className="w-4 h-4" /> },
      { title: 'اعدادات الرواتب', path: '/app/payroll/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
  {
    title: 'التصنيع',
    icon: <Factory className="w-4 h-4" />,
    dashboardPath: '/app/manufacturing',
    items: [
      { title: 'المنتجات', path: '/app/manufacturing/products', icon: <Package className="w-4 h-4" /> },
      { title: 'مراحل الإنتاج', path: '/app/manufacturing/stages', icon: <Workflow className="w-4 h-4" /> },
      { title: 'فاتورة إنتاج', path: '/app/manufacturing/invoice', icon: <FileText className="w-4 h-4" /> },
      { title: 'مخازن المراحل', path: '/app/manufacturing/warehouses', icon: <Warehouse className="w-4 h-4" /> },
      { title: 'التكاليف', path: '/app/manufacturing/costing', icon: <DollarSign className="w-4 h-4" /> },
      { title: 'التقارير', path: '/app/manufacturing/reports', icon: <BarChart3 className="w-4 h-4" /> },
      { title: 'الإعدادات', path: '/app/manufacturing/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
  {
    title: 'المستخدمون والصلاحيات',
    icon: <UserCog className="w-4 h-4" />,
    dashboardPath: '/app/users',
    items: [
      { title: 'إدارة المستخدمين', path: '/app/users/manage', icon: <Users className="w-4 h-4" /> },
      { title: 'إدارة الفروع', path: '/app/branches', icon: <Building2 className="w-4 h-4" /> },
    ],
  },
  {
    title: 'مرجع النظام',
    icon: <Shield className="w-4 h-4" />,
    dashboardPath: '/app/system-reference',
    items: [],
  },
];


export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isSaving, lastSaved } = useAccounting();
  const { organization, orgUser, branches, currentBranch, setCurrentBranch, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(navGroups.map(g => [g.title, true]))
  );

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) setBranchDropdownOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (group: NavGroup) => location.pathname === group.dashboardPath || location.pathname.startsWith(group.dashboardPath + '/');

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/app" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpenCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] text-foreground">المحاسب</h1>
            <p className="text-[11px] text-muted-foreground">نظام محاسبة متكامل</p>
          </div>
        </Link>
      </div>

      {/* Dashboard link */}
      <div className="px-3 pt-3">
        <Link
          to="/app"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-[13px] ${
            location.pathname === '/app' || location.pathname === '/app/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>لوحة التحكم</span>
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navGroups.map(group => (
          <div key={group.title}>
            <div className="flex items-center justify-between">
              <Link
                to={group.dashboardPath}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 text-[12px] rounded-r-lg transition-colors ${
                  isActive(group.dashboardPath)
                    ? 'text-blue-700 bg-blue-50/50'
                    : isGroupActive(group)
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {group.icon}
                {group.title}
              </Link>
              {group.items.length > 0 && (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedGroups[group.title] ? '' : '-rotate-90'}`} />
                </button>
              )}
            </div>
            {expandedGroups[group.title] && (
              <div className="space-y-0.5 mr-2">
                {group.items.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div dir="rtl" className="flex h-screen bg-background" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col border-l border-border bg-card transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-card shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 gap-3">
          {/* Left: menu + page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) setSidebarOpen(s => !s);
                else setMobileSidebarOpen(s => !s);
              }}
              className="p-2 rounded-lg hover:bg-accent transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-[14px] text-foreground hidden sm:block truncate">
              {navGroups.flatMap(g => g.items).find(i => isActive(i.path))?.title
                || navGroups.find(g => isActive(g.dashboardPath))?.title
                || (location.pathname.startsWith('/app') ? 'لوحة التحكم' : '')}
            </h2>
          </div>

          {/* Right: branch selector + save status + user menu */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Save status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50 text-[12px] text-muted-foreground">
              {isSaving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /><span className="text-blue-600">حفظ...</span></>
              ) : lastSaved ? (
                <><Cloud className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600">محفوظ</span></>
              ) : (
                <><Database className="w-3.5 h-3.5" /><span>متصل</span></>
              )}
            </div>

            {/* Branch Selector */}
            {branches && branches.length > 0 && (
              <div className="relative" ref={branchRef}>
                <button
                  onClick={() => setBranchDropdownOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/60 hover:bg-accent text-[12px] font-medium text-foreground transition-colors border border-border"
                >
                  <GitBranch className="w-3.5 h-3.5 text-blue-500" />
                  <span className="max-w-[100px] truncate">{currentBranch?.name || 'الفرع الرئيسي'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {branchDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {branches.map(br => (
                      <button
                        key={br.id}
                        onClick={() => { setCurrentBranch(br); setBranchDropdownOpen(false); }}
                        className={`w-full text-right px-3 py-2 text-[13px] flex items-center gap-2 transition-colors ${
                          currentBranch?.id === br.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-accent text-foreground'
                        }`}
                      >
                        <GitBranch className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{br.name}</span>
                        {br.is_main && <span className="text-[10px] text-muted-foreground mr-auto">رئيسي</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User / Org Menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ background: orgUser?.avatar_color || '#3B82F6' }}
                >
                  {(orgUser?.full_name || organization?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-[12px] font-semibold text-foreground leading-none truncate max-w-[120px]">{organization?.name || 'شركتي'}</p>
                  <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{orgUser?.role || 'مستخدم'}</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-[12px] font-semibold text-foreground truncate">{orgUser?.full_name || 'المستخدم'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{organization?.name}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-right flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-[15px] text-muted-foreground">جاري تحميل البيانات من قاعدة البيانات...</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}