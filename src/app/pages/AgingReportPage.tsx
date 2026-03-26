import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Clock, Users, Package } from 'lucide-react';

export function AgingReportPage() {
  const { getAgingReport, formatCurrency } = useAccounting();
  const [contactType, setContactType] = useState<'customer' | 'supplier'>('customer');

  const report = getAgingReport(contactType);
  const totals = report.reduce((acc, r) => ({
    current: acc.current + r.current,
    days_30: acc.days_30 + r.days_30,
    days_60: acc.days_60 + r.days_60,
    days_90: acc.days_90 + r.days_90,
    over_90: acc.over_90 + r.over_90,
    total: acc.total + r.total,
  }), { current: 0, days_30: 0, days_60: 0, days_90: 0, over_90: 0, total: 0 });

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl flex items-center gap-2"><Clock className="w-6 h-6 text-amber-600" /> تقرير أعمار الديون</h1>
          <p className="text-sm text-gray-500 mt-1">تصنيف الأرصدة المستحقة حسب العمر</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setContactType('customer')} className={`px-4 py-2 rounded-lg text-sm transition-colors ${contactType === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> العملاء</span>
          </button>
          <button onClick={() => setContactType('supplier')} className={`px-4 py-2 rounded-lg text-sm transition-colors ${contactType === 'supplier' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> الموردين</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'جاري (0-30)', value: totals.current, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: '31-60 يوم', value: totals.days_30, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          { label: '61-90 يوم', value: totals.days_60, color: 'bg-orange-50 text-orange-700 border-orange-200' },
          { label: '91-120 يوم', value: totals.days_90, color: 'bg-red-50 text-red-700 border-red-200' },
          { label: 'أكثر من 120', value: totals.over_90, color: 'bg-red-100 text-red-800 border-red-300' },
          { label: 'الإجمالي', value: totals.total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        ].map((card, i) => (
          <div key={i} className={`border rounded-xl p-3 text-center ${card.color}`}>
            <div className="text-xs mb-1">{card.label}</div>
            <div className="text-lg font-bold">{formatCurrency(card.value)}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 text-gray-600">{contactType === 'customer' ? 'العميل' : 'المورد'}</th>
                <th className="text-center px-3 py-3 text-gray-600">جاري (0-30)</th>
                <th className="text-center px-3 py-3 text-gray-600">31-60</th>
                <th className="text-center px-3 py-3 text-gray-600">61-90</th>
                <th className="text-center px-3 py-3 text-gray-600">91-120</th>
                <th className="text-center px-3 py-3 text-gray-600">+120</th>
                <th className="text-center px-3 py-3 text-gray-600 font-bold">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.map(row => (
                <tr key={row.contact_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{row.contact_name}</td>
                  <td className="text-center px-3 py-3">{row.current > 0 ? formatCurrency(row.current) : '-'}</td>
                  <td className="text-center px-3 py-3 text-yellow-700">{row.days_30 > 0 ? formatCurrency(row.days_30) : '-'}</td>
                  <td className="text-center px-3 py-3 text-orange-700">{row.days_60 > 0 ? formatCurrency(row.days_60) : '-'}</td>
                  <td className="text-center px-3 py-3 text-red-600">{row.days_90 > 0 ? formatCurrency(row.days_90) : '-'}</td>
                  <td className="text-center px-3 py-3 text-red-800 font-bold">{row.over_90 > 0 ? formatCurrency(row.over_90) : '-'}</td>
                  <td className="text-center px-3 py-3 font-bold text-gray-800">{formatCurrency(row.total)}</td>
                </tr>
              ))}
              {report.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">لا توجد أرصدة مستحقة</td></tr>
              )}
              {report.length > 0 && (
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3">الإجمالي</td>
                  <td className="text-center px-3 py-3">{formatCurrency(totals.current)}</td>
                  <td className="text-center px-3 py-3 text-yellow-700">{formatCurrency(totals.days_30)}</td>
                  <td className="text-center px-3 py-3 text-orange-700">{formatCurrency(totals.days_60)}</td>
                  <td className="text-center px-3 py-3 text-red-600">{formatCurrency(totals.days_90)}</td>
                  <td className="text-center px-3 py-3 text-red-800">{formatCurrency(totals.over_90)}</td>
                  <td className="text-center px-3 py-3 text-blue-700">{formatCurrency(totals.total)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
