import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Scale, TrendingUp, TrendingDown, Building2 } from 'lucide-react';

export function BalanceSheetPage() {
  const { getBalanceSheet, formatCurrency } = useAccounting();
  const bs = getBalanceSheet();

  const Section = ({ title, icon, items, total, color }: { title: string; icon: React.ReactNode; items: { id: string; code: string; name: string; balance: number }[]; total: number; color: string }) => (
    <div className={`bg-white border rounded-xl overflow-hidden`}>
      <div className={`px-4 py-3 ${color} flex items-center justify-between`}>
        <span className="flex items-center gap-2 text-sm font-medium">{icon} {title}</span>
        <span className="text-sm font-bold">{formatCurrency(total)}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
            <div className="flex items-center gap-2">
              {item.code && <span className="text-xs text-gray-400 font-mono">{item.code}</span>}
              <span className="text-gray-700">{item.name}</span>
            </div>
            <span className={`font-medium ${item.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
              {formatCurrency(item.balance)}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-gray-400">لا توجد بيانات</div>
        )}
      </div>
    </div>
  );

  const isBalanced = Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.totalEquity)) < 0.01;

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl flex items-center gap-2"><Scale className="w-6 h-6 text-blue-600" /> الميزانية العمومية</h1>
          <p className="text-sm text-gray-500 mt-1">المركز المالي حتى {new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm ${isBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {isBalanced ? 'الميزانية متوازنة ✓' : 'الميزانية غير متوازنة ✗'}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-sm text-blue-600 mb-1">إجمالي الأصول</div>
          <div className="text-2xl text-blue-800">{formatCurrency(bs.totalAssets)}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-sm text-red-600 mb-1">إجمالي الخصوم</div>
          <div className="text-2xl text-red-800">{formatCurrency(bs.totalLiabilities)}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-sm text-purple-600 mb-1">حقوق الملكية</div>
          <div className="text-2xl text-purple-800">{formatCurrency(bs.totalEquity)}</div>
        </div>
      </div>

      {/* Equation */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-center">
        <div className="text-sm text-gray-600 mb-2">المعادلة المحاسبية</div>
        <div className="flex items-center justify-center gap-4 text-lg">
          <span className="text-blue-700">{formatCurrency(bs.totalAssets)}</span>
          <span className="text-gray-400">=</span>
          <span className="text-red-700">{formatCurrency(bs.totalLiabilities)}</span>
          <span className="text-gray-400">+</span>
          <span className="text-purple-700">{formatCurrency(bs.totalEquity)}</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-1">
          <span>الأصول</span>
          <span></span>
          <span>الخصوم</span>
          <span></span>
          <span>حقوق الملكية</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Section title="الأصول" icon={<TrendingUp className="w-4 h-4" />} items={bs.assets} total={bs.totalAssets} color="bg-blue-50 text-blue-800" />
        </div>
        <div className="space-y-4">
          <Section title="الخصوم" icon={<TrendingDown className="w-4 h-4" />} items={bs.liabilities} total={bs.totalLiabilities} color="bg-red-50 text-red-800" />
          <Section title="حقوق الملكية" icon={<Building2 className="w-4 h-4" />} items={bs.equity} total={bs.totalEquity} color="bg-purple-50 text-purple-800" />
        </div>
      </div>
    </div>
  );
}
