import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';

export function ItemsPage() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    item_code: '', item_name: '', category_id: '', unit: 'قطعة',
    purchase_price: 0, selling_price: 0, minimum_stock: 0, barcode: '', description: '',
  });

  const filteredItems = state.items.filter(i =>
    !searchTerm || i.item_name.includes(searchTerm) || i.item_code.includes(searchTerm)
  );

  const getItemTotalStock = (itemId: string) =>
    state.itemStock.filter(s => s.item_id === itemId).reduce((sum, s) => sum + s.quantity, 0);

  const getCategoryName = (catId: string) =>
    state.itemCategories.find(c => c.id === catId)?.name || '-';

  const handleSubmit = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      item_code: formData.item_code || String(state.items.length + 1).padStart(3, '0'),
      item_name: formData.item_name,
      category_id: formData.category_id,
      unit: formData.unit,
      purchase_price: formData.purchase_price,
      selling_price: formData.selling_price,
      minimum_stock: formData.minimum_stock,
      barcode: formData.barcode,
      description: formData.description,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_ITEM', payload: newItem });
    setShowDialog(false);
    setFormData({ item_code: '', item_name: '', category_id: '', unit: 'قطعة', purchase_price: 0, selling_price: 0, minimum_stock: 0, barcode: '', description: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-[20px] text-foreground">الأصناف والمخزون</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          إضافة صنف
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] text-muted-foreground">عدد الأصناف</p>
            <p className="text-[20px] text-foreground">{state.items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] text-muted-foreground">إجمالي المخزون</p>
            <p className="text-[20px] text-foreground">{state.itemStock.reduce((s, i) => s + i.quantity, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] text-muted-foreground">قيمة المخزون</p>
            <p className="text-[20px] text-foreground">{formatCurrency(state.itemStock.reduce((s, i) => s + i.quantity * i.average_cost, 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] text-orange-600">أصناف تحت الحد الأدنى</p>
            <p className="text-[20px] text-orange-600">
              {state.items.filter(i => getItemTotalStock(i.id) <= i.minimum_stock).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الكود..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>كود</TableHead>
                <TableHead>اسم الصنف</TableHead>
                <TableHead className="hidden md:table-cell">التصنيف</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead>سعر الشراء</TableHead>
                <TableHead>سعر البيع</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => {
                const totalStock = getItemTotalStock(item.id);
                const isLow = totalStock <= item.minimum_stock;
                const isOut = totalStock === 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-[13px] text-muted-foreground">{item.item_code}</TableCell>
                    <TableCell className="text-[13px]">{item.item_name}</TableCell>
                    <TableCell className="text-[13px] hidden md:table-cell">{getCategoryName(item.category_id)}</TableCell>
                    <TableCell className="text-[13px]">{item.unit}</TableCell>
                    <TableCell className="text-[13px]">{formatCurrency(item.purchase_price)}</TableCell>
                    <TableCell className="text-[13px]">{formatCurrency(item.selling_price)}</TableCell>
                    <TableCell className="text-[13px]">{totalStock}</TableCell>
                    <TableCell>
                      {isOut ? (
                        <Badge className="bg-red-100 text-red-700 text-[10px]">نفد</Badge>
                      ) : isLow ? (
                        <Badge className="bg-orange-100 text-orange-700 text-[10px]">منخفض</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">متاح</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>إضافة صنف جديد</DialogTitle><DialogDescription className="sr-only">نموذج إضافة صنف جديد</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">كود الصنف</label>
                <Input value={formData.item_code} onChange={e => setFormData({ ...formData, item_code: e.target.value })} placeholder="تلقائي" />
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">اسم الصنف *</label>
                <Input value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">التصنيف</label>
                <Select value={formData.category_id} onValueChange={v => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                  <SelectContent>
                    {state.itemCategories.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">الوحدة</label>
                <Select value={formData.unit} onValueChange={v => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['قطعة', 'كيلو', 'متر', 'لتر', 'علبة', 'كرتونة', 'طن'].map(u => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">سعر الشراء</label>
                <Input type="number" value={formData.purchase_price} onChange={e => setFormData({ ...formData, purchase_price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">سعر البيع</label>
                <Input type="number" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">حد أدنى</label>
                <Input type="number" value={formData.minimum_stock} onChange={e => setFormData({ ...formData, minimum_stock: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-muted-foreground mb-1 block">الباركود</label>
              <Input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
            </div>
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