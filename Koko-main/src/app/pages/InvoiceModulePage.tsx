import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Plus, Search, FileText, RotateCcw, PackageCheck,
  Trash2, Edit, Eye, Truck, Settings, AlertTriangle,
  DollarSign, CreditCard, Clock, Package, X, Printer,
  RefreshCw, Phone, MapPin,
  ArrowUpRight, ArrowDownRight, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  Invoice, InvoiceItem, InvoiceDocType, InvoiceDocStatus, InvoicePaymentMethod,
  InvoiceLineExtra, InvoicePaymentEntry, ShippingCompany, InvoiceSettings, Item
} from '../types/accounting';

const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split('T')[0];

// ============ Config ============
const invoiceTypeConfig: Record<InvoiceDocType, { label: string; icon: React.ReactNode; color: string; bg: string; contactType: 'customer' | 'supplier' | 'both' }> = {
  sales: { label: 'فاتورة بيع', icon: <ArrowUpRight className="w-4 h-4" />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', contactType: 'customer' },
  purchase: { label: 'فاتورة شراء', icon: <ArrowDownRight className="w-4 h-4" />, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', contactType: 'supplier' },
  sales_return: { label: 'مرتجع بيع', icon: <RotateCcw className="w-4 h-4" />, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', contactType: 'customer' },
  purchase_return: { label: 'مرتجع شراء', icon: <RotateCcw className="w-4 h-4" />, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', contactType: 'supplier' },
  inventory_count: { label: 'جرد', icon: <PackageCheck className="w-4 h-4" />, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', contactType: 'both' },
  damages: { label: 'هوالك', icon: <Trash2 className="w-4 h-4" />, color: 'text-red-700', bg: 'bg-red-50 border-red-200', contactType: 'both' },
};

const statusConfig: Record<InvoiceDocStatus, { label: string; color: string }> = {
  quote: { label: 'عرض سعر', color: 'bg-slate-100 text-slate-700' },
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-600' },
  pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-700' },
  received: { label: 'مستلم', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'مدفوع', color: 'bg-green-100 text-green-700' },
  partial: { label: 'دفع جزئي', color: 'bg-amber-100 text-amber-700' },
  cash_received: { label: 'تم استلام النقدية', color: 'bg-teal-100 text-teal-700' },
  returned: { label: 'مرتجع', color: 'bg-orange-100 text-orange-700' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
};

const paymentMethodConfig: Record<InvoicePaymentMethod, { label: string; icon: React.ReactNode }> = {
  cash: { label: 'نقدي', icon: <Wallet className="w-3.5 h-3.5" /> },
  credit: { label: 'آجل', icon: <Clock className="w-3.5 h-3.5" /> },
  partial: { label: 'دفع جزئي', icon: <DollarSign className="w-3.5 h-3.5" /> },
  multiple: { label: 'دفع متعدد', icon: <CreditCard className="w-3.5 h-3.5" /> },
  on_delivery: { label: 'دفع عند الاستلام', icon: <Truck className="w-3.5 h-3.5" /> },
};

// ============ Main Page ============
export function InvoiceModulePage() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [activeTab, setActiveTab] = useState<InvoiceDocType | 'shipping' | 'settings'>('sales');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<InvoiceDocType>('sales');
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const invoices = state.invoices || [];

  const getStats = (type: InvoiceDocType) => {
    const list = invoices.filter(i => i.invoice_type === type);
    const total = list.reduce((s, i) => s + i.total_amount, 0);
    const paid = list.reduce((s, i) => s + i.paid_amount, 0);
    const remaining = list.reduce((s, i) => s + i.remaining_amount, 0);
    return { count: list.length, total, paid, remaining };
  };

  const openCreateForm = (type: InvoiceDocType) => {
    setFormType(type);
    setEditInvoice(null);
    setShowForm(true);
  };

  const openEditForm = (invoice: Invoice) => {
    setFormType(invoice.invoice_type);
    setEditInvoice(invoice);
    setShowForm(true);
  };

  const tabTypes: InvoiceDocType[] = ['sales', 'purchase', 'sales_return', 'purchase_return', 'inventory_count', 'damages'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] text-foreground font-bold">مديول الفواتير</h1>
          <p className="text-[12px] text-muted-foreground">إدارة كاملة لجميع أنواع الفواتير مع التأثيرات المحاسبية والمخزنية</p>
        </div>
      </div>

      <Tabs value={activeTab as string} onValueChange={v => setActiveTab(v as any)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {tabTypes.map(type => {
            const cfg = invoiceTypeConfig[type];
            const stats = getStats(type);
            return (
              <TabsTrigger key={type} value={type} className="flex items-center gap-1.5 text-[12px]">
                {cfg.icon}
                {cfg.label}
                {stats.count > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] min-w-[18px] text-center">{stats.count}</span>
                )}
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="shipping" className="flex items-center gap-1.5 text-[12px]">
            <Truck className="w-4 h-4" /> شركات الشحن
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5 text-[12px]">
            <Settings className="w-4 h-4" /> الإعدادات
          </TabsTrigger>
        </TabsList>

        {tabTypes.map(type => (
          <TabsContent key={type} value={type}>
            <InvoiceListTab
              type={type}
              invoices={invoices.filter(i => i.invoice_type === type)}
              onCreate={() => openCreateForm(type)}
              onEdit={openEditForm}
              onView={setViewInvoice}
              formatCurrency={formatCurrency}
            />
          </TabsContent>
        ))}

        <TabsContent value="shipping">
          <ShippingCompaniesTab />
        </TabsContent>

        <TabsContent value="settings">
          <InvoiceSettingsTab />
        </TabsContent>
      </Tabs>

      {/* Invoice Form Dialog */}
      {showForm && (
        <InvoiceFormDialog
          type={formType}
          editInvoice={editInvoice}
          onClose={() => { setShowForm(false); setEditInvoice(null); }}
        />
      )}

      {/* View Invoice Dialog */}
      {viewInvoice && (
        <ViewInvoiceDialog invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
      )}
    </div>
  );
}

// ============ Invoice List Tab ============
function InvoiceListTab({ type, invoices, onCreate, onEdit, onView, formatCurrency }: {
  type: InvoiceDocType;
  invoices: Invoice[];
  onCreate: () => void;
  onEdit: (inv: Invoice) => void;
  onView: (inv: Invoice) => void;
  formatCurrency: (n: number) => string;
}) {
  const { state, dispatch } = useAccounting();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const cfg = invoiceTypeConfig[type];

  const filtered = invoices.filter(inv => {
    const contact = state.contacts.find(c => c.id === inv.contact_id);
    const matchSearch = !search || inv.invoice_number.includes(search) || contact?.name.includes(search);
    const matchStatus = statusFilter === 'all' || inv.invoice_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((s, i) => s + i.total_amount, 0);
  const totalPaid = filtered.reduce((s, i) => s + i.paid_amount, 0);
  const totalRemaining = filtered.reduce((s, i) => s + i.remaining_amount, 0);

  const changeStatus = (invoice: Invoice, newStatus: InvoiceDocStatus) => {
    dispatch({ type: 'UPDATE_INVOICE_STATUS', payload: { invoice_id: invoice.id, status: newStatus } });
    toast.success(`تم تغيير حالة الفاتورة إلى "${statusConfig[newStatus].label}"`);
    setShowStatusDialog(false);
    setSelectedInvoice(null);
  };

  const isSalesType = ['sales', 'purchase_return', 'damages'].includes(type);
  const hasCOD = type === 'sales'; // COD invoices relevant for sales

  const colLabel = isSalesType ? 'العميل' : 'المورد';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground mb-1">إجمالي الفواتير</div>
          <div className="text-[18px] font-bold">{invoices.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground mb-1">إجمالي المبالغ</div>
          <div className="text-[15px] font-bold text-blue-700">{formatCurrency(totalAmount)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground mb-1">المحصل / المدفوع</div>
          <div className="text-[15px] font-bold text-green-700">{formatCurrency(totalPaid)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground mb-1">المتبقي</div>
          <div className="text-[15px] font-bold text-red-700">{formatCurrency(totalRemaining)}</div>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الفاتورة أو اسم العميل..." className="pr-9 text-[13px]" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 text-[13px]">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onCreate} size="sm" className="gap-1.5 text-[13px]">
          <Plus className="w-4 h-4" />
          {type === 'sales' ? 'فاتورة بيع جديدة' : type === 'purchase' ? 'فاتورة شراء جديدة' : type === 'sales_return' ? 'مرتجع بيع' : type === 'purchase_return' ? 'مرتجع شراء' : type === 'inventory_count' ? 'جرد جديد' : 'هوالك جديدة'}
        </Button>
      </div>

      {/* COD Table for Sales */}
      {hasCOD && invoices.filter(i => i.payment_method === 'on_delivery').length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-600" />
              فواتير الدفع عند الاستلام
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px]">رقم الفاتورة</TableHead>
                    <TableHead className="text-[12px]">العميل</TableHead>
                    <TableHead className="text-[12px]">شركة الشحن</TableHead>
                    <TableHead className="text-[12px]">رقم التتبع</TableHead>
                    <TableHead className="text-[12px]">المبلغ</TableHead>
                    <TableHead className="text-[12px]">الحالة</TableHead>
                    <TableHead className="text-[12px]">تغيير الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.filter(i => i.payment_method === 'on_delivery').map(inv => {
                    const contact = state.contacts.find(c => c.id === inv.contact_id);
                    const shipping = state.shippingCompanies?.find(s => s.id === inv.shipping_company_id);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="text-[12px] font-medium">{inv.invoice_number}</TableCell>
                        <TableCell className="text-[12px]">{contact?.name || '-'}</TableCell>
                        <TableCell className="text-[12px]">{shipping?.name || '-'}</TableCell>
                        <TableCell className="text-[12px]">{inv.tracking_number || '-'}</TableCell>
                        <TableCell className="text-[12px]">{formatCurrency(inv.total_amount)}</TableCell>
                        <TableCell>
                          <Badge className={`text-[11px] ${statusConfig[inv.invoice_status]?.color}`}>
                            {statusConfig[inv.invoice_status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(['paid', 'returned', 'cash_received', 'partial'] as InvoiceDocStatus[]).map(s => (
                              <button
                                key={s}
                                onClick={() => changeStatus(inv, s)}
                                className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${inv.invoice_status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                              >
                                {statusConfig[s].label}
                              </button>
                            ))}
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
      )}

      {/* Main Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px]">رقم الفاتورة</TableHead>
                <TableHead className="text-[12px]">التاريخ</TableHead>
                <TableHead className="text-[12px]">{colLabel}</TableHead>
                <TableHead className="text-[12px]">الإجمالي</TableHead>
                <TableHead className="text-[12px]">المدفوع</TableHead>
                <TableHead className="text-[12px]">المتبقي</TableHead>
                <TableHead className="text-[12px]">طريقة الدفع</TableHead>
                <TableHead className="text-[12px]">الحالة</TableHead>
                <TableHead className="text-[12px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-[13px] text-muted-foreground py-10">
                    لا توجد فواتير {cfg.label}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(inv => {
                  const contact = state.contacts.find(c => c.id === inv.contact_id);
                  const pm = paymentMethodConfig[inv.payment_method];
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="text-[12px] font-medium text-blue-700">{inv.invoice_number}</TableCell>
                      <TableCell className="text-[12px]">{inv.invoice_date}</TableCell>
                      <TableCell className="text-[12px]">{contact?.name || '-'}</TableCell>
                      <TableCell className="text-[12px] font-medium">{formatCurrency(inv.total_amount)}</TableCell>
                      <TableCell className="text-[12px] text-green-700">{formatCurrency(inv.paid_amount)}</TableCell>
                      <TableCell className="text-[12px] text-red-700">{formatCurrency(inv.remaining_amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          {pm.icon}{pm.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[11px] ${statusConfig[inv.invoice_status]?.color || 'bg-gray-100 text-gray-600'}`}>
                          {statusConfig[inv.invoice_status]?.label || inv.invoice_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button onClick={() => onView(inv)} className="p-1.5 rounded hover:bg-accent transition-colors" title="عرض">
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          {['quote', 'draft'].includes(inv.invoice_status) && (
                            <button onClick={() => onEdit(inv)} className="p-1.5 rounded hover:bg-accent transition-colors" title="تعديل">
                              <Edit className="w-3.5 h-3.5 text-amber-600" />
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedInvoice(inv); setShowStatusDialog(true); }}
                            className="p-1.5 rounded hover:bg-accent transition-colors"
                            title="تغيير الحالة"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Status Change Dialog */}
      {showStatusDialog && selectedInvoice && (
        <Dialog open onOpenChange={() => setShowStatusDialog(false)}>
          <DialogContent className="max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-[15px]">تغيير حالة الفاتورة</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 py-2">
              {(Object.entries(statusConfig) as [InvoiceDocStatus, typeof statusConfig[InvoiceDocStatus]][]).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => changeStatus(selectedInvoice, k)}
                  className={`px-3 py-2 rounded-lg border text-[12px] text-right transition-colors ${selectedInvoice.invoice_status === k ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'}`}
                >
                  <Badge className={`text-[10px] ${v.color}`}>{v.label}</Badge>
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowStatusDialog(false)}>إلغاء</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============ Invoice Form Dialog ============
function InvoiceFormDialog({ type, editInvoice, onClose }: {
  type: InvoiceDocType;
  editInvoice: Invoice | null;
  onClose: () => void;
}) {
  const { state, dispatch, formatCurrency } = useAccounting();
  const cfg = invoiceTypeConfig[type];

  const isEditMode = !!editInvoice;

  // Form state
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceDocStatus>(editInvoice?.invoice_status || 'received');
  const [contactId, setContactId] = useState(editInvoice?.contact_id || '');
  const [warehouseId, setWarehouseId] = useState(editInvoice?.warehouse_id || state.invoiceSettings?.default_warehouse_id || state.warehouses[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(editInvoice?.invoice_date || today());
  const [dueDate, setDueDate] = useState(editInvoice?.due_date || '');
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>(editInvoice?.payment_method || state.invoiceSettings?.default_payment_method || 'cash');
  const [treasuryId, setTreasuryId] = useState(editInvoice?.treasury_id || state.invoiceSettings?.default_treasury_id || state.treasuries[0]?.id || '');
  const [bankId, setBankId] = useState(editInvoice?.bank_id || '');
  const [paidAmount, setPaidAmount] = useState(editInvoice?.paid_amount || 0);
  const [discountPercentage, setDiscountPercentage] = useState(editInvoice?.discount_percentage || 0);
  const [discountAmount, setDiscountAmount] = useState(editInvoice?.discount_amount || 0);
  const [taxPercentage, setTaxPercentage] = useState(editInvoice?.tax_percentage || 0);
  const [shippingCompanyId, setShippingCompanyId] = useState(editInvoice?.shipping_company_id || '');
  const [shippingCost, setShippingCost] = useState(editInvoice?.shipping_cost || 0);
  const [trackingNumber, setTrackingNumber] = useState(editInvoice?.tracking_number || '');
  const [notes, setNotes] = useState(editInvoice?.notes || '');
  const [internalNotes, setInternalNotes] = useState(editInvoice?.internal_notes || '');

  // Items
  const existingItems = editInvoice ? (state.invoiceItems || []).filter(i => i.invoice_id === editInvoice.id) : [];
  const [items, setItems] = useState<{
    item_id: string; quantity: number; unit_price: number;
    discount_percentage: number; discount_amount: number;
    tax_percentage: number; warehouse_id: string;
    _warning?: 'below_purchase' | 'below_minimum' | null;
    _last_price?: number;
  }[]>(existingItems.map(i => ({
    item_id: i.item_id, quantity: i.quantity, unit_price: i.unit_price,
    discount_percentage: i.discount_percentage, discount_amount: i.discount_amount,
    tax_percentage: i.tax_percentage, warehouse_id: i.warehouse_id,
  })));

  // Line extras (expenses/additions)
  const existingExtras = editInvoice ? (editInvoice.line_extras || []) : [];
  const [lineExtras, setLineExtras] = useState<InvoiceLineExtra[]>(existingExtras);

  // Multiple payments
  const [multiplePayments, setMultiplePayments] = useState<InvoicePaymentEntry[]>(editInvoice?.payments || []);

  // Item search
  const [itemSearch, setItemSearch] = useState('');
  const [showItemSearch, setShowItemSearch] = useState(false);

  // Contact search
  const [contactSearch, setContactSearch] = useState('');
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showQuickAddContact, setShowQuickAddContact] = useState(false);
  const [showQuickAddItem, setShowQuickAddItem] = useState(false);

  const contacts = state.contacts.filter(c =>
    cfg.contactType === 'both' || c.contact_type === cfg.contactType || c.contact_type === 'both'
  );

  const selectedContact = state.contacts.find(c => c.id === contactId);

  const filteredContacts = contacts.filter(c =>
    !contactSearch || c.name.includes(contactSearch) || c.phone.includes(contactSearch)
  );

  const filteredItems = state.items.filter(item =>
    !itemSearch || item.item_name.includes(itemSearch) || item.item_code.includes(itemSearch) || item.barcode.includes(itemSearch)
  );

  // ============ Price logic ============
  const getLastPriceForCustomer = (itemId: string): number | null => {
    if (!contactId || !state.invoiceSettings?.sell_at_last_customer_price) return null;
    const past = (state.invoices || [])
      .filter(inv => inv.contact_id === contactId && inv.invoice_type === 'sales' && inv.id !== editInvoice?.id)
      .sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
    for (const inv of past) {
      const lineItem = (state.invoiceItems || []).find(li => li.invoice_id === inv.id && li.item_id === itemId);
      if (lineItem) return lineItem.unit_price;
    }
    return null;
  };

  const addItem = (itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;
    const lastPrice = getLastPriceForCustomer(itemId);
    const price = (type === 'sales' && lastPrice !== null) ? lastPrice : (type === 'purchase' ? item.purchase_price : item.selling_price);
    const warning = type === 'sales' && state.invoiceSettings?.warn_below_purchase_price && price < item.purchase_price ? 'below_purchase' : null;
    setItems(prev => [...prev, {
      item_id: itemId, quantity: 1, unit_price: price,
      discount_percentage: 0, discount_amount: 0,
      tax_percentage: 0, warehouse_id: warehouseId,
      _warning: warning, _last_price: lastPrice ?? undefined,
    }]);
    setItemSearch('');
    setShowItemSearch(false);
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      (updated[idx] as any)[field] = value;
      if (field === 'unit_price' && type === 'sales') {
        const item = state.items.find(i => i.id === updated[idx].item_id);
        if (item && state.invoiceSettings?.warn_below_purchase_price && value < item.purchase_price) {
          updated[idx]._warning = 'below_purchase';
        } else if (item && state.invoiceSettings?.warn_below_minimum_price && value < item.purchase_price * 0.9) {
          updated[idx]._warning = 'below_minimum';
        } else {
          updated[idx]._warning = null;
        }
      }
      if (field === 'discount_percentage') {
        const subtotal = updated[idx].quantity * updated[idx].unit_price;
        updated[idx].discount_amount = subtotal * value / 100;
      }
      return updated;
    });
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  // ============ Calculations ============
  const itemsSubtotal = items.reduce((s, item) => {
    const lineSubtotal = item.quantity * item.unit_price;
    const lineDiscount = item.discount_amount || (lineSubtotal * item.discount_percentage / 100);
    const lineTaxBase = lineSubtotal - lineDiscount;
    const lineTax = lineTaxBase * item.tax_percentage / 100;
    return s + lineTaxBase + lineTax;
  }, 0);

  const discountAmt = discountAmount > 0 ? discountAmount : (itemsSubtotal * discountPercentage / 100);
  const afterDiscount = itemsSubtotal - discountAmt;
  const taxAmt = afterDiscount * taxPercentage / 100;
  const extrasInternal = lineExtras.filter(e => e.is_internal).reduce((s, e) => s + e.amount, 0);
  const extrasAdditions = lineExtras.filter(e => !e.is_internal).reduce((s, e) => s + e.amount, 0);
  const totalBeforeShipping = afterDiscount + taxAmt + extrasAdditions;
  const totalAmount = totalBeforeShipping + shippingCost;
  const multiPaid = multiplePayments.reduce((s, p) => s + p.amount, 0);
  const effectivePaid = paymentMethod === 'cash' ? totalAmount : paymentMethod === 'credit' ? 0 : paymentMethod === 'multiple' ? multiPaid : paymentMethod === 'on_delivery' ? 0 : paidAmount;
  const remaining = totalAmount - effectivePaid;

  // ============ Submit ============
  const handleSubmit = () => {
    if (!contactId && !['inventory_count', 'damages'].includes(type)) {
      toast.error('يرجى اختيار العميل أو المورد');
      return;
    }
    if (items.length === 0) {
      toast.error('يرجى إضافة صنف واحد على الأقل');
      return;
    }

    const invoiceId = editInvoice?.id || uid();
    const settings = state.invoiceSettings || {};
    const prefix = {
      sales: settings.prefix_sales || 'SI',
      purchase: settings.prefix_purchase || 'PI',
      sales_return: settings.prefix_sales_return || 'SR',
      purchase_return: settings.prefix_purchase_return || 'PR',
      inventory_count: settings.prefix_inventory || 'INV',
      damages: settings.prefix_damages || 'DMG',
    }[type];
    const existingCount = (state.invoices || []).filter(i => i.invoice_type === type).length;
    const invoiceNumber = editInvoice?.invoice_number || `${prefix}-${String(existingCount + 1).padStart(5, '0')}`;

    const invoice: Invoice = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      invoice_type: type,
      invoice_status: invoiceStatus,
      invoice_date: invoiceDate,
      due_date: dueDate,
      contact_id: contactId,
      warehouse_id: warehouseId,
      shipping_company_id: shippingCompanyId,
      shipping_cost: shippingCost,
      tracking_number: trackingNumber,
      payment_method: paymentMethod,
      treasury_id: treasuryId,
      bank_id: bankId,
      subtotal: itemsSubtotal,
      discount_percentage: discountPercentage,
      discount_amount: discountAmt,
      tax_percentage: taxPercentage,
      tax_amount: taxAmt,
      extras_total: extrasInternal + extrasAdditions,
      total_amount: totalAmount,
      paid_amount: effectivePaid,
      remaining_amount: remaining,
      payments: multiplePayments,
      line_extras: lineExtras,
      notes,
      internal_notes: internalNotes,
      reference_invoice_id: '',
      created_at: editInvoice?.created_at || new Date().toISOString(),
    };

    const invoiceItems: InvoiceItem[] = items.map(item => {
      const lineSubtotal = item.quantity * item.unit_price;
      const lineDiscount = item.discount_amount || (lineSubtotal * item.discount_percentage / 100);
      const lineTaxBase = lineSubtotal - lineDiscount;
      const lineTax = lineTaxBase * item.tax_percentage / 100;
      const stateItem = state.items.find(i => i.id === item.item_id);
      const stockRecord = state.itemStock.find(s => s.item_id === item.item_id && s.warehouse_id === item.warehouse_id);
      return {
        id: uid(),
        invoice_id: invoiceId,
        item_id: item.item_id,
        item_name: stateItem?.item_name || '',
        item_code: stateItem?.item_code || '',
        unit: stateItem?.unit || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        discount_amount: lineDiscount,
        tax_percentage: item.tax_percentage,
        tax_amount: lineTax,
        total: lineTaxBase + lineTax,
        cost_price: stockRecord?.average_cost || stateItem?.purchase_price || 0,
        warehouse_id: item.warehouse_id,
      };
    });

    dispatch({ type: 'CREATE_INVOICE', payload: { invoice, items: invoiceItems } });
    toast.success(`تم ${isEditMode ? 'تعديل' : 'إنشاء'} ${cfg.label} رقم ${invoiceNumber} بنجاح`);
    onClose();
  };

  // ============ Quick Add Contact ============
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleQuickAddContact = () => {
    if (!newContactName.trim()) return;
    const newId = uid();
    const accountId = uid();
    const contact = {
      id: newId, contact_type: (cfg.contactType === 'both' ? 'customer' : cfg.contactType) as 'customer' | 'supplier',
      name: newContactName.trim(), phone: newContactPhone, phone2: '', email: '', address: '',
      tax_number: '', credit_limit: 0, account_id: accountId, opening_balance: 0,
      notes: '', is_active: true, group_id: '', price_list_id: '',
      created_at: new Date().toISOString(),
    };
    const accountCode = cfg.contactType === 'supplier' ? `2101-${String(state.contacts.filter(c => c.contact_type === 'supplier').length + 1).padStart(3, '0')}` : `1105-${String(state.contacts.filter(c => c.contact_type === 'customer').length + 1).padStart(3, '0')}`;
    const account = {
      id: accountId, account_code: accountCode, account_name: newContactName.trim(),
      account_type: cfg.contactType === 'supplier' ? 'liabilities' as const : 'assets' as const,
      parent_id: cfg.contactType === 'supplier' ? 'l3' : 'a7', level: 4, is_parent: false, is_active: true,
      opening_balance: 0, balance_type: cfg.contactType === 'supplier' ? 'credit' as const : 'debit' as const,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CONTACT', payload: { contact, account } });
    setContactId(newId);
    setShowQuickAddContact(false);
    setNewContactName('');
    setNewContactPhone('');
    toast.success('تم إضافة جهة الاتصال بنجاح');
  };

  // ============ Quick Add Item ============
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemPurchasePrice, setNewItemPurchasePrice] = useState(0);
  const [newItemSellPrice, setNewItemSellPrice] = useState(0);
  const [newItemUnit, setNewItemUnit] = useState('قطعة');

  const handleQuickAddItem = () => {
    if (!newItemName.trim()) return;
    const newId = uid();
    const item: Item = {
      id: newId, item_code: newItemCode || `ITM${String(state.items.length + 1).padStart(3, '0')}`,
      item_name: newItemName.trim(), category_id: '', unit: newItemUnit,
      purchase_price: newItemPurchasePrice, selling_price: newItemSellPrice,
      minimum_stock: 0, barcode: '', description: '', is_active: true,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_ITEM', payload: item });
    addItem(newId);
    setShowQuickAddItem(false);
    setNewItemName(''); setNewItemCode(''); setNewItemPurchasePrice(0); setNewItemSellPrice(0); setNewItemUnit('قطعة');
    toast.success('تم إضافة الصنف وإضافته للفاتورة');
  };

  const isSalesRelated = ['sales', 'purchase_return'].includes(type);
  const showShipping = ['sales', 'purchase'].includes(type);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[16px] flex items-center gap-2">
            <span className={cfg.color}>{cfg.icon}</span>
            {isEditMode ? `تعديل ${cfg.label}` : `${cfg.label} جديدة`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Row 1: Status, Number, Date, Due Date */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">الحالة</label>
              <Select value={invoiceStatus} onValueChange={v => setInvoiceStatus(v as InvoiceDocStatus)}>
                <SelectTrigger className="text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['quote', 'draft', 'pending', 'received', 'paid', 'partial'] as InvoiceDocStatus[]).map(s => (
                    <SelectItem key={s} value={s} className="text-[12px]">{statusConfig[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">تاريخ الفاتورة</label>
              <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="text-[12px]" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">تاريخ الاستحقاق</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-[12px]" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">المخزن</label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger className="text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {state.warehouses.filter(w => w.is_active).map(w => (
                    <SelectItem key={w.id} value={w.id} className="text-[12px]">{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Contact */}
          <div>
            <label className="text-[12px] text-muted-foreground mb-1 block">
              {cfg.contactType === 'supplier' ? 'المورد' : 'العميل'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={selectedContact?.name || contactSearch}
                  onChange={e => { setContactSearch(e.target.value); setContactId(''); setShowContactSearch(true); }}
                  onFocus={() => setShowContactSearch(true)}
                  placeholder={`ابحث عن ${cfg.contactType === 'supplier' ? 'مورد' : 'عميل'}...`}
                  className="pr-8 text-[12px]"
                />
                {showContactSearch && (filteredContacts.length > 0 || contactSearch) && (
                  <div className="absolute top-full mt-1 w-full bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {filteredContacts.slice(0, 10).map(c => (
                      <button key={c.id} className="w-full text-right px-3 py-2 text-[12px] hover:bg-accent flex items-center justify-between"
                        onClick={() => { setContactId(c.id); setContactSearch(''); setShowContactSearch(false); }}>
                        <span>{c.name}</span>
                        <span className="text-muted-foreground text-[11px]">{c.phone}</span>
                      </button>
                    ))}
                    {filteredContacts.length === 0 && (
                      <div className="px-3 py-2 text-[12px] text-muted-foreground">لا توجد نتائج</div>
                    )}
                  </div>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowQuickAddContact(true)} className="gap-1 text-[12px]">
                <Plus className="w-3.5 h-3.5" />
                جديد
              </Button>
            </div>
          </div>

          {/* Quick Add Contact */}
          {showQuickAddContact && (
            <Card className="p-3 bg-accent/30 border-dashed">
              <div className="text-[12px] font-medium mb-2">إضافة {cfg.contactType === 'supplier' ? 'مورد' : 'عميل'} جديد</div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="الاسم *" value={newContactName} onChange={e => setNewContactName(e.target.value)} className="text-[12px]" />
                <Input placeholder="رقم الهاتف" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} className="text-[12px]" />
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleQuickAddContact} className="text-[12px]">حفظ وإضافة</Button>
                <Button size="sm" variant="outline" onClick={() => setShowQuickAddContact(false)} className="text-[12px]">إلغاء</Button>
              </div>
            </Card>
          )}

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium">الأصناف</label>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={itemSearch}
                    onChange={e => { setItemSearch(e.target.value); setShowItemSearch(true); }}
                    onFocus={() => setShowItemSearch(true)}
                    placeholder="بحث عن صنف..."
                    className="pr-8 text-[12px] w-52"
                  />
                  {showItemSearch && (
                    <div className="absolute top-full mt-1 right-0 w-64 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredItems.slice(0, 8).map(item => {
                        const stock = state.itemStock.find(s => s.item_id === item.id && s.warehouse_id === warehouseId);
                        return (
                          <button key={item.id} className="w-full text-right px-3 py-2 text-[12px] hover:bg-accent"
                            onClick={() => addItem(item.id)}>
                            <div className="flex items-center justify-between">
                              <span>{item.item_name}</span>
                              <span className="text-muted-foreground text-[10px]">رصيد: {stock?.quantity || 0}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">{item.item_code} | بيع: {item.selling_price} | شراء: {item.purchase_price}</div>
                          </button>
                        );
                      })}
                      {filteredItems.length === 0 && <div className="px-3 py-2 text-[12px] text-muted-foreground">لا توجد أصناف</div>}
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowQuickAddItem(true)} className="gap-1 text-[12px]">
                  <Plus className="w-3.5 h-3.5" />
                  صنف جديد
                </Button>
              </div>
            </div>

            {/* Quick Add Item */}
            {showQuickAddItem && (
              <Card className="p-3 mb-2 bg-accent/30 border-dashed">
                <div className="text-[12px] font-medium mb-2">إضافة صنف جديد</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Input placeholder="اسم الصنف *" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="text-[12px] md:col-span-2" />
                  <Input placeholder="الكود" value={newItemCode} onChange={e => setNewItemCode(e.target.value)} className="text-[12px]" />
                  <Input placeholder="وحدة القياس" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="text-[12px]" />
                  <Input type="number" placeholder="سعر الشراء" value={newItemPurchasePrice} onChange={e => setNewItemPurchasePrice(Number(e.target.value))} className="text-[12px]" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 max-w-xs">
                  <Input type="number" placeholder="سعر البيع" value={newItemSellPrice} onChange={e => setNewItemSellPrice(Number(e.target.value))} className="text-[12px]" />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleQuickAddItem} className="text-[12px]">حفظ وإضافة للفاتورة</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowQuickAddItem(false)} className="text-[12px]">إلغاء</Button>
                </div>
              </Card>
            )}

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] w-8">#</TableHead>
                    <TableHead className="text-[11px]">الصنف</TableHead>
                    <TableHead className="text-[11px] w-20">الكمية</TableHead>
                    <TableHead className="text-[11px] w-28">السعر</TableHead>
                    <TableHead className="text-[11px] w-20">خصم%</TableHead>
                    <TableHead className="text-[11px] w-20">ضريبة%</TableHead>
                    <TableHead className="text-[11px] w-28">الإجمالي</TableHead>
                    <TableHead className="text-[11px] w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-[12px] text-muted-foreground py-8">
                        ابحث عن صنف أو أضف صنفاً جديداً
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, idx) => {
                      const stateItem = state.items.find(i => i.id === item.item_id);
                      const lineSubtotal = item.quantity * item.unit_price;
                      const lineDiscount = item.discount_amount || (lineSubtotal * item.discount_percentage / 100);
                      const lineTaxBase = lineSubtotal - lineDiscount;
                      const lineTax = lineTaxBase * item.tax_percentage / 100;
                      const lineTotal = lineTaxBase + lineTax;
                      return (
                        <TableRow key={idx} className={item._warning ? 'bg-red-50' : ''}>
                          <TableCell className="text-[11px] text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="text-[12px]">
                            <div>{stateItem?.item_name}</div>
                            <div className="text-[10px] text-muted-foreground">{stateItem?.item_code}</div>
                            {item._warning === 'below_purchase' && (
                              <div className="flex items-center gap-1 text-[10px] text-red-600 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                السعر أقل من سعر الشراء ({stateItem?.purchase_price})
                              </div>
                            )}
                            {item._last_price && item._last_price !== stateItem?.selling_price && (
                              <div className="text-[10px] text-blue-600 mt-0.5">
                                آخر سعر لهذا العميل: {item._last_price}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="text-[12px] h-7 px-2" min={0.001} step="any" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))} className="text-[12px] h-7 px-2" min={0} step="any" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={item.discount_percentage} onChange={e => updateItem(idx, 'discount_percentage', Number(e.target.value))} className="text-[12px] h-7 px-2" min={0} max={100} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={item.tax_percentage} onChange={e => updateItem(idx, 'tax_percentage', Number(e.target.value))} className="text-[12px] h-7 px-2" min={0} />
                          </TableCell>
                          <TableCell className="text-[12px] font-medium">{lineTotal.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <button onClick={() => removeItem(idx)} className="p-1 hover:text-red-600 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Payment Section */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Payment Method */}
            <div className="space-y-3">
              <div className="text-[13px] font-medium">طريقة الدفع</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.entries(paymentMethodConfig) as [InvoicePaymentMethod, typeof paymentMethodConfig[InvoicePaymentMethod]][]).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setPaymentMethod(k)}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-[12px] transition-colors ${paymentMethod === k ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'}`}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>

              {/* Cash: choose treasury */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1 block">الخزنة</label>
                  <Select value={treasuryId} onValueChange={setTreasuryId}>
                    <SelectTrigger className="text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {state.treasuries.filter(t => t.is_active).map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-[12px]">
                          {t.name} (رصيد: {t.current_balance.toLocaleString('ar-EG')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Partial: paid amount + treasury */}
              {paymentMethod === 'partial' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[12px] text-muted-foreground mb-1 block">المبلغ المدفوع</label>
                      <Input type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="text-[12px]" />
                    </div>
                    <div>
                      <label className="text-[12px] text-muted-foreground mb-1 block">الخزنة</label>
                      <Select value={treasuryId} onValueChange={setTreasuryId}>
                        <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {state.treasuries.filter(t => t.is_active).map(t => (
                            <SelectItem key={t.id} value={t.id} className="text-[12px]">{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-[12px] text-amber-700 bg-amber-50 rounded p-2">
                    المتبقي: {(totalAmount - paidAmount).toLocaleString('ar-EG')}
                  </div>
                </div>
              )}

              {/* Multiple Payments */}
              {paymentMethod === 'multiple' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground">الدفعات المتعددة</span>
                    <Button size="sm" variant="outline" onClick={() => setMultiplePayments(prev => [...prev, {
                      id: uid(), amount: 0, payment_date: today(), payment_method: 'cash',
                      treasury_id: treasuryId, bank_id: '', check_number: '', notes: '',
                    }])} className="text-[11px] h-6 gap-1">
                      <Plus className="w-3 h-3" /> إضافة دفعة
                    </Button>
                  </div>
                  {multiplePayments.map((mp, mpIdx) => (
                    <div key={mp.id} className="grid grid-cols-3 gap-1.5 p-2 bg-muted/30 rounded-lg">
                      <Input type="number" placeholder="المبلغ" value={mp.amount} onChange={e => setMultiplePayments(prev => prev.map((p, i) => i === mpIdx ? { ...p, amount: Number(e.target.value) } : p))} className="text-[11px] h-7" />
                      <Input type="date" value={mp.payment_date} onChange={e => setMultiplePayments(prev => prev.map((p, i) => i === mpIdx ? { ...p, payment_date: e.target.value } : p))} className="text-[11px] h-7" />
                      <div className="flex gap-1">
                        <Select value={mp.treasury_id} onValueChange={val => setMultiplePayments(prev => prev.map((p, i) => i === mpIdx ? { ...p, treasury_id: val } : p))}>
                          <SelectTrigger className="text-[11px] h-7"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {state.treasuries.map(t => <SelectItem key={t.id} value={t.id} className="text-[11px]">{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <button onClick={() => setMultiplePayments(prev => prev.filter((_, i) => i !== mpIdx))} className="p-1 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-[12px] text-muted-foreground bg-muted/30 rounded p-2 flex justify-between">
                    <span>إجمالي الدفعات: {multiPaid.toLocaleString('ar-EG')}</span>
                    <span>المتبقي: {(totalAmount - multiPaid).toLocaleString('ar-EG')}</span>
                  </div>
                </div>
              )}

              {/* On Delivery: choose shipping company */}
              {paymentMethod === 'on_delivery' && (
                <div className="space-y-2">
                  <div className="text-[12px] text-orange-700 bg-orange-50 rounded p-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    سيتم تحصيل المبلغ عند الاستلام عن طريق شركة الشحن
                  </div>
                  {showShipping && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[12px] text-muted-foreground mb-1 block">شركة الشحن</label>
                        <Select value={shippingCompanyId} onValueChange={setShippingCompanyId}>
                          <SelectTrigger className="text-[12px]"><SelectValue placeholder="اختر شركة الشحن" /></SelectTrigger>
                          <SelectContent>
                            {(state.shippingCompanies || []).filter(sc => sc.is_active).map(sc => (
                              <SelectItem key={sc.id} value={sc.id} className="text-[12px]">{sc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[12px] text-muted-foreground mb-1 block">رقم التتبع</label>
                        <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="رقم التتبع..." className="text-[12px]" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="text-[13px] font-medium">ملخص الفاتورة</div>
              <div className="space-y-1.5 bg-muted/20 rounded-lg p-3">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span>{itemsSubtotal.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="text-muted-foreground flex-1">خصم</span>
                  <Input type="number" value={discountPercentage} onChange={e => setDiscountPercentage(Number(e.target.value))} className="w-16 h-6 text-[11px] text-center" min={0} max={100} placeholder="%" />
                  <span className="text-muted-foreground">%</span>
                  <Input type="number" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="w-20 h-6 text-[11px] text-center" min={0} placeholder="مبلغ" />
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="text-muted-foreground flex-1">ضريبة</span>
                  <Input type="number" value={taxPercentage} onChange={e => setTaxPercentage(Number(e.target.value))} className="w-16 h-6 text-[11px] text-center" min={0} placeholder="%" />
                  <span className="text-muted-foreground">%</span>
                  <span className="w-20 text-center">{taxAmt.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                </div>
                {showShipping && (
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="text-muted-foreground flex-1">تكلفة الشحن</span>
                    <Input type="number" value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} className="w-24 h-6 text-[11px] text-center" min={0} />
                  </div>
                )}
                {extrasAdditions > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">إضافات</span>
                    <span className="text-green-700">+{extrasAdditions.toLocaleString('ar-EG')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[14px] font-bold border-t pt-1.5 mt-1.5">
                  <span>الإجمالي</span>
                  <span className="text-blue-700">{totalAmount.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[12px] text-green-700">
                  <span>المدفوع</span>
                  <span>{effectivePaid.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[12px] text-red-700">
                  <span>المتبقي</span>
                  <span>{remaining.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Company (for non-on-delivery) */}
          {showShipping && paymentMethod !== 'on_delivery' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">شركة الشحن (اختياري)</label>
                <Select value={shippingCompanyId || 'none'} onValueChange={v => setShippingCompanyId(v === 'none' ? '' : v)}>
                  <SelectTrigger className="text-[12px]"><SelectValue placeholder="بدون شحن" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-[12px]">بدون شحن</SelectItem>
                    {(state.shippingCompanies || []).filter(sc => sc.is_active).map(sc => (
                      <SelectItem key={sc.id} value={sc.id} className="text-[12px]">{sc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {shippingCompanyId && (
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1 block">رقم التتبع</label>
                  <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="رقم التتبع..." className="text-[12px]" />
                </div>
              )}
            </div>
          )}

          {/* Line Extras: Expenses & Additions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium">المصاريف والإضافات</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setLineExtras(prev => [...prev, { id: uid(), description: '', amount: 0, account_id: '', is_internal: true }])} className="text-[11px] h-7 gap-1">
                  <Plus className="w-3 h-3" /> مصاريف داخلية
                </Button>
                <Button size="sm" variant="outline" onClick={() => setLineExtras(prev => [...prev, { id: uid(), description: '', amount: 0, account_id: '', is_internal: false }])} className="text-[11px] h-7 gap-1">
                  <Plus className="w-3 h-3" /> إضافة للعميل
                </Button>
              </div>
            </div>
            {lineExtras.length > 0 && (
              <div className="space-y-1.5">
                {lineExtras.map((extra, eIdx) => (
                  <div key={extra.id} className={`flex items-center gap-2 p-2 rounded-lg border ${extra.is_internal ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                    <Badge className={`text-[10px] shrink-0 ${extra.is_internal ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {extra.is_internal ? '🔒 داخلي' : '👁️ للعميل'}
                    </Badge>
                    <Input value={extra.description} onChange={e => setLineExtras(prev => prev.map((x, i) => i === eIdx ? { ...x, description: e.target.value } : x))} placeholder="الوصف..." className="flex-1 text-[12px] h-7" />
                    <Input type="number" value={extra.amount} onChange={e => setLineExtras(prev => prev.map((x, i) => i === eIdx ? { ...x, amount: Number(e.target.value) } : x))} placeholder="المبلغ" className="w-24 text-[12px] h-7" />
                    <button onClick={() => setLineExtras(prev => prev.filter((_, i) => i !== eIdx))} className="p-1 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">ملاحظات (تظهر في الفاتورة)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded-md px-3 py-2 text-[12px] h-16 resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="ملاحظات..." />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">🔒 ملاحظات داخلية (لا تظهر في الفاتورة)</label>
              <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} className="w-full border rounded-md px-3 py-2 text-[12px] h-16 resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-amber-50" placeholder="ملاحظات داخلية..." />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => { setInvoiceStatus('draft'); handleSubmit(); }} variant="outline" className="text-[13px]">حفظ كمسودة</Button>
          <Button onClick={handleSubmit} className="text-[13px]">
            {isEditMode ? 'تحديث الفاتورة' : `إنشاء ${cfg.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ View Invoice Dialog ============
function ViewInvoiceDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { state, formatCurrency } = useAccounting();
  const cfg = invoiceTypeConfig[invoice.invoice_type];
  const contact = state.contacts.find(c => c.id === invoice.contact_id);
  const warehouse = state.warehouses.find(w => w.id === invoice.warehouse_id);
  const shipping = (state.shippingCompanies || []).find(s => s.id === invoice.shipping_company_id);
  const items = (state.invoiceItems || []).filter(i => i.invoice_id === invoice.id);
  const additions = (invoice.line_extras || []).filter(e => !e.is_internal);
  const internalExpenses = (invoice.line_extras || []).filter(e => e.is_internal);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[16px] flex items-center gap-2">
            <span className={cfg.color}>{cfg.icon}</span>
            {cfg.label} رقم {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg ${cfg.bg} border`}>
            <div>
              <div className="text-[10px] text-muted-foreground">الحالة</div>
              <Badge className={`text-[11px] mt-0.5 ${statusConfig[invoice.invoice_status]?.color}`}>
                {statusConfig[invoice.invoice_status]?.label}
              </Badge>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">التاريخ</div>
              <div className="text-[12px]">{invoice.invoice_date}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">{cfg.contactType === 'supplier' ? 'المورد' : 'العميل'}</div>
              <div className="text-[12px] font-medium">{contact?.name || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">المخزن</div>
              <div className="text-[12px]">{warehouse?.name || '-'}</div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="text-[13px] font-medium mb-2">الأصناف</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">الصنف</TableHead>
                  <TableHead className="text-[11px]">الكمية</TableHead>
                  <TableHead className="text-[11px]">السعر</TableHead>
                  <TableHead className="text-[11px]">الخصم</TableHead>
                  <TableHead className="text-[11px]">الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="text-[12px]">{item.item_name}</TableCell>
                    <TableCell className="text-[12px]">{item.quantity} {item.unit}</TableCell>
                    <TableCell className="text-[12px]">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-[12px]">{item.discount_amount > 0 ? formatCurrency(item.discount_amount) : '-'}</TableCell>
                    <TableCell className="text-[12px] font-medium">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Additions visible to customer */}
          {additions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-[12px] font-medium mb-2 text-blue-700">الإضافات</div>
              {additions.map(a => (
                <div key={a.id} className="flex justify-between text-[12px]">
                  <span>{a.description}</span>
                  <span>{formatCurrency(a.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="space-y-1 bg-muted/20 rounded-lg p-3">
            <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">المجموع الفرعي</span><span>{formatCurrency(invoice.subtotal)}</span></div>
            {invoice.discount_amount > 0 && <div className="flex justify-between text-[12px] text-red-600"><span>الخصم</span><span>-{formatCurrency(invoice.discount_amount)}</span></div>}
            {invoice.tax_amount > 0 && <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">الضريبة</span><span>{formatCurrency(invoice.tax_amount)}</span></div>}
            {invoice.shipping_cost > 0 && <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">الشحن</span><span>{formatCurrency(invoice.shipping_cost)}</span></div>}
            <div className="flex justify-between text-[14px] font-bold border-t pt-1.5"><span>الإجمالي</span><span className="text-blue-700">{formatCurrency(invoice.total_amount)}</span></div>
            <div className="flex justify-between text-[12px] text-green-700"><span>المدفوع</span><span>{formatCurrency(invoice.paid_amount)}</span></div>
            <div className="flex justify-between text-[12px] text-red-700"><span>المتبقي</span><span>{formatCurrency(invoice.remaining_amount)}</span></div>
          </div>

          {/* Shipping */}
          {shipping && (
            <div className="flex items-center gap-2 text-[12px] bg-orange-50 rounded-lg p-2">
              <Truck className="w-4 h-4 text-orange-600" />
              <span>شركة الشحن: {shipping.name}</span>
              {invoice.tracking_number && <span>| رقم التتبع: {invoice.tracking_number}</span>}
            </div>
          )}

          {/* Internal expenses (only show in view, not print) */}
          {internalExpenses.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-[12px] font-medium mb-1 text-amber-700">🔒 مصاريف داخلية (لا تطبع)</div>
              {internalExpenses.map(e => (
                <div key={e.id} className="flex justify-between text-[12px]">
                  <span>{e.description}</span>
                  <span>{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {invoice.notes && (
            <div className="text-[12px] text-muted-foreground bg-muted/30 rounded p-2">{invoice.notes}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-1.5">
            <Printer className="w-4 h-4" /> طباعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Shipping Companies Tab ============
function ShippingCompaniesTab() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [editCompany, setEditCompany] = useState<ShippingCompany | null>(null);
  const [viewCompany, setViewCompany] = useState<ShippingCompany | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', commission_rate: 0, notes: '' });

  const shippingCompanies = state.shippingCompanies || [];

  const openCreate = () => {
    setEditCompany(null);
    setForm({ name: '', phone: '', address: '', commission_rate: 0, notes: '' });
    setShowDialog(true);
  };

  const openEdit = (company: ShippingCompany) => {
    setEditCompany(company);
    setForm({ name: company.name, phone: company.phone, address: company.address, commission_rate: company.commission_rate, notes: company.notes });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('يرجى إدخال اسم الشركة'); return; }
    const company: ShippingCompany = {
      id: editCompany?.id || uid(),
      ...form,
      account_id: '',
      is_active: true,
      created_at: editCompany?.created_at || new Date().toISOString(),
    };
    if (editCompany) {
      dispatch({ type: 'UPDATE_SHIPPING_COMPANY', payload: company });
      toast.success('تم تحديث شركة الشحن');
    } else {
      dispatch({ type: 'ADD_SHIPPING_COMPANY', payload: company });
      toast.success('تم إضافة شركة الشحن');
    }
    setShowDialog(false);
  };

  const getCompanyStats = (companyId: string) => {
    const invoices = (state.invoices || []).filter(i => i.shipping_company_id === companyId);
    const cod = invoices.filter(i => i.payment_method === 'on_delivery');
    const totalCOD = cod.reduce((s, i) => s + i.total_amount, 0);
    const collectedCOD = cod.filter(i => ['paid', 'cash_received'].includes(i.invoice_status)).reduce((s, i) => s + i.total_amount, 0);
    return { totalInvoices: invoices.length, codCount: cod.length, totalCOD, collectedCOD, pendingCOD: totalCOD - collectedCOD };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold">شركات الشحن</h2>
          <p className="text-[12px] text-muted-foreground">إدارة شركات الشحن وكشف حساب مفصل لكل شركة</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5 text-[13px]">
          <Plus className="w-4 h-4" /> إضافة شركة شحن
        </Button>
      </div>

      <div className="grid gap-4">
        {shippingCompanies.map(company => {
          const stats = getCompanyStats(company.id);
          return (
            <Card key={company.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium">{company.name}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {company.phone && <div className="flex items-center gap-1 text-[12px] text-muted-foreground"><Phone className="w-3 h-3" />{company.phone}</div>}
                      {company.address && <div className="flex items-center gap-1 text-[12px] text-muted-foreground"><MapPin className="w-3 h-3" />{company.address}</div>}
                      {company.commission_rate > 0 && <div className="text-[12px] text-muted-foreground">عمولة: {company.commission_rate}%</div>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewCompany(company)} className="text-[12px] h-7 gap-1">
                    <Eye className="w-3.5 h-3.5" /> كشف الحساب
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(company)} className="text-[12px] h-7">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 pt-3 border-t">
                <div className="text-center">
                  <div className="text-[11px] text-muted-foreground">فواتير</div>
                  <div className="text-[15px] font-bold">{stats.totalInvoices}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-muted-foreground">كاش عند الاستلام</div>
                  <div className="text-[15px] font-bold">{stats.codCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-muted-foreground">إجمالي COD</div>
                  <div className="text-[15px] font-bold text-blue-700">{formatCurrency(stats.totalCOD)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-muted-foreground">محصل</div>
                  <div className="text-[15px] font-bold text-green-700">{formatCurrency(stats.collectedCOD)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-muted-foreground">معلق</div>
                  <div className="text-[15px] font-bold text-red-700">{formatCurrency(stats.pendingCOD)}</div>
                </div>
              </div>
            </Card>
          );
        })}
        {shippingCompanies.length === 0 && (
          <Card className="p-10 text-center">
            <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <div className="text-[14px] text-muted-foreground">لا توجد شركات شحن</div>
            <Button size="sm" onClick={openCreate} className="mt-3 gap-1.5">
              <Plus className="w-4 h-4" /> إضافة شركة شحن
            </Button>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {showDialog && (
        <Dialog open onOpenChange={() => setShowDialog(false)}>
          <DialogContent className="max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-[15px]">{editCompany ? 'تعديل شركة الشحن' : 'إضافة شركة شحن'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">اسم الشركة *</label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="text-[12px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1 block">رقم الهاتف</label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="text-[12px]" />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1 block">نسبة العمولة %</label>
                  <Input type="number" value={form.commission_rate} onChange={e => setForm(p => ({ ...p, commission_rate: Number(e.target.value) }))} className="text-[12px]" min={0} />
                </div>
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">العنوان</label>
                <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="text-[12px]" />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">ملاحظات</label>
                <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="text-[12px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button size="sm" onClick={handleSave}>{editCompany ? 'تحديث' : 'إضافة'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Company Statement Dialog */}
      {viewCompany && (
        <Dialog open onOpenChange={() => setViewCompany(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-[15px] flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                كشف حساب: {viewCompany.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {(state.invoices || []).filter(i => i.shipping_company_id === viewCompany.id).length === 0 ? (
                <div className="text-center text-[13px] text-muted-foreground py-10">لا توجد فواتير لهذه الشركة</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[11px]">رقم الفاتورة</TableHead>
                      <TableHead className="text-[11px]">التاريخ</TableHead>
                      <TableHead className="text-[11px]">العميل</TableHead>
                      <TableHead className="text-[11px]">رقم التتبع</TableHead>
                      <TableHead className="text-[11px]">المبلغ</TableHead>
                      <TableHead className="text-[11px]">طريقة الدفع</TableHead>
                      <TableHead className="text-[11px]">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(state.invoices || []).filter(i => i.shipping_company_id === viewCompany.id).map(inv => {
                      const contact = state.contacts.find(c => c.id === inv.contact_id);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="text-[12px] font-medium text-blue-700">{inv.invoice_number}</TableCell>
                          <TableCell className="text-[12px]">{inv.invoice_date}</TableCell>
                          <TableCell className="text-[12px]">{contact?.name || '-'}</TableCell>
                          <TableCell className="text-[12px]">{inv.tracking_number || '-'}</TableCell>
                          <TableCell className="text-[12px]">{formatCurrency(inv.total_amount)}</TableCell>
                          <TableCell className="text-[12px]">
                            {paymentMethodConfig[inv.payment_method]?.label}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${statusConfig[inv.invoice_status]?.color}`}>
                              {statusConfig[inv.invoice_status]?.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setViewCompany(null)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============ Invoice Settings Tab ============
function InvoiceSettingsTab() {
  const { state, dispatch } = useAccounting();
  const [settings, setSettings] = useState<InvoiceSettings>(() => state.invoiceSettings || {
    sell_at_last_customer_price: true,
    warn_below_purchase_price: true,
    warn_below_minimum_price: true,
    prefix_sales: 'SI', prefix_purchase: 'PI', prefix_sales_return: 'SR',
    prefix_purchase_return: 'PR', prefix_inventory: 'INV', prefix_damages: 'DMG',
    default_warehouse_id: state.warehouses[0]?.id || '',
    default_treasury_id: state.treasuries[0]?.id || '',
    default_payment_method: 'cash',
    allow_negative_stock: false,
    show_profit: false,
  });

  const handleSave = () => {
    dispatch({ type: 'UPDATE_INVOICE_SETTINGS', payload: settings });
    toast.success('تم حفظ إعدادات الفواتير');
  };

  const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) => (
    <div className="flex items-start justify-between py-3 border-b last:border-0">
      <div>
        <div className="text-[13px]">{label}</div>
        {desc && <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-0.5' : 'translate-x-5'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Pricing Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            إعدادات التسعير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Toggle
            checked={settings.sell_at_last_customer_price}
            onChange={v => setSettings(p => ({ ...p, sell_at_last_customer_price: v }))}
            label="البيع بآخر سعر لنفس العميل"
            desc="عند إضافة صنف لفاتورة بيع، يتم تلقائياً تحميل آخر سعر بيع لهذا الصنف لنفس العميل"
          />
          <Toggle
            checked={settings.warn_below_purchase_price}
            onChange={v => setSettings(p => ({ ...p, warn_below_purchase_price: v }))}
            label="تحذير عند البيع بأقل من سعر الشراء"
            desc="يظهر تحذير إذا كان سعر البيع أقل من سعر الشراء الحالي للصنف"
          />
          <Toggle
            checked={settings.warn_below_minimum_price}
            onChange={v => setSettings(p => ({ ...p, warn_below_minimum_price: v }))}
            label="تحذير عند البيع بأقل من الحد الأدنى للسعر"
            desc="يظهر تحذير إذا كان سعر البيع أقل من 90% من سعر الشراء"
          />
          <Toggle
            checked={settings.show_profit}
            onChange={v => setSettings(p => ({ ...p, show_profit: v }))}
            label="إظهار هامش الربح في الفاتورة"
            desc="يظهر هامش الربح لكل صنف أثناء إنشاء فاتورة البيع"
          />
        </CardContent>
      </Card>

      {/* Stock Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px] flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            إعدادات المخزون
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Toggle
            checked={settings.allow_negative_stock}
            onChange={v => setSettings(p => ({ ...p, allow_negative_stock: v }))}
            label="السماح بالمخزون السالب"
            desc="السماح بإنشاء فواتير بيع حتى لو كان الرصيد صفراً أو سالباً"
          />
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px] flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-600" />
            القيم الافتراضية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">المخزن الافتراضي</label>
              <Select value={settings.default_warehouse_id} onValueChange={v => setSettings(p => ({ ...p, default_warehouse_id: v }))}>
                <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {state.warehouses.filter(w => w.is_active).map(w => (
                    <SelectItem key={w.id} value={w.id} className="text-[12px]">{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">الخزنة الافتراضية</label>
              <Select value={settings.default_treasury_id} onValueChange={v => setSettings(p => ({ ...p, default_treasury_id: v }))}>
                <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {state.treasuries.filter(t => t.is_active).map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-[12px]">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">طريقة الدفع الافتراضية</label>
              <Select value={settings.default_payment_method} onValueChange={v => setSettings(p => ({ ...p, default_payment_method: v as InvoicePaymentMethod }))}>
                <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(paymentMethodConfig) as [InvoicePaymentMethod, typeof paymentMethodConfig[InvoicePaymentMethod]][]).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-[12px]">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Numbering Prefixes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px] flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            بادئات ترقيم الفواتير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'prefix_sales', label: 'فواتير البيع' },
              { key: 'prefix_purchase', label: 'فواتير الشراء' },
              { key: 'prefix_sales_return', label: 'مرتجع بيع' },
              { key: 'prefix_purchase_return', label: 'مرتجع شراء' },
              { key: 'prefix_inventory', label: 'الجرد' },
              { key: 'prefix_damages', label: 'الهوالك' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-[12px] text-muted-foreground mb-1 block">{label}</label>
                <Input
                  value={(settings as any)[key]}
                  onChange={e => setSettings(p => ({ ...p, [key]: e.target.value.toUpperCase() }))}
                  className="text-[12px]"
                  placeholder="مثال: SI"
                  maxLength={5}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full text-[13px]">حفظ الإعدادات</Button>
    </div>
  );
}
