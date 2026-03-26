import React, { useState, useMemo } from 'react';
import { Calculator, Check, ChevronDown, ChevronUp, Printer, Download, AlertTriangle, Wallet, Landmark } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import { useAccounting } from '../../context/AccountingContext';
import { toast } from 'sonner';

interface PayrollEmployeeRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  salaryType: string;
  grossSalary: number;
  expenses: number;
  advanceDeduction: number;
  alreadyPaid: number;
  netPayable: number;
  hasIssues: boolean;
  issueDescription?: string;
}

export function PayrollProcessingPage() {
  const {
    employees,
    departments,
    settings,
    calculateEmployeeGrossSalary,
    calculateEmployeeExpenses,
    calculateEmployeeAdvanceDeduction,
    calculateEmployeeNetSalary,
  } = usePayroll();

  const { state: accountingState, dispatch: accountingDispatch } = useAccounting();

  const [periodType, setPeriodType] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSalaryType, setFilterSalaryType] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [calculated, setCalculated] = useState(false);
  const [paymentSource, setPaymentSource] = useState<'treasury' | 'bank'>('treasury');
  const [paymentTreasuryId, setPaymentTreasuryId] = useState(accountingState.treasuries[0]?.id || '');
  const [paymentBankId, setPaymentBankId] = useState(accountingState.banks[0]?.id || '');
  const [isPaid, setIsPaid] = useState(false);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (periodType === 'monthly') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, settings.month_start_day);
      const endDate = new Date(year, month, settings.month_start_day - 1);
      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      };
    } else {
      // Weekly calculation
      const [year, month] = selectedMonth.split('-').map(Number);
      const weekNum = Number(selectedWeek);
      const monthStart = new Date(year, month - 1, 1);
      const weekStart = new Date(monthStart);
      weekStart.setDate(monthStart.getDate() + (weekNum - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
      };
    }
  }, [periodType, selectedMonth, selectedWeek, settings]);

  // Calculate payroll data
  const payrollData = useMemo<PayrollEmployeeRow[]>(() => {
    if (!calculated) return [];

    return employees
      .filter(emp => emp.is_active)
      .filter(emp => !filterDepartment || emp.department_id === filterDepartment)
      .filter(emp => !filterSalaryType || emp.salary_type === filterSalaryType)
      .map(emp => {
        const dept = departments.find(d => d.id === emp.department_id);
        const gross = calculateEmployeeGrossSalary(emp.id, dateRange.start, dateRange.end);
        const expenses = calculateEmployeeExpenses(emp.id, dateRange.start, dateRange.end);
        const advanceDeduction = calculateEmployeeAdvanceDeduction(emp.id, dateRange.start.substring(0, 7));
        const net = calculateEmployeeNetSalary(emp.id, dateRange.start, dateRange.end);
        
        // Check for issues
        let hasIssues = false;
        let issueDescription = '';
        
        if (gross === 0) {
          hasIssues = true;
          issueDescription = 'لا توجد بيانات إنتاج/حضور';
        } else if (net < 0) {
          hasIssues = true;
          issueDescription = 'صافي الراتب سالب';
        }

        return {
          employeeId: emp.id,
          employeeName: emp.full_name,
          employeeCode: emp.employee_code,
          department: dept?.name || '-',
          salaryType: emp.salary_type === 'production' ? 'إنتاج' : 
                      emp.salary_type === 'hourly' ? 'بالساعة' : 'يومية',
          grossSalary: gross,
          expenses,
          advanceDeduction,
          alreadyPaid: 0, // This would come from transactions
          netPayable: net,
          hasIssues,
          issueDescription,
        };
      });
  }, [employees, calculated, filterDepartment, filterSalaryType, dateRange, departments]);

  // Calculate totals
  const totals = useMemo(() => {
    return payrollData.reduce((acc, row) => ({
      gross: acc.gross + row.grossSalary,
      expenses: acc.expenses + row.expenses,
      deductions: acc.deductions + row.advanceDeduction,
      paid: acc.paid + row.alreadyPaid,
      net: acc.net + row.netPayable,
    }), { gross: 0, expenses: 0, deductions: 0, paid: 0, net: 0 });
  }, [payrollData]);

  // Group by department
  const groupedByDepartment = useMemo(() => {
    const groups: Record<string, PayrollEmployeeRow[]> = {};
    payrollData.forEach(row => {
      if (!groups[row.department]) {
        groups[row.department] = [];
      }
      groups[row.department].push(row);
    });
    return groups;
  }, [payrollData]);

  const handleCalculate = () => {
    setCalculated(true);
    setSelectedEmployees(new Set(payrollData.map(r => r.employeeId)));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(new Set(payrollData.map(r => r.employeeId)));
    } else {
      setSelectedEmployees(new Set());
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    const newSet = new Set(selectedEmployees);
    if (checked) {
      newSet.add(employeeId);
    } else {
      newSet.delete(employeeId);
    }
    setSelectedEmployees(newSet);
  };

  const handleApprove = () => {
    if (selectedEmployees.size === 0) {
      alert('يرجى اختيار عامل واحد على الأقل');
      return;
    }
    alert(`تم اعتماد الرواتب لـ ${selectedEmployees.size} عامل`);
  };

  const handleMarkAsPaid = () => {
    if (selectedEmployees.size === 0) {
      toast.error('يرجى اختيار عامل واحد على الأقل');
      return;
    }
    const selectedTotal = payrollData
      .filter(r => selectedEmployees.has(r.employeeId) && r.netPayable > 0)
      .reduce((s, r) => s + r.netPayable, 0);
    if (selectedTotal <= 0) {
      toast.error('لا يوجد مبلغ للصرف');
      return;
    }
    const periodLabel = periodType === 'monthly' ? selectedMonth : `${selectedMonth} - أسبوع ${selectedWeek}`;
    accountingDispatch({
      type: 'CREATE_PAYROLL_JOURNAL',
      payload: {
        total_amount: selectedTotal,
        date: new Date().toISOString().split('T')[0],
        description: `رواتب فترة ${periodLabel} - ${selectedEmployees.size} عامل`,
        treasury_id: paymentTreasuryId,
        bank_id: paymentBankId,
        payment_source: paymentSource,
      },
    });
    setIsPaid(true);
    toast.success(`تم صرف الرواتب بنجاح - ${selectedTotal.toLocaleString()} ج.م لـ ${selectedEmployees.size} عامل وتم إنشاء القيد المحاسبي`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">احتساب المرتبات</h1>
          <p className="text-sm text-muted-foreground">احتساب وصرف المرتبات للفترة</p>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-lg border border-border p-5">
        <h2 className="text-lg text-foreground mb-4">اختيار الفترة</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">نوع الفترة</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as 'monthly' | 'weekly')}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="monthly">شهري</option>
              <option value="weekly">أسبوعي</option>
            </select>
          </div>

          {periodType === 'monthly' ? (
            <div>
              <label className="block text-sm text-muted-foreground mb-2">الشهر</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          ) : [
            <div key="month-select">
              <label className="block text-sm text-muted-foreground mb-2">الشهر</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>,
            <div key="week-select">
              <label className="block text-sm text-muted-foreground mb-2">الأسبوع</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="1">الأسبوع الأول</option>
                <option value="2">الأسبوع الثاني</option>
                <option value="3">الأسبوع الثالث</option>
                <option value="4">الأسبوع الرابع</option>
              </select>
            </div>,
          ]}
          <div className="flex items-end">
            <button
              onClick={handleCalculate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calculator className="w-4 h-4" />
              احتساب المرتبات
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-900">
            <span className="font-medium">الفترة المختارة: </span>
            من {new Date(dateRange.start).toLocaleDateString('ar-EG')} 
            إلى {new Date(dateRange.end).toLocaleDateString('ar-EG')}
          </p>
        </div>
      </div>

      {/* Filters */}
      {calculated && (
        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-lg text-foreground mb-4">فلترة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">القسم</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="">كل الأقسام</option>
                {departments.filter(d => d.is_active).map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">نوع الراتب</label>
              <select
                value={filterSalaryType}
                onChange={(e) => setFilterSalaryType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="">كل الأنواع</option>
                <option value="production">إنتاج</option>
                <option value="hourly">بالساعة</option>
                <option value="daily">يومية</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Preview */}
      {calculated && payrollData.length > 0 && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">إجمالي العمال</p>
              <p className="text-2xl text-foreground font-bold">{payrollData.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الرواتب</p>
              <p className="text-2xl text-green-700 font-bold">{totals.gross.toLocaleString()} ج.م</p>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <p className="text-xs text-muted-foreground mb-1">المصروفات</p>
              <p className="text-2xl text-blue-700 font-bold">{totals.expenses.toLocaleString()} ج.م</p>
            </div>
            <div className="bg-red-50 rounded-lg border border-red-200 p-4">
              <p className="text-xs text-muted-foreground mb-1">الخصومات</p>
              <p className="text-2xl text-red-700 font-bold">{totals.deductions.toLocaleString()} ج.م</p>
            </div>
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
              <p className="text-xs text-muted-foreground mb-1">الصافي</p>
              <p className="text-2xl text-purple-700 font-bold">{totals.net.toLocaleString()} ج.م</p>
            </div>
          </div>

          {/* Issues Alert */}
          {payrollData.some(r => r.hasIssues) && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-yellow-900 font-medium mb-1">تحذير: يوجد مشاكل في بعض الحسابات</p>
                <p className="text-xs text-yellow-700">
                  {payrollData.filter(r => r.hasIssues).length} عامل لديهم مشاكل تحتاج إلى مراجعة
                </p>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="bg-white rounded-lg border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedEmployees.size === payrollData.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground">
                تم اختيار {selectedEmployees.size} من {payrollData.length} عامل
              </span>
            </div>
          </div>

          {/* Payment Source + Actions */}
          {!isPaid && (
            <div className="bg-white rounded-lg border border-border p-5">
              <h2 className="text-lg text-foreground mb-4">مصدر الصرف والقيد المحاسبي</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">مصدر الدفع</label>
                  <select value={paymentSource} onChange={(e) => setPaymentSource(e.target.value as 'treasury' | 'bank')} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                    <option value="treasury">صندوق</option>
                    <option value="bank">بنك</option>
                  </select>
                </div>
                {paymentSource === 'treasury' ? (
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">الصندوق</label>
                    <select value={paymentTreasuryId} onChange={(e) => setPaymentTreasuryId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                      {accountingState.treasuries.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.current_balance.toLocaleString()} ج.م)</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">البنك</label>
                    <select value={paymentBankId} onChange={(e) => setPaymentBankId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                      {accountingState.banks.map(b => (
                        <option key={b.id} value={b.id}>{b.bank_name} ({b.current_balance.toLocaleString()} ج.م)</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-end">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 w-full">
                    <Wallet className="w-4 h-4 inline ml-1" />
                    القيد: مدين رواتب (5002) / دائن {paymentSource === 'treasury' ? 'صندوق' : 'بنك'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleApprove} disabled={selectedEmployees.size === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  <Check className="w-4 h-4" /> اعتماد الرواتب
                </button>
                <button onClick={handleMarkAsPaid} disabled={selectedEmployees.size === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  <Check className="w-4 h-4" /> تسجيل الصرف + إنشاء القيد
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors text-sm">
                  <Printer className="w-4 h-4" /> طباعة
                </button>
              </div>
            </div>
          )}

          {isPaid && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-800 font-medium">تم صرف الرواتب وإنشاء القيد المحاسبي بنجاح</p>
                <p className="text-xs text-green-600">القيد: مدين 5002 رواتب وأجور / دائن {paymentSource === 'treasury' ? 'صندوق' : 'بنك'} - المبلغ: {totals.net.toLocaleString()} ج.م</p>
              </div>
            </div>
          )}

          {/* Payroll Table by Department */}
          <div className="bg-white rounded-lg border border-border">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg text-foreground">تفاصيل المرتبات</h2>
            </div>
            
            <div className="divide-y divide-border">
              {Object.entries(groupedByDepartment).map(([deptName, rows]) => {
                const deptTotals = rows.reduce((acc, row) => ({
                  gross: acc.gross + row.grossSalary,
                  net: acc.net + row.netPayable,
                }), { gross: 0, net: 0 });

                return (
                  <div key={deptName} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md text-foreground font-medium">{deptName}</h3>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {rows.length} عامل
                        </span>
                        <span className="text-green-700 font-medium">
                          إجمالي: {deptTotals.net.toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-center text-xs text-muted-foreground w-10">
                              <input
                                type="checkbox"
                                checked={rows.every(r => selectedEmployees.has(r.employeeId))}
                                onChange={(e) => {
                                  rows.forEach(r => handleSelectEmployee(r.employeeId, e.target.checked));
                                }}
                                className="w-4 h-4"
                              />
                            </th>
                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">الكود</th>
                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">الاسم</th>
                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">النوع</th>
                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">الراتب</th>
                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">المصروفات</th>
                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">الخصومات</th>
                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">الصافي</th>
                            <th className="px-3 py-2 text-center text-xs text-muted-foreground w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {rows.flatMap(row => {
                            const payrollRows: React.ReactElement[] = [
                              <tr key={`${row.employeeId}-row`} className={`hover:bg-muted/30 ${row.hasIssues ? 'bg-yellow-50' : ''}`}>
                                <td className="px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedEmployees.has(row.employeeId)}
                                    onChange={(e) => handleSelectEmployee(row.employeeId, e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-muted-foreground">{row.employeeCode}</td>
                                <td className="px-3 py-2 text-sm text-foreground font-medium">
                                  {row.employeeName}
                                  {row.hasIssues && (
                                    <AlertTriangle className="w-3 h-3 text-yellow-600 inline mr-2" />
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                                    row.salaryType === 'إنتاج' ? 'bg-orange-50 text-orange-700' :
                                    row.salaryType === 'بالساعة' ? 'bg-blue-50 text-blue-700' :
                                    'bg-green-50 text-green-700'
                                  }`}>
                                    {row.salaryType}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm text-green-700 font-medium">
                                  {row.grossSalary.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-sm text-blue-700">
                                  {row.expenses > 0 ? `+${row.expenses.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-red-700">
                                  {row.advanceDeduction > 0 ? `-${row.advanceDeduction.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-purple-700 font-bold">
                                  {row.netPayable.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => setExpandedRow(expandedRow === row.employeeId ? null : row.employeeId)}
                                    className="p-1 hover:bg-muted rounded"
                                  >
                                    {expandedRow === row.employeeId ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                              ,
                            ];
                            if (expandedRow === row.employeeId) {
                              payrollRows.push(
                                <tr key={`${row.employeeId}-detail`}>
                                  <td colSpan={9} className="px-3 py-3 bg-muted/20">
                                    <div className="grid grid-cols-4 gap-3 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">الراتب الإجمالي:</span>
                                        <p className="text-foreground font-medium">{row.grossSalary.toLocaleString()} ج.م</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">المصروفات:</span>
                                        <p className="text-foreground font-medium">{row.expenses.toLocaleString()} ج.م</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">خصم السلفة:</span>
                                        <p className="text-foreground font-medium">{row.advanceDeduction.toLocaleString()} ج.م</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">الصافي:</span>
                                        <p className="text-purple-700 font-bold">{row.netPayable.toLocaleString()} ج.م</p>
                                      </div>
                                      {row.hasIssues && (
                                        <div className="col-span-4 p-2 bg-yellow-100 rounded text-yellow-900">
                                          <AlertTriangle className="w-4 h-4 inline ml-2" />
                                          {row.issueDescription}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            return payrollRows;
                          })}
                        </tbody>
                        <tfoot className="bg-muted/50">
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-sm text-foreground font-medium text-right">
                              إجمالي القسم:
                            </td>
                            <td className="px-3 py-2 text-sm text-green-700 font-bold">
                              {deptTotals.gross.toLocaleString()}
                            </td>
                            <td colSpan={2}></td>
                            <td className="px-3 py-2 text-sm text-purple-700 font-bold">
                              {deptTotals.net.toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grand Total */}
            <div className="p-5 border-t-2 border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-lg text-foreground font-bold">الإجمالي الكلي:</span>
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">الرواتب</p>
                    <p className="text-lg text-green-700 font-bold">{totals.gross.toLocaleString()} ج.م</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">المصروفات</p>
                    <p className="text-lg text-blue-700 font-bold">{totals.expenses.toLocaleString()} ج.م</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">الخصومات</p>
                    <p className="text-lg text-red-700 font-bold">{totals.deductions.toLocaleString()} ج.م</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">الصافي</p>
                    <p className="text-2xl text-purple-700 font-bold">{totals.net.toLocaleString()} ج.م</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {calculated && payrollData.length === 0 && (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <Calculator className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">لا يوجد عمال نشطون للفترة المحددة</p>
        </div>
      )}

      {/* Instructions */}
      {!calculated && (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <Calculator className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg text-foreground mb-2">ابدأ باحتساب المرتبات</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            اختر الفترة المطلوبة (شهري أو أسبوعي) ثم اضغط على زر "احتساب المرتبات" لعرض التفاصيل
          </p>
          <div className="flex flex-col gap-2 max-w-md mx-auto text-right">
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0">1</div>
              <div>
                <p className="text-sm text-blue-900 font-medium">اختيار الفترة</p>
                <p className="text-xs text-blue-700">حدد نوع الفترة (شهري/أسبوعي) والتاريخ</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0">2</div>
              <div>
                <p className="text-sm text-blue-900 font-medium">المعاينة والمراجعة</p>
                <p className="text-xs text-blue-700">راجع حسابات كل عامل وتأكد من صحتها</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0">3</div>
              <div>
                <p className="text-sm text-blue-900 font-medium">الاعتماد والصرف</p>
                <p className="text-xs text-blue-700">اعتمد الرواتب وسجل عملية الصرف</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}