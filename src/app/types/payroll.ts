// ============ Workers & Payroll Types ============

// ============ Department ============
export interface Department {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

// ============ Employee ============
export type SalaryType = 'production' | 'hourly' | 'daily';

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  phone: string;
  address: string;
  id_number: string;
  photo_url: string;
  department_id: string;
  hire_date: string;
  salary_type: SalaryType;
  // For production workers
  price_per_piece: number;
  // For hourly workers
  hourly_rate: number;
  overtime_rate: number;
  // For daily workers
  daily_wage: number;
  notes: string;
  is_active: boolean;
  created_at: string;
}

// ============ Production Invoice ============
export interface ProductionInvoiceItem {
  id: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ProductionInvoice {
  id: string;
  invoice_number: string;
  employee_id: string;
  invoice_date: string;
  items: ProductionInvoiceItem[];
  total_amount: number;
  notes: string;
  created_at: string;
}

// ============ Work Hours ============
export type HourType = 'regular' | 'overtime';

export interface WorkHours {
  id: string;
  employee_id: string;
  work_date: string;
  clock_in: string; // HH:mm format
  clock_out: string; // HH:mm format
  total_hours: number;
  hour_type: HourType;
  rate: number;
  amount: number;
  notes: string;
  created_at: string;
}

// ============ Daily Attendance ============
export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'holiday';

export interface DailyAttendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string;
  created_at: string;
}

export interface AttendanceSummary {
  employee_id: string;
  period: string; // YYYY-MM or YYYY-WW
  total_days: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  holiday_days: number;
  calculated_salary: number;
}

// ============ Financial Transactions ============
export type TransactionType = 'payment' | 'expense' | 'advance' | 'advance_repayment';
export type PaymentMethod = 'cash' | 'bank_transfer';
export type ExpenseCategory = 'transport' | 'food' | 'tools' | 'other';
export type ExpenseBearer = 'company' | 'employee';

export interface EmployeeTransaction {
  id: string;
  employee_id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  amount: number;
  payment_method: PaymentMethod;
  // For expenses
  expense_category: ExpenseCategory;
  expense_bearer: ExpenseBearer;
  // For advances
  advance_id: string;
  monthly_installment: number;
  number_of_installments: number;
  start_deduction_period: string; // YYYY-MM
  auto_deduct: boolean;
  description: string;
  notes: string;
  created_at: string;
}

// ============ Advance ============
export interface Advance {
  id: string;
  employee_id: string;
  advance_date: string;
  total_amount: number;
  monthly_installment: number;
  number_of_installments: number;
  paid_installments: number;
  remaining_amount: number;
  start_deduction_period: string;
  auto_deduct: boolean;
  status: 'active' | 'paid' | 'cancelled';
  notes: string;
  created_at: string;
}

export interface AdvancePayment {
  id: string;
  advance_id: string;
  payment_date: string;
  amount: number;
  source: 'salary_deduction' | 'cash_payment';
  notes: string;
  created_at: string;
}

// ============ Payroll ============
export type PayPeriodType = 'weekly' | 'monthly';
export type PayrollStatus = 'pending' | 'approved' | 'paid' | 'partial';

export interface PayrollPeriod {
  id: string;
  period_type: PayPeriodType;
  period_identifier: string; // YYYY-MM for monthly, YYYY-WW for weekly
  start_date: string;
  end_date: string;
  status: PayrollStatus;
  total_gross: number;
  total_expenses: number;
  total_deductions: number;
  total_net: number;
  created_at: string;
  approved_at: string;
  paid_at: string;
}

export interface EmployeePayroll {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  gross_salary: number;
  expenses_amount: number;
  advance_deduction: number;
  already_paid: number;
  net_payable: number;
  status: PayrollStatus;
  notes: string;
  created_at: string;
}

// ============ Settings ============
export interface PayrollSettings {
  pay_period_type: PayPeriodType;
  week_start_day: number; // 0-6 (0=Sunday)
  month_start_day: number; // 1-28
  working_days_per_week: number;
  working_days_per_month: number;
  currency_symbol: string;
  weekly_off_days: number[]; // Array of day numbers 0-6
  weekly_off_paid: boolean;
  overtime_multiplier: number;
  max_overtime_hours_per_week: number;
  max_overtime_hours_per_month: number;
  require_overtime_approval: boolean;
  max_advance_amount: number;
  max_advance_salary_multiple: number;
  auto_deduct_advances: boolean;
  default_installment_percentage: number;
  minimum_remaining_salary_percentage: number;
}

export interface Holiday {
  id: string;
  holiday_date: string;
  name: string;
  is_paid: boolean;
  created_at: string;
}

// ============ Reports ============
export interface PeriodPayrollReport {
  period: string;
  department_id: string | null;
  salary_type: SalaryType | null;
  employees: {
    employee_id: string;
    employee_name: string;
    department: string;
    salary_type: SalaryType;
    gross: number;
    expenses: number;
    deductions: number;
    net: number;
  }[];
  totals: {
    gross: number;
    expenses: number;
    deductions: number;
    net: number;
  };
}

export interface AdvanceReport {
  advances: {
    advance_id: string;
    employee_id: string;
    employee_name: string;
    department: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    monthly_installment: number;
    status: string;
  }[];
  totals: {
    total_advances: number;
    total_paid: number;
    total_remaining: number;
  };
}

export interface AttendanceReport {
  period: string;
  employees: {
    employee_id: string;
    employee_name: string;
    department: string;
    present_days: number;
    absent_days: number;
    leave_days: number;
    total_days: number;
    attendance_percentage: number;
  }[];
}

export interface ProductionReport {
  period: string;
  employees: {
    employee_id: string;
    employee_name: string;
    department: string;
    total_quantity: number;
    total_amount: number;
    average_price: number;
  }[];
  totals: {
    total_quantity: number;
    total_amount: number;
  };
}

export interface WorkHoursReport {
  period: string;
  employees: {
    employee_id: string;
    employee_name: string;
    department: string;
    regular_hours: number;
    overtime_hours: number;
    total_hours: number;
    regular_amount: number;
    overtime_amount: number;
    total_amount: number;
  }[];
  totals: {
    regular_hours: number;
    overtime_hours: number;
    total_hours: number;
    regular_amount: number;
    overtime_amount: number;
    total_amount: number;
  };
}

export interface ExpenseReport {
  period: string;
  category: ExpenseCategory | null;
  department_id: string | null;
  expenses: {
    transaction_id: string;
    date: string;
    employee_id: string;
    employee_name: string;
    department: string;
    category: ExpenseCategory;
    amount: number;
    bearer: ExpenseBearer;
  }[];
  totals: {
    company_expenses: number;
    employee_expenses: number;
    total_expenses: number;
  };
}

export interface DepartmentCostReport {
  period: string;
  departments: {
    department_id: string;
    department_name: string;
    production_workers: number;
    production_cost: number;
    hourly_workers: number;
    hourly_cost: number;
    daily_workers: number;
    daily_cost: number;
    total_workers: number;
    total_cost: number;
  }[];
  totals: {
    production_cost: number;
    hourly_cost: number;
    daily_cost: number;
    total_cost: number;
  };
}
