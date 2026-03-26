import React, { useState, useMemo } from 'react';
import { User, Printer, Download, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';

export function EmployeeStatementPage() {
  const {
    employees,
    departments,
    productionInvoices,
    workHours,
    dailyAttendance,
    transactions,
    advances,
    advancePayments,
    calculateEmployeeGrossSalary,
    calculateEmployeeExpenses,
    calculateEmployeeAdvanceDeduction,
    calculateEmployeeNetSalary,
    getEmployeeAdvanceBalance,
    getProductionInvoicesByEmployee,
    getWorkHoursByEmployee,
    getAttendanceByEmployee,
    getTransactionsByEmployee,
    getAdvancesByEmployee,
  } = usePayroll();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [period, setPeriod] = useState('current_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = '';
    let end = '';

    switch (period) {
      case 'current_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'current_week':
        const dayOfWeek = now.getDay();
        start = new Date(now.setDate(now.getDate() - dayOfWeek)).toISOString().split('T')[0];
        end = new Date(now.setDate(now.getDate() + 6)).toISOString().split('T')[0];
        break;
      case 'custom':
        start = startDate;
        end = endDate;
        break;
      default:
        start = '';
        end = '';
    }

    return { start, end };
  }, [period, startDate, endDate]);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const department = selectedEmployee ? departments.find(d => d.id === selectedEmployee.department_id) : null;

  // Calculate all data
  const grossSalary = selectedEmployeeId && dateRange.start && dateRange.end
    ? calculateEmployeeGrossSalary(selectedEmployeeId, dateRange.start, dateRange.end)
    : 0;

  const expenses = selectedEmployeeId && dateRange.start && dateRange.end
    ? calculateEmployeeExpenses(selectedEmployeeId, dateRange.start, dateRange.end)
    : 0;

  const advanceDeduction = selectedEmployeeId && dateRange.start
    ? calculateEmployeeAdvanceDeduction(selectedEmployeeId, dateRange.start.substring(0, 7))
    : 0;

  const netSalary = selectedEmployeeId && dateRange.start && dateRange.end
    ? calculateEmployeeNetSalary(selectedEmployeeId, dateRange.start, dateRange.end)
    : 0;

  const advanceBalance = selectedEmployeeId ? getEmployeeAdvanceBalance(selectedEmployeeId) : 0;

  // Get detailed data
  const detailData = useMemo(() => {
    if (!selectedEmployeeId || !dateRange.start || !dateRange.end) return null;

    const invoices = getProductionInvoicesByEmployee(selectedEmployeeId, dateRange.start, dateRange.end);
    const hours = getWorkHoursByEmployee(selectedEmployeeId, dateRange.start, dateRange.end);
    const attendance = getAttendanceByEmployee(selectedEmployeeId, dateRange.start, dateRange.end);
    const txns = getTransactionsByEmployee(selectedEmployeeId, dateRange.start, dateRange.end);
    const empAdvances = getAdvancesByEmployee(selectedEmployeeId);

    return {
      invoices,
      hours,
      attendance,
      transactions: txns,
      advances: empAdvances,
    };
  }, [selectedEmployeeId, dateRange]);

  // Calculate payments received
  const paymentsReceived = detailData?.transactions
    .filter(t => t.transaction_type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">كشف حساب العامل</h1>
          <p className="text-sm text-muted-foreground">عرض تفصيلي لحساب العامل</p>
        </div>
      </div>

      {/* Selection Bar */}
      <div className="bg-white rounded-lg border border-border p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">اختر العامل</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="">اختر العامل...</option>
              {employees.filter(e => e.is_active).map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} - {emp.employee_code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">الفترة</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="current_month">هذا الشهر</option>
              <option value="last_month">الشهر الماضي</option>
              <option value="current_week">هذا الأسبوع</option>
              <option value="custom">فترة مخصصة</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm">
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm">
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm">
              <FileText className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        )}
      </div>

      {selectedEmployee ? (
        <>
          {/* Employee Header Card */}
          <div className="bg-white rounded-lg border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl">
                {selectedEmployee.full_name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl text-foreground font-medium mb-1">{selectedEmployee.full_name}</h2>
                    <p className="text-sm text-muted-foreground">
                      كود: {selectedEmployee.employee_code} | القسم: {department?.name || 'بدون قسم'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    selectedEmployee.salary_type === 'production' ? 'bg-orange-50 text-orange-700' :
                    selectedEmployee.salary_type === 'hourly' ? 'bg-blue-50 text-blue-700' :
                    'bg-green-50 text-green-700'
                  }`}>
                    {selectedEmployee.salary_type === 'production' ? 'إنتاج' :
                     selectedEmployee.salary_type === 'hourly' ? 'بالساعة' : 'يومية'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">تاريخ التعيين: </span>
                    <span className="text-foreground">{new Date(selectedEmployee.hire_date).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الهاتف: </span>
                    <span className="text-foreground">{selectedEmployee.phone || '-'}</span>
                  </div>
                  {advanceBalance > 0 && (
                    <div>
                      <span className="text-muted-foreground">رصيد السلف: </span>
                      <span className="text-red-700 font-medium">{advanceBalance.toLocaleString()} ج.م</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <div className="bg-white rounded-lg border border-border p-5">
            <h3 className="text-lg text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              الراتب المستحق
            </h3>
            
            {selectedEmployee.salary_type === 'production' && detailData?.invoices && detailData.invoices.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">التاريخ</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">رقم الفاتورة</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">الكمية</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {detailData.invoices.map(inv => (
                      <tr key={inv.id}>
                        <td className="px-3 py-2">{new Date(inv.invoice_date).toLocaleDateString('ar-EG')}</td>
                        <td className="px-3 py-2">{inv.invoice_number}</td>
                        <td className="px-3 py-2">{inv.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                        <td className="px-3 py-2 font-medium">{inv.total_amount.toLocaleString()} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedEmployee.salary_type === 'hourly' && detailData?.hours && detailData.hours.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">التاريخ</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">الحضور</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">الانصراف</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">الساعات</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">النوع</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {detailData.hours.map(wh => (
                      <tr key={wh.id}>
                        <td className="px-3 py-2">{new Date(wh.work_date).toLocaleDateString('ar-EG')}</td>
                        <td className="px-3 py-2">{wh.clock_in}</td>
                        <td className="px-3 py-2">{wh.clock_out}</td>
                        <td className="px-3 py-2">{wh.total_hours.toFixed(2)}</td>
                        <td className="px-3 py-2">{wh.hour_type === 'overtime' ? 'إضافي' : 'عادي'}</td>
                        <td className="px-3 py-2 font-medium">{wh.amount.toLocaleString()} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedEmployee.salary_type === 'daily' && detailData?.attendance && (
              <div className="mb-4">
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">أيام الحضور</p>
                    <p className="text-lg font-medium">{detailData.attendance.filter(a => a.status === 'present').length}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">أيام الغياب</p>
                    <p className="text-lg font-medium">{detailData.attendance.filter(a => a.status === 'absent').length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">أيام الإذن</p>
                    <p className="text-lg font-medium">{detailData.attendance.filter(a => a.status === 'leave').length}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">الأجر اليومي</p>
                    <p className="text-lg font-medium">{selectedEmployee.daily_wage} ج.م</p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-muted-foreground mb-1">إجمالي الراتب المستحق</p>
              <p className="text-2xl text-green-700 font-bold">{grossSalary.toLocaleString()} ج.م</p>
            </div>
          </div>

          {/* Expenses */}
          {detailData?.transactions && detailData.transactions.filter(t => t.transaction_type === 'expense').length > 0 && (
            <div className="bg-white rounded-lg border border-border p-5">
              <h3 className="text-lg text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-600" />
                المصروفات
              </h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">التاريخ</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">الوصف</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">الفئة</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">المبلغ</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">يتحمله</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {detailData.transactions.filter(t => t.transaction_type === 'expense').map(exp => (
                      <tr key={exp.id}>
                        <td className="px-3 py-2">{new Date(exp.transaction_date).toLocaleDateString('ar-EG')}</td>
                        <td className="px-3 py-2">{exp.description || exp.notes || '-'}</td>
                        <td className="px-3 py-2">{exp.expense_category}</td>
                        <td className="px-3 py-2 font-medium">{exp.amount.toLocaleString()} ج.م</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            exp.expense_bearer === 'company' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {exp.expense_bearer === 'company' ? 'الشركة' : 'العامل'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-muted-foreground mb-1">إجمالي المصروفات المستحقة</p>
                <p className="text-2xl text-blue-700 font-bold">{expenses.toLocaleString()} ج.م</p>
              </div>
            </div>
          )}

          {/* Payments Received */}
          {paymentsReceived > 0 && (
            <div className="bg-white rounded-lg border border-border p-5">
              <h3 className="text-lg text-foreground mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                المبالغ المقبوضة
              </h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">التاريخ</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">الوصف</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">المبلغ</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">الطريقة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {detailData?.transactions?.filter(t => t.transaction_type === 'payment').map(pmt => (
                      <tr key={pmt.id}>
                        <td className="px-3 py-2">{new Date(pmt.transaction_date).toLocaleDateString('ar-EG')}</td>
                        <td className="px-3 py-2">{pmt.description || pmt.notes || '-'}</td>
                        <td className="px-3 py-2 font-medium">{pmt.amount.toLocaleString()} ج.م</td>
                        <td className="px-3 py-2">{pmt.payment_method === 'cash' ? 'نقداً' : 'تحويل'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-muted-foreground mb-1">إجمالي المقبوض</p>
                <p className="text-2xl text-orange-700 font-bold">{paymentsReceived.toLocaleString()} ج.م</p>
              </div>
            </div>
          )}

          {/* Advances */}
          {detailData?.advances && detailData.advances.length > 0 && (
            <div className="bg-white rounded-lg border border-border p-5">
              <h3 className="text-lg text-foreground mb-4">السلف</h3>
              <div className="space-y-4">
                {detailData.advances.map(adv => {
                  const payments = advancePayments.filter(p => p.advance_id === adv.id);
                  const totalPaid = adv.total_amount - adv.remaining_amount;
                  const percentage = (totalPaid / adv.total_amount) * 100;

                  return (
                    <div key={adv.id} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            سلفة بتاريخ {new Date(adv.advance_date).toLocaleDateString('ar-EG')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            قسط شهري: {adv.monthly_installment} ج.م × {adv.number_of_installments} شهر
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          adv.status === 'paid' ? 'bg-green-50 text-green-700' :
                          adv.status === 'active' ? 'bg-orange-50 text-orange-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {adv.status === 'paid' ? 'مسددة' : adv.status === 'active' ? 'نشطة' : 'ملغاة'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">المبلغ الأصلي:</span>
                          <span className="text-foreground font-medium">{adv.total_amount.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">المسدد:</span>
                          <span className="text-green-700 font-medium">{totalPaid.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">المتبقي:</span>
                          <span className="text-red-700 font-medium">{adv.remaining_amount.toLocaleString()} ج.م</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">{percentage.toFixed(1)}% مسدد</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-muted-foreground mb-1">رصيد السلف المتبقي</p>
                <p className="text-2xl text-red-700 font-bold">{advanceBalance.toLocaleString()} ج.م</p>
              </div>
            </div>
          )}

          {/* Final Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 p-6">
            <h3 className="text-lg text-foreground mb-4 font-medium">ملخص الحساب</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">الراتب المستحق</span>
                <span className="text-lg text-green-700 font-medium">+{grossSalary.toLocaleString()} ج.م</span>
              </div>
              {expenses > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">المصروفات المستحقة</span>
                  <span className="text-lg text-blue-700 font-medium">+{expenses.toLocaleString()} ج.م</span>
                </div>
              )}
              {paymentsReceived > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">المبالغ المقبوضة</span>
                  <span className="text-lg text-orange-700 font-medium">-{paymentsReceived.toLocaleString()} ج.م</span>
                </div>
              )}
              {advanceDeduction > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">خصم قسط السلفة</span>
                  <span className="text-lg text-red-700 font-medium">-{advanceDeduction.toLocaleString()} ج.م</span>
                </div>
              )}
              <div className="border-t-2 border-blue-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base text-foreground font-medium">صافي المستحق للعامل</span>
                  <span className={`text-2xl font-bold ${netSalary >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {netSalary.toLocaleString()} ج.م
                  </span>
                </div>
              </div>
              {advanceBalance > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="text-sm text-muted-foreground">رصيد السلف المتبقي</span>
                  <span className="text-lg text-red-700 font-medium">{advanceBalance.toLocaleString()} ج.م</span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">اختر عاملاً لعرض كشف الحساب</p>
        </div>
      )}
    </div>
  );
}
