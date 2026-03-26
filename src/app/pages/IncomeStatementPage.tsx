import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { TrendingUp, TrendingDown, CircleCheck } from 'lucide-react';

export function IncomeStatementPage() {
  const { state, formatCurrency, getAccountBalance } = useAccounting();

  // Revenue accounts
  const revenueAccounts = state.accounts.filter(a => a.account_type === 'revenue' && !a.is_parent && a.is_active);
  const revenueItems = revenueAccounts.map(a => {
    const bal = getAccountBalance(a.id);
    return { name: a.account_name, code: a.account_code, amount: bal.balance };
  }).filter(r => r.amount !== 0);
  const totalRevenue = revenueItems.reduce((sum, r) => sum + r.amount, 0);

  // Expense accounts
  const expenseAccounts = state.accounts.filter(a => a.account_type === 'expense' && !a.is_parent && a.is_active);
  const expenseItems = expenseAccounts.map(a => {
    const bal = getAccountBalance(a.id);
    return { name: a.account_name, code: a.account_code, amount: bal.balance };
  }).filter(e => e.amount !== 0);
  const totalExpenses = expenseItems.reduce((sum, e) => sum + e.amount, 0);

  // Separate COGS
  const cogs = expenseItems.find(e => e.code === '5001');
  const cogsAmount = cogs?.amount || 0;
  const operatingExpenses = expenseItems.filter(e => e.code !== '5001');
  const totalOperatingExpenses = operatingExpenses.reduce((sum, e) => sum + e.amount, 0);

  const grossProfit = totalRevenue - cogsAmount;
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-4">
      <h1 className="text-[20px] text-foreground">قائمة الدخل</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center border-b pb-4">
          <CardTitle className="text-[18px]">قائمة الدخل</CardTitle>
          <p className="text-[13px] text-muted-foreground">
            عن الفترة المنتهية في {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Revenue Section */}
          <div>
            <h3 className="text-[15px] text-emerald-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              الإيرادات
            </h3>
            {revenueItems.length === 0 ? (
              <p className="text-[13px] text-muted-foreground mr-6">لا توجد إيرادات</p>
            ) : (
              <div className="space-y-2 mr-6">
                {revenueItems.map(item => (
                  <div key={item.code} className="flex justify-between text-[13px]">
                    <span>{item.name}</span>
                    <span className="text-emerald-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-[14px] mt-3 pt-2 border-t border-dashed mr-6">
              <span>إجمالي الإيرادات</span>
              <span className="text-emerald-700">{formatCurrency(totalRevenue)} ج</span>
            </div>
          </div>

          {/* COGS */}
          {cogsAmount > 0 && (
            <div>
              <div className="flex justify-between text-[13px] mr-6">
                <span>(-) تكلفة البضاعة المباعة</span>
                <span className="text-red-600">({formatCurrency(cogsAmount)})</span>
              </div>
              <div className="flex justify-between text-[14px] mt-2 pt-2 border-t border-double mr-6">
                <span>مجمل الربح</span>
                <span className={grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>{formatCurrency(grossProfit)} ج</span>
              </div>
            </div>
          )}

          {/* Operating Expenses */}
          <div>
            <h3 className="text-[15px] text-red-700 mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              المصروفات التشغيلية
            </h3>
            {operatingExpenses.length === 0 ? (
              <p className="text-[13px] text-muted-foreground mr-6">لا توجد مصروفات</p>
            ) : (
              <div className="space-y-2 mr-6">
                {operatingExpenses.map(item => (
                  <div key={item.code} className="flex justify-between text-[13px]">
                    <span>{item.name}</span>
                    <span className="text-red-600">({formatCurrency(item.amount)})</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-[14px] mt-3 pt-2 border-t border-dashed mr-6">
              <span>إجمالي المصروفات التشغيلية</span>
              <span className="text-red-700">({formatCurrency(totalOperatingExpenses)}) ج</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className={`p-4 rounded-xl ${isProfit ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex justify-between items-center">
              <span className="text-[16px]">
                {isProfit ? 'صافي الربح' : 'صافي الخسارة'}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[22px] ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(Math.abs(netProfit))} ج
                </span>
                {isProfit ? (
                  <CircleCheck className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}