import { useState } from 'react';
import { useManufacturing } from '../../context/ManufacturingContext';
import { useAccounting } from '../../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  Factory, Package, AlertTriangle, DollarSign, TrendingUp,
  Clock, CircleCheck, BarChart3, Loader2, Link, BookOpen, ArrowRightLeft
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export function ManufacturingDashboard() {
  const { products, invoices, stageWarehouses, departments, formatCurrency } = useManufacturing();
  const { state: accountingState } = useAccounting();

  const todayStr = '2026-02-21';
  const weekStart = '2026-02-15';

  // Stats
  const todayInvoices = invoices.filter(i => i.invoice_date === todayStr && i.status === 'confirmed');
  const todayProduction = todayInvoices.reduce((s, i) => s + i.total_quantity, 0);

  const weekInvoices = invoices.filter(i => i.invoice_date >= weekStart && i.status === 'confirmed');
  const weekProduction = weekInvoices.reduce((s, i) => s + i.total_quantity, 0);

  const wipQuantity = stageWarehouses.reduce((s, w) => s + w.available_quantity, 0);
  const totalMfgCost = invoices.filter(i => i.status === 'confirmed').reduce((s, i) => s + i.total_amount, 0);

  // Production by department chart data
  const deptProduction = departments.map(dept => {
    const deptInvoices = invoices.filter(i => i.department_id === dept.id && i.status === 'confirmed');
    return {
      name: dept.name.replace('قسم ', ''),
      الإنتاج: deptInvoices.reduce((s, i) => s + i.total_quantity, 0),
      التكلفة: deptInvoices.reduce((s, i) => s + i.total_amount, 0),
    };
  }).filter(d => d.الإنتاج > 0);

  // Cost breakdown
  const materialEstimate = products.filter(p => p.status === 'active').reduce((s, p) => s + p.estimated_cost * 0.6, 0);
  const laborEstimate = products.filter(p => p.status === 'active').reduce((s, p) => s + p.estimated_cost * 0.35, 0);
  const overheadEstimate = products.filter(p => p.status === 'active').reduce((s, p) => s + p.estimated_cost * 0.05, 0);
  const costBreakdown = [
    { name: 'المواد الخام', value: Math.round(materialEstimate), color: '#2563EB' },
    { name: 'تكلفة العمالة', value: Math.round(laborEstimate), color: '#10B981' },
    { name: 'مصاريف عامة', value: Math.round(overheadEstimate), color: '#F59E0B' },
  ];

  const recentInvoices = [...invoices].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8);

  const statusBadge = (status: string) => {
    if (status === 'confirmed') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">مؤكدة</Badge>;
    if (status === 'draft') return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">مسودة</Badge>;
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">معكوسة</Badge>;
  };

  // Accounting integration stats
  const mfgJournalEntries = accountingState.journalEntries.filter(
    e => e.source_type === 'manufacturing_invoice' || e.source_type === 'finished_goods_transfer'
  );
  const wipAccount = accountingState.accounts.find(a => a.id === 'mfg-wip');
  const fgAccount = accountingState.accounts.find(a => a.id === 'mfg-fg');
  const rawAccount = accountingState.accounts.find(a => a.id === 'mfg-raw');

  const wipBalance = accountingState.journalEntryLines
    .filter(l => l.account_id === 'mfg-wip')
    .reduce((s, l) => s + l.debit - l.credit, 0);
  const fgBalance = accountingState.journalEntryLines
    .filter(l => l.account_id === 'mfg-fg')
    .reduce((s, l) => s + l.debit - l.credit, 0);
  const rawBalance = accountingState.journalEntryLines
    .filter(l => l.account_id === 'mfg-raw')
    .reduce((s, l) => s + l.debit - l.credit, 0);
  const finishedGoodsInventoryValue = accountingState.itemStock
    .filter(s => s.warehouse_id === 'w-fg')
    .reduce((sum, s) => sum + s.quantity * s.average_cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] text-foreground" style={{ fontWeight: 700 }}>لوحة تحكم التصنيع</h1>
        <p className="text-[13px] text-muted-foreground mt-1">نظرة عامة على عمليات التصنيع والإنتاج</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-blue-600 mb-1">إنتاج اليوم</p>
                <p className="text-[28px] text-blue-800" style={{ fontWeight: 700 }}>{todayProduction}</p>
                <p className="text-[11px] text-blue-500 mt-1">قطعة منتجة</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Factory className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-emerald-600 mb-1">إنتاج الأسبوع</p>
                <p className="text-[28px] text-emerald-800" style={{ fontWeight: 700 }}>{weekProduction}</p>
                <p className="text-[11px] text-emerald-500 mt-1">قطعة منتجة</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-amber-600 mb-1">قيد التصنيع</p>
                <p className="text-[28px] text-amber-800" style={{ fontWeight: 700 }}>{wipQuantity}</p>
                <p className="text-[11px] text-amber-500 mt-1">قطعة في المراحل</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #FEF2F2, #FECACA)' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-red-600 mb-1">تكلفة التصنيع</p>
                <p className="text-[28px] text-red-800" style={{ fontWeight: 700 }}>{formatCurrency(totalMfgCost)}</p>
                <p className="text-[11px] text-red-500 mt-1">إجمالي الفترة</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounting Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm border-2 border-blue-200">
          <CardHeader className="pb-2 bg-blue-50">
            <CardTitle className="text-[13px] flex items-center gap-2 text-blue-700">
              <BookOpen className="w-4 h-4" />
              الحسابات المرتبطة
              <Badge className="bg-blue-100 text-blue-700 text-[10px]">مباشر</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-[12px] py-1.5 border-b">
              <div>
                <span className="text-muted-foreground">مواد خام للتصنيع</span>
                <span className="text-[10px] text-muted-foreground mr-1">(1107-001)</span>
              </div>
              <span className={`${rawBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`} style={{ fontWeight: 600 }}>
                {formatCurrency(rawBalance >= 0 ? rawBalance + 15000 : 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px] py-1.5 border-b">
              <div>
                <span className="text-muted-foreground">إنتاج تحت التشغيل</span>
                <span className="text-[10px] text-muted-foreground mr-1">(1107-002)</span>
              </div>
              <span className="text-amber-700" style={{ fontWeight: 600 }}>{formatCurrency(wipBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-[12px] py-1.5">
              <div>
                <span className="text-muted-foreground">مخزون منتجات تامة</span>
                <span className="text-[10px] text-muted-foreground mr-1">(1107-003)</span>
              </div>
              <span className="text-emerald-700" style={{ fontWeight: 600 }}>{formatCurrency(fgBalance)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-2 border-emerald-200">
          <CardHeader className="pb-2 bg-emerald-50">
            <CardTitle className="text-[13px] flex items-center gap-2 text-emerald-700">
              <Package className="w-4 h-4" />
              مخزون المنتجات التامة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {accountingState.items.filter(i => i.category_id === 'ic-mfg-fg').map(item => {
              const stock = accountingState.itemStock.find(s => s.item_id === item.id && s.warehouse_id === 'w-fg');
              const qty = stock?.quantity || 0;
              return (
                <div key={item.id} className="flex items-center justify-between text-[12px] py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground truncate max-w-[150px]">{item.item_name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`${qty === 0 ? 'text-muted-foreground' : 'text-emerald-700'}`} style={{ fontWeight: 700 }}>
                      {qty} {item.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-2 border-purple-200">
          <CardHeader className="pb-2 bg-purple-50">
            <CardTitle className="text-[13px] flex items-center gap-2 text-purple-700">
              <ArrowRightLeft className="w-4 h-4" />
              قيود التصنيع المحاسبية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center mb-3">
              <p className="text-[32px] text-purple-700" style={{ fontWeight: 700 }}>{mfgJournalEntries.length}</p>
              <p className="text-[11px] text-muted-foreground">قيد تصنيع مسجل</p>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">فواتير إنتاج</span>
                <span style={{ fontWeight: 600 }}>{mfgJournalEntries.filter(e => e.source_type === 'manufacturing_invoice').length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">تحويلات للمخزون</span>
                <span style={{ fontWeight: 600 }}>{mfgJournalEntries.filter(e => e.source_type === 'finished_goods_transfer').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production by Department */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              الإنتاج حسب القسم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={deptProduction} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, fontFamily: 'Cairo', direction: 'rtl' }}
                    formatter={(value: number) => [value, '']}
                  />
                  <Bar dataKey="الإنتاج" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              توزيع التكاليف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    style={{ fontSize: 11 }}
                  >
                    {costBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, fontFamily: 'Cairo', direction: 'rtl' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            آخر فواتير الإنتاج
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-right text-[12px] pr-4">رقم الفاتورة</TableHead>
                  <TableHead className="text-right text-[12px]">العامل</TableHead>
                  <TableHead className="text-right text-[12px]">القسم</TableHead>
                  <TableHead className="text-right text-[12px]">المرحلة</TableHead>
                  <TableHead className="text-center text-[12px]">الكمية</TableHead>
                  <TableHead className="text-center text-[12px]">التالف</TableHead>
                  <TableHead className="text-left text-[12px]">المبلغ</TableHead>
                  <TableHead className="text-center text-[12px]">التاريخ</TableHead>
                  <TableHead className="text-center text-[12px]">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map(inv => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-[12px] pr-4" style={{ fontWeight: 500 }}>{inv.invoice_number}</TableCell>
                    <TableCell className="text-[12px]">{inv.worker_name}</TableCell>
                    <TableCell className="text-[12px]">{inv.department_name}</TableCell>
                    <TableCell className="text-[12px]">{inv.stage_name}</TableCell>
                    <TableCell className="text-[12px] text-center">{inv.total_quantity}</TableCell>
                    <TableCell className="text-[12px] text-center">
                      <span className={inv.total_defective > 0 ? 'text-red-600' : 'text-muted-foreground'}>
                        {inv.total_defective}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(inv.total_amount)}</TableCell>
                    <TableCell className="text-[12px] text-center">{inv.invoice_date}</TableCell>
                    <TableCell className="text-center">{statusBadge(inv.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}