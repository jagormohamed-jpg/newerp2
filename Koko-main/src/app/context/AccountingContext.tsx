import React, { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import type {
  AccountingState, Account, Contact, Item, Warehouse, ItemStock,
  Treasury, Bank, SalesInvoice, SalesInvoiceItem, PurchaseInvoice, PurchaseInvoiceItem,
  Receipt, Payment, Expense, ExpenseCategory, ItemCategory,
  JournalEntry, JournalEntryLine, TreasuryTransaction, BankTransaction, SourceType,
  ContactGroup, PriceList, Check, CheckStatus,
  UnitOfMeasure, ItemVariant, WarehouseTransfer,
  Invoice, InvoiceItem, ShippingCompany, InvoiceSettings, InvoiceDocStatus, InvoicePaymentEntry
} from '../types/accounting';
import { defaultAccounts, defaultExpenseCategories, defaultItemCategories } from '../data/defaultAccounts';
import {
  manufacturingWarehouses, manufacturingRawMaterials, manufacturingFinishedGoods,
  manufacturingInitialStock, manufacturingAccounts, manufacturingItemCategories,
} from '../data/manufacturingIntegrationData';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split('T')[0];

// ============ Initial State ============
const defaultInvoiceSettings: InvoiceSettings = {
  sell_at_last_customer_price: true,
  warn_below_purchase_price: true,
  warn_below_minimum_price: true,
  prefix_sales: 'SI',
  prefix_purchase: 'PI',
  prefix_sales_return: 'SR',
  prefix_purchase_return: 'PR',
  prefix_inventory: 'INV',
  prefix_damages: 'DMG',
  default_warehouse_id: 'w1',
  default_treasury_id: 't1',
  default_payment_method: 'cash',
  allow_negative_stock: false,
  show_profit: false,
};

const initialState: AccountingState = {
  accounts: [...defaultAccounts, ...manufacturingAccounts],
  contacts: [
    { id: 'c1', contact_type: 'customer', name: 'شركة النور للتجارة', phone: '01001234567', phone2: '', email: 'info@alnour.com', address: 'القاهرة - مدينة نصر', tax_number: '123456789', credit_limit: 50000, account_id: 'ca1', opening_balance: 15000, notes: '', is_active: true, group_id: '', price_list_id: '', created_at: new Date().toISOString() },
    { id: 'c2', contact_type: 'customer', name: 'محلات الأمل', phone: '01112345678', phone2: '', email: '', address: 'الجيزة - الهرم', tax_number: '', credit_limit: 30000, account_id: 'ca2', opening_balance: 8000, notes: '', is_active: true, group_id: '', price_list_id: '', created_at: new Date().toISOString() },
    { id: 'c3', contact_type: 'supplier', name: 'مصنع السلام للإلكترونيات', phone: '01223456789', phone2: '', email: 'info@alsalam.com', address: 'العاشر من رمضان', tax_number: '987654321', credit_limit: 100000, account_id: 'sa1', opening_balance: 20000, notes: '', is_active: true, group_id: '', price_list_id: '', created_at: new Date().toISOString() },
    { id: 'c4', contact_type: 'supplier', name: 'شركة التوحيد للاستيراد', phone: '01098765432', phone2: '', email: '', address: 'الإسكندرية', tax_number: '', credit_limit: 75000, account_id: 'sa2', opening_balance: 12000, notes: '', is_active: true, group_id: '', price_list_id: '', created_at: new Date().toISOString() },
  ],
  contactGroups: [],
  priceLists: [],
  warehouses: [
    { id: 'w1', name: 'المخزن الرئيسي', location: 'القاهرة', manager_name: 'أحمد محمد', is_active: true, created_at: new Date().toISOString() },
    { id: 'w2', name: 'مخزن الفرع', location: 'الجيزة', manager_name: 'محمد علي', is_active: true, created_at: new Date().toISOString() },
    ...manufacturingWarehouses,
  ],
  itemCategories: [...defaultItemCategories, ...manufacturingItemCategories.filter(c => !defaultItemCategories.find(d => d.id === c.id))],
  items: [
    { id: 'i1', item_code: '001', item_name: 'لاب توب Dell', category_id: 'ic1', unit: 'قطعة', purchase_price: 8000, selling_price: 10000, minimum_stock: 5, barcode: '1234567890', description: '', is_active: true, created_at: new Date().toISOString() },
    { id: 'i2', item_code: '002', item_name: 'شاشة Samsung 24"', category_id: 'ic1', unit: 'قطعة', purchase_price: 2000, selling_price: 2800, minimum_stock: 10, barcode: '2345678901', description: '', is_active: true, created_at: new Date().toISOString() },
    { id: 'i3', item_code: '003', item_name: 'كيبورد لاسلكي', category_id: 'ic1', unit: 'قطعة', purchase_price: 200, selling_price: 350, minimum_stock: 20, barcode: '3456789012', description: '', is_active: true, created_at: new Date().toISOString() },
    { id: 'i4', item_code: '004', item_name: 'ماوس لاسلكي', category_id: 'ic1', unit: 'قطعة', purchase_price: 100, selling_price: 180, minimum_stock: 30, barcode: '4567890123', description: '', is_active: true, created_at: new Date().toISOString() },
    { id: 'i5', item_code: '005', item_name: 'طابعة HP LaserJet', category_id: 'ic1', unit: 'قطعة', purchase_price: 3000, selling_price: 4000, minimum_stock: 3, barcode: '5678901234', description: '', is_active: true, created_at: new Date().toISOString() },
    ...manufacturingRawMaterials,
    ...manufacturingFinishedGoods,
  ],
  itemStock: [
    { id: 'is1', item_id: 'i1', warehouse_id: 'w1', quantity: 15, average_cost: 8000, last_updated: new Date().toISOString() },
    { id: 'is2', item_id: 'i2', warehouse_id: 'w1', quantity: 30, average_cost: 2000, last_updated: new Date().toISOString() },
    { id: 'is3', item_id: 'i3', warehouse_id: 'w1', quantity: 50, average_cost: 200, last_updated: new Date().toISOString() },
    { id: 'is4', item_id: 'i4', warehouse_id: 'w1', quantity: 3, average_cost: 100, last_updated: new Date().toISOString() },
    { id: 'is5', item_id: 'i5', warehouse_id: 'w1', quantity: 8, average_cost: 3000, last_updated: new Date().toISOString() },
    { id: 'is6', item_id: 'i1', warehouse_id: 'w2', quantity: 5, average_cost: 8000, last_updated: new Date().toISOString() },
    { id: 'is7', item_id: 'i2', warehouse_id: 'w2', quantity: 10, average_cost: 2000, last_updated: new Date().toISOString() },
    ...manufacturingInitialStock,
  ],
  treasuries: [
    { id: 't1', name: 'الصندوق الرئيسي', account_id: 'a3', current_balance: 50000, opening_balance: 50000, is_active: true, created_at: new Date().toISOString() },
    { id: 't2', name: 'صندوق الفرع', account_id: 'a4', current_balance: 10000, opening_balance: 10000, is_active: true, created_at: new Date().toISOString() },
  ],
  treasuryTransactions: [],
  banks: [
    { id: 'b1', bank_name: 'البنك الأهلي', account_number: '1234567890', branch: 'فرع مدينة نصر', account_id: 'a5', current_balance: 100000, opening_balance: 100000, is_active: true, created_at: new Date().toISOString() },
    { id: 'b2', bank_name: 'بنك مصر', account_number: '0987654321', branch: 'فرع الدقي', account_id: 'a6', current_balance: 75000, opening_balance: 75000, is_active: true, created_at: new Date().toISOString() },
  ],
  bankTransactions: [],
  salesInvoices: [],
  salesInvoiceItems: [],
  purchaseInvoices: [],
  purchaseInvoiceItems: [],
  receipts: [],
  payments: [],
  expenseCategories: defaultExpenseCategories,
  expenses: [],
  checks: [],
  journalEntries: [],
  journalEntryLines: [],
  unitsOfMeasure: [
    { id: 'u1', name: 'قطعة', symbol: 'قطعة', base_unit_id: null, conversion_rate: 1, is_active: true, created_at: new Date().toISOString() },
    { id: 'u2', name: 'كرتونة', symbol: 'كرتونة', base_unit_id: 'u1', conversion_rate: 12, is_active: true, created_at: new Date().toISOString() },
    { id: 'u3', name: 'كيلوجرام', symbol: 'كج', base_unit_id: null, conversion_rate: 1, is_active: true, created_at: new Date().toISOString() },
    { id: 'u4', name: 'جرام', symbol: 'ج', base_unit_id: 'u3', conversion_rate: 0.001, is_active: true, created_at: new Date().toISOString() },
    { id: 'u5', name: 'متر', symbol: 'م', base_unit_id: null, conversion_rate: 1, is_active: true, created_at: new Date().toISOString() },
    { id: 'u6', name: 'سنتيمتر', symbol: 'سم', base_unit_id: 'u5', conversion_rate: 0.01, is_active: true, created_at: new Date().toISOString() },
    { id: 'u7', name: 'لتر', symbol: 'ل', base_unit_id: null, conversion_rate: 1, is_active: true, created_at: new Date().toISOString() },
    { id: 'u8', name: 'طن', symbol: 'طن', base_unit_id: 'u3', conversion_rate: 1000, is_active: true, created_at: new Date().toISOString() },
  ],
  itemVariants: [],
  warehouseTransfers: [],
  invoices: [],
  invoiceItems: [],
  shippingCompanies: [
    { id: 'sc1', name: 'بريد مصر', phone: '19133', address: 'القاهرة', account_id: '', commission_rate: 0, notes: '', is_active: true, created_at: new Date().toISOString() },
    { id: 'sc2', name: 'DHL Express', phone: '16345', address: 'القاهرة', account_id: '', commission_rate: 0, notes: '', is_active: true, created_at: new Date().toISOString() },
    { id: 'sc3', name: 'Aramex', phone: '19099', address: 'القاهرة', account_id: '', commission_rate: 0, notes: '', is_active: true, created_at: new Date().toISOString() },
    { id: 'sc4', name: 'J&T Express', phone: '19006', address: 'القاهرة', account_id: '', commission_rate: 0, notes: '', is_active: true, created_at: new Date().toISOString() },
  ],
  invoiceSettings: defaultInvoiceSettings,
};

// Add sub-accounts for contacts
const contactSubAccounts: Account[] = [
  { id: 'ca1', account_code: '1105-001', account_name: 'شركة النور للتجارة', account_type: 'assets', parent_id: 'a7', level: 4, is_parent: false, is_active: true, opening_balance: 15000, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'ca2', account_code: '1105-002', account_name: 'محلات الأمل', account_type: 'assets', parent_id: 'a7', level: 4, is_parent: false, is_active: true, opening_balance: 8000, balance_type: 'debit', created_at: new Date().toISOString() },
  { id: 'sa1', account_code: '2101-001', account_name: 'مصنع السلام للإلكترونيات', account_type: 'liabilities', parent_id: 'l3', level: 4, is_parent: false, is_active: true, opening_balance: 20000, balance_type: 'credit', created_at: new Date().toISOString() },
  { id: 'sa2', account_code: '2101-002', account_name: 'شركة التوحيد للاستيراد', account_type: 'liabilities', parent_id: 'l3', level: 4, is_parent: false, is_active: true, opening_balance: 12000, balance_type: 'credit', created_at: new Date().toISOString() },
];
initialState.accounts = [...initialState.accounts, ...contactSubAccounts];

// ============ Actions ============
type Action =
  | { type: 'LOAD_STATE'; payload: AccountingState }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'ADD_CONTACT'; payload: { contact: Contact; account: Account } }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'ADD_WAREHOUSE'; payload: Warehouse }
  | { type: 'ADD_ITEM'; payload: Item }
  | { type: 'UPDATE_ITEM'; payload: Item }
  | { type: 'ADD_ITEM_CATEGORY'; payload: ItemCategory }
  | { type: 'ADD_TREASURY'; payload: { treasury: Treasury; account: Account } }
  | { type: 'ADD_BANK'; payload: { bank: Bank; account: Account } }
  | { type: 'CREATE_SALES_INVOICE'; payload: { invoice: SalesInvoice; items: SalesInvoiceItem[] } }
  | { type: 'CREATE_PURCHASE_INVOICE'; payload: { invoice: PurchaseInvoice; items: PurchaseInvoiceItem[] } }
  | { type: 'CREATE_RECEIPT'; payload: Receipt }
  | { type: 'CREATE_PAYMENT'; payload: Payment }
  | { type: 'CREATE_EXPENSE'; payload: Expense }
  | { type: 'CREATE_TRANSFER'; payload: { from_type: 'treasury' | 'bank'; from_id: string; to_type: 'treasury' | 'bank'; to_id: string; amount: number; date: string; description: string } }
  | { type: 'ADD_EXPENSE_CATEGORY'; payload: ExpenseCategory }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'ADD_CONTACT_GROUP'; payload: ContactGroup }
  | { type: 'UPDATE_CONTACT_GROUP'; payload: ContactGroup }
  | { type: 'DELETE_CONTACT_GROUP'; payload: string }
  | { type: 'ADD_PRICE_LIST'; payload: PriceList }
  | { type: 'UPDATE_PRICE_LIST'; payload: PriceList }
  | { type: 'DELETE_PRICE_LIST'; payload: string }
  | { type: 'BULK_ADD_CONTACTS'; payload: { contacts: Contact[]; accounts: Account[] } }
  | { type: 'UPDATE_CHECK_STATUS'; payload: { check: Check } }
  | { type: 'ADD_UNIT'; payload: UnitOfMeasure }
  | { type: 'UPDATE_UNIT'; payload: UnitOfMeasure }
  | { type: 'DELETE_UNIT'; payload: string }
  | { type: 'ADD_ITEM_VARIANT'; payload: ItemVariant }
  | { type: 'UPDATE_ITEM_VARIANT'; payload: ItemVariant }
  | { type: 'BULK_UPDATE_ITEM_PRICES'; payload: { updates: { item_id: string; selling_price?: number; purchase_price?: number; price_list_updates?: { list_id: string; price: number }[] }[] } }
  | { type: 'BULK_IMPORT_ITEMS'; payload: Item[] }
  | { type: 'CREATE_WAREHOUSE_TRANSFER'; payload: WarehouseTransfer }
  | { type: 'CREATE_INVOICE'; payload: { invoice: Invoice; items: InvoiceItem[] } }
  | { type: 'UPDATE_INVOICE_SETTINGS'; payload: InvoiceSettings }
  | { type: 'ADD_SHIPPING_COMPANY'; payload: ShippingCompany }
  | { type: 'UPDATE_SHIPPING_COMPANY'; payload: ShippingCompany }
  | { type: 'DELETE_SHIPPING_COMPANY'; payload: string }
  | { type: 'UPDATE_INVOICE_STATUS'; payload: { invoice_id: string; status: InvoiceDocStatus } }
  | {
      type: 'CREATE_MANUFACTURING_JOURNAL';
      payload: {
        journalEntry: JournalEntry;
        journalEntryLines: JournalEntryLine[];
        stockUpdates: {
          item_id: string;
          warehouse_id: string;
          quantity_delta: number;
          unit_cost: number;
        }[];
      };
    }
  | { type: 'REVERSE_SALES_INVOICE'; payload: { invoice_id: string } }
  | { type: 'REVERSE_PURCHASE_INVOICE'; payload: { invoice_id: string } }
  | { type: 'CREATE_PAYROLL_JOURNAL'; payload: { total_amount: number; date: string; description: string; treasury_id: string; bank_id: string; payment_source: 'treasury' | 'bank' } }
  | { type: 'CLOSE_FISCAL_YEAR'; payload: { date: string } }
  | { type: 'CREATE_INVENTORY_ADJUSTMENT'; payload: { adjustments: { item_id: string; warehouse_id: string; actual_qty: number; book_qty: number; unit_cost: number }[]; date: string; notes: string } }
  | { type: 'ADD_INVOICE_PAYMENT'; payload: { invoice_id: string; invoice_type: 'sales' | 'purchase'; amount: number; date: string; treasury_id: string; bank_id: string; payment_method: 'cash' | 'bank'; notes: string } };

// ============ Helper: Determine inventory account for item ============
function getInventoryAccountForItem(item: Item | undefined): string {
  if (!item) return 'a8'; // default inventory
  if (item.item_type === 'raw_material' || item.category_id === 'ic-mfg-mat') return 'mfg-raw';
  if (item.category_id === 'ic-mfg-fg') return 'mfg-fg';
  return 'a8';
}

function getDefaultWarehouseForItem(item: Item | undefined): string {
  if (!item) return 'w1';
  if (item.item_type === 'raw_material' || item.category_id === 'ic-mfg-mat') return 'w-mfg';
  if (item.category_id === 'ic-mfg-fg') return 'w-fg';
  return 'w1';
}

// ============ Journal Entry Generator ============
function createJournalEntry(
  state: AccountingState,
  sourceType: SourceType,
  sourceId: string,
  date: string,
  description: string,
  lines: { account_id: string; debit: number; credit: number; description: string; contact_id?: string }[]
): { entry: JournalEntry; entryLines: JournalEntryLine[] } {
  const entryId = uid();
  const entryNumber = `JE-${String(state.journalEntries.length + 1).padStart(5, '0')}`;
  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

  const entry: JournalEntry = {
    id: entryId,
    entry_number: entryNumber,
    entry_date: date,
    description,
    source_type: sourceType,
    source_id: sourceId,
    total_debit: totalDebit,
    total_credit: totalCredit,
    is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    is_posted: true,
    created_at: new Date().toISOString(),
  };

  const entryLines: JournalEntryLine[] = lines.map(l => {
    const account = state.accounts.find(a => a.id === l.account_id);
    return {
      id: uid(),
      journal_entry_id: entryId,
      account_id: l.account_id,
      account_code: account?.account_code || '',
      account_name: account?.account_name || '',
      debit: l.debit,
      credit: l.credit,
      description: l.description,
      contact_id: l.contact_id || '',
    };
  });

  return { entry, entryLines };
}

// ============ Reducer ============
function accountingReducer(state: AccountingState, action: Action): AccountingState {
  switch (action.type) {
    case 'LOAD_STATE': {
      // Ensure backward compatibility for new fields
      const loaded = action.payload;
      // Merge manufacturing data (backward compatibility for existing sessions)
      const loadedAccounts = loaded.accounts || [];
      const loadedWarehouses = loaded.warehouses || [];
      const loadedItems = loaded.items || [];
      const loadedStock = loaded.itemStock || [];
      return {
        ...loaded,
        contactGroups: loaded.contactGroups || [],
        priceLists: loaded.priceLists || [],
        checks: loaded.checks || [],
        contacts: (loaded.contacts || []).map(c => ({
          ...c,
          group_id: c.group_id || '',
          price_list_id: c.price_list_id || '',
        })),
        // Manufacturing integration - add if not already present
        accounts: [
          ...loadedAccounts,
          ...manufacturingAccounts.filter(a => !loadedAccounts.find(la => la.id === a.id)),
        ],
        warehouses: [
          ...loadedWarehouses,
          ...manufacturingWarehouses.filter(w => !loadedWarehouses.find(lw => lw.id === w.id)),
        ],
        items: [
          ...loadedItems,
          ...[...manufacturingRawMaterials, ...manufacturingFinishedGoods].filter(i => !loadedItems.find(li => li.id === i.id)),
        ],
        itemStock: [
          ...loadedStock,
          ...manufacturingInitialStock.filter(s => !loadedStock.find(ls => ls.id === s.id)),
        ],
        itemCategories: [
          ...(loaded.itemCategories || []),
          ...manufacturingItemCategories.filter(c => !(loaded.itemCategories || []).find(lc => lc.id === c.id)),
        ],
        // New fields - backward compatibility
        unitsOfMeasure: loaded.unitsOfMeasure || initialState.unitsOfMeasure,
        itemVariants: loaded.itemVariants || [],
        warehouseTransfers: loaded.warehouseTransfers || [],
        invoices: loaded.invoices || [],
        invoiceItems: loaded.invoiceItems || [],
        shippingCompanies: loaded.shippingCompanies || initialState.shippingCompanies,
        invoiceSettings: loaded.invoiceSettings || initialState.invoiceSettings,
      };
    }

    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };

    case 'UPDATE_ACCOUNT':
      return { ...state, accounts: state.accounts.map(a => a.id === action.payload.id ? action.payload : a) };

    case 'ADD_CONTACT': {
      return {
        ...state,
        contacts: [...state.contacts, action.payload.contact],
        accounts: [...state.accounts, action.payload.account],
      };
    }

    case 'UPDATE_CONTACT':
      return { ...state, contacts: state.contacts.map(c => c.id === action.payload.id ? action.payload : c) };

    case 'DELETE_CONTACT': {
      const contact = state.contacts.find(c => c.id === action.payload);
      return {
        ...state,
        contacts: state.contacts.filter(c => c.id !== action.payload),
        accounts: contact ? state.accounts.filter(a => a.id !== contact.account_id) : state.accounts,
      };
    }

    case 'ADD_WAREHOUSE':
      return { ...state, warehouses: [...state.warehouses, action.payload] };

    case 'ADD_ITEM': {
      const newStock: ItemStock[] = state.warehouses.map(w => ({
        id: uid(),
        item_id: action.payload.id,
        warehouse_id: w.id,
        quantity: 0,
        average_cost: action.payload.purchase_price,
        last_updated: new Date().toISOString(),
      }));
      return { ...state, items: [...state.items, action.payload], itemStock: [...state.itemStock, ...newStock] };
    }

    case 'UPDATE_ITEM':
      return { ...state, items: state.items.map(i => i.id === action.payload.id ? action.payload : i) };

    case 'ADD_ITEM_CATEGORY':
      return { ...state, itemCategories: [...state.itemCategories, action.payload] };

    case 'ADD_TREASURY':
      return {
        ...state,
        treasuries: [...state.treasuries, action.payload.treasury],
        accounts: [...state.accounts, action.payload.account],
      };

    case 'ADD_BANK':
      return {
        ...state,
        banks: [...state.banks, action.payload.bank],
        accounts: [...state.accounts, action.payload.account],
      };

    case 'ADD_EXPENSE_CATEGORY':
      return { ...state, expenseCategories: [...state.expenseCategories, action.payload] };

    // ============ Contact Groups ============
    case 'ADD_CONTACT_GROUP':
      return { ...state, contactGroups: [...(state.contactGroups || []), action.payload] };

    case 'UPDATE_CONTACT_GROUP':
      return { ...state, contactGroups: (state.contactGroups || []).map(g => g.id === action.payload.id ? action.payload : g) };

    case 'DELETE_CONTACT_GROUP':
      return { ...state, contactGroups: (state.contactGroups || []).filter(g => g.id !== action.payload) };

    // ============ Price Lists ============
    case 'ADD_PRICE_LIST':
      return { ...state, priceLists: [...(state.priceLists || []), action.payload] };

    case 'UPDATE_PRICE_LIST':
      return { ...state, priceLists: (state.priceLists || []).map(p => p.id === action.payload.id ? action.payload : p) };

    case 'DELETE_PRICE_LIST':
      return { ...state, priceLists: (state.priceLists || []).filter(p => p.id !== action.payload) };

    // ============ Bulk Add Contacts ============
    case 'BULK_ADD_CONTACTS':
      return {
        ...state,
        contacts: [...state.contacts, ...action.payload.contacts],
        accounts: [...state.accounts, ...action.payload.accounts],
      };

    // ============ Sales Invoice ============
    case 'CREATE_SALES_INVOICE': {
      const { invoice, items } = action.payload;
      let newState = { ...state };
      newState.salesInvoices = [...newState.salesInvoices, invoice];
      newState.salesInvoiceItems = [...newState.salesInvoiceItems, ...items];

      // Update stock
      const updatedStock = [...newState.itemStock];
      items.forEach(item => {
        const stockIdx = updatedStock.findIndex(s => s.item_id === item.item_id && s.warehouse_id === item.warehouse_id);
        if (stockIdx >= 0) {
          updatedStock[stockIdx] = { ...updatedStock[stockIdx], quantity: updatedStock[stockIdx].quantity - item.quantity, last_updated: new Date().toISOString() };
        }
      });
      newState.itemStock = updatedStock;

      // Journal entry lines
      const jeLines: { account_id: string; debit: number; credit: number; description: string; contact_id?: string }[] = [];
      const contact = state.contacts.find(c => c.id === invoice.contact_id);

      if (invoice.payment_type === 'cash') {
        const treasury = state.treasuries.find(t => t.id === invoice.treasury_id);
        if (treasury) {
          jeLines.push({ account_id: treasury.account_id, debit: invoice.total_amount, credit: 0, description: `مبيعات نقدية - فاتورة ${invoice.invoice_number}` });
        }
      } else if (invoice.payment_type === 'credit') {
        if (contact) {
          jeLines.push({ account_id: contact.account_id, debit: invoice.total_amount, credit: 0, description: `مبيعات آجلة - فاتورة ${invoice.invoice_number}`, contact_id: contact.id });
        }
      } else {
        // Partial
        if (invoice.paid_amount > 0) {
          const treasury = state.treasuries.find(t => t.id === invoice.treasury_id);
          if (treasury) {
            jeLines.push({ account_id: treasury.account_id, debit: invoice.paid_amount, credit: 0, description: `مبيعات جزئي نقدي - فاتورة ${invoice.invoice_number}` });
          }
        }
        if (invoice.remaining_amount > 0 && contact) {
          jeLines.push({ account_id: contact.account_id, debit: invoice.remaining_amount, credit: 0, description: `مبيعات جزئي آجل - فاتورة ${invoice.invoice_number}`, contact_id: contact.id });
        }
      }
      // Tax handling
      const netSalesAmount = invoice.total_amount - (invoice.tax_amount || 0);
      jeLines.push({ account_id: 'r2', debit: 0, credit: netSalesAmount, description: `إيرادات مبيعات - فاتورة ${invoice.invoice_number}` });
      if (invoice.tax_amount > 0) {
        jeLines.push({ account_id: 'tax-output', debit: 0, credit: invoice.tax_amount, description: `ضريبة مخرجات - فاتورة ${invoice.invoice_number}` });
      }

      const { entry, entryLines } = createJournalEntry(newState, 'sales_invoice', invoice.id, invoice.invoice_date, `فاتورة بيع رقم ${invoice.invoice_number}`, jeLines);
      newState.journalEntries = [...newState.journalEntries, entry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];

      // ★ COGS Journal Entry (تكلفة البضاعة المباعة)
      let totalCOGS = 0;
      const cogsLines: { account_id: string; debit: number; credit: number; description: string }[] = [];
      items.forEach(item => {
        const stockRecord = updatedStock.find(s => s.item_id === item.item_id && s.warehouse_id === item.warehouse_id)
          || newState.itemStock.find(s => s.item_id === item.item_id);
        const unitCost = item.cost_price > 0 ? item.cost_price : (stockRecord?.average_cost || 0);
        const itemCost = item.quantity * unitCost;
        if (itemCost > 0) {
          totalCOGS += itemCost;
          const invItem = state.items.find(i => i.id === item.item_id);
          const invAccount = getInventoryAccountForItem(invItem);
          // Group by inventory account
          const existing = cogsLines.find(l => l.account_id === invAccount && l.credit > 0);
          if (existing) {
            existing.credit += itemCost;
          } else {
            cogsLines.push({ account_id: invAccount, debit: 0, credit: itemCost, description: `تخفيض مخزون - فاتورة ${invoice.invoice_number}` });
          }
        }
      });
      if (totalCOGS > 0) {
        cogsLines.unshift({ account_id: 'x2', debit: totalCOGS, credit: 0, description: `تكلفة البضاعة المباعة - فاتورة ${invoice.invoice_number}` });
        const { entry: cogsEntry, entryLines: cogsEntryLines } = createJournalEntry(newState, 'cogs', invoice.id, invoice.invoice_date, `ت.ب.م - فاتورة بيع ${invoice.invoice_number}`, cogsLines);
        newState.journalEntries = [...newState.journalEntries, cogsEntry];
        newState.journalEntryLines = [...newState.journalEntryLines, ...cogsEntryLines];
      }

      // Update treasury balance
      if (invoice.paid_amount > 0 && invoice.treasury_id) {
        const tIdx = newState.treasuries.findIndex(t => t.id === invoice.treasury_id);
        if (tIdx >= 0) {
          const updatedTreasuries = [...newState.treasuries];
          updatedTreasuries[tIdx] = { ...updatedTreasuries[tIdx], current_balance: updatedTreasuries[tIdx].current_balance + invoice.paid_amount };
          newState.treasuries = updatedTreasuries;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: invoice.treasury_id, transaction_date: invoice.invoice_date,
            transaction_type: 'deposit', amount: invoice.paid_amount,
            balance_after: updatedTreasuries[tIdx].current_balance,
            source_type: 'sales_invoice', source_id: invoice.id,
            description: `فاتورة بيع ${invoice.invoice_number}`, created_at: new Date().toISOString(),
          }];
        }
      }

      return newState;
    }

    // ============ Purchase Invoice ============
    case 'CREATE_PURCHASE_INVOICE': {
      const { invoice, items } = action.payload;
      let newState = { ...state };
      newState.purchaseInvoices = [...newState.purchaseInvoices, invoice];
      newState.purchaseInvoiceItems = [...newState.purchaseInvoiceItems, ...items];

      // Update stock
      const updatedStock = [...newState.itemStock];
      items.forEach(item => {
        const stockIdx = updatedStock.findIndex(s => s.item_id === item.item_id && s.warehouse_id === item.warehouse_id);
        if (stockIdx >= 0) {
          const oldQty = updatedStock[stockIdx].quantity;
          const oldCost = updatedStock[stockIdx].average_cost;
          const newQty = oldQty + item.quantity;
          const newAvgCost = newQty > 0 ? ((oldQty * oldCost) + (item.quantity * item.unit_price)) / newQty : item.unit_price;
          updatedStock[stockIdx] = { ...updatedStock[stockIdx], quantity: newQty, average_cost: newAvgCost, last_updated: new Date().toISOString() };
        }
      });
      newState.itemStock = updatedStock;

      // Journal entry
      const jeLines: { account_id: string; debit: number; credit: number; description: string; contact_id?: string }[] = [];
      const contact = state.contacts.find(c => c.id === invoice.contact_id);

      // Determine inventory account(s) - raw materials go to mfg-raw
      const purchaseItemsByAccount: Record<string, number> = {};
      items.forEach(pi => {
        const fullItem = state.items.find(i => i.id === pi.item_id);
        const accId = getInventoryAccountForItem(fullItem);
        purchaseItemsByAccount[accId] = (purchaseItemsByAccount[accId] || 0) + (pi.quantity * pi.unit_price);
      });
      const netPurchaseAmount = invoice.total_amount - (invoice.tax_amount || 0);
      Object.entries(purchaseItemsByAccount).forEach(([accId, amount]) => {
        const proportion = netPurchaseAmount > 0 ? amount / Object.values(purchaseItemsByAccount).reduce((s, v) => s + v, 0) : 1;
        jeLines.push({ account_id: accId, debit: Math.round(netPurchaseAmount * proportion * 100) / 100, credit: 0, description: `مشتريات - فاتورة ${invoice.invoice_number}` });
      });
      if (invoice.tax_amount > 0) {
        jeLines.push({ account_id: 'tax-input', debit: invoice.tax_amount, credit: 0, description: `ضريبة مدخلات - فاتورة ${invoice.invoice_number}` });
      }

      if (invoice.payment_type === 'cash') {
        const treasury = state.treasuries.find(t => t.id === invoice.treasury_id);
        if (treasury) {
          jeLines.push({ account_id: treasury.account_id, debit: 0, credit: invoice.total_amount, description: `مشتريات نقدية - فاتورة ${invoice.invoice_number}` });
        }
      } else if (invoice.payment_type === 'credit') {
        if (contact) {
          jeLines.push({ account_id: contact.account_id, debit: 0, credit: invoice.total_amount, description: `مشتريات آجلة - فاتورة ${invoice.invoice_number}`, contact_id: contact.id });
        }
      } else {
        if (invoice.paid_amount > 0) {
          const treasury = state.treasuries.find(t => t.id === invoice.treasury_id);
          if (treasury) {
            jeLines.push({ account_id: treasury.account_id, debit: 0, credit: invoice.paid_amount, description: `مشتريات جزئي نقدي - فاتورة ${invoice.invoice_number}` });
          }
        }
        if (invoice.remaining_amount > 0 && contact) {
          jeLines.push({ account_id: contact.account_id, debit: 0, credit: invoice.remaining_amount, description: `مشتريات جزئي آجل - فاتورة ${invoice.invoice_number}`, contact_id: contact.id });
        }
      }

      const { entry, entryLines } = createJournalEntry(newState, 'purchase_invoice', invoice.id, invoice.invoice_date, `فاتورة شراء رقم ${invoice.invoice_number}`, jeLines);
      newState.journalEntries = [...newState.journalEntries, entry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];

      // Update treasury
      if (invoice.paid_amount > 0 && invoice.treasury_id) {
        const tIdx = newState.treasuries.findIndex(t => t.id === invoice.treasury_id);
        if (tIdx >= 0) {
          const updatedTreasuries = [...newState.treasuries];
          updatedTreasuries[tIdx] = { ...updatedTreasuries[tIdx], current_balance: updatedTreasuries[tIdx].current_balance - invoice.paid_amount };
          newState.treasuries = updatedTreasuries;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: invoice.treasury_id, transaction_date: invoice.invoice_date,
            transaction_type: 'withdrawal', amount: invoice.paid_amount,
            balance_after: updatedTreasuries[tIdx].current_balance,
            source_type: 'purchase_invoice', source_id: invoice.id,
            description: `فاتورة شراء ${invoice.invoice_number}`, created_at: new Date().toISOString(),
          }];
        }
      }

      return newState;
    }

    // ============ Receipt ============
    case 'CREATE_RECEIPT': {
      const receipt = action.payload;
      let newState = { ...state };
      newState.receipts = [...newState.receipts, receipt];

      const contact = state.contacts.find(c => c.id === receipt.contact_id);
      const jeLines: { account_id: string; debit: number; credit: number; description: string; contact_id?: string }[] = [];

      if (receipt.payment_method === 'cash' && receipt.treasury_id) {
        const treasury = state.treasuries.find(t => t.id === receipt.treasury_id);
        if (treasury) {
          jeLines.push({ account_id: treasury.account_id, debit: receipt.amount, credit: 0, description: `سند قبض ${receipt.receipt_number}` });
          const tIdx = newState.treasuries.findIndex(t => t.id === receipt.treasury_id);
          const updatedTreasuries = [...newState.treasuries];
          updatedTreasuries[tIdx] = { ...updatedTreasuries[tIdx], current_balance: updatedTreasuries[tIdx].current_balance + receipt.amount };
          newState.treasuries = updatedTreasuries;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: receipt.treasury_id, transaction_date: receipt.receipt_date,
            transaction_type: 'deposit', amount: receipt.amount,
            balance_after: updatedTreasuries[tIdx].current_balance,
            source_type: 'receipt', source_id: receipt.id,
            description: `سند قبض ${receipt.receipt_number} - ${contact?.name}`, created_at: new Date().toISOString(),
          }];
        }
      } else if (receipt.bank_id) {
        const bank = state.banks.find(b => b.id === receipt.bank_id);
        if (bank) {
          jeLines.push({ account_id: bank.account_id, debit: receipt.amount, credit: 0, description: `سند قبض ${receipt.receipt_number}` });
          const bIdx = newState.banks.findIndex(b => b.id === receipt.bank_id);
          const updatedBanks = [...newState.banks];
          updatedBanks[bIdx] = { ...updatedBanks[bIdx], current_balance: updatedBanks[bIdx].current_balance + receipt.amount };
          newState.banks = updatedBanks;
          newState.bankTransactions = [...newState.bankTransactions, {
            id: uid(), bank_id: receipt.bank_id, transaction_date: receipt.receipt_date,
            transaction_type: 'deposit', amount: receipt.amount,
            balance_after: updatedBanks[bIdx].current_balance,
            check_number: receipt.check_number, source_type: 'receipt', source_id: receipt.id,
            description: `سند قبض ${receipt.receipt_number} - ${contact?.name}`, created_at: new Date().toISOString(),
          }];
        }
      }

      if (contact) {
        jeLines.push({ account_id: contact.account_id, debit: 0, credit: receipt.amount, description: `سند قبض ${receipt.receipt_number}`, contact_id: contact.id });
      }

      const { entry, entryLines } = createJournalEntry(newState, 'receipt', receipt.id, receipt.receipt_date, `سند قبض رقم ${receipt.receipt_number} - ${contact?.name || ''}`, jeLines);
      newState.journalEntries = [...newState.journalEntries, entry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];

      // ★ Link receipt to sales invoice and update invoice status
      if (receipt.related_invoice_id) {
        const siIdx = newState.salesInvoices.findIndex(si => si.id === receipt.related_invoice_id);
        if (siIdx >= 0) {
          const si = newState.salesInvoices[siIdx];
          const newPaid = si.paid_amount + receipt.amount;
          const newRemaining = si.total_amount - newPaid;
          const newStatus = newRemaining <= 0.01 ? 'paid' : newPaid > 0 ? 'partial' : si.status;
          const updatedInvoices = [...newState.salesInvoices];
          updatedInvoices[siIdx] = { ...si, paid_amount: newPaid, remaining_amount: Math.max(0, newRemaining), status: newStatus as any };
          newState.salesInvoices = updatedInvoices;
        }
        // Also check comprehensive invoices
        const invIdx = (newState.invoices || []).findIndex(inv => inv.id === receipt.related_invoice_id);
        if (invIdx >= 0) {
          const inv = newState.invoices[invIdx];
          const newPaid = inv.paid_amount + receipt.amount;
          const newRemaining = inv.total_amount - newPaid;
          const newStatus = newRemaining <= 0.01 ? 'paid' : newPaid > 0 ? 'partial' : inv.invoice_status;
          const updatedInvoices = [...newState.invoices];
          updatedInvoices[invIdx] = { ...inv, paid_amount: newPaid, remaining_amount: Math.max(0, newRemaining), invoice_status: newStatus as any };
          newState.invoices = updatedInvoices;
        }
      }

      return newState;
    }

    // ============ Payment ============
    case 'CREATE_PAYMENT': {
      const payment = action.payload;
      let newState = { ...state };
      newState.payments = [...newState.payments, payment];

      const contact = state.contacts.find(c => c.id === payment.contact_id);
      const jeLines: { account_id: string; debit: number; credit: number; description: string; contact_id?: string }[] = [];

      if (contact) {
        jeLines.push({ account_id: contact.account_id, debit: payment.amount, credit: 0, description: `سند صرف ${payment.payment_number}`, contact_id: contact.id });
      }

      if (payment.payment_method === 'cash' && payment.treasury_id) {
        const treasury = state.treasuries.find(t => t.id === payment.treasury_id);
        if (treasury) {
          jeLines.push({ account_id: treasury.account_id, debit: 0, credit: payment.amount, description: `سند صرف ${payment.payment_number}` });
          const tIdx = newState.treasuries.findIndex(t => t.id === payment.treasury_id);
          const updatedTreasuries = [...newState.treasuries];
          updatedTreasuries[tIdx] = { ...updatedTreasuries[tIdx], current_balance: updatedTreasuries[tIdx].current_balance - payment.amount };
          newState.treasuries = updatedTreasuries;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: payment.treasury_id, transaction_date: payment.payment_date,
            transaction_type: 'withdrawal', amount: payment.amount,
            balance_after: updatedTreasuries[tIdx].current_balance,
            source_type: 'payment', source_id: payment.id,
            description: `سند صرف ${payment.payment_number} - ${contact?.name}`, created_at: new Date().toISOString(),
          }];
        }
      } else if (payment.bank_id) {
        const bank = state.banks.find(b => b.id === payment.bank_id);
        if (bank) {
          jeLines.push({ account_id: bank.account_id, debit: 0, credit: payment.amount, description: `سند صرف ${payment.payment_number}` });
          const bIdx = newState.banks.findIndex(b => b.id === payment.bank_id);
          const updatedBanks = [...newState.banks];
          updatedBanks[bIdx] = { ...updatedBanks[bIdx], current_balance: updatedBanks[bIdx].current_balance - payment.amount };
          newState.banks = updatedBanks;
          newState.bankTransactions = [...newState.bankTransactions, {
            id: uid(), bank_id: payment.bank_id, transaction_date: payment.payment_date,
            transaction_type: 'withdrawal', amount: payment.amount,
            balance_after: updatedBanks[bIdx].current_balance,
            check_number: payment.check_number, source_type: 'payment', source_id: payment.id,
            description: `سند صرف ${payment.payment_number} - ${contact?.name}`, created_at: new Date().toISOString(),
          }];
        }
      }

      const { entry, entryLines } = createJournalEntry(newState, 'payment', payment.id, payment.payment_date, `سند صرف رقم ${payment.payment_number} - ${contact?.name || ''}`, jeLines);
      newState.journalEntries = [...newState.journalEntries, entry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];

      return newState;
    }

    // ============ Expense ============
    case 'CREATE_EXPENSE': {
      const expense = action.payload;
      let newState = { ...state };
      newState.expenses = [...newState.expenses, expense];

      const jeLines: { account_id: string; debit: number; credit: number; description: string }[] = [];
      jeLines.push({ account_id: expense.account_id, debit: expense.amount, credit: 0, description: expense.description });

      if (expense.payment_method === 'cash' && expense.treasury_id) {
        const treasury = state.treasuries.find(t => t.id === expense.treasury_id);
        if (treasury) {
          jeLines.push({ account_id: treasury.account_id, debit: 0, credit: expense.amount, description: expense.description });
          const tIdx = newState.treasuries.findIndex(t => t.id === expense.treasury_id);
          const updatedTreasuries = [...newState.treasuries];
          updatedTreasuries[tIdx] = { ...updatedTreasuries[tIdx], current_balance: updatedTreasuries[tIdx].current_balance - expense.amount };
          newState.treasuries = updatedTreasuries;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: expense.treasury_id, transaction_date: expense.expense_date,
            transaction_type: 'withdrawal', amount: expense.amount,
            balance_after: updatedTreasuries[tIdx].current_balance,
            source_type: 'expense', source_id: expense.id,
            description: expense.description, created_at: new Date().toISOString(),
          }];
        }
      } else if (expense.bank_id) {
        const bank = state.banks.find(b => b.id === expense.bank_id);
        if (bank) {
          jeLines.push({ account_id: bank.account_id, debit: 0, credit: expense.amount, description: expense.description });
          const bIdx = newState.banks.findIndex(b => b.id === expense.bank_id);
          const updatedBanks = [...newState.banks];
          updatedBanks[bIdx] = { ...updatedBanks[bIdx], current_balance: updatedBanks[bIdx].current_balance - expense.amount };
          newState.banks = updatedBanks;
          newState.bankTransactions = [...newState.bankTransactions, {
            id: uid(), bank_id: expense.bank_id, transaction_date: expense.expense_date,
            transaction_type: 'withdrawal', amount: expense.amount,
            balance_after: updatedBanks[bIdx].current_balance,
            check_number: '', source_type: 'expense', source_id: expense.id,
            description: expense.description, created_at: new Date().toISOString(),
          }];
        }
      }

      const { entry, entryLines } = createJournalEntry(newState, 'expense', expense.id, expense.expense_date, `مصروف - ${expense.description}`, jeLines);
      newState.journalEntries = [...newState.journalEntries, entry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];

      return newState;
    }

    // ============ Transfer ============
    case 'CREATE_TRANSFER': {
      const { from_type, from_id, to_type, to_id, amount, date, description } = action.payload;
      let newState = { ...state };
      const transferId = uid();

      let fromAccountId = '';
      let toAccountId = '';

      // Deduct from source
      if (from_type === 'treasury') {
        const tIdx = newState.treasuries.findIndex(t => t.id === from_id);
        if (tIdx >= 0) {
          const updatedTreasuries = [...newState.treasuries];
          updatedTreasuries[tIdx] = { ...updatedTreasuries[tIdx], current_balance: updatedTreasuries[tIdx].current_balance - amount };
          fromAccountId = updatedTreasuries[tIdx].account_id;
          newState.treasuries = updatedTreasuries;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: from_id, transaction_date: date,
            transaction_type: 'withdrawal', amount, balance_after: updatedTreasuries[tIdx].current_balance,
            source_type: 'transfer', source_id: transferId, description, created_at: new Date().toISOString(),
          }];
        }
      } else {
        const bIdx = newState.banks.findIndex(b => b.id === from_id);
        if (bIdx >= 0) {
          const updatedBanks = [...newState.banks];
          updatedBanks[bIdx] = { ...updatedBanks[bIdx], current_balance: updatedBanks[bIdx].current_balance - amount };
          fromAccountId = updatedBanks[bIdx].account_id;
          newState.banks = updatedBanks;
          newState.bankTransactions = [...newState.bankTransactions, {
            id: uid(), bank_id: from_id, transaction_date: date,
            transaction_type: 'withdrawal', amount, balance_after: updatedBanks[bIdx].current_balance,
            check_number: '', source_type: 'transfer', source_id: transferId, description, created_at: new Date().toISOString(),
          }];
        }
      }

      // Add to destination
      if (to_type === 'treasury') {
        const tIdx = newState.treasuries.findIndex(t => t.id === to_id);
        if (tIdx >= 0) {
          const updatedTreasuries = [...newState.treasuries];
          updatedTreasuries[tIdx] = { ...updatedTreasuries[tIdx], current_balance: updatedTreasuries[tIdx].current_balance + amount };
          toAccountId = updatedTreasuries[tIdx].account_id;
          newState.treasuries = updatedTreasuries;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: to_id, transaction_date: date,
            transaction_type: 'deposit', amount, balance_after: updatedTreasuries[tIdx].current_balance,
            source_type: 'transfer', source_id: transferId, description, created_at: new Date().toISOString(),
          }];
        }
      } else {
        const bIdx = newState.banks.findIndex(b => b.id === to_id);
        if (bIdx >= 0) {
          const updatedBanks = [...newState.banks];
          updatedBanks[bIdx] = { ...updatedBanks[bIdx], current_balance: updatedBanks[bIdx].current_balance + amount };
          toAccountId = updatedBanks[bIdx].account_id;
          newState.banks = updatedBanks;
          newState.bankTransactions = [...newState.bankTransactions, {
            id: uid(), bank_id: to_id, transaction_date: date,
            transaction_type: 'deposit', amount, balance_after: updatedBanks[bIdx].current_balance,
            check_number: '', source_type: 'transfer', source_id: transferId, description, created_at: new Date().toISOString(),
          }];
        }
      }

      // Journal entry
      const jeLines = [
        { account_id: toAccountId, debit: amount, credit: 0, description },
        { account_id: fromAccountId, debit: 0, credit: amount, description },
      ];
      const { entry, entryLines } = createJournalEntry(newState, 'transfer', transferId, date, description, jeLines);
      newState.journalEntries = [...newState.journalEntries, entry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];

      return newState;
    }

    // ============ Update Check Status ============
    case 'UPDATE_CHECK_STATUS': {
      const { check } = action.payload;
      let newState = { ...state };
      newState.checks = newState.checks.map(c => c.id === check.id ? check : c);
      // Add if not exists
      if (!newState.checks.find(c => c.id === check.id)) {
        newState.checks = [...newState.checks, check];
      }
      return newState;
    }

    // ============ Units of Measure ============
    case 'ADD_UNIT':
      return { ...state, unitsOfMeasure: [...(state.unitsOfMeasure || []), action.payload] };

    case 'UPDATE_UNIT':
      return { ...state, unitsOfMeasure: (state.unitsOfMeasure || []).map(u => u.id === action.payload.id ? action.payload : u) };

    case 'DELETE_UNIT':
      return { ...state, unitsOfMeasure: (state.unitsOfMeasure || []).filter(u => u.id !== action.payload) };

    // ============ Item Variants ============
    case 'ADD_ITEM_VARIANT':
      return { ...state, itemVariants: [...(state.itemVariants || []), action.payload] };

    case 'UPDATE_ITEM_VARIANT':
      return { ...state, itemVariants: (state.itemVariants || []).map(v => v.id === action.payload.id ? action.payload : v) };

    // ============ Bulk Update Item Prices ============
    case 'BULK_UPDATE_ITEM_PRICES': {
      const { updates } = action.payload;
      let newState = { ...state };
      let updatedItems = [...newState.items];
      let updatedPriceLists = [...(newState.priceLists || [])];

      updates.forEach(u => {
        const idx = updatedItems.findIndex(i => i.id === u.item_id);
        if (idx >= 0) {
          updatedItems[idx] = {
            ...updatedItems[idx],
            ...(u.selling_price !== undefined ? { selling_price: u.selling_price } : {}),
            ...(u.purchase_price !== undefined ? { purchase_price: u.purchase_price } : {}),
          };
        }
        // Update price lists
        if (u.price_list_updates) {
          u.price_list_updates.forEach(plu => {
            const plIdx = updatedPriceLists.findIndex(pl => pl.id === plu.list_id);
            if (plIdx >= 0) {
              const existingItems = [...updatedPriceLists[plIdx].items];
              const itemIdx = existingItems.findIndex(pi => pi.item_id === u.item_id);
              if (itemIdx >= 0) {
                existingItems[itemIdx] = { ...existingItems[itemIdx], price: plu.price };
              } else {
                existingItems.push({ item_id: u.item_id, price: plu.price });
              }
              updatedPriceLists[plIdx] = { ...updatedPriceLists[plIdx], items: existingItems };
            }
          });
        }
      });
      return { ...newState, items: updatedItems, priceLists: updatedPriceLists };
    }

    // ============ Bulk Import Items ============
    case 'BULK_IMPORT_ITEMS': {
      const newItems = action.payload;
      let newState = { ...state };
      newState.items = [...newState.items, ...newItems];
      // Create stock records for each item in each warehouse
      const newStock: ItemStock[] = [];
      newItems.forEach(item => {
        state.warehouses.forEach(w => {
          if (!newState.itemStock.find(s => s.item_id === item.id && s.warehouse_id === w.id)) {
            newStock.push({ id: uid(), item_id: item.id, warehouse_id: w.id, quantity: 0, average_cost: item.purchase_price, last_updated: new Date().toISOString() });
          }
        });
      });
      newState.itemStock = [...newState.itemStock, ...newStock];
      return newState;
    }

    // ============ Warehouse Transfer ============
    case 'CREATE_WAREHOUSE_TRANSFER': {
      const transfer = action.payload;
      let newState = { ...state };
      newState.warehouseTransfers = [...(newState.warehouseTransfers || []), transfer];

      // Update stock - deduct from source, add to destination
      let updatedStock = [...newState.itemStock];
      transfer.items.forEach(ti => {
        const fromIdx = updatedStock.findIndex(s => s.item_id === ti.item_id && s.warehouse_id === transfer.from_warehouse_id);
        const toIdx = updatedStock.findIndex(s => s.item_id === ti.item_id && s.warehouse_id === transfer.to_warehouse_id);
        if (fromIdx >= 0) {
          updatedStock[fromIdx] = { ...updatedStock[fromIdx], quantity: updatedStock[fromIdx].quantity - ti.quantity, last_updated: new Date().toISOString() };
        }
        if (toIdx >= 0) {
          const oldQty = updatedStock[toIdx].quantity;
          const oldCost = updatedStock[toIdx].average_cost;
          const newQty = oldQty + ti.quantity;
          const newCost = newQty > 0 ? ((oldQty * oldCost) + (ti.quantity * ti.unit_cost)) / newQty : ti.unit_cost;
          updatedStock[toIdx] = { ...updatedStock[toIdx], quantity: newQty, average_cost: newCost, last_updated: new Date().toISOString() };
        } else {
          // Create new stock record for destination
          updatedStock.push({ id: uid(), item_id: ti.item_id, warehouse_id: transfer.to_warehouse_id, quantity: ti.quantity, average_cost: ti.unit_cost, last_updated: new Date().toISOString() });
        }
      });
      newState.itemStock = updatedStock;
      return newState;
    }

    // ============ Invoice (New Comprehensive System) ============
    case 'CREATE_INVOICE': {
      const { invoice, items } = action.payload;
      let newState = { ...state };
      newState.invoices = [...newState.invoices, invoice];
      newState.invoiceItems = [...newState.invoiceItems, ...items];

      // Update stock based on invoice type
      const updatedInvStock = [...newState.itemStock];
      const isSalesType = ['sales', 'purchase_return', 'damages'].includes(invoice.invoice_type);
      const isPurchaseType = ['purchase', 'sales_return'].includes(invoice.invoice_type);

      items.forEach(item => {
        const stockIdx = updatedInvStock.findIndex(s => s.item_id === item.item_id && s.warehouse_id === item.warehouse_id);
        if (stockIdx >= 0) {
          if (isSalesType) {
            updatedInvStock[stockIdx] = { ...updatedInvStock[stockIdx], quantity: updatedInvStock[stockIdx].quantity - item.quantity, last_updated: new Date().toISOString() };
          } else if (isPurchaseType) {
            const oldQty = updatedInvStock[stockIdx].quantity;
            const oldCost = updatedInvStock[stockIdx].average_cost;
            const newQty = oldQty + item.quantity;
            const newAvgCost = newQty > 0 ? ((oldQty * oldCost) + (item.quantity * item.unit_price)) / newQty : item.unit_price;
            updatedInvStock[stockIdx] = { ...updatedInvStock[stockIdx], quantity: newQty, average_cost: newAvgCost, last_updated: new Date().toISOString() };
          }
        }
      });
      newState.itemStock = updatedInvStock;

      // Journal entry lines
      const jeInvLines: { account_id: string; debit: number; credit: number; description: string; contact_id?: string }[] = [];
      const invContact = state.contacts.find(c => c.id === invoice.contact_id);

      if (invoice.payment_method === 'cash') {
        const treasury = state.treasuries.find(t => t.id === invoice.treasury_id);
        if (treasury) {
          jeInvLines.push({ account_id: treasury.account_id, debit: isSalesType ? invoice.total_amount : 0, credit: isPurchaseType ? invoice.total_amount : 0, description: `نقدية - ${invoice.invoice_number}` });
        }
      } else if (invoice.payment_method === 'credit') {
        if (invContact) {
          jeInvLines.push({ account_id: invContact.account_id, debit: isSalesType ? invoice.total_amount : 0, credit: isPurchaseType ? invoice.total_amount : 0, description: `آجل - ${invoice.invoice_number}`, contact_id: invContact.id });
        }
      } else {
        if (invoice.paid_amount > 0) {
          const treasury = state.treasuries.find(t => t.id === invoice.treasury_id);
          if (treasury) {
            jeInvLines.push({ account_id: treasury.account_id, debit: isSalesType ? invoice.paid_amount : 0, credit: isPurchaseType ? invoice.paid_amount : 0, description: `جزئي نقدي - ${invoice.invoice_number}` });
          }
        }
        if (invoice.remaining_amount > 0 && invContact) {
          jeInvLines.push({ account_id: invContact.account_id, debit: isSalesType ? invoice.remaining_amount : 0, credit: isPurchaseType ? invoice.remaining_amount : 0, description: `جزئي آجل - ${invoice.invoice_number}`, contact_id: invContact.id });
        }
      }

      // Revenue / Purchase / Returns with tax
      const netInvAmount = invoice.total_amount - (invoice.tax_amount || 0);
      if (isSalesType) {
        if (invoice.invoice_type === 'sales') {
          jeInvLines.push({ account_id: 'r2', debit: 0, credit: netInvAmount, description: `إيرادات مبيعات - ${invoice.invoice_number}` });
        } else if (invoice.invoice_type === 'purchase_return') {
          jeInvLines.push({ account_id: 'x8', debit: 0, credit: netInvAmount, description: `مردودات مشتريات - ${invoice.invoice_number}` });
        } else {
          jeInvLines.push({ account_id: 'r2', debit: 0, credit: netInvAmount, description: `إيرادات - ${invoice.invoice_number}` });
        }
        if (invoice.tax_amount > 0) {
          jeInvLines.push({ account_id: 'tax-output', debit: 0, credit: invoice.tax_amount, description: `ضريبة مخرجات - ${invoice.invoice_number}` });
        }
      } else if (isPurchaseType) {
        if (invoice.invoice_type === 'purchase') {
          // Route to correct inventory account
          const purchaseByAcc: Record<string, number> = {};
          items.forEach(itm => {
            const fullItem = state.items.find(i => i.id === itm.item_id);
            const accId = getInventoryAccountForItem(fullItem);
            purchaseByAcc[accId] = (purchaseByAcc[accId] || 0) + itm.total;
          });
          const totalItemsVal = Object.values(purchaseByAcc).reduce((s, v) => s + v, 0);
          Object.entries(purchaseByAcc).forEach(([accId, val]) => {
            const proportion = totalItemsVal > 0 ? val / totalItemsVal : 1;
            jeInvLines.push({ account_id: accId, debit: Math.round(netInvAmount * proportion * 100) / 100, credit: 0, description: `مشتريات - ${invoice.invoice_number}` });
          });
        } else if (invoice.invoice_type === 'sales_return') {
          jeInvLines.push({ account_id: 'r5', debit: netInvAmount, credit: 0, description: `مردودات مبيعات - ${invoice.invoice_number}` });
        } else {
          jeInvLines.push({ account_id: 'a8', debit: netInvAmount, credit: 0, description: `مخزون - ${invoice.invoice_number}` });
        }
        if (invoice.tax_amount > 0) {
          jeInvLines.push({ account_id: 'tax-input', debit: invoice.tax_amount, credit: 0, description: `ضريبة مدخلات - ${invoice.invoice_number}` });
        }
      } else if (invoice.invoice_type === 'inventory_count') {
        jeInvLines.push({ account_id: 'a8', debit: 0, credit: invoice.total_amount, description: `جرد مخزون - ${invoice.invoice_number}` });
      }

      const srcTypeInv: SourceType = invoice.invoice_type === 'sales_return' ? 'sales_return' : invoice.invoice_type === 'purchase_return' ? 'purchase_return' : isSalesType ? 'sales_invoice' : 'purchase_invoice';
      const { entry: invEntry, entryLines: invEntryLines } = createJournalEntry(newState, srcTypeInv, invoice.id, invoice.invoice_date, `فاتورة رقم ${invoice.invoice_number}`, jeInvLines.filter(l => l.account_id));
      newState.journalEntries = [...newState.journalEntries, invEntry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...invEntryLines];

      // ★ COGS for sales type invoices
      if (isSalesType && invoice.invoice_type !== 'purchase_return') {
        let totalInvCOGS = 0;
        const cogsInvLines: { account_id: string; debit: number; credit: number; description: string }[] = [];
        items.forEach(itm => {
          const stockRec = updatedInvStock.find(s => s.item_id === itm.item_id && s.warehouse_id === itm.warehouse_id)
            || newState.itemStock.find(s => s.item_id === itm.item_id);
          const unitCost = itm.cost_price > 0 ? itm.cost_price : (stockRec?.average_cost || 0);
          const itmCost = itm.quantity * unitCost;
          if (itmCost > 0) {
            totalInvCOGS += itmCost;
            const fullItem = state.items.find(i => i.id === itm.item_id);
            const invAcc = getInventoryAccountForItem(fullItem);
            const existing = cogsInvLines.find(l => l.account_id === invAcc && l.credit > 0);
            if (existing) { existing.credit += itmCost; } else {
              cogsInvLines.push({ account_id: invAcc, debit: 0, credit: itmCost, description: `تخفيض مخزون - ${invoice.invoice_number}` });
            }
          }
        });
        if (totalInvCOGS > 0) {
          cogsInvLines.unshift({ account_id: 'x2', debit: totalInvCOGS, credit: 0, description: `ت.ب.م - ${invoice.invoice_number}` });
          const { entry: ce, entryLines: cl } = createJournalEntry(newState, 'cogs', invoice.id, invoice.invoice_date, `ت.ب.م - فاتورة ${invoice.invoice_number}`, cogsInvLines);
          newState.journalEntries = [...newState.journalEntries, ce];
          newState.journalEntryLines = [...newState.journalEntryLines, ...cl];
        }
      }
      // ★ Reverse COGS for sales return
      if (invoice.invoice_type === 'sales_return') {
        let totalReturnCOGS = 0;
        const revCogsLines: { account_id: string; debit: number; credit: number; description: string }[] = [];
        items.forEach(itm => {
          const unitCost = itm.cost_price > 0 ? itm.cost_price : (state.items.find(i => i.id === itm.item_id)?.purchase_price || 0);
          const itmCost = itm.quantity * unitCost;
          if (itmCost > 0) {
            totalReturnCOGS += itmCost;
            const fullItem = state.items.find(i => i.id === itm.item_id);
            const invAcc = getInventoryAccountForItem(fullItem);
            const existing = revCogsLines.find(l => l.account_id === invAcc && l.debit > 0);
            if (existing) { existing.debit += itmCost; } else {
              revCogsLines.push({ account_id: invAcc, debit: itmCost, credit: 0, description: `إرجاع مخزون - مرتجع ${invoice.invoice_number}` });
            }
          }
        });
        if (totalReturnCOGS > 0) {
          revCogsLines.push({ account_id: 'x2', debit: 0, credit: totalReturnCOGS, description: `عكس ت.ب.م - مرتجع ${invoice.invoice_number}` });
          const { entry: rce, entryLines: rcl } = createJournalEntry(newState, 'sales_return', invoice.id, invoice.invoice_date, `عكس ت.ب.م - مرتجع ${invoice.invoice_number}`, revCogsLines);
          newState.journalEntries = [...newState.journalEntries, rce];
          newState.journalEntryLines = [...newState.journalEntryLines, ...rcl];
        }
      }

      // Update treasury balance
      const txnDir = isSalesType ? 'deposit' : 'withdrawal';
      if (invoice.paid_amount > 0 && invoice.treasury_id) {
        const tIdx = newState.treasuries.findIndex(t => t.id === invoice.treasury_id);
        if (tIdx >= 0) {
          const updTreasuries = [...newState.treasuries];
          const newBal = updTreasuries[tIdx].current_balance + (isSalesType ? invoice.paid_amount : -invoice.paid_amount);
          updTreasuries[tIdx] = { ...updTreasuries[tIdx], current_balance: newBal };
          newState.treasuries = updTreasuries;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: invoice.treasury_id, transaction_date: invoice.invoice_date,
            transaction_type: txnDir as 'deposit' | 'withdrawal', amount: invoice.paid_amount,
            balance_after: newBal,
            source_type: 'sales_invoice', source_id: invoice.id,
            description: `فاتورة ${invoice.invoice_number}`, created_at: new Date().toISOString(),
          }];
        }
      }

      return newState;
    }

    // ============ Update Invoice Settings ============
    case 'UPDATE_INVOICE_SETTINGS':
      return { ...state, invoiceSettings: action.payload };

    // ============ Add Shipping Company ============
    case 'ADD_SHIPPING_COMPANY':
      return { ...state, shippingCompanies: [...state.shippingCompanies, action.payload] };

    // ============ Update Shipping Company ============
    case 'UPDATE_SHIPPING_COMPANY':
      return { ...state, shippingCompanies: state.shippingCompanies.map(sc => sc.id === action.payload.id ? action.payload : sc) };

    // ============ Delete Shipping Company ============
    case 'DELETE_SHIPPING_COMPANY':
      return { ...state, shippingCompanies: state.shippingCompanies.filter(sc => sc.id !== action.payload) };

    // ============ Update Invoice Status ============
    case 'UPDATE_INVOICE_STATUS':
      return {
        ...state,
        invoices: (state.invoices || []).map(inv =>
          inv.id === action.payload.invoice_id ? { ...inv, invoice_status: action.payload.status } : inv
        ),
      };

    // ============ Manufacturing Journal Entry ============
    case 'CREATE_MANUFACTURING_JOURNAL': {
      const { journalEntry, journalEntryLines, stockUpdates } = action.payload;
      let newState = { ...state };

      // Add journal entry + lines
      newState.journalEntries = [...newState.journalEntries, journalEntry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...journalEntryLines];

      // Apply stock updates
      const updatedStock = [...newState.itemStock];
      stockUpdates.forEach(update => {
        const idx = updatedStock.findIndex(
          s => s.item_id === update.item_id && s.warehouse_id === update.warehouse_id
        );
        if (idx >= 0) {
          const currentQty = updatedStock[idx].quantity;
          const newQty = currentQty + update.quantity_delta;
          if (update.quantity_delta > 0) {
            // Adding stock – recalculate weighted average cost
            const totalCost = currentQty * updatedStock[idx].average_cost + update.quantity_delta * update.unit_cost;
            const avgCost = newQty > 0 ? totalCost / newQty : update.unit_cost;
            updatedStock[idx] = { ...updatedStock[idx], quantity: Math.max(0, newQty), average_cost: avgCost, last_updated: new Date().toISOString() };
          } else {
            // Deducting stock
            updatedStock[idx] = { ...updatedStock[idx], quantity: Math.max(0, newQty), last_updated: new Date().toISOString() };
          }
        } else if (update.quantity_delta > 0) {
          // New stock record
          updatedStock.push({
            id: uid(),
            item_id: update.item_id,
            warehouse_id: update.warehouse_id,
            quantity: update.quantity_delta,
            average_cost: update.unit_cost,
            last_updated: new Date().toISOString(),
          });
        }
      });
      newState.itemStock = updatedStock;

      return newState;
    }

    // ============ Reverse Sales Invoice ============
    case 'REVERSE_SALES_INVOICE': {
      const invoiceId = action.payload.invoice_id;
      const invoice = state.salesInvoices.find(si => si.id === invoiceId);
      if (!invoice) return state;
      let newState = { ...state };

      // Mark as cancelled
      newState.salesInvoices = newState.salesInvoices.map(si =>
        si.id === invoiceId ? { ...si, status: 'cancelled' as any } : si
      );

      // Return stock
      const items = state.salesInvoiceItems.filter(i => i.invoice_id === invoiceId);
      const updatedStock = [...newState.itemStock];
      items.forEach(item => {
        const stockIdx = updatedStock.findIndex(s => s.item_id === item.item_id && s.warehouse_id === item.warehouse_id);
        if (stockIdx >= 0) {
          updatedStock[stockIdx] = { ...updatedStock[stockIdx], quantity: updatedStock[stockIdx].quantity + item.quantity, last_updated: new Date().toISOString() };
        }
      });
      newState.itemStock = updatedStock;

      // Reverse sales journal entry
      const contact = state.contacts.find(c => c.id === invoice.contact_id);
      const revLines: { account_id: string; debit: number; credit: number; description: string; contact_id?: string }[] = [];
      const netAmount = invoice.total_amount - (invoice.tax_amount || 0);
      revLines.push({ account_id: 'r5', debit: netAmount, credit: 0, description: `مردودات مبيعات - عكس فاتورة ${invoice.invoice_number}` });
      if (invoice.tax_amount > 0) {
        revLines.push({ account_id: 'tax-output', debit: invoice.tax_amount, credit: 0, description: `عكس ضريبة مخرجات - ${invoice.invoice_number}` });
      }
      if (invoice.payment_type === 'cash' && invoice.treasury_id) {
        const treasury = state.treasuries.find(t => t.id === invoice.treasury_id);
        if (treasury) revLines.push({ account_id: treasury.account_id, debit: 0, credit: invoice.total_amount, description: `عكس مبيعات نقدية - ${invoice.invoice_number}` });
      } else if (contact) {
        revLines.push({ account_id: contact.account_id, debit: 0, credit: invoice.total_amount, description: `عكس مبيعات آجلة - ${invoice.invoice_number}`, contact_id: contact.id });
      }
      const { entry: revEntry, entryLines: revEntryLines } = createJournalEntry(newState, 'sales_return', invoiceId, today(), `عكس فاتورة بيع ${invoice.invoice_number}`, revLines);
      newState.journalEntries = [...newState.journalEntries, revEntry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...revEntryLines];

      // Reverse COGS
      let totalRevCOGS = 0;
      const revCogsLines: { account_id: string; debit: number; credit: number; description: string }[] = [];
      items.forEach(item => {
        const unitCost = item.cost_price > 0 ? item.cost_price : (state.itemStock.find(s => s.item_id === item.item_id)?.average_cost || 0);
        const itmCost = item.quantity * unitCost;
        if (itmCost > 0) {
          totalRevCOGS += itmCost;
          const fullItem = state.items.find(i => i.id === item.item_id);
          const invAcc = getInventoryAccountForItem(fullItem);
          revCogsLines.push({ account_id: invAcc, debit: itmCost, credit: 0, description: `إرجاع مخزون - عكس ${invoice.invoice_number}` });
        }
      });
      if (totalRevCOGS > 0) {
        revCogsLines.push({ account_id: 'x2', debit: 0, credit: totalRevCOGS, description: `عكس ت.ب.م - ${invoice.invoice_number}` });
        const { entry: rc, entryLines: rcl } = createJournalEntry(newState, 'sales_return', invoiceId, today(), `عكس ت.ب.م - ${invoice.invoice_number}`, revCogsLines);
        newState.journalEntries = [...newState.journalEntries, rc];
        newState.journalEntryLines = [...newState.journalEntryLines, ...rcl];
      }

      // Reverse treasury
      if (invoice.paid_amount > 0 && invoice.treasury_id) {
        const tIdx = newState.treasuries.findIndex(t => t.id === invoice.treasury_id);
        if (tIdx >= 0) {
          const ut = [...newState.treasuries];
          ut[tIdx] = { ...ut[tIdx], current_balance: ut[tIdx].current_balance - invoice.paid_amount };
          newState.treasuries = ut;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: invoice.treasury_id, transaction_date: today(),
            transaction_type: 'withdrawal', amount: invoice.paid_amount,
            balance_after: ut[tIdx].current_balance,
            source_type: 'sales_return', source_id: invoiceId,
            description: `عكس فاتورة بيع ${invoice.invoice_number}`, created_at: new Date().toISOString(),
          }];
        }
      }
      return newState;
    }

    // ============ Reverse Purchase Invoice ============
    case 'REVERSE_PURCHASE_INVOICE': {
      const invoiceId = action.payload.invoice_id;
      const invoice = state.purchaseInvoices.find(pi => pi.id === invoiceId);
      if (!invoice) return state;
      let newState = { ...state };

      newState.purchaseInvoices = newState.purchaseInvoices.map(pi =>
        pi.id === invoiceId ? { ...pi, status: 'cancelled' as any } : pi
      );

      // Deduct stock
      const items = state.purchaseInvoiceItems.filter(i => i.invoice_id === invoiceId);
      const updatedStock = [...newState.itemStock];
      items.forEach(item => {
        const stockIdx = updatedStock.findIndex(s => s.item_id === item.item_id && s.warehouse_id === item.warehouse_id);
        if (stockIdx >= 0) {
          updatedStock[stockIdx] = { ...updatedStock[stockIdx], quantity: Math.max(0, updatedStock[stockIdx].quantity - item.quantity), last_updated: new Date().toISOString() };
        }
      });
      newState.itemStock = updatedStock;

      // Reverse purchase journal
      const contact = state.contacts.find(c => c.id === invoice.contact_id);
      const revLines: { account_id: string; debit: number; credit: number; description: string; contact_id?: string }[] = [];
      const netAmount = invoice.total_amount - (invoice.tax_amount || 0);
      if (invoice.payment_type === 'cash' && invoice.treasury_id) {
        const treasury = state.treasuries.find(t => t.id === invoice.treasury_id);
        if (treasury) revLines.push({ account_id: treasury.account_id, debit: invoice.total_amount, credit: 0, description: `عكس مشتريات - ${invoice.invoice_number}` });
      } else if (contact) {
        revLines.push({ account_id: contact.account_id, debit: invoice.total_amount, credit: 0, description: `عكس مشتريات آجلة - ${invoice.invoice_number}`, contact_id: contact.id });
      }
      revLines.push({ account_id: 'x8', debit: netAmount, credit: 0, description: `مردودات مشتريات - ${invoice.invoice_number}` });
      // Determine correct inventory accounts
      items.forEach(item => {
        const fullItem = state.items.find(i => i.id === item.item_id);
        const invAcc = getInventoryAccountForItem(fullItem);
        revLines.push({ account_id: invAcc, debit: 0, credit: item.quantity * item.unit_price, description: `خصم مخزون - عكس ${invoice.invoice_number}` });
      });
      if (invoice.tax_amount > 0) {
        revLines.push({ account_id: 'tax-input', debit: 0, credit: invoice.tax_amount, description: `عكس ضريبة مدخلات - ${invoice.invoice_number}` });
      }
      const { entry: revEntry, entryLines: revEntryLines } = createJournalEntry(newState, 'purchase_return', invoiceId, today(), `عكس فاتورة شراء ${invoice.invoice_number}`, revLines);
      newState.journalEntries = [...newState.journalEntries, revEntry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...revEntryLines];

      // Reverse treasury
      if (invoice.paid_amount > 0 && invoice.treasury_id) {
        const tIdx = newState.treasuries.findIndex(t => t.id === invoice.treasury_id);
        if (tIdx >= 0) {
          const ut = [...newState.treasuries];
          ut[tIdx] = { ...ut[tIdx], current_balance: ut[tIdx].current_balance + invoice.paid_amount };
          newState.treasuries = ut;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id: invoice.treasury_id, transaction_date: today(),
            transaction_type: 'deposit', amount: invoice.paid_amount,
            balance_after: ut[tIdx].current_balance,
            source_type: 'purchase_return', source_id: invoiceId,
            description: `عكس فاتورة شراء ${invoice.invoice_number}`, created_at: new Date().toISOString(),
          }];
        }
      }
      return newState;
    }

    // ============ Payroll Journal Entry ============
    case 'CREATE_PAYROLL_JOURNAL': {
      const { total_amount, date, description, treasury_id, bank_id, payment_source } = action.payload;
      let newState = { ...state };
      const payrollId = uid();

      const jeLines: { account_id: string; debit: number; credit: number; description: string }[] = [
        { account_id: 'x3', debit: total_amount, credit: 0, description: `رواتب وأجور - ${description}` },
      ];

      if (payment_source === 'treasury' && treasury_id) {
        const treasury = state.treasuries.find(t => t.id === treasury_id);
        if (treasury) {
          jeLines.push({ account_id: treasury.account_id, debit: 0, credit: total_amount, description: `صرف رواتب من ${treasury.name}` });
          const tIdx = newState.treasuries.findIndex(t => t.id === treasury_id);
          const ut = [...newState.treasuries];
          ut[tIdx] = { ...ut[tIdx], current_balance: ut[tIdx].current_balance - total_amount };
          newState.treasuries = ut;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id, transaction_date: date,
            transaction_type: 'withdrawal', amount: total_amount,
            balance_after: ut[tIdx].current_balance,
            source_type: 'payroll', source_id: payrollId,
            description: `صرف رواتب - ${description}`, created_at: new Date().toISOString(),
          }];
        }
      } else if (payment_source === 'bank' && bank_id) {
        const bank = state.banks.find(b => b.id === bank_id);
        if (bank) {
          jeLines.push({ account_id: bank.account_id, debit: 0, credit: total_amount, description: `صرف رواتب من ${bank.bank_name}` });
          const bIdx = newState.banks.findIndex(b => b.id === bank_id);
          const ub = [...newState.banks];
          ub[bIdx] = { ...ub[bIdx], current_balance: ub[bIdx].current_balance - total_amount };
          newState.banks = ub;
          newState.bankTransactions = [...newState.bankTransactions, {
            id: uid(), bank_id, transaction_date: date,
            transaction_type: 'withdrawal', amount: total_amount,
            balance_after: ub[bIdx].current_balance,
            check_number: '', source_type: 'payroll', source_id: payrollId,
            description: `صرف رواتب - ${description}`, created_at: new Date().toISOString(),
          }];
        }
      }

      const { entry, entryLines } = createJournalEntry(newState, 'payroll', payrollId, date, `صرف رواتب - ${description}`, jeLines);
      newState.journalEntries = [...newState.journalEntries, entry];
      newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];
      return newState;
    }

    // ============ Close Fiscal Year ============
    case 'CLOSE_FISCAL_YEAR': {
      const { date } = action.payload;
      let newState = { ...state };
      const closeId = uid();

      // Close revenue accounts → Income Summary
      const revenueAccounts = state.accounts.filter(a => a.account_type === 'revenue' && !a.is_parent && a.is_active);
      const expenseAccounts = state.accounts.filter(a => a.account_type === 'expense' && !a.is_parent && a.is_active);

      const closeLines: { account_id: string; debit: number; credit: number; description: string }[] = [];

      let totalRevenue = 0;
      revenueAccounts.forEach(acc => {
        const lines = state.journalEntryLines.filter(l => l.account_id === acc.id);
        const balance = lines.reduce((s, l) => s + l.credit - l.debit, 0) + acc.opening_balance;
        if (balance > 0) {
          closeLines.push({ account_id: acc.id, debit: balance, credit: 0, description: `إقفال ${acc.account_name}` });
          totalRevenue += balance;
        }
      });
      if (totalRevenue > 0) {
        closeLines.push({ account_id: 'e4', debit: 0, credit: totalRevenue, description: 'إقفال الإيرادات إلى ملخص الدخل' });
      }

      let totalExpenses = 0;
      expenseAccounts.forEach(acc => {
        const lines = state.journalEntryLines.filter(l => l.account_id === acc.id);
        const balance = lines.reduce((s, l) => s + l.debit - l.credit, 0) + acc.opening_balance;
        if (balance > 0) {
          closeLines.push({ account_id: acc.id, debit: 0, credit: balance, description: `إقفال ${acc.account_name}` });
          totalExpenses += balance;
        }
      });
      if (totalExpenses > 0) {
        closeLines.push({ account_id: 'e4', debit: totalExpenses, credit: 0, description: 'إقفال المصروفات من ملخص الدخل' });
      }

      // Net income → Retained Earnings
      const netIncome = totalRevenue - totalExpenses;
      if (Math.abs(netIncome) > 0.01) {
        if (netIncome > 0) {
          closeLines.push({ account_id: 'e4', debit: netIncome, credit: 0, description: 'تحويل صافي الربح لأرباح مرحّلة' });
          closeLines.push({ account_id: 'e3', debit: 0, credit: netIncome, description: 'صافي ربح الفترة' });
        } else {
          closeLines.push({ account_id: 'e4', debit: 0, credit: Math.abs(netIncome), description: 'تحويل صافي الخسارة لأرباح مرحّلة' });
          closeLines.push({ account_id: 'e3', debit: Math.abs(netIncome), credit: 0, description: 'صافي خسارة الفترة' });
        }
      }

      if (closeLines.length > 0) {
        const { entry, entryLines } = createJournalEntry(newState, 'fiscal_close', closeId, date, `إقفال السنة المالية`, closeLines);
        newState.journalEntries = [...newState.journalEntries, entry];
        newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];
      }
      return newState;
    }

    // ============ Inventory Adjustment ============
    case 'CREATE_INVENTORY_ADJUSTMENT': {
      const { adjustments, date, notes } = action.payload;
      let newState = { ...state };
      const adjId = uid();

      const updatedStock = [...newState.itemStock];
      const jeLines: { account_id: string; debit: number; credit: number; description: string }[] = [];
      let totalSurplus = 0;
      let totalDeficit = 0;

      adjustments.forEach(adj => {
        const diff = adj.actual_qty - adj.book_qty;
        const diffValue = Math.abs(diff) * adj.unit_cost;
        const stockIdx = updatedStock.findIndex(s => s.item_id === adj.item_id && s.warehouse_id === adj.warehouse_id);
        if (stockIdx >= 0) {
          updatedStock[stockIdx] = { ...updatedStock[stockIdx], quantity: adj.actual_qty, last_updated: new Date().toISOString() };
        }
        const fullItem = state.items.find(i => i.id === adj.item_id);
        const invAcc = getInventoryAccountForItem(fullItem);
        if (diff > 0) {
          // Surplus - increase inventory
          totalSurplus += diffValue;
          jeLines.push({ account_id: invAcc, debit: diffValue, credit: 0, description: `فائض جرد - ${fullItem?.item_name || adj.item_id}` });
        } else if (diff < 0) {
          // Deficit - decrease inventory
          totalDeficit += diffValue;
          jeLines.push({ account_id: invAcc, debit: 0, credit: diffValue, description: `عجز جرد - ${fullItem?.item_name || adj.item_id}` });
        }
      });
      newState.itemStock = updatedStock;

      // Balance entries
      if (totalSurplus > 0) {
        jeLines.push({ account_id: 'r4', debit: 0, credit: totalSurplus, description: 'فائض جرد (إيرادات أخرى)' });
      }
      if (totalDeficit > 0) {
        jeLines.push({ account_id: 'x7', debit: totalDeficit, credit: 0, description: 'عجز جرد (مصروفات متنوعة)' });
      }

      if (jeLines.length > 0) {
        const { entry, entryLines } = createJournalEntry(newState, 'inventory_adjustment', adjId, date, `جرد مخزون - ${notes || 'تسوية'}`, jeLines);
        newState.journalEntries = [...newState.journalEntries, entry];
        newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];
      }
      return newState;
    }

    // ============ Add Payment to Invoice ============
    case 'ADD_INVOICE_PAYMENT': {
      const { invoice_id, invoice_type, amount, date, treasury_id, bank_id, payment_method, notes } = action.payload;
      let newState = { ...state };
      const paymentId = uid();

      // Update invoice paid amount
      if (invoice_type === 'sales') {
        const siIdx = newState.salesInvoices.findIndex(si => si.id === invoice_id);
        if (siIdx >= 0) {
          const si = newState.salesInvoices[siIdx];
          const newPaid = si.paid_amount + amount;
          const newRemaining = Math.max(0, si.total_amount - newPaid);
          const newStatus = newRemaining <= 0.01 ? 'paid' : 'partial';
          const usi = [...newState.salesInvoices];
          usi[siIdx] = { ...si, paid_amount: newPaid, remaining_amount: newRemaining, status: newStatus as any };
          newState.salesInvoices = usi;
        }
      } else {
        const piIdx = newState.purchaseInvoices.findIndex(pi => pi.id === invoice_id);
        if (piIdx >= 0) {
          const pi = newState.purchaseInvoices[piIdx];
          const newPaid = pi.paid_amount + amount;
          const newRemaining = Math.max(0, pi.total_amount - newPaid);
          const newStatus = newRemaining <= 0.01 ? 'paid' : 'partial';
          const upi = [...newState.purchaseInvoices];
          upi[piIdx] = { ...pi, paid_amount: newPaid, remaining_amount: newRemaining, status: newStatus as any };
          newState.purchaseInvoices = upi;
        }
      }

      // Journal entry + treasury/bank update
      const jeLines: { account_id: string; debit: number; credit: number; description: string; contact_id?: string }[] = [];
      const inv = invoice_type === 'sales'
        ? state.salesInvoices.find(si => si.id === invoice_id)
        : state.purchaseInvoices.find(pi => pi.id === invoice_id);
      const contact = inv ? state.contacts.find(c => c.id === inv.contact_id) : null;

      if (payment_method === 'cash' && treasury_id) {
        const treasury = state.treasuries.find(t => t.id === treasury_id);
        if (treasury) {
          if (invoice_type === 'sales') {
            jeLines.push({ account_id: treasury.account_id, debit: amount, credit: 0, description: `تحصيل دفعة - ${notes}` });
            if (contact) jeLines.push({ account_id: contact.account_id, debit: 0, credit: amount, description: `سداد عميل - ${notes}`, contact_id: contact.id });
          } else {
            jeLines.push({ account_id: treasury.account_id, debit: 0, credit: amount, description: `سداد دفعة - ${notes}` });
            if (contact) jeLines.push({ account_id: contact.account_id, debit: amount, credit: 0, description: `سداد مورد - ${notes}`, contact_id: contact.id });
          }
          const tIdx = newState.treasuries.findIndex(t => t.id === treasury_id);
          const ut = [...newState.treasuries];
          const balChange = invoice_type === 'sales' ? amount : -amount;
          ut[tIdx] = { ...ut[tIdx], current_balance: ut[tIdx].current_balance + balChange };
          newState.treasuries = ut;
          newState.treasuryTransactions = [...newState.treasuryTransactions, {
            id: uid(), treasury_id, transaction_date: date,
            transaction_type: invoice_type === 'sales' ? 'deposit' : 'withdrawal',
            amount, balance_after: ut[tIdx].current_balance,
            source_type: invoice_type === 'sales' ? 'receipt' : 'payment', source_id: paymentId,
            description: notes, created_at: new Date().toISOString(),
          }];
        }
      } else if (bank_id) {
        const bank = state.banks.find(b => b.id === bank_id);
        if (bank) {
          if (invoice_type === 'sales') {
            jeLines.push({ account_id: bank.account_id, debit: amount, credit: 0, description: `تحصيل دفعة بنكية - ${notes}` });
            if (contact) jeLines.push({ account_id: contact.account_id, debit: 0, credit: amount, description: `سداد عميل - ${notes}`, contact_id: contact.id });
          } else {
            jeLines.push({ account_id: bank.account_id, debit: 0, credit: amount, description: `سداد دفعة بنكية - ${notes}` });
            if (contact) jeLines.push({ account_id: contact.account_id, debit: amount, credit: 0, description: `سداد مورد - ${notes}`, contact_id: contact.id });
          }
          const bIdx = newState.banks.findIndex(b => b.id === bank_id);
          const ub = [...newState.banks];
          const balChange = invoice_type === 'sales' ? amount : -amount;
          ub[bIdx] = { ...ub[bIdx], current_balance: ub[bIdx].current_balance + balChange };
          newState.banks = ub;
          newState.bankTransactions = [...newState.bankTransactions, {
            id: uid(), bank_id, transaction_date: date,
            transaction_type: invoice_type === 'sales' ? 'deposit' : 'withdrawal',
            amount, balance_after: ub[bIdx].current_balance,
            check_number: '', source_type: invoice_type === 'sales' ? 'receipt' : 'payment', source_id: paymentId,
            description: notes, created_at: new Date().toISOString(),
          }];
        }
      }

      if (jeLines.length > 0) {
        const srcType: SourceType = invoice_type === 'sales' ? 'receipt' : 'payment';
        const { entry, entryLines } = createJournalEntry(newState, srcType, paymentId, date, notes, jeLines);
        newState.journalEntries = [...newState.journalEntries, entry];
        newState.journalEntryLines = [...newState.journalEntryLines, ...entryLines];
      }
      return newState;
    }

    default:
      return state;
  }
}

// ============ Supabase Persistence (org-scoped) ============
async function loadStateFromSupabase(orgId: string): Promise<AccountingState | null> {
  try {
    const { data, error } = await supabase
      .from('org_state')
      .select('state_json')
      .eq('org_id', orgId)
      .maybeSingle();
    if (error) {
      console.log(`Failed to load state from Supabase: ${error.message}`);
      return null;
    }
    if (data?.state_json) {
      return data.state_json as unknown as AccountingState;
    }
    return null;
  } catch (error) {
    console.log(`Error loading state from Supabase: ${error}`);
    return null;
  }
}

async function saveStateToSupabase(orgId: string, state: AccountingState): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('org_state')
      .upsert(
        { org_id: orgId, state_json: state as any, schema_ver: 1 },
        { onConflict: 'org_id' }
      );
    if (error) {
      console.log(`Failed to save state to Supabase: ${error.message}`);
      return false;
    }
    return true;
  } catch (error) {
    console.log(`Error saving state to Supabase: ${error}`);
    return false;
  }
}

// ============ Context ============
interface AccountingContextType {
  state: AccountingState;
  dispatch: React.Dispatch<Action>;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  // Helper functions
  getAccountById: (id: string) => Account | undefined;
  getContactById: (id: string) => Contact | undefined;
  getItemById: (id: string) => Item | undefined;
  getAccountBalance: (accountId: string) => { debit: number; credit: number; balance: number };
  getAccountLedger: (accountId: string) => JournalEntryLine[];
  getTrialBalance: () => { account_code: string; account_name: string; account_id: string; total_debit: number; total_credit: number; balance: number; opening_balance: number }[];
  formatCurrency: (amount: number) => string;
  nextInvoiceNumber: (type: 'sales' | 'purchase') => string;
  nextReceiptNumber: () => string;
  nextPaymentNumber: () => string;
  nextExpenseNumber: () => string;
  getBalanceSheet: () => { assets: { id: string; code: string; name: string; balance: number }[]; liabilities: { id: string; code: string; name: string; balance: number }[]; equity: { id: string; code: string; name: string; balance: number }[]; totalAssets: number; totalLiabilities: number; totalEquity: number };
  getAgingReport: (contactType: 'customer' | 'supplier') => { contact_id: string; contact_name: string; current: number; days_30: number; days_60: number; days_90: number; over_90: number; total: number }[];
  getCashFlowSummary: () => { operating_in: number; operating_out: number; investing_in: number; investing_out: number; financing_in: number; financing_out: number; net: number };
}

const AccountingContext = createContext<AccountingContextType | null>(null);

export function AccountingProvider({ children }: { children: ReactNode }) {
  const { organization } = useAuth();
  const orgId = organization?.id || null;
  const [state, dispatch] = useReducer(accountingReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isInitialLoadDone = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  const orgIdRef = useRef(orgId);
  stateRef.current = state;
  orgIdRef.current = orgId;

  // Load state from Supabase on mount (org-scoped)
  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const savedState = await loadStateFromSupabase(orgId!);
        if (!cancelled) {
          if (savedState) {
            const requiredKeys: (keyof AccountingState)[] = [
              'accounts', 'contacts', 'warehouses', 'itemCategories', 'items', 'itemStock',
              'treasuries', 'treasuryTransactions', 'banks', 'bankTransactions',
              'salesInvoices', 'salesInvoiceItems', 'purchaseInvoices', 'purchaseInvoiceItems',
              'receipts', 'payments', 'expenseCategories', 'expenses',
              'journalEntries', 'journalEntryLines',
            ];
            const isValid = requiredKeys.every(key => key in savedState);
            if (isValid) {
              dispatch({ type: 'LOAD_STATE', payload: savedState });
              console.log('Loaded accounting state from Supabase successfully');
            } else {
              console.log('Saved state invalid, using defaults');
              await saveStateToSupabase(orgId!, initialState);
            }
          } else {
            console.log('No saved state found, saving defaults to Supabase');
            await saveStateToSupabase(orgId!, initialState);
          }
          isInitialLoadDone.current = true;
          setIsLoading(false);
        }
      } catch (err) {
        console.log(`Error during initial state load: ${err}`);
        if (!cancelled) {
          isInitialLoadDone.current = true;
          setIsLoading(false);
        }
      }
    }
    isInitialLoadDone.current = false;
    setIsLoading(true);
    load();
    return () => { cancelled = true; };
  }, [orgId]);

  // Auto-save state to Supabase after changes (debounced 1.5s, org-scoped)
  useEffect(() => {
    if (!isInitialLoadDone.current || !orgIdRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      const currentOrgId = orgIdRef.current;
      if (!currentOrgId) return;
      setIsSaving(true);
      const success = await saveStateToSupabase(currentOrgId, stateRef.current);
      setIsSaving(false);
      if (success) {
        setLastSaved(new Date());
      } else {
        toast.error('فشل حفظ البيانات - يرجى المحاولة مرة أخرى');
      }
    }, 1500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [state]);

  const getAccountById = (id: string) => state.accounts.find(a => a.id === id);
  const getContactById = (id: string) => state.contacts.find(c => c.id === id);
  const getItemById = (id: string) => state.items.find(i => i.id === id);

  const getAccountBalance = (accountId: string) => {
    const account = state.accounts.find(a => a.id === accountId);
    const lines = state.journalEntryLines.filter(l => l.account_id === accountId);
    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
    const openingBalance = account?.opening_balance || 0;
    const isDebitNature = account?.balance_type === 'debit';
    const balance = isDebitNature ? openingBalance + totalDebit - totalCredit : openingBalance + totalCredit - totalDebit;
    return { debit: totalDebit, credit: totalCredit, balance };
  };

  const getAccountLedger = (accountId: string) => {
    return state.journalEntryLines
      .filter(l => l.account_id === accountId)
      .sort((a, b) => {
        const entryA = state.journalEntries.find(e => e.id === a.journal_entry_id);
        const entryB = state.journalEntries.find(e => e.id === b.journal_entry_id);
        return (entryA?.entry_date || '').localeCompare(entryB?.entry_date || '');
      });
  };

  const getTrialBalance = () => {
    const leafAccounts = state.accounts.filter(a => !a.is_parent && a.is_active);
    return leafAccounts.map(account => {
      const lines = state.journalEntryLines.filter(l => l.account_id === account.id);
      const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
      return {
        account_code: account.account_code,
        account_name: account.account_name,
        account_id: account.id,
        total_debit: totalDebit,
        total_credit: totalCredit,
        balance: totalDebit - totalCredit,
        opening_balance: account.opening_balance,
      };
    }).filter(row => row.total_debit > 0 || row.total_credit > 0 || row.opening_balance > 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  };

  const nextInvoiceNumber = (type: 'sales' | 'purchase') => {
    const list = type === 'sales' ? state.salesInvoices : state.purchaseInvoices;
    const prefix = type === 'sales' ? 'SI' : 'PI';
    return `${prefix}-${String(list.length + 1).padStart(5, '0')}`;
  };

  const nextReceiptNumber = () => `RV-${String(state.receipts.length + 1).padStart(5, '0')}`;
  const nextPaymentNumber = () => `PV-${String(state.payments.length + 1).padStart(5, '0')}`;
  const nextExpenseNumber = () => `EX-${String(state.expenses.length + 1).padStart(5, '0')}`;

  const getBalanceSheet = () => {
    const calcBalance = (acc: Account) => {
      const lines = state.journalEntryLines.filter(l => l.account_id === acc.id);
      const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
      const isDebitNature = acc.balance_type === 'debit';
      return isDebitNature ? acc.opening_balance + totalDebit - totalCredit : acc.opening_balance + totalCredit - totalDebit;
    };
    const leafAccounts = state.accounts.filter(a => !a.is_parent && a.is_active);
    const assets = leafAccounts.filter(a => a.account_type === 'assets').map(a => ({ id: a.id, code: a.account_code, name: a.account_name, balance: calcBalance(a) })).filter(a => Math.abs(a.balance) > 0.01);
    const liabilities = leafAccounts.filter(a => a.account_type === 'liabilities').map(a => ({ id: a.id, code: a.account_code, name: a.account_name, balance: calcBalance(a) })).filter(a => Math.abs(a.balance) > 0.01);
    const equity = leafAccounts.filter(a => a.account_type === 'equity').map(a => ({ id: a.id, code: a.account_code, name: a.account_name, balance: calcBalance(a) })).filter(a => Math.abs(a.balance) > 0.01);
    // Add current period net income to equity
    const revenueAccs = leafAccounts.filter(a => a.account_type === 'revenue');
    const expenseAccs = leafAccounts.filter(a => a.account_type === 'expense');
    const totalRev = revenueAccs.reduce((s, a) => s + calcBalance(a), 0);
    const totalExp = expenseAccs.reduce((s, a) => s + calcBalance(a), 0);
    const netIncome = totalRev - totalExp;
    if (Math.abs(netIncome) > 0.01) {
      equity.push({ id: 'net-income', code: '', name: 'صافي ربح/خسارة الفترة الحالية', balance: netIncome });
    }
    return {
      assets, liabilities, equity,
      totalAssets: assets.reduce((s, a) => s + a.balance, 0),
      totalLiabilities: liabilities.reduce((s, a) => s + a.balance, 0),
      totalEquity: equity.reduce((s, a) => s + a.balance, 0),
    };
  };

  const getAgingReport = (contactType: 'customer' | 'supplier') => {
    const now = new Date();
    const contacts = state.contacts.filter(c => c.contact_type === contactType || c.contact_type === 'both');
    return contacts.map(c => {
      const invoices = contactType === 'customer'
        ? state.salesInvoices.filter(si => si.contact_id === c.id && si.remaining_amount > 0)
        : state.purchaseInvoices.filter(pi => pi.contact_id === c.id && pi.remaining_amount > 0);
      let current = 0, days_30 = 0, days_60 = 0, days_90 = 0, over_90 = 0;
      invoices.forEach(inv => {
        const invDate = new Date(inv.invoice_date);
        const daysDiff = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = inv.remaining_amount;
        if (daysDiff <= 30) current += remaining;
        else if (daysDiff <= 60) days_30 += remaining;
        else if (daysDiff <= 90) days_60 += remaining;
        else if (daysDiff <= 120) days_90 += remaining;
        else over_90 += remaining;
      });
      const total = current + days_30 + days_60 + days_90 + over_90;
      return { contact_id: c.id, contact_name: c.name, current, days_30, days_60, days_90, over_90, total };
    }).filter(r => r.total > 0);
  };

  const getCashFlowSummary = () => {
    let operating_in = 0, operating_out = 0;
    state.treasuryTransactions.forEach(t => {
      if (t.transaction_type === 'deposit') operating_in += t.amount;
      else operating_out += t.amount;
    });
    state.bankTransactions.forEach(t => {
      if (t.transaction_type === 'deposit') operating_in += t.amount;
      else operating_out += t.amount;
    });
    return { operating_in, operating_out, investing_in: 0, investing_out: 0, financing_in: 0, financing_out: 0, net: operating_in - operating_out };
  };

  return (
    <AccountingContext.Provider value={{
      state, dispatch,
      isLoading, isSaving, lastSaved,
      getAccountById, getContactById, getItemById,
      getAccountBalance, getAccountLedger, getTrialBalance,
      formatCurrency,
      nextInvoiceNumber, nextReceiptNumber, nextPaymentNumber, nextExpenseNumber,
      getBalanceSheet, getAgingReport, getCashFlowSummary,
    }}>
      {children}
    </AccountingContext.Provider>
  );
}

export function useAccounting() {
  const context = useContext(AccountingContext);
  if (!context) throw new Error('useAccounting must be used within AccountingProvider');
  return context;
}