import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { ClipboardList, Plus, Trash2, CircleCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AdjustmentLine {
  item_id: string;
  warehouse_id: string;
  book_qty: number;
  actual_qty: number;
  unit_cost: number;
}

export function InventoryAdjustmentPage() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [lines, setLines] = useState<AdjustmentLine[]>([]);
  const [notes, setNotes] = useState('');
  const [warehouseId, setWarehouseId] = useState(state.warehouses[0]?.id || '');

  const addLine = () => {
    setLines([...lines, { item_id: '', warehouse_id: warehouseId, book_qty: 0, actual_qty: 0, unit_cost: 0 }]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof AdjustmentLine, value: any) => {
    const updated = [...lines];
    (updated[idx] as any)[field] = value;
    if (field === 'item_id') {
      const stock = state.itemStock.find(s => s.item_id === value && s.warehouse_id === warehouseId);
      updated[idx].book_qty = stock?.quantity || 0;
      updated[idx].actual_qty = stock?.quantity || 0;
      updated[idx].unit_cost = stock?.average_cost || 0;
    }
    setLines(updated);
  };

  const loadAllItems = () => {
    const warehouseStock = state.itemStock.filter(s => s.warehouse_id === warehouseId && s.quantity > 0);
    setLines(warehouseStock.map(s => ({
      item_id: s.item_id,
      warehouse_id: warehouseId,
      book_qty: s.quantity,
      actual_qty: s.quantity,
      unit_cost: s.average_cost,
    })));
  };

  const totalSurplus = lines.reduce((s, l) => {
    const diff = l.actual_qty - l.book_qty;
    return s + (diff > 0 ? diff * l.unit_cost : 0);
  }, 0);

  const totalDeficit = lines.reduce((s, l) => {
    const diff = l.actual_qty - l.book_qty;
    return s + (diff < 0 ? Math.abs(diff) * l.unit_cost : 0);
  }, 0);

  const handleSubmit = () => {
    const adjustments = lines.filter(l => l.actual_qty !== l.book_qty && l.item_id);
    if (adjustments.length === 0) {
      toast.info('لا توجد فروقات للتسوية');
      return;
    }
    dispatch({
      type: 'CREATE_INVENTORY_ADJUSTMENT',
      payload: {
        adjustments: adjustments.map(a => ({
          item_id: a.item_id,
          warehouse_id: a.warehouse_id,
          actual_qty: a.actual_qty,
          book_qty: a.book_qty,
          unit_cost: a.unit_cost,
        })),
        date: new Date().toISOString().split('T')[0],
        notes,
      },
    });
    toast.success(`تم إجراء تسوية الجرد - ${adjustments.length} صنف`);
    setLines([]);
    setNotes('');
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl flex items-center gap-2"><ClipboardList className="w-6 h-6 text-indigo-600" /> جرد المخزون وتسوية</h1>
          <p className="text-sm text-gray-500 mt-1">مقارنة الكميات الفعلية بالدفترية وإنشاء قيود التسوية</p>
        </div>
      </div>

      {/* Warehouse Selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
        <label className="text-sm text-gray-600">المخزن:</label>
        <select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setLines([]); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 max-w-xs">
          {state.warehouses.filter(w => w.is_active).map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <button onClick={loadAllItems} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          تحميل جميع الأصناف
        </button>
        <button onClick={addLine} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1">
          <Plus className="w-4 h-4" /> إضافة صنف
        </button>
      </div>

      {/* Summary */}
      {lines.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <div className="text-xs text-emerald-600">فائض (زيادة)</div>
            <div className="text-lg text-emerald-800 font-bold">{formatCurrency(totalSurplus)}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <div className="text-xs text-red-600">عجز (نقص)</div>
            <div className="text-lg text-red-800 font-bold">{formatCurrency(totalDeficit)}</div>
          </div>
          <div className={`border rounded-xl p-3 text-center ${totalSurplus - totalDeficit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="text-xs text-gray-600">صافي الفرق</div>
            <div className="text-lg font-bold">{formatCurrency(totalSurplus - totalDeficit)}</div>
          </div>
        </div>
      )}

      {/* Lines Table */}
      {lines.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-3 py-2.5">#</th>
                  <th className="text-right px-3 py-2.5">الصنف</th>
                  <th className="text-center px-3 py-2.5">الكمية الدفترية</th>
                  <th className="text-center px-3 py-2.5">الكمية الفعلية</th>
                  <th className="text-center px-3 py-2.5">الفرق</th>
                  <th className="text-center px-3 py-2.5">التكلفة</th>
                  <th className="text-center px-3 py-2.5">القيمة</th>
                  <th className="text-center px-3 py-2.5">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line, idx) => {
                  const diff = line.actual_qty - line.book_qty;
                  const diffValue = diff * line.unit_cost;
                  return (
                    <tr key={idx} className={`hover:bg-gray-50 ${diff !== 0 ? (diff > 0 ? 'bg-emerald-50/30' : 'bg-red-50/30') : ''}`}>
                      <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <select value={line.item_id} onChange={e => updateLine(idx, 'item_id', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm">
                          <option value="">اختر صنف</option>
                          {state.items.filter(i => i.is_active).map(i => (
                            <option key={i.id} value={i.id}>{i.item_name} ({i.item_code})</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-center px-3 py-2 text-gray-500">{line.book_qty}</td>
                      <td className="text-center px-3 py-2">
                        <input type="number" value={line.actual_qty} onChange={e => updateLine(idx, 'actual_qty', Number(e.target.value))} className="w-20 border border-gray-200 rounded px-2 py-1.5 text-center text-sm" min={0} />
                      </td>
                      <td className={`text-center px-3 py-2 font-medium ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="text-center px-3 py-2 text-gray-500">{formatCurrency(line.unit_cost)}</td>
                      <td className={`text-center px-3 py-2 font-medium ${diffValue > 0 ? 'text-emerald-600' : diffValue < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {diffValue !== 0 ? formatCurrency(diffValue) : '-'}
                      </td>
                      <td className="text-center px-3 py-2">
                        <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes & Submit */}
      {lines.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">ملاحظات</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات الجرد..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              سيتم تعديل الكميات في المخزون وإنشاء قيد تسوية تلقائي:
              الفائض → إيرادات أخرى (4003) | العجز → مصروفات متنوعة (5099)
            </div>
          </div>
          <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            <CircleCheck className="w-4 h-4" /> تأكيد الجرد وإنشاء قيد التسوية
          </button>
        </div>
      )}

      {lines.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500 mb-2">ابدأ بتحميل أصناف المخزن أو إضافة أصناف يدوياً</div>
          <div className="text-xs text-gray-400">اختر المخزن ثم اضغط "تحميل جميع الأصناف"</div>
        </div>
      )}
    </div>
  );
}
