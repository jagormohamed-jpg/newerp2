import type { Account, ExpenseCategory, ItemCategory } from '../types/accounting';

let idCounter = 100;
const uid = () => String(++idCounter);

export const defaultAccounts: Account[] = [
  // === Assets ===
  { id: 'a1', account_code: '1000', account_name: 'الأصول', account_type: 'assets', parent_id: null, level: 1, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a2', account_code: '1100', account_name: 'الأصول المتداولة', account_type: 'assets', parent_id: 'a1', level: 2, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a3', account_code: '1101', account_name: 'الصندوق الرئيسي', account_type: 'assets', parent_id: 'a2', level: 3, is_parent: false, is_active: true, opening_balance: 50000, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a4', account_code: '1102', account_name: 'صندوق فرعي', account_type: 'assets', parent_id: 'a2', level: 3, is_parent: false, is_active: true, opening_balance: 10000, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a5', account_code: '1103', account_name: 'بنك الأهلي', account_type: 'assets', parent_id: 'a2', level: 3, is_parent: false, is_active: true, opening_balance: 100000, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a6', account_code: '1104', account_name: 'بنك مصر', account_type: 'assets', parent_id: 'a2', level: 3, is_parent: false, is_active: true, opening_balance: 75000, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a7', account_code: '1105', account_name: 'العملاء', account_type: 'assets', parent_id: 'a2', level: 3, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a8', account_code: '1106', account_name: 'المخزون', account_type: 'assets', parent_id: 'a2', level: 3, is_parent: false, is_active: true, opening_balance: 200000, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a9', account_code: '1200', account_name: 'الأصول الثابتة', account_type: 'assets', parent_id: 'a1', level: 2, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a10', account_code: '1201', account_name: 'سيارات', account_type: 'assets', parent_id: 'a9', level: 3, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'a11', account_code: '1202', account_name: 'أثاث ومعدات', account_type: 'assets', parent_id: 'a9', level: 3, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  // === Liabilities ===
  { id: 'l1', account_code: '2000', account_name: 'الخصوم', account_type: 'liabilities', parent_id: null, level: 1, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'l2', account_code: '2100', account_name: 'خصوم متداولة', account_type: 'liabilities', parent_id: 'l1', level: 2, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'l3', account_code: '2101', account_name: 'الموردين', account_type: 'liabilities', parent_id: 'l2', level: 3, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'l4', account_code: '2102', account_name: 'ضرائب مستحقة', account_type: 'liabilities', parent_id: 'l2', level: 3, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'l5', account_code: '2200', account_name: 'خصوم طويلة الأجل', account_type: 'liabilities', parent_id: 'l1', level: 2, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'l6', account_code: '2201', account_name: 'قروض', account_type: 'liabilities', parent_id: 'l5', level: 3, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  // === Equity ===
  { id: 'e1', account_code: '3000', account_name: 'حقوق الملكية', account_type: 'equity', parent_id: null, level: 1, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'e2', account_code: '3001', account_name: 'رأس المال', account_type: 'equity', parent_id: 'e1', level: 2, is_parent: false, is_active: true, opening_balance: 435000, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'e3', account_code: '3002', account_name: 'أرباح مرحّلة', account_type: 'equity', parent_id: 'e1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  // === Revenue ===
  { id: 'r1', account_code: '4000', account_name: 'الإيرادات', account_type: 'revenue', parent_id: null, level: 1, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'r2', account_code: '4001', account_name: 'إيرادات المبيعات', account_type: 'revenue', parent_id: 'r1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'r3', account_code: '4002', account_name: 'إيرادات خدمات', account_type: 'revenue', parent_id: 'r1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'r4', account_code: '4003', account_name: 'إيرادات أخرى', account_type: 'revenue', parent_id: 'r1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  // === Expenses ===
  { id: 'x1', account_code: '5000', account_name: 'المصروفات', account_type: 'expense', parent_id: null, level: 1, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'x2', account_code: '5001', account_name: 'تكلفة البضاعة المباعة', account_type: 'expense', parent_id: 'x1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'x3', account_code: '5002', account_name: 'رواتب وأجور', account_type: 'expense', parent_id: 'x1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'x4', account_code: '5003', account_name: 'إيجارات', account_type: 'expense', parent_id: 'x1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'x5', account_code: '5004', account_name: 'كهرباء ومياه', account_type: 'expense', parent_id: 'x1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'x6', account_code: '5005', account_name: 'مواصلات', account_type: 'expense', parent_id: 'x1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'x7', account_code: '5099', account_name: 'مصروفات متنوعة', account_type: 'expense', parent_id: 'x1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  // === Tax Accounts ===
  { id: 'tax-input', account_code: '1108', account_name: 'ضريبة مدخلات (مشتريات)', account_type: 'assets', parent_id: 'a2', level: 3, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'tax-output', account_code: '2104', account_name: 'ضريبة مخرجات (مبيعات)', account_type: 'liabilities', parent_id: 'l2', level: 3, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  // === Returns Accounts ===
  { id: 'r5', account_code: '4004', account_name: 'مردودات مبيعات', account_type: 'revenue', parent_id: 'r1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'x8', account_code: '5006', account_name: 'مردودات مشتريات', account_type: 'expense', parent_id: 'x1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
  // === Income Summary (for year-end closing) ===
  { id: 'e4', account_code: '3003', account_name: 'ملخص الدخل', account_type: 'equity', parent_id: 'e1', level: 2, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: new Date().toISOString() },
];

export const defaultExpenseCategories: ExpenseCategory[] = [
  { id: 'ec1', name: 'رواتب وأجور', account_id: 'x3', is_active: true },
  { id: 'ec2', name: 'إ��جارات', account_id: 'x4', is_active: true },
  { id: 'ec3', name: 'كهرباء ومياه', account_id: 'x5', is_active: true },
  { id: 'ec4', name: 'مواصلات', account_id: 'x6', is_active: true },
  { id: 'ec5', name: 'مصروفات متنوعة', account_id: 'x7', is_active: true },
];

export const defaultItemCategories: ItemCategory[] = [
  { id: 'ic1', name: 'أجهزة إلكترونية', parent_id: null, is_active: true },
  { id: 'ic2', name: 'مستلزمات مكتبية', parent_id: null, is_active: true },
  { id: 'ic3', name: 'قطع غيار', parent_id: null, is_active: true },
  { id: 'ic-mfg-mat', name: 'مواد خام تصنيع', parent_id: null, is_active: true },
  { id: 'ic-mfg-fg', name: 'منتجات تامة الصنع', parent_id: null, is_active: true },
];