import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { 
  Users, Building2, DollarSign, AlertCircle, Plus, 
  UserPlus, Calculator, Wallet, TrendingUp, TrendingDown 
} from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';

export function PayrollDashboardPage() {
  const { 
    departments, 
    employees, 
    advances, 
    transactions,
    getActiveAdvances,
    getEmployeeAdvanceBalance 
  } = usePayroll();

  const stats = useMemo(() => {
    const activeEmployees = employees.filter(e => e.is_active);
    const activeDepartments = departments.filter(d => d.is_active);
    const activeAdvances = getActiveAdvances();
    const totalAdvanceBalance = activeAdvances.reduce((sum, adv) => sum + adv.remaining_amount, 0);
    
    // Calculate this month's payroll estimate
    const currentMonth = new Date().toISOString().substring(0, 7);
    const thisMonthTransactions = transactions.filter(t => 
      t.transaction_date.startsWith(currentMonth) && t.transaction_type === 'payment'
    );
    const thisMonthPayroll = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalEmployees: activeEmployees.length,
      totalDepartments: activeDepartments.length,
      thisMonthPayroll,
      totalAdvanceBalance,
      productionWorkers: activeEmployees.filter(e => e.salary_type === 'production').length,
      hourlyWorkers: activeEmployees.filter(e => e.salary_type === 'hourly').length,
      dailyWorkers: activeEmployees.filter(e => e.salary_type === 'daily').length,
    };
  }, [employees, departments, transactions, advances]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
      .slice(0, 10);
  }, [transactions]);

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      payment: 'قبض',
      expense: 'مصروف',
      advance: 'سلفة',
      advance_repayment: 'سداد سلفة',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      payment: 'text-green-600 bg-green-50',
      expense: 'text-orange-600 bg-orange-50',
      advance: 'text-red-600 bg-red-50',
      advance_repayment: 'text-blue-600 bg-blue-50',
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">لوحة التحكم - العمال والمرتبات</h1>
          <p className="text-sm text-muted-foreground">نظرة عامة على العمال والمرتبات والمعاملات المالية</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">إجمالي العمال</p>
          <p className="text-2xl text-foreground">{stats.totalEmployees}</p>
        </div>

        <div className="bg-white rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">إجمالي الأقسام</p>
          <p className="text-2xl text-foreground">{stats.totalDepartments}</p>
        </div>

        <div className="bg-white rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">رواتب هذا الشهر</p>
          <p className="text-2xl text-foreground">{stats.thisMonthPayroll.toLocaleString()} ج.م</p>
        </div>

        <div className="bg-white rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">السلف المعلقة</p>
          <p className="text-2xl text-foreground">{stats.totalAdvanceBalance.toLocaleString()} ج.م</p>
        </div>
      </div>

      {/* Quick Actions & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-lg text-foreground mb-4">إجراءات سريعة</h2>
          <div className="space-y-2">
            <Link
              to="/payroll/employees"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <div className="p-2 bg-blue-50 rounded-lg">
                <UserPlus className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm text-foreground">إضافة عامل جديد</span>
            </Link>
            
            <Link
              to="/payroll/departments"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-green-50 hover:border-green-200 transition-colors"
            >
              <div className="p-2 bg-green-50 rounded-lg">
                <Plus className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm text-foreground">إضافة قسم</span>
            </Link>
            
            <Link
              to="/payroll/transactions"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-orange-50 hover:border-orange-200 transition-colors"
            >
              <div className="p-2 bg-orange-50 rounded-lg">
                <Wallet className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm text-foreground">تسجيل معاملة مالية</span>
            </Link>
            
            <Link
              to="/payroll/processing"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-purple-50 hover:border-purple-200 transition-colors"
            >
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calculator className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm text-foreground">احتساب المرتبات</span>
            </Link>
          </div>
        </div>

        {/* Workers by Type */}
        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-lg text-foreground mb-4">توزيع العمال حسب النوع</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-foreground">إنتاج</span>
              </div>
              <span className="text-lg text-foreground">{stats.productionWorkers}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-foreground">بالساعة</span>
              </div>
              <span className="text-lg text-foreground">{stats.hourlyWorkers}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-foreground">يومية</span>
              </div>
              <span className="text-lg text-foreground">{stats.dailyWorkers}</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-lg text-foreground mb-4">التنبيهات</h2>
          <div className="space-y-3">
            {getActiveAdvances().length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-900 mb-1">سلف معلقة</p>
                  <p className="text-xs text-red-700">
                    يوجد {getActiveAdvances().length} عامل لديهم سلف غير مسددة
                  </p>
                </div>
              </div>
            )}
            
            {employees.filter(e => e.is_active).length === 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-yellow-900 mb-1">لا يوجد عمال</p>
                  <p className="text-xs text-yellow-700">
                    ابدأ بإضافة العمال إلى النظام
                  </p>
                </div>
              </div>
            )}
            
            {employees.filter(e => e.is_active).length > 0 && getActiveAdvances().length === 0 && (
              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                <AlertCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-green-900">كل شيء على ما يرام</p>
                  <p className="text-xs text-green-700">لا توجد تنبيهات في الوقت الحالي</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg text-foreground">آخر المعاملات المالية</h2>
          <Link to="/payroll/transactions" className="text-sm text-blue-600 hover:text-blue-700">
            عرض الكل ←
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">العامل</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">النوع</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">الوصف</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    لا توجد معاملات مالية بعد
                  </td>
                </tr>
              ) : (
                recentTransactions.map(txn => {
                  const employee = employees.find(e => e.id === txn.employee_id);
                  return (
                    <tr key={txn.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {new Date(txn.transaction_date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {employee?.full_name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getTransactionTypeColor(txn.transaction_type)}`}>
                          {getTransactionTypeLabel(txn.transaction_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {txn.description || txn.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        {txn.amount.toLocaleString()} ج.م
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
