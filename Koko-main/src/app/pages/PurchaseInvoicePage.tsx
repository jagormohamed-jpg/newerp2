import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Trash2, Eye } from 'lucide-react';
import type { PurchaseInvoice, PurchaseInvoiceItem, PaymentType } from '../types/accounting';

export function PurchaseInvoicePage() {
  const { state, dispatch, formatCurrency, nextInvoiceNumber, getContactById } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewInvoiceId, setViewInvoiceId] = useState('');

  const [invoiceData, setInvoiceData] = useState({
    contact_id: '', warehouse_id: 'w1', payment_type: 'cash' as PaymentType,
    treasury_id: 't1', bank_id: '', discount_amount: 0, tax_amount: 0,
    paid_amount: 0, notes: '',
  });

  const [invoiceItems, setInvoiceItems] = useState<{ item_id: string; quantity: number; unit_price: number; discount: number }[]>([]);

  const addItem = () => setInvoiceItems([...invoiceItems, { item_id: '', quantity: 1, unit_price: 0, discount: 0 }]);
  const removeItem = (idx: number) => setInvoiceItems(invoiceItems.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...invoiceItems];
    (updated[idx] as any)[field] = value;
    if (field === 'item_id') {
      const item = state.items.find(i => i.id === value);
      if (item) updated[idx].unit_price = item.purchase_price;
    }
    setInvoiceItems(updated);
  };

  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unit_price - item.discount), 0);
  const total = subtotal - invoiceData.discount_amount + invoiceData.tax_amount;

  const handleSubmit = () => {
    const invoiceNumber = nextInvoiceNumber('purchase');
    const invoiceId = Math.random().toString(36).substr(2, 9);
    const remaining = invoiceData.payment_type === 'cash' ? 0 : invoiceData.payment_type === 'credit' ? total : total - invoiceData.paid_amount;
    const paid = invoiceData.payment_type === 'cash' ? total : invoiceData.payment_type === 'credit' ? 0 : invoiceData.paid_amount;

    const invoice: PurchaseInvoice = {
      id: invoiceId, invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      contact_id: invoiceData.contact_id, warehouse_id: invoiceData.warehouse_id,
      payment_type: invoiceData.payment_type, subtotal,
      discount_amount: invoiceData.discount_amount, tax_amount: invoiceData.tax_amount,
      total_amount: total, paid_amount: paid, remaining_amount: remaining,
      treasury_id: invoiceData.treasury_id, bank_id: invoiceData.bank_id,
      status: remaining === 0 ? 'paid' : remaining === total ? 'new' : 'partial',
      notes: invoiceData.notes, created_at: new Date().toISOString(),
    };

    const items: PurchaseInvoiceItem[] = invoiceItems.filter(i => i.item_id).map(item => {
      const dbItem = state.items.find(i => i.id === item.item_id);
      return {
        id: Math.random().toString(36).substr(2, 9),
        invoice_id: invoiceId, item_id: item.item_id,
        item_name: dbItem?.item_name || '', quantity: item.quantity,
        unit_price: item.unit_price, discount: item.discount, tax: 0,
        total: item.quantity * item.unit_price - item.discount,
        warehouse_id: invoiceData.warehouse_id,
      };
    });

    dispatch({ type: 'CREATE_PURCHASE_INVOICE', payload: { invoice, items } });
    setShowDialog(false);
    setInvoiceItems([]);
    setInvoiceData({ contact_id: '', warehouse_id: 'w1', payment_type: 'cash', treasury_id: 't1', bank_id: '', discount_amount: 0, tax_amount: 0, paid_amount: 0, notes: '' });
  };

  const suppliers = state.contacts.filter(c => c.contact_type === 'supplier' || c.contact_type === 'both');
  const statusLabel = (s: string) => ({ new: 'جديدة', partial: 'جزئي', paid: 'مدفوعة', cancelled: 'ملغاة' }[s] || s);
  const statusColor = (s: string) => ({ new: 'bg-blue-100 text-blue-700', partial: 'bg-orange-100 text-orange-700', paid: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' }[s] || '');

  const viewInvoice = state.purchaseInvoices.find(i => i.id === viewInvoiceId);
  const viewItems = state.purchaseInvoiceItems.filter(i => i.invoice_id === viewInvoiceId);
  const viewEntry = state.journalEntries.find(e => e.source_type === 'purchase_invoice' && e.source_id === viewInvoiceId);
  const viewEntryLines = viewEntry ? state.journalEntryLines.filter(l => l.journal_entry_id === viewEntry.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-[20px] text-foreground">فواتير الشراء</h1>
        <Button onClick={() => { setShowDialog(true); addItem(); }} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4" />
          فاتورة شراء جديدة
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-[12px] text-muted-foreground">عدد الفواتير</p>
          <p className="text-[20px]">{state.purchaseInvoices.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-[12px] text-muted-foreground">إجمالي المشتريات</p>
          <p className="text-[20px] text-orange-600">{formatCurrency(state.purchaseInvoices.reduce((s, i) => s + i.total_amount, 0))} ج</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-[12px] text-muted-foreground">المسدد</p>
          <p className="text-[20px] text-blue-600">{formatCurrency(state.purchaseInvoices.reduce((s, i) => s + i.paid_amount, 0))} ج</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-[12px] text-muted-foreground">المتبقي</p>
          <p className="text-[20px] text-red-600">{formatCurrency(state.purchaseInvoices.reduce((s, i) => s + i.remaining_amount, 0))} ج</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>نوع الدفع</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.purchaseInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">لا توجد فواتير شراء</TableCell></TableRow>
              ) : [...state.purchaseInvoices].reverse().map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="text-[13px]">{inv.invoice_number}</TableCell>
                  <TableCell className="text-[13px]">{inv.invoice_date}</TableCell>
                  <TableCell className="text-[13px]">{getContactById(inv.contact_id)?.name || '-'}</TableCell>
                  <TableCell className="text-[13px]">{{ cash: 'نقدي', credit: 'آجل', partial: 'جزئي' }[inv.payment_type]}</TableCell>
                  <TableCell className="text-[13px]">{formatCurrency(inv.total_amount)}</TableCell>
                  <TableCell className="text-[13px]">{formatCurrency(inv.paid_amount)}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColor(inv.status)}`}>{statusLabel(inv.status)}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setViewInvoiceId(inv.id); setShowViewDialog(true); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={v => { setShowDialog(v); if (!v) setInvoiceItems([]); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>فاتورة شراء جديدة - {nextInvoiceNumber('purchase')}</DialogTitle><DialogDescription className="sr-only">نموذج إنشاء فاتورة شراء جديدة</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">المورد *</label>
                <Select value={invoiceData.contact_id} onValueChange={v => setInvoiceData({ ...invoiceData, contact_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المورد" /></SelectTrigger>
                  <SelectContent>{suppliers.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">المخزن</label>
                <Select value={invoiceData.warehouse_id} onValueChange={v => setInvoiceData({ ...invoiceData, warehouse_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{state.warehouses.map(w => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">نوع الدفع</label>
                <Select value={invoiceData.payment_type} onValueChange={v => setInvoiceData({ ...invoiceData, payment_type: v as PaymentType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="credit">آجل</SelectItem>
                    <SelectItem value="partial">جزئي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(invoiceData.payment_type === 'cash' || invoiceData.payment_type === 'partial') && (
                <div>
                  <label className="text-[13px] text-muted-foreground mb-1 block">الخزنة</label>
                  <Select value={invoiceData.treasury_id} onValueChange={v => setInvoiceData({ ...invoiceData, treasury_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{state.treasuries.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[14px]">أصناف الفاتورة</h3>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="w-3 h-3" />إضافة صنف</Button>
              </div>
              <div className="space-y-2">
                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-accent/30 p-2 rounded-lg">
                    <div className="col-span-4">
                      {idx === 0 && <label className="text-[11px] text-muted-foreground block mb-1">الصنف</label>}
                      <Select value={item.item_id} onValueChange={v => updateItem(idx, 'item_id', v)}>
                        <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="اختر" /></SelectTrigger>
                        <SelectContent>{state.items.map(i => (<SelectItem key={i.id} value={i.id}>{i.item_name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <label className="text-[11px] text-muted-foreground block mb-1">الكمية</label>}
                      <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="h-8 text-[12px]" />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <label className="text-[11px] text-muted-foreground block mb-1">السعر</label>}
                      <Input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))} className="h-8 text-[12px]" />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <label className="text-[11px] text-muted-foreground block mb-1">الإجمالي</label>}
                      <span className="text-[12px] block text-center py-1">{formatCurrency(item.quantity * item.unit_price - item.discount)}</span>
                    </div>
                    <div className="col-span-2">
                      <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="h-8 w-8 p-0"><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">خصم</label>
                <Input type="number" value={invoiceData.discount_amount} onChange={e => setInvoiceData({ ...invoiceData, discount_amount: Number(e.target.value) })} />
              </div>
              {invoiceData.payment_type === 'partial' && (
                <div>
                  <label className="text-[13px] text-muted-foreground mb-1 block">المبلغ المدفوع</label>
                  <Input type="number" value={invoiceData.paid_amount} onChange={e => setInvoiceData({ ...invoiceData, paid_amount: Number(e.target.value) })} />
                </div>
              )}
              <div className="flex items-end">
                <div className="bg-orange-50 p-3 rounded-lg w-full text-center">
                  <p className="text-[11px] text-orange-600">صافي الفاتورة</p>
                  <p className="text-[18px] text-orange-700">{formatCurrency(total)} ج</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setInvoiceItems([]); }}>إلغاء</Button>
            <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700"
              disabled={!invoiceData.contact_id || invoiceItems.filter(i => i.item_id).length === 0}>حفظ الفاتورة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>فاتورة شراء - {viewInvoice?.invoice_number}</DialogTitle><DialogDescription className="sr-only">تفاصيل فاتورة الشراء</DialogDescription></DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-[13px]">
                <div><span className="text-muted-foreground">المورد: </span>{getContactById(viewInvoice.contact_id)?.name}</div>
                <div><span className="text-muted-foreground">التاريخ: </span>{viewInvoice.invoice_date}</div>
                <div><span className="text-muted-foreground">نوع الدفع: </span>{{ cash: 'نقدي', credit: 'آجل', partial: 'جزئي' }[viewInvoice.payment_type]}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصنف</TableHead><TableHead>الكمية</TableHead><TableHead>السعر</TableHead><TableHead>الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-[13px]">{item.item_name}</TableCell>
                      <TableCell className="text-[13px]">{item.quantity}</TableCell>
                      <TableCell className="text-[13px]">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-[13px]">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="bg-accent/50 p-3 rounded-lg space-y-1 text-[13px]">
                <div className="flex justify-between border-t pt-1"><span>الصافي:</span><span className="text-[16px] text-orange-700">{formatCurrency(viewInvoice.total_amount)} ج</span></div>
              </div>
              {viewEntryLines.length > 0 && (
                <div>
                  <h4 className="text-[14px] mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" />القيد المحاسبي التلقائي</h4>
                  <Table>
                    <TableHeader><TableRow><TableHead>الحساب</TableHead><TableHead>مدين</TableHead><TableHead>دائن</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {viewEntryLines.map(line => (
                        <TableRow key={line.id}>
                          <TableCell className="text-[13px]">{line.account_code} - {line.account_name}</TableCell>
                          <TableCell className="text-[13px] text-emerald-600">{line.debit > 0 ? formatCurrency(line.debit) : ''}</TableCell>
                          <TableCell className="text-[13px] text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : ''}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}