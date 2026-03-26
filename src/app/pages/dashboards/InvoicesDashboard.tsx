import React from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Link } from 'react-router';
import { FileText, ShoppingCart, TrendingUp, TrendingDown, Clock, CircleCheck, RotateCcw, List, DollarSign } from 'lucide-react';

export function InvoicesDashboard() {
  const { state, formatCurrency } = useAccounting();

  const invoices = state.invoices || [];
  const salesInvoices = invoices.filter(i => i.invoice_type === 'sales');
  const purchaseInvoices = invoices.filter(i => i.invoice_type === 'purchase');
  const salesReturns = invoices.filter(i => i.invoice_type === 'sales_return');
  const purchaseReturns = invoices.filter(i => i.invoice_type === 'purchase_return');

  const totalSales = salesInvoices.reduce((s, i) => s + i.total_amount, 0);
  const totalPurchases = purchaseInvoices.reduce((s, i) => s + i.total_amount, 0);
  const totalSalesReturns = salesReturns.reduce((s, i) => s + i.total_amount, 0);
  const totalPurchaseReturns = purchaseReturns.reduce((s, i) => s + i.total_amount, 0);

  const unpaidSales = salesInvoices.filter(i => i.remaining_amount > 0);
  const unpaidPurchases = purchaseInvoices.filter(i => i.remaining_amount > 0);
  const paidSales = salesInvoices.filter(i => i.remaining_amount === 0 && i.total_amount > 0);
  const paidPurchases = purchaseInvoices.filter(i => i.remaining_amount === 0 && i.total_amount > 0);

  const totalUnpaidSalesAmount = unpaidSales.reduce((s, i) => s + i.remaining_amount, 0);
  const totalUnpaidPurchasesAmount = unpaidPurchases.reduce((s, i) => s + i.remaining_amount, 0);

  const grossProfit = totalSales - totalPurchases - totalSalesReturns + totalPurchaseReturns;

  const recentInvoices = invoices.slice(-8).reverse();

  const typeLabel: Record<string, string> = { sales: 'بيع', purchase: 'شراء', sales_return: 'مرتجع بيع', purchase_return: 'مرتجع شراء', inventory_count: 'جرد', damages: 'هوالك' };
  const typeColor: Record<string, string> = { sales: 'bg-emerald-100 text-emerald-700', purchase: 'bg-blue-100 text-blue-700', sales_return: 'bg-orange-100 text-orange-700', purchase_return: 'bg-purple-100 text-purple-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl flex items-center gap-2 text-foreground">
            <FileText className="w-6 h-6 text-emerald-600" /> لوحة تحكم الفواتير
          </h1>
          <p className="text-sm text-muted-foreground mt-1">ملخص المبيعات والمشتريات والمرتجعات</p>
        </div>
        <Link to="/invoices/manage" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors">
          <List className="w-4 h-4" /> إدارة الفواتير
        </Link>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-xs text-emerald-600 mb-1">إجمالي المبيعات</p>
          <p className="text-lg text-emerald-800">{formatCurrency(totalSales)}</p>
          <p className="text-xs text-emerald-500">{salesInvoices.length} فاتورة</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <ShoppingCart className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xs text-blue-600 mb-1">إجمالي المشتريات</p>
          <p className="text-lg text-blue-800">{formatCurrency(totalPurchases)}</p>
          <p className="text-xs text-blue-500">{purchaseInvoices.length} فاتورة</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <RotateCcw className="w-5 h-5 text-orange-600 mx-auto mb-1" />
          <p className="text-xs text-orange-600 mb-1">المرتجعات</p>
          <p className="text-lg text-orange-800">{formatCurrency(totalSalesReturns + totalPurchaseReturns)}</p>
          <p className="text-xs text-orange-500">{salesReturns.length + purchaseReturns.length} فاتورة</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${grossProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-xs text-green-600 mb-1">مجمل الربح</p>
          <p className={`text-lg ${grossProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatCurrency(grossProfit)}</p>
        </div>
      </div>

      {/* Payment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-sm text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> حالة سداد المبيعات
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-emerald-50 rounded-lg">
              <CircleCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-emerald-600">مسددة</p>
              <p className="text-lg text-emerald-800">{paidSales.length}</p>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-lg">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="text-xs text-amber-600">غير مسددة</p>
              <p className="text-lg text-amber-800">{unpaidSales.length}</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-red-600 mx-auto mb-1" />
              <p className="text-xs text-red-600">المتبقي</p>
              <p className="text-sm text-red-800">{formatCurrency(totalUnpaidSalesAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-sm text-foreground mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" /> حالة سداد المشتريات
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-emerald-50 rounded-lg">
              <CircleCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-emerald-600">مسددة</p>
              <p className="text-lg text-emerald-800">{paidPurchases.length}</p>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-lg">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="text-xs text-amber-600">غير مسددة</p>
              <p className="text-lg text-amber-800">{unpaidPurchases.length}</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-red-600 mx-auto mb-1" />
              <p className="text-xs text-red-600">المتبقي</p>
              <p className="text-sm text-red-800">{formatCurrency(totalUnpaidPurchasesAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm text-foreground">آخر الفواتير</h3>
          <Link to="/invoices/manage" className="text-xs text-blue-600 hover:underline">عرض الكل</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentInvoices.map(inv => {
            const contact = state.contacts.find(c => c.id === inv.contact_id);
            return (
              <div key={inv.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-blue-600 font-mono text-xs">{inv.invoice_number}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor[inv.invoice_type] || 'bg-gray-100 text-gray-700'}`}>
                    {typeLabel[inv.invoice_type] || inv.invoice_type}
                  </span>
                  <span className="text-foreground">{contact?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{inv.invoice_date}</span>
                  <span className="text-foreground">{formatCurrency(inv.total_amount)}</span>
                  {inv.remaining_amount > 0 && (
                    <span className="text-xs text-red-600">({formatCurrency(inv.remaining_amount)})</span>
                  )}
                </div>
              </div>
            );
          })}
          {recentInvoices.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">لا توجد فواتير بعد</div>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: 'إنشاء فاتورة بيع', path: '/invoices/manage', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
          { title: 'إنشاء فاتورة شراء', path: '/invoices/manage', icon: <ShoppingCart className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
          { title: 'أعمار الديون', path: '/reports/aging', icon: <Clock className="w-5 h-5" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
          { title: 'التقارير المالية', path: '/reports', icon: <FileText className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
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
