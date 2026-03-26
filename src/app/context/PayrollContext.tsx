import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Department,
  Employee,
  ProductionInvoice,
  WorkHours,
  DailyAttendance,
  EmployeeTransaction,
  Advance,
  AdvancePayment,
  PayrollSettings,
  Holiday,
  SalaryType,
  TransactionType,
  AttendanceStatus,
  PayPeriodType,
} from '../types/payroll';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface PayrollContextType {
  // State
  departments: Department[];
  employees: Employee[];
  productionInvoices: ProductionInvoice[];
  workHours: WorkHours[];
  dailyAttendance: DailyAttendance[];
  transactions: EmployeeTransaction[];
  advances: Advance[];
  advancePayments: AdvancePayment[];
  settings: PayrollSettings;
  holidays: Holiday[];
  
  // Loading & Saving
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  
  // Department Methods
  addDepartment: (department: Omit<Department, 'id' | 'created_at'>) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  
  // Employee Methods
  addEmployee: (employee: Omit<Employee, 'id' | 'employee_code' | 'created_at'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  getEmployeesByDepartment: (departmentId: string) => Employee[];
  getEmployeesBySalaryType: (salaryType: SalaryType) => Employee[];
  
  // Production Invoice Methods
  addProductionInvoice: (invoice: Omit<ProductionInvoice, 'id' | 'invoice_number' | 'created_at'>) => void;
  getProductionInvoicesByEmployee: (employeeId: string, startDate?: string, endDate?: string) => ProductionInvoice[];
  
  // Work Hours Methods
  addWorkHours: (hours: Omit<WorkHours, 'id' | 'created_at'>) => void;
  addBulkWorkHours: (hoursList: Omit<WorkHours, 'id' | 'created_at'>[]) => void;
  getWorkHoursByEmployee: (employeeId: string, startDate?: string, endDate?: string) => WorkHours[];
  
  // Attendance Methods
  addAttendance: (attendance: Omit<DailyAttendance, 'id' | 'created_at'>) => void;
  addBulkAttendance: (attendanceList: Omit<DailyAttendance, 'id' | 'created_at'>[]) => void;
  updateAttendance: (id: string, status: AttendanceStatus) => void;
  getAttendanceByEmployee: (employeeId: string, startDate?: string, endDate?: string) => DailyAttendance[];
  
  // Transaction Methods
  addTransaction: (transaction: Omit<EmployeeTransaction, 'id' | 'created_at'>) => void;
  getTransactionsByEmployee: (employeeId: string, startDate?: string, endDate?: string) => EmployeeTransaction[];
  
  // Advance Methods
  addAdvance: (advance: Omit<Advance, 'id' | 'paid_installments' | 'remaining_amount' | 'status' | 'created_at'>) => void;
  addAdvancePayment: (payment: Omit<AdvancePayment, 'id' | 'created_at'>) => void;
  getAdvancesByEmployee: (employeeId: string) => Advance[];
  getActiveAdvances: () => Advance[];
  
  // Settings Methods
  updateSettings: (updates: Partial<PayrollSettings>) => void;
  
  // Holiday Methods
  addHoliday: (holiday: Omit<Holiday, 'id' | 'created_at'>) => void;
  deleteHoliday: (id: string) => void;
  
  // Calculation Helpers
  calculateEmployeeGrossSalary: (employeeId: string, startDate: string, endDate: string) => number;
  calculateEmployeeExpenses: (employeeId: string, startDate: string, endDate: string) => number;
  calculateEmployeeAdvanceDeduction: (employeeId: string, period: string) => number;
  calculateEmployeeNetSalary: (employeeId: string, startDate: string, endDate: string) => number;
  getEmployeeAdvanceBalance: (employeeId: string) => number;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

// Default settings
const defaultSettings: PayrollSettings = {
  pay_period_type: 'monthly',
  week_start_day: 6, // Saturday
  month_start_day: 1,
  working_days_per_week: 6,
  working_days_per_month: 26,
  currency_symbol: 'ج.م',
  weekly_off_days: [5], // Friday
  weekly_off_paid: false,
  overtime_multiplier: 1.5,
  max_overtime_hours_per_week: 12,
  max_overtime_hours_per_month: 48,
  require_overtime_approval: false,
  max_advance_amount: 10000,
  max_advance_salary_multiple: 3,
  auto_deduct_advances: true,
  default_installment_percentage: 25,
  minimum_remaining_salary_percentage: 30,
};

export function PayrollProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [productionInvoices, setProductionInvoices] = useState<ProductionInvoice[]>([]);
  const [workHours, setWorkHours] = useState<WorkHours[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
  const [transactions, setTransactions] = useState<EmployeeTransaction[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([]);
  const [settings, setSettings] = useState<PayrollSettings>(defaultSettings);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Generate unique IDs
  const generateId = () => `payroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Load data from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data to Supabase whenever state changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        saveData();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [departments, employees, productionInvoices, workHours, dailyAttendance, transactions, advances, advancePayments, settings, holidays]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ef957755/kv/getByPrefix?prefix=payroll_`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        setDepartments(data.find((item: any) => item.key === 'payroll_departments')?.value || []);
        setEmployees(data.find((item: any) => item.key === 'payroll_employees')?.value || []);
        setProductionInvoices(data.find((item: any) => item.key === 'payroll_production_invoices')?.value || []);
        setWorkHours(data.find((item: any) => item.key === 'payroll_work_hours')?.value || []);
        setDailyAttendance(data.find((item: any) => item.key === 'payroll_attendance')?.value || []);
        setTransactions(data.find((item: any) => item.key === 'payroll_transactions')?.value || []);
        setAdvances(data.find((item: any) => item.key === 'payroll_advances')?.value || []);
        setAdvancePayments(data.find((item: any) => item.key === 'payroll_advance_payments')?.value || []);
        setSettings(data.find((item: any) => item.key === 'payroll_settings')?.value || defaultSettings);
        setHolidays(data.find((item: any) => item.key === 'payroll_holidays')?.value || []);
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    try {
      setIsSaving(true);
      
      const dataToSave = [
        { key: 'payroll_departments', value: departments },
        { key: 'payroll_employees', value: employees },
        { key: 'payroll_production_invoices', value: productionInvoices },
        { key: 'payroll_work_hours', value: workHours },
        { key: 'payroll_attendance', value: dailyAttendance },
        { key: 'payroll_transactions', value: transactions },
        { key: 'payroll_advances', value: advances },
        { key: 'payroll_advance_payments', value: advancePayments },
        { key: 'payroll_settings', value: settings },
        { key: 'payroll_holidays', value: holidays },
      ];

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ef957755/kv/mset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ items: dataToSave }),
        }
      );

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving payroll data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Department Methods
  const addDepartment = (department: Omit<Department, 'id' | 'created_at'>) => {
    const newDepartment: Department = {
      ...department,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setDepartments(prev => [...prev, newDepartment]);
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    setDepartments(prev => prev.map(dept => dept.id === id ? { ...dept, ...updates } : dept));
  };

  // Employee Methods
  const addEmployee = (employee: Omit<Employee, 'id' | 'employee_code' | 'created_at'>) => {
    const employeeCode = `EMP${(employees.length + 1).toString().padStart(4, '0')}`;
    const newEmployee: Employee = {
      ...employee,
      id: generateId(),
      employee_code: employeeCode,
      created_at: new Date().toISOString(),
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
  };

  const getEmployeesByDepartment = (departmentId: string) => {
    return employees.filter(emp => emp.department_id === departmentId && emp.is_active);
  };

  const getEmployeesBySalaryType = (salaryType: SalaryType) => {
    return employees.filter(emp => emp.salary_type === salaryType && emp.is_active);
  };

  // Production Invoice Methods
  const addProductionInvoice = (invoice: Omit<ProductionInvoice, 'id' | 'invoice_number' | 'created_at'>) => {
    const invoiceNumber = `PROD${(productionInvoices.length + 1).toString().padStart(5, '0')}`;
    const newInvoice: ProductionInvoice = {
      ...invoice,
      id: generateId(),
      invoice_number: invoiceNumber,
      created_at: new Date().toISOString(),
    };
    setProductionInvoices(prev => [...prev, newInvoice]);
  };

  const getProductionInvoicesByEmployee = (employeeId: string, startDate?: string, endDate?: string) => {
    let filtered = productionInvoices.filter(inv => inv.employee_id === employeeId);
    if (startDate) filtered = filtered.filter(inv => inv.invoice_date >= startDate);
    if (endDate) filtered = filtered.filter(inv => inv.invoice_date <= endDate);
    return filtered.sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
  };

  // Work Hours Methods
  const addWorkHours = (hours: Omit<WorkHours, 'id' | 'created_at'>) => {
    const newHours: WorkHours = {
      ...hours,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setWorkHours(prev => [...prev, newHours]);
  };

  const addBulkWorkHours = (hoursList: Omit<WorkHours, 'id' | 'created_at'>[]) => {
    const newHoursList = hoursList.map(hours => ({
      ...hours,
      id: generateId(),
      created_at: new Date().toISOString(),
    }));
    setWorkHours(prev => [...prev, ...newHoursList]);
  };

  const getWorkHoursByEmployee = (employeeId: string, startDate?: string, endDate?: string) => {
    let filtered = workHours.filter(wh => wh.employee_id === employeeId);
    if (startDate) filtered = filtered.filter(wh => wh.work_date >= startDate);
    if (endDate) filtered = filtered.filter(wh => wh.work_date <= endDate);
    return filtered.sort((a, b) => b.work_date.localeCompare(a.work_date));
  };

  // Attendance Methods
  const addAttendance = (attendance: Omit<DailyAttendance, 'id' | 'created_at'>) => {
    const newAttendance: DailyAttendance = {
      ...attendance,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setDailyAttendance(prev => [...prev, newAttendance]);
  };

  const addBulkAttendance = (attendanceList: Omit<DailyAttendance, 'id' | 'created_at'>[]) => {
    const newAttendanceList = attendanceList.map(att => ({
      ...att,
      id: generateId(),
      created_at: new Date().toISOString(),
    }));
    setDailyAttendance(prev => [...prev, ...newAttendanceList]);
  };

  const updateAttendance = (id: string, status: AttendanceStatus) => {
    setDailyAttendance(prev => prev.map(att => att.id === id ? { ...att, status } : att));
  };

  const getAttendanceByEmployee = (employeeId: string, startDate?: string, endDate?: string) => {
    let filtered = dailyAttendance.filter(att => att.employee_id === employeeId);
    if (startDate) filtered = filtered.filter(att => att.attendance_date >= startDate);
    if (endDate) filtered = filtered.filter(att => att.attendance_date <= endDate);
    return filtered.sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  };

  // Transaction Methods
  const addTransaction = (transaction: Omit<EmployeeTransaction, 'id' | 'created_at'>) => {
    const newTransaction: EmployeeTransaction = {
      ...transaction,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);

    // If it's an advance, create the advance record
    if (transaction.transaction_type === 'advance') {
      const newAdvance: Advance = {
        id: newTransaction.id,
        employee_id: transaction.employee_id,
        advance_date: transaction.transaction_date,
        total_amount: transaction.amount,
        monthly_installment: transaction.monthly_installment,
        number_of_installments: transaction.number_of_installments,
        paid_installments: 0,
        remaining_amount: transaction.amount,
        start_deduction_period: transaction.start_deduction_period,
        auto_deduct: transaction.auto_deduct,
        status: 'active',
        notes: transaction.notes,
        created_at: new Date().toISOString(),
      };
      setAdvances(prev => [...prev, newAdvance]);
    }

    // If it's an advance repayment, update the advance
    if (transaction.transaction_type === 'advance_repayment' && transaction.advance_id) {
      const payment: AdvancePayment = {
        id: generateId(),
        advance_id: transaction.advance_id,
        payment_date: transaction.transaction_date,
        amount: transaction.amount,
        source: transaction.payment_method === 'cash' ? 'cash_payment' : 'salary_deduction',
        notes: transaction.notes,
        created_at: new Date().toISOString(),
      };
      setAdvancePayments(prev => [...prev, payment]);

      // Update advance
      setAdvances(prev => prev.map(adv => {
        if (adv.id === transaction.advance_id) {
          const newRemaining = adv.remaining_amount - transaction.amount;
          const newPaidInstallments = adv.paid_installments + 1;
          return {
            ...adv,
            remaining_amount: newRemaining,
            paid_installments: newPaidInstallments,
            status: newRemaining <= 0 ? 'paid' : 'active',
          };
        }
        return adv;
      }));
    }
  };

  const getTransactionsByEmployee = (employeeId: string, startDate?: string, endDate?: string) => {
    let filtered = transactions.filter(txn => txn.employee_id === employeeId);
    if (startDate) filtered = filtered.filter(txn => txn.transaction_date >= startDate);
    if (endDate) filtered = filtered.filter(txn => txn.transaction_date <= endDate);
    return filtered.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  };

  // Advance Methods
  const addAdvance = (advance: Omit<Advance, 'id' | 'paid_installments' | 'remaining_amount' | 'status' | 'created_at'>) => {
    // This is handled by addTransaction with type 'advance'
    addTransaction({
      employee_id: advance.employee_id,
      transaction_date: advance.advance_date,
      transaction_type: 'advance',
      amount: advance.total_amount,
      payment_method: 'cash',
      expense_category: 'other',
      expense_bearer: 'company',
      advance_id: '',
      monthly_installment: advance.monthly_installment,
      number_of_installments: advance.number_of_installments,
      start_deduction_period: advance.start_deduction_period,
      auto_deduct: advance.auto_deduct,
      description: 'سلفة',
      notes: advance.notes,
    });
  };

  const addAdvancePayment = (payment: Omit<AdvancePayment, 'id' | 'created_at'>) => {
    addTransaction({
      employee_id: advances.find(a => a.id === payment.advance_id)?.employee_id || '',
      transaction_date: payment.payment_date,
      transaction_type: 'advance_repayment',
      amount: payment.amount,
      payment_method: payment.source === 'cash_payment' ? 'cash' : 'cash',
      expense_category: 'other',
      expense_bearer: 'company',
      advance_id: payment.advance_id,
      monthly_installment: 0,
      number_of_installments: 0,
      start_deduction_period: '',
      auto_deduct: false,
      description: 'سداد سلفة',
      notes: payment.notes,
    });
  };

  const getAdvancesByEmployee = (employeeId: string) => {
    return advances.filter(adv => adv.employee_id === employeeId);
  };

  const getActiveAdvances = () => {
    return advances.filter(adv => adv.status === 'active');
  };

  // Settings Methods
  const updateSettings = (updates: Partial<PayrollSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Holiday Methods
  const addHoliday = (holiday: Omit<Holiday, 'id' | 'created_at'>) => {
    const newHoliday: Holiday = {
      ...holiday,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setHolidays(prev => [...prev, newHoliday]);
  };

  const deleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  // Calculation Helpers
  const calculateEmployeeGrossSalary = (employeeId: string, startDate: string, endDate: string): number => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 0;

    switch (employee.salary_type) {
      case 'production': {
        const invoices = getProductionInvoicesByEmployee(employeeId, startDate, endDate);
        return invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      }
      case 'hourly': {
        const hours = getWorkHoursByEmployee(employeeId, startDate, endDate);
        return hours.reduce((sum, h) => sum + h.amount, 0);
      }
      case 'daily': {
        const attendance = getAttendanceByEmployee(employeeId, startDate, endDate);
        const presentDays = attendance.filter(a => a.status === 'present').length;
        return presentDays * employee.daily_wage;
      }
      default:
        return 0;
    }
  };

  const calculateEmployeeExpenses = (employeeId: string, startDate: string, endDate: string): number => {
    const txns = getTransactionsByEmployee(employeeId, startDate, endDate);
    const expenses = txns.filter(t => t.transaction_type === 'expense' && t.expense_bearer === 'employee');
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const calculateEmployeeAdvanceDeduction = (employeeId: string, period: string): number => {
    const empAdvances = getAdvancesByEmployee(employeeId);
    const activeAdvances = empAdvances.filter(a => 
      a.status === 'active' && 
      a.auto_deduct && 
      a.start_deduction_period <= period
    );
    return activeAdvances.reduce((sum, a) => sum + a.monthly_installment, 0);
  };

  const calculateEmployeeNetSalary = (employeeId: string, startDate: string, endDate: string): number => {
    const period = startDate.substring(0, 7); // YYYY-MM
    const gross = calculateEmployeeGrossSalary(employeeId, startDate, endDate);
    const expenses = calculateEmployeeExpenses(employeeId, startDate, endDate);
    const advanceDeduction = calculateEmployeeAdvanceDeduction(employeeId, period);
    const payments = getTransactionsByEmployee(employeeId, startDate, endDate)
      .filter(t => t.transaction_type === 'payment')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return gross + expenses - advanceDeduction - payments;
  };

  const getEmployeeAdvanceBalance = (employeeId: string): number => {
    const empAdvances = getAdvancesByEmployee(employeeId);
    return empAdvances
      .filter(a => a.status === 'active')
      .reduce((sum, a) => sum + a.remaining_amount, 0);
  };

  const value: PayrollContextType = {
    departments,
    employees,
    productionInvoices,
    workHours,
    dailyAttendance,
    transactions,
    advances,
    advancePayments,
    settings,
    holidays,
    isLoading,
    isSaving,
    lastSaved,
    addDepartment,
    updateDepartment,
    addEmployee,
    updateEmployee,
    getEmployeesByDepartment,
    getEmployeesBySalaryType,
    addProductionInvoice,
    getProductionInvoicesByEmployee,
    addWorkHours,
    addBulkWorkHours,
    getWorkHoursByEmployee,
    addAttendance,
    addBulkAttendance,
    updateAttendance,
    getAttendanceByEmployee,
    addTransaction,
    getTransactionsByEmployee,
    addAdvance,
    addAdvancePayment,
    getAdvancesByEmployee,
    getActiveAdvances,
    updateSettings,
    addHoliday,
    deleteHoliday,
    calculateEmployeeGrossSalary,
    calculateEmployeeExpenses,
    calculateEmployeeAdvanceDeduction,
    calculateEmployeeNetSalary,
    getEmployeeAdvanceBalance,
  };

  return <PayrollContext.Provider value={value}>{children}</PayrollContext.Provider>;
}

export function usePayroll() {
  const context = useContext(PayrollContext);
  if (context === undefined) {
    throw new Error('usePayroll must be used within PayrollProvider');
  }
  return context;
}
