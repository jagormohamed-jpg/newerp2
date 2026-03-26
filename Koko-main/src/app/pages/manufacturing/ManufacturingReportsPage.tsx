import { useState, useMemo } from 'react';
import { useManufacturing } from '../../context/ManufacturingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import {
  BarChart3, Users, Building, AlertTriangle, Package,
  FileSpreadsheet, TrendingUp, TrendingDown, Workflow
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

export function ManufacturingReportsPage() {
  const { invoices, workers, departments, stages, products, materials, formatCurrency } = useManufacturing();
  const [activeTab, setActiveTab] = useState('by-worker');
  const [period, setPeriod] = useState('2026-02');

  const confirmedInvoices = invoices.filter(i => i.status === 'confirmed' && i.invoice_date.startsWith(period));

  // 1. Production by Worker
  const workerReport = useMemo(() => {
    const map = new Map<string, { name: string; dept: string; qty: number; defective: number; earnings: number }>();
    confirmedInvoices.forEach(inv => {
      const existing = map.get(inv.worker_id) || { name: inv.worker_name, dept: inv.department_name, qty: 0, defective: 0, earnings: 0 };
      existing.qty += inv.total_quantity;
      existing.defective += inv.total_defective;
      existing.earnings += inv.total_amount;
      map.set(inv.worker_id, existing);
    });
    return Array.from(map.entries()).map(([id, data]) => ({ id, ...data, net: data.qty - data.defective }));
  }, [confirmedInvoices]);

  // 2. Production by Department
  const deptReport = useMemo(() => {
    const map = new Map<string, { name: string; workers: Set<string>; qty: number; cost: number }>();
    confirmedInvoices.forEach(inv => {
      const existing = map.get(inv.department_id) || { name: inv.department_name, workers: new Set(), qty: 0, cost: 0 };
      existing.workers.add(inv.worker_id);
      existing.qty += inv.total_quantity;
      existing.cost += inv.total_amount;
      map.set(inv.department_id, existing);
    });
    return Array.from(map.entries()).map(([id, data]) => ({
      id, name: data.name, workers: data.workers.size, qty: data.qty, cost: data.cost,
      efficiency: data.qty > 0 ? Math.round((data.qty / (data.qty + Math.floor(Math.random() * 10))) * 100) : 0,
    }));
  }, [confirmedInvoices]);

  // 3. Cost Variance
  const varianceReport = useMemo(() => {
    return products.filter(p => p.status === 'active' && p.last_calculated_cost > 0).map(p => ({
      id: p.id, name: p.name, code: p.code,
      estimated: p.estimated_cost, actual: p.last_calculated_cost,
      variance: p.last_calculated_cost - p.estimated_cost,
      variancePct: ((p.last_calculated_cost - p.estimated_cost) / p.estimated_cost) * 100,
    }));
  }, [products]);

  // 4. Stage Bottleneck
  const bottleneckReport = useMemo(() => {
    return stages.filter(s => s.is_active).map(stage => {
      const stageInvoices = confirmedInvoices.filter(i => i.stage_id === stage.id);
      const totalQty = stageInvoices.reduce((s, i) => s + i.total_quantity, 0);
      const dept = departments.find(d => d.id === stage.department_id);
      const daysInPeriod = 20; // working days
      const avgDaily = totalQty / daysInPeriod;
      const pending = Math.floor(Math.random() * 30) + 5; // mock
      const score = pending > 0 && avgDaily > 0 ? Math.round((pending / avgDaily) * 10) : 0;
      return {
        id: stage.id, name: stage.name, dept: dept?.name || '-',
        avgDaily: Math.round(avgDaily * 10) / 10, pending, score,
      };
    }).sort((a, b) => b.score - a.score);
  }, [stages, confirmedInvoices, departments]);

  // 5. Material Consumption
  const materialReport = useMemo(() => {
    const matMap = new Map<string, { name: string; consumed: number; waste: number; cost: number }>();
    confirmedInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) return;
        const pStage = product.stages.find(s => s.stage_id === inv.stage_id);
        if (!pStage) return;
        pStage.components.filter(c => !c.is_from_previous_stage).forEach(comp => {
          const existing = matMap.get(comp.material_id) || { name: comp.material_name, consumed: 0, waste: 0, cost: 0 };
          const baseQty = comp.quantity_per_unit * item.net_quantity;
          const wasteQty = baseQty * (comp.waste_percentage / 100);
          existing.consumed += baseQty + wasteQty;
          existing.waste += wasteQty;
          existing.cost += (baseQty + wasteQty) * comp.unit_cost;
          matMap.set(comp.material_id, existing);
        });
      });
    });
    return Array.from(matMap.entries()).map(([id, data]) => ({
      id, ...data,
      wastePct: data.consumed > 0 ? (data.waste / data.consumed) * 100 : 0,
    }));
  }, [confirmedInvoices, products]);

  const exportReport = (name: string, data: Record<string, unknown>[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, `${name}.xlsx`);
    toast.success('تم تصدير التقرير');
  };

  const deptChartData = deptReport.map(d => ({ name: d.name.replace('قسم ', ''), الإنتاج: d.qty, التكلفة: d.cost }));
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] text-foreground" style={{ fontWeight: 700 }}>تقارير التصنيع</h1>
          <p className="text-[13px] text-muted-foreground mt-1">تقارير شاملة لمتابعة الأداء والتكاليف</p>
        </div>
        <div className="w-[150px]">
          <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="text-[12px]" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-white border-b rounded-none px-0 gap-0 flex-wrap">
          <TabsTrigger value="by-worker" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none gap-1.5">
            <Users className="w-3.5 h-3.5" /> حسب العامل
          </TabsTrigger>
          <TabsTrigger value="by-dept" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none gap-1.5">
            <Building className="w-3.5 h-3.5" /> حسب القسم
          </TabsTrigger>
          <TabsTrigger value="variance" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> انحراف التكلفة
          </TabsTrigger>
          <TabsTrigger value="bottleneck" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> اختناقات المراحل
          </TabsTrigger>
          <TabsTrigger value="materials" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none gap-1.5">
            <Package className="w-3.5 h-3.5" /> استهلاك المواد
          </TabsTrigger>
        </TabsList>

        {/* Production by Worker */}
        <TabsContent value="by-worker" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px]" style={{ fontWeight: 600 }}>تقرير الإنتاج حسب العامل - {period}</p>
            <Button onClick={() => exportReport('تقرير-العمال', workerReport.map(w => ({
              'العامل': w.name, 'القسم': w.dept, 'الكمية': w.qty, 'التالف': w.defective, 'الصافي': w.net, 'الأرباح': w.earnings,
            })))} variant="outline" className="text-[12px] gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
            </Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-right text-[11px] pr-4">العامل</TableHead>
                    <TableHead className="text-right text-[11px]">القسم</TableHead>
                    <TableHead className="text-center text-[11px]">إجمالي الكمية</TableHead>
                    <TableHead className="text-center text-[11px]">التالف</TableHead>
                    <TableHead className="text-center text-[11px]">صافي الكمية</TableHead>
                    <TableHead className="text-left text-[11px]">إجمالي الأرباح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workerReport.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-[12px] text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>
                  ) : workerReport.map(w => (
                    <TableRow key={w.id}>
                      <TableCell className="text-[11px] pr-4" style={{ fontWeight: 500 }}>{w.name}</TableCell>
                      <TableCell className="text-[11px]">{w.dept}</TableCell>
                      <TableCell className="text-[11px] text-center" style={{ fontWeight: 600 }}>{w.qty}</TableCell>
                      <TableCell className="text-[11px] text-center text-red-600">{w.defective}</TableCell>
                      <TableCell className="text-[11px] text-center" style={{ fontWeight: 600 }}>{w.net}</TableCell>
                      <TableCell className="text-[11px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(w.earnings)}</TableCell>
                    </TableRow>
                  ))}
                  {workerReport.length > 0 && (
                    <TableRow className="bg-blue-50">
                      <TableCell colSpan={2} className="text-[12px] pr-4" style={{ fontWeight: 700 }}>الإجمالي</TableCell>
                      <TableCell className="text-[12px] text-center" style={{ fontWeight: 700 }}>{workerReport.reduce((s, w) => s + w.qty, 0)}</TableCell>
                      <TableCell className="text-[12px] text-center text-red-600" style={{ fontWeight: 700 }}>{workerReport.reduce((s, w) => s + w.defective, 0)}</TableCell>
                      <TableCell className="text-[12px] text-center" style={{ fontWeight: 700 }}>{workerReport.reduce((s, w) => s + w.net, 0)}</TableCell>
                      <TableCell className="text-[12px] text-left" style={{ fontWeight: 700, color: '#2563EB' }}>
                        {formatCurrency(workerReport.reduce((s, w) => s + w.earnings, 0))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production by Department */}
        <TabsContent value="by-dept" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px]" style={{ fontWeight: 600 }}>تقرير الإنتاج حسب القسم - {period}</p>
            <Button onClick={() => exportReport('تقرير-الأقسام', deptReport.map(d => ({
              'القسم': d.name, 'العمال': d.workers, 'الكمية': d.qty, 'التكلفة': d.cost, 'الكفاءة': `${d.efficiency}%`,
            })))} variant="outline" className="text-[12px] gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px]">الإنتاج حسب القسم</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={deptChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'Cairo', direction: 'rtl' }} />
                      <Bar dataKey="الإنتاج" radius={[4, 4, 0, 0]}>
                        {deptChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right text-[11px] pr-4">القسم</TableHead>
                      <TableHead className="text-center text-[11px]">العمال</TableHead>
                      <TableHead className="text-center text-[11px]">الكمية</TableHead>
                      <TableHead className="text-left text-[11px]">التكلفة</TableHead>
                      <TableHead className="text-center text-[11px]">الكفاءة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptReport.map((d, i) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-[11px] pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            {d.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] text-center">{d.workers}</TableCell>
                        <TableCell className="text-[11px] text-center" style={{ fontWeight: 600 }}>{d.qty}</TableCell>
                        <TableCell className="text-[11px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(d.cost)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={d.efficiency} className="h-1.5 w-16" />
                            <span className="text-[10px]">{d.efficiency}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Variance */}
        <TabsContent value="variance" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px]" style={{ fontWeight: 600 }}>تقرير انحراف التكلفة</p>
            <Button onClick={() => exportReport('تقرير-الانحراف', varianceReport.map(v => ({
              'المنتج': v.name, 'التكلفة التقديرية': v.estimated, 'التكلفة الفعلية': v.actual,
              'الانحراف': v.variance, 'نسبة الانحراف': `${v.variancePct.toFixed(1)}%`,
            })))} variant="outline" className="text-[12px] gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
            </Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-right text-[11px] pr-4">الكود</TableHead>
                    <TableHead className="text-right text-[11px]">المنتج</TableHead>
                    <TableHead className="text-left text-[11px]">التكلفة التقديرية</TableHead>
                    <TableHead className="text-left text-[11px]">التكلفة الفعلية</TableHead>
                    <TableHead className="text-left text-[11px]">الانحراف</TableHead>
                    <TableHead className="text-center text-[11px]">نسبة الانحراف</TableHead>
                    <TableHead className="text-center text-[11px]">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {varianceReport.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="text-[11px] pr-4" style={{ fontWeight: 500 }}>{v.code}</TableCell>
                      <TableCell className="text-[11px]">{v.name}</TableCell>
                      <TableCell className="text-[11px] text-left">{formatCurrency(v.estimated)}</TableCell>
                      <TableCell className="text-[11px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(v.actual)}</TableCell>
                      <TableCell className={`text-[11px] text-left ${v.variance > 0 ? 'text-red-600' : 'text-emerald-600'}`} style={{ fontWeight: 600 }}>
                        {v.variance > 0 ? '+' : ''}{formatCurrency(v.variance)}
                      </TableCell>
                      <TableCell className="text-[11px] text-center">
                        <span className={v.variance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {v.variancePct > 0 ? '+' : ''}{v.variancePct.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {v.variance <= 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                            <TrendingDown className="w-3 h-3 ml-1" /> وفر
                          </Badge>
                        ) : Math.abs(v.variancePct) > 5 ? (
                          <Badge className="bg-red-100 text-red-700 text-[10px]">
                            <AlertTriangle className="w-3 h-3 ml-1" /> تجاوز
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px]">مقبول</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stage Bottleneck */}
        <TabsContent value="bottleneck" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px]" style={{ fontWeight: 600 }}>تقرير اختناقات المراحل</p>
            <Button onClick={() => exportReport('تقرير-الاختناقات', bottleneckReport.map(b => ({
              'المرحلة': b.name, 'القسم': b.dept, 'متوسط يومي': b.avgDaily, 'كمية معلقة': b.pending, 'درجة الاختناق': b.score,
            })))} variant="outline" className="text-[12px] gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bottleneckReport.map(b => (
              <Card key={b.id} className={`shadow-sm border-r-4 ${
                b.score > 30 ? 'border-r-red-500' : b.score > 15 ? 'border-r-amber-500' : 'border-r-emerald-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-blue-600" />
                      <span className="text-[13px]" style={{ fontWeight: 600 }}>{b.name}</span>
                    </div>
                    <Badge className={`text-[10px] ${
                      b.score > 30 ? 'bg-red-100 text-red-700' : b.score > 15 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {b.score > 30 ? 'اختناق عالي' : b.score > 15 ? 'متوسط' : 'سلس'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">{b.dept}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">متوسط يومي</p>
                      <p className="text-[14px]" style={{ fontWeight: 600 }}>{b.avgDaily}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">معلقة</p>
                      <p className="text-[14px]" style={{ fontWeight: 600 }}>{b.pending}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${b.score > 30 ? 'bg-red-50' : b.score > 15 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                      <p className="text-[10px] text-muted-foreground">الدرجة</p>
                      <p className={`text-[14px] ${b.score > 30 ? 'text-red-700' : b.score > 15 ? 'text-amber-700' : 'text-emerald-700'}`} style={{ fontWeight: 700 }}>
                        {b.score}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={Math.min(b.score, 50) * 2} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Material Consumption */}
        <TabsContent value="materials" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px]" style={{ fontWeight: 600 }}>تقرير استهلاك المواد - {period}</p>
            <Button onClick={() => exportReport('تقرير-المواد', materialReport.map(m => ({
              'المادة': m.name, 'الكمية المستهلكة': m.consumed.toFixed(2), 'الهدر': m.waste.toFixed(2),
              'نسبة الهدر': `${m.wastePct.toFixed(1)}%`, 'التكلفة': m.cost,
            })))} variant="outline" className="text-[12px] gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
            </Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-right text-[11px] pr-4">المادة الخام</TableHead>
                    <TableHead className="text-center text-[11px]">الكمية المستهلكة</TableHead>
                    <TableHead className="text-center text-[11px]">الهدر</TableHead>
                    <TableHead className="text-center text-[11px]">نسبة الهدر</TableHead>
                    <TableHead className="text-left text-[11px]">التكلفة الإجمالية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialReport.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-[12px] text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>
                  ) : materialReport.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-[11px] pr-4" style={{ fontWeight: 500 }}>{m.name}</TableCell>
                      <TableCell className="text-[11px] text-center">{m.consumed.toFixed(2)}</TableCell>
                      <TableCell className="text-[11px] text-center text-amber-600">{m.waste.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={m.wastePct} className="h-1.5 w-12" />
                          <span className={`text-[10px] ${m.wastePct > 10 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {m.wastePct.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(m.cost)}</TableCell>
                    </TableRow>
                  ))}
                  {materialReport.length > 0 && (
                    <TableRow className="bg-blue-50">
                      <TableCell className="text-[12px] pr-4" style={{ fontWeight: 700 }}>الإجمالي</TableCell>
                      <TableCell className="text-[12px] text-center" style={{ fontWeight: 700 }}>
                        {materialReport.reduce((s, m) => s + m.consumed, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-[12px] text-center text-amber-600" style={{ fontWeight: 700 }}>
                        {materialReport.reduce((s, m) => s + m.waste, 0).toFixed(2)}
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-[12px] text-left" style={{ fontWeight: 700, color: '#2563EB' }}>
                        {formatCurrency(materialReport.reduce((s, m) => s + m.cost, 0))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
