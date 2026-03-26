// ============ Manufacturing Module Types ============

// ============ Production Stage ============
export type StageType = 'piece_rate' | 'hourly' | 'weekly';

export interface ProductionStage {
  id: string;
  name: string;
  department_id: string;
  stage_order: number;
  stage_type: StageType;
  production_price: number; // price per piece for piece-rate
  department_cost_allocation: number; // for hourly/weekly
  description: string;
  is_active: boolean;
  created_at: string;
}

// ============ Stage Component (Material) ============
export interface StageComponent {
  id: string;
  stage_id: string;
  product_id: string;
  material_id: string; // from inventory
  material_name: string;
  quantity_per_unit: number;
  waste_percentage: number;
  is_from_previous_stage: boolean;
  previous_stage_id: string;
  created_at: string;
}

// ============ Manufacturing Product ============
export type ProductStatus = 'active' | 'draft' | 'discontinued';

export interface ManufacturingProduct {
  id: string;
  code: string;
  name: string;
  unit: string;
  inventory_item_id: string;
  status: ProductStatus;
  stages: ProductStage[];
  estimated_cost: number;
  last_calculated_cost: number;
  selling_price: number;
  last_cost_update: string;
  notes: string;
  created_at: string;
}

export interface ProductStage {
  id: string;
  product_id: string;
  stage_id: string;
  stage_name: string;
  department_id: string;
  department_name: string;
  stage_order: number;
  stage_type: StageType;
  production_price: number;
  components: ProductStageComponent[];
}

export interface ProductStageComponent {
  id: string;
  product_stage_id: string;
  material_id: string;
  material_name: string;
  quantity_per_unit: number;
  waste_percentage: number;
  unit_cost: number;
  is_from_previous_stage: boolean;
  previous_stage_id: string;
}

// ============ Manufacturing Invoice ============
export type InvoiceStatus = 'draft' | 'confirmed' | 'reversed';

export interface ManufacturingInvoice {
  id: string;
  invoice_number: string;
  worker_id: string;
  worker_name: string;
  department_id: string;
  department_name: string;
  stage_id: string;
  stage_name: string;
  production_type: StageType;
  invoice_date: string;
  items: ManufacturingInvoiceItem[];
  total_amount: number;
  total_quantity: number;
  total_defective: number;
  notes: string;
  status: InvoiceStatus;
  created_at: string;
}

export interface ManufacturingInvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name: string;
  quantity_produced: number;
  quantity_defective: number;
  net_quantity: number;
  unit_production_price: number;
  total: number;
}

// ============ Stage Warehouse ============
export type StockLevel = 'healthy' | 'low' | 'empty';

export interface StageWarehouse {
  id: string;
  department_id: string;
  department_name: string;
  stage_id: string;
  stage_name: string;
  product_id: string;
  product_name: string;
  available_quantity: number;
  last_update: string;
  value: number;
  stock_level: StockLevel;
}

// ============ Costing ============
export interface ProductCost {
  id: string;
  product_id: string;
  product_name: string;
  period: string;
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number;
  cost_per_unit: number;
  selling_price: number;
  margin: number;
  margin_percentage: number;
  calculated_at: string;
  calculated_by: string;
}

export interface MaterialCostDetail {
  material_id: string;
  material_name: string;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
}

export interface LaborCostDetail {
  stage_id: string;
  stage_name: string;
  stage_type: StageType;
  // For piece-rate
  quantity: number;
  price_per_piece: number;
  piece_rate_cost: number;
  // For hourly/weekly allocation
  department_payroll: number;
  total_department_units: number;
  allocation_rate: number;
  product_units: number;
  allocated_cost: number;
  total_labor_cost: number;
}

export interface CostHistory {
  id: string;
  product_id: string;
  date: string;
  cost_per_unit: number;
  updated_by: string;
  calculation_method: 'latest_prices' | 'historical_prices';
}

// ============ Reports ============
export interface ProductionByWorkerReport {
  worker_id: string;
  worker_name: string;
  department: string;
  total_quantity: number;
  total_defective: number;
  net_quantity: number;
  total_earnings: number;
}

export interface ProductionByDepartmentReport {
  department_id: string;
  department_name: string;
  total_workers: number;
  total_quantity: number;
  total_cost: number;
  efficiency: number;
}

export interface CostVarianceReport {
  product_id: string;
  product_name: string;
  estimated_cost: number;
  actual_cost: number;
  variance: number;
  variance_percentage: number;
}

export interface StageBottleneckReport {
  stage_id: string;
  stage_name: string;
  department_name: string;
  avg_daily_output: number;
  pending_quantity: number;
  bottleneck_score: number;
}

export interface MaterialConsumptionReport {
  material_id: string;
  material_name: string;
  total_consumed: number;
  total_waste: number;
  waste_percentage: number;
  total_cost: number;
}

// ============ Settings ============
export interface ManufacturingSettings {
  allow_production_without_previous_stock: boolean;
  wage_allocation_mode: 'realtime' | 'end_of_period';
  default_waste_percentage: number;
  allow_negative_inventory: boolean;
  auto_update_cost_on_invoice: boolean;
  cost_calculation_method: 'weighted_average' | 'fifo' | 'lifo';
}
