import React, { useState, useMemo } from 'react';
import { Plus, Trash2, FileText, Download, Upload, Calendar } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import type { ProductionInvoiceItem } from '../../types/payroll';

export function ProductionInvoicesPage() {
  const { 
    employees, 
    departments,
    productionInvoices, 
    addProductionInvoice,
    getProductionInvoicesByEmployee 
  } = usePayroll();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Omit<ProductionInvoiceItem, 'id'>[]>([
    { product_description: '', quantity: 0, unit_price: 0, total: 0 }
  ]);
  const [notes, setNotes] = useState('');

  // Filter to show only production workers
  const productionWorkers = useMemo(() => {
    return employees.filter(e => e.salary_type === 'production' && e.is_active);
  }, [employees]);

  const selectedEmployee = productionWorkers.find(e => e.id === selectedEmployeeId);

  // Get invoices for selected employee
  const employeeInvoices = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return getProductionInvoicesByEmployee(selectedEmployeeId, startDate, endDate);
  }, [selectedEmployeeId, startDate, endDate, productionInvoices]);

  const handleAddRow = () => {
    const defaultPrice = selectedEmployee?.price_per_piece || 0;
    setItems([...items, { product_description: '', quantity: 0, unit_price: defaultPrice, total: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof Omit<ProductionInvoiceItem, 'id'>, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? Number(value) : newItems[index].quantity;
      const price = field === 'unit_price' ? Number(value) : newItems[index].unit_price;
      newItems[index].total = qty * price;
    }
    
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || items.length === 0) return;

    const validItems = items.filter(item => item.product_description && item.quantity > 0);
    if (validItems.length === 0) return;

    addProductionInvoice({
      employee_id: selectedEmployeeId,
      invoice_date: invoiceDate,
      items: validItems.map((item, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        ...item
      })),
      total_amount: totalAmount,
      notes,
    });

    // Reset form
    setItems([{ product_description: '', quantity: 0, unit_price: selectedEmployee?.price_per_piece || 0, total: 0 }]);
    setNotes('');
    alert('تم حفظ فاتورة الإنتاج بنجاح');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">فواتير الإنتاج</h1>
          <p className="text-sm text-muted-foreground">تسجيل إنتاج العمال وحساب الأجور</p>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="bg-white rounded-lg border border-border p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">اختر العامل (إنتاج فقط)</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                const emp = productionWorkers.find(w => w.id === e.target.value);
                if (emp) {
                  setItems([{ product_description: '', quantity: 0, unit_price: emp.price_per_piece, total: 0 }]);
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="">اختر العامل...</option>
              {productionWorkers.map(emp => {
                const dept = departments.find(d => d.id === emp.department_id);
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} - {dept?.name || 'بدون قسم'} - {emp.price_per_piece} ج.م/قطعة
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">تاريخ الفاتورة</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              استيراد من Excel
            </button>
          </div>
        </div>

        {selectedEmployee && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
              {selectedEmployee.full_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm text-foreground font-medium">{selectedEmployee.full_name}</p>
              <p className="text-xs text-muted-foreground">
                كود: {selectedEmployee.employee_code} | سعر القطعة: {selectedEmployee.price_per_piece} ج.م
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Entry Form */}
      {selectedEmployeeId && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-lg text-foreground mb-4">تفاصيل الإنتاج</h2>
          
          <div className="overflow-x-auto mb-4">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground w-[40%]">وصف المنتج</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground w-[15%]">الكمية</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground w-[15%]">سعر الوحدة</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground w-[20%]">الإجمالي</th>
                  <th className="px-3 py-2 text-center text-xs text-muted-foreground w-[10%]">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.product_description}
                        onChange={(e) => handleItemChange(index, 'product_description', e.target.value)}
                        placeholder="وصف المنتج"
                        className="w-full px-2 py-1.5 border border-border rounded text-sm"
                        required
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="1"
                        className="w-full px-2 py-1.5 border border-border rounded text-sm"
                        required
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.unit_price || ''}
                        onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 border border-border rounded text-sm"
                        required
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="px-2 py-1.5 bg-muted/30 rounded text-sm font-medium">
                        {item.total.toFixed(2)} ج.م
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        disabled={items.length === 1}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mb-4"
          >
            <Plus className="w-4 h-4" />
            إضافة صف جديد
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">ملاحظات</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="ملاحظات إضافية..."
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">الإجمالي الكلي</p>
                <p className="text-2xl text-green-700 font-bold">{totalAmount.toFixed(2)} ج.م</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              حفظ الفاتورة
            </button>
            <button
              type="button"
              onClick={() => {
                setItems([{ product_description: '', quantity: 0, unit_price: selectedEmployee?.price_per_piece || 0, total: 0 }]);
                setNotes('');
              }}
              className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* History */}
      {selectedEmployeeId && (
        <div className="bg-white rounded-lg border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-lg text-foreground">سجل فواتير الإنتاج</h2>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-lg text-sm"
                placeholder="من تاريخ"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-lg text-sm"
                placeholder="إلى تاريخ"
              />
              <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg hover:bg-muted/30 text-sm">
                <Download className="w-4 h-4" />
                تصدير
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">رقم الفاتورة</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">عدد الأصناف</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">إجمالي الكمية</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employeeInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      لا توجد فواتير إنتاج لهذا العامل
                    </td>
                  </tr>
                ) : (
                  employeeInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{invoice.invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {new Date(invoice.invoice_date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.items.length}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {invoice.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-700 font-medium">
                        {invoice.total_amount.toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {employeeInvoices.length > 0 && (
                <tfoot className="bg-muted/50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm text-foreground font-medium text-right">
                      الإجمالي:
                    </td>
                    <td className="px-4 py-3 text-sm text-green-700 font-bold">
                      {employeeInvoices.reduce((sum, inv) => sum + inv.total_amount, 0).toLocaleString()} ج.م
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}