import { useState, useMemo } from 'react';
import { useManufacturing } from '../../context/ManufacturingContext';
import { useAccounting } from '../../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Plus, Search, Edit, Copy, Eye, Trash2, Package, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, GripVertical, X, CircleCheck, DollarSign, FileSpreadsheet, Link
} from 'lucide-react';
import { toast } from 'sonner';
import type { ManufacturingProduct, ProductStage, ProductStageComponent, ProductStatus, StageType } from '../../types/manufacturing';
import * as XLSX from 'xlsx';

const uid = () => Math.random().toString(36).substr(2, 9);

const statusLabels: Record<ProductStatus, string> = { active: 'نشط', draft: 'مسودة', discontinued: 'متوقف' };
const statusColors: Record<ProductStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-amber-100 text-amber-700',
  discontinued: 'bg-red-100 text-red-700',
};

const stageTypeLabels: Record<StageType, string> = { piece_rate: 'بالقطعة', hourly: 'بالساعة', weekly: 'أسبوعي' };

export function ManufacturingProductsPage() {
  const { products, stages, departments, materials, addProduct, updateProduct, duplicateProduct, formatCurrency } = useManufacturing();
  const { state: accountingState } = useAccounting();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ManufacturingProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ManufacturingProduct | null>(null);
  const [duplicateSource, setDuplicateSource] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formUnit, setFormUnit] = useState('قطعة');
  const [formInventoryItem, setFormInventoryItem] = useState('');
  const [formStatus, setFormStatus] = useState<ProductStatus>('draft');
  const [formStages, setFormStages] = useState<ProductStage[]>([]);
  const [formNotes, setFormNotes] = useState('');

  // Duplicate form
  const [dupName, setDupName] = useState('');
  const [dupCode, setDupCode] = useState('');
  const [dupCopyStages, setDupCopyStages] = useState(true);
  const [dupCopyMaterials, setDupCopyMaterials] = useState(true);
  const [dupResetPrices, setDupResetPrices] = useState(false);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.includes(search) || p.code.includes(search);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const resetForm = () => {
    setFormName(''); setFormCode(''); setFormUnit('قطعة'); setFormInventoryItem('');
    setFormStatus('draft'); setFormStages([]); setFormNotes(''); setCurrentStep(1);
  };

  const openAdd = () => {
    resetForm();
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const openEdit = (product: ManufacturingProduct) => {
    setFormName(product.name);
    setFormCode(product.code);
    setFormUnit(product.unit);
    setFormInventoryItem(product.inventory_item_id);
    setFormStatus(product.status);
    setFormStages([...product.stages]);
    setFormNotes(product.notes);
    setEditingProduct(product);
    setCurrentStep(1);
    setShowAddModal(true);
  };

  const openDuplicate = (productId: string) => {
    setDuplicateSource(productId);
    const src = products.find(p => p.id === productId);
    setDupName(src ? `${src.name} - نسخة` : '');
    setDupCode(src ? `${src.code}-COPY` : '');
    setDupCopyStages(true);
    setDupCopyMaterials(true);
    setDupResetPrices(false);
    setShowDuplicateModal(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formCode.trim()) {
      toast.error('يرجى ملء اسم المنتج والكود');
      return;
    }
    const materialCost = formStages.reduce((total, stage) => {
      return total + stage.components.filter(c => !c.is_from_previous_stage)
        .reduce((ct, comp) => ct + (comp.quantity_per_unit * (1 + comp.waste_percentage / 100) * comp.unit_cost), 0);
    }, 0);
    const laborCost = formStages.reduce((total, stage) => {
      return total + (stage.stage_type === 'piece_rate' ? stage.production_price : 10);
    }, 0);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName, code: formCode, unit: formUnit,
        inventory_item_id: formInventoryItem, status: formStatus,
        stages: formStages, notes: formNotes,
        estimated_cost: Math.round((materialCost + laborCost) * 100) / 100,
      });
      toast.success('تم تحديث المنتج بنجاح');
    } else {
      addProduct({
        name: formName, code: formCode, unit: formUnit,
        inventory_item_id: formInventoryItem, status: formStatus,
        stages: formStages, notes: formNotes,
        estimated_cost: Math.round((materialCost + laborCost) * 100) / 100,
        last_calculated_cost: 0, selling_price: 0,
        last_cost_update: '',
      });
      toast.success('تم إضافة المنتج بنجاح');
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleDuplicate = () => {
    if (!dupName.trim() || !dupCode.trim()) {
      toast.error('يرجى ملء الاسم والكود');
      return;
    }
    duplicateProduct(duplicateSource, dupName, dupCode, {
      copyStages: dupCopyStages, copyMaterials: dupCopyMaterials, resetPrices: dupResetPrices,
    });
    toast.success('تم نسخ المنتج بنجاح');
    setShowDuplicateModal(false);
  };

  const addStageToForm = () => {
    setFormStages(prev => [...prev, {
      id: uid(), product_id: '', stage_id: '', stage_name: '', department_id: '',
      department_name: '', stage_order: prev.length + 1, stage_type: 'piece_rate',
      production_price: 0, components: [],
    }]);
  };

  const updateFormStage = (index: number, updates: Partial<ProductStage>) => {
    setFormStages(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const removeFormStage = (index: number) => {
    setFormStages(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stage_order: i + 1 })));
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === formStages.length - 1)) return;
    const newStages = [...formStages];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newStages[index], newStages[swapIndex]] = [newStages[swapIndex], newStages[index]];
    setFormStages(newStages.map((s, i) => ({ ...s, stage_order: i + 1 })));
  };

  const addComponentToStage = (stageIndex: number) => {
    const stage = formStages[stageIndex];
    const newComp: ProductStageComponent = {
      id: uid(), product_stage_id: stage.id, material_id: '', material_name: '',
      quantity_per_unit: 1, waste_percentage: 0, unit_cost: 0,
      is_from_previous_stage: false, previous_stage_id: '',
    };
    updateFormStage(stageIndex, { components: [...stage.components, newComp] });
  };

  const updateComponent = (stageIndex: number, compIndex: number, updates: Partial<ProductStageComponent>) => {
    const stage = formStages[stageIndex];
    const newComps = stage.components.map((c, i) => i === compIndex ? { ...c, ...updates } : c);
    updateFormStage(stageIndex, { components: newComps });
  };

  const removeComponent = (stageIndex: number, compIndex: number) => {
    const stage = formStages[stageIndex];
    updateFormStage(stageIndex, { components: stage.components.filter((_, i) => i !== compIndex) });
  };

  const estimatedCost = useMemo(() => {
    const mat = formStages.reduce((total, stage) => {
      return total + stage.components.filter(c => !c.is_from_previous_stage)
        .reduce((ct, c) => ct + (c.quantity_per_unit * (1 + c.waste_percentage / 100) * c.unit_cost), 0);
    }, 0);
    const labor = formStages.reduce((total, stage) => {
      return total + (stage.stage_type === 'piece_rate' ? stage.production_price : 10);
    }, 0);
    return { material: Math.round(mat * 100) / 100, labor: Math.round(labor * 100) / 100, total: Math.round((mat + labor) * 100) / 100 };
  }, [formStages]);

  const exportToExcel = () => {
    const data = filtered.map(p => ({
      'الكود': p.code,
      'اسم المنتج': p.name,
      'عدد المراحل': p.stages.length,
      'التكلفة التقديرية': p.estimated_cost,
      'آخر تكلفة محسوبة': p.last_calculated_cost,
      'سعر البيع': p.selling_price,
      'الحالة': statusLabels[p.status],
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المنتجات');
    XLSX.writeFile(wb, 'manufacturing-products.xlsx');
    toast.success('تم تصدير البيانات');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] text-foreground" style={{ fontWeight: 700 }}>إدارة المنتجات</h1>
          <p className="text-[13px] text-muted-foreground mt-1">إدارة المنتجات المصنعة ومراحل إنتاجها ومكوناتها</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToExcel} variant="outline" className="text-[12px] gap-1.5">
            <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
          </Button>
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1.5">
            <Plus className="w-4 h-4" /> إضافة منتج
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث بالاسم أو الكود..." value={search} onChange={e => setSearch(e.target.value)}
                className="pr-9 text-[12px]" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="discontinued">متوقف</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-right text-[12px] pr-4">الكود</TableHead>
                  <TableHead className="text-right text-[12px]">اسم المنتج</TableHead>
                  <TableHead className="text-center text-[12px]">المراحل</TableHead>
                  <TableHead className="text-left text-[12px]">التكلفة التقديرية</TableHead>
                  <TableHead className="text-left text-[12px]">آخر تكلفة</TableHead>
                  <TableHead className="text-left text-[12px]">سعر البيع</TableHead>
                  <TableHead className="text-center text-[12px]">ربط المخزون</TableHead>
                  <TableHead className="text-center text-[12px]">الحالة</TableHead>
                  <TableHead className="text-center text-[12px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-[13px] text-muted-foreground py-12">
                      لا توجد منتجات
                    </TableCell>
                  </TableRow>
                ) : filtered.map(product => {
                  const linkedItem = accountingState.items.find(i => i.id === product.inventory_item_id);
                  const linkedStock = linkedItem
                    ? accountingState.itemStock.find(s => s.item_id === linkedItem.id && s.warehouse_id === 'w-fg')
                    : null;
                  return (
                  <TableRow key={product.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-[12px] pr-4" style={{ fontWeight: 600 }}>{product.code}</TableCell>
                    <TableCell className="text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 500 }}>{product.name}</p>
                          <p className="text-[10px] text-muted-foreground">{product.unit}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px] text-center">
                      <Badge variant="outline" className="text-[11px]">{product.stages.length} مراحل</Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-left">{formatCurrency(product.estimated_cost)}</TableCell>
                    <TableCell className="text-[12px] text-left">
                      {product.last_calculated_cost > 0 ? formatCurrency(product.last_calculated_cost) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-[12px] text-left">{formatCurrency(product.selling_price)}</TableCell>
                    <TableCell className="text-center">
                      {linkedItem ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1 hover:bg-emerald-100">
                            <Link className="w-2.5 h-2.5" />
                            {linkedItem.item_code}
                          </Badge>
                          <span className="text-[10px] text-emerald-600">{linkedStock?.quantity || 0} {product.unit}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">غير مرتبط</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${statusColors[product.status]} text-[11px] hover:opacity-90`}>
                        {statusLabels[product.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewingProduct(product)} className="h-7 w-7 p-0">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(product)} className="h-7 w-7 p-0">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDuplicate(product.id)} className="h-7 w-7 p-0">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Product Modal - Multi-step */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </DialogTitle>
            <DialogDescription className="text-[12px]">
              {currentStep === 1 && 'الخطوة 1: البيانات الأساسية'}
              {currentStep === 2 && 'الخطوة 2: تعريف المراحل والمكونات'}
              {currentStep === 3 && 'الخطوة 3: معاينة التكلفة'}
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2 py-3">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(step)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] transition-colors ${
                    currentStep === step ? 'bg-blue-600 text-white' :
                    currentStep > step ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {currentStep > step ? <CircleCheck className="w-4 h-4" /> : step}
                </button>
                {step < 3 && <div className={`w-16 h-0.5 ${currentStep > step ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-muted-foreground block mb-1">اسم المنتج *</label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} className="text-[12px]" placeholder="مثال: قميص قطني" />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground block mb-1">كود المنتج *</label>
                  <Input value={formCode} onChange={e => setFormCode(e.target.value)} className="text-[12px]" placeholder="مثال: MFG-005" />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground block mb-1">الوحدة</label>
                  <Select value={formUnit} onValueChange={setFormUnit}>
                    <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="قطعة">قطعة</SelectItem>
                      <SelectItem value="متر">متر</SelectItem>
                      <SelectItem value="كيلو">كيلو</SelectItem>
                      <SelectItem value="طن">طن</SelectItem>
                      <SelectItem value="لتر">لتر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground block mb-1">الحالة</label>
                  <Select value={formStatus} onValueChange={v => setFormStatus(v as ProductStatus)}>
                    <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="discontinued">متوقف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">ربط بصنف المخزون (م��تجات تامة)</label>
                <Select value={formInventoryItem} onValueChange={setFormInventoryItem}>
                  <SelectTrigger className="text-[12px]"><SelectValue placeholder="اختر صنف من مخزون المنتجات التامة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— بدون ربط —</SelectItem>
                    {accountingState.items
                      .filter(i => i.category_id === 'ic-mfg-fg' || i.item_type === 'sellable')
                      .map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.item_code} — {item.item_name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                {formInventoryItem && (() => {
                  const item = accountingState.items.find(i => i.id === formInventoryItem);
                  const stock = item ? accountingState.itemStock.find(s => s.item_id === item.id && s.warehouse_id === 'w-fg') : null;
                  return item ? (
                    <div className="mt-1.5 p-2 bg-emerald-50 rounded-md text-[11px] text-emerald-700 flex items-center gap-2">
                      <Link className="w-3 h-3" />
                      مرتبط بـ {item.item_name} — رصيد المخزن التام: {stock?.quantity || 0} {item.unit}
                    </div>
                  ) : null;
                })()}
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">ملاحظات</label>
                <Input value={formNotes} onChange={e => setFormNotes(e.target.value)} className="text-[12px]" placeholder="ملاحظات إضافية..." />
              </div>
            </div>
          )}

          {/* Step 2: Stages */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px]" style={{ fontWeight: 600 }}>مراحل الإنتاج ({formStages.length})</p>
                <Button onClick={addStageToForm} variant="outline" className="text-[12px] gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" /> إضافة مرحلة
                </Button>
              </div>

              {formStages.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Package className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-[13px] text-muted-foreground">لم يتم إضافة مراحل بعد</p>
                  <Button onClick={addStageToForm} variant="outline" className="mt-3 text-[12px] gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> إضافة مرحلة
                  </Button>
                </div>
              ) : formStages.map((stage, si) => (
                <Card key={stage.id} className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    {/* Stage Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <Badge className="bg-blue-100 text-blue-700 text-[11px]">مرحلة {stage.stage_order}</Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => moveStage(si, 'up')} className="h-6 w-6 p-0" disabled={si === 0}>
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => moveStage(si, 'down')} className="h-6 w-6 p-0" disabled={si === formStages.length - 1}>
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFormStage(si)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Stage Fields */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">المرحلة</label>
                        <Select value={stage.stage_id} onValueChange={v => {
                          const s = stages.find(st => st.id === v);
                          if (s) {
                            const dept = departments.find(d => d.id === s.department_id);
                            updateFormStage(si, {
                              stage_id: s.id, stage_name: s.name,
                              department_id: s.department_id, department_name: dept?.name || '',
                              stage_type: s.stage_type, production_price: s.production_price,
                            });
                          }
                        }}>
                          <SelectTrigger className="text-[11px] h-8"><SelectValue placeholder="اختر" /></SelectTrigger>
                          <SelectContent>
                            {stages.filter(s => s.is_active).map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">القسم</label>
                        <Input value={stage.department_name} readOnly className="text-[11px] h-8 bg-slate-50" />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">نوع الأجر</label>
                        <Select value={stage.stage_type} onValueChange={v => updateFormStage(si, { stage_type: v as StageType })}>
                          <SelectTrigger className="text-[11px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="piece_rate">بالقطعة</SelectItem>
                            <SelectItem value="hourly">بالساعة</SelectItem>
                            <SelectItem value="weekly">أسبوعي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">
                          {stage.stage_type === 'piece_rate' ? 'سعر القطعة' : 'تخصيص التكلفة'}
                        </label>
                        <Input type="number" value={stage.production_price} onChange={e => updateFormStage(si, { production_price: +e.target.value })}
                          className="text-[11px] h-8" />
                      </div>
                    </div>

                    {/* Components */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px]" style={{ fontWeight: 600 }}>المكونات ({stage.components.length})</p>
                        <Button onClick={() => addComponentToStage(si)} variant="ghost" size="sm" className="text-[11px] h-6 gap-1 text-blue-600">
                          <Plus className="w-3 h-3" /> إضافة مكون
                        </Button>
                      </div>
                      {stage.components.map((comp, ci) => (
                        <div key={comp.id} className="grid grid-cols-12 gap-2 items-end mb-2">
                          <div className="col-span-4">
                            {ci === 0 && <label className="text-[10px] text-muted-foreground block mb-0.5">المادة الخام</label>}
                            <Select value={comp.material_id} onValueChange={v => {
                              const mat = materials.find(m => m.id === v);
                              if (mat) updateComponent(si, ci, { material_id: mat.id, material_name: mat.name, unit_cost: mat.unit_cost });
                            }}>
                              <SelectTrigger className="text-[10px] h-7"><SelectValue placeholder="اختر" /></SelectTrigger>
                              <SelectContent>
                                {materials.map(m => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            {ci === 0 && <label className="text-[10px] text-muted-foreground block mb-0.5">الكمية/وحدة</label>}
                            <Input type="number" step="0.01" value={comp.quantity_per_unit}
                              onChange={e => updateComponent(si, ci, { quantity_per_unit: +e.target.value })}
                              className="text-[10px] h-7" />
                          </div>
                          <div className="col-span-2">
                            {ci === 0 && <label className="text-[10px] text-muted-foreground block mb-0.5">الهدر %</label>}
                            <Input type="number" step="0.1" value={comp.waste_percentage}
                              onChange={e => updateComponent(si, ci, { waste_percentage: +e.target.value })}
                              className="text-[10px] h-7" />
                          </div>
                          <div className="col-span-2">
                            {ci === 0 && <label className="text-[10px] text-muted-foreground block mb-0.5">سعر الوحدة</label>}
                            <Input type="number" step="0.01" value={comp.unit_cost}
                              onChange={e => updateComponent(si, ci, { unit_cost: +e.target.value })}
                              className="text-[10px] h-7 bg-slate-50" readOnly />
                          </div>
                          <div className="col-span-2 flex items-center gap-1">
                            {ci === 0 && <label className="text-[10px] text-muted-foreground block mb-0.5 invisible">حذف</label>}
                            <span className="text-[10px]" style={{ fontWeight: 600 }}>
                              {formatCurrency(comp.quantity_per_unit * (1 + comp.waste_percentage / 100) * comp.unit_cost)}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => removeComponent(si, ci)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 shrink-0">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {si > 0 && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                          <CircleCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-[10px] text-blue-700">مخرجات المرحلة السابقة مرتبطة تلقائياً</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Step 3: Cost Preview */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-[11px] text-blue-600 mb-1">تكلفة المواد</p>
                    <p className="text-[20px] text-blue-800" style={{ fontWeight: 700 }}>{formatCurrency(estimatedCost.material)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-[11px] text-emerald-600 mb-1">تكلفة العمالة</p>
                    <p className="text-[20px] text-emerald-800" style={{ fontWeight: 700 }}>{formatCurrency(estimatedCost.labor)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-[11px] text-amber-600 mb-1">التكلفة الإجمالية / وحدة</p>
                    <p className="text-[20px] text-amber-800" style={{ fontWeight: 700 }}>{formatCurrency(estimatedCost.total)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Stages Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[13px]">ملخص المراحل</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-right text-[11px] pr-4">المرحلة</TableHead>
                        <TableHead className="text-right text-[11px]">القسم</TableHead>
                        <TableHead className="text-center text-[11px]">نوع الأجر</TableHead>
                        <TableHead className="text-center text-[11px]">المكونات</TableHead>
                        <TableHead className="text-left text-[11px]">تكلفة المواد</TableHead>
                        <TableHead className="text-left text-[11px]">تكلفة العمالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formStages.map(stage => {
                        const matCost = stage.components.filter(c => !c.is_from_previous_stage)
                          .reduce((s, c) => s + (c.quantity_per_unit * (1 + c.waste_percentage / 100) * c.unit_cost), 0);
                        return (
                          <TableRow key={stage.id}>
                            <TableCell className="text-[11px] pr-4">{stage.stage_name || '-'}</TableCell>
                            <TableCell className="text-[11px]">{stage.department_name || '-'}</TableCell>
                            <TableCell className="text-[11px] text-center">
                              <Badge variant="outline" className="text-[10px]">{stageTypeLabels[stage.stage_type]}</Badge>
                            </TableCell>
                            <TableCell className="text-[11px] text-center">{stage.components.length}</TableCell>
                            <TableCell className="text-[11px] text-left">{formatCurrency(matCost)}</TableCell>
                            <TableCell className="text-[11px] text-left">{formatCurrency(stage.production_price)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2 pt-4">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="text-[12px] gap-1">
                  <ChevronRight className="w-3.5 h-3.5" /> السابق
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="text-[12px]">إلغاء</Button>
              {currentStep < 3 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)} className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1">
                  التالي <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-[12px] gap-1">
                  <CircleCheck className="w-3.5 h-3.5" /> {editingProduct ? 'حفظ التعديلات' : 'إنشاء المنتج'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Product Modal */}
      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">نسخ المنتج</DialogTitle>
            <DialogDescription className="text-[12px]">إنشاء نسخة من منتج موجود مع إمكانية التعديل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1">المنتج المصدر</label>
              <Select value={duplicateSource} onValueChange={v => {
                setDuplicateSource(v);
                const src = products.find(p => p.id === v);
                if (src) { setDupName(`${src.name} - نسخة`); setDupCode(`${src.code}-COPY`); }
              }}>
                <SelectTrigger className="text-[12px]"><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1">اسم المنتج الجديد</label>
              <Input value={dupName} onChange={e => setDupName(e.target.value)} className="text-[12px]" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1">كود المنتج الجديد</label>
              <Input value={dupCode} onChange={e => setDupCode(e.target.value)} className="text-[12px]" />
            </div>
            <div className="space-y-2 border rounded-lg p-3">
              <p className="text-[12px]" style={{ fontWeight: 600 }}>خيارات النسخ</p>
              <label className="flex items-center gap-2 text-[12px]">
                <Checkbox checked={dupCopyStages} onCheckedChange={v => setDupCopyStages(!!v)} />
                نسخ جميع المراحل
              </label>
              <label className="flex items-center gap-2 text-[12px]">
                <Checkbox checked={dupCopyMaterials} onCheckedChange={v => setDupCopyMaterials(!!v)} />
                نسخ جميع المواد
              </label>
              <label className="flex items-center gap-2 text-[12px]">
                <Checkbox checked={dupResetPrices} onCheckedChange={v => setDupResetPrices(!!v)} />
                إعادة تعيين أسعار الإنتاج
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateModal(false)} className="text-[12px]">إلغاء</Button>
            <Button onClick={handleDuplicate} className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1">
              <Copy className="w-3.5 h-3.5" /> نسخ المنتج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Modal */}
      <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">تفاصيل المنتج: {viewingProduct?.name}</DialogTitle>
            <DialogDescription className="text-[12px]">عرض تفاصيل المنتج ومراحل إنتاجه</DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">الكود</p>
                  <p className="text-[13px]" style={{ fontWeight: 600 }}>{viewingProduct.code}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">الوحدة</p>
                  <p className="text-[13px]" style={{ fontWeight: 600 }}>{viewingProduct.unit}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">التكلفة التقديرية</p>
                  <p className="text-[13px]" style={{ fontWeight: 600 }}>{formatCurrency(viewingProduct.estimated_cost)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">سعر البيع</p>
                  <p className="text-[13px]" style={{ fontWeight: 600 }}>{formatCurrency(viewingProduct.selling_price)}</p>
                </div>
              </div>

              <p className="text-[13px]" style={{ fontWeight: 600 }}>مراحل الإنتاج ({viewingProduct.stages.length})</p>
              {viewingProduct.stages.map((stage, i) => (
                <Card key={stage.id} className="border">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-700 text-[10px]">مرحلة {stage.stage_order}</Badge>
                      <span className="text-[12px]" style={{ fontWeight: 600 }}>{stage.stage_name}</span>
                      <span className="text-[11px] text-muted-foreground">({stage.department_name})</span>
                      <Badge variant="outline" className="text-[10px]">{stageTypeLabels[stage.stage_type]}</Badge>
                      {stage.stage_type === 'piece_rate' && (
                        <span className="text-[11px] text-emerald-600">{formatCurrency(stage.production_price)} / قطعة</span>
                      )}
                    </div>
                    {stage.components.length > 0 && (
                      <div className="mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right text-[10px]">المكون</TableHead>
                              <TableHead className="text-center text-[10px]">الكمية/وحدة</TableHead>
                              <TableHead className="text-center text-[10px]">الهدر %</TableHead>
                              <TableHead className="text-left text-[10px]">التكلفة</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stage.components.map(c => (
                              <TableRow key={c.id}>
                                <TableCell className="text-[10px]">
                                  {c.is_from_previous_stage ? (
                                    <span className="text-blue-600">مخرجات المرحلة السابقة</span>
                                  ) : c.material_name}
                                </TableCell>
                                <TableCell className="text-[10px] text-center">{c.quantity_per_unit}</TableCell>
                                <TableCell className="text-[10px] text-center">{c.waste_percentage}%</TableCell>
                                <TableCell className="text-[10px] text-left">
                                  {c.is_from_previous_stage ? '-' : formatCurrency(c.quantity_per_unit * (1 + c.waste_percentage / 100) * c.unit_cost)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}