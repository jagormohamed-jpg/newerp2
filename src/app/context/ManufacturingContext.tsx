import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  ManufacturingProduct, ProductStage, ProductStageComponent,
  ManufacturingInvoice, ManufacturingInvoiceItem,
  StageWarehouse, CostHistory,
  ManufacturingSettings, ProductionStage,
  ProductStatus, InvoiceStatus, StageType,
} from '../types/manufacturing';
import { useAccounting } from './AccountingContext';
import type { JournalEntry, JournalEntryLine } from '../types/accounting';
import { materialInventoryMap, productInventoryMap } from '../data/manufacturingIntegrationData';
import { toast } from 'sonner';

const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split('T')[0];

// ============ Mock Departments (linked to payroll) ============
const mockDepartments = [
  { id: 'dep-1', name: 'قسم القص' },
  { id: 'dep-2', name: 'قسم الخياطة' },
  { id: 'dep-3', name: 'قسم التشطيب' },
  { id: 'dep-4', name: 'قسم التغليف' },
  { id: 'dep-5', name: 'قسم الطباعة' },
];

// ============ Mock Workers ============
const mockWorkers = [
  { id: 'w-1', name: 'أحمد محمد سعيد', department_id: 'dep-1', stage_id: 'stg-1', production_type: 'piece_rate' as StageType, photo_url: '' },
  { id: 'w-2', name: 'محمود عبدالله حسن', department_id: 'dep-2', stage_id: 'stg-2', production_type: 'piece_rate' as StageType, photo_url: '' },
  { id: 'w-3', name: 'خالد إبراهيم علي', department_id: 'dep-2', stage_id: 'stg-2', production_type: 'hourly' as StageType, photo_url: '' },
  { id: 'w-4', name: 'عمر حسين فؤاد', department_id: 'dep-3', stage_id: 'stg-3', production_type: 'piece_rate' as StageType, photo_url: '' },
  { id: 'w-5', name: 'ياسر طارق عبدالرحمن', department_id: 'dep-4', stage_id: 'stg-4', production_type: 'weekly' as StageType, photo_url: '' },
  { id: 'w-6', name: 'سامي جمال الدين', department_id: 'dep-1', stage_id: 'stg-1', production_type: 'piece_rate' as StageType, photo_url: '' },
  { id: 'w-7', name: 'حسن مصطفى نور', department_id: 'dep-3', stage_id: 'stg-3', production_type: 'hourly' as StageType, photo_url: '' },
  { id: 'w-8', name: 'فادي رامي شوقي', department_id: 'dep-5', stage_id: 'stg-5', production_type: 'piece_rate' as StageType, photo_url: '' },
];

// ============ Mock Materials (linked to inventory via materialInventoryMap) ============
const mockMaterials = [
  { id: 'mat-1', name: 'قماش قطني أبيض', unit: 'متر', unit_cost: 25, inventory_item_id: 'im-1' },
  { id: 'mat-2', name: 'خيط بوليستر', unit: 'بكرة', unit_cost: 5, inventory_item_id: 'im-2' },
  { id: 'mat-3', name: 'أزرار بلاستيك', unit: 'قطعة', unit_cost: 0.5, inventory_item_id: 'im-3' },
  { id: 'mat-4', name: 'سحاب معدني', unit: 'قطعة', unit_cost: 3, inventory_item_id: 'im-4' },
  { id: 'mat-5', name: 'قماش جينز', unit: 'متر', unit_cost: 45, inventory_item_id: 'im-5' },
  { id: 'mat-6', name: 'قماش حرير', unit: 'متر', unit_cost: 80, inventory_item_id: 'im-6' },
  { id: 'mat-7', name: 'بطانة داخلية', unit: 'متر', unit_cost: 12, inventory_item_id: 'im-7' },
  { id: 'mat-8', name: 'كيس تغليف', unit: 'قطعة', unit_cost: 1.5, inventory_item_id: 'im-8' },
  { id: 'mat-9', name: 'ملصق علامة تجارية', unit: 'قطعة', unit_cost: 2, inventory_item_id: 'im-9' },
  { id: 'mat-10', name: 'حبر طباعة', unit: 'لتر', unit_cost: 120, inventory_item_id: 'im-10' },
];

// ============ Mock Production Stages ============
const mockStages: ProductionStage[] = [
  { id: 'stg-1', name: 'مرحلة القص', department_id: 'dep-1', stage_order: 1, stage_type: 'piece_rate', production_price: 5, department_cost_allocation: 0, description: 'قص الأقمشة حسب الباترون', is_active: true, created_at: '2026-01-01' },
  { id: 'stg-2', name: 'مرحلة الخياطة', department_id: 'dep-2', stage_order: 2, stage_type: 'piece_rate', production_price: 15, department_cost_allocation: 0, description: 'خياطة القطع المقصوصة', is_active: true, created_at: '2026-01-01' },
  { id: 'stg-3', name: 'مرحلة التشطيب', department_id: 'dep-3', stage_order: 3, stage_type: 'hourly', production_price: 0, department_cost_allocation: 8000, description: 'تشطيب وكي المنتجات', is_active: true, created_at: '2026-01-01' },
  { id: 'stg-4', name: 'مرحلة التغليف', department_id: 'dep-4', stage_order: 4, stage_type: 'weekly', production_price: 0, department_cost_allocation: 5000, description: 'تغليف المنتجات النهائية', is_active: true, created_at: '2026-01-01' },
  { id: 'stg-5', name: 'مرحلة الطباعة', department_id: 'dep-5', stage_order: 0, stage_type: 'piece_rate', production_price: 8, department_cost_allocation: 0, description: 'طباعة التصاميم على الأقمشة', is_active: true, created_at: '2026-01-01' },
];

// ============ Mock Products (inventory_item_id linked to ifg-X) ============
const mockProducts: ManufacturingProduct[] = [
  {
    id: 'prod-1', code: 'MFG-001', name: 'قميص قطني رجالي', unit: 'قطعة',
    inventory_item_id: 'ifg-1', status: 'active',
    stages: [
      {
        id: 'ps-1', product_id: 'prod-1', stage_id: 'stg-1', stage_name: 'مرحلة القص',
        department_id: 'dep-1', department_name: 'قسم القص', stage_order: 1,
        stage_type: 'piece_rate', production_price: 5,
        components: [
          { id: 'c-1', product_stage_id: 'ps-1', material_id: 'mat-1', material_name: 'قماش قطني أبيض', quantity_per_unit: 1.5, waste_percentage: 5, unit_cost: 25, is_from_previous_stage: false, previous_stage_id: '' },
        ]
      },
      {
        id: 'ps-2', product_id: 'prod-1', stage_id: 'stg-2', stage_name: 'مرحلة الخياطة',
        department_id: 'dep-2', department_name: 'قسم الخياطة', stage_order: 2,
        stage_type: 'piece_rate', production_price: 15,
        components: [
          { id: 'c-2', product_stage_id: 'ps-2', material_id: 'mat-2', material_name: 'خيط بوليستر', quantity_per_unit: 0.5, waste_percentage: 2, unit_cost: 5, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-3', product_stage_id: 'ps-2', material_id: 'mat-3', material_name: 'أزرار بلاستيك', quantity_per_unit: 8, waste_percentage: 1, unit_cost: 0.5, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-4', product_stage_id: 'ps-2', material_id: '', material_name: 'مخرجات مرحلة القص', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 0, is_from_previous_stage: true, previous_stage_id: 'stg-1' },
        ]
      },
      {
        id: 'ps-3', product_id: 'prod-1', stage_id: 'stg-3', stage_name: 'مرحلة التشطيب',
        department_id: 'dep-3', department_name: 'قسم التشطيب', stage_order: 3,
        stage_type: 'hourly', production_price: 0,
        components: [
          { id: 'c-5', product_stage_id: 'ps-3', material_id: '', material_name: 'مخرجات مرحلة الخياطة', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 0, is_from_previous_stage: true, previous_stage_id: 'stg-2' },
        ]
      },
      {
        id: 'ps-4', product_id: 'prod-1', stage_id: 'stg-4', stage_name: 'مرحلة التغليف',
        department_id: 'dep-4', department_name: 'قسم التغليف', stage_order: 4,
        stage_type: 'weekly', production_price: 0,
        components: [
          { id: 'c-6', product_stage_id: 'ps-4', material_id: 'mat-8', material_name: 'كيس تغليف', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 1.5, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-7', product_stage_id: 'ps-4', material_id: 'mat-9', material_name: 'ملصق علامة تجارية', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 2, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-8', product_stage_id: 'ps-4', material_id: '', material_name: 'مخرجات مرحلة ا��تشطيب', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 0, is_from_previous_stage: true, previous_stage_id: 'stg-3' },
        ]
      },
    ],
    estimated_cost: 85, last_calculated_cost: 82.5, selling_price: 180,
    last_cost_update: '2026-02-15', notes: '', created_at: '2026-01-10',
  },
  {
    id: 'prod-2', code: 'MFG-002', name: 'بنطلون جينز', unit: 'قطعة',
    inventory_item_id: 'ifg-2', status: 'active',
    stages: [
      {
        id: 'ps-5', product_id: 'prod-2', stage_id: 'stg-1', stage_name: 'مرحلة القص',
        department_id: 'dep-1', department_name: 'قسم القص', stage_order: 1,
        stage_type: 'piece_rate', production_price: 7,
        components: [
          { id: 'c-9', product_stage_id: 'ps-5', material_id: 'mat-5', material_name: 'قماش جينز', quantity_per_unit: 2, waste_percentage: 8, unit_cost: 45, is_from_previous_stage: false, previous_stage_id: '' },
        ]
      },
      {
        id: 'ps-6', product_id: 'prod-2', stage_id: 'stg-2', stage_name: 'مرحلة الخياطة',
        department_id: 'dep-2', department_name: 'قسم الخياطة', stage_order: 2,
        stage_type: 'piece_rate', production_price: 20,
        components: [
          { id: 'c-10', product_stage_id: 'ps-6', material_id: 'mat-2', material_name: 'خيط بوليستر', quantity_per_unit: 1, waste_percentage: 2, unit_cost: 5, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-11', product_stage_id: 'ps-6', material_id: 'mat-4', material_name: 'سحاب معدني', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 3, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-12', product_stage_id: 'ps-6', material_id: '', material_name: 'مخرجات مرحلة القص', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 0, is_from_previous_stage: true, previous_stage_id: 'stg-1' },
        ]
      },
      {
        id: 'ps-7', product_id: 'prod-2', stage_id: 'stg-3', stage_name: 'مرحلة التشطيب',
        department_id: 'dep-3', department_name: 'قسم التشطيب', stage_order: 3,
        stage_type: 'hourly', production_price: 0,
        components: [
          { id: 'c-13', product_stage_id: 'ps-7', material_id: '', material_name: 'مخرجات مرحلة الخياطة', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 0, is_from_previous_stage: true, previous_stage_id: 'stg-2' },
        ]
      },
    ],
    estimated_cost: 145, last_calculated_cost: 140, selling_price: 280,
    last_cost_update: '2026-02-14', notes: '', created_at: '2026-01-12',
  },
  {
    id: 'prod-3', code: 'MFG-003', name: 'تيشيرت مطبوع', unit: 'قطعة',
    inventory_item_id: 'ifg-3', status: 'active',
    stages: [
      {
        id: 'ps-8', product_id: 'prod-3', stage_id: 'stg-5', stage_name: 'مرحلة الطباعة',
        department_id: 'dep-5', department_name: 'قسم الطباعة', stage_order: 1,
        stage_type: 'piece_rate', production_price: 8,
        components: [
          { id: 'c-14', product_stage_id: 'ps-8', material_id: 'mat-1', material_name: 'قماش قطني أبيض', quantity_per_unit: 1.2, waste_percentage: 3, unit_cost: 25, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-15', product_stage_id: 'ps-8', material_id: 'mat-10', material_name: 'حبر طباعة', quantity_per_unit: 0.02, waste_percentage: 10, unit_cost: 120, is_from_previous_stage: false, previous_stage_id: '' },
        ]
      },
      {
        id: 'ps-9', product_id: 'prod-3', stage_id: 'stg-2', stage_name: 'مرحلة الخياطة',
        department_id: 'dep-2', department_name: 'قسم الخياطة', stage_order: 2,
        stage_type: 'piece_rate', production_price: 12,
        components: [
          { id: 'c-16', product_stage_id: 'ps-9', material_id: 'mat-2', material_name: 'خيط بوليستر', quantity_per_unit: 0.3, waste_percentage: 2, unit_cost: 5, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-17', product_stage_id: 'ps-9', material_id: '', material_name: 'مخرجات مرحلة الطباعة', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 0, is_from_previous_stage: true, previous_stage_id: 'stg-5' },
        ]
      },
    ],
    estimated_cost: 58, last_calculated_cost: 55, selling_price: 120,
    last_cost_update: '2026-02-10', notes: '', created_at: '2026-01-15',
  },
  {
    id: 'prod-4', code: 'MFG-004', name: 'فستان حرير نسائي', unit: 'قطعة',
    inventory_item_id: 'ifg-4', status: 'draft',
    stages: [
      {
        id: 'ps-10', product_id: 'prod-4', stage_id: 'stg-1', stage_name: 'مرحلة القص',
        department_id: 'dep-1', department_name: 'قسم القص', stage_order: 1,
        stage_type: 'piece_rate', production_price: 10,
        components: [
          { id: 'c-18', product_stage_id: 'ps-10', material_id: 'mat-6', material_name: 'قماش حرير', quantity_per_unit: 3, waste_percentage: 6, unit_cost: 80, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-19', product_stage_id: 'ps-10', material_id: 'mat-7', material_name: 'بطانة داخلية', quantity_per_unit: 2, waste_percentage: 4, unit_cost: 12, is_from_previous_stage: false, previous_stage_id: '' },
        ]
      },
      {
        id: 'ps-11', product_id: 'prod-4', stage_id: 'stg-2', stage_name: 'مرحلة الخياطة',
        department_id: 'dep-2', department_name: 'قسم الخياطة', stage_order: 2,
        stage_type: 'piece_rate', production_price: 35,
        components: [
          { id: 'c-20', product_stage_id: 'ps-11', material_id: 'mat-2', material_name: 'خيط بوليستر', quantity_per_unit: 1, waste_percentage: 2, unit_cost: 5, is_from_previous_stage: false, previous_stage_id: '' },
          { id: 'c-21', product_stage_id: 'ps-11', material_id: 'mat-4', material_name: 'سحب معدني', quantity_per_unit: 1, waste_percentage: 0, unit_cost: 3, is_from_previous_stage: false, previous_stage_id: '' },
        ]
      },
    ],
    estimated_cost: 320, last_calculated_cost: 0, selling_price: 550,
    last_cost_update: '', notes: 'منتج قيد التطوير', created_at: '2026-02-01',
  },
];

// ============ Mock Invoices ============
const mockInvoices: ManufacturingInvoice[] = [
  {
    id: 'inv-1', invoice_number: 'MFG-INV-001', worker_id: 'w-1', worker_name: 'أحمد محمد سعيد',
    department_id: 'dep-1', department_name: 'قسم القص', stage_id: 'stg-1', stage_name: 'مرحلة القص',
    production_type: 'piece_rate', invoice_date: '2026-02-20',
    items: [
      { id: 'ii-1', invoice_id: 'inv-1', product_id: 'prod-1', product_name: 'قميص قطني رجالي', quantity_produced: 50, quantity_defective: 2, net_quantity: 48, unit_production_price: 5, total: 240 },
      { id: 'ii-2', invoice_id: 'inv-1', product_id: 'prod-2', product_name: 'بنطلون جينز', quantity_produced: 30, quantity_defective: 1, net_quantity: 29, unit_production_price: 7, total: 203 },
    ],
    total_amount: 443, total_quantity: 80, total_defective: 3, notes: '', status: 'confirmed', created_at: '2026-02-20',
  },
  {
    id: 'inv-2', invoice_number: 'MFG-INV-002', worker_id: 'w-2', worker_name: 'محمود عبدالله حسن',
    department_id: 'dep-2', department_name: 'قسم الخياطة', stage_id: 'stg-2', stage_name: 'مرحلة الخياطة',
    production_type: 'piece_rate', invoice_date: '2026-02-20',
    items: [
      { id: 'ii-3', invoice_id: 'inv-2', product_id: 'prod-1', product_name: 'قميص قطني رجالي', quantity_produced: 40, quantity_defective: 1, net_quantity: 39, unit_production_price: 15, total: 585 },
    ],
    total_amount: 585, total_quantity: 40, total_defective: 1, notes: '', status: 'confirmed', created_at: '2026-02-20',
  },
  {
    id: 'inv-3', invoice_number: 'MFG-INV-003', worker_id: 'w-4', worker_name: 'عمر حسين فؤاد',
    department_id: 'dep-3', department_name: 'قسم التشطيب', stage_id: 'stg-3', stage_name: 'مرحلة التشطيب',
    production_type: 'piece_rate', invoice_date: '2026-02-19',
    items: [
      { id: 'ii-4', invoice_id: 'inv-3', product_id: 'prod-1', product_name: 'قميص قطني رجالي', quantity_produced: 35, quantity_defective: 0, net_quantity: 35, unit_production_price: 8, total: 280 },
    ],
    total_amount: 280, total_quantity: 35, total_defective: 0, notes: '', status: 'confirmed', created_at: '2026-02-19',
  },
  {
    id: 'inv-4', invoice_number: 'MFG-INV-004', worker_id: 'w-6', worker_name: 'سامي جمال الدين',
    department_id: 'dep-1', department_name: 'قسم القص', stage_id: 'stg-1', stage_name: 'مرحلة القص',
    production_type: 'piece_rate', invoice_date: '2026-02-19',
    items: [
      { id: 'ii-5', invoice_id: 'inv-4', product_id: 'prod-3', product_name: 'تيشيرت مطبوع', quantity_produced: 60, quantity_defective: 3, net_quantity: 57, unit_production_price: 5, total: 285 },
    ],
    total_amount: 285, total_quantity: 60, total_defective: 3, notes: '', status: 'confirmed', created_at: '2026-02-19',
  },
  {
    id: 'inv-5', invoice_number: 'MFG-INV-005', worker_id: 'w-8', worker_name: 'فادي رامي شوقي',
    department_id: 'dep-5', department_name: 'قسم الطباعة', stage_id: 'stg-5', stage_name: 'مرحلة الطباعة',
    production_type: 'piece_rate', invoice_date: '2026-02-18',
    items: [
      { id: 'ii-6', invoice_id: 'inv-5', product_id: 'prod-3', product_name: 'تيشيرت مطبوع', quantity_produced: 45, quantity_defective: 2, net_quantity: 43, unit_production_price: 8, total: 344 },
    ],
    total_amount: 344, total_quantity: 45, total_defective: 2, notes: '', status: 'confirmed', created_at: '2026-02-18',
  },
];

// ============ Mock Stage Warehouses ============
const mockStageWarehouses: StageWarehouse[] = [
  { id: 'sw-1', department_id: 'dep-1', department_name: 'قسم القص', stage_id: 'stg-1', stage_name: 'مرحلة القص', product_id: 'prod-1', product_name: 'قميص قطني رجالي', available_quantity: 48, last_update: '2026-02-20', value: 1800, stock_level: 'healthy' },
  { id: 'sw-2', department_id: 'dep-1', department_name: 'قسم القص', stage_id: 'stg-1', stage_name: 'مرحلة القص', product_id: 'prod-2', product_name: 'بنطلون جينز', available_quantity: 29, last_update: '2026-02-20', value: 2610, stock_level: 'healthy' },
  { id: 'sw-3', department_id: 'dep-2', department_name: 'قسم الخياطة', stage_id: 'stg-2', stage_name: 'مرحلة الخياطة', product_id: 'prod-1', product_name: 'قميص قطني رجالي', available_quantity: 39, last_update: '2026-02-20', value: 2535, stock_level: 'healthy' },
  { id: 'sw-4', department_id: 'dep-3', department_name: 'قسم التشطيب', stage_id: 'stg-3', stage_name: 'مرحلة التشطيب', product_id: 'prod-1', product_name: 'قميص قطني رجالي', available_quantity: 5, last_update: '2026-02-19', value: 412.5, stock_level: 'low' },
  { id: 'sw-5', department_id: 'dep-4', department_name: 'قسم التغليف', stage_id: 'stg-4', stage_name: 'مرحلة التغليف', product_id: 'prod-1', product_name: 'قميص قطني رجالي', available_quantity: 0, last_update: '2026-02-18', value: 0, stock_level: 'empty' },
  { id: 'sw-6', department_id: 'dep-5', department_name: 'قسم الطباعة', stage_id: 'stg-5', stage_name: 'مرحلة الطباعة', product_id: 'prod-3', product_name: 'تيشيرت مطبوع', available_quantity: 43, last_update: '2026-02-18', value: 2365, stock_level: 'healthy' },
  { id: 'sw-7', department_id: 'dep-2', department_name: 'قسم الخياطة', stage_id: 'stg-2', stage_name: 'مرحلة الخياطة', product_id: 'prod-3', product_name: 'تيشيرت مطبوع', available_quantity: 12, last_update: '2026-02-17', value: 660, stock_level: 'low' },
];

// ============ Mock Cost History ============
const mockCostHistory: CostHistory[] = [
  { id: 'ch-1', product_id: 'prod-1', date: '2026-02-15', cost_per_unit: 82.5, updated_by: 'مدير التصنيع', calculation_method: 'latest_prices' },
  { id: 'ch-2', product_id: 'prod-1', date: '2026-02-01', cost_per_unit: 85, updated_by: 'مدير التصنيع', calculation_method: 'latest_prices' },
  { id: 'ch-3', product_id: 'prod-1', date: '2026-01-15', cost_per_unit: 88, updated_by: 'النظام', calculation_method: 'historical_prices' },
  { id: 'ch-4', product_id: 'prod-2', date: '2026-02-14', cost_per_unit: 140, updated_by: 'مدير التصنيع', calculation_method: 'latest_prices' },
  { id: 'ch-5', product_id: 'prod-3', date: '2026-02-10', cost_per_unit: 55, updated_by: 'مدير التصنيع', calculation_method: 'latest_prices' },
];

// ============ Default Settings ============
const defaultSettings: ManufacturingSettings = {
  allow_production_without_previous_stock: false,
  wage_allocation_mode: 'realtime',
  default_waste_percentage: 5,
  allow_negative_inventory: false,
  auto_update_cost_on_invoice: true,
  cost_calculation_method: 'weighted_average',
};

// ============ Context Type ============
interface ManufacturingContextType {
  departments: typeof mockDepartments;
  workers: typeof mockWorkers;
  materials: typeof mockMaterials;
  stages: ProductionStage[];
  products: ManufacturingProduct[];
  invoices: ManufacturingInvoice[];
  stageWarehouses: StageWarehouse[];
  costHistory: CostHistory[];
  settings: ManufacturingSettings;
  // Methods
  addProduct: (product: Omit<ManufacturingProduct, 'id' | 'created_at'>) => void;
  updateProduct: (id: string, updates: Partial<ManufacturingProduct>) => void;
  duplicateProduct: (productId: string, newName: string, newCode: string, options: { copyStages: boolean; copyMaterials: boolean; resetPrices: boolean }) => ManufacturingProduct;
  addInvoice: (invoice: Omit<ManufacturingInvoice, 'id' | 'invoice_number' | 'created_at'>) => void;
  reverseInvoice: (invoiceId: string) => void;
  addStage: (stage: Omit<ProductionStage, 'id' | 'created_at'>) => void;
  updateStage: (id: string, updates: Partial<ProductionStage>) => void;
  updateSettings: (updates: Partial<ManufacturingSettings>) => void;
  recalculateCost: (productId: string, method: 'latest_prices' | 'historical_prices') => void;
  transferToInventory: (stageWarehouseId: string, quantity: number) => void;
  getWorkersByDepartment: (departmentId: string) => typeof mockWorkers;
  getStagesByDepartment: (departmentId: string) => ProductionStage[];
  formatCurrency: (amount: number) => string;
}

const ManufacturingContext = createContext<ManufacturingContextType | null>(null);

// ============ Inner Provider (can use useAccounting) ============
function ManufacturingProviderCore({ children }: { children: ReactNode }) {
  const { dispatch: accountingDispatch, state: accountingState } = useAccounting();

  const [stages, setStages] = useState<ProductionStage[]>(mockStages);
  const [products, setProducts] = useState<ManufacturingProduct[]>(mockProducts);
  const [invoices, setInvoices] = useState<ManufacturingInvoice[]>(mockInvoices);
  const [stageWarehouses, setStageWarehouses] = useState<StageWarehouse[]>(mockStageWarehouses);
  const [costHistory, setCostHistory] = useState<CostHistory[]>(mockCostHistory);
  const [settings, setSettings] = useState<ManufacturingSettings>(defaultSettings);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  };

  // ============ Helper: build JE lines for a manufacturing invoice ============
  const buildManufacturingJE = (
    invoice: ManufacturingInvoice,
    invoiceId: string,
    allProducts: ManufacturingProduct[],
  ) => {
    const entryId = uid();
    const entryNumber = `JE-MFG-${invoice.invoice_number}`;
    let totalMaterialCost = 0;
    const laborCost = invoice.total_amount;

    const stockUpdates: { item_id: string; warehouse_id: string; quantity_delta: number; unit_cost: number }[] = [];

    // Calculate materials consumed for each invoice item
    invoice.items.forEach(item => {
      const product = allProducts.find(p => p.id === item.product_id);
      if (!product) return;
      const productStage = product.stages.find(s => s.stage_id === invoice.stage_id);
      if (!productStage) return;

      productStage.components.filter(c => !c.is_from_previous_stage && c.material_id).forEach(comp => {
        const totalQty = comp.quantity_per_unit * (1 + comp.waste_percentage / 100) * item.net_quantity;
        const cost = totalQty * comp.unit_cost;
        totalMaterialCost += cost;

        const inventoryItemId = materialInventoryMap[comp.material_id];
        if (inventoryItemId) {
          stockUpdates.push({
            item_id: inventoryItemId,
            warehouse_id: 'w-mfg',
            quantity_delta: -totalQty,
            unit_cost: comp.unit_cost,
          });
        }
      });
    });

    const totalCost = totalMaterialCost + laborCost;

    // Build journal entry lines
    const jeLines: JournalEntryLine[] = [];

    // Dr. إنتاج تحت التشغيل (WIP)
    if (totalCost > 0) {
      jeLines.push({
        id: uid(), journal_entry_id: entryId, account_id: 'mfg-wip',
        account_code: '1107-002', account_name: 'إنتاج تحت التشغيل',
        debit: Math.round(totalCost * 100) / 100, credit: 0,
        description: `إنتاج ${invoice.stage_name} - ${invoice.worker_name}`, contact_id: '',
      });
    }
    // Cr. مواد خام للتصنيع
    if (totalMaterialCost > 0) {
      jeLines.push({
        id: uid(), journal_entry_id: entryId, account_id: 'mfg-raw',
        account_code: '1107-001', account_name: 'مواد خام للتصنيع',
        debit: 0, credit: Math.round(totalMaterialCost * 100) / 100,
        description: `استهلاك مواد خام - ${invoice.stage_name}`, contact_id: '',
      });
    }
    // Cr. أجور عمال إنتاج مستحقة
    if (laborCost > 0) {
      jeLines.push({
        id: uid(), journal_entry_id: entryId, account_id: 'mfg-wages',
        account_code: '2103', account_name: 'أجور عمال إنتاج مستحقة',
        debit: 0, credit: Math.round(laborCost * 100) / 100,
        description: `أجر عامل - ${invoice.worker_name} - ${invoice.stage_name}`, contact_id: '',
      });
    }

    const journalEntry: JournalEntry = {
      id: entryId,
      entry_number: entryNumber,
      entry_date: invoice.invoice_date,
      description: `فاتورة إنتاج ${invoice.invoice_number} - ${invoice.worker_name}`,
      source_type: 'manufacturing_invoice',
      source_id: invoiceId,
      total_debit: Math.round(totalCost * 100) / 100,
      total_credit: Math.round(totalCost * 100) / 100,
      is_balanced: true,
      is_posted: true,
      created_at: new Date().toISOString(),
    };

    return { journalEntry, journalEntryLines: jeLines, stockUpdates };
  };

  // ============ addProduct ============
  const addProduct = (product: Omit<ManufacturingProduct, 'id' | 'created_at'>) => {
    const newProduct: ManufacturingProduct = { ...product, id: uid(), created_at: today() };
    setProducts(prev => [...prev, newProduct]);
  };

  // ============ updateProduct ============
  const updateProduct = (id: string, updates: Partial<ManufacturingProduct>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // ============ duplicateProduct ============
  const duplicateProduct = (productId: string, newName: string, newCode: string, options: { copyStages: boolean; copyMaterials: boolean; resetPrices: boolean }) => {
    const original = products.find(p => p.id === productId);
    if (!original) throw new Error('Product not found');
    const newId = uid();
    const newProduct: ManufacturingProduct = {
      ...original, id: newId, code: newCode, name: newName, status: 'draft',
      last_calculated_cost: 0, last_cost_update: '', created_at: today(),
      inventory_item_id: '',
      stages: options.copyStages ? original.stages.map(s => ({
        ...s, id: uid(), product_id: newId,
        production_price: options.resetPrices ? 0 : s.production_price,
        components: options.copyMaterials ? s.components.map(c => ({ ...c, id: uid(), product_stage_id: uid() })) : [],
      })) : [],
    };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  // ============ addInvoice (with accounting integration) ============
  const addInvoice = (invoice: Omit<ManufacturingInvoice, 'id' | 'invoice_number' | 'created_at'>) => {
    const invoiceId = uid();
    const invoiceNumber = `MFG-INV-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: ManufacturingInvoice = {
      ...invoice, id: invoiceId, invoice_number: invoiceNumber, created_at: today(),
    };
    setInvoices(prev => [...prev, newInvoice]);

    if (invoice.status === 'confirmed') {
      // 1. Create journal entry + update raw material stock in accounting
      const { journalEntry, journalEntryLines, stockUpdates } = buildManufacturingJE(
        newInvoice, invoiceId, products,
      );

      if (journalEntryLines.length > 0) {
        accountingDispatch({
          type: 'CREATE_MANUFACTURING_JOURNAL',
          payload: { journalEntry, journalEntryLines, stockUpdates },
        });
      }

      // 2. Update stage warehouses
      invoice.items.forEach(item => {
        setStageWarehouses(prev => {
          const existingIdx = prev.findIndex(
            sw => sw.product_id === item.product_id && sw.stage_id === invoice.stage_id
          );
          if (existingIdx >= 0) {
            const updated = [...prev];
            const sw = updated[existingIdx];
            const newQty = sw.available_quantity + item.net_quantity;
            const product = products.find(p => p.id === item.product_id);
            const cost = product?.last_calculated_cost || product?.estimated_cost || 0;
            updated[existingIdx] = {
              ...sw,
              available_quantity: newQty,
              value: newQty * cost,
              last_update: today(),
              stock_level: newQty === 0 ? 'empty' : newQty < 10 ? 'low' : 'healthy',
            };
            return updated;
          } else {
            const product = products.find(p => p.id === item.product_id);
            const dept = mockDepartments.find(d => d.id === invoice.department_id);
            const stage = stages.find(s => s.id === invoice.stage_id);
            return [...prev, {
              id: uid(),
              department_id: invoice.department_id,
              department_name: dept?.name || '',
              stage_id: invoice.stage_id,
              stage_name: stage?.name || '',
              product_id: item.product_id,
              product_name: item.product_name,
              available_quantity: item.net_quantity,
              last_update: today(),
              value: item.net_quantity * (product?.last_calculated_cost || product?.estimated_cost || 0),
              stock_level: item.net_quantity < 10 ? 'low' : 'healthy',
            }];
          }
        });
      });
    }
  };

  // ============ reverseInvoice ============
  const reverseInvoice = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv || inv.status !== 'confirmed') return;

    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: 'reversed' as InvoiceStatus } : i));

    // Create reversal journal entry
    const entryId = uid();
    const { journalEntry, journalEntryLines, stockUpdates } = buildManufacturingJE(inv, invoiceId, products);

    // Reverse all amounts and stock updates
    const reversalJE: JournalEntry = {
      ...journalEntry,
      id: entryId,
      entry_number: `JE-REV-${inv.invoice_number}`,
      description: `عكس فاتورة إنتاج ${inv.invoice_number}`,
      source_type: 'manufacturing_invoice',
    };
    const reversalLines: JournalEntryLine[] = journalEntryLines.map(l => ({
      ...l,
      id: uid(),
      journal_entry_id: entryId,
      debit: l.credit,
      credit: l.debit,
    }));
    const reversalStock = stockUpdates.map(s => ({ ...s, quantity_delta: -s.quantity_delta }));

    if (reversalLines.length > 0) {
      accountingDispatch({
        type: 'CREATE_MANUFACTURING_JOURNAL',
        payload: { journalEntry: reversalJE, journalEntryLines: reversalLines, stockUpdates: reversalStock },
      });
    }

    // Reverse stage warehouse quantities
    inv.items.forEach(item => {
      setStageWarehouses(prev => prev.map(sw => {
        if (sw.product_id !== item.product_id || sw.stage_id !== inv.stage_id) return sw;
        const newQty = Math.max(0, sw.available_quantity - item.net_quantity);
        return {
          ...sw,
          available_quantity: newQty,
          value: newQty * (sw.available_quantity > 0 ? sw.value / sw.available_quantity : 0),
          last_update: today(),
          stock_level: newQty === 0 ? 'empty' : newQty < 10 ? 'low' : 'healthy',
        };
      }));
    });

    toast.success('تم عكس فاتورة الإنتاج وتسجيل القيد العكسي');
  };

  // ============ transferToInventory ============
  // Moves finished goods from a stage warehouse to the main finished goods inventory
  const transferToInventory = (stageWarehouseId: string, quantity: number) => {
    const sw = stageWarehouses.find(s => s.id === stageWarehouseId);
    if (!sw) { toast.error('لم يتم العثور على مخزن المرحلة'); return; }
    if (quantity <= 0) { toast.error('الكمية يجب أن تكون أكبر من صفر'); return; }
    if (quantity > sw.available_quantity) { toast.error('الكمية أكبر من المتاح في المرحلة'); return; }

    const product = products.find(p => p.id === sw.product_id);
    if (!product) { toast.error('لم يتم العثور على المنتج'); return; }

    const costPerUnit = product.last_calculated_cost || product.estimated_cost;
    const totalCost = Math.round(quantity * costPerUnit * 100) / 100;

    // 1. Update stage warehouse
    setStageWarehouses(prev => prev.map(s => {
      if (s.id !== stageWarehouseId) return s;
      const newQty = s.available_quantity - quantity;
      return {
        ...s,
        available_quantity: newQty,
        value: newQty * costPerUnit,
        last_update: today(),
        stock_level: newQty === 0 ? 'empty' : newQty < 10 ? 'low' : 'healthy',
      };
    }));

    // 2. Build journal entry: Dr. مخزون منتجات تامة / Cr. إنتاج تحت التشغيل
    const entryId = uid();
    const entryNumber = `JE-FG-${uid().slice(0, 6).toUpperCase()}`;
    const jeLines: JournalEntryLine[] = [
      {
        id: uid(), journal_entry_id: entryId,
        account_id: 'mfg-fg', account_code: '1107-003', account_name: 'مخزون منتجات تامة',
        debit: totalCost, credit: 0,
        description: `تحويل منتجات تامة - ${product.name} - ${quantity} ${product.unit}`, contact_id: '',
      },
      {
        id: uid(), journal_entry_id: entryId,
        account_id: 'mfg-wip', account_code: '1107-002', account_name: 'إنتاج تحت التشغيل',
        debit: 0, credit: totalCost,
        description: `تحويل منتجات تامة - ${product.name} - ${quantity} ${product.unit}`, contact_id: '',
      },
    ];

    const journalEntry: JournalEntry = {
      id: entryId, entry_number: entryNumber, entry_date: today(),
      description: `تحويل لخزون تام - ${product.name} - ${quantity} ${product.unit}`,
      source_type: 'finished_goods_transfer',
      source_id: stageWarehouseId,
      total_debit: totalCost, total_credit: totalCost,
      is_balanced: true, is_posted: true,
      created_at: new Date().toISOString(),
    };

    // 3. Update inventory stock (add to finished goods warehouse)
    const inventoryItemId = product.inventory_item_id || productInventoryMap[product.id];
    const stockUpdates = inventoryItemId ? [{
      item_id: inventoryItemId,
      warehouse_id: 'w-fg',
      quantity_delta: quantity,
      unit_cost: costPerUnit,
    }] : [];

    accountingDispatch({
      type: 'CREATE_MANUFACTURING_JOURNAL',
      payload: { journalEntry, journalEntryLines: jeLines, stockUpdates },
    });

    toast.success(`تم تحويل ${quantity} ${product.unit} من "${sw.stage_name}" إلى مخزون المنتجات التامة وتسجيل القيد المحاسبي`);
  };

  // ============ addStage ============
  const addStage = (stage: Omit<ProductionStage, 'id' | 'created_at'>) => {
    setStages(prev => [...prev, { ...stage, id: uid(), created_at: today() }]);
  };

  // ============ updateStage ============
  const updateStage = (id: string, updates: Partial<ProductionStage>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // ============ updateSettings ============
  const updateSettings = (updates: Partial<ManufacturingSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // ============ recalculateCost ============
  const recalculateCost = (productId: string, method: 'latest_prices' | 'historical_prices') => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const materialCost = product.stages.reduce((total, stage) => {
      return total + stage.components
        .filter(c => !c.is_from_previous_stage)
        .reduce((ct, comp) => ct + (comp.quantity_per_unit * (1 + comp.waste_percentage / 100) * comp.unit_cost), 0);
    }, 0);
    const laborCost = product.stages.reduce((total, stage) => {
      if (stage.stage_type === 'piece_rate') return total + stage.production_price;
      return total + 10;
    }, 0);
    const newCost = Math.round((materialCost + laborCost) * 100) / 100;

    setProducts(prev => prev.map(p => p.id === productId ? {
      ...p, last_calculated_cost: newCost, last_cost_update: today(),
    } : p));

    setCostHistory(prev => [...prev, {
      id: uid(), product_id: productId, date: today(),
      cost_per_unit: newCost, updated_by: 'مدير التصنيع', calculation_method: method,
    }]);

    // Update the accounting item price for the finished good
    const inventoryItemId = product.inventory_item_id || productInventoryMap[product.id];
    // (optional: dispatch an update to accounting item purchase_price — omitted for brevity)
  };

  // ============ Helpers ============
  const getWorkersByDepartment = (departmentId: string) => mockWorkers.filter(w => w.department_id === departmentId);
  const getStagesByDepartment = (departmentId: string) => stages.filter(s => s.department_id === departmentId);

  return (
    <ManufacturingContext.Provider value={{
      departments: mockDepartments,
      workers: mockWorkers,
      materials: mockMaterials,
      stages,
      products,
      invoices,
      stageWarehouses,
      costHistory,
      settings,
      addProduct,
      updateProduct,
      duplicateProduct,
      addInvoice,
      reverseInvoice,
      addStage,
      updateStage,
      updateSettings,
      recalculateCost,
      transferToInventory,
      getWorkersByDepartment,
      getStagesByDepartment,
      formatCurrency,
    }}>
      {children}
    </ManufacturingContext.Provider>
  );
}

// ============ Outer Provider ============
export function ManufacturingProvider({ children }: { children: ReactNode }) {
  return <ManufacturingProviderCore>{children}</ManufacturingProviderCore>;
}

export function useManufacturing() {
  const context = useContext(ManufacturingContext);
  if (!context) throw new Error('useManufacturing must be used within ManufacturingProvider');
  return context;
}