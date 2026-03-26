import { useState, useMemo } from 'react';
import { useManufacturing } from '../../context/ManufacturingContext';
import { useAccounting } from '../../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import {
  Warehouse, Package, Building, AlertTriangle, CircleCheck, CircleX, FileSpreadsheet,
  ArrowRightLeft, TrendingUp, Info
} from 'lucide-react';
import { toast } from 'sonner';
import type { StockLevel, StageWarehouse } from '../../types/manufacturing';
import * as XLSX from 'xlsx';

const stockLevelLabels: Record<StockLevel, string> = { healthy: 'جيد', low: 'منخفض', empty: 'فارغ' };
const stockLevelColors: Record<StockLevel, string> = {
  healthy: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  low: 'bg-amber-100 text-amber-700 border-amber-300',
  empty: 'bg-red-100 text-red-700 border-red-300',
};
const stockBgColors: Record<StockLevel, string> = {
  healthy: 'border-r-emerald-500',
  low: 'border-r-amber-500',
  empty: 'border-r-red-500',
};

export function StageWarehousesPage() {
  const { stageWarehouses, departments, products, stages, transferToInventory, formatCurrency } = useManufacturing();
  const { state: accountingState } = useAccounting();
  const [deptFilter, setDeptFilter] = useState('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedSW, setSelectedSW] = useState<StageWarehouse | null>(null);
  const [transferQty, setTransferQty] = useState('');

  const filtered = useMemo(() => {
    return stageWarehouses.filter(sw => deptFilter === 'all' || sw.department_id === deptFilter);
  }, [stageWarehouses, deptFilter]);

  // Group by department
  const groupedByDept = useMemo(() => {
    const groups: Record<string, typeof stageWarehouses> = {};
    filtered.forEach(sw => {
      if (!groups[sw.department_id]) groups[sw.department_id] = [];
      groups[sw.department_id].push(sw);
    });
    return groups;
  }, [filtered]);

  const totalItems = stageWarehouses.length;
  const healthyCount = stageWarehouses.filter(sw => sw.stock_level === 'healthy').length;
  const lowCount = stageWarehouses.filter(sw => sw.stock_level === 'low').length;
  const emptyCount = stageWarehouses.filter(sw => sw.stock_level === 'empty').length;
  const totalValue = stageWarehouses.reduce((s, sw) => s + sw.value, 0);

  // Get finished goods inventory from accounting
  const finishedGoodsStock = useMemo(() => {
    return accountingState.itemStock.filter(s => s.warehouse_id === 'w-fg');
  }, [accountingState.itemStock]);

  const getInventoryQty = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product?.inventory_item_id) return 0;
    const stock = finishedGoodsStock.find(s => s.item_id === product.inventory_item_id);
    return stock?.quantity || 0;
  };

  const openTransfer = (sw: StageWarehouse) => {
    setSelectedSW(sw);
    setTransferQty('');
    setShowTransferModal(true);
  };

  const handleTransfer = () => {
    if (!selectedSW) return;
    const qty = Number(transferQty);
    if (!qty || qty <= 0) { toast.error('يرجى إدخال كمية صحيحة'); return; }
    transferToInventory(selectedSW.id, qty);
    setShowTransferModal(false);
    setSelectedSW(null);
  };

  const exportToExcel = () => {
    const data = stageWarehouses.map(sw => ({
      'القسم': sw.department_name,
      'المرحلة': sw.stage_name,
      'المنتج': sw.product_name,
      'الكمية المتاحة': sw.available_quantity,
      'القيمة': sw.value,
      'آخر تحديث': sw.last_update,
      'المستوى': stockLevelLabels[sw.stock_level],
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'مخازن المراحل');
    XLSX.writeFile(wb, 'stage-warehouses.xlsx');
    toast.success('تم تصدير البيانات');
  };

  // Finished goods summary from accounting
  const finishedGoodsSummary = useMemo(() => {
    return accountingState.items
      .filter(i => i.category_id === 'ic-mfg-fg')
      .map(item => {
        const stock = accountingState.itemStock.find(s => s.item_id === item.id && s.warehouse_id === 'w-fg');
        return { ...item, quantity: stock?.quantity || 0, average_cost: stock?.average_cost || 0 };
      });
  }, [accountingState.items, accountingState.itemStock]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] text-foreground" style={{ fontWeight: 700 }}>مخازن المراحل</h1>
          <p className="text-[13px] text-muted-foreground mt-1">متابعة مخزون كل مرحلة إنتاجية — التحويل للمخزون الرئيسي ينشئ قيداً محاسبياً تلقائياً</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToExcel} variant="outline" className="text-[12px] gap-1.5">
            <FileSpreadsheet className="w-4 h-4" /> تصدير
          </Button>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[180px] text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأقسام</SelectItem>
              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">إجمالي الأصناف</p>
              <p className="text-[18px]" style={{ fontWeight: 700 }}>{totalItems}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CircleCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">مخزون جيد</p>
              <p className="text-[18px] text-emerald-700" style={{ fontWeight: 700 }}>{healthyCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">مخزون منخفض</p>
              <p className="text-[18px] text-amber-700" style={{ fontWeight: 700 }}>{lowCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <CircleX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">فارغ</p>
              <p className="text-[18px] text-red-700" style={{ fontWeight: 700 }}>{emptyCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">إجمالي القيمة</p>
              <p className="text-[16px] text-purple-700" style={{ fontWeight: 700 }}>{formatCurrency(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Finished Goods Inventory (from accounting) */}
      <Card className="shadow-sm border-2 border-emerald-200">
        <CardHeader className="pb-3 bg-emerald-50">
          <CardTitle className="text-[15px] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            مخزون المنتجات التامة (مخزن المنتجات التامة)
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">مرتبط بالمحاسبة</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-right text-[11px] pr-4">كود الصنف</TableHead>
                <TableHead className="text-right text-[11px]">المنتج</TableHead>
                <TableHead className="text-center text-[11px]">الكمية المتاحة</TableHead>
                <TableHead className="text-center text-[11px]">متوسط التكلفة</TableHead>
                <TableHead className="text-left text-[11px]">إجمالي القيمة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finishedGoodsSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[12px] text-muted-foreground py-8">
                    لا توجد منتجات تامة — حوّل منتجات من مخازن المراحل أدناه
                  </TableCell>
                </TableRow>
              ) : finishedGoodsSummary.map(item => (
                <TableRow key={item.id} className={`hover:bg-slate-50/50 ${item.quantity === 0 ? 'opacity-50' : ''}`}>
                  <TableCell className="text-[11px] pr-4 font-mono">{item.item_code}</TableCell>
                  <TableCell className="text-[12px]" style={{ fontWeight: 500 }}>{item.item_name}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-[13px] ${item.quantity === 0 ? 'text-muted-foreground' : 'text-emerald-700'}`} style={{ fontWeight: 700 }}>
                      {item.quantity} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-[12px]">{formatCurrency(item.average_cost)}</TableCell>
                  <TableCell className="text-left text-[12px]" style={{ fontWeight: 600 }}>
                    {formatCurrency(item.quantity * item.average_cost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Department Cards - Stage Warehouses */}
      {Object.entries(groupedByDept).map(([deptId, items]) => {
        const dept = departments.find(d => d.id === deptId);
        const deptValue = items.reduce((s, i) => s + i.value, 0);
        const deptQty = items.reduce((s, i) => s + i.available_quantity, 0);
        const maxQty = Math.max(...items.map(i => i.available_quantity), 1);

        return (
          <Card key={deptId} className="shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-l from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-[15px]">{dept?.name || deptId}</CardTitle>
                    <p className="text-[11px] text-muted-foreground">{items.length} أصناف | إجمالي: {deptQty} قطعة</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground">إجمالي القيمة</p>
                  <p className="text-[16px] text-blue-700" style={{ fontWeight: 700 }}>{formatCurrency(deptValue)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-right text-[11px] pr-4">المرحلة</TableHead>
                    <TableHead className="text-right text-[11px]">المنتج</TableHead>
                    <TableHead className="text-center text-[11px]">الكمية المتاحة</TableHead>
                    <TableHead className="text-center text-[11px]">في المخزن التام</TableHead>
                    <TableHead className="text-center text-[11px]">المستوى</TableHead>
                    <TableHead className="text-left text-[11px]">القيمة</TableHead>
                    <TableHead className="text-center text-[11px]">آخر تحديث</TableHead>
                    <TableHead className="text-center text-[11px]">تحويل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(sw => (
                    <TableRow key={sw.id} className={`hover:bg-slate-50/50 border-r-4 ${stockBgColors[sw.stock_level]}`}>
                      <TableCell className="text-[11px] pr-4">{sw.stage_name}</TableCell>
                      <TableCell className="text-[11px]">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                          {sw.product_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[12px]" style={{ fontWeight: 600 }}>{sw.available_quantity}</span>
                          <div className="w-16">
                            <Progress value={(sw.available_quantity / maxQty) * 100} className="h-1.5" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[12px] text-emerald-700" style={{ fontWeight: 600 }}>
                          {getInventoryQty(sw.product_id)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${stockLevelColors[sw.stock_level]} text-[10px] border`}>
                          {sw.stock_level === 'healthy' && <CircleCheck className="w-3 h-3 ml-1" />}
                          {sw.stock_level === 'low' && <AlertTriangle className="w-3 h-3 ml-1" />}
                          {sw.stock_level === 'empty' && <CircleX className="w-3 h-3 ml-1" />}
                          {stockLevelLabels[sw.stock_level]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(sw.value)}</TableCell>
                      <TableCell className="text-[11px] text-center text-muted-foreground">{sw.last_update}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTransfer(sw)}
                          disabled={sw.available_quantity === 0}
                          className="h-7 text-[11px] gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          تحويل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Warehouse className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-[15px] text-muted-foreground">لا توجد بيانات لمخازن المراحل</p>
        </div>
      )}

      {/* Accounting Note */}
      <Card className="border border-blue-200 bg-blue-50/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-[12px] text-blue-700 space-y-1">
              <p style={{ fontWeight: 600 }}>القيود المحاسبية التلقائية لعمليات التصنيع:</p>
              <p>• عند تأكيد فاتورة الإنتاج: يُخصم من «مواد خام للتصنيع» + يُستحق «أجور عمال إنتاج» → يُضاف إلى «إنتاج تحت التشغيل»</p>
              <p>• عند التحويل للمخزون التام: يُنقل من «إنتاج تحت التشغيل» → «مخزون منتجات تامة» + يُحدَّث رصيد المخزن التام</p>
              <p>• عند بيع المنتجات التامة (من فاتورة المبيعات): تُخصم التكلفة من «مخزون منتجات تامة» → «تكلفة البضاعة المباعة»</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">تحويل إلى مخزون المنتجات التامة</DialogTitle>
            <DialogDescription className="text-[12px]">
              سيُنشأ قيد محاسبي تلقائي: مدين (مخزون منتجات تامة) / دائن (إنتاج تحت التشغيل)
            </DialogDescription>
          </DialogHeader>

          {selectedSW && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">المنتج</p>
                  <p className="text-[13px]" style={{ fontWeight: 600 }}>{selectedSW.product_name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">المرحلة</p>
                  <p className="text-[13px]" style={{ fontWeight: 600 }}>{selectedSW.stage_name}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">الكمية المتاحة</p>
                  <p className="text-[20px] text-emerald-700" style={{ fontWeight: 700 }}>{selectedSW.available_quantity}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">في المخزن التام</p>
                  <p className="text-[20px] text-blue-700" style={{ fontWeight: 700 }}>{getInventoryQty(selectedSW.product_id)}</p>
                </div>
              </div>

              <div>
                <label className="text-[12px] text-muted-foreground block mb-2">الكمية المراد تحويلها</label>
                <Input
                  type="number"
                  min={1}
                  max={selectedSW.available_quantity}
                  value={transferQty}
                  onChange={e => setTransferQty(e.target.value)}
                  placeholder={`من 1 إلى ${selectedSW.available_quantity}`}
                  className="text-[13px]"
                />
              </div>

              {transferQty && Number(transferQty) > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[12px]">
                  <p className="text-amber-700" style={{ fontWeight: 600 }}>سيتم إنشاء القيد التالي تلقائياً:</p>
                  <div className="mt-2 space-y-1 text-amber-600">
                    <p>مدين: مخزون منتجات تامة (1107-003) = {formatCurrency(Number(transferQty) * (products.find(p => p.id === selectedSW.product_id)?.last_calculated_cost || products.find(p => p.id === selectedSW.product_id)?.estimated_cost || 0))}</p>
                    <p>دائن: إنتاج تحت التشغيل (1107-002) = {formatCurrency(Number(transferQty) * (products.find(p => p.id === selectedSW.product_id)?.last_calculated_cost || products.find(p => p.id === selectedSW.product_id)?.estimated_cost || 0))}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTransferModal(false)} className="text-[12px]">إلغاء</Button>
            <Button
              onClick={handleTransfer}
              disabled={!transferQty || Number(transferQty) <= 0}
              className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" />
              تحويل وتسجيل القيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
