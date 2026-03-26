import React, { useState, useMemo } from 'react';
import { BarChart3, FileText, Download, TrendingUp, Users, Clock, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';

type ReportType = 'period_payroll' | 'advances' | 'attendance' | 'production' | 'work_hours' | 'expenses' | 'department_cost';

export function PayrollReportsPage() {
  const {
    employees,
    departments,
    productionInvoices,
    workHours,
    dailyAttendance,
    transactions,
    advances,
    calculateEmployeeGrossSalary,
  } = usePayroll();

  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSalaryType, setFilterSalaryType] = useState('');

  const reports = [
    {
      id: 'period_payroll' as ReportType,
      title: 'كشف مرتبات الفترة',
      description: 'تقرير شامل بمرتبات جميع العمال خلال فترة محددة',
      icon: FileText,
      color: 'blue',
    },
    {
      id: 'advances' as ReportType,
      title: 'كشف السلف',
      description: 'تقرير بجميع السلف النشطة والأرصدة المتبقية',
      icon: DollarSign,
      color: 'red',
    },
    {
      id: 'attendance' as ReportType,
      title: 'كشف الحضور',
      description: 'تقرير حضور عمال اليومية خلال الفترة',
      icon: Calendar,
      color: 'green',
    },
    {
      id: 'production' as ReportType,
      title: 'كشف الإنتاج',
      description: 'ملخص إنتاج عمال الإنتاج والكميات المنتجة',
      icon: TrendingUp,
      color: 'orange',
    },
    {
      id: 'work_hours' as ReportType,
      title: 'كشف ساعات العمل',
      description: 'تقرير ساعات العمل العادية والإضافية',
      icon: Clock,
      color: 'blue',
    },
    {
      id: 'expenses' as ReportType,
      title: 'كشف المصروفات',
      description: 'جميع المصروفات حسب الفئة والقسم',
      icon: DollarSign,
      color: 'purple',
    },
    {
      id: 'department_cost' as ReportType,
      title: 'تقرير تكلفة القسم',
      description: 'إجمالي تكلفة العمالة لكل قسم',
      icon: BarChart3,
      color: 'indigo',
    },
  ];

  // Period Payroll Report Data
  const periodPayrollData = useMemo(() => {
    if (selectedReport !== 'period_payroll' || !startDate || !endDate) return null;

    const filtered = employees
      .filter(e => e.is_active)
      .filter(e => !filterDepartment || e.department_id === filterDepartment)
      .filter(e => !filterSalaryType || e.salary_type === filterSalaryType)
      .map(emp => {
        const dept = departments.find(d => d.id === emp.department_id);
        const gross = calculateEmployeeGrossSalary(emp.id, startDate, endDate);
        const expenseTxns = transactions.filter(t => 
          t.employee_id === emp.id && 
          t.transaction_type === 'expense' &&
          t.transaction_date >= startDate &&
          t.transaction_date <= endDate &&
          t.expense_bearer === 'employee'
        );
        const expenses = expenseTxns.reduce((sum, t) => sum + t.amount, 0);
        
        return {
          employeeId: emp.id,
          employeeName: emp.full_name,
          department: dept?.name || '-',
          salaryType: emp.salary_type,
          gross,
          expenses,
          deductions: 0,
          net: gross + expenses,
        };
      });

    const totals = filtered.reduce((acc, row) => ({
      gross: acc.gross + row.gross,
      expenses: acc.expenses + row.expenses,
      deductions: acc.deductions + row.deductions,
      net: acc.net + row.net,
    }), { gross: 0, expenses: 0, deductions: 0, net: 0 });

    return { employees: filtered, totals };
  }, [selectedReport, startDate, endDate, filterDepartment, filterSalaryType, employees, departments, transactions]);

  // Advances Report Data
  const advancesData = useMemo(() => {
    if (selectedReport !== 'advances') return null;

    const activeAdvances = advances.filter(a => a.status === 'active');
    const data = activeAdvances.map(adv => {
      const emp = employees.find(e => e.id === adv.employee_id);
      const dept = departments.find(d => d.id === emp?.department_id);
      const totalPaid = adv.total_amount - adv.remaining_amount;
      
      return {
        advanceId: adv.id,
        employeeId: adv.employee_id,
        employeeName: emp?.full_name || '-',
        department: dept?.name || '-',
        totalAmount: adv.total_amount,
        paidAmount: totalPaid,
        remainingAmount: adv.remaining_amount,
        monthlyInstallment: adv.monthly_installment,
        status: adv.status,
      };
    });

    const totals = data.reduce((acc, row) => ({
      totalAdvances: acc.totalAdvances + row.totalAmount,
      totalPaid: acc.totalPaid + row.paidAmount,
      totalRemaining: acc.totalRemaining + row.remainingAmount,
    }), { totalAdvances: 0, totalPaid: 0, totalRemaining: 0 });

    return { advances: data, totals };
  }, [selectedReport, advances, employees, departments]);

  // Attendance Report Data
  const attendanceData = useMemo(() => {
    if (selectedReport !== 'attendance' || !startDate || !endDate) return null;

    const dailyWorkers = employees.filter(e => e.salary_type === 'daily' && e.is_active);
    const data = dailyWorkers.map(emp => {
      const dept = departments.find(d => d.id === emp.department_id);
      const empAttendance = dailyAttendance.filter(a => 
        a.employee_id === emp.id &&
        a.attendance_date >= startDate &&
        a.attendance_date <= endDate
      );

      const presentDays = empAttendance.filter(a => a.status === 'present').length;
      const absentDays = empAttendance.filter(a => a.status === 'absent').length;
      const leaveDays = empAttendance.filter(a => a.status === 'leave').length;
      const totalDays = empAttendance.length;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        employeeId: emp.id,
        employeeName: emp.full_name,
        department: dept?.name || '-',
        presentDays,
        absentDays,
        leaveDays,
        totalDays,
        attendancePercentage,
      };
    });

    return { employees: data };
  }, [selectedReport, startDate, endDate, employees, departments, dailyAttendance]);

  // Production Report Data
  const productionData = useMemo(() => {
    if (selectedReport !== 'production' || !startDate || !endDate) return null;

    const productionWorkers = employees.filter(e => e.salary_type === 'production' && e.is_active);
    const data = productionWorkers.map(emp => {
      const dept = departments.find(d => d.id === emp.department_id);
      const empInvoices = productionInvoices.filter(inv => 
        inv.employee_id === emp.id &&
        inv.invoice_date >= startDate &&
        inv.invoice_date <= endDate
      );

      const totalQuantity = empInvoices.reduce((sum, inv) => 
        sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      const totalAmount = empInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

      return {
        employeeId: emp.id,
        employeeName: emp.full_name,
        department: dept?.name || '-',
        totalQuantity,
        totalAmount,
        averagePrice,
      };
    });

    const totals = data.reduce((acc, row) => ({
      totalQuantity: acc.totalQuantity + row.totalQuantity,
      totalAmount: acc.totalAmount + row.totalAmount,
    }), { totalQuantity: 0, totalAmount: 0 });

    return { employees: data, totals };
  }, [selectedReport, startDate, endDate, employees, departments, productionInvoices]);

  // Work Hours Report Data
  const workHoursData = useMemo(() => {
    if (selectedReport !== 'work_hours' || !startDate || !endDate) return null;

    const hourlyWorkers = employees.filter(e => e.salary_type === 'hourly' && e.is_active);
    const data = hourlyWorkers.map(emp => {
      const dept = departments.find(d => d.id === emp.department_id);
      const empHours = workHours.filter(wh => 
        wh.employee_id === emp.id &&
        wh.work_date >= startDate &&
        wh.work_date <= endDate
      );

      const regularHours = empHours.filter(wh => wh.hour_type === 'regular').reduce((sum, wh) => sum + wh.total_hours, 0);
      const overtimeHours = empHours.filter(wh => wh.hour_type === 'overtime').reduce((sum, wh) => sum + wh.total_hours, 0);
      const regularAmount = empHours.filter(wh => wh.hour_type === 'regular').reduce((sum, wh) => sum + wh.amount, 0);
      const overtimeAmount = empHours.filter(wh => wh.hour_type === 'overtime').reduce((sum, wh) => sum + wh.amount, 0);

      return {
        employeeId: emp.id,
        employeeName: emp.full_name,
        department: dept?.name || '-',
        regularHours,
        overtimeHours,
        totalHours: regularHours + overtimeHours,
        regularAmount,
        overtimeAmount,
        totalAmount: regularAmount + overtimeAmount,
      };
    });

    const totals = data.reduce((acc, row) => ({
      regularHours: acc.regularHours + row.regularHours,
      overtimeHours: acc.overtimeHours + row.overtimeHours,
      totalHours: acc.totalHours + row.totalHours,
      regularAmount: acc.regularAmount + row.regularAmount,
      overtimeAmount: acc.overtimeAmount + row.overtimeAmount,
      totalAmount: acc.totalAmount + row.totalAmount,
    }), { regularHours: 0, overtimeHours: 0, totalHours: 0, regularAmount: 0, overtimeAmount: 0, totalAmount: 0 });

    return { employees: data, totals };
  }, [selectedReport, startDate, endDate, employees, departments, workHours]);

  // Department Cost Report Data
  const departmentCostData = useMemo(() => {
    if (selectedReport !== 'department_cost' || !startDate || !endDate) return null;

    const data = departments.filter(d => d.is_active).map(dept => {
      const deptEmployees = employees.filter(e => e.department_id === dept.id && e.is_active);
      
      const productionWorkers = deptEmployees.filter(e => e.salary_type === 'production');
      const productionCost = productionWorkers.reduce((sum, emp) => 
        sum + calculateEmployeeGrossSalary(emp.id, startDate, endDate), 0
      );

      const hourlyWorkers = deptEmployees.filter(e => e.salary_type === 'hourly');
      const hourlyCost = hourlyWorkers.reduce((sum, emp) => 
        sum + calculateEmployeeGrossSalary(emp.id, startDate, endDate), 0
      );

      const dailyWorkers = deptEmployees.filter(e => e.salary_type === 'daily');
      const dailyCost = dailyWorkers.reduce((sum, emp) => 
        sum + calculateEmployeeGrossSalary(emp.id, startDate, endDate), 0
      );

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        productionWorkers: productionWorkers.length,
        productionCost,
        hourlyWorkers: hourlyWorkers.length,
        hourlyCost,
        dailyWorkers: dailyWorkers.length,
        dailyCost,
        totalWorkers: deptEmployees.length,
        totalCost: productionCost + hourlyCost + dailyCost,
      };
    });

    const totals = data.reduce((acc, row) => ({
      productionCost: acc.productionCost + row.productionCost,
      hourlyCost: acc.hourlyCost + row.hourlyCost,
      dailyCost: acc.dailyCost + row.dailyCost,
      totalCost: acc.totalCost + row.totalCost,
    }), { productionCost: 0, hourlyCost: 0, dailyCost: 0, totalCost: 0 });

    return { departments: data, totals };
  }, [selectedReport, startDate, endDate, departments, employees, calculateEmployeeGrossSalary]);

  const getIconColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-50',
      red: 'text-red-600 bg-red-50',
      green: 'text-green-600 bg-green-50',
      orange: 'text-orange-600 bg-orange-50',
      purple: 'text-purple-600 bg-purple-50',
      indigo: 'text-indigo-600 bg-indigo-50',
    };
    return colors[color] || 'text-gray-600 bg-gray-50';
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'period_payroll':
        return periodPayrollData && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الاسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">القسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">النوع</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الراتب</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">المصروفات</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {periodPayrollData.employees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">{emp.employeeName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{emp.department}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        emp.salaryType === 'production' ? 'bg-orange-50 text-orange-700' :
                        emp.salaryType === 'hourly' ? 'bg-blue-50 text-blue-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {emp.salaryType === 'production' ? 'إنتاج' : emp.salaryType === 'hourly' ? 'ساعة' : 'يومية'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-green-700 font-medium">{emp.gross.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm text-blue-700">{emp.expenses.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm text-purple-700 font-bold">{emp.net.toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm text-foreground font-bold text-right">الإجمالي:</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-bold">{periodPayrollData.totals.gross.toLocaleString()} ج.م</td>
                  <td className="px-4 py-3 text-sm text-blue-700 font-bold">{periodPayrollData.totals.expenses.toLocaleString()} ج.م</td>
                  <td className="px-4 py-3 text-sm text-purple-700 font-bold">{periodPayrollData.totals.net.toLocaleString()} ج.م</td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'advances':
        return advancesData && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الاسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">القسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">المبلغ الأصلي</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">المسدد</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">المتبقي</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">القسط الشهري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {advancesData.advances.map(adv => (
                  <tr key={adv.advanceId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">{adv.employeeName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{adv.department}</td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{adv.totalAmount.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm text-green-700">{adv.paidAmount.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm text-red-700 font-bold">{adv.remainingAmount.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{adv.monthlyInstallment.toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm text-foreground font-bold text-right">الإجمالي:</td>
                  <td className="px-4 py-3 text-sm text-foreground font-bold">{advancesData.totals.totalAdvances.toLocaleString()} ج.م</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-bold">{advancesData.totals.totalPaid.toLocaleString()} ج.م</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-bold">{advancesData.totals.totalRemaining.toLocaleString()} ج.م</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'attendance':
        return attendanceData && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الاسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">القسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">أيام الحضور</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">أيام الغياب</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">أيام الإذن</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">إجمالي الأيام</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">نسبة الحضور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendanceData.employees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">{emp.employeeName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{emp.department}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-medium">{emp.presentDays}</td>
                    <td className="px-4 py-3 text-sm text-red-700">{emp.absentDays}</td>
                    <td className="px-4 py-3 text-sm text-blue-700">{emp.leaveDays}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{emp.totalDays}</td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{emp.attendancePercentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'production':
        return productionData && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الاسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">القسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">إجمالي الكمية</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">إجمالي المبلغ</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">متوسط السعر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productionData.employees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">{emp.employeeName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{emp.department}</td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{emp.totalQuantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-bold">{emp.totalAmount.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{emp.averagePrice.toFixed(2)} ج.م</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm text-foreground font-bold text-right">الإجمالي:</td>
                  <td className="px-4 py-3 text-sm text-foreground font-bold">{productionData.totals.totalQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-bold">{productionData.totals.totalAmount.toLocaleString()} ج.م</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'work_hours':
        return workHoursData && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الاسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">القسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">ساعات عادية</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">ساعات إضافية</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الإجمالي</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workHoursData.employees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">{emp.employeeName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{emp.department}</td>
                    <td className="px-4 py-3 text-sm text-blue-700">{emp.regularHours.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-orange-700">{emp.overtimeHours.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{emp.totalHours.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-bold">{emp.totalAmount.toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm text-foreground font-bold text-right">الإجمالي:</td>
                  <td className="px-4 py-3 text-sm text-blue-700 font-bold">{workHoursData.totals.regularHours.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-bold">{workHoursData.totals.overtimeHours.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-foreground font-bold">{workHoursData.totals.totalHours.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-bold">{workHoursData.totals.totalAmount.toLocaleString()} ج.م</td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'department_cost':
        return departmentCostData && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">القسم</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">عمال الإنتاج</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">تكلفة الإنتاج</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">عمال بالساعة</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">تكلفة الساعة</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">عمال اليومية</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">تكلفة اليومية</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departmentCostData.departments.map(dept => (
                  <tr key={dept.departmentId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{dept.departmentName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{dept.productionWorkers}</td>
                    <td className="px-4 py-3 text-sm text-orange-700">{dept.productionCost.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{dept.hourlyWorkers}</td>
                    <td className="px-4 py-3 text-sm text-blue-700">{dept.hourlyCost.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{dept.dailyWorkers}</td>
                    <td className="px-4 py-3 text-sm text-green-700">{dept.dailyCost.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm text-purple-700 font-bold">{dept.totalCost.toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td className="px-4 py-3 text-sm text-foreground font-bold text-right">الإجمالي:</td>
                  <td></td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-bold">{departmentCostData.totals.productionCost.toLocaleString()} ج.م</td>
                  <td></td>
                  <td className="px-4 py-3 text-sm text-blue-700 font-bold">{departmentCostData.totals.hourlyCost.toLocaleString()} ج.م</td>
                  <td></td>
                  <td className="px-4 py-3 text-sm text-green-700 font-bold">{departmentCostData.totals.dailyCost.toLocaleString()} ج.م</td>
                  <td className="px-4 py-3 text-sm text-purple-700 font-bold">{departmentCostData.totals.totalCost.toLocaleString()} ج.م</td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">التقارير</h1>
          <p className="text-sm text-muted-foreground">تقارير شاملة للرواتب والعمال</p>
        </div>
      </div>

      {!selectedReport ? (
        /* Report Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className="p-6 bg-white rounded-lg border-2 border-border hover:border-blue-500 transition-all text-right group"
              >
                <div className={`w-12 h-12 rounded-lg ${getIconColor(report.color)} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg text-foreground font-medium mb-2">{report.title}</h3>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </button>
            );
          })}
        </div>
      ) : (
        /* Report View */
        <>
          <div className="bg-white rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors text-sm"
                >
                  ← العودة
                </button>
                <h2 className="text-lg text-foreground font-medium">
                  {reports.find(r => r.id === selectedReport)?.title}
                </h2>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <Download className="w-4 h-4" />
                  تصدير Excel
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['period_payroll', 'attendance', 'production', 'work_hours', 'department_cost'].includes(selectedReport) && (
                <>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">من تاريخ</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">إلى تاريخ</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    />
                  </div>
                </>
              )}
              {selectedReport === 'period_payroll' && (
                <>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">��لقسم</label>
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
                </>
              )}
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-lg border border-border">
            {renderReportContent() || (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">يرجى تحديد الفترة لعرض التقرير</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}