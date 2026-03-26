import React from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Link } from 'react-router';
import { Landmark, Building2, Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Receipt, CreditCard, List } from 'lucide-react';

export function TreasuryDashboard() {
  const { state, formatCurrency } = useAccounting();

  const totalTreasury = state.treasuries.reduce((s, t) => s + t.current_balance, 0);
  const totalBank = state.banks.reduce((s, b) => s + b.current_balance, 0);
  const totalCash = totalTreasury + totalBank;

  const totalReceipts = state.receipts.reduce((s, r) => s + r.amount, 0);
  const totalPayments = state.payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);

  const treasuryDeposits = state.treasuryTransactions.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const treasuryWithdrawals = state.treasuryTransactions.filter(t => t.transaction_type === 'withdrawal').reduce((s, t) => s + t.amount, 0);

  const recentTxns = [...state.treasuryTransactions, ...state.bankTransactions]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl flex items-center gap-2 text-foreground">
            <Landmark className="w-6 h-6 text-blue-600" /> لوحة تحكم الخزينة والبنوك
          </h1>
          <p className="text-sm text-muted-foreground mt-1">ملخص السيولة والحركات المالية</p>
        </div>
        <Link to="/treasury/manage" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <List className="w-4 h-4" /> إدارة الخزينة والبنوك
        </Link>
      </div>

      {/* Main Cash Card */}
      <div className="bg-gradient-to-l from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-5 h-5" />
          <span className="text-sm opacity-80">إجمالي السيولة المتاحة</span>
        </div>
        <p className="text-3xl mb-4">{formatCurrency(totalCash)}</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/15 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs opacity-80 mb-1">
              <Landmark className="w-3.5 h-3.5" /> الصناديق
            </div>
            <p className="text-lg">{formatCurrency(totalTreasury)}</p>
            <p className="text-xs opacity-60">{state.treasuries.length} صندوق</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs opacity-80 mb-1">
              <Building2 className="w-3.5 h-3.5" /> البنوك
            </div>
            <p className="text-lg">{formatCurrency(totalBank)}</p>
            <p className="text-xs opacity-60">{state.banks.length} بنك</p>
          </div>
        </div>
      </div>

      {/* Flow Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <ArrowDownLeft className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-xs text-emerald-600 mb-1">سندات القبض</p>
          <p className="text-lg text-emerald-800">{formatCurrency(totalReceipts)}</p>
          <p className="text-xs text-emerald-500">{state.receipts.length} سند</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <ArrowUpRight className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="text-xs text-red-600 mb-1">سندات الص��ف</p>
          <p className="text-lg text-red-800">{formatCurrency(totalPayments)}</p>
          <p className="text-xs text-red-500">{state.payments.length} سند</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <CreditCard className="w-5 h-5 text-orange-600 mx-auto mb-1" />
          <p className="text-xs text-orange-600 mb-1">المصروفات</p>
          <p className="text-lg text-orange-800">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-orange-500">{state.expenses.length} مصروف</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${totalReceipts - totalPayments - totalExpenses >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
          <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xs text-blue-600 mb-1">صافي التدفق</p>
          <p className="text-lg text-blue-800">{formatCurrency(totalReceipts - totalPayments - totalExpenses)}</p>
        </div>
      </div>

      {/* Treasuries & Banks Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
            <h3 className="text-sm text-blue-800 flex items-center gap-2"><Landmark className="w-4 h-4" /> تفاصيل الصناديق</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {state.treasuries.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
                <div>
                  <span className="text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground mr-2">({t.currency})</span>
                </div>
                <span className="text-blue-700">{formatCurrency(t.current_balance)}</span>
              </div>
            ))}
            {state.treasuries.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد صناديق</div>}
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200">
            <h3 className="text-sm text-indigo-800 flex items-center gap-2"><Building2 className="w-4 h-4" /> تفاصيل البنوك</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {state.banks.map(b => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
                <div>
                  <span className="text-foreground">{b.bank_name}</span>
                  <span className="text-xs text-muted-foreground mr-2">{b.account_number}</span>
                </div>
                <span className="text-indigo-700">{formatCurrency(b.current_balance)}</span>
              </div>
            ))}
            {state.banks.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد بنوك</div>}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm text-foreground">آخر الحركات المالية</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {recentTxns.map(txn => (
            <div key={txn.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
              <div className="flex items-center gap-2">
                {txn.transaction_type === 'deposit' ? (
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                )}
                <span className="text-foreground">{txn.description}</span>
              </div>
              <span className={txn.transaction_type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}>
                {txn.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(txn.amount)}
              </span>
            </div>
          ))}
          {recentTxns.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد حركات</div>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: 'إدارة الخزينة', path: '/treasury/manage', icon: <Landmark className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
          { title: 'التدفقات النقدية', path: '/reports/cash-flow', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
          { title: 'سند قبض', path: '/treasury/manage', icon: <Receipt className="w-5 h-5" />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
          { title: 'سند صرف', path: '/treasury/manage', icon: <CreditCard className="w-5 h-5" />, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
        ].map(a => (
          <Link key={a.title} to={a.path} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${a.color}`}>
            {a.icon}
            <span className="text-sm">{a.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
