import { useState, useMemo } from 'react';
import { useManufacturing } from '../../context/ManufacturingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Separator } from '../../components/ui/separator';
import {
  Plus, Search, FileText, User, Building, Workflow, X,
  CircleCheck, AlertTriangle, Package, DollarSign, Truck,
  FileSpreadsheet, Eye, ArrowLeftRight, Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import type { ManufacturingInvoice, ManufacturingInvoiceItem, StageType } from '../../types/manufacturing';
import * as XLSX from 'xlsx';

const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split('T')[0];

const stageTypeLabels: Record<StageType, string> = { piece_rate: 'بالقطعة', hourly: 'بالساعة', weekly: 'أسبوعي' };

export function ManufacturingInvoicePage() {
  const {
    invoices, workers, departments, stages, products, stageWarehouses,
    addInvoice, reverseInvoice, formatCurrency
  } = useManufacturing();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<ManufacturingInvoice | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Invoice form
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<ManufacturingInvoiceItem[]>([]);

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const workerDept = selectedWorker ? departments.find(d => d.id === selectedWorker.department_id) : null;
  const workerStage = selectedWorker ? stages.find(s => s.id === selectedWorker.stage_id) : null;

  const filtered = useMemo(() => {
    return invoices.filter(i => {
      const matchSearch = i.invoice_number.includes(search) || i.worker_name.includes(search);
      const matchStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [invoices, search, statusFilter]);

  const resetInvoiceForm = () => {
    setSelectedWorkerId('');
    setInvoiceDate(today());
    setInvoiceNotes('');
    setInvoiceItems([]);
  };

  const openCreateInvoice = () => {
    resetInvoiceForm();
    setShowCreateModal(true);
  };

  const addInvoiceItem = () => {
    setInvoiceItems(prev => [...prev, {
      id: uid(), invoice_id: '', product_id: '', product_name: '',
      quantity_produced: 0, quantity_defective: 0, net_quantity: 0,
      unit_production_price: 0, total: 0,
    }]);
  };

  const updateInvoiceItem = (index: number, updates: Partial<ManufacturingInvoiceItem>) => {
    setInvoiceItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, ...updates };
      updated.net_quantity = Math.max(0, updated.quantity_produced - updated.quantity_defective);
      updated.total = updated.net_quantity * updated.unit_production_price;
      return updated;
    }));
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !workerStage) return;
    const productStage = product.stages.find(s => s.stage_id === workerStage.id);
    const price = productStage?.production_price || workerStage.production_price || 0;
    updateInvoiceItem(index, {
      product_id: productId,
      product_name: product.name,
      unit_production_price: price,
    });
  };

  const invoiceTotal = invoiceItems.reduce((s, i) => s + i.total, 0);
  const invoiceTotalQty = invoiceItems.reduce((s, i) => s + i.quantity_produced, 0);
  const invoiceTotalDefective = invoiceItems.reduce((s, i) => s + i.quantity_defective, 0);

  // Materials to deduct
  const materialsToDeduct = useMemo(() => {
    if (!workerStage) return [];
    const mats: { name: string; quantity: number }[] = [];
    invoiceItems.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) return;
      const pStage = product.stages.find(s => s.stage_id === workerStage.id);
      if (!pStage) return;
      pStage.components.filter(c => !c.is_from_previous_stage).forEach(comp => {
        const qty = comp.quantity_per_unit * (1 + comp.waste_percentage / 100) * item.net_quantity;
        const existing = mats.find(m => m.name === comp.material_name);
        if (existing) existing.quantity += qty;
        else mats.push({ name: comp.material_name, quantity: qty });
      });
    });
    return mats;
  }, [invoiceItems, workerStage, products]);

  const handleConfirmSave = () => {
    if (!selectedWorkerId || invoiceItems.length === 0) {
      toast.error('يرجى اختيار العامل وإضافة أصناف');
      return;
    }
    if (invoiceItems.some(i => !i.product_id || i.quantity_produced <= 0)) {
      toast.error('يرجى ملء بيانات جميع الأصناف');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleSaveInvoice = () => {
    addInvoice({
      worker_id: selectedWorkerId,
      worker_name: selectedWorker?.name || '',
      department_id: selectedWorker?.department_id || '',
      department_name: workerDept?.name || '',
      stage_id: workerStage?.id || '',
      stage_name: workerStage?.name || '',
      production_type: selectedWorker?.production_type || 'piece_rate',
      invoice_date: invoiceDate,
      items: invoiceItems,
      total_amount: invoiceTotal,
      total_quantity: invoiceTotalQty,
      total_defective: invoiceTotalDefective,
      notes: invoiceNotes,
      status: 'confirmed',
    });
    setShowConfirmDialog(false);
    setShowCreateModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const statusBadge = (status: string) => {
    if (status === 'confirmed') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">مؤكدة</Badge>;
    if (status === 'draft') return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">مسودة</Badge>;
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">معكوسة</Badge>;
  };

  const exportToExcel = () => {
    const data = filtered.map(i => ({
      'رقم الفاتورة': i.invoice_number,
      'العامل': i.worker_name,
      'القسم': i.department_name,
      'المرحلة': i.stage_name,
      'التاريخ': i.invoice_date,
      'إجمالي الكمية': i.total_quantity,
      'التالف': i.total_defective,
      'المبلغ': i.total_amount,
      'الحالة': i.status === 'confirmed' ? 'مؤكدة' : i.status === 'draft' ? 'مسودة' : 'معكوسة',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'فواتير الإنتاج');
    XLSX.writeFile(wb, 'manufacturing-invoices.xlsx');
    toast.success('تم تصدير البيانات');
  };

  // Products available for selected worker's stage
  const availableProducts = useMemo(() => {
    if (!workerStage) return [];
    return products.filter(p => p.status === 'active' && p.stages.some(s => s.stage_id === workerStage.id));
  }, [workerStage, products]);

  return (
    <div className="space-y-6">
      {/* Success Animation */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowSuccess(false)}
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"
            >
              <CircleCheck className="w-10 h-10 text-emerald-600" />
            </motion.div>
            <h3 className="text-[18px] text-foreground mb-2" style={{ fontWeight: 700 }}>تم تسجيل الإنتج فعلياً</h3>
            <p className="text-[13px] text-muted-foreground">تم خصم المواد وتحديث مخازن المراحل وتسجيل أجر العامل</p>
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] text-foreground" style={{ fontWeight: 700 }}>فاتورة إنتاج العامل</h1>
          <p className="text-[13px] text-muted-foreground mt-1">نقطة الإدخال الرئيسية - تسجيل الإنتاج الفعلي</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToExcel} variant="outline" className="text-[12px] gap-1.5">
            <FileSpreadsheet className="w-4 h-4" /> تصدير
          </Button>
          <Button onClick={openCreateInvoice} className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1.5">
            <Plus className="w-4 h-4" /> فاتورة إنتاج جديدة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm border-r-4 border-r-blue-500">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">إجمالي الفواتير</p>
            <p className="text-[22px] text-blue-700" style={{ fontWeight: 700 }}>{invoices.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-r-4 border-r-emerald-500">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">فواتير مؤكدة</p>
            <p className="text-[22px] text-emerald-700" style={{ fontWeight: 700 }}>{invoices.filter(i => i.status === 'confirmed').length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-r-4 border-r-amber-500">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">إجمالي الإنتاج</p>
            <p className="text-[22px] text-amber-700" style={{ fontWeight: 700 }}>
              {invoices.filter(i => i.status === 'confirmed').reduce((s, i) => s + i.total_quantity, 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-r-4 border-r-purple-500">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">إجمالي التكلفة</p>
            <p className="text-[22px] text-purple-700" style={{ fontWeight: 700 }}>
              {formatCurrency(invoices.filter(i => i.status === 'confirmed').reduce((s, i) => s + i.total_amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث برقم الفاتورة أو اسم العامل..." value={search} onChange={e => setSearch(e.target.value)}
                className="pr-9 text-[12px]" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="confirmed">مؤكدة</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="reversed">معكوسة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-right text-[12px] pr-4">رقم الفاتورة</TableHead>
                  <TableHead className="text-right text-[12px]">العامل</TableHead>
                  <TableHead className="text-right text-[12px]">القسم</TableHead>
                  <TableHead className="text-right text-[12px]">المرحلة</TableHead>
                  <TableHead className="text-center text-[12px]">نوع الأجر</TableHead>
                  <TableHead className="text-center text-[12px]">الكمية</TableHead>
                  <TableHead className="text-center text-[12px]">التالف</TableHead>
                  <TableHead className="text-left text-[12px]">المبلغ</TableHead>
                  <TableHead className="text-center text-[12px]">التاريخ</TableHead>
                  <TableHead className="text-center text-[12px]">الحالة</TableHead>
                  <TableHead className="text-center text-[12px]">عرض</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-[13px] text-muted-foreground py-12">
                      لا توجد فواتير إنتاج
                    </TableCell>
                  </TableRow>
                ) : filtered.map(inv => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-[12px] pr-4" style={{ fontWeight: 600 }}>{inv.invoice_number}</TableCell>
                    <TableCell className="text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        {inv.worker_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">{inv.department_name}</TableCell>
                    <TableCell className="text-[12px]">{inv.stage_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px]">{stageTypeLabels[inv.production_type]}</Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-center" style={{ fontWeight: 600 }}>{inv.total_quantity}</TableCell>
                    <TableCell className="text-[12px] text-center">
                      <span className={inv.total_defective > 0 ? 'text-red-600' : 'text-muted-foreground'}>{inv.total_defective}</span>
                    </TableCell>
                    <TableCell className="text-[12px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(inv.total_amount)}</TableCell>
                    <TableCell className="text-[12px] text-center">{inv.invoice_date}</TableCell>
                    <TableCell className="text-center">{statusBadge(inv.status)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => { setViewingInvoice(inv); setShowViewModal(true); }}
                        className="h-7 w-7 p-0">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-0" dir="rtl">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Main Content */}
            <div className="flex-1 p-6 space-y-5 overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[18px]">فاتورة إنتاج جديدة</DialogTitle>
                <DialogDescription className="text-[12px]">تسجيل الإنتاج الفعلي للعامل</DialogDescription>
              </DialogHeader>

              {/* Worker Selection */}
              <Card className="border-2 border-blue-200 bg-blue-50/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    <p className="text-[13px]" style={{ fontWeight: 600 }}>بيانات العامل</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <label className="text-[11px] text-muted-foreground block mb-1">اختر العامل (عمال الإنتاج فقط)</label>
                      <Select value={selectedWorkerId} onValueChange={v => {
                        setSelectedWorkerId(v);
                        setInvoiceItems([]);
                      }}>
                        <SelectTrigger className="text-[12px]"><SelectValue placeholder="اختر العامل" /></SelectTrigger>
                        <SelectContent>
                          {workers.map(w => {
                            const d = departments.find(dep => dep.id === w.department_id);
                            return <SelectItem key={w.id} value={w.id}>{w.name} - {d?.name}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">تاريخ الفاتورة</label>
                      <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="text-[12px]" />
                    </div>
                  </div>

                  {selectedWorker && (
                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px] text-muted-foreground">اسم العامل</span>
                        </div>
                        <p className="text-[12px]" style={{ fontWeight: 600 }}>{selectedWorker.name}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Building className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-muted-foreground">القسم</span>
                        </div>
                        <p className="text-[12px]" style={{ fontWeight: 600 }}>{workerDept?.name}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Workflow className="w-3 h-3 text-purple-500" />
                          <span className="text-[10px] text-muted-foreground">المرحلة</span>
                        </div>
                        <p className="text-[12px]" style={{ fontWeight: 600 }}>{workerStage?.name}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-1.5 mb-1">
                          <DollarSign className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] text-muted-foreground">نوع الأجر</span>
                        </div>
                        <p className="text-[12px]" style={{ fontWeight: 600 }}>{stageTypeLabels[selectedWorker.production_type]}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products Table */}
              {selectedWorker && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px]" style={{ fontWeight: 600 }}>أصناف الإنتاج</p>
                    <Button onClick={addInvoiceItem} variant="outline" className="text-[12px] gap-1.5 h-8">
                      <Plus className="w-3.5 h-3.5" /> إضافة صنف
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="text-right text-[11px] pr-4 w-[250px]">المنتج</TableHead>
                              <TableHead className="text-center text-[11px] w-[100px]">الكمية المنتجة</TableHead>
                              <TableHead className="text-center text-[11px] w-[100px]">الكمية التالفة</TableHead>
                              <TableHead className="text-center text-[11px] w-[100px]">صافي الكمية</TableHead>
                              <TableHead className="text-center text-[11px] w-[100px]">سعر الوحدة</TableHead>
                              <TableHead className="text-left text-[11px] w-[120px]">الإجمالي</TableHead>
                              <TableHead className="text-center text-[11px] w-[50px]">حذف</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoiceItems.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-[12px] text-muted-foreground py-8">
                                  اضغط "إضافة صنف" لبدء تسجيل الإن��اج
                                </TableCell>
                              </TableRow>
                            ) : invoiceItems.map((item, idx) => (
                              <TableRow key={item.id}>
                                <TableCell className="pr-4">
                                  <Select value={item.product_id} onValueChange={v => selectProduct(idx, v)}>
                                    <SelectTrigger className="text-[11px] h-8"><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                                    <SelectContent>
                                      {availableProducts.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input type="number" min={0} value={item.quantity_produced || ''}
                                    onChange={e => updateInvoiceItem(idx, { quantity_produced: +e.target.value })}
                                    className="text-[11px] h-8 text-center" />
                                </TableCell>
                                <TableCell>
                                  <Input type="number" min={0} value={item.quantity_defective || ''}
                                    onChange={e => updateInvoiceItem(idx, { quantity_defective: +e.target.value })}
                                    className="text-[11px] h-8 text-center" />
                                </TableCell>
                                <TableCell className="text-center text-[12px]" style={{ fontWeight: 600 }}>
                                  {item.net_quantity}
                                </TableCell>
                                <TableCell className="text-center text-[12px]">
                                  {formatCurrency(item.unit_production_price)}
                                </TableCell>
                                <TableCell className="text-left text-[12px]" style={{ fontWeight: 700 }}>
                                  {formatCurrency(item.total)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button variant="ghost" size="sm" onClick={() => removeInvoiceItem(idx)}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {invoiceItems.length > 0 && (
                        <div className="border-t bg-slate-50 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-6 text-[12px]">
                            <span>إجمالي الكمية: <strong>{invoiceTotalQty}</strong></span>
                            <span>التالف: <strong className="text-red-600">{invoiceTotalDefective}</strong></span>
                          </div>
                          <div className="text-[16px]" style={{ fontWeight: 700, color: '#2563EB' }}>
                            الإجمالي: {formatCurrency(invoiceTotal)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <div className="mt-3">
                    <label className="text-[11px] text-muted-foreground block mb-1">ملاحظات</label>
                    <Input value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} className="text-[12px]" placeholder="ملاحظات إضافية..." />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="text-[12px]">إلغاء</Button>
                <Button onClick={handleConfirmSave}
                  disabled={!selectedWorkerId || invoiceItems.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-[12px] gap-1.5">
                  <CircleCheck className="w-4 h-4" /> تأكيد وحفظ الفاتورة
                </Button>
              </div>
            </div>

            {/* Right Side Summary Panel */}
            {selectedWorker && invoiceItems.length > 0 && (
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-r bg-slate-50 p-5 space-y-4 lg:sticky lg:top-0 lg:max-h-[92vh] lg:overflow-y-auto">
                <p className="text-[14px]" style={{ fontWeight: 700 }}>ملخص العملية</p>

                {/* Materials to deduct */}
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Minus className="w-3.5 h-3.5 text-amber-600" />
                      <p className="text-[11px] text-amber-700" style={{ fontWeight: 600 }}>مواد خام للخصم</p>
                    </div>
                    {materialsToDeduct.length > 0 ? materialsToDeduct.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-amber-100 last:border-0">
                        <span>{m.name}</span>
                        <span style={{ fontWeight: 600 }}>{m.quantity.toFixed(2)}</span>
                      </div>
                    )) : (
                      <p className="text-[10px] text-muted-foreground">لا توجد مواد</p>
                    )}
                  </CardContent>
                </Card>

                {/* Previous stage stock */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                      <p className="text-[11px] text-blue-700" style={{ fontWeight: 600 }}>مخزون المرحلة السابقة</p>
                    </div>
                    {workerStage && workerStage.stage_order > 1 ? (
                      <p className="text-[10px] text-blue-600">سيتم خصم من مخزون المرحلة السابقة تلقائياً</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">أول مرحلة - لا يوجد مخزون سابق</p>
                    )}
                  </CardContent>
                </Card>

                {/* Worker earnings */}
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <p className="text-[11px] text-emerald-700" style={{ fontWeight: 600 }}>أجر العامل</p>
                    </div>
                    <div className="text-center py-2">
                      <p className="text-[22px] text-emerald-700" style={{ fontWeight: 700 }}>{formatCurrency(invoiceTotal)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedWorker.production_type === 'piece_rate' ? 'أجر بالقطعة' : 'تخصيص من رواتب القسم'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Output destination */}
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Truck className="w-3.5 h-3.5 text-purple-600" />
                      <p className="text-[11px] text-purple-700" style={{ fontWeight: 600 }}>وجهة المخرجات</p>
                    </div>
                    <p className="text-[10px] text-purple-700">
                      {workerStage && workerStage.stage_order === stages.filter(s => s.is_active).length
                        ? 'مخزن المنتجات النهائية (آخر مرحلة)'
                        : `مخزن المرحلة التالية`
                      }
                    </p>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {invoiceTotalDefective > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-red-700" style={{ fontWeight: 600 }}>تنبيه التالف</p>
                      <p className="text-[10px] text-red-600">
                        يوجد {invoiceTotalDefective} قطعة تالفة ({((invoiceTotalDefective / invoiceTotalQty) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">تأكيد حفظ فاتورة الإنتاج</DialogTitle>
            <DialogDescription className="text-[12px]">هذه العملية ستؤثر على المخزون والرواتب</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <CircleCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-[12px] text-blue-700">سيتم خصم المواد الخام من مخزن التصنيع</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <CircleCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-[12px] text-blue-700">سيتم إضافة الكمية لمخزون المرحلة</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <CircleCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-[12px] text-blue-700">سيتم تسجيل أجر العامل: {formatCurrency(invoiceTotal)}</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <CircleCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] text-emerald-700" style={{ fontWeight: 600 }}>قيد محاسبي تلقائي</p>
                <p className="text-[11px] text-emerald-600">مدين: إنتاج تحت التشغيل | دائن: مواد خام + أجور مستحقة</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-[12px] text-amber-700">لا يمكن التراجع - يمكن فقط إنشاء عملية عكسية</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="text-[12px]">إلغاء</Button>
            <Button onClick={handleSaveInvoice} className="bg-emerald-600 hover:bg-emerald-700 text-[12px] gap-1.5">
              <CircleCheck className="w-4 h-4" /> تأكيد الحفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">تفاصيل الفاتورة: {viewingInvoice?.invoice_number}</DialogTitle>
            <DialogDescription className="text-[12px]">عرض تفاصيل فاتورة الإنتاج</DialogDescription>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">العامل</p>
                  <p className="text-[12px]" style={{ fontWeight: 600 }}>{viewingInvoice.worker_name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">القسم</p>
                  <p className="text-[12px]" style={{ fontWeight: 600 }}>{viewingInvoice.department_name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">المرحلة</p>
                  <p className="text-[12px]" style={{ fontWeight: 600 }}>{viewingInvoice.stage_name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">التاريخ</p>
                  <p className="text-[12px]" style={{ fontWeight: 600 }}>{viewingInvoice.invoice_date}</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-right text-[11px] pr-4">المنتج</TableHead>
                    <TableHead className="text-center text-[11px]">الكمية</TableHead>
                    <TableHead className="text-center text-[11px]">التالف</TableHead>
                    <TableHead className="text-center text-[11px]">الصافي</TableHead>
                    <TableHead className="text-center text-[11px]">سعر الوحدة</TableHead>
                    <TableHead className="text-left text-[11px]">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingInvoice.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-[11px] pr-4">{item.product_name}</TableCell>
                      <TableCell className="text-[11px] text-center">{item.quantity_produced}</TableCell>
                      <TableCell className="text-[11px] text-center text-red-600">{item.quantity_defective}</TableCell>
                      <TableCell className="text-[11px] text-center" style={{ fontWeight: 600 }}>{item.net_quantity}</TableCell>
                      <TableCell className="text-[11px] text-center">{formatCurrency(item.unit_production_price)}</TableCell>
                      <TableCell className="text-[11px] text-left" style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-[13px]" style={{ fontWeight: 600 }}>الإجمالي</span>
                <span className="text-[18px] text-blue-700" style={{ fontWeight: 700 }}>{formatCurrency(viewingInvoice.total_amount)}</span>
              </div>
              {/* Accounting badge */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-[11px]">
                  <span className="text-emerald-700" style={{ fontWeight: 600 }}>قيد محاسبي مُسجَّل</span>
                  <span className="text-emerald-600 mr-2">— مدين: إنتاج تحت التشغيل | دائن: مواد خام + أجور مستحقة</span>
                </div>
              </div>
              {/* Reverse button for confirmed invoices */}
              {viewingInvoice.status === 'confirmed' && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    className="text-[12px] gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      reverseInvoice(viewingInvoice.id);
                      setShowViewModal(false);
                    }}
                  >
                    <X className="w-4 h-4" />
                    عكس الفاتورة (قيد عكسي)
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}