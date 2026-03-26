import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Plus, Package, Warehouse, ArrowLeftRight, Search,
  Download, Upload, Edit, Trash2, ChevronDown, ChevronRight,
  AlertTriangle, FileSpreadsheet, Tag, Scale,
  ArrowRight, FileText, TrendingUp, TrendingDown,
  X, Check, DollarSign, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import type { Item, ItemType, UnitOfMeasure, WarehouseTransfer } from '../types/accounting';

const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split('T')[0];

const itemTypeLabels: Record<ItemType, string> = {
  sellable: 'قابل للبيع',
  raw_material: 'مادة خام',
  service: 'خدمة',
};
const itemTypeColors: Record<ItemType, string> = {
  sellable: 'bg-blue-100 text-blue-700',
  raw_material: 'bg-amber-100 text-amber-700',
  service: 'bg-purple-100 text-purple-700',
};

// ==================== Main Page ====================
export function WarehouseModulePage() {
  const { state, formatCurrency } = useAccounting();
  const [mainTab, setMainTab] = useState('items');

  const totalItems = state.items.length;
  const totalStockValue = state.itemStock.reduce((s, i) => s + i.quantity * i.average_cost, 0);
  const lowStockItems = state.items.filter(item => {
    const total = state.itemStock.filter(s => s.item_id === item.id).reduce((s, i) => s + i.quantity, 0);
    return total <= item.minimum_stock && total > 0;
  }).length;
  const outOfStockItems = state.items.filter(item => {
    const total = state.itemStock.filter(s => s.item_id === item.id).reduce((s, i) => s + i.quantity, 0);
    return total === 0;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] text-foreground font-bold">المخازن والأصناف</h1>
          <p className="text-[12px] text-muted-foreground">إدارة المخازن والأصناف والتحويلات ووحدات القياس</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Package className="w-5 h-5 mx-auto mb-1 text-blue-600" />
          <div className="text-[18px] font-bold text-blue-600">{totalItems}</div>
          <div className="text-[11px] text-muted-foreground">إجمالي الأصناف</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Warehouse className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
          <div className="text-[18px] font-bold text-indigo-600">{state.warehouses.length}</div>
          <div className="text-[11px] text-muted-foreground">المخازن</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <BarChart3 className="w-5 h-5 mx-auto mb-1 text-teal-600" />
          <div className="text-[16px] font-bold text-teal-600">{formatCurrency(totalStockValue)}</div>
          <div className="text-[11px] text-muted-foreground">قيمة المخزون</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-600" />
          <div className="text-[18px] font-bold text-amber-600">{lowStockItems + outOfStockItems}</div>
          <div className="text-[11px] text-muted-foreground">تنبيهات المخزون</div>
        </CardContent></Card>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="items" className="gap-1.5 text-[12px]"><Package className="w-3.5 h-3.5" /> الأصناف</TabsTrigger>
          <TabsTrigger value="warehouses" className="gap-1.5 text-[12px]"><Warehouse className="w-3.5 h-3.5" /> المخازن</TabsTrigger>
          <TabsTrigger value="movement" className="gap-1.5 text-[12px]"><BarChart3 className="w-3.5 h-3.5" /> حركة الأصناف</TabsTrigger>
          <TabsTrigger value="transfer" className="gap-1.5 text-[12px]"><ArrowLeftRight className="w-3.5 h-3.5" /> تحويل بين المخازن</TabsTrigger>
          <TabsTrigger value="units" className="gap-1.5 text-[12px]"><Scale className="w-3.5 h-3.5" /> وحدات القياس</TabsTrigger>
          <TabsTrigger value="excel" className="gap-1.5 text-[12px]"><FileSpreadsheet className="w-3.5 h-3.5" /> استيراد / تصدير</TabsTrigger>
          <TabsTrigger value="prices" className="gap-1.5 text-[12px]"><DollarSign className="w-3.5 h-3.5" /> تعديل الأسعار</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-3"><ItemsTab /></TabsContent>
        <TabsContent value="warehouses" className="mt-3"><WarehousesTab /></TabsContent>
        <TabsContent value="movement" className="mt-3"><ItemMovementTab /></TabsContent>
        <TabsContent value="transfer" className="mt-3"><WarehouseTransferTab /></TabsContent>
        <TabsContent value="units" className="mt-3"><UnitsTab /></TabsContent>
        <TabsContent value="excel" className="mt-3"><ExcelTab /></TabsContent>
        <TabsContent value="prices" className="mt-3"><PricesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Items Tab ====================
function ItemsTab() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | ItemType>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [showVariants, setShowVariants] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    item_code: '', item_name: '', category_id: '', unit: 'قطعة', unit_id: '',
    item_type: 'sellable' as ItemType, has_variants: false,
    purchase_price: 0, selling_price: 0, minimum_stock: 0, barcode: '', description: '',
  });

  const units = (state.unitsOfMeasure || []);

  const getItemTotalStock = (itemId: string) =>
    state.itemStock.filter(s => s.item_id === itemId).reduce((sum, s) => sum + s.quantity, 0);

  const filteredItems = state.items.filter(i => {
    const matchSearch = !searchTerm || i.item_name.includes(searchTerm) || i.item_code.includes(searchTerm) || (i.barcode || '').includes(searchTerm);
    const matchType = filterType === 'all' || (i.item_type || 'sellable') === filterType;
    const matchCat = filterCategory === 'all' || i.category_id === filterCategory;
    return matchSearch && matchType && matchCat;
  });

  const openAdd = () => {
    setEditItem(null);
    setFormData({ item_code: '', item_name: '', category_id: '', unit: 'قطعة', unit_id: '', item_type: 'sellable', has_variants: false, purchase_price: 0, selling_price: 0, minimum_stock: 0, barcode: '', description: '' });
    setShowDialog(true);
  };

  const openEdit = (item: Item) => {
    setEditItem(item);
    setFormData({
      item_code: item.item_code, item_name: item.item_name, category_id: item.category_id,
      unit: item.unit, unit_id: item.unit_id || '', item_type: (item.item_type || 'sellable') as ItemType,
      has_variants: item.has_variants || false,
      purchase_price: item.purchase_price, selling_price: item.selling_price,
      minimum_stock: item.minimum_stock, barcode: item.barcode || '', description: item.description || '',
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.item_name) return;
    const itemData: Item = {
      id: editItem?.id || uid(),
      item_code: formData.item_code || String(state.items.length + 1).padStart(3, '0'),
      item_name: formData.item_name,
      category_id: formData.category_id,
      unit: formData.unit,
      unit_id: formData.unit_id || undefined,
      item_type: formData.item_type,
      has_variants: formData.has_variants,
      purchase_price: formData.purchase_price,
      selling_price: formData.selling_price,
      minimum_stock: formData.minimum_stock,
      barcode: formData.barcode,
      description: formData.description,
      is_active: editItem?.is_active ?? true,
      created_at: editItem?.created_at || new Date().toISOString(),
    };
    if (editItem) {
      dispatch({ type: 'UPDATE_ITEM', payload: itemData });
      toast.success('تم تحديث الصنف بنجاح');
    } else {
      dispatch({ type: 'ADD_ITEM', payload: itemData });
      toast.success('تم إضافة الصنف بنجاح');
    }
    setShowDialog(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-[16px] font-semibold">الأصناف</h2>
        <Button onClick={openAdd} className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /> إضافة صنف</Button>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الكود أو الباركود..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10 text-[13px]" />
          </div>
          <Select value={filterType} onValueChange={v => setFilterType(v as 'all' | ItemType)}>
            <SelectTrigger className="w-[150px] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {Object.entries(itemTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التصنيفات</SelectItem>
              {state.itemCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Items Table */}
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>كود</TableHead>
            <TableHead>اسم الصنف</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead className="hidden md:table-cell">التصنيف</TableHead>
            <TableHead>الوحدة</TableHead>
            <TableHead>سعر الشراء</TableHead>
            <TableHead>سعر البيع</TableHead>
            <TableHead>المخزون</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>إجراء</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">لا توجد أصناف</TableCell></TableRow>
            ) : filteredItems.map(item => {
              const totalStock = getItemTotalStock(item.id);
              const isLow = totalStock <= item.minimum_stock && totalStock > 0;
              const isOut = totalStock === 0;
              const itemType = item.item_type || 'sellable';
              const variants = (state.itemVariants || []).filter(v => v.item_id === item.id);
              const itemRows: React.ReactElement[] = [
                <TableRow key={`${item.id}-row`} className="hover:bg-accent/20">
                    <TableCell className="text-[13px] text-muted-foreground font-mono">{item.item_code}</TableCell>
                    <TableCell className="text-[13px]">
                      <div className="flex items-center gap-1.5">
                        {item.has_variants && (
                          <button onClick={() => setShowVariants(showVariants === item.id ? null : item.id)} className="text-blue-500 hover:text-blue-700">
                            {showVariants === item.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {item.item_name}
                        {item.has_variants && variants.length > 0 && <Badge className="bg-purple-100 text-purple-600 text-[10px]">{variants.length} تباين</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={`text-[10px] ${itemTypeColors[itemType]}`}>{itemTypeLabels[itemType]}</Badge></TableCell>
                    <TableCell className="text-[13px] hidden md:table-cell">{state.itemCategories.find(c => c.id === item.category_id)?.name || '-'}</TableCell>
                    <TableCell className="text-[13px]">{item.unit}</TableCell>
                    <TableCell className="text-[13px]">{formatCurrency(item.purchase_price)}</TableCell>
                    <TableCell className="text-[13px] font-medium">{formatCurrency(item.selling_price)}</TableCell>
                    <TableCell className="text-[13px]">{totalStock}</TableCell>
                    <TableCell>
                      {isOut ? <Badge className="bg-red-100 text-red-700 text-[10px]">نفد</Badge>
                        : isLow ? <Badge className="bg-amber-100 text-amber-700 text-[10px]">منخفض</Badge>
                        : <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">متاح</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ,
              ];
              if (showVariants === item.id && variants.length > 0) {
                itemRows.push(
                  <TableRow key={`${item.id}-variants`} className="bg-accent/10">
                    <TableCell colSpan={10} className="py-0">
                      <div className="p-3 space-y-1.5">
                        <p className="text-[12px] font-semibold text-muted-foreground">التباينات:</p>
                        {variants.map(v => (
                          <div key={v.id} className="flex items-center gap-4 text-[12px] bg-background p-2 rounded border">
                            <span className="font-medium">{v.variant_name}</span>
                            <span className="text-muted-foreground">{v.attributes.map(a => `${a.key}: ${a.value}`).join(' | ')}</span>
                            <span className="text-muted-foreground">SKU: {v.sku}</span>
                            <span className="text-emerald-600">بيع: {formatCurrency(v.selling_price)}</span>
                            <Badge className={v.is_active ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'bg-gray-100 text-gray-700 text-[10px]'}>{v.is_active ? 'نشط' : 'معطل'}</Badge>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }
              return itemRows;
            }).flat()}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? 'تعديل صنف' : 'إضافة صنف جديد'}</DialogTitle>
            <DialogDescription className="sr-only">نموذج إضافة أو تعديل صنف</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[13px] text-muted-foreground mb-1 block">كود الصنف</label>
                <Input value={formData.item_code} onChange={e => setFormData({ ...formData, item_code: e.target.value })} placeholder="تلقائي" /></div>
              <div><label className="text-[13px] text-muted-foreground mb-1 block">اسم الصنف *</label>
                <Input value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[13px] text-muted-foreground mb-1 block">نوع الصنف</label>
                <Select value={formData.item_type} onValueChange={v => setFormData({ ...formData, item_type: v as ItemType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(itemTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-[13px] text-muted-foreground mb-1 block">التصنيف</label>
                <Select value={formData.category_id} onValueChange={v => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                  <SelectContent>{state.itemCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[13px] text-muted-foreground mb-1 block">وحدة القياس</label>
                <Select value={formData.unit_id || formData.unit} onValueChange={v => {
                  const unit = units.find(u => u.id === v);
                  setFormData({ ...formData, unit_id: v, unit: unit?.name || v });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {units.filter(u => u.base_unit_id === null).flatMap(u => [
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>,
                      ...units.filter(sub => sub.base_unit_id === u.id).map(sub => (
                        <SelectItem key={sub.id} value={sub.id} className="pr-6">
                          ↳ {sub.name} ({sub.symbol}) = {sub.conversion_rate} {u.symbol}
                        </SelectItem>
                      )),
                    ])}
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-[13px] text-muted-foreground mb-1 block">الباركود</label>
                <Input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-[13px] text-muted-foreground mb-1 block">سعر الشراء</label>
                <Input type="number" value={formData.purchase_price} onChange={e => setFormData({ ...formData, purchase_price: Number(e.target.value) })} /></div>
              <div><label className="text-[13px] text-muted-foreground mb-1 block">سعر البيع</label>
                <Input type="number" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: Number(e.target.value) })} /></div>
              <div><label className="text-[13px] text-muted-foreground mb-1 block">الحد الأدنى</label>
                <Input type="number" value={formData.minimum_stock} onChange={e => setFormData({ ...formData, minimum_stock: Number(e.target.value) })} /></div>
            </div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">الوصف</label>
              <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
              <input type="checkbox" id="has_variants" checked={formData.has_variants}
                onChange={e => setFormData({ ...formData, has_variants: e.target.checked })} className="w-4 h-4 rounded" />
              <label htmlFor="has_variants" className="text-[13px] cursor-pointer">
                <span className="font-medium">هذا الصنف له تباينات</span>
                <span className="text-muted-foreground block text-[11px]">مثل: ألوان، مقاسات، أو خصائص أخرى</span>
              </label>
            </div>
            {formData.item_type === 'raw_material' && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[12px] text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                المواد الخام لا تظهر في قوائم الأصناف في فاتورة البيع
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={!formData.item_name}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Warehouses Tab ====================
function WarehousesTab() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', location: '', manager_name: '' });

  const handleSubmit = () => {
    dispatch({
      type: 'ADD_WAREHOUSE',
      payload: { id: uid(), name: formData.name, location: formData.location, manager_name: formData.manager_name, is_active: true, created_at: new Date().toISOString() },
    });
    toast.success('تم إضافة المخزن بنجاح');
    setShowDialog(false);
    setFormData({ name: '', location: '', manager_name: '' });
  };

  const getWarehouseStock = (warehouseId: string) =>
    state.itemStock.filter(s => s.warehouse_id === warehouseId).map(s => {
      const item = state.items.find(i => i.id === s.item_id);
      return { ...s, item_name: item?.item_name || '-', item_code: item?.item_code || '-', unit: item?.unit || '-' };
    });

  const getWarehouseValue = (warehouseId: string) =>
    state.itemStock.filter(s => s.warehouse_id === warehouseId).reduce((sum, s) => sum + s.quantity * s.average_cost, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">المخازن</h2>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4" /> إضافة مخزن</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.warehouses.map(wh => (
          <Card key={wh.id} className={`cursor-pointer transition-shadow hover:shadow-md ${selectedWarehouse === wh.id ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={() => setSelectedWarehouse(selectedWarehouse === wh.id ? null : wh.id)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[14px] font-medium">{wh.name}</p>
                  <p className="text-[11px] text-muted-foreground">{wh.location}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-accent/30 p-2 rounded-lg">
                  <p className="text-[11px] text-muted-foreground">الأصناف</p>
                  <p className="text-[16px] font-semibold">{getWarehouseStock(wh.id).filter(s => s.quantity > 0).length}</p>
                </div>
                <div className="bg-accent/30 p-2 rounded-lg">
                  <p className="text-[11px] text-muted-foreground">القيمة</p>
                  <p className="text-[13px] text-indigo-700 font-medium">{formatCurrency(getWarehouseValue(wh.id))}</p>
                </div>
              </div>
              {wh.manager_name && <p className="text-[11px] text-muted-foreground mt-2">المسؤول: {wh.manager_name}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedWarehouse && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">محتويات: {state.warehouses.find(w => w.id === selectedWarehouse)?.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>كود</TableHead><TableHead>الصنف</TableHead><TableHead>الكمية</TableHead>
                <TableHead>الوحدة</TableHead><TableHead>متوسط التكلفة</TableHead><TableHead>القيمة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {getWarehouseStock(selectedWarehouse).map(stock => (
                  <TableRow key={stock.id}>
                    <TableCell className="text-[13px] font-mono">{stock.item_code}</TableCell>
                    <TableCell className="text-[13px]">{stock.item_name}</TableCell>
                    <TableCell className="text-[13px]">{stock.quantity}</TableCell>
                    <TableCell className="text-[13px]">{stock.unit}</TableCell>
                    <TableCell className="text-[13px]">{formatCurrency(stock.average_cost)}</TableCell>
                    <TableCell className="text-[13px]">{formatCurrency(stock.quantity * stock.average_cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة مخزن جديد</DialogTitle><DialogDescription className="sr-only">نموذج مخزن</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-[13px] text-muted-foreground mb-1 block">ا��م المخزن *</label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">الموقع</label><Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} /></div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">المسؤول</label><Input value={formData.manager_name} onChange={e => setFormData({ ...formData, manager_name: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700" disabled={!formData.name}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Item Movement Tab ====================
function ItemMovementTab() {
  const { state, formatCurrency } = useAccounting();
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const movements = useMemo(() => {
    if (!selectedItem) return [];
    const moves: { date: string; typeLabel: string; qty: number; direction: 'in' | 'out'; ref: string; warehouse: string; cost: number }[] = [];

    state.purchaseInvoiceItems.filter(pi => pi.item_id === selectedItem).forEach(pi => {
      const invoice = state.purchaseInvoices.find(inv => inv.id === pi.invoice_id);
      if (!invoice) return;
      if (selectedWarehouse !== 'all' && pi.warehouse_id !== selectedWarehouse) return;
      const wh = state.warehouses.find(w => w.id === pi.warehouse_id)?.name || '-';
      moves.push({ date: invoice.invoice_date, typeLabel: 'مشتريات', qty: pi.quantity, direction: 'in', ref: invoice.invoice_number, warehouse: wh, cost: pi.unit_price });
    });

    state.salesInvoiceItems.filter(si => si.item_id === selectedItem).forEach(si => {
      const invoice = state.salesInvoices.find(inv => inv.id === si.invoice_id);
      if (!invoice) return;
      if (selectedWarehouse !== 'all' && si.warehouse_id !== selectedWarehouse) return;
      const wh = state.warehouses.find(w => w.id === si.warehouse_id)?.name || '-';
      moves.push({ date: invoice.invoice_date, typeLabel: 'مبيعات', qty: si.quantity, direction: 'out', ref: invoice.invoice_number, warehouse: wh, cost: si.unit_price });
    });

    (state.warehouseTransfers || []).forEach(t => {
      const ti = t.items.find(ti => ti.item_id === selectedItem);
      if (!ti) return;
      const fromWh = state.warehouses.find(w => w.id === t.from_warehouse_id)?.name || '-';
      const toWh = state.warehouses.find(w => w.id === t.to_warehouse_id)?.name || '-';
      if (selectedWarehouse === 'all' || t.from_warehouse_id === selectedWarehouse) {
        moves.push({ date: t.transfer_date, typeLabel: 'تحويل خارج', qty: ti.quantity, direction: 'out', ref: t.transfer_number, warehouse: fromWh, cost: ti.unit_cost });
      }
      if (selectedWarehouse === 'all' || t.to_warehouse_id === selectedWarehouse) {
        moves.push({ date: t.transfer_date, typeLabel: 'تحويل داخل', qty: ti.quantity, direction: 'in', ref: t.transfer_number, warehouse: toWh, cost: ti.unit_cost });
      }
    });

    return moves
      .filter(m => (!dateFrom || m.date >= dateFrom) && (!dateTo || m.date <= dateTo))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedItem, selectedWarehouse, dateFrom, dateTo, state]);

  const totalIn = movements.filter(m => m.direction === 'in').reduce((s, m) => s + m.qty, 0);
  const totalOut = movements.filter(m => m.direction === 'out').reduce((s, m) => s + m.qty, 0);
  const currentStock = selectedItem
    ? (selectedWarehouse !== 'all'
      ? state.itemStock.find(s => s.item_id === selectedItem && s.warehouse_id === selectedWarehouse)?.quantity || 0
      : state.itemStock.filter(s => s.item_id === selectedItem).reduce((s, i) => s + i.quantity, 0))
    : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-[16px] font-semibold">كشف حركة الأصناف</h2>
      <Card><CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[12px] text-muted-foreground block mb-1">الصنف *</label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="text-[13px]"><SelectValue placeholder="اختر الصنف" /></SelectTrigger>
              <SelectContent>{state.items.map(i => <SelectItem key={i.id} value={i.id}>{i.item_code} - {i.item_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-[160px]">
            <label className="text-[12px] text-muted-foreground block mb-1">المخزن</label>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المخازن</SelectItem>
                {state.warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <label className="text-[12px] text-muted-foreground block mb-1">من تاريخ</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-[13px] h-9" />
          </div>
          <div className="w-[140px]">
            <label className="text-[12px] text-muted-foreground block mb-1">إلى تاريخ</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-[13px] h-9" />
          </div>
        </div>
      </CardContent></Card>

      {selectedItem ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-3 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
              <div className="text-[18px] font-bold text-emerald-600">{totalIn}</div>
              <div className="text-[11px] text-muted-foreground">إجمالي الوارد</div>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <TrendingDown className="w-5 h-5 mx-auto mb-1 text-red-600" />
              <div className="text-[18px] font-bold text-red-600">{totalOut}</div>
              <div className="text-[11px] text-muted-foreground">إجمالي الصادر</div>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <Package className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <div className="text-[18px] font-bold text-blue-600">{currentStock}</div>
              <div className="text-[11px] text-muted-foreground">الرصيد الحالي</div>
            </CardContent></Card>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>التاريخ</TableHead><TableHead>النوع</TableHead><TableHead>المرجع</TableHead>
                <TableHead>المخزن</TableHead><TableHead>الكمية</TableHead><TableHead>السعر</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد حركات للصنف المحدد</TableCell></TableRow>
                ) : movements.map((m, i) => (
                  <TableRow key={i} className="hover:bg-accent/20">
                    <TableCell className="text-[13px]">{m.date}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${m.direction === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{m.typeLabel}</Badge></TableCell>
                    <TableCell className="text-[13px] font-mono">{m.ref}</TableCell>
                    <TableCell className="text-[13px]">{m.warehouse}</TableCell>
                    <TableCell className={`text-[13px] font-semibold ${m.direction === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.direction === 'in' ? '+' : '-'}{m.qty}
                    </TableCell>
                    <TableCell className="text-[13px]">{formatCurrency(m.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-[14px]">اختر صنفاً لعرض حركاته</p>
        </div>
      )}
    </div>
  );
}

// ==================== Warehouse Transfer Tab ====================
function WarehouseTransferTab() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [transferDate, setTransferDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [transferItems, setTransferItems] = useState<{ item_id: string; quantity: number; unit_cost: number }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const getItemStock = (itemId: string) =>
    state.itemStock.find(s => s.item_id === itemId && s.warehouse_id === fromWarehouse)?.quantity || 0;

  const addItem = () => {
    if (!selectedItemId) return;
    const existing = transferItems.find(ti => ti.item_id === selectedItemId);
    if (existing) {
      setTransferItems(transferItems.map(ti => ti.item_id === selectedItemId ? { ...ti, quantity: ti.quantity + selectedQty } : ti));
    } else {
      const stock = state.itemStock.find(s => s.item_id === selectedItemId && s.warehouse_id === fromWarehouse);
      setTransferItems([...transferItems, { item_id: selectedItemId, quantity: selectedQty, unit_cost: stock?.average_cost || 0 }]);
    }
    setSelectedItemId('');
    setSelectedQty(1);
  };

  const handleTransfer = () => {
    if (!fromWarehouse || !toWarehouse || transferItems.length === 0) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    if (fromWarehouse === toWarehouse) { toast.error('لا يمكن التحويل من وإلى نفس المخزن'); return; }
    for (const ti of transferItems) {
      const available = getItemStock(ti.item_id);
      if (ti.quantity > available) {
        const item = state.items.find(i => i.id === ti.item_id);
        toast.error(`الكمية للصنف "${item?.item_name}" (${ti.quantity}) أكبر من المتاح (${available})`);
        return;
      }
    }
    const transfers = state.warehouseTransfers || [];
    const transfer: WarehouseTransfer = {
      id: uid(),
      transfer_number: `WT-${String(transfers.length + 1).padStart(5, '0')}`,
      transfer_date: transferDate,
      from_warehouse_id: fromWarehouse,
      to_warehouse_id: toWarehouse,
      notes,
      items: transferItems,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'CREATE_WAREHOUSE_TRANSFER', payload: transfer });
    toast.success('تم التحويل بنجاح');
    setTransferItems([]);
    setFromWarehouse('');
    setToWarehouse('');
    setNotes('');
  };

  const allTransfers = state.warehouseTransfers || [];

  return (
    <div className="space-y-4">
      <h2 className="text-[16px] font-semibold">التحويل بين المخازن</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[15px] flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-cyan-600" /> إنشاء تحويل جديد</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">من مخزن *</label>
                <Select value={fromWarehouse} onValueChange={v => { setFromWarehouse(v); setTransferItems([]); }}>
                  <SelectTrigger className="text-[13px]"><SelectValue placeholder="المصدر" /></SelectTrigger>
                  <SelectContent>{state.warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">إلى مخزن *</label>
                <Select value={toWarehouse} onValueChange={setToWarehouse}>
                  <SelectTrigger className="text-[13px]"><SelectValue placeholder="الوجهة" /></SelectTrigger>
                  <SelectContent>{state.warehouses.filter(w => w.id !== fromWarehouse).map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[13px] text-muted-foreground mb-1 block">تاريخ التحويل</label>
              <Input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className="text-[13px]" />
            </div>
            {fromWarehouse && (
              <div className="border rounded-lg p-3 space-y-3">
                <p className="text-[13px] font-medium">إضافة أصناف للتحويل</p>
                <div className="flex gap-2">
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger className="flex-1 text-[13px]"><SelectValue placeholder="الصنف" /></SelectTrigger>
                    <SelectContent>
                      {state.items.filter(i => getItemStock(i.id) > 0).map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.item_name} (متاح: {getItemStock(i.id)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" value={selectedQty} onChange={e => setSelectedQty(Number(e.target.value))} min={1} className="w-20 text-[13px]" />
                  <Button onClick={addItem} size="sm" className="bg-teal-600 hover:bg-teal-700 shrink-0"><Plus className="w-4 h-4" /></Button>
                </div>
                {transferItems.length > 0 && (
                  <div className="space-y-1.5">
                    {transferItems.map(ti => {
                      const item = state.items.find(i => i.id === ti.item_id);
                      const available = getItemStock(ti.item_id);
                      return (
                        <div key={ti.item_id} className={`flex items-center justify-between p-2 rounded-lg text-[12px] ${ti.quantity > available ? 'bg-red-50 border border-red-200' : 'bg-accent/30'}`}>
                          <span>{item?.item_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">متاح: {available}</span>
                            <Input type="number" value={ti.quantity} onChange={e => setTransferItems(transferItems.map(t => t.item_id === ti.item_id ? { ...t, quantity: Number(e.target.value) } : t))} className="w-16 h-6 text-[12px] p-1" />
                            <button onClick={() => setTransferItems(transferItems.filter(t => t.item_id !== ti.item_id))} className="text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="text-[13px] text-muted-foreground mb-1 block">ملاحظات</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="سبب التحويل..." className="text-[13px]" />
            </div>
            <Button onClick={handleTransfer} className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2"
              disabled={!fromWarehouse || !toWarehouse || transferItems.length === 0}>
              <ArrowLeftRight className="w-4 h-4" /> تنفيذ التحويل
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[15px] flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> سجل التحويلات</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {allTransfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-[13px]">لا توجد تحويلات</div>
            ) : [...allTransfers].reverse().map(t => (
              <div key={t.id} className="p-3 border-b last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-mono font-medium">{t.transfer_number}</span>
                  <span className="text-[12px] text-muted-foreground">{t.transfer_date}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <span>{state.warehouses.find(w => w.id === t.from_warehouse_id)?.name}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{state.warehouses.find(w => w.id === t.to_warehouse_id)?.name}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {t.items.map(ti => {
                    const item = state.items.find(i => i.id === ti.item_id);
                    return <Badge key={ti.item_id} className="text-[10px] bg-blue-50 text-blue-700">{item?.item_name}: {ti.quantity}</Badge>;
                  })}
                </div>
                {t.notes && <p className="text-[11px] text-muted-foreground mt-1">{t.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== Units of Measure Tab ====================
function UnitsTab() {
  const { state, dispatch } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [editUnit, setEditUnit] = useState<UnitOfMeasure | null>(null);
  const [formData, setFormData] = useState({ name: '', symbol: '', base_unit_id: '', conversion_rate: 1 });

  const units = state.unitsOfMeasure || [];
  const baseUnits = units.filter(u => u.base_unit_id === null);

  const openAdd = (baseId?: string) => {
    setEditUnit(null);
    setFormData({ name: '', symbol: '', base_unit_id: baseId || '', conversion_rate: 1 });
    setShowDialog(true);
  };

  const openEdit = (unit: UnitOfMeasure) => {
    setEditUnit(unit);
    setFormData({ name: unit.name, symbol: unit.symbol, base_unit_id: unit.base_unit_id || '', conversion_rate: unit.conversion_rate });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.symbol) return;
    const unitData: UnitOfMeasure = {
      id: editUnit?.id || uid(),
      name: formData.name,
      symbol: formData.symbol,
      base_unit_id: formData.base_unit_id || null,
      conversion_rate: formData.base_unit_id ? formData.conversion_rate : 1,
      is_active: editUnit?.is_active ?? true,
      created_at: editUnit?.created_at || new Date().toISOString(),
    };
    if (editUnit) {
      dispatch({ type: 'UPDATE_UNIT', payload: unitData });
      toast.success('تم تحديث الوحدة');
    } else {
      dispatch({ type: 'ADD_UNIT', payload: unitData });
      toast.success('تم إضافة الوحدة');
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_UNIT', payload: id });
    toast.success('تم حذف الوحدة');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">وحدات القياس</h2>
        <Button onClick={() => openAdd()} className="gap-2 bg-teal-600 hover:bg-teal-700"><Plus className="w-4 h-4" /> إضافة وحدة رئيسية</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {baseUnits.map(base => {
          const subUnits = units.filter(u => u.base_unit_id === base.id);
          return (
            <Card key={base.id} className="border-2 border-teal-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Scale className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold">{base.name}</p>
                      <p className="text-[11px] text-muted-foreground">الرمز: {base.symbol}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(base)}><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-teal-600 hover:text-teal-800" onClick={() => openAdd(base.id)}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {subUnits.length > 0 ? (
                  <div className="space-y-1.5 border-t pt-3 mt-2">
                    <p className="text-[11px] text-muted-foreground mb-2">الوحدات الفرعية:</p>
                    {subUnits.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-2 bg-accent/30 rounded-lg">
                        <div>
                          <span className="text-[12px] font-medium">{sub.name}</span>
                          <span className="text-[11px] text-muted-foreground mr-2">({sub.symbol})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                            1 {base.symbol} = {sub.conversion_rate} {sub.symbol}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEdit(sub)}><Edit className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDelete(sub.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => openAdd(base.id)} className="w-full mt-2 p-2 border-2 border-dashed border-teal-200 rounded-lg text-[12px] text-teal-600 hover:bg-teal-50 transition-colors">
                    + إضافة وحدة فرعية
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editUnit ? 'تعديل وحدة' : formData.base_unit_id ? 'إضافة وحدة فرعية' : 'إضافة وحدة رئيسية'}</DialogTitle>
            <DialogDescription className="sr-only">نموذج وحدة قياس</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formData.base_unit_id && (
              <div className="bg-blue-50 p-3 rounded-lg text-[12px] text-blue-700 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                وحدة فرعية من: {units.find(u => u.id === formData.base_unit_id)?.name}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[13px] text-muted-foreground mb-1 block">اسم الوحدة *</label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="مثال: كيلوجرام" /></div>
              <div><label className="text-[13px] text-muted-foreground mb-1 block">الرمز *</label>
                <Input value={formData.symbol} onChange={e => setFormData({ ...formData, symbol: e.target.value })} placeholder="مثال: كج" /></div>
            </div>
            {!formData.base_unit_id && (
              <div><label className="text-[13px] text-muted-foreground mb-1 block">الوحدة الأساسية (اختياري)</label>
                <Select value={formData.base_unit_id} onValueChange={v => setFormData({ ...formData, base_unit_id: v })}>
                  <SelectTrigger><SelectValue placeholder="وحدة رئيسية مستقلة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">وحدة رئيسية مستقلة</SelectItem>
                    {baseUnits.filter(u => u.id !== editUnit?.id).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.base_unit_id && (
              <div><label className="text-[13px] text-muted-foreground mb-1 block">
                معدل التحويل: 1 {units.find(u => u.id === formData.base_unit_id)?.symbol || '—'} = كم {formData.symbol || 'وحدة'}؟
              </label>
                <Input type="number" value={formData.conversion_rate} onChange={e => setFormData({ ...formData, conversion_rate: Number(e.target.value) })} min={0.001} step={0.001} />
                <p className="text-[11px] text-muted-foreground mt-1">مثال: الكرتونة = 12 قطعة → أدخل 12</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700" disabled={!formData.name || !formData.symbol}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Excel Import/Export Tab ====================
function ExcelTab() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const importRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const exportItems = () => {
    const data = state.items.map(item => {
      const totalStock = state.itemStock.filter(s => s.item_id === item.id).reduce((s, i) => s + i.quantity, 0);
      const category = state.itemCategories.find(c => c.id === item.category_id)?.name || '';
      return {
        'كود الصنف': item.item_code,
        'اسم الصنف': item.item_name,
        'التصنيف': category,
        'الوحدة': item.unit,
        'نوع الصنف': itemTypeLabels[(item.item_type || 'sellable') as ItemType],
        'سعر الشراء': item.purchase_price,
        'سعر البيع': item.selling_price,
        'الحد الأدنى': item.minimum_stock,
        'المخزون الحالي': totalStock,
        'الباركود': item.barcode || '',
        'الوصف': item.description || '',
        'نشط': item.is_active ? 'نعم' : 'لا',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الأصناف');
    XLSX.writeFile(wb, `أصناف_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`تم تصدير ${state.items.length} صنف بنجاح`);
  };

  const downloadTemplate = () => {
    const template = [
      { 'كود الصنف': '001', 'اسم الصنف': 'صنف مثال', 'التصنيف': '', 'الوحدة': 'قطعة', 'نوع الصنف': 'قابل للبيع', 'سعر الشراء': 100, 'سعر البيع': 150, 'الحد الأدنى': 5, 'الباركود': '', 'الوصف': '' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب_الأصناف');
    XLSX.writeFile(wb, 'قالب_استيراد_أصناف.xlsx');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
        setImportPreview(data);
        setShowPreview(true);
      } catch {
        toast.error('خطأ في قراءة الملف');
      }
    };
    reader.readAsBinaryString(file);
    if (importRef.current) importRef.current.value = '';
  };

  const confirmImport = () => {
    const typeMap: Record<string, ItemType> = {
      'قابل للبيع': 'sellable', 'مادة خام': 'raw_material', 'خدمة': 'service',
    };
    const existingCodes = new Set(state.items.map(i => i.item_code));
    const newItems: Item[] = importPreview
      .filter(row => row['اسم الصنف'] && !existingCodes.has(String(row['كود الصنف'] || '')))
      .map(row => ({
        id: uid(),
        item_code: String(row['كود الصنف'] || String(Math.random()).slice(2, 7)),
        item_name: String(row['اسم الصنف']),
        category_id: state.itemCategories.find(c => c.name === row['التصنيف'])?.id || '',
        unit: String(row['الوحدة'] || 'قطعة'),
        purchase_price: Number(row['سعر الشراء'] || 0),
        selling_price: Number(row['سعر البيع'] || 0),
        minimum_stock: Number(row['الحد الأدنى'] || 0),
        barcode: String(row['الباركود'] || ''),
        description: String(row['الوصف'] || ''),
        item_type: typeMap[String(row['نوع الصنف'] || '')] || 'sellable',
        is_active: true,
        created_at: new Date().toISOString(),
      }));

    if (newItems.length === 0) {
      toast.error('لا توجد أصناف جديدة (تحقق من عدم تكرار الكود)');
      return;
    }
    dispatch({ type: 'BULK_IMPORT_ITEMS', payload: newItems });
    toast.success(`تم استيراد ${newItems.length} صنف بنجاح`);
    setShowPreview(false);
    setImportPreview([]);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[16px] font-semibold">استيراد وتصدير الأصناف</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200">
          <CardContent className="p-5 text-center space-y-3">
            <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-[14px] font-semibold">تصدير الأصناف</h3>
            <p className="text-[12px] text-muted-foreground">تصدير جميع الأصناف مع بياناتها كاملة</p>
            <Button onClick={exportItems} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Download className="w-4 h-4" /> تصدير Excel
            </Button>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-5 text-center space-y-3">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-[14px] font-semibold">استيراد الأصناف</h3>
            <p className="text-[12px] text-muted-foreground">استيراد أصناف جديدة من ملف Excel</p>
            <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleImportFile} className="hidden" />
            <Button onClick={() => importRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              <Upload className="w-4 h-4" /> استيراد Excel
            </Button>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-5 text-center space-y-3">
            <div className="w-12 h-12 mx-auto bg-amber-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-[14px] font-semibold">قالب الاستيراد</h3>
            <p className="text-[12px] text-muted-foreground">تنزيل النموذج الجاهز للاستيراد</p>
            <Button onClick={downloadTemplate} variant="outline" className="w-full gap-2 border-amber-300">
              <Download className="w-4 h-4" /> تنزيل القالب
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="text-[13px] font-semibold text-blue-700 mb-2">تعليمات الاستيراد:</h3>
          <ul className="text-[12px] text-blue-600 space-y-1 list-disc list-inside">
            <li>نزّل قالب الاستيراد أولاً وأدخل البيانات فيه</li>
            <li>الحقول المطلوبة: اسم الصنف (إلزامي)، كود الصنف (اختياري)</li>
            <li>نوع الصنف: قابل للبيع / مادة خام / خدمة</li>
            <li>الأصناف المكررة (نفس الكود) لن يتم استيرادها</li>
            <li>بعد الاستيراد سيتم إنشاء سجلات مخزون فارغة لكل مخزن</li>
          </ul>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>معاينة الاستيراد ({importPreview.length} صنف)</DialogTitle>
            <DialogDescription className="sr-only">معاينة البيانات قبل الاستيراد</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الكود</TableHead><TableHead>الاسم</TableHead><TableHead>الوحدة</TableHead>
                <TableHead>سعر الشراء</TableHead><TableHead>سعر البيع</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {importPreview.slice(0, 20).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-[12px]">{String(row['كود الصنف'] || '')}</TableCell>
                    <TableCell className="text-[12px]">{String(row['اسم الصنف'] || '')}</TableCell>
                    <TableCell className="text-[12px]">{String(row['الوحدة'] || '')}</TableCell>
                    <TableCell className="text-[12px]">{String(row['سعر الشراء'] || '')}</TableCell>
                    <TableCell className="text-[12px]">{String(row['سعر البيع'] || '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {importPreview.length > 20 && <p className="text-center text-[12px] text-muted-foreground py-2">... و {importPreview.length - 20} صنف آخر</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPreview(false); setImportPreview([]); }}>إلغاء</Button>
            <Button onClick={confirmImport} className="bg-blue-600 hover:bg-blue-700">
              <Check className="w-4 h-4 ml-1" /> تأكيد الاستيراد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Prices Tab ====================
function PricesTab() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const importPriceRef = useRef<HTMLInputElement>(null);
  const [pricePreview, setPricePreview] = useState<Record<string, unknown>[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const priceLists = state.priceLists || [];

  const exportPrices = () => {
    const data = state.items.map(item => {
      const row: Record<string, unknown> = {
        'كود الصنف': item.item_code,
        'اسم الصنف': item.item_name,
        'الوحدة': item.unit,
        'سعر الشراء': item.purchase_price,
        'سعر البيع الأساسي': item.selling_price,
      };
      priceLists.forEach(pl => {
        const plItem = pl.items.find(pi => pi.item_id === item.id);
        row[`قائمة: ${pl.name}`] = plItem?.price ?? item.selling_price;
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الأسعار');
    XLSX.writeFile(wb, `أسعار_الأصناف_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`تم تصدير أسعار ${state.items.length} صنف`);
  };

  const handleImportPrices = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
        setPricePreview(data);
        setShowPreview(true);
      } catch {
        toast.error('خطأ في قراءة ملف الأسعار');
      }
    };
    reader.readAsBinaryString(file);
    if (importPriceRef.current) importPriceRef.current.value = '';
  };

  const confirmPriceUpdate = () => {
    const firstRow = pricePreview[0] || {};
    const plColumns = Object.keys(firstRow).filter(k => k.startsWith('قائمة: '));
    const updates = pricePreview.map(row => {
      const item = state.items.find(i => i.item_code === String(row['كود الصنف'] || '') || i.item_name === row['اسم الصنف']);
      if (!item) return null;
      const priceListUpdates = plColumns.map(col => {
        const plName = col.replace('قائمة: ', '');
        const pl = priceLists.find(p => p.name === plName);
        return pl ? { list_id: pl.id, price: Number(row[col]) || 0 } : null;
      }).filter((x): x is { list_id: string; price: number } => x !== null);
      return {
        item_id: item.id,
        selling_price: row['سعر البيع الأساسي'] !== undefined ? Number(row['سعر البيع الأساسي']) : undefined,
        purchase_price: row['سعر الشراء'] !== undefined ? Number(row['سعر الشراء']) : undefined,
        price_list_updates: priceListUpdates.length > 0 ? priceListUpdates : undefined,
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    if (updates.length === 0) {
      toast.error('لم يتم التعرف على أي صنف (تحقق من تطابق كود الصنف)');
      return;
    }
    dispatch({ type: 'BULK_UPDATE_ITEM_PRICES', payload: { updates } });
    toast.success(`تم تحديث أسعار ${updates.length} صنف بنجاح`);
    setShowPreview(false);
    setPricePreview([]);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[16px] font-semibold">تعديل أسعار البيع</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-200">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold">تصدير قوائم الأسعار</h3>
                <p className="text-[12px] text-muted-foreground">تصدير كل الأصناف مع أسعارها وقوائم الأسعار</p>
              </div>
            </div>
            {priceLists.length > 0 && (
              <div className="bg-emerald-50 p-3 rounded-lg text-[12px] text-emerald-700">
                <p className="font-medium mb-1">قوائم الأسعار المضمّنة ({priceLists.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {priceLists.map(pl => <Badge key={pl.id} className="bg-emerald-100 text-emerald-700 text-[10px]">{pl.name}</Badge>)}
                </div>
              </div>
            )}
            {priceLists.length === 0 && (
              <p className="text-[12px] text-muted-foreground bg-accent/30 p-2 rounded">لا توجد قوائم أسعار - سيتم تصدير الأسعار الأساسية فقط</p>
            )}
            <Button onClick={exportPrices} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Download className="w-4 h-4" /> تصدير قوائم الأسعار
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold">استيراد تحديث الأسعار</h3>
                <p className="text-[12px] text-muted-foreground">تحديث أسعار البيع وقوائم الأسعار من Excel</p>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-[12px] text-blue-700">
              <ol className="list-decimal list-inside space-y-0.5">
                <li>صدّر قائمة الأسعار أولاً</li>
                <li>عدّل الأسعار في Excel</li>
                <li>استورد الملف المعدّل</li>
              </ol>
            </div>
            <input ref={importPriceRef} type="file" accept=".xlsx,.xls" onChange={handleImportPrices} className="hidden" />
            <Button onClick={() => importPriceRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              <Upload className="w-4 h-4" /> استيراد تحديث الأسعار
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Price Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" /> الأسعار الحالية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الصنف</TableHead>
                <TableHead>سعر الشراء</TableHead>
                <TableHead>سعر البيع</TableHead>
                {priceLists.map(pl => <TableHead key={pl.id}>{pl.name}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {state.items.map(item => (
                  <TableRow key={item.id} className="hover:bg-accent/20">
                    <TableCell className="text-[12px] font-mono">{item.item_code}</TableCell>
                    <TableCell className="text-[12px]">{item.item_name}</TableCell>
                    <TableCell className="text-[12px] text-amber-600">{formatCurrency(item.purchase_price)}</TableCell>
                    <TableCell className="text-[12px] font-medium text-blue-600">{formatCurrency(item.selling_price)}</TableCell>
                    {priceLists.map(pl => {
                      const plItem = pl.items.find(pi => pi.item_id === item.id);
                      const price = plItem?.price ?? item.selling_price;
                      const diff = price - item.selling_price;
                      return (
                        <TableCell key={pl.id} className="text-[12px]">
                          <div className="flex items-center gap-1">
                            <span>{formatCurrency(price)}</span>
                            {diff !== 0 && <Badge className={`text-[9px] ${diff > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{diff > 0 ? '+' : ''}{Math.round(diff)}</Badge>}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>معاينة تحديث الأسعار ({pricePreview.length} صنف)</DialogTitle>
            <DialogDescription className="sr-only">معاينة التغييرات</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الكود</TableHead><TableHead>الاسم</TableHead>
                <TableHead>سعر الشراء</TableHead><TableHead>سعر البيع</TableHead>
                {Object.keys(pricePreview[0] || {}).filter(k => k.startsWith('قائمة: ')).map(k => <TableHead key={k}>{k.replace('قائمة: ', '')}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {pricePreview.slice(0, 15).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-[12px] font-mono">{String(row['كود الصنف'] || '')}</TableCell>
                    <TableCell className="text-[12px]">{String(row['اسم الصنف'] || '')}</TableCell>
                    <TableCell className="text-[12px]">{String(row['سعر الشراء'] || '')}</TableCell>
                    <TableCell className="text-[12px] font-medium text-blue-600">{String(row['سعر البيع الأساسي'] || '')}</TableCell>
                    {Object.keys(row).filter(k => k.startsWith('قائمة: ')).map(k => <TableCell key={k} className="text-[12px]">{String(row[k] || '')}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPreview(false); setPricePreview([]); }}>إلغاء</Button>
            <Button onClick={confirmPriceUpdate} className="bg-blue-600 hover:bg-blue-700">
              <Check className="w-4 h-4 ml-1" /> تطبيق التحديث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
