import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Lock, AlertTriangle, CircleCheck, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export function FiscalClosingPage() {
  const { state, dispatch, formatCurrency, getAccountBalance } = useAccounting();
  const [showConfirm, setShowConfirm] = useState(false);

  // Calculate current period totals
  const revenueAccounts = state.accounts.filter(a => a.account_type === 'revenue' && !a.is_parent && a.is_active);
  const expenseAccounts = state.accounts.filter(a => a.account_type === 'expense' && !a.is_parent && a.is_active);

  const revenueData = revenueAccounts.map(acc => {
    const bal = getAccountBalance(acc.id);
    return { ...acc, balance: bal.balance };
  }).filter(a => a.balance > 0);

  const expenseData = expenseAccounts.map(acc => {
    const bal = getAccountBalance(acc.id);
    return { ...acc, balance: bal.balance };
  }).filter(a => a.balance > 0);

  const totalRevenue = revenueData.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = expenseData.reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_FISCAL_YEAR', payload: { date: new Date().toISOString().split('T')[0] } });
    setShowConfirm(false);
    toast.success('تم إقفال السنة المالية بنجاح');
  };

  const hasClosingEntry = state.journalEntries.some(je => je.source_type === 'fiscal_close');

  return (
    <div dir="rtl" className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl flex items-center gap-2"><Lock className="w-6 h-6 text-amber-600" /> إقفال السنة المالية</h1>
        <p className="text-sm text-gray-500 mt-1">إقفال حسابات الإيرادات والمصروفات وتحويل الفرق لأرباح مرحّلة</p>
      </div>

      {hasClosingEntry && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="text-sm text-amber-800 font-medium">تم إقفال السنة سابقاً</div>
            <div className="text-xs text-amber-600">يوجد قيد إقفال سابق. تكرار الإقفال سيُنشئ قيود إضافية.</div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-sm text-green-600 mb-1">إجمالي الإيرادات</div>
          <div className="text-2xl text-green-800 font-bold">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-green-500 mt-1">{revenueData.length} حساب</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-sm text-red-600 mb-1">إجمالي المصروفات</div>
          <div className="text-2xl text-red-800 font-bold">{formatCurrency(totalExpenses)}</div>
          <div className="text-xs text-red-500 mt-1">{expenseData.length} حساب</div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className={`text-sm mb-1 ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{netIncome >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</div>
          <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{formatCurrency(Math.abs(netIncome))}</div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-green-50 text-green-800 text-sm font-medium">حسابات الإيرادات</div>
          <div className="divide-y divide-gray-100">
            {revenueData.map(acc => (
              <div key={acc.id} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-700">{acc.account_name} <span className="text-xs text-gray-400">({acc.account_code})</span></span>
                <span className="text-green-700 font-medium">{formatCurrency(acc.balance)}</span>
              </div>
            ))}
            {revenueData.length === 0 && <div className="px-4 py-6 text-center text-gray-400 text-sm">لا توجد إيرادات</div>}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-red-50 text-red-800 text-sm font-medium">حسابات المصروفات</div>
          <div className="divide-y divide-gray-100">
            {expenseData.map(acc => (
              <div key={acc.id} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-700">{acc.account_name} <span className="text-xs text-gray-400">({acc.account_code})</span></span>
                <span className="text-red-700 font-medium">{formatCurrency(acc.balance)}</span>
              </div>
            ))}
            {expenseData.length === 0 && <div className="px-4 py-6 text-center text-gray-400 text-sm">لا توجد مصروفات</div>}
          </div>
        </div>
      </div>

      {/* Close Action */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm text-gray-600 mb-3 flex items-center gap-2"><Calculator className="w-4 h-4" /> القيود التي سيتم إنشاؤها</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2"><span className="text-red-600 text-xs px-1.5 py-0.5 bg-red-50 rounded">مدين</span> كل حسابات الإيرادات بقيمة أرصدتها</div>
          <div className="flex items-center gap-2"><span className="text-green-600 text-xs px-1.5 py-0.5 bg-green-50 rounded">دائن</span> ملخص الدخل (3003) بإجمالي الإيرادات</div>
          <div className="flex items-center gap-2"><span className="text-red-600 text-xs px-1.5 py-0.5 bg-red-50 rounded">مدين</span> ملخص الدخل (3003) بإجمالي المصروفات</div>
          <div className="flex items-center gap-2"><span className="text-green-600 text-xs px-1.5 py-0.5 bg-green-50 rounded">دائن</span> كل حسابات المصروفات بقيمة أرصدتها</div>
          <div className="flex items-center gap-2"><span className="text-red-600 text-xs px-1.5 py-0.5 bg-red-50 rounded">مدين</span> ملخص الدخل → <span className="text-green-600 text-xs px-1.5 py-0.5 bg-green-50 rounded">دائن</span> أرباح مرحّلة (3002) = {formatCurrency(Math.abs(netIncome))}</div>
        </div>

        {!showConfirm ? (
          <button onClick={() => setShowConfirm(true)} className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> إقفال السنة المالية
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <strong>تحذير:</strong> هذه العملية لا يمكن عكسها. سيتم إقفال جميع حسابات الإيرادات والمصروفات.
            </div>
            <div className="flex gap-3">
              <button onClick={handleClose} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                <CircleCheck className="w-4 h-4" /> تأكيد الإقفال
              </button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
