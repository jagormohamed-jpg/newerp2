// ============================================================
// Manufacturing Integration Data
// Raw materials, finished goods, warehouses, and accounts
// that bridge Manufacturing Module ↔ Accounting System
// ============================================================

import type { Item, ItemStock, Warehouse, ItemCategory } from '../types/accounting';
import type { Account } from '../types/accounting';

const ts = new Date().toISOString();

// ============ Manufacturing Warehouses ============
export const manufacturingWarehouses: Warehouse[] = [
  {
    id: 'w-mfg',
    name: 'مخزن التصنيع (مواد خام)',
    location: 'المصنع',
    manager_name: 'مدير التصنيع',
    is_active: true,
    created_at: ts,
  },
  {
    id: 'w-fg',
    name: 'مخزن المنتجات التامة',
    location: 'المصنع',
    manager_name: 'مدير التصنيع',
    is_active: true,
    created_at: ts,
  },
];

// ============ Manufacturing Item Categories ============
export const manufacturingItemCategories: ItemCategory[] = [
  { id: 'ic-mfg-mat', name: 'مواد خام تصنيع', parent_id: null, is_active: true },
  { id: 'ic-mfg-fg', name: 'منتجات تامة الصنع', parent_id: null, is_active: true },
];

// ============ Raw Material Items (mat-1 … mat-10) ============
// inventory_item_id mappings: mat-1→im-1, mat-2→im-2, …
export const manufacturingRawMaterials: Item[] = [
  { id: 'im-1', item_code: 'RM-001', item_name: 'قماش قطني أبيض', category_id: 'ic-mfg-mat', unit: 'متر', item_type: 'raw_material', purchase_price: 25, selling_price: 25, minimum_stock: 100, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
  { id: 'im-2', item_code: 'RM-002', item_name: 'خيط بوليستر', category_id: 'ic-mfg-mat', unit: 'بكرة', item_type: 'raw_material', purchase_price: 5, selling_price: 5, minimum_stock: 200, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
  { id: 'im-3', item_code: 'RM-003', item_name: 'أزرار بلاستيك', category_id: 'ic-mfg-mat', unit: 'قطعة', item_type: 'raw_material', purchase_price: 0.5, selling_price: 0.5, minimum_stock: 1000, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
  { id: 'im-4', item_code: 'RM-004', item_name: 'سحاب معدني', category_id: 'ic-mfg-mat', unit: 'قطعة', item_type: 'raw_material', purchase_price: 3, selling_price: 3, minimum_stock: 500, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
  { id: 'im-5', item_code: 'RM-005', item_name: 'قماش جينز', category_id: 'ic-mfg-mat', unit: 'متر', item_type: 'raw_material', purchase_price: 45, selling_price: 45, minimum_stock: 100, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
  { id: 'im-6', item_code: 'RM-006', item_name: 'قماش حرير', category_id: 'ic-mfg-mat', unit: 'متر', item_type: 'raw_material', purchase_price: 80, selling_price: 80, minimum_stock: 50, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
  { id: 'im-7', item_code: 'RM-007', item_name: 'بطانة داخلية', category_id: 'ic-mfg-mat', unit: 'متر', item_type: 'raw_material', purchase_price: 12, selling_price: 12, minimum_stock: 100, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
  { id: 'im-8', item_code: 'RM-008', item_name: 'كيس تغليف', category_id: 'ic-mfg-mat', unit: 'قطعة', item_type: 'raw_material', purchase_price: 1.5, selling_price: 1.5, minimum_stock: 500, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
  { id: 'im-9', item_code: 'RM-009', item_name: 'ملصق علامة تجارية', category_id: 'ic-mfg-mat', unit: 'قطعة', item_type: 'raw_material', purchase_price: 2, selling_price: 2, minimum_stock: 500, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
  { id: 'im-10', item_code: 'RM-010', item_name: 'حبر طباعة', category_id: 'ic-mfg-mat', unit: 'لتر', item_type: 'raw_material', purchase_price: 120, selling_price: 120, minimum_stock: 10, barcode: '', description: 'مادة خام للتصنيع', is_active: true, created_at: ts },
];

// ============ Finished Goods Items (prod-1 … prod-4) ============
// inventory_item_id mappings: prod-1→ifg-1, prod-2→ifg-2, …
export const manufacturingFinishedGoods: Item[] = [
  { id: 'ifg-1', item_code: 'FG-001', item_name: 'قميص قطني رجالي', category_id: 'ic-mfg-fg', unit: 'قطعة', item_type: 'sellable', purchase_price: 82.5, selling_price: 180, minimum_stock: 20, barcode: '', description: 'منتج تصنيع', is_active: true, created_at: ts },
  { id: 'ifg-2', item_code: 'FG-002', item_name: 'بنطلون جينز', category_id: 'ic-mfg-fg', unit: 'قطعة', item_type: 'sellable', purchase_price: 140, selling_price: 280, minimum_stock: 10, barcode: '', description: 'منتج تصنيع', is_active: true, created_at: ts },
  { id: 'ifg-3', item_code: 'FG-003', item_name: 'تيشيرت مطبوع', category_id: 'ic-mfg-fg', unit: 'قطعة', item_type: 'sellable', purchase_price: 55, selling_price: 120, minimum_stock: 30, barcode: '', description: 'منتج تصنيع', is_active: true, created_at: ts },
  { id: 'ifg-4', item_code: 'FG-004', item_name: 'فستان حرير نسائي', category_id: 'ic-mfg-fg', unit: 'قطعة', item_type: 'sellable', purchase_price: 320, selling_price: 550, minimum_stock: 5, barcode: '', description: 'منتج تصنيع', is_active: true, created_at: ts },
];

// ============ Initial Stock for manufacturing warehouses ============
export const manufacturingInitialStock: ItemStock[] = [
  // Raw materials in w-mfg
  { id: 'is-m1', item_id: 'im-1', warehouse_id: 'w-mfg', quantity: 500, average_cost: 25, last_updated: ts },
  { id: 'is-m2', item_id: 'im-2', warehouse_id: 'w-mfg', quantity: 300, average_cost: 5, last_updated: ts },
  { id: 'is-m3', item_id: 'im-3', warehouse_id: 'w-mfg', quantity: 2000, average_cost: 0.5, last_updated: ts },
  { id: 'is-m4', item_id: 'im-4', warehouse_id: 'w-mfg', quantity: 800, average_cost: 3, last_updated: ts },
  { id: 'is-m5', item_id: 'im-5', warehouse_id: 'w-mfg', quantity: 200, average_cost: 45, last_updated: ts },
  { id: 'is-m6', item_id: 'im-6', warehouse_id: 'w-mfg', quantity: 100, average_cost: 80, last_updated: ts },
  { id: 'is-m7', item_id: 'im-7', warehouse_id: 'w-mfg', quantity: 150, average_cost: 12, last_updated: ts },
  { id: 'is-m8', item_id: 'im-8', warehouse_id: 'w-mfg', quantity: 1000, average_cost: 1.5, last_updated: ts },
  { id: 'is-m9', item_id: 'im-9', warehouse_id: 'w-mfg', quantity: 1000, average_cost: 2, last_updated: ts },
  { id: 'is-m10', item_id: 'im-10', warehouse_id: 'w-mfg', quantity: 20, average_cost: 120, last_updated: ts },
  // Finished goods in w-fg (starting at zero — filled via production)
  { id: 'is-fg1', item_id: 'ifg-1', warehouse_id: 'w-fg', quantity: 0, average_cost: 82.5, last_updated: ts },
  { id: 'is-fg2', item_id: 'ifg-2', warehouse_id: 'w-fg', quantity: 0, average_cost: 140, last_updated: ts },
  { id: 'is-fg3', item_id: 'ifg-3', warehouse_id: 'w-fg', quantity: 0, average_cost: 55, last_updated: ts },
  { id: 'is-fg4', item_id: 'ifg-4', warehouse_id: 'w-fg', quantity: 0, average_cost: 320, last_updated: ts },
];

// ============ Manufacturing Chart of Accounts ============
export const manufacturingAccounts: Account[] = [
  // مجموعة مخزون التصنيع (under الأصول المتداولة a2)
  { id: 'mfg-inv', account_code: '1107', account_name: 'مخزون التصنيع', account_type: 'assets', parent_id: 'a2', level: 3, is_parent: true, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: ts },
  { id: 'mfg-raw', account_code: '1107-001', account_name: 'مواد خام للتصنيع', account_type: 'assets', parent_id: 'mfg-inv', level: 4, is_parent: false, is_active: true, opening_balance: 15000, balance_type: 'debit', created_at: ts },
  { id: 'mfg-wip', account_code: '1107-002', account_name: 'إنتاج تحت التشغيل', account_type: 'assets', parent_id: 'mfg-inv', level: 4, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: ts },
  { id: 'mfg-fg', account_code: '1107-003', account_name: 'مخزون منتجات تامة', account_type: 'assets', parent_id: 'mfg-inv', level: 4, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'debit', created_at: ts },
  // أجور عمال إنتاج مستحقة (under خصوم متداولة l2)
  { id: 'mfg-wages', account_code: '2103', account_name: 'أجور عمال إنتاج مستحقة', account_type: 'liabilities', parent_id: 'l2', level: 3, is_parent: false, is_active: true, opening_balance: 0, balance_type: 'credit', created_at: ts },
];

// ============ Material → Inventory Item mapping ============
// mat-id → inventory item id
export const materialInventoryMap: Record<string, string> = {
  'mat-1': 'im-1',
  'mat-2': 'im-2',
  'mat-3': 'im-3',
  'mat-4': 'im-4',
  'mat-5': 'im-5',
  'mat-6': 'im-6',
  'mat-7': 'im-7',
  'mat-8': 'im-8',
  'mat-9': 'im-9',
  'mat-10': 'im-10',
};

// ============ Manufacturing Product → Inventory Item mapping ============
// prod-id → inventory item id
export const productInventoryMap: Record<string, string> = {
  'prod-1': 'ifg-1',
  'prod-2': 'ifg-2',
  'prod-3': 'ifg-3',
  'prod-4': 'ifg-4',
};
