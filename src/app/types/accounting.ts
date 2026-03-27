// ============ Chart of Accounts ============
export type AccountType = 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expense';
export type BalanceType = 'debit' | 'credit';

export interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_id: string | null;
  level: number;
  is_parent: boolean;
  is_active: boolean;
  opening_balance: number;
  balance_type: BalanceType;
  created_at: string;
}

// ============ Contacts ============
export type ContactType = 'customer' | 'supplier' | 'both';

export interface Contact {
  id: string;
  contact_type: ContactType;
  name: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  tax_number: string;
  credit_limit: number;
  account_id: string;
  opening_balance: number;
  notes: string;
  is_active: boolean;
  group_id: string;
  price_list_id: string;
  created_at: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description: string;
  contact_type: ContactType | 'all';
  created_at: string;
}

export interface PriceList {
  id: string;
  name: string;
  contact_type: 'customer' | 'supplier';
  description: string;
  is_active: boolean;
  items: PriceListItem[];
  created_at: string;
}

export interface PriceListItem {
  item_id: string;
  price: number;
}

// ============ Items & Warehouses ============
export interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager_name: string;
  is_active: boolean;
  created_at: string;
}

// ============ Units of Measure ============
export interface UnitOfMeasure {
  id: string;
  name: string;
  symbol: string;
  base_unit_id: string | null; // null = base unit
  conversion_rate: number; // how many of sub-unit = 1 base unit
  is_active: boolean;
  created_at: string;
}

export interface ItemCategory {
  id: string;
  name: string;
  parent_id: string | null;
  is_active: boolean;
}

export type ItemType = 'sellable' | 'raw_material' | 'service';

export interface Item {
  id: string;
  item_code: string;
  item_name: string;
  category_id: string;
  unit: string;
  unit_id?: string;
  item_type?: ItemType;
  has_variants?: boolean;
  purchase_price: number;
  selling_price: number;
  minimum_stock: number;
  barcode: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface ItemVariant {
  id: string;
  item_id: string;
  variant_name: string;
  attributes: { key: string; value: string }[];
  sku: string;
  barcode: string;
  purchase_price: number;
  selling_price: number;
  is_active: boolean;
}

export interface ItemStock {
  id: string;
  item_id: string;
  warehouse_id: string;
  quantity: number;
  average_cost: number;
  last_updated: string;
}

export interface WarehouseTransfer {
  id: string;
  transfer_number: string;
  transfer_date: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  notes: string;
  items: WarehouseTransferItem[];
  created_at: string;
}

export interface WarehouseTransferItem {
  item_id: string;
  quantity: number;
  unit_cost: number;
}

// ============ Treasuries & Banks ============
export interface Treasury {
  id: string;
  name: string;
  account_id: string;
  current_balance: number;
  opening_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface TreasuryTransaction {
  id: string;
  treasury_id: string;
  transaction_date: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  balance_after: number;
  source_type: string;
  source_id: string;
  description: string;
  created_at: string;
}

export interface Bank {
  id: string;
  bank_name: string;
  account_number: string;
  branch: string;
  account_id: string;
  current_balance: number;
  opening_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface BankTransaction {
  id: string;
  bank_id: string;
  transaction_date: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  balance_after: number;
  check_number: string;
  source_type: string;
  source_id: string;
  description: string;
  created_at: string;
}

// ============ Invoices ============
export type PaymentType = 'cash' | 'credit' | 'partial';
export type InvoiceStatus = 'new' | 'partial' | 'paid' | 'cancelled';

// ============ New Comprehensive Invoice Types ============
export type InvoiceDocType = 'sales' | 'purchase' | 'sales_return' | 'purchase_return' | 'inventory_count' | 'damages';
export type InvoiceDocStatus = 'quote' | 'draft' | 'pending' | 'received' | 'paid' | 'partial' | 'cash_received' | 'returned' | 'cancelled';
export type InvoicePaymentMethod = 'cash' | 'credit' | 'partial' | 'multiple' | 'on_delivery';

export interface ShippingCompany {
  id: string;
  name: string;
  phone: string;
  address: string;
  account_id: string;
  commission_rate: number;
  notes: string;
  is_active: boolean;
  created_at: string;
}

export interface InvoiceLineExtra {
  id: string;
  description: string;
  amount: number;
  account_id: string;
  is_internal: boolean; // true = مصاريف داخلية، false = إضافات تظهر للعميل
}

export interface InvoicePaymentEntry {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'bank' | 'check';
  treasury_id: string;
  bank_id: string;
  check_number: string;
  notes: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceDocType;
  invoice_status: InvoiceDocStatus;
  invoice_date: string;
  due_date: string;
  contact_id: string;
  warehouse_id: string;
  shipping_company_id: string;
  shipping_cost: number;
  tracking_number: string;
  payment_method: InvoicePaymentMethod;
  treasury_id: string;
  bank_id: string;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  extras_total: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payments: InvoicePaymentEntry[];
  line_extras: InvoiceLineExtra[];
  notes: string;
  internal_notes: string;
  reference_invoice_id: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  cost_price: number;
  warehouse_id: string;
}

export interface InvoiceSettings {
  sell_at_last_customer_price: boolean;
  warn_below_purchase_price: boolean;
  warn_below_minimum_price: boolean;
  prefix_sales: string;
  prefix_purchase: string;
  prefix_sales_return: string;
  prefix_purchase_return: string;
  prefix_inventory: string;
  prefix_damages: string;
  default_warehouse_id: string;
  default_treasury_id: string;
  default_payment_method: InvoicePaymentMethod;
  allow_negative_stock: boolean;
  show_profit: boolean;
}

// ============ Legacy Invoice Types (for backward compatibility) ============
export interface SalesInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  contact_id: string;
  warehouse_id: string;
  payment_type: PaymentType;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  treasury_id: string;
  bank_id: string;
  status: InvoiceStatus;
  notes: string;
  created_at: string;
}

export interface SalesInvoiceItem {
  id: string;
  invoice_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
  cost_price: number;
  warehouse_id: string;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  contact_id: string;
  warehouse_id: string;
  payment_type: PaymentType;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  treasury_id: string;
  bank_id: string;
  status: InvoiceStatus;
  notes: string;
  created_at: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  invoice_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
  warehouse_id: string;
}

// ============ Receipts & Payments ============
export type VoucherPaymentMethod = 'cash' | 'check' | 'bank_transfer';

export interface Receipt {
  id: string;
  receipt_number: string;
  receipt_date: string;
  contact_id: string;
  amount: number;
  payment_method: VoucherPaymentMethod;
  treasury_id: string;
  bank_id: string;
  check_number: string;
  check_date: string;
  related_invoice_id: string;
  description: string;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  payment_date: string;
  contact_id: string;
  amount: number;
  payment_method: VoucherPaymentMethod;
  treasury_id: string;
  bank_id: string;
  check_number: string;
  check_date: string;
  related_invoice_id: string;
  description: string;
  created_at: string;
}

// ============ Expenses ============
export interface ExpenseCategory {
  id: string;
  name: string;
  account_id: string;
  is_active: boolean;
}

export interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  expense_category_id: string;
  account_id: string;
  amount: number;
  payment_method: 'cash' | 'bank';
  treasury_id: string;
  bank_id: string;
  description: string;
  created_at: string;
}

// ============ Checks ============
export type CheckStatus = 'pending' | 'under_collection' | 'collected' | 'bounced' | 'endorsed' | 'cancelled';
export type CheckType = 'received' | 'issued';

export interface Check {
  id: string;
  check_number: string;
  check_date: string;
  amount: number;
  check_type: CheckType;
  status: CheckStatus;
  bank_name: string;
  drawer_name: string;
  beneficiary_name: string;
  contact_id: string;
  source_type: 'receipt' | 'payment';
  source_id: string;
  treasury_id: string;
  bank_id: string;
  notes: string;
  status_history: { status: CheckStatus; date: string; notes: string }[];
  created_at: string;
}

// ============ Journal Entries ============
export type SourceType = 
  | 'sales_invoice' 
  | 'purchase_invoice' 
  | 'sales_return' 
  | 'purchase_return'
  | 'receipt' 
  | 'payment' 
  | 'expense' 
  | 'transfer' 
  | 'opening_balance'
  | 'manufacturing_invoice'
  | 'finished_goods_transfer'
  | 'payroll'
  | 'fiscal_close'
  | 'inventory_adjustment'
  | 'cogs'
  | 'check'
  | 'manual';

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  source_type: SourceType;
  source_id: string;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  is_posted: boolean;
  created_at: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string;
  contact_id: string;
}

// ============ App State ============
export interface AccountingState {
  accounts: Account[];
  contacts: Contact[];
  contactGroups: ContactGroup[];
  priceLists: PriceList[];
  warehouses: Warehouse[];
  unitsOfMeasure: UnitOfMeasure[];
  itemCategories: ItemCategory[];
  items: Item[];
  itemVariants: ItemVariant[];
  itemStock: ItemStock[];
  warehouseTransfers: WarehouseTransfer[];
  treasuries: Treasury[];
  treasuryTransactions: TreasuryTransaction[];
  banks: Bank[];
  bankTransactions: BankTransaction[];
  salesInvoices: SalesInvoice[];
  salesInvoiceItems: SalesInvoiceItem[];
  purchaseInvoices: PurchaseInvoice[];
  purchaseInvoiceItems: PurchaseInvoiceItem[];
  receipts: Receipt[];
  payments: Payment[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  checks: Check[];
  journalEntries: JournalEntry[];
  journalEntryLines: JournalEntryLine[];
  // New comprehensive invoice system
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  shippingCompanies: ShippingCompany[];
  invoiceSettings: InvoiceSettings;
}