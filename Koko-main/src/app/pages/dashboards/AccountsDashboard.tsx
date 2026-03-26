import React from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Link } from 'react-router';
import { BookOpenCheck, TrendingUp, TrendingDown, Building2, Landmark, DollarSign, ArrowLeft, List, PieChart } from 'lucide-react';

export function AccountsDashboard() {
  const { state, formatCurrency, getAccountBalance } = useAccounting();

  const activeAccounts = state.accounts.filter(a => a.is_active);
  const parentAccounts = activeAccounts.filter(a => a.is_parent);
  const leafAccounts = activeAccounts.filter(a => !a.is_parent);

  const byType = (type: string) => leafAccounts.filter(a => a.account_type === type);
  const sumBalances = (accs: typeof leafAccounts) => accs.reduce((s, a) => s + getAccountBalance(a.id).balance, 0);

  const assetTotal = sumBalances(byType('asset'));
  const liabilityTotal = sumBalances(byType('liability'));
  const equityTotal = sumBalances(byType('equity'));
  const revenueTotal = sumBalances(byType('revenue'));
  const expenseTotal = sumBalances(byType('expense'));

  const totalEntries = state.journalEntries.length;
  const totalLines = state.journalEntryLines.length;

  const typeCards = [
    { label: 'الأصول', value: assetTotal, count: byType('asset').length, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { label: 'الخصوم', value: liabilityTotal, count: byType('liability').length, icon: <TrendingDown className="w-5 h-5" />, color: 'bg-red-500', bg: 'bg-red-50 border-red-200' },
    { label: 'حقوق الملكية', value: equityTotal, count: byType('equity').length, icon: <Building2 className="w-5 h-5" />, color: 'bg-purple-500', bg: 'bg-purple-50 border-purple-200' },
    { label: 'الإيرادات', value: revenueTotal, count: byType('revenue').length, icon: <DollarSign className="w-5 h-5" />, color: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'المصروفات', value: expenseTotal, count: byType('expense').length, icon: <Landmark className="w-5 h-5" />, color: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200' },
  ];

  const recentEntries = state.journalEntries.slice(-6).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl flex items-center gap-2 text-foreground">
            <BookOpenCheck className="w-6 h-6 text-blue-600" /> لوحة تحكم الحسابات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">ملخص الدليل المحاسبي والقيود</p>
        </div>
        <Link to="/accounts/tree" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <List className="w-4 h-4" /> شجرة الحسابات
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">إجمالي الحسابات</p>
          <p className="text-2xl text-foreground">{activeAccounts.length}</p>
          <p className="text-xs text-muted-foreground">{parentAccounts.length} رئيسي / {leafAccounts.length} فرعي</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">عدد القيود</p>
          <p className="text-2xl text-foreground">{totalEntries}</p>
          <p className="text-xs text-muted-foreground">{totalLines} سطر</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">صافي الربح/الخسارة</p>
          <p className={`text-2xl ${revenueTotal - expenseTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(revenueTotal - expenseTotal)}
          </p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">توازن الميزانية</p>
          {Math.abs(assetTotal - (liabilityTotal + equityTotal)) < 0.01 ? (
            <p className="text-lg text-emerald-600">متوازنة</p>
          ) : (
            <p className="text-lg text-red-600">غير متوازنة</p>
          )}
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {typeCards.map(card => (
          <div key={card.label} className={`border rounded-xl p-4 ${card.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.color} text-white flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className="text-lg">{formatCurrency(card.value)}</p>
            <p className="text-xs text-muted-foreground">{card.count} حساب</p>
          </div>
        ))}
      </div>

      {/* Recent Journal Entries */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm text-foreground flex items-center gap-2"><PieChart className="w-4 h-4 text-blue-600" /> آخر القيود المحاسبية</h3>
          <Link to="/reports" className="text-xs text-blue-600 hover:underline">عرض الكل</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentEntries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm">
              <div>
                <span className="text-xs text-blue-600 font-mono ml-2">{entry.entry_number}</span>
                <span className="text-foreground">{entry.description}</span>
                <span className="text-xs text-muted-foreground mr-2">{entry.entry_date}</span>
              </div>
              <span className="text-emerald-600">{formatCurrency(entry.total_debit)}</span>
            </div>
          ))}
          {recentEntries.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">لا توجد قيود بعد</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: 'شجرة الحسابات', path: '/accounts/tree', icon: <List className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
          { title: 'الميزانية العمومية', path: '/reports/balance-sheet', icon: <PieChart className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
          { title: 'التقارير المالية', path: '/reports', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
          { title: 'إقفال السنة', path: '/reports/fiscal-closing', icon: <DollarSign className="w-5 h-5" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
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
