import React from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Link } from 'react-router';
import { Package, Warehouse, AlertTriangle, TrendingUp, TrendingDown, ClipboardList, List, BarChart3 } from 'lucide-react';

export function InventoryDashboard() {
  const { state, formatCurrency } = useAccounting();

  const activeItems = state.items.filter(i => i.is_active);
  const activeWarehouses = state.warehouses.filter(w => w.is_active);
  const totalStockValue = state.itemStock.reduce((s, st) => s + (st.quantity * st.average_cost), 0);
  const totalQty = state.itemStock.reduce((s, st) => s + st.quantity, 0);

  const lowStockItems = activeItems.filter(item => {
    const qty = state.itemStock.filter(s => s.item_id === item.id).reduce((s, st) => s + st.quantity, 0);
    return qty <= item.minimum_stock;
  });

  const outOfStockItems = activeItems.filter(item => {
    const qty = state.itemStock.filter(s => s.item_id === item.id).reduce((s, st) => s + st.quantity, 0);
    return qty === 0;
  });

  const warehouseBreakdown = activeWarehouses.map(w => {
    const stocks = state.itemStock.filter(s => s.warehouse_id === w.id);
    const value = stocks.reduce((s, st) => s + (st.quantity * st.average_cost), 0);
    const qty = stocks.reduce((s, st) => s + st.quantity, 0);
    const itemCount = stocks.filter(s => s.quantity > 0).length;
    return { ...w, value, qty, itemCount };
  });

  const topItems = activeItems
    .map(item => {
      const qty = state.itemStock.filter(s => s.item_id === item.id).reduce((s, st) => s + st.quantity, 0);
      const value = state.itemStock.filter(s => s.item_id === item.id).reduce((s, st) => s + (st.quantity * st.average_cost), 0);
      return { ...item, totalQty: qty, totalValue: value };
    })
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl flex items-center gap-2 text-foreground">
            <Package className="w-6 h-6 text-purple-600" /> لوحة تحكم المخازن والأصناف
          </h1>
          <p className="text-sm text-muted-foreground mt-1">ملخص المخزون والحركات</p>
        </div>
        <Link to="/inventory/manage" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
          <List className="w-4 h-4" /> إدارة المخازن والأصناف
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p className="text-xs text-purple-600 mb-1">إجمالي الأصناف</p>
          <p className="text-2xl text-purple-800">{activeItems.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-600 mb-1">المخازن النشطة</p>
          <p className="text-2xl text-blue-800">{activeWarehouses.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xs text-emerald-600 mb-1">قيمة المخزون</p>
          <p className="text-lg text-emerald-800">{formatCurrency(totalStockValue)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-xs text-amber-600 mb-1">أصناف تحت الحد</p>
          <p className="text-2xl text-amber-800">{lowStockItems.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-xs text-red-600 mb-1">أصناف نافدة</p>
          <p className="text-2xl text-red-800">{outOfStockItems.length}</p>
        </div>
      </div>

      {/* Warehouse Breakdown */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm text-foreground flex items-center gap-2"><Warehouse className="w-4 h-4 text-blue-600" /> توزيع المخزون حسب المخزن</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {warehouseBreakdown.map(w => (
            <div key={w.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm">
              <div>
                <span className="text-foreground">{w.name}</span>
                <span className="text-xs text-muted-foreground mr-2">({w.itemCount} صنف)</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-muted-foreground">{w.qty} وحدة</span>
                <span className="text-emerald-700">{formatCurrency(w.value)}</span>
              </div>
            </div>
          ))}
          {warehouseBreakdown.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد مخازن</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items by Value */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm text-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> أعلى الأصناف قيمة</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {topItems.map(item => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                <div>
                  <span className="text-foreground">{item.item_name}</span>
                  <span className="text-xs text-muted-foreground mr-2">({item.totalQty} {item.unit})</span>
                </div>
                <span className="text-emerald-700">{formatCurrency(item.totalValue)}</span>
              </div>
            ))}
            {topItems.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد أصناف</div>}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-50">
            <h3 className="text-sm text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> تنبيهات المخزون</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {lowStockItems.slice(0, 8).map(item => {
              const qty = state.itemStock.filter(s => s.item_id === item.id).reduce((s, st) => s + st.quantity, 0);
              return (
                <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                  <span className="text-foreground">{item.item_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">الحد: {item.minimum_stock}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${qty === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {qty === 0 ? 'نفد' : qty}
                    </span>
                  </div>
                </div>
              );
            })}
            {lowStockItems.length === 0 && <div className="px-4 py-6 text-center text-sm text-emerald-600">جميع الأصناف فوق الحد الأدنى</div>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: 'إدارة المخازن والأصناف', path: '/inventory/manage', icon: <Package className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
          { title: 'جرد المخزون', path: '/inventory/adjustment', icon: <ClipboardList className="w-5 h-5" />, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
          { title: 'فاتورة شراء', path: '/invoices', icon: <TrendingDown className="w-5 h-5" />, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
          { title: 'التقارير', path: '/reports', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
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
