import React, { useState } from 'react';
import {
  BookOpenCheck, Factory, Users, Package, Landmark, FileText, BarChart3,
  UserCog, Settings, ChevronDown, ChevronLeft, CircleCheck, CircleX,
  AlertTriangle, Clock, ArrowRight, ArrowLeft, Database, Workflow,
  Building2, Wallet, CreditCard, Receipt, Calculator, Shield,
  Layers, Target, Zap, GitBranch, Link2, ArrowLeftRight
} from 'lucide-react';

// =============================================
// SYSTEM REFERENCE & BUSINESS LOGIC PLAN
// =============================================

type TabId = 'overview' | 'modules' | 'accounts' | 'flows' | 'gaps' | 'plan';

interface ModuleInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'complete' | 'partial' | 'planned';
  pages: string[];
  context: string;
  types: string[];
  integrations: string[];
  description: string;
  businessLogic: string[];
  missingLogic: string[];
}

interface AccountNode {
  code: string;
  name: string;
  id: string;
  type: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expense';
  children?: AccountNode[];
}

interface JournalFlow {
  trigger: string;
  source: string;
  entries: { debit: string; credit: string; description: string }[];
  status: 'working' | 'missing' | 'partial';
  module: string;
}

interface GapItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  module: string;
  effort: 'small' | 'medium' | 'large';
  dependencies: string[];
}

interface PlanPhase {
  phase: number;
  title: string;
  description: string;
  duration: string;
  tasks: { task: string; status: 'done' | 'in-progress' | 'todo'; details: string }[];
}

// ============ DATA ============

const modules: ModuleInfo[] = [
  {
    id: 'accounts',
    name: 'دليل الحسابات والقيود',
    icon: <BookOpenCheck className="w-5 h-5" />,
    status: 'complete',
    pages: ['AccountsPage', 'ChartOfAccountsPage', 'JournalEntriesPage', 'GeneralLedgerPage', 'AccountStatementPage', 'TrialBalancePage', 'IncomeStatementPage'],
    context: 'AccountingContext.tsx',
    types: ['Account', 'JournalEntry', 'JournalEntryLine', 'AccountType', 'BalanceType', 'SourceType'],
    integrations: ['كل المديولات - القيود التلقائية'],
    description: 'الشجرة المحاسبية كاملة مع إنشاء القيود التلقائي من كل العمليات. يدعم الحسابات الفرعية والآباء ومستويات متعددة.',
    businessLogic: [
      'إنشاء قيد تلقائي لكل عملية مالية',
      'حساب الأرصدة بناءً على طبيعة الحساب (مدين/دائن)',
      'ميزان المراجعة التلقائي',
      'كشف حساب لأي حساب',
      'الأرصدة الافتتاحية',
    ],
    missingLogic: [
      'إقفال السنة المالية',
      'تسويات جردية',
      'قيود يدوية',
      'حذف/عكس قيد يدوي',
    ],
  },
  {
    id: 'contacts',
    name: 'جهات الاتصال',
    icon: <Users className="w-5 h-5" />,
    status: 'complete',
    pages: ['ContactsPage'],
    context: 'AccountingContext.tsx',
    types: ['Contact', 'ContactGroup', 'PriceList', 'ContactType'],
    integrations: ['الحسابات (حساب فرعي لكل جهة)', 'الفواتير', 'سندات القبض/الصرف'],
    description: 'إدارة العملاء والموردين مع ربط تلقائي بالحسابات. يدعم المجموعات وقوائم الأسعار والاستيراد الجماعي.',
    businessLogic: [
      'إنشاء حساب فرعي تلقائي (عملاء/موردين)',
      'مجموعات جهات الاتصال',
      'قوائم أسعار مخصصة',
      'حدود ائتمان',
      'استيراد جماعي',
    ],
    missingLogic: [
      'تحذير عند تجاوز حد الائتمان أثناء الفاتورة',
      'تقاد�� أرصدة العملاء (Aging Report)',
      'كشف حساب عميل/مورد مفصل',
    ],
  },
  {
    id: 'inventory',
    name: 'المخزون والأصناف',
    icon: <Package className="w-5 h-5" />,
    status: 'complete',
    pages: ['WarehouseModulePage', 'WarehousesPage', 'ItemsPage'],
    context: 'AccountingContext.tsx',
    types: ['Item', 'ItemStock', 'Warehouse', 'ItemCategory', 'ItemVariant', 'UnitOfMeasure', 'WarehouseTransfer', 'ItemType'],
    integrations: ['الفواتير (خصم/إضافة)', 'التصنيع (مواد خام + منتجات تامة)', 'التقارير'],
    description: 'إدارة متعددة المخازن مع تتبع الكميات والتكلفة المتوسطة. يدعم الوحدات والمتغيرات والتحويلات بين المخازن.',
    businessLogic: [
      'تكلفة متوسطة مرجحة (Weighted Average)',
      'تحويل بين المخازن',
      'وحدات قياس مع معامل تحويل',
      'متغيرات الأصناف (ألوان، مقاسات)',
      'تحديث جماعي للأسعار',
      'استيراد جماعي للأصناف',
      'مخازن التصنيع (مواد خام + منتجات تامة)',
    ],
    missingLogic: [
      'تقييم المخزون بطريقة FIFO/LIFO',
      'جرد المخزون مع قيد تسوية',
      'تنبيهات نقص المخزون',
      'تقرير حركة صنف تفصيلي',
      'ربط سعر المواد الخام بآخر سعر شراء تلقائياً',
    ],
  },
  {
    id: 'treasury',
    name: 'الخزينة والبنوك',
    icon: <Landmark className="w-5 h-5" />,
    status: 'complete',
    pages: ['TreasuryModulePage'],
    context: 'AccountingContext.tsx',
    types: ['Treasury', 'TreasuryTransaction', 'Bank', 'BankTransaction', 'Receipt', 'Payment', 'Expense', 'Check'],
    integrations: ['الحسابات', 'الفواتير', 'المصروفات', 'الشيكات'],
    description: 'إدارة الصناديق والبنوك مع سندات القبض والصرف والتحويلات. يدعم الشيكات بحالاتها المختلفة.',
    businessLogic: [
      'سند قبض → قيد: مدين صندوق/بنك ← دائن عميل',
      'سند صرف → قيد: مدين مورد ← دائن صندوق/بنك',
      'مصروف → قيد: مدين مصروف ← دائن صندوق/بنك',
      'تحويل → قيد: مدين وجهة ← دائن مصدر',
      'تحديث أرصدة الخزائن والبنوك تلقائياً',
      'تتبع حالات الشيكات',
    ],
    missingLogic: [
      'تسوية بنكية (Bank Reconciliation)',
      'شيكات تحت التحصيل مع قيد محاسبي',
      'ربط سند القبض بفاتورة محددة وتحديث حالتها',
    ],
  },
  {
    id: 'invoices',
    name: 'الفواتير',
    icon: <FileText className="w-5 h-5" />,
    status: 'partial',
    pages: ['InvoiceModulePage', 'SalesInvoicePage', 'PurchaseInvoicePage'],
    context: 'AccountingContext.tsx',
    types: ['Invoice', 'InvoiceItem', 'InvoiceDocType', 'InvoiceDocStatus', 'SalesInvoice', 'PurchaseInvoice', 'ShippingCompany', 'InvoiceSettings'],
    integrations: ['الحسابات', 'المخزون', 'الخزينة', 'جهات الاتصال', 'شركات الشحن'],
    description: 'نظام فواتير شامل يدعم البيع والشراء والمرتجعات والجرد والإتلاف. نظامان: قديم (Legacy) وجديد (Comprehensive).',
    businessLogic: [
      'فاتورة بيع → قيد: مدين صندوق/عميل ← دائن إيرادات',
      'فاتورة شراء → قيد: مدين مخزون ← دائن صندوق/مورد',
      'خصم المخزون تلقائياً عند البيع',
      'إضافة المخزون عند الشراء مع تحديث التكلفة',
      'دعم نقدي/آجل/جزئي/متعدد',
      'شركات شحن مع تتبع',
    ],
    missingLogic: [
      'قيد تكلفة البضاعة المباعة (COGS) عند البيع ❗',
      'مرتجع بيع مع إرجاع المخزون وعكس القيد ❗',
      'مرتجع شراء مع خصم المخزون وعكس القيد ❗',
      'ربط المبيعات بمخزن المنتجات التامة',
      'فاتورة شراء مواد خام مع ربطها بحساب التصنيع',
      'عروض أسعار (Quote) → تحويل لفاتورة',
      'فاتورة تحت التأكيد (Draft) → تأكيد',
      'ضريبة القيمة المضافة في القيد',
      'خصم الفاتورة في القيد',
      'دفعات متعددة على فاتورة آجلة',
    ],
  },
  {
    id: 'payroll',
    name: 'الرواتب والعمال',
    icon: <Wallet className="w-5 h-5" />,
    status: 'complete',
    pages: ['PayrollDashboardPage', 'DepartmentsPage', 'EmployeesPage', 'ProductionInvoicesPage', 'WorkHoursPage', 'AttendancePage', 'TransactionsPage', 'PayrollProcessingPage', 'PayrollReportsPage', 'EmployeeStatementPage', 'PayrollSettingsPage'],
    context: 'PayrollContext.tsx',
    types: ['Employee', 'Department', 'ProductionInvoice', 'WorkHours', 'DailyAttendance', 'EmployeeTransaction', 'Advance', 'PayrollPeriod', 'EmployeePayroll'],
    integrations: ['التصنيع (ربط عمال الإنتاج)', 'الحسابات (عند صرف الرواتب)'],
    description: 'نظام رواتب متكامل يدعم 3 أنواع: إنتاج بالقطعة، ساعات، يومية. مع السلف والحضور والمعاملات المالية.',
    businessLogic: [
      'حساب الراتب حسب النوع (قطعة/ساعة/يوم)',
      'خصم السلف تلقائياً من الراتب',
      'تتبع الحضور والانصراف',
      'معالجة الرواتب الدورية',
      'كشف حساب موظف',
      'تقارير شاملة',
    ],
    missingLogic: [
      'قيد محاسبي تلقائي عند اعتماد الرواتب ❗',
      'ربط صرف الرواتب بالخزينة/البنك',
      'قيد: مدين رواتب وأجور ← دائن صندوق/بنك',
      'تأمينات اجتماعية وضرائب الدخل',
    ],
  },
  {
    id: 'manufacturing',
    name: 'التصنيع',
    icon: <Factory className="w-5 h-5" />,
    status: 'complete',
    pages: ['ManufacturingDashboard', 'ManufacturingProductsPage', 'ProductionStagesPage', 'ManufacturingInvoicePage', 'StageWarehousesPage', 'CostingPage', 'ManufacturingReportsPage', 'ManufacturingSettingsPage'],
    context: 'ManufacturingContext.tsx',
    types: ['ManufacturingProduct', 'ProductionStage', 'ManufacturingInvoice', 'StageWarehouse', 'ProductCost', 'ManufacturingSettings'],
    integrations: ['المخزون (مواد خام + منتجات تامة)', 'الحسابات (قيود إنتاج)', 'الرواتب (عمال الإنتاج)'],
    description: 'مديول تصنيع كامل مع مراحل إنتاج وحساب تكلفة وربط بالمخزون والمحاسبة. يدعم القطعة والساعة والأسبوع.',
    businessLogic: [
      'تأكيد فاتورة إنتاج → قيد: مدين إنتاج تحت التشغيل ← دائن مواد خام + أجور',
      'تحويل للمخزون التام → قيد: مدين منتجات تامة ← دائن إنتاج تحت التشغيل',
      'خصم المواد الخام من مخزن التصنيع',
      'إضافة المنتجات التامة لمخزن المنتجات',
      'حساب تكلفة المنتج (مواد + أجور + مصاريف)',
      'عكس فاتورة إنتاج',
    ],
    missingLogic: [
      'ربط بيع المنتجات التامة بقيد تكلفة البضاعة المباعة ❗',
      'أمر إنتاج (Production Order) قبل الفاتورة',
      'تتبع الهالك وقيده المحاسبي',
    ],
  },
  {
    id: 'reports',
    name: 'التقارير المالية',
    icon: <BarChart3 className="w-5 h-5" />,
    status: 'partial',
    pages: ['ReportsModulePage'],
    context: 'AccountingContext.tsx',
    types: [],
    integrations: ['كل المديولات'],
    description: 'تقارير مالية تشمل ميزان المراجعة وقائمة الدخل وكشف الحساب.',
    businessLogic: [
      'ميزان المراجعة',
      'قائمة الدخل',
      'كشف حساب',
      'دفتر الأستاذ',
    ],
    missingLogic: [
      'الميزانية العمومية (Balance Sheet)',
      'تقرير التدفقات النقدية',
      'تقرير المبيعات بالتفصيل',
      'تقرير المشتريات بالتفصيل',
      'تقرير أعمار الديون',
      'تقرير الأرباح والخسائر التفصيلي',
      'تقارير مقارنة بين الفترات',
    ],
  },
  {
    id: 'users',
    name: 'المستخدمين والصلاحيات',
    icon: <UserCog className="w-5 h-5" />,
    status: 'complete',
    pages: ['UsersModulePage'],
    context: 'UsersContext.tsx',
    types: ['SystemUser', 'Role', 'ActivityLog', 'ModulePermission', 'RolePermissions'],
    integrations: ['كل المديولات (التحكم بالوصول)'],
    description: 'نظام مستخدمين وأدوار وصلاحيات مع سجل نشاطات. يدعم أدوار مسبقة وتخصيص كامل.',
    businessLogic: [
      'أدوار مسبقة (مدير، محاسب، مبيعات، مخازن، رواتب)',
      'صلاحيات لكل مديول (عرض، إضافة، تعديل، حذف، طباعة، تصدير)',
      'سجل نشاطات',
    ],
    missingLogic: [
      'تطبيق الصلاحيات فعلياً على الواجهات',
      'تسجيل دخول حقيقي',
    ],
  },
  {
    id: 'company',
    name: 'إعدادات الشركة',
    icon: <Settings className="w-5 h-5" />,
    status: 'complete',
    pages: ['CompanySettingsPage'],
    context: 'CompanyContext.tsx',
    types: ['CompanyInfo', 'BusinessActivity', 'CurrencyCode'],
    integrations: ['كل المديولات (العملة، الضريبة، الميزات)'],
    description: 'إعدادات الشركة تشمل النشاط التجاري، العملة، الضريبة، وتفعيل/تعطيل المديولات.',
    businessLogic: [
      'تفعيل/تعطيل المديولات حسب النشاط',
      'إعدادات الضريبة والعملة',
      'معلومات الشركة للطباعة',
    ],
    missingLogic: [],
  },
];

const journalFlows: JournalFlow[] = [
  // Working flows
  { trigger: 'فاتورة بيع نقدية', source: 'CREATE_SALES_INVOICE', entries: [{ debit: 'الصندوق (1101)', credit: 'إيرادات المبيعات (4001)', description: 'بيع نقدي' }], status: 'working', module: 'invoices' },
  { trigger: 'فاتورة بيع آجلة', source: 'CREATE_SALES_INVOICE', entries: [{ debit: 'العميل (1105-XXX)', credit: 'إيرادات المبيعات (4001)', description: 'بيع آجل' }], status: 'working', module: 'invoices' },
  { trigger: 'فاتورة بيع جزئية', source: 'CREATE_SALES_INVOICE', entries: [{ debit: 'الصندوق + العميل', credit: 'إيرادات المبيعات (4001)', description: 'بيع جزئي' }], status: 'working', module: 'invoices' },
  { trigger: 'فاتورة شراء نقدية', source: 'CREATE_PURCHASE_INVOICE', entries: [{ debit: 'المخزون (1106)', credit: 'الصندوق (1101)', description: 'شراء نقدي' }], status: 'working', module: 'invoices' },
  { trigger: 'فاتورة شراء آجلة', source: 'CREATE_PURCHASE_INVOICE', entries: [{ debit: 'المخزون (1106)', credit: 'المورد (2101-XXX)', description: 'شراء آجل' }], status: 'working', module: 'invoices' },
  { trigger: 'سند قبض', source: 'CREATE_RECEIPT', entries: [{ debit: 'الصندوق/البنك', credit: 'العميل (1105-XXX)', description: 'تحصيل' }], status: 'working', module: 'treasury' },
  { trigger: 'سند صرف', source: 'CREATE_PAYMENT', entries: [{ debit: 'المورد (2101-XXX)', credit: 'الصندوق/البنك', description: 'سداد' }], status: 'working', module: 'treasury' },
  { trigger: 'مصروف', source: 'CREATE_EXPENSE', entries: [{ debit: 'حساب المصروف (5XXX)', credit: 'الصندوق/البنك', description: 'صرف مصروف' }], status: 'working', module: 'treasury' },
  { trigger: 'تحويل بين خزائن/بنوك', source: 'CREATE_TRANSFER', entries: [{ debit: 'الجهة المستلمة', credit: 'الجهة المرسلة', description: 'تحويل' }], status: 'working', module: 'treasury' },
  { trigger: 'تأكيد فاتورة إنتاج', source: 'CREATE_MANUFACTURING_JOURNAL', entries: [{ debit: 'إنتاج تحت التشغيل (1107-002)', credit: 'مواد خام (1107-001) + أجور (2103)', description: 'إنتاج' }], status: 'working', module: 'manufacturing' },
  { trigger: 'تحويل منتج للمخزون التام', source: 'CREATE_MANUFACTURING_JOURNAL', entries: [{ debit: 'منتجات تامة (1107-003)', credit: 'إنتاج تحت التشغيل (1107-002)', description: 'تحويل إنتاج' }], status: 'working', module: 'manufacturing' },
  { trigger: 'فاتورة نظام جديد (بيع/شراء)', source: 'CREATE_INVOICE', entries: [{ debit: 'حسب النوع', credit: 'حسب النوع', description: 'فاتورة شاملة' }], status: 'working', module: 'invoices' },
  // Missing flows
  { trigger: 'تكلفة البضاعة المباعة عند البيع', source: 'غير موجود', entries: [{ debit: 'ت.ب.م (5001)', credit: 'المخزون (1106/1107-003)', description: 'تكلفة مبيعات' }], status: 'missing', module: 'invoices' },
  { trigger: 'مرتجع بيع', source: 'غير موجود', entries: [{ debit: 'مردودات مبيعات', credit: 'العميل/الصندوق', description: 'مرتجع بيع' }], status: 'missing', module: 'invoices' },
  { trigger: 'مرتجع شراء', source: 'غير موجود', entries: [{ debit: 'المورد/الصندوق', credit: 'المخزون', description: 'مرتجع شراء' }], status: 'missing', module: 'invoices' },
  { trigger: 'اعتماد مسير رواتب', source: 'غير موجود', entries: [{ debit: 'رواتب وأجور (5002)', credit: 'الصندوق/البنك', description: 'صرف رواتب' }], status: 'missing', module: 'payroll' },
  { trigger: 'شراء مواد خام تصنيع', source: 'غير موجود', entries: [{ debit: 'مواد خام (1107-001)', credit: 'الصندوق/المورد', description: 'شراء مواد خام' }], status: 'missing', module: 'invoices' },
  { trigger: 'ضريبة القيمة المضافة', source: 'غير موجود', entries: [{ debit: 'ضريبة مدخلات/ت.ب.م', credit: 'ضريبة مخرجات/ضرائب مستحقة', description: 'ضريبة' }], status: 'missing', module: 'invoices' },
  { trigger: 'إقفال السنة المالية', source: 'غير موجود', entries: [{ debit: 'حسب الطبيعة', credit: 'أرباح مرحّلة (3002)', description: 'إقفال' }], status: 'missing', module: 'accounts' },
  { trigger: 'عكس فاتورة إنتاج', source: 'CREATE_MANUFACTURING_JOURNAL (reverse)', entries: [{ debit: 'مواد خام + أجور', credit: 'إنتاج تحت التشغيل', description: 'عكس إنتاج' }], status: 'working', module: 'manufacturing' },
];

const gaps: GapItem[] = [
  {
    id: 'g1', title: 'قيد تكلفة البضاعة المباعة (COGS)', 
    description: 'عند البيع، يجب إنشاء قيد إضافي: مدين ت.ب.م (5001) ← دائن المخزون (1106 أو 1107-003). هذا ضروري لحساب مجمل الربح الحقيقي.',
    severity: 'critical', module: 'الفواتير', effort: 'medium', dependencies: []
  },
  {
    id: 'g2', title: 'ربط المبيعات بمخزن المنتجات التامة',
    description: 'عند بيع منتج تصنيع (ifg-1..4)، يجب السحب من مخزن المنتجات التامة (w-fg) وليس المخزن الرئيسي، مع قيد COGS على حساب 1107-003.',
    severity: 'critical', module: 'الفواتير + التصنيع', effort: 'medium', dependencies: ['g1']
  },
  {
    id: 'g3', title: 'فاتورة شراء مواد خام تصنيع',
    description: 'إنشاء فاتورة شراء مخصصة للمواد الخام تُدخل البضاعة لمخزن التصنيع (w-mfg) وتُقيّد على حساب مواد خام (1107-001) بدل المخزون العام.',
    severity: 'high', module: 'الفواتير', effort: 'medium', dependencies: []
  },
  {
    id: 'g4', title: 'قيد صرف الرواتب',
    description: 'عند اعتماد مسير الرواتب، يجب إنشاء قيد: مدين رواتب (5002) ← دائن صندوق/بنك، وتحديث رصيد الخزينة.',
    severity: 'critical', module: 'الرواتب', effort: 'large', dependencies: []
  },
  {
    id: 'g5', title: 'مرتجع البيع',
    description: 'إنشاء فاتورة مرتجع بيع تعكس القيد الأصلي (مدين إيرادات ← دائن عميل/صندوق) وتُرجع الأصناف للمخزون.',
    severity: 'high', module: 'الفواتير', effort: 'large', dependencies: ['g1']
  },
  {
    id: 'g6', title: 'مرتجع الشراء',
    description: 'إنشاء فاتورة مرتجع شراء تعكس القيد (مدين مورد/صندوق ← دائن مخزون) وتخصم الأصناف.',
    severity: 'high', module: 'الفواتير', effort: 'large', dependencies: []
  },
  {
    id: 'g7', title: 'ضريبة القيمة المضافة في القيود',
    description: 'إضافة حساب ضريبة مدخلات وضريبة مخرجات. عند البيع: مدين عميل ← دائن إيرادات + ضريبة مخرجات. عند الشراء: مدين مخزون + ضريبة مدخلات ← دائن مورد.',
    severity: 'medium', module: 'الفواتير', effort: 'large', dependencies: []
  },
  {
    id: 'g8', title: 'إقفال السنة المالية',
    description: 'إقفال حسابات الإيرادات والمصروفات وتحويل الفرق لأرباح مرحّلة (3002).',
    severity: 'medium', module: 'الحسابات', effort: 'medium', dependencies: []
  },
  {
    id: 'g9', title: 'الميزانية العمومية',
    description: 'تقرير يعرض الأصول = الخصوم + حقوق الملكية في تاريخ محدد.',
    severity: 'medium', module: 'التقارير', effort: 'medium', dependencies: ['g8']
  },
  {
    id: 'g10', title: 'تطبيق الصلاحيات فعلياً',
    description: 'تفعيل نظام الصلاحيات المبني فعلياً على واجهات المديولات (إخفاء أزرار، منع وصول).',
    severity: 'low', module: 'المستخدمين', effort: 'large', dependencies: []
  },
  {
    id: 'g11', title: 'ربط سند القبض/الصرف بالفاتورة',
    description: 'عند سداد فاتورة آجلة، يجب تحديث حالة الفاتورة (paid/partial) تلقائياً.',
    severity: 'high', module: 'الخزينة + الفواتير', effort: 'medium', dependencies: []
  },
  {
    id: 'g12', title: 'تسوية بنكية',
    description: 'مطابقة كشف البنك مع حركات النظام وإنشاء قيود الفروقات.',
    severity: 'low', module: 'الخزينة', effort: 'large', dependencies: []
  },
];

const planPhases: PlanPhase[] = [
  {
    phase: 1,
    title: 'البنية التحتية المحاسبية الحرجة',
    description: 'إكمال الدورة المحاسبية الأساسية لضمان صحة الأرقام',
    duration: 'أولوية قصوى',
    tasks: [
      { task: 'إضافة قيد COGS عند البيع', status: 'done', details: 'تم: في CREATE_SALES_INVOICE و CREATE_INVOICE يُنشأ قيد COGS تلقائي: مدين 5001 ← دائن حساب المخزون المناسب (1106 أو 1107-003)' },
      { task: 'ربط بيع المنتجات التامة بالمخزن الصحيح', status: 'done', details: 'تم: getInventoryAccountForItem تحدد الحساب الصحيح تلقائياً حسب تصنيف الصنف' },
      { task: 'فاتورة شراء مواد خام (على حساب 1107-001)', status: 'done', details: 'تم: فاتورة الشراء تُوجه تلقائياً للحساب الصحيح حسب نوع الصنف (مواد خام → 1107-001)' },
      { task: 'قيد صرف الرواتب المعتمدة', status: 'done', details: 'تم: CREATE_PAYROLL_JOURNAL action يُنشئ قيد: مدين 5002 ← دائن خزينة/بنك ويحدّث الأرصدة' },
    ],
  },
  {
    phase: 2,
    title: 'المرتجعات والعكس',
    description: 'إكمال دورة المرتجعات لضمان عدم فقدان البيانات',
    duration: 'أولوية عالية',
    tasks: [
      { task: 'مرتجع بيع كامل', status: 'done', details: 'تم: REVERSE_SALES_INVOICE يعكس قيد المبيعات + COGS + يرجع المخزون + يحدّث الخزينة' },
      { task: 'مرتجع شراء كامل', status: 'done', details: 'تم: REVERSE_PURCHASE_INVOICE يعكس قيد الشراء + يخصم المخزون + يحدّث الخزينة' },
      { task: 'ربط سند القبض بالفاتورة', status: 'done', details: 'تم: CREATE_RECEIPT يحدّث paid_amount و status في الفاتورة المرتبطة تلقائياً' },
      { task: 'دفعات متعددة على فاتورة آجلة', status: 'done', details: 'تم: ADD_INVOICE_PAYMENT يضيف دفعة ويحدّث حالة الفاتورة (partial/paid)' },
    ],
  },
  {
    phase: 3,
    title: 'الضرائب والتقارير المتقدمة',
    description: 'ضريبة القيمة المضافة والتقارير المالية المتقدمة',
    duration: 'أولوية متوسطة',
    tasks: [
      { task: 'إضافة حسابات الضريبة', status: 'done', details: 'تم: حساب 1108 ضريبة مدخلات + 2104 ضريبة مخرجات' },
      { task: 'قيد الضريبة في الفواتير', status: 'done', details: 'تم: البيع يفصل الضريبة على 2104، والشراء على 1108 تلقائياً' },
      { task: 'الميزانية العمومية', status: 'done', details: 'تم: صفحة BalanceSheetPage مع المعادلة المحاسبية والتفاصيل' },
      { task: 'تقرير التدفقات النقدية', status: 'done', details: 'تم: صفحة CashFlowPage مع تحليل المصادر والأرصدة' },
      { task: 'تقرير أعمار الديون', status: 'done', details: 'تم: صفحة AgingReportPage مع تصنيف الأرصدة (0-30, 31-60, 61-90, 91-120, +120)' },
    ],
  },
  {
    phase: 4,
    title: 'الإقفال والتسويات',
    description: 'إقفال السنة المالية وتسويات المخزون والبنك',
    duration: 'أولوية منخفضة',
    tasks: [
      { task: 'إقفال حسابات الإيرادات والمصروفات', status: 'done', details: 'تم: صفحة FiscalClosingPage مع قيد إقفال كامل يغلق الإيرادات والمصروفات ويحول الفرق لأرباح مرحّلة (3002)' },
      { task: 'جرد المخزون مع قيد تسوية', status: 'done', details: 'تم: صفحة InventoryAdjustmentPage تقارن الكمية الفعلية بالدفترية وتنشئ قيد فروقات تلقائي' },
      { task: 'تسوية بنكية', status: 'todo', details: 'مطابقة كشف البنك مع الحركات وإنشاء قيود الفروقات' },
      { task: 'تطبيق الصلاحيات على الواجهات', status: 'todo', details: 'استخدام بيانات الأدوار من UsersContext لإخفاء/إظهار العناصر' },
    ],
  },
];

const accountTree: AccountNode[] = [
  {
    code: '1000', name: 'الأصول', id: 'a1', type: 'assets',
    children: [
      {
        code: '1100', name: 'الأصول المتداولة', id: 'a2', type: 'assets',
        children: [
          { code: '1101', name: 'الصندوق الرئيسي', id: 'a3', type: 'assets' },
          { code: '1102', name: 'صندوق فرعي', id: 'a4', type: 'assets' },
          { code: '1103', name: 'بنك الأهلي', id: 'a5', type: 'assets' },
          { code: '1104', name: 'بنك مصر', id: 'a6', type: 'assets' },
          { code: '1105', name: 'العملاء', id: 'a7', type: 'assets', children: [
            { code: '1105-001', name: 'شركة النور', id: 'ca1', type: 'assets' },
            { code: '1105-002', name: 'محلات الأمل', id: 'ca2', type: 'assets' },
          ]},
          { code: '1106', name: 'المخزون', id: 'a8', type: 'assets' },
          { code: '1107', name: 'مخزون التصنيع', id: 'mfg-inv', type: 'assets', children: [
            { code: '1107-001', name: 'مواد خام', id: 'mfg-raw', type: 'assets' },
            { code: '1107-002', name: 'إنتاج تحت التشغيل', id: 'mfg-wip', type: 'assets' },
            { code: '1107-003', name: 'منتجات تامة', id: 'mfg-fg', type: 'assets' },
          ]},
        ],
      },
      {
        code: '1200', name: 'الأصول الثابتة', id: 'a9', type: 'assets',
        children: [
          { code: '1201', name: 'سيارات', id: 'a10', type: 'assets' },
          { code: '1202', name: 'أثاث ومعدات', id: 'a11', type: 'assets' },
        ],
      },
    ],
  },
  {
    code: '2000', name: 'الخصوم', id: 'l1', type: 'liabilities',
    children: [
      {
        code: '2100', name: 'خصوم متداولة', id: 'l2', type: 'liabilities',
        children: [
          { code: '2101', name: 'الموردين', id: 'l3', type: 'liabilities', children: [
            { code: '2101-001', name: 'مصنع السلام', id: 'sa1', type: 'liabilities' },
            { code: '2101-002', name: 'شركة التوحيد', id: 'sa2', type: 'liabilities' },
          ]},
          { code: '2102', name: 'ضرائب مستحقة', id: 'l4', type: 'liabilities' },
          { code: '2103', name: 'أجور عمال إنتاج مستحقة', id: 'mfg-wages', type: 'liabilities' },
        ],
      },
      {
        code: '2200', name: 'خصوم طويلة الأجل', id: 'l5', type: 'liabilities',
        children: [
          { code: '2201', name: 'قروض', id: 'l6', type: 'liabilities' },
        ],
      },
    ],
  },
  {
    code: '3000', name: 'حقوق الملكية', id: 'e1', type: 'equity',
    children: [
      { code: '3001', name: 'رأس المال', id: 'e2', type: 'equity' },
      { code: '3002', name: 'أرباح مرحّلة', id: 'e3', type: 'equity' },
    ],
  },
  {
    code: '4000', name: 'الإيرادات', id: 'r1', type: 'revenue',
    children: [
      { code: '4001', name: 'إيرادات المبيعات', id: 'r2', type: 'revenue' },
      { code: '4002', name: 'إيرادات خدمات', id: 'r3', type: 'revenue' },
      { code: '4003', name: 'إيرادات أخرى', id: 'r4', type: 'revenue' },
    ],
  },
  {
    code: '5000', name: 'المصروفات', id: 'x1', type: 'expense',
    children: [
      { code: '5001', name: 'تكلفة البضاعة المباعة', id: 'x2', type: 'expense' },
      { code: '5002', name: 'رواتب وأجور', id: 'x3', type: 'expense' },
      { code: '5003', name: 'إيجارات', id: 'x4', type: 'expense' },
      { code: '5004', name: 'كهرباء ومياه', id: 'x5', type: 'expense' },
      { code: '5005', name: 'مواصلات', id: 'x6', type: 'expense' },
      { code: '5099', name: 'مصروفات متنوعة', id: 'x7', type: 'expense' },
    ],
  },
];

// ============ COMPONENTS ============

function StatusBadge({ status }: { status: 'complete' | 'partial' | 'planned' | 'working' | 'missing' }) {
  const config = {
    complete: { bg: 'bg-emerald-100 text-emerald-800', icon: <CircleCheck className="w-3.5 h-3.5" />, label: 'مكتمل' },
    partial: { bg: 'bg-amber-100 text-amber-800', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'جزئي' },
    planned: { bg: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3.5 h-3.5" />, label: 'مخطط' },
    working: { bg: 'bg-emerald-100 text-emerald-800', icon: <CircleCheck className="w-3.5 h-3.5" />, label: 'يعمل' },
    missing: { bg: 'bg-red-100 text-red-800', icon: <CircleX className="w-3.5 h-3.5" />, label: 'مفقود' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${c.bg}`}>
      {c.icon} {c.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: 'critical' | 'high' | 'medium' | 'low' }) {
  const config = {
    critical: { bg: 'bg-red-100 text-red-800 border-red-200', label: 'حرج' },
    high: { bg: 'bg-orange-100 text-orange-800 border-orange-200', label: 'عالي' },
    medium: { bg: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'متوسط' },
    low: { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'منخفض' },
  };
  const c = config[severity];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${c.bg}`}>{c.label}</span>;
}

function AccountTreeNode({ node, depth = 0 }: { node: AccountNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const typeColors: Record<string, string> = {
    assets: 'text-blue-600',
    liabilities: 'text-red-600',
    equity: 'text-purple-600',
    revenue: 'text-emerald-600',
    expense: 'text-orange-600',
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer transition-colors`}
        style={{ paddingRight: `${depth * 24 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronLeft className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className={`font-mono text-xs ${typeColors[node.type] || 'text-gray-500'}`}>{node.code}</span>
        <span className="text-sm text-gray-800">{node.name}</span>
        {hasChildren && <span className="text-xs text-gray-400 mr-auto">({node.children!.length})</span>}
      </div>
      {expanded && hasChildren && node.children!.map(child => (
        <AccountTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// ============ TABS ============

function OverviewTab() {
  const totalPages = modules.reduce((sum, m) => sum + m.pages.length, 0);
  const workingFlows = journalFlows.filter(f => f.status === 'working').length;
  const missingFlows = journalFlows.filter(f => f.status === 'missing').length;
  const criticalGaps = gaps.filter(g => g.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl text-blue-600 mb-1">{modules.length}</div>
          <div className="text-sm text-gray-500">مديول</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl text-emerald-600 mb-1">{totalPages}</div>
          <div className="text-sm text-gray-500">صفحة</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl text-purple-600 mb-1">{workingFlows}/{workingFlows + missingFlows}</div>
          <div className="text-sm text-gray-500">قيد تلقائي</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl text-red-600 mb-1">{criticalGaps}</div>
          <div className="text-sm text-gray-500">ثغرة حرجة</div>
        </div>
      </div>

      {/* Architecture */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-blue-600" /> هيكل النظام</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Frontend: React + TypeScript + Tailwind CSS v4</div>
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-green-500 rounded-full" /> Backend: Supabase Edge Functions</div>
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-purple-500 rounded-full" /> State: React Context + useReducer</div>
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-orange-500 rounded-full" /> Routing: React Router v7 (Data Mode)</div>
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-red-500 rounded-full" /> Persistence: Supabase DB (auto-save debounced 1.5s)</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-teal-500 rounded-full" /> اللغة: عربية (RTL)</div>
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-indigo-500 rounded-full" /> Icons: Lucide React 0.487.0</div>
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-pink-500 rounded-full" /> Notifications: Sonner (Toast)</div>
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-amber-500 rounded-full" /> القاعدة الذهبية: كل عملية = قيد متوازن</div>
            <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 bg-gray-500 rounded-full" /> لا حذف — عمليات عكسية فقط</div>
          </div>
        </div>
      </div>

      {/* File Structure */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg mb-4 flex items-center gap-2"><GitBranch className="w-5 h-5 text-purple-600" /> هيكل الملفات</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="text-blue-600 mb-2 text-sm">src/app/</div>
            <div className="text-gray-600">├── App.tsx</div>
            <div className="text-gray-600">├── routes.tsx</div>
            <div className="text-gray-600">├── types/ (5 ملفات)</div>
            <div className="text-gray-600">├── context/ (5 ملفات)</div>
            <div className="text-gray-600">├── data/ (2 ملفات)</div>
            <div className="text-gray-600">├── components/</div>
            <div className="text-gray-600">│   ├── layout/</div>
            <div className="text-gray-600">│   └── ui/</div>
            <div className="text-gray-600">└── pages/</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="text-emerald-600 mb-2 text-sm">pages/</div>
            <div className="text-gray-600">├── 18 صفحة رئيسية</div>
            <div className="text-gray-600">├── payroll/ (11 صفحة)</div>
            <div className="text-gray-600">├── manufacturing/ (8 صفحات)</div>
            <div className="text-gray-600">└── users/ (1 صفحة)</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="text-orange-600 mb-2 text-sm">contexts/</div>
            <div className="text-gray-600">├── AccountingContext</div>
            <div className="text-gray-500 text-[10px]">   (الحسابات، المخزون، الفواتير، الخزينة)</div>
            <div className="text-gray-600">├── ManufacturingContext</div>
            <div className="text-gray-600">├── PayrollContext</div>
            <div className="text-gray-600">├── CompanyContext</div>
            <div className="text-gray-600">└── UsersContext</div>
          </div>
        </div>
      </div>

      {/* Integration Map */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg mb-4 flex items-center gap-2"><Link2 className="w-5 h-5 text-teal-600" /> خريطة الربط بين المديولات</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[700px] relative">
            {/* Central node */}
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 text-white px-6 py-3 rounded-xl text-center">
                <BookOpenCheck className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">AccountingContext</div>
                <div className="text-[10px] opacity-75">المحرك المحاسبي المركزي</div>
              </div>
            </div>
            {/* Connected modules */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: 'الفواتير', icon: <FileText className="w-4 h-4" />, color: 'bg-emerald-50 border-emerald-200 text-emerald-800', arrows: ['قيد بيع/شراء', 'تحديث مخزون', 'تحديث خزينة'] },
                { name: 'الخزينة', icon: <Landmark className="w-4 h-4" />, color: 'bg-purple-50 border-purple-200 text-purple-800', arrows: ['سندات قبض/صرف', 'تحويلات', 'مصروفات'] },
                { name: 'التصنيع', icon: <Factory className="w-4 h-4" />, color: 'bg-orange-50 border-orange-200 text-orange-800', arrows: ['قيد إنتاج', 'تحديث مخزون مواد خام', 'تحديث مخزون منتجات تامة'] },
                { name: 'الرواتب', icon: <Wallet className="w-4 h-4" />, color: 'bg-pink-50 border-pink-200 text-pink-800', arrows: ['❌ قيد صرف رواتب (مفقود)', 'ربط عمال بالتصنيع'] },
              ].map((m, i) => (
                <div key={i} className={`border rounded-xl p-3 ${m.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {m.icon}
                    <span className="text-sm">{m.name}</span>
                  </div>
                  <div className="space-y-1">
                    {m.arrows.map((a, j) => (
                      <div key={j} className="text-[10px] flex items-center gap-1">
                        <ArrowLeftRight className="w-2.5 h-2.5 shrink-0" /> {a}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModulesTab() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Module Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {modules.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedModule(selectedModule === m.id ? null : m.id)}
            className={`p-3 rounded-xl border text-center transition-all ${
              selectedModule === m.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <div className="flex justify-center mb-2 text-blue-600">{m.icon}</div>
            <div className="text-sm mb-1">{m.name}</div>
            <StatusBadge status={m.status} />
          </button>
        ))}
      </div>

      {/* Module Detail */}
      {selectedModule && (() => {
        const m = modules.find(mod => mod.id === selectedModule)!;
        return (
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-blue-600">{m.icon}</div>
              <div>
                <h3 className="text-lg">{m.name}</h3>
                <p className="text-sm text-gray-500">{m.description}</p>
              </div>
              <div className="mr-auto"><StatusBadge status={m.status} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm text-gray-600 mb-2 flex items-center gap-1"><CircleCheck className="w-3.5 h-3.5 text-emerald-500" /> البزنس لوجيك المبني</h4>
                <div className="space-y-1">
                  {m.businessLogic.map((bl, i) => (
                    <div key={i} className="text-xs text-gray-700 flex items-start gap-1.5 bg-emerald-50 p-1.5 rounded">
                      <CircleCheck className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /> {bl}
                    </div>
                  ))}
                </div>
              </div>
              {m.missingLogic.length > 0 && (
                <div>
                  <h4 className="text-sm text-gray-600 mb-2 flex items-center gap-1"><CircleX className="w-3.5 h-3.5 text-red-500" /> المفقود / المطلوب</h4>
                  <div className="space-y-1">
                    {m.missingLogic.map((ml, i) => (
                      <div key={i} className="text-xs text-gray-700 flex items-start gap-1.5 bg-red-50 p-1.5 rounded">
                        <CircleX className="w-3 h-3 text-red-500 mt-0.5 shrink-0" /> {ml}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 mb-1">الصفحات ({m.pages.length})</div>
                {m.pages.map((p, i) => <div key={i} className="text-gray-700">{p}</div>)}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 mb-1">الأنواع ({m.types.length})</div>
                {m.types.map((t, i) => <div key={i} className="text-blue-700 font-mono">{t}</div>)}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 mb-1">السياق</div>
                <div className="text-purple-700 font-mono">{m.context}</div>
                <div className="text-gray-500 mt-2 mb-1">الربط</div>
                {m.integrations.map((ig, i) => <div key={i} className="text-gray-700">{ig}</div>)}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function AccountsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg mb-4 flex items-center gap-2"><BookOpenCheck className="w-5 h-5 text-blue-600" /> شجرة الحسابات الكاملة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-lg p-2">
            {accountTree.slice(0, 3).map(node => <AccountTreeNode key={node.id} node={node} />)}
          </div>
          <div className="border border-gray-100 rounded-lg p-2">
            {accountTree.slice(3).map(node => <AccountTreeNode key={node.id} node={node} />)}
          </div>
        </div>
      </div>

      {/* Account mapping legend */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg mb-4 flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-purple-600" /> ربط الحسابات بالكيانات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-blue-800 mb-1">الخزائن → حسابات أصول</div>
              <div className="text-xs text-gray-600">الصندوق الرئيسي → 1101 (a3)</div>
              <div className="text-xs text-gray-600">صندوق الفرع → 1102 (a4)</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-blue-800 mb-1">البنوك → حسابات أصول</div>
              <div className="text-xs text-gray-600">بنك الأهلي → 1103 (a5)</div>
              <div className="text-xs text-gray-600">بنك مصر → 1104 (a6)</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="text-emerald-800 mb-1">العملاء → حسابات فرعية تحت 1105</div>
              <div className="text-xs text-gray-600">شركة النور → 1105-001 (ca1)</div>
              <div className="text-xs text-gray-600">محلات الأمل → 1105-002 (ca2)</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-red-800 mb-1">الموردين → حسابات فرعية تحت 2101</div>
              <div className="text-xs text-gray-600">مصنع السلام → 2101-001 (sa1)</div>
              <div className="text-xs text-gray-600">شركة التوحيد → 2101-002 (sa2)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowsTab() {
  const [filter, setFilter] = useState<'all' | 'working' | 'missing'>('all');

  const filtered = filter === 'all' ? journalFlows : journalFlows.filter(f => f.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: `الكل (${journalFlows.length})` },
          { id: 'working', label: `يعمل (${journalFlows.filter(f => f.status === 'working').length})` },
          { id: 'missing', label: `مفقود (${journalFlows.filter(f => f.status === 'missing').length})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Flows */}
      <div className="space-y-3">
        {filtered.map((flow, idx) => (
          <div key={idx} className={`bg-white border rounded-xl p-4 ${flow.status === 'missing' ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={flow.status} />
              <span className="text-sm">{flow.trigger}</span>
              <span className="text-xs text-gray-400 font-mono mr-auto">{flow.source}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{flow.module}</span>
            </div>
            <div className="space-y-2">
              {flow.entries.map((e, j) => (
                <div key={j} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-red-600 text-xs px-1.5 py-0.5 bg-red-50 rounded">مدين</span>
                    <span className="text-gray-800">{e.debit}</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-green-600 text-xs px-1.5 py-0.5 bg-green-50 rounded">دائن</span>
                    <span className="text-gray-800">{e.credit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GapsTab() {
  const [sortBy, setSortBy] = useState<'severity' | 'module'>('severity');
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const sorted = [...gaps].sort((a, b) => {
    if (sortBy === 'severity') return severityOrder[a.severity] - severityOrder[b.severity];
    return a.module.localeCompare(b.module);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">ترتيب:</span>
        <button onClick={() => setSortBy('severity')} className={`px-3 py-1 rounded text-sm ${sortBy === 'severity' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>حسب الأهمية</button>
        <button onClick={() => setSortBy('module')} className={`px-3 py-1 rounded text-sm ${sortBy === 'module' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>حسب المديول</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="text-2xl text-red-700">{gaps.filter(g => g.severity === 'critical').length}</div>
          <div className="text-xs text-red-600">حرج</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
          <div className="text-2xl text-orange-700">{gaps.filter(g => g.severity === 'high').length}</div>
          <div className="text-xs text-orange-600">عالي</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <div className="text-2xl text-yellow-700">{gaps.filter(g => g.severity === 'medium').length}</div>
          <div className="text-xs text-yellow-600">متوسط</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="text-2xl text-blue-700">{gaps.filter(g => g.severity === 'low').length}</div>
          <div className="text-xs text-blue-600">منخفض</div>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map(gap => (
          <div key={gap.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <SeverityBadge severity={gap.severity} />
              <span className="text-sm">{gap.title}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mr-auto">{gap.module}</span>
              <span className="text-xs text-gray-400">مجهود: {gap.effort === 'small' ? 'صغير' : gap.effort === 'medium' ? 'متوسط' : 'كبير'}</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{gap.description}</p>
            {gap.dependencies.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                <span>يعتمد على:</span>
                {gap.dependencies.map(d => {
                  const dep = gaps.find(g => g.id === d);
                  return <span key={d} className="bg-gray-100 px-1.5 py-0.5 rounded">{dep?.title || d}</span>;
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanTab() {
  return (
    <div className="space-y-6">
      {planPhases.map(phase => (
        <div key={phase.phase} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className={`px-5 py-3 flex items-center gap-3 ${
            phase.phase === 1 ? 'bg-red-50 border-b border-red-200' :
            phase.phase === 2 ? 'bg-orange-50 border-b border-orange-200' :
            phase.phase === 3 ? 'bg-yellow-50 border-b border-yellow-200' :
            'bg-blue-50 border-b border-blue-200'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
              phase.phase === 1 ? 'bg-red-600' : phase.phase === 2 ? 'bg-orange-600' : phase.phase === 3 ? 'bg-yellow-600' : 'bg-blue-600'
            }`}>{phase.phase}</div>
            <div>
              <h3 className="text-sm">{phase.title}</h3>
              <p className="text-xs text-gray-500">{phase.description}</p>
            </div>
            <span className={`mr-auto text-xs px-2 py-0.5 rounded ${
              phase.phase === 1 ? 'bg-red-100 text-red-700' : phase.phase === 2 ? 'bg-orange-100 text-orange-700' : phase.phase === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
            }`}>{phase.duration}</span>
          </div>
          <div className="p-4 space-y-3">
            {phase.tasks.map((task, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="mt-0.5">
                  {task.status === 'done' ? <CircleCheck className="w-4 h-4 text-emerald-500" /> :
                   task.status === 'in-progress' ? <Clock className="w-4 h-4 text-amber-500" /> :
                   <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-800 mb-1">{task.task}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{task.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <h3 className="text-lg mb-3 text-blue-800 flex items-center gap-2"><Target className="w-5 h-5" /> ملخص خطة التنفيذ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-700 mb-2">المرحلة 1 تحل:</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-red-500" /> مشكلة عدم ظهور مجمل الربح الحقيقي</div>
              <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-red-500" /> مشكلة خلط مخازن التصنيع مع المخزن العام</div>
              <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-red-500" /> مشكلة عدم وجود قيد للرواتب</div>
            </div>
          </div>
          <div>
            <div className="text-gray-700 mb-2">بعد إكمال المرحلة 1 و 2:</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1"><CircleCheck className="w-3 h-3 text-emerald-500" /> دورة مبيعات كاملة (بيع → COGS → مرتجع)</div>
              <div className="flex items-center gap-1"><CircleCheck className="w-3 h-3 text-emerald-500" /> دورة مشتريات كاملة (شراء → مرتجع)</div>
              <div className="flex items-center gap-1"><CircleCheck className="w-3 h-3 text-emerald-500" /> دورة تصنيع كاملة (مواد خام → إنتاج → بيع)</div>
              <div className="flex items-center gap-1"><CircleCheck className="w-3 h-3 text-emerald-500" /> دورة رواتب كاملة (حساب → اعتماد → صرف)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============

export function SystemReferencePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: <Database className="w-4 h-4" /> },
    { id: 'modules', label: 'المديولات', icon: <Workflow className="w-4 h-4" /> },
    { id: 'accounts', label: 'شجرة الحسابات', icon: <BookOpenCheck className="w-4 h-4" /> },
    { id: 'flows', label: 'القيود التلقائية', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'gaps', label: 'الثغرات', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'plan', label: 'خطة التنفيذ', icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          مرجع النظام الشامل وخطة البزنس لوجيك
        </h1>
        <p className="text-sm text-gray-500">مراجعة كاملة لجميع المديولات، القيود التلقائية، الثغرات، وخطة التطوير</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'modules' && <ModulesTab />}
      {activeTab === 'accounts' && <AccountsTab />}
      {activeTab === 'flows' && <FlowsTab />}
      {activeTab === 'gaps' && <GapsTab />}
      {activeTab === 'plan' && <PlanTab />}
    </div>
  );
}
