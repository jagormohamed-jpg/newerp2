import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Landmark, Building2, Users, ShoppingCart, FileText, Package, TrendingUp, TrendingDown, BookOpenCheck, Scale, BarChart3 } from 'lucide-react';
import { Link } from 'react-router';

export function DashboardPage() {
  const { state, formatCurrency } = useAccounting();

  const totalTreasuryBalance = state.treasuries.reduce((sum, t) => sum + t.current_balance, 0);
  const totalBankBalance = state.banks.reduce((sum, b) => sum + b.current_balance, 0);
  const totalCash = totalTreasuryBalance + totalBankBalance;

  const totalCustomerDebt = state.contacts
    .filter(c => c.contact_type === 'customer' || c.contact_type === 'both')
    .reduce((sum, c) => sum + c.opening_balance, 0);

  const totalSupplierDebt = state.contacts
    .filter(c => c.contact_type === 'supplier' || c.contact_type === 'both')
    .reduce((sum, c) => sum + c.opening_balance, 0);

  // Merge old and new invoice data
  const totalSales = state.salesInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
    + (state.invoices || []).filter(i => i.invoice_type === 'sales').reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPurchases = state.purchaseInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
    + (state.invoices || []).filter(i => i.invoice_type === 'purchase').reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalExpenses = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalInvoicesCount = (state.invoices || []).length;

  const totalStockValue = state.itemStock.reduce((sum, s) => sum + (s.quantity * s.average_cost), 0);

  const lowStockItems = state.items.filter(item => {
    const totalQty = state.itemStock.filter(s => s.item_id === item.id).reduce((sum, s) => sum + s.quantity, 0);
    return totalQty <= item.minimum_stock;
  });

  const recentJournals = state.journalEntries.slice(-5).reverse();
  const recentInvoices = (state.invoices || []).slice(-5).reverse();

  const statCards = [
    { title: 'اجمالي الخزن', value: formatCurrency(totalTreasuryBalance), icon: <Landmark className="w-5 h-5" />, color: 'bg-blue-500', link: '/treasury' },
    { title: 'اجمالي البنوك', value: formatCurrency(totalBankBalance), icon: <Building2 className="w-5 h-5" />, color: 'bg-indigo-500', link: '/treasury' },
    { title: 'اجمالي المبيعات', value: formatCurrency(totalSales), icon: <TrendingUp className="w-5 h-5" />, color: 'bg-emerald-500', link: '/invoices' },
    { title: 'اجمالي المشتريات', value: formatCurrency(totalPurchases), icon: <ShoppingCart className="w-5 h-5" />, color: 'bg-orange-500', link: '/invoices' },
    { title: 'اجمالي المصروفات', value: formatCurrency(totalExpenses), icon: <TrendingDown className="w-5 h-5" />, color: 'bg-red-500', link: '/treasury' },
    { title: 'قيمة المخزون', value: formatCurrency(totalStockValue), icon: <Package className="w-5 h-5" />, color: 'bg-purple-500', link: '/inventory' },
    { title: 'عدد الفواتير', value: String(totalInvoicesCount), icon: <FileText className="w-5 h-5" />, color: 'bg-amber-500', link: '/invoices' },
    { title: 'اجمالي السيولة', value: formatCurrency(totalCash), icon: <Scale className="w-5 h-5" />, color: 'bg-teal-500', link: '/treasury' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link to={card.link} key={card.title} className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-muted-foreground mb-1">{card.title}</p>
                    <p className="text-[18px] text-foreground">{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center text-white`}>
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Journal Entries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-blue-600" />
              آخر القيود المحاسبية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentJournals.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">لا توجد قيود بعد. ابدأ بإنشاء فاتورة أو سند.</p>
            ) : (
              <div className="space-y-2">
                {recentJournals.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <div>
                      <p className="text-[13px] text-foreground">{entry.description}</p>
                      <p className="text-[11px] text-muted-foreground">{entry.entry_number} — {entry.entry_date}</p>
                    </div>
                    <div>
                      <p className="text-[13px] text-emerald-600">{formatCurrency(entry.total_debit)}</p>
                    </div>
                  </div>
                ))}
                <Link to="/reports" className="block text-center text-[12px] text-blue-600 hover:underline pt-1">
                  عرض اليومية الكاملة ←
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              آخر الفواتير
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">لا توجد فواتير بعد.</p>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map(inv => {
                  const contact = state.contacts.find(c => c.id === inv.contact_id);
                  const typeLabel: Record<string, string> = { sales: 'بيع', purchase: 'شراء', sales_return: 'مرتجع بيع', purchase_return: 'مرتجع شراء', inventory_count: 'جرد', damages: 'هوالك' };
                  const typeColor: Record<string, string> = { sales: 'bg-emerald-100 text-emerald-700', purchase: 'bg-blue-100 text-blue-700', sales_return: 'bg-orange-100 text-orange-700', purchase_return: 'bg-purple-100 text-purple-700', inventory_count: 'bg-teal-100 text-teal-700', damages: 'bg-red-100 text-red-700' };
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-blue-700">{inv.invoice_number}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor[inv.invoice_type] || 'bg-gray-100 text-gray-700'}`}>
                            {typeLabel[inv.invoice_type] || inv.invoice_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{contact?.name || 'بدون عميل'} — {inv.invoice_date}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-medium">{formatCurrency(inv.total_amount)}</p>
                        {inv.remaining_amount > 0 && (
                          <p className="text-[11px] text-red-600">متبقي: {formatCurrency(inv.remaining_amount)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Link to="/invoices" className="block text-center text-[12px] text-blue-600 hover:underline pt-1">
                  عرض كل الفواتير ←
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              تنبيهات المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">✅ جميع الأصناف فوق الحد الأدنى</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map(item => {
                  const totalQty = state.itemStock.filter(s => s.item_id === item.id).reduce((sum, s) => sum + s.quantity, 0);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                      <div>
                        <p className="text-[13px] text-foreground">{item.item_name}</p>
                        <p className="text-[11px] text-muted-foreground">الحد الأدنى: {item.minimum_stock} {item.unit}</p>
                      </div>
                      <div className={`text-[13px] px-2 py-1 rounded ${totalQty === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {totalQty === 0 ? 'نفد' : `${totalQty} ${item.unit}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'فاتورة بيع', path: '/invoices', icon: <FileText className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                { title: 'فاتورة شراء', path: '/invoices', icon: <ShoppingCart className="w-5 h-5" />, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                { title: 'سند قبض', path: '/treasury', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                { title: 'سند صرف', path: '/treasury', icon: <TrendingDown className="w-5 h-5" />, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                { title: 'التقارير المالية', path: '/reports', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                { title: 'ميزان المراجعة', path: '/reports', icon: <Scale className="w-5 h-5" />, color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
              ].map(action => (
                <Link
                  key={action.title}
                  to={action.path}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${action.color}`}
                >
                  {action.icon}
                  <span className="text-[13px]">{action.title}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}