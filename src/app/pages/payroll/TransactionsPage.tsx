import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Download, Filter } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import type { TransactionType, PaymentMethod, ExpenseCategory, ExpenseBearer } from '../../types/payroll';

export function TransactionsPage() {
  const { 
    employees, 
    departments,
    transactions,
    advances,
    addTransaction,
    getTransactionsByEmployee,
    getActiveAdvances
  } = usePayroll();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionType, setTransactionType] = useState<TransactionType>('payment');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  
  // For expenses
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('other');
  const [expenseBearer, setExpenseBearer] = useState<ExpenseBearer>('company');
  
  // For advances
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(0);
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(1);
  const [startDeductionPeriod, setStartDeductionPeriod] = useState(new Date().toISOString().substring(0, 7));
  const [autoDeduct, setAutoDeduct] = useState(true);
  
  // For advance repayment
  const [selectedAdvanceId, setSelectedAdvanceId] = useState('');

  // Filter states
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  
  // Get active advances for selected employee
  const employeeActiveAdvances = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return advances.filter(a => a.employee_id === selectedEmployeeId && a.status === 'active');
  }, [selectedEmployeeId, advances]);

  // Auto-calculate installment when advance amount or number changes
  useMemo(() => {
    if (transactionType === 'advance' && amount > 0 && numberOfInstallments > 0) {
      setMonthlyInstallment(Math.ceil(amount / numberOfInstallments));
    }
  }, [amount, numberOfInstallments, transactionType]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    
    if (filterEmployee) {
      result = result.filter(t => t.employee_id === filterEmployee);
    }
    
    if (filterType) {
      result = result.filter(t => t.transaction_type === filterType);
    }
    
    if (filterStartDate) {
      result = result.filter(t => t.transaction_date >= filterStartDate);
    }
    
    if (filterEndDate) {
      result = result.filter(t => t.transaction_date <= filterEndDate);
    }
    
    return result.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  }, [transactions, filterEmployee, filterType, filterStartDate, filterEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || amount <= 0) return;

    const baseTransaction = {
      employee_id: selectedEmployeeId,
      transaction_date: transactionDate,
      transaction_type: transactionType,
      amount,
      payment_method: paymentMethod,
      description,
      notes,
    };

    if (transactionType === 'expense') {
      addTransaction({
        ...baseTransaction,
        expense_category: expenseCategory,
        expense_bearer: expenseBearer,
        advance_id: '',
        monthly_installment: 0,
        number_of_installments: 0,
        start_deduction_period: '',
        auto_deduct: false,
      });
    } else if (transactionType === 'advance') {
      addTransaction({
        ...baseTransaction,
        expense_category: 'other',
        expense_bearer: 'company',
        advance_id: '',
        monthly_installment: monthlyInstallment,
        number_of_installments: numberOfInstallments,
        start_deduction_period: startDeductionPeriod,
        auto_deduct: autoDeduct,
      });
    } else if (transactionType === 'advance_repayment') {
      if (!selectedAdvanceId) {
        alert('يجب اختيار السلفة المراد سدادها');
        return;
      }
      addTransaction({
        ...baseTransaction,
        expense_category: 'other',
        expense_bearer: 'company',
        advance_id: selectedAdvanceId,
        monthly_installment: 0,
        number_of_installments: 0,
        start_deduction_period: '',
        auto_deduct: false,
      });
    } else {
      // payment
      addTransaction({
        ...baseTransaction,
        expense_category: 'other',
        expense_bearer: 'company',
        advance_id: '',
        monthly_installment: 0,
        number_of_installments: 0,
        start_deduction_period: '',
        auto_deduct: false,
      });
    }

    // Reset form
    setAmount(0);
    setDescription('');
    setNotes('');
    alert('تم حفظ المعاملة المالية بنجاح');
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      payment: 'قبض',
      expense: 'مصروف',
      advance: 'سلفة',
      advance_repayment: 'سداد سلفة',
    };
    return labels[type];
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    const colors: Record<TransactionType, string> = {
      payment: 'bg-green-50 text-green-700',
      expense: 'bg-orange-50 text-orange-700',
      advance: 'bg-red-50 text-red-700',
      advance_repayment: 'bg-blue-50 text-blue-700',
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">المعاملات المالية</h1>
          <p className="text-sm text-muted-foreground">تسجيل المدفوعات والمصروفات والسلف</p>
        </div>
      </div>

      {/* New Transaction Form */}
      <div className="bg-white rounded-lg border border-border p-5">
        <h2 className="text-lg text-foreground mb-4">معاملة مالية جديدة</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">اختر العامل</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                required
              >
                <option value="">اختر العامل...</option>
                {employees.filter(e => e.is_active).map(emp => {
                  const dept = departments.find(d => d.id === emp.department_id);
                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} - {dept?.name || 'بدون قسم'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">التاريخ</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                required
              />
            </div>
          </div>

          {selectedEmployee && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                {selectedEmployee.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">{selectedEmployee.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  كود: {selectedEmployee.employee_code} | القسم: {departments.find(d => d.id === selectedEmployee.department_id)?.name || '-'}
                </p>
              </div>
            </div>
          )}

          {/* Transaction Type Cards */}
          <div>
            <label className="block text-sm text-muted-foreground mb-3">نوع المعاملة</label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setTransactionType('payment')}
                className={`p-4 rounded-lg border-2 transition-all text-right ${
                  transactionType === 'payment'
                    ? 'border-green-500 bg-green-50'
                    : 'border-border hover:border-green-200'
                }`}
              >
                <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-foreground">قبض</p>
                <p className="text-xs text-muted-foreground">صرف مبلغ من الراتب</p>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType('expense')}
                className={`p-4 rounded-lg border-2 transition-all text-right ${
                  transactionType === 'expense'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-border hover:border-orange-200'
                }`}
              >
                <TrendingUp className="w-6 h-6 text-orange-600 mb-2" />
                <p className="text-sm font-medium text-foreground">مصروف</p>
                <p className="text-xs text-muted-foreground">مصاريف العامل</p>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType('advance')}
                className={`p-4 rounded-lg border-2 transition-all text-right ${
                  transactionType === 'advance'
                    ? 'border-red-500 bg-red-50'
                    : 'border-border hover:border-red-200'
                }`}
              >
                <Wallet className="w-6 h-6 text-red-600 mb-2" />
                <p className="text-sm font-medium text-foreground">سلفة</p>
                <p className="text-xs text-muted-foreground">سلفة بالتقسيط</p>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType('advance_repayment')}
                className={`p-4 rounded-lg border-2 transition-all text-right ${
                  transactionType === 'advance_repayment'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-border hover:border-blue-200'
                }`}
              >
                <TrendingDown className="w-6 h-6 text-blue-600 mb-2" />
                <p className="text-sm font-medium text-foreground">سداد سلفة</p>
                <p className="text-xs text-muted-foreground">سداد سلفة سابقة</p>
              </button>
            </div>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">المبلغ</label>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">طريقة الدفع</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="cash">نقداً</option>
                <option value="bank_transfer">تحويل بنكي</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">الوصف</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="وصف المعاملة"
              />
            </div>
          </div>

          {/* Expense-specific fields */}
          {transactionType === 'expense' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">فئة المصروف</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                >
                  <option value="transport">انتقال</option>
                  <option value="food">طعام</option>
                  <option value="tools">أدوات</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">من يتحمل المصروف؟</label>
                <select
                  value={expenseBearer}
                  onChange={(e) => setExpenseBearer(e.target.value as ExpenseBearer)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                >
                  <option value="company">الشركة</option>
                  <option value="employee">يُخصم من راتب العامل</option>
                </select>
              </div>
            </div>
          )}

          {/* Advance-specific fields */}
          {transactionType === 'advance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">القسط الشهري</label>
                <input
                  type="number"
                  value={monthlyInstallment || ''}
                  onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">عدد الأقساط</label>
                <input
                  type="number"
                  value={numberOfInstallments || ''}
                  onChange={(e) => setNumberOfInstallments(Number(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">بداية الخصم (شهر/سنة)</label>
                <input
                  type="month"
                  value={startDeductionPeriod}
                  onChange={(e) => setStartDeductionPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  required
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="autoDeduct"
                  checked={autoDeduct}
                  onChange={(e) => setAutoDeduct(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="autoDeduct" className="text-sm text-foreground cursor-pointer">
                  خصم تلقائي من الراتب
                </label>
              </div>
            </div>
          )}

          {/* Advance Repayment-specific fields */}
          {transactionType === 'advance_repayment' && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm text-muted-foreground mb-2">اختر السلفة المراد سدادها</label>
              {employeeActiveAdvances.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد سلف نشطة لهذا العامل</p>
              ) : (
                <select
                  value={selectedAdvanceId}
                  onChange={(e) => setSelectedAdvanceId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  required
                >
                  <option value="">اختر السلفة...</option>
                  {employeeActiveAdvances.map(adv => (
                    <option key={adv.id} value={adv.id}>
                      تاريخ: {new Date(adv.advance_date).toLocaleDateString('ar-EG')} | 
                      المبلغ الأصلي: {adv.total_amount} ج.م | 
                      المتبقي: {adv.remaining_amount} ج.م
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!selectedEmployeeId || amount <= 0}
            >
              <DollarSign className="w-4 h-4" />
              حفظ المعاملة
            </button>
            <button
              type="button"
              onClick={() => {
                setAmount(0);
                setDescription('');
                setNotes('');
              }}
              className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              إعادة تعيين
            </button>
          </div>
        </form>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-foreground">سجل المعاملات المالية</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg hover:bg-muted/30 text-sm">
              <Download className="w-4 h-4" />
              تصدير Excel
            </button>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="">كل العمال</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TransactionType | '')}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="">كل الأنواع</option>
              <option value="payment">قبض</option>
              <option value="expense">مصروف</option>
              <option value="advance">سلفة</option>
              <option value="advance_repayment">سداد سلفة</option>
            </select>

            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm"
              placeholder="من تاريخ"
            />

            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm"
              placeholder="إلى تاريخ"
            />
          </div>
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
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">الطريقة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    لا توجد معاملات مالية
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(txn => {
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
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs ${getTransactionTypeColor(txn.transaction_type)}`}>
                          {getTransactionTypeLabel(txn.transaction_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {txn.description || txn.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <span className={
                          txn.transaction_type === 'payment' || txn.transaction_type === 'expense' 
                            ? 'text-green-700' 
                            : 'text-red-700'
                        }>
                          {txn.amount.toLocaleString()} ج.م
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {txn.payment_method === 'cash' ? 'نقداً' : 'تحويل'}
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
