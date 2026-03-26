import React from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Link } from 'react-router';
import { Users, UserPlus, ShoppingCart, Package, TrendingUp, TrendingDown, Clock, List } from 'lucide-react';

export function ContactsDashboard() {
  const { state, formatCurrency } = useAccounting();

  const customers = state.contacts.filter(c => c.contact_type === 'customer' || c.contact_type === 'both');
  const suppliers = state.contacts.filter(c => c.contact_type === 'supplier' || c.contact_type === 'both');
  const activeContacts = state.contacts.filter(c => c.is_active);

  const totalCustomerBalance = customers.reduce((s, c) => s + c.opening_balance, 0);
  const totalSupplierBalance = suppliers.reduce((s, c) => s + c.opening_balance, 0);

  const salesInvoices = (state.invoices || []).filter(i => i.invoice_type === 'sales');
  const purchaseInvoices = (state.invoices || []).filter(i => i.invoice_type === 'purchase');
  const unpaidSales = salesInvoices.filter(i => i.remaining_amount > 0);
  const unpaidPurchases = purchaseInvoices.filter(i => i.remaining_amount > 0);

  const topCustomers = customers
    .map(c => {
      const total = salesInvoices.filter(i => i.contact_id === c.id).reduce((s, i) => s + i.total_amount, 0);
      return { ...c, totalPurchases: total };
    })
    .sort((a, b) => b.totalPurchases - a.totalPurchases)
    .slice(0, 5);

  const topSuppliers = suppliers
    .map(c => {
      const total = purchaseInvoices.filter(i => i.contact_id === c.id).reduce((s, i) => s + i.total_amount, 0);
      return { ...c, totalSales: total };
    })
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl flex items-center gap-2 text-foreground">
            <Users className="w-6 h-6 text-indigo-600" /> لوحة تحكم جهات الاتصال
          </h1>
          <p className="text-sm text-muted-foreground mt-1">ملخص العملاء والموردين</p>
        </div>
        <Link to="/contacts/list" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <List className="w-4 h-4" /> إدارة جهات الاتصال
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <ShoppingCart className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-blue-600 mb-1">العملاء</p>
          <p className="text-2xl text-blue-800">{customers.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <Package className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <p className="text-xs text-orange-600 mb-1">الموردين</p>
          <p className="text-2xl text-orange-800">{suppliers.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-emerald-600 mb-1">أرصدة العملاء</p>
          <p className="text-lg text-emerald-800">{formatCurrency(totalCustomerBalance)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-xs text-red-600 mb-1">أرصدة الموردين</p>
          <p className="text-lg text-red-800">{formatCurrency(totalSupplierBalance)}</p>
        </div>
      </div>

      {/* Unpaid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-sm text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" /> فواتير عملاء غير مسددة ({unpaidSales.length})
          </h3>
          <p className="text-lg text-amber-700">{formatCurrency(unpaidSales.reduce((s, i) => s + i.remaining_amount, 0))}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-sm text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" /> فواتير موردين غير مسددة ({unpaidPurchases.length})
          </h3>
          <p className="text-lg text-red-700">{formatCurrency(unpaidPurchases.reduce((s, i) => s + i.remaining_amount, 0))}</p>
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 text-blue-800 text-sm border-b border-blue-200">أكبر 5 عملاء</div>
          <div className="divide-y divide-gray-100">
            {topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">{i + 1}</span>
                  <span className="text-foreground">{c.name}</span>
                </div>
                <span className="text-blue-700">{formatCurrency(c.totalPurchases)}</span>
              </div>
            ))}
            {topCustomers.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد بيانات</div>}
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 text-orange-800 text-sm border-b border-orange-200">أكبر 5 موردين</div>
          <div className="divide-y divide-gray-100">
            {topSuppliers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">{i + 1}</span>
                  <span className="text-foreground">{c.name}</span>
                </div>
                <span className="text-orange-700">{formatCurrency(c.totalSales)}</span>
              </div>
            ))}
            {topSuppliers.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد بيانات</div>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: 'إدارة جهات الاتصال', path: '/contacts/list', icon: <List className="w-5 h-5" />, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
          { title: 'أعمار الديون', path: '/reports/aging', icon: <Clock className="w-5 h-5" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
          { title: 'فاتورة بيع', path: '/invoices', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
          { title: 'فاتورة شراء', path: '/invoices', icon: <Package className="w-5 h-5" />, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
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
