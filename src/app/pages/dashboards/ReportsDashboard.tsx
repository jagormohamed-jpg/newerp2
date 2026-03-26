import React from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Link } from 'react-router';
import { BarChart3, BookOpenCheck, Scale, Clock, TrendingUp, Lock, FileText, PieChart, ArrowLeftRight, DollarSign } from 'lucide-react';

export function ReportsDashboard() {
  const { state, formatCurrency, getAccountBalance } = useAccounting();

  const leafAccounts = state.accounts.filter(a => !a.is_parent && a.is_active);
  const revenueTotal = leafAccounts.filter(a => a.account_type === 'revenue').reduce((s, a) => s + getAccountBalance(a.id).balance, 0);
  const expenseTotal = leafAccounts.filter(a => a.account_type === 'expense').reduce((s, a) => s + getAccountBalance(a.id).balance, 0);
  const netProfit = revenueTotal - expenseTotal;

  const totalEntries = state.journalEntries.length;
  const invoiceCount = (state.invoices || []).length;
  const totalCash = state.treasuries.reduce((s, t) => s + t.current_balance, 0) + state.banks.reduce((s, b) => s + b.current_balance, 0);

  const reportCards = [
    {
      title: 'دفتر اليومية',
      description: 'جميع القيود المحاسبية مرتبة بالتاريخ',
      path: '/reports/journal',
      icon: <BookOpenCheck className="w-8 h-8" />,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      iconBg: 'bg-blue-500',
      stat: `${totalEntries} قيد`,
    },
    {
      title: 'ميزان المراجعة',
      description: 'أرصدة جميع الحسابات مع المدين والدائن',
      path: '/reports/journal',
      icon: <ArrowLeftRight className="w-8 h-8" />,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      iconBg: 'bg-indigo-500',
      stat: `${leafAccounts.length} حساب`,
    },
    {
      title: 'الميزانية العمومية',
      description: 'المركز المالي: الأصول والخصوم وحقوق الملكية',
      path: '/reports/balance-sheet',
      icon: <Scale className="w-8 h-8" />,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      iconBg: 'bg-purple-500',
      stat: 'المركز المالي',
    },
    {
      title: 'قائمة الدخل',
      description: 'الإيرادات والمصروفات وصافي الربح',
      path: '/reports/journal',
      icon: <DollarSign className="w-8 h-8" />,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      iconBg: 'bg-emerald-500',
      stat: formatCurrency(netProfit),
    },
    {
      title: 'أعمار الديون',
      description: 'تصنيف المديونيات حسب العمر للعملاء والموردين',
      path: '/reports/aging',
      icon: <Clock className="w-8 h-8" />,
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      iconBg: 'bg-amber-500',
      stat: 'تحليل الديون',
    },
    {
      title: 'التدفقات النقدية',
      description: 'حركة النقد الداخل والخارج مع التحليل',
      path: '/reports/cash-flow',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'bg-green-50 border-green-200 text-green-700',
      iconBg: 'bg-green-500',
      stat: formatCurrency(totalCash),
    },
    {
      title: 'إقفال السنة المالية',
      description: 'إقفال حسابات الإيرادات والمصروفات',
      path: '/reports/fiscal-closing',
      icon: <Lock className="w-8 h-8" />,
      color: 'bg-red-50 border-red-200 text-red-700',
      iconBg: 'bg-red-500',
      stat: 'إقفال الفترة',
    },
    {
      title: 'كشف حساب',
      description: 'كشف حساب تفصيلي لأي حساب أو جهة اتصال',
      path: '/reports/journal',
      icon: <FileText className="w-8 h-8" />,
      color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      iconBg: 'bg-cyan-500',
      stat: 'كشف تفصيلي',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl flex items-center gap-2 text-foreground">
          <BarChart3 className="w-6 h-6 text-blue-600" /> لوحة تحكم التقارير المالية
        </h1>
        <p className="text-sm text-muted-foreground mt-1">اختر التقرير المطلوب</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">عدد القيود</p>
          <p className="text-2xl text-foreground">{totalEntries}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">الإيرادات</p>
          <p className="text-lg text-emerald-600">{formatCurrency(revenueTotal)}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">المصروفات</p>
          <p className="text-lg text-red-600">{formatCurrency(expenseTotal)}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">صافي الربح</p>
          <p className={`text-lg ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</p>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map(card => (
          <Link key={card.title} to={card.path} className={`border rounded-xl p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${card.color}`}>
            <div className={`w-12 h-12 rounded-xl ${card.iconBg} text-white flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <h3 className="text-sm mb-1">{card.title}</h3>
            <p className="text-xs opacity-70 mb-3">{card.description}</p>
            <p className="text-xs opacity-50">{card.stat}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
