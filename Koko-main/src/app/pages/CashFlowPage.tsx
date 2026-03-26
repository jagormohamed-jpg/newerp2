import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet, Landmark } from 'lucide-react';

export function CashFlowPage() {
  const { state, formatCurrency, getCashFlowSummary } = useAccounting();
  const cf = getCashFlowSummary();

  // Detailed breakdown
  const treasuryDeposits = state.treasuryTransactions.filter(t => t.transaction_type === 'deposit');
  const treasuryWithdrawals = state.treasuryTransactions.filter(t => t.transaction_type === 'withdrawal');
  const bankDeposits = state.bankTransactions.filter(t => t.transaction_type === 'deposit');
  const bankWithdrawals = state.bankTransactions.filter(t => t.transaction_type === 'withdrawal');

  // Group by source type
  const groupBySource = (txns: { amount: number; source_type: string }[]) => {
    const groups: Record<string, number> = {};
    txns.forEach(t => {
      const label = {
        sales_invoice: 'مبيعات',
        purchase_invoice: 'مشتريات',
        receipt: 'سندات قبض',
        payment: 'سندات صرف',
        expense: 'مصروفات',
        transfer: 'تحويلات',
        payroll: 'رواتب',
        sales_return: 'مرتجعات بيع',
        purchase_return: 'مرتجعات شراء',
      }[t.source_type] || t.source_type;
      groups[label] = (groups[label] || 0) + t.amount;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  };

  const inflowGroups = groupBySource([...treasuryDeposits, ...bankDeposits]);
  const outflowGroups = groupBySource([...treasuryWithdrawals, ...bankWithdrawals]);

  // Current balances
  const totalTreasury = state.treasuries.reduce((s, t) => s + t.current_balance, 0);
  const totalBank = state.banks.reduce((s, b) => s + b.current_balance, 0);

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-xl flex items-center gap-2"><TrendingUp className="w-6 h-6 text-green-600" /> تقرير التدفقات النقدية</h1>
        <p className="text-sm text-gray-500 mt-1">ملخص حركة النقد خلال الفترة الحالية</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <ArrowDownLeft className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-xs text-green-600 mb-1">إجمالي التدفقات الداخلة</div>
          <div className="text-xl text-green-800 font-bold">{formatCurrency(cf.operating_in)}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <ArrowUpRight className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <div className="text-xs text-red-600 mb-1">إجمالي التدفقات الخارجة</div>
          <div className="text-xl text-red-800 font-bold">{formatCurrency(cf.operating_out)}</div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${cf.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${cf.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          <div className={`text-xs mb-1 ${cf.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>صافي التدفق النقدي</div>
          <div className={`text-xl font-bold ${cf.net >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{formatCurrency(cf.net)}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <Wallet className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <div className="text-xs text-purple-600 mb-1">الرصيد النقدي الحالي</div>
          <div className="text-xl text-purple-800 font-bold">{formatCurrency(totalTreasury + totalBank)}</div>
        </div>
      </div>

      {/* Current Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm text-gray-600 mb-3 flex items-center gap-2"><Wallet className="w-4 h-4" /> أرصدة الصناديق</h3>
          <div className="space-y-2">
            {state.treasuries.map(t => (
              <div key={t.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{t.name}</span>
                <span className="font-medium">{formatCurrency(t.current_balance)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm text-gray-600 mb-3 flex items-center gap-2"><Landmark className="w-4 h-4" /> أرصدة البنوك</h3>
          <div className="space-y-2">
            {state.banks.map(b => (
              <div key={b.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{b.bank_name}</span>
                <span className="font-medium">{formatCurrency(b.current_balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inflows & Outflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-green-50 text-green-800 text-sm font-medium flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4" /> التدفقات الداخلة
          </div>
          <div className="divide-y divide-gray-100">
            {inflowGroups.map(([label, amount]) => (
              <div key={label} className="flex justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                <span className="text-gray-700">{label}</span>
                <span className="text-green-700 font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
            {inflowGroups.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">لا توجد تدفقات داخلة</div>}
            {inflowGroups.length > 0 && (
              <div className="flex justify-between px-4 py-3 text-sm bg-green-50 font-bold">
                <span className="text-green-800">الإجمالي</span>
                <span className="text-green-800">{formatCurrency(cf.operating_in)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-red-50 text-red-800 text-sm font-medium flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" /> التدفقات الخارجة
          </div>
          <div className="divide-y divide-gray-100">
            {outflowGroups.map(([label, amount]) => (
              <div key={label} className="flex justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                <span className="text-gray-700">{label}</span>
                <span className="text-red-700 font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
            {outflowGroups.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">لا توجد تدفقات خارجة</div>}
            {outflowGroups.length > 0 && (
              <div className="flex justify-between px-4 py-3 text-sm bg-red-50 font-bold">
                <span className="text-red-800">الإجمالي</span>
                <span className="text-red-800">{formatCurrency(cf.operating_out)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
