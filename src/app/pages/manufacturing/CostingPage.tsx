import { useState, useMemo } from 'react';
import { useManufacturing } from '../../context/ManufacturingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
  DollarSign, Calculator, TrendingUp, TrendingDown, Package,
  RefreshCcw, ArrowUpDown, AlertTriangle, CircleCheck, History,
  FileSpreadsheet, Send
} from 'lucide-react';
import { toast } from 'sonner';
import type { StageType } from '../../types/manufacturing';
import * as XLSX from 'xlsx';

const stageTypeLabels: Record<StageType, string> = { piece_rate: 'بالقطعة', hourly: 'بالساعة', weekly: 'أسبوعي' };

export function CostingPage() {
  const { products, stages, departments, invoices, costHistory, recalculateCost, formatCurrency } = useManufacturing();
  const [selectedProductId, setSelectedProductId] = useState(products.length > 0 ? products[0].id : '');
  const [periodFilter, setPeriodFilter] = useState('2026-02');
  const [deptFilter, setDeptFilter] = useState('all');
  const [calcMethod, setCalcMethod] = useState<'latest_prices' | 'historical_prices'>('latest_prices');
  const [activeTab, setActiveTab] = useState('analysis');

  // Overhead inputs
  const [electricity, setElectricity] = useState(500);
  const [maintenance, setMaintenance] = useState(300);
  const [rent, setRent] = useState(1000);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Calculate material cost details
  const materialDetails = useMemo(() => {
    if (!selectedProduct) return [];
    return selectedProduct.stages.flatMap(stage =>
      stage.components
        .filter(c => !c.is_from_previous_stage)
        .map(c => ({
          material: c.material_name,
          qty: c.quantity_per_unit * (1 + c.waste_percentage / 100),
          unitCost: c.unit_cost,
          total: c.quantity_per_unit * (1 + c.waste_percentage / 100) * c.unit_cost,
          stage: stage.stage_name,
        }))
    );
  }, [selectedProduct]);

  const totalMaterialCost = materialDetails.reduce((s, d) => s + d.total, 0);

  // Calculate labor cost details
  const laborDetails = useMemo(() => {
    if (!selectedProduct) return [];
    return selectedProduct.stages.map(stage => {
      if (stage.stage_type === 'piece_rate') {
        const stageInvoices = invoices.filter(i =>
          i.stage_id === stage.stage_id && i.status === 'confirmed' && i.invoice_date.startsWith(periodFilter)
        );
        const totalQty = stageInvoices.reduce((s, i) =>
          s + i.items.filter(item => item.product_id === selectedProduct.id).reduce((is, item) => is + item.net_quantity, 0), 0
        );
        return {
          stageId: stage.stage_id,
          stageName: stage.stage_name,
          stageType: stage.stage_type,
          quantity: totalQty || 50, // mock
          pricePerPiece: stage.production_price,
          pieceRateCost: (totalQty || 50) * stage.production_price,
          departmentPayroll: 0,
          totalDeptUnits: 0,
          allocationRate: 0,
          productUnits: 0,
          allocatedCost: 0,
          totalLaborCost: (totalQty || 50) * stage.production_price,
        };
      } else {
        // Hourly/weekly allocation
        const deptStage = stages.find(s => s.id === stage.stage_id);
        const deptPayroll = deptStage?.department_cost_allocation || 8000;
        const totalDeptUnits = 200; // mock: all units produced in dept during period
        const productUnits = 50; // mock: units of this product
        const allocationRate = deptPayroll / totalDeptUnits;
        const allocated = allocationRate * productUnits;
        return {
          stageId: stage.stage_id,
          stageName: stage.stage_name,
          stageType: stage.stage_type,
          quantity: productUnits,
          pricePerPiece: 0,
          pieceRateCost: 0,
          departmentPayroll: deptPayroll,
          totalDeptUnits: totalDeptUnits,
          allocationRate: allocationRate,
          productUnits: productUnits,
          allocatedCost: allocated,
          totalLaborCost: allocated,
        };
      }
    });
  }, [selectedProduct, invoices, stages, periodFilter]);

  const totalLaborCost = laborDetails.reduce((s, d) => s + d.totalLaborCost, 0);
  const laborPerUnit = selectedProduct && totalLaborCost > 0
    ? totalLaborCost / (laborDetails[0]?.quantity || 1)
    : selectedProduct?.stages.reduce((s, st) => s + st.production_price, 0) || 0;

  const totalOverhead = electricity + maintenance + rent;
  const overheadPerUnit = totalOverhead / (laborDetails[0]?.quantity || 50);

  const totalCostPerUnit = totalMaterialCost + laborPerUnit + overheadPerUnit;
  const margin = selectedProduct ? selectedProduct.selling_price - totalCostPerUnit : 0;
  const marginPct = selectedProduct && selectedProduct.selling_price > 0
    ? (margin / selectedProduct.selling_price) * 100 : 0;

  const productCostHistory = costHistory.filter(ch => ch.product_id === selectedProductId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleRecalculate = () => {
    if (!selectedProductId) return;
    recalculateCost(selectedProductId, calcMethod);
    toast.success('تم إعادة حساب التكلفة بنجاح');
  };

  const handlePushToInventory = () => {
    toast.success('تم إرسال التكلفة لمديول المخزون');
  };

  const exportToExcel = () => {
    if (!selectedProduct) return;
    const data = [
      { 'البند': 'تكلفة المواد الخام', 'المبلغ': totalMaterialCost },
      { 'البند': 'تكلفة العمالة (لكل وحدة)', 'المبلغ': laborPerUnit },
      { 'البند': 'المصاريف العامة (لكل وحدة)', 'المبلغ': overheadPerUnit },
      { 'البند': 'التكلفة الإجمالية لكل وحدة', 'المبلغ': totalCostPerUnit },
      { 'البند': 'سعر البيع', 'المبلغ': selectedProduct.selling_price },
      { 'البند': 'هامش الربح', 'المبلغ': margin },
      { 'البند': 'نسبة الربح %', 'المبلغ': marginPct },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التكاليف');
    XLSX.writeFile(wb, `costing-${selectedProduct.code}.xlsx`);
    toast.success('تم تصدير البيانات');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] text-foreground" style={{ fontWeight: 700 }}>قسم التكاليف</h1>
          <p className="text-[13px] text-muted-foreground mt-1">حساب التكلفة الحقيقية للمنتجات وتحليل الربحية</p>
        </div>
        <Button onClick={exportToExcel} variant="outline" className="text-[12px] gap-1.5">
          <FileSpreadsheet className="w-4 h-4" /> تصدير
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[11px] text-muted-foreground block mb-1">المنتج</label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="text-[12px]"><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.status === 'active').map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <label className="text-[11px] text-muted-foreground block mb-1">الفترة</label>
              <Input type="month" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="text-[12px]" />
            </div>
            <div className="w-[180px]">
              <label className="text-[11px] text-muted-foreground block mb-1">طريقة الحساب</label>
              <Select value={calcMethod} onValueChange={v => setCalcMethod(v as 'latest_prices' | 'historical_prices')}>
                <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest_prices">بأحدث الأسعار</SelectItem>
                  <SelectItem value="historical_prices">بالأسعار التاريخية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-5">
              <Button onClick={handleRecalculate} className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1.5">
                <RefreshCcw className="w-4 h-4" /> تحديث التكلفة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProduct && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start bg-white border-b rounded-none px-0 gap-0">
            <TabsTrigger value="analysis" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">تحليل التكلفة</TabsTrigger>
            <TabsTrigger value="history" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">سجل التكلفة</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6 mt-4">
            {/* Final Cost Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-[11px] text-blue-600 mb-1">تكلفة المواد / وحدة</p>
                  <p className="text-[24px] text-blue-800" style={{ fontWeight: 700 }}>{formatCurrency(totalMaterialCost)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                <CardContent className="p-4 text-center">
                  <Calculator className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                  <p className="text-[11px] text-emerald-600 mb-1">تكلفة العمالة / وحدة</p>
                  <p className="text-[24px] text-emerald-800" style={{ fontWeight: 700 }}>{formatCurrency(laborPerUnit)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="p-4 text-center">
                  <Package className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                  <p className="text-[11px] text-amber-600 mb-1">مصاريف عامة / وحدة</p>
                  <p className="text-[24px] text-amber-800" style={{ fontWeight: 700 }}>{formatCurrency(overheadPerUnit)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-[11px] text-purple-600 mb-1">التكلفة الإجمالية / وحدة</p>
                  <p className="text-[24px] text-purple-800" style={{ fontWeight: 700 }}>{formatCurrency(totalCostPerUnit)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Section A: Material Cost */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]" style={{ fontWeight: 700 }}>A</div>
                  تكلفة المواد الخام
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right text-[11px] pr-4">المادة</TableHead>
                      <TableHead className="text-right text-[11px]">المرحلة</TableHead>
                      <TableHead className="text-center text-[11px]">الكمية المستخدمة</TableHead>
                      <TableHead className="text-center text-[11px]">سعر الوحدة</TableHead>
                      <TableHead className="text-left text-[11px]">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialDetails.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-[11px] pr-4" style={{ fontWeight: 500 }}>{d.material}</TableCell>
                        <TableCell className="text-[11px]">{d.stage}</TableCell>
                        <TableCell className="text-[11px] text-center">{d.qty.toFixed(3)}</TableCell>
                        <TableCell className="text-[11px] text-center">{formatCurrency(d.unitCost)}</TableCell>
                        <TableCell className="text-[11px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(d.total)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50">
                      <TableCell colSpan={4} className="text-[12px] pr-4" style={{ fontWeight: 700 }}>إجمالي تكلفة المواد</TableCell>
                      <TableCell className="text-[12px] text-left" style={{ fontWeight: 700, color: '#2563EB' }}>
                        {formatCurrency(totalMaterialCost)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Section B: Labor Cost */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]" style={{ fontWeight: 700 }}>B</div>
                  تكلفة العمالة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {laborDetails.map((detail, idx) => (
                  <div key={detail.stageId} className={idx > 0 ? 'border-t' : ''}>
                    <div className="px-4 py-3 bg-slate-50 flex items-center gap-2">
                      <Badge className={`text-[10px] ${detail.stageType === 'piece_rate' ? 'bg-blue-100 text-blue-700' : detail.stageType === 'hourly' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                        {stageTypeLabels[detail.stageType]}
                      </Badge>
                      <span className="text-[12px]" style={{ fontWeight: 600 }}>{detail.stageName}</span>
                    </div>
                    <div className="p-4">
                      {detail.stageType === 'piece_rate' ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-blue-50 rounded-lg text-center">
                            <p className="text-[10px] text-muted-foreground">الكمية المنتجة</p>
                            <p className="text-[16px]" style={{ fontWeight: 700 }}>{detail.quantity}</p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg text-center">
                            <p className="text-[10px] text-muted-foreground">سعر القطعة</p>
                            <p className="text-[16px]" style={{ fontWeight: 700 }}>{formatCurrency(detail.pricePerPiece)}</p>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-lg text-center">
                            <p className="text-[10px] text-muted-foreground">التكلفة</p>
                            <p className="text-[16px] text-emerald-700" style={{ fontWeight: 700 }}>{formatCurrency(detail.pieceRateCost)}</p>
                          </div>
                          <div className="col-span-3 p-2 bg-gray-50 rounded-md text-[11px] text-muted-foreground text-center">
                            التكلفة = الكمية ({detail.quantity}) &times; سعر القطعة ({formatCurrency(detail.pricePerPiece)}) = {formatCurrency(detail.pieceRateCost)}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                              <p className="text-[10px] text-muted-foreground">إجمالي رواتب القسم</p>
                              <p className="text-[14px]" style={{ fontWeight: 700 }}>{formatCurrency(detail.departmentPayroll)}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                              <p className="text-[10px] text-muted-foreground">إجمالي إنتاج القسم</p>
                              <p className="text-[14px]" style={{ fontWeight: 700 }}>{detail.totalDeptUnits} وحدة</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                              <p className="text-[10px] text-muted-foreground">معدل التخصيص</p>
                              <p className="text-[14px]" style={{ fontWeight: 700 }}>{formatCurrency(detail.allocationRate)}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg text-center">
                              <p className="text-[10px] text-muted-foreground">حصة المنتج</p>
                              <p className="text-[14px] text-emerald-700" style={{ fontWeight: 700 }}>{formatCurrency(detail.allocatedCost)}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-md text-[11px] text-muted-foreground text-center space-y-1">
                            <p>معدل التخصيص = رواتب القسم ({formatCurrency(detail.departmentPayroll)}) &divide; إنتاج القسم ({detail.totalDeptUnits}) = {formatCurrency(detail.allocationRate)} لكل وحدة</p>
                            <p>حصة المنتج = معدل التخصيص ({formatCurrency(detail.allocationRate)}) &times; وحدات المنتج ({detail.productUnits}) = {formatCurrency(detail.allocatedCost)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3 bg-emerald-50 flex items-center justify-between border-t">
                  <span className="text-[12px]" style={{ fontWeight: 700 }}>إجمالي تكلفة العمالة</span>
                  <span className="text-[14px] text-emerald-700" style={{ fontWeight: 700 }}>{formatCurrency(totalLaborCost)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Section C: Overhead */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-600 text-white flex items-center justify-center text-[10px]" style={{ fontWeight: 700 }}>C</div>
                  المصاريف العامة (اختياري - جاهز للمستقبل)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">الكهرباء</label>
                    <Input type="number" value={electricity} onChange={e => setElectricity(+e.target.value)} className="text-[12px]" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">الصيانة</label>
                    <Input type="number" value={maintenance} onChange={e => setMaintenance(+e.target.value)} className="text-[12px]" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">الإيجار</label>
                    <Input type="number" value={rent} onChange={e => setRent(+e.target.value)} className="text-[12px]" />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-amber-50 rounded-lg flex items-center justify-between">
                  <span className="text-[12px]" style={{ fontWeight: 600 }}>إجمالي المصاريف العامة</span>
                  <span className="text-[14px] text-amber-700" style={{ fontWeight: 700 }}>{formatCurrency(totalOverhead)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Final Summary */}
            <Card className="shadow-sm border-2 border-blue-300 bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[16px]">ملخص التكلفة النهائية</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px]">تكلفة المواد الخام</span>
                    <span className="text-[13px]" style={{ fontWeight: 600 }}>{formatCurrency(totalMaterialCost)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px]">+ تكلفة العمالة / وحدة</span>
                    <span className="text-[13px]" style={{ fontWeight: 600 }}>{formatCurrency(laborPerUnit)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px]">+ مصاريف عامة / وحدة</span>
                    <span className="text-[13px]" style={{ fontWeight: 600 }}>{formatCurrency(overheadPerUnit)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[15px]" style={{ fontWeight: 700 }}>= التكلفة الإجمالية / وحدة</span>
                    <span className="text-[20px] text-blue-700" style={{ fontWeight: 700 }}>{formatCurrency(totalCostPerUnit)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button onClick={handleRecalculate} className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1.5">
                    <RefreshCcw className="w-4 h-4" /> تحديث التكلفة
                  </Button>
                  <Button onClick={handlePushToInventory} variant="outline" className="text-[12px] gap-1.5">
                    <Send className="w-4 h-4" /> إرسال للمخزون
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Card */}
            <Card className={`shadow-sm border-2 ${margin >= 0 ? 'border-emerald-300' : 'border-red-300'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  مقارنة مع سعر البيع
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">التكلفة</p>
                    <p className="text-[22px] text-foreground" style={{ fontWeight: 700 }}>{formatCurrency(totalCostPerUnit)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">سعر البيع</p>
                    <p className="text-[22px] text-blue-700" style={{ fontWeight: 700 }}>{formatCurrency(selectedProduct.selling_price)}</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${margin >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <p className="text-[11px] text-muted-foreground mb-1">الهامش</p>
                    <p className={`text-[22px] ${margin >= 0 ? 'text-emerald-700' : 'text-red-700'}`} style={{ fontWeight: 700 }}>
                      {formatCurrency(margin)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${margin >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <p className="text-[11px] text-muted-foreground mb-1">نسبة الربح</p>
                    <div className="flex items-center justify-center gap-1">
                      {margin >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                      <p className={`text-[22px] ${margin >= 0 ? 'text-emerald-700' : 'text-red-700'}`} style={{ fontWeight: 700 }}>
                        {marginPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {margin < 0 && (
                  <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[12px] text-red-700" style={{ fontWeight: 700 }}>تحذير: هامش ربح سلبي!</p>
                      <p className="text-[11px] text-red-600">
                        تكلفة الإنتاج أعلى من سعر البيع بمبلغ {formatCurrency(Math.abs(margin))}. يجب مراجعة الأسعار أو تقليل التكاليف.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  سجل التكلفة - {selectedProduct.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right text-[11px] pr-4">التاريخ</TableHead>
                      <TableHead className="text-left text-[11px]">التكلفة / وحدة</TableHead>
                      <TableHead className="text-center text-[11px]">طريقة الحساب</TableHead>
                      <TableHead className="text-right text-[11px]">تم بواسطة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productCostHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-[12px] text-muted-foreground py-8">
                          لا يوجد سجل تكلفة لهذا المنتج
                        </TableCell>
                      </TableRow>
                    ) : productCostHistory.map(ch => (
                      <TableRow key={ch.id}>
                        <TableCell className="text-[11px] pr-4">{ch.date}</TableCell>
                        <TableCell className="text-[11px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(ch.cost_per_unit)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {ch.calculation_method === 'latest_prices' ? 'أحدث الأسعار' : 'أسعار تاريخية'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px]">{ch.updated_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
