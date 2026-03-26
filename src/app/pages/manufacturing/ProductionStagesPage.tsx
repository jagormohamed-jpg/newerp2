import { useState, useMemo } from 'react';
import { useManufacturing } from '../../context/ManufacturingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import {
  Plus, Search, Edit, Workflow, Building, Users, DollarSign,
  CircleCheck, CircleX, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProductionStage, StageType } from '../../types/manufacturing';
import * as XLSX from 'xlsx';

const stageTypeLabels: Record<StageType, string> = { piece_rate: 'بالقطعة', hourly: 'بالساعة', weekly: 'أسبوعي' };
const stageTypeColors: Record<StageType, string> = {
  piece_rate: 'bg-blue-100 text-blue-700',
  hourly: 'bg-purple-100 text-purple-700',
  weekly: 'bg-amber-100 text-amber-700',
};

export function ProductionStagesPage() {
  const { stages, departments, products, invoices, workers, addStage, updateStage, formatCurrency } = useManufacturing();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStage, setEditingStage] = useState<ProductionStage | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [formType, setFormType] = useState<StageType>('piece_rate');
  const [formPrice, setFormPrice] = useState(0);
  const [formAllocation, setFormAllocation] = useState(0);
  const [formDesc, setFormDesc] = useState('');
  const [formActive, setFormActive] = useState(true);

  const filtered = useMemo(() => {
    return stages.filter(s => {
      const matchSearch = s.name.includes(search) || s.description.includes(search);
      const matchDept = deptFilter === 'all' || s.department_id === deptFilter;
      return matchSearch && matchDept;
    }).sort((a, b) => a.stage_order - b.stage_order);
  }, [stages, search, deptFilter]);

  const resetForm = () => {
    setFormName(''); setFormDeptId(''); setFormOrder(stages.length + 1);
    setFormType('piece_rate'); setFormPrice(0); setFormAllocation(0);
    setFormDesc(''); setFormActive(true);
  };

  const openAdd = () => {
    resetForm();
    setEditingStage(null);
    setShowModal(true);
  };

  const openEdit = (stage: ProductionStage) => {
    setFormName(stage.name); setFormDeptId(stage.department_id); setFormOrder(stage.stage_order);
    setFormType(stage.stage_type); setFormPrice(stage.production_price);
    setFormAllocation(stage.department_cost_allocation); setFormDesc(stage.description);
    setFormActive(stage.is_active); setEditingStage(stage); setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formDeptId) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    if (editingStage) {
      updateStage(editingStage.id, {
        name: formName, department_id: formDeptId, stage_order: formOrder,
        stage_type: formType, production_price: formPrice,
        department_cost_allocation: formAllocation, description: formDesc,
        is_active: formActive,
      });
      toast.success('تم تحديث المرحلة');
    } else {
      addStage({
        name: formName, department_id: formDeptId, stage_order: formOrder,
        stage_type: formType, production_price: formPrice,
        department_cost_allocation: formAllocation, description: formDesc,
        is_active: formActive,
      });
      toast.success('تم إضافة المرحلة');
    }
    setShowModal(false);
  };

  const getStageStats = (stageId: string) => {
    const stageInvoices = invoices.filter(i => i.stage_id === stageId && i.status === 'confirmed');
    const totalProduced = stageInvoices.reduce((s, i) => s + i.total_quantity, 0);
    const totalAmount = stageInvoices.reduce((s, i) => s + i.total_amount, 0);
    const stageWorkers = workers.filter(w => w.stage_id === stageId);
    const productsUsing = products.filter(p => p.stages.some(s => s.stage_id === stageId));
    return { totalProduced, totalAmount, workerCount: stageWorkers.length, productCount: productsUsing.length };
  };

  const exportToExcel = () => {
    const data = filtered.map(s => {
      const dept = departments.find(d => d.id === s.department_id);
      const stats = getStageStats(s.id);
      return {
        'اسم المرحلة': s.name,
        'القسم': dept?.name || '-',
        'الترتيب': s.stage_order,
        'نوع الأجر': stageTypeLabels[s.stage_type],
        'سعر القطعة': s.production_price,
        'عدد العمال': stats.workerCount,
        'عدد المنتجات': stats.productCount,
        'إجمالي الإنتاج': stats.totalProduced,
        'الحالة': s.is_active ? 'نشط' : 'متوقف',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المراحل');
    XLSX.writeFile(wb, 'production-stages.xlsx');
    toast.success('تم تصدير البيانات');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] text-foreground" style={{ fontWeight: 700 }}>مراحل الإنتاج</h1>
          <p className="text-[13px] text-muted-foreground mt-1">إدارة مراحل التصنيع وربطها بالأقسام والمنتجات</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToExcel} variant="outline" className="text-[12px] gap-1.5">
            <FileSpreadsheet className="w-4 h-4" /> تصدير
          </Button>
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1.5">
            <Plus className="w-4 h-4" /> إضافة مرحلة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">إجمالي المراحل</p>
              <p className="text-[18px]" style={{ fontWeight: 700 }}>{stages.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CircleCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">مراحل نشطة</p>
              <p className="text-[18px]" style={{ fontWeight: 700 }}>{stages.filter(s => s.is_active).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">أقسام متصلة</p>
              <p className="text-[18px]" style={{ fontWeight: 700 }}>{new Set(stages.map(s => s.department_id)).size}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">إجمالي العمال</p>
              <p className="text-[18px]" style={{ fontWeight: 700 }}>{workers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 text-[12px]" />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[180px] text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stages Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(stage => {
          const dept = departments.find(d => d.id === stage.department_id);
          const stats = getStageStats(stage.id);
          const maxProduced = Math.max(...stages.map(s => getStageStats(s.id).totalProduced), 1);
          return (
            <Card key={stage.id} className={`shadow-sm transition-all hover:shadow-md ${!stage.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-[14px]" style={{ fontWeight: 700 }}>
                      {stage.stage_order}
                    </div>
                    <div>
                      <p className="text-[14px]" style={{ fontWeight: 600 }}>{stage.name}</p>
                      <p className="text-[11px] text-muted-foreground">{dept?.name || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={`${stageTypeColors[stage.stage_type]} text-[10px]`}>
                      {stageTypeLabels[stage.stage_type]}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(stage)} className="h-7 w-7 p-0">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground mb-3">{stage.description}</p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground">العمال</p>
                    <p className="text-[14px]" style={{ fontWeight: 600 }}>{stats.workerCount}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground">المنتجات</p>
                    <p className="text-[14px]" style={{ fontWeight: 600 }}>{stats.productCount}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground">إجمالي الإنتاج</p>
                    <p className="text-[14px]" style={{ fontWeight: 600 }}>{stats.totalProduced}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground">
                      {stage.stage_type === 'piece_rate' ? 'سعر القطعة' : 'تخصيص التكلفة'}
                    </p>
                    <p className="text-[14px]" style={{ fontWeight: 600 }}>
                      {stage.stage_type === 'piece_rate' ? formatCurrency(stage.production_price) : formatCurrency(stage.department_cost_allocation)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>نسبة الإنتاج</span>
                    <span>{Math.round((stats.totalProduced / maxProduced) * 100)}%</span>
                  </div>
                  <Progress value={(stats.totalProduced / maxProduced) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">{editingStage ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}</DialogTitle>
            <DialogDescription className="text-[12px]">تعريف مرحلة إنتاج وربطها بقسم</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">اسم المرحلة *</label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} className="text-[12px]" placeholder="مثال: مرحلة القص" />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">القسم *</label>
                <Select value={formDeptId} onValueChange={setFormDeptId}>
                  <SelectTrigger className="text-[12px]"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">ترتيب المرحلة</label>
                <Input type="number" value={formOrder} onChange={e => setFormOrder(+e.target.value)} className="text-[12px]" />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">نوع الأجر</label>
                <Select value={formType} onValueChange={v => setFormType(v as StageType)}>
                  <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece_rate">بالقطعة</SelectItem>
                    <SelectItem value="hourly">بالساعة</SelectItem>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formType === 'piece_rate' ? (
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">سعر إنتاج القطعة</label>
                <Input type="number" value={formPrice} onChange={e => setFormPrice(+e.target.value)} className="text-[12px]" />
              </div>
            ) : (
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">تخصيص تكلفة القسم</label>
                <Input type="number" value={formAllocation} onChange={e => setFormAllocation(+e.target.value)} className="text-[12px]" />
              </div>
            )}
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1">الوصف</label>
              <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} className="text-[12px]" placeholder="وصف المرحلة..." />
            </div>
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300" />
              المرحلة نشطة
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} className="text-[12px]">إلغاء</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1">
              <CircleCheck className="w-3.5 h-3.5" /> {editingStage ? 'حفظ' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}