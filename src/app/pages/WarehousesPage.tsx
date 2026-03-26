import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Warehouse, Package } from 'lucide-react';

export function WarehousesPage() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', location: '', manager_name: '' });

  const handleSubmit = () => {
    dispatch({
      type: 'ADD_WAREHOUSE',
      payload: {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        location: formData.location,
        manager_name: formData.manager_name,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    });
    setShowDialog(false);
    setFormData({ name: '', location: '', manager_name: '' });
  };

  const getWarehouseStock = (warehouseId: string) => {
    return state.itemStock
      .filter(s => s.warehouse_id === warehouseId)
      .map(s => {
        const item = state.items.find(i => i.id === s.item_id);
        return { ...s, item_name: item?.item_name || '-', item_code: item?.item_code || '-', unit: item?.unit || '-' };
      })
      .filter(s => s.quantity > 0 || true);
  };

  const getWarehouseValue = (warehouseId: string) => {
    return state.itemStock.filter(s => s.warehouse_id === warehouseId).reduce((sum, s) => sum + s.quantity * s.average_cost, 0);
  };

  const getWarehouseItemCount = (warehouseId: string) => {
    return state.itemStock.filter(s => s.warehouse_id === warehouseId && s.quantity > 0).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-[20px] text-foreground">المخازن</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          إضافة مخزن
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.warehouses.map(wh => (
          <Card key={wh.id}
            className={`cursor-pointer transition-shadow hover:shadow-md ${selectedWarehouse === wh.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedWarehouse(selectedWarehouse === wh.id ? null : wh.id)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[14px]">{wh.name}</p>
                  <p className="text-[11px] text-muted-foreground">{wh.location}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-accent/30 p-2 rounded-lg">
                  <p className="text-[11px] text-muted-foreground">عدد الأصناف</p>
                  <p className="text-[16px]">{getWarehouseItemCount(wh.id)}</p>
                </div>
                <div className="bg-accent/30 p-2 rounded-lg">
                  <p className="text-[11px] text-muted-foreground">القيمة</p>
                  <p className="text-[14px] text-purple-700">{formatCurrency(getWarehouseValue(wh.id))}</p>
                </div>
              </div>
              {wh.manager_name && (
                <p className="text-[11px] text-muted-foreground mt-2">المسؤول: {wh.manager_name}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedWarehouse && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              محتويات: {state.warehouses.find(w => w.id === selectedWarehouse)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود</TableHead>
                  <TableHead>الصنف</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>متوسط التكلفة</TableHead>
                  <TableHead>القيمة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getWarehouseStock(selectedWarehouse).map(stock => (
                  <TableRow key={stock.id}>
                    <TableCell className="text-[13px] text-muted-foreground">{stock.item_code}</TableCell>
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
          <DialogHeader><DialogTitle>إضافة مخزن جديد</DialogTitle><DialogDescription className="sr-only">نموذج إضافة مخزن جديد</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[13px] text-muted-foreground mb-1 block">اسم المخزن *</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="text-[13px] text-muted-foreground mb-1 block">الموقع</label>
              <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div>
              <label className="text-[13px] text-muted-foreground mb-1 block">المسؤول</label>
              <Input value={formData.manager_name} onChange={e => setFormData({ ...formData, manager_name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={!formData.name}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}