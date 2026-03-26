import React, { useState, useMemo } from 'react';
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
  Plus, Landmark, Building2, ArrowLeftRight, ArrowRight, Receipt, CreditCard,
  DollarSign, TrendingUp, ArrowUpCircle, ArrowDownCircle,
  FileText, CircleCheck, Clock, CircleX,
  Banknote, ArrowUp, ArrowDown, Minus, BarChart3,
  RefreshCcw, History, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { VoucherPaymentMethod, CheckStatus, CheckType, Check } from '../types/accounting';

const uid = () => Math.random().toString(36).substr(2, 9);

const checkStatusLabels: Record<CheckStatus, string> = {
  pending: 'معلق',
  under_collection: 'تحت التحصيل',
  collected: 'محصل',
  bounced: 'مرتجع',
  endorsed: 'مظهر',
  cancelled: 'ملغي',
};

const checkStatusColors: Record<CheckStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  under_collection: 'bg-blue-100 text-blue-700',
  collected: 'bg-emerald-100 text-emerald-700',
  bounced: 'bg-red-100 text-red-700',
  endorsed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const checkStatusIcons: Record<CheckStatus, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  under_collection: <ArrowUpCircle className="w-3 h-3" />,
  collected: <CircleCheck className="w-3 h-3" />,
  bounced: <CircleX className="w-3 h-3" />,
  endorsed: <ArrowRight className="w-3 h-3" />,
  cancelled: <Minus className="w-3 h-3" />,
};

// Valid status transitions
const statusTransitions: Record<CheckStatus, CheckStatus[]> = {
  pending: ['under_collection', 'collected', 'bounced', 'endorsed', 'cancelled'],
  under_collection: ['collected', 'bounced', 'endorsed', 'cancelled'],
  collected: [],
  bounced: ['under_collection', 'cancelled'],
  endorsed: ['collected', 'bounced', 'cancelled'],
  cancelled: [],
};

// ==================== Check Status Dialog ====================
interface CheckStatusDialogProps {
  check: Check | null;
  open: boolean;
  onClose: () => void;
}

function CheckStatusDialog({ check, open, onClose }: CheckStatusDialogProps) {
  const { dispatch } = useAccounting();
  const [newStatus, setNewStatus] = useState<CheckStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [activeSection, setActiveSection] = useState<'change' | 'history'>('change');

  const allowedStatuses = check ? statusTransitions[check.status] : [];

  const handleSave = () => {
    if (!check || !newStatus) return;
    const updatedCheck: Check = {
      ...check,
      status: newStatus as CheckStatus,
      status_history: [
        ...(check.status_history || []),
        {
          status: newStatus as CheckStatus,
          date: new Date().toISOString().split('T')[0],
          notes: notes || `تم تغيير الحالة إلى ${checkStatusLabels[newStatus as CheckStatus]}`,
        },
      ],
    };
    dispatch({ type: 'UPDATE_CHECK_STATUS', payload: { check: updatedCheck } });
    toast.success(`تم تغيير حالة الشيك إلى: ${checkStatusLabels[newStatus as CheckStatus]}`);
    setNewStatus('');
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setNewStatus('');
    setNotes('');
    setActiveSection('change');
    onClose();
  };

  if (!check) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-blue-600" />
            إدارة حالة الشيك #{check.check_number}
          </DialogTitle>
          <DialogDescription className="sr-only">تغيير حالة الشيك وعرض السجل</DialogDescription>
        </DialogHeader>

        {/* Check Info */}
        <div className="bg-accent/30 rounded-lg p-3 text-[13px] space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">النوع:</span>
            <Badge className={check.check_type === 'received' ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'bg-red-100 text-red-700 text-[10px]'}>
              {check.check_type === 'received' ? 'مستلم' : 'صادر'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المبلغ:</span>
            <span className="font-semibold">{check.amount.toLocaleString('ar-EG')} ج</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ الشيك:</span>
            <span>{check.check_date}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">الحالة الحالية:</span>
            <Badge className={`text-[10px] gap-1 ${checkStatusColors[check.status]}`}>
              {checkStatusIcons[check.status]} {checkStatusLabels[check.status]}
            </Badge>
          </div>
          {check.bank_name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">البنك:</span>
              <span>{check.bank_name}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-[13px] border-b-2 transition-colors flex items-center gap-1 ${activeSection === 'change' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveSection('change')}
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            تغيير الحالة
          </button>
          <button
            className={`px-4 py-2 text-[13px] border-b-2 transition-colors flex items-center gap-1 ${activeSection === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveSection('history')}
          >
            <History className="w-3.5 h-3.5" />
            سجل الحالات ({(check.status_history || []).length})
          </button>
        </div>

        {activeSection === 'change' && (
          <div className="space-y-4">
            {allowedStatuses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <CircleCheck className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-[13px]">لا يمكن تغيير الحالة من: <strong>{checkStatusLabels[check.status]}</strong></p>
                <p className="text-[12px] mt-1 text-muted-foreground">هذه الحالة نهائية ولا تقبل التغيير</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[13px] text-muted-foreground mb-2 block">اختر الحالة الجديدة *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {allowedStatuses.map(s => (
                      <button
                        key={s}
                        onClick={() => setNewStatus(s)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-[12px] transition-all ${newStatus === s ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-border hover:border-blue-300 hover:bg-accent/30'}`}
                      >
                        <Badge className={`text-[10px] gap-1 pointer-events-none ${checkStatusColors[s]}`}>
                          {checkStatusIcons[s]} {checkStatusLabels[s]}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[13px] text-muted-foreground mb-1 block">ملاحظات (اختياري)</label>
                  <Input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="سبب تغيير الحالة..."
                    className="text-[13px]"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeSection === 'history' && (
          <div className="space-y-2 max-h-72 overflow-y-auto px-1">
            {(check.status_history || []).length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-[13px]">
                <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                لا يوجد سجل حالات
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute right-4 top-2 bottom-2 w-0.5 bg-border/60"></div>
                {[...(check.status_history || [])].reverse().map((h, idx, arr) => (
                  <div key={idx} className="flex items-start gap-3 pr-10 pb-4 relative">
                    {/* Timeline dot */}
                    <div className={`absolute right-2.5 top-2 w-3 h-3 rounded-full border-2 z-10 ${idx === 0 ? 'bg-blue-500 border-blue-500' : 'bg-background border-gray-300'}`}></div>
                    <div className={`flex-1 rounded-lg p-3 border ${idx === 0 ? 'bg-blue-50/50 border-blue-100' : 'bg-accent/20 border-transparent'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge className={`text-[10px] gap-1 ${checkStatusColors[h.status]}`}>
                          {checkStatusIcons[h.status]} {checkStatusLabels[h.status]}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {h.date}
                        </span>
                      </div>
                      {h.notes && <p className="text-[12px] text-muted-foreground">{h.notes}</p>}
                      {idx === 0 && (
                        <span className="inline-block text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded mt-1">الحالة الحالية</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>إغلاق</Button>
          {activeSection === 'change' && allowedStatuses.length > 0 && (
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 gap-1.5"
              disabled={!newStatus}
            >
              <RefreshCw className="w-3.5 h-3.5" /> حفظ التغيير
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Main Page ====================
export function TreasuryModulePage() {
  const { state, dispatch, formatCurrency, nextReceiptNumber, nextPaymentNumber, nextExpenseNumber, getContactById } = useAccounting();
  const [mainTab, setMainTab] = useState('treasuries');

  // Stats
  const totalTreasuryBalance = state.treasuries.reduce((sum, t) => sum + t.current_balance, 0);
  const totalBankBalance = state.banks.reduce((sum, b) => sum + b.current_balance, 0);
  const totalLiquidity = totalTreasuryBalance + totalBankBalance;
  const totalReceipts = state.receipts.reduce((s, r) => s + r.amount, 0);
  const totalPayments = state.payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);
  const checks = state.checks || [];
  const pendingChecks = checks.filter(c => c.status === 'pending' || c.status === 'under_collection');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] text-foreground font-bold">الخزينة والبنوك</h1>
          <p className="text-[12px] text-muted-foreground">ادارة الخزن والبنوك والشيكات والتحويلات وسندات القبض والصرف والمصروفات والتدفق النقدي</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Landmark className="w-5 h-5 mx-auto mb-1 text-blue-600" />
          <div className="text-[18px] font-bold text-blue-600">{formatCurrency(totalTreasuryBalance)}</div>
          <div className="text-[11px] text-muted-foreground">رصيد الخزن</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Building2 className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
          <div className="text-[18px] font-bold text-indigo-600">{formatCurrency(totalBankBalance)}</div>
          <div className="text-[11px] text-muted-foreground">رصيد البنوك</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Banknote className="w-5 h-5 mx-auto mb-1 text-teal-600" />
          <div className="text-[18px] font-bold text-teal-600">{formatCurrency(totalLiquidity)}</div>
          <div className="text-[11px] text-muted-foreground">اجمالي السيولة</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <ArrowUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
          <div className="text-[18px] font-bold text-emerald-600">{formatCurrency(totalReceipts)}</div>
          <div className="text-[11px] text-muted-foreground">اجمالي القبض</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <ArrowDown className="w-5 h-5 mx-auto mb-1 text-red-600" />
          <div className="text-[18px] font-bold text-red-600">{formatCurrency(totalPayments + totalExpenses)}</div>
          <div className="text-[11px] text-muted-foreground">اجمالي الصرف</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <FileText className="w-5 h-5 mx-auto mb-1 text-amber-600" />
          <div className="text-[18px] font-bold text-amber-600">{pendingChecks.length}</div>
          <div className="text-[11px] text-muted-foreground">شيكات معلقة</div>
        </CardContent></Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="treasuries" className="gap-1.5 text-[12px]"><Landmark className="w-3.5 h-3.5" /> الخزن</TabsTrigger>
          <TabsTrigger value="banks" className="gap-1.5 text-[12px]"><Building2 className="w-3.5 h-3.5" /> البنوك</TabsTrigger>
          <TabsTrigger value="checks" className="gap-1.5 text-[12px]"><FileText className="w-3.5 h-3.5" /> الشيكات</TabsTrigger>
          <TabsTrigger value="transfers" className="gap-1.5 text-[12px]"><ArrowLeftRight className="w-3.5 h-3.5" /> التحويلات</TabsTrigger>
          <TabsTrigger value="receipts" className="gap-1.5 text-[12px]"><Receipt className="w-3.5 h-3.5" /> سندات القبض</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-[12px]"><CreditCard className="w-3.5 h-3.5" /> سندات الصرف</TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5 text-[12px]"><DollarSign className="w-3.5 h-3.5" /> المصروفات</TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-1.5 text-[12px]"><BarChart3 className="w-3.5 h-3.5" /> التدفق النقدي</TabsTrigger>
        </TabsList>

        <TabsContent value="treasuries" className="mt-3"><TreasuriesTab /></TabsContent>
        <TabsContent value="banks" className="mt-3"><BanksTab /></TabsContent>
        <TabsContent value="checks" className="mt-3"><ChecksTab /></TabsContent>
        <TabsContent value="transfers" className="mt-3"><TransfersTab /></TabsContent>
        <TabsContent value="receipts" className="mt-3"><ReceiptsTab /></TabsContent>
        <TabsContent value="payments" className="mt-3"><PaymentsTab /></TabsContent>
        <TabsContent value="expenses" className="mt-3"><ExpensesTab /></TabsContent>
        <TabsContent value="cashflow" className="mt-3"><CashFlowTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Treasuries Tab ====================
function TreasuriesTab() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTreasury, setSelectedTreasury] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', opening_balance: 0 });

  const handleSubmit = () => {
    const accountId = uid();
    const treasuryId = uid();
    const existingCodes = state.accounts.filter(a => a.parent_id === 'a2' && a.account_code.startsWith('110'));
    const nextCode = `110${existingCodes.length + 1}`;
    dispatch({
      type: 'ADD_TREASURY',
      payload: {
        treasury: { id: treasuryId, name: formData.name, account_id: accountId, current_balance: formData.opening_balance, opening_balance: formData.opening_balance, is_active: true, created_at: new Date().toISOString() },
        account: { id: accountId, account_code: nextCode, account_name: formData.name, account_type: 'assets', parent_id: 'a2', level: 3, is_parent: false, is_active: true, opening_balance: formData.opening_balance, balance_type: 'debit', created_at: new Date().toISOString() },
      },
    });
    toast.success('تم اضافة الخزنة بنجاح');
    setShowDialog(false);
    setFormData({ name: '', opening_balance: 0 });
  };

  const selectedTrans = selectedTreasury ? state.treasuryTransactions.filter(t => t.treasury_id === selectedTreasury) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">الخزن (الصناديق)</h2>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /> اضافة خزنة</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.treasuries.map(treasury => (
          <Card key={treasury.id} className={`cursor-pointer transition-shadow hover:shadow-md ${selectedTreasury === treasury.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedTreasury(selectedTreasury === treasury.id ? null : treasury.id)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Landmark className="w-4 h-4 text-blue-600" /></div>
                  <span className="text-[14px]">{treasury.name}</span>
                </div>
                <Badge className={treasury.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>{treasury.is_active ? 'نشط' : 'معطل'}</Badge>
              </div>
              <div className="text-center">
                <p className="text-[12px] text-muted-foreground">الرصيد الحالي</p>
                <p className="text-[22px] text-blue-700">{formatCurrency(treasury.current_balance)} ج</p>
              </div>
              <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
                <span>الافتتاحي: {formatCurrency(treasury.opening_balance)}</span>
                <span>{state.treasuryTransactions.filter(t => t.treasury_id === treasury.id).length} حركة</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTreasury && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[15px]">حركات: {state.treasuries.find(t => t.id === selectedTreasury)?.name}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>التاريخ</TableHead><TableHead>النوع</TableHead><TableHead>المبلغ</TableHead><TableHead>الرصيد بعد</TableHead><TableHead>البيان</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {selectedTrans.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا توجد حركات</TableCell></TableRow>
                ) : selectedTrans.map(trans => (
                  <TableRow key={trans.id}>
                    <TableCell className="text-[13px]">{trans.transaction_date}</TableCell>
                    <TableCell>{trans.transaction_type === 'deposit' ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1"><ArrowUpCircle className="w-3 h-3" />ايداع</Badge> : <Badge className="bg-red-100 text-red-700 text-[10px] gap-1"><ArrowDownCircle className="w-3 h-3" />سحب</Badge>}</TableCell>
                    <TableCell className={`text-[13px] ${trans.transaction_type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>{trans.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(trans.amount)}</TableCell>
                    <TableCell className="text-[13px]">{formatCurrency(trans.balance_after)}</TableCell>
                    <TableCell className="text-[13px]">{trans.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>اضافة خزنة جديدة</DialogTitle><DialogDescription className="sr-only">نموذج اضافة خزنة</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-[13px] text-muted-foreground mb-1 block">اسم الخزنة *</label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="مثال: صندوق الفرع" /></div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">الرصيد الافتتاحي</label><Input type="number" value={formData.opening_balance} onChange={e => setFormData({ ...formData, opening_balance: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>الغاء</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={!formData.name}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Banks Tab ====================
function BanksTab() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [formData, setFormData] = useState({ bank_name: '', account_number: '', branch: '', opening_balance: 0 });

  const handleSubmit = () => {
    const accountId = uid();
    const bankId = uid();
    const existingCodes = state.accounts.filter(a => a.parent_id === 'a2' && a.account_code.startsWith('110'));
    const nextCode = `110${existingCodes.length + 1}`;
    dispatch({
      type: 'ADD_BANK',
      payload: {
        bank: { id: bankId, bank_name: formData.bank_name, account_number: formData.account_number, branch: formData.branch, account_id: accountId, current_balance: formData.opening_balance, opening_balance: formData.opening_balance, is_active: true, created_at: new Date().toISOString() },
        account: { id: accountId, account_code: nextCode, account_name: formData.bank_name, account_type: 'assets', parent_id: 'a2', level: 3, is_parent: false, is_active: true, opening_balance: formData.opening_balance, balance_type: 'debit', created_at: new Date().toISOString() },
      },
    });
    toast.success('تم اضافة البنك بنجاح');
    setShowDialog(false);
    setFormData({ bank_name: '', account_number: '', branch: '', opening_balance: 0 });
  };

  const selectedTrans = selectedBank ? state.bankTransactions.filter(t => t.bank_id === selectedBank) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">البنوك</h2>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4" /> اضافة بنك</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.banks.map(bank => (
          <Card key={bank.id} className={`cursor-pointer transition-shadow hover:shadow-md ${selectedBank === bank.id ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={() => setSelectedBank(selectedBank === bank.id ? null : bank.id)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><Building2 className="w-4 h-4 text-indigo-600" /></div>
                  <div><span className="text-[14px] block">{bank.bank_name}</span><span className="text-[11px] text-muted-foreground">{bank.branch}</span></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[12px] text-muted-foreground">الرصيد الحالي</p>
                <p className="text-[22px] text-indigo-700">{formatCurrency(bank.current_balance)} ج</p>
              </div>
              <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
                <span>رقم الحساب: {bank.account_number}</span>
                <span>{state.bankTransactions.filter(t => t.bank_id === bank.id).length} حركة</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedBank && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[15px]">حركات: {state.banks.find(b => b.id === selectedBank)?.bank_name}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>التاريخ</TableHead><TableHead>النوع</TableHead><TableHead>المبلغ</TableHead><TableHead>الرصيد بعد</TableHead><TableHead>البيان</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {selectedTrans.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا توجد حركات</TableCell></TableRow>
                ) : selectedTrans.map(trans => (
                  <TableRow key={trans.id}>
                    <TableCell className="text-[13px]">{trans.transaction_date}</TableCell>
                    <TableCell>{trans.transaction_type === 'deposit' ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1"><ArrowUpCircle className="w-3 h-3" />ايداع</Badge> : <Badge className="bg-red-100 text-red-700 text-[10px] gap-1"><ArrowDownCircle className="w-3 h-3" />سحب</Badge>}</TableCell>
                    <TableCell className={`text-[13px] ${trans.transaction_type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>{trans.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(trans.amount)}</TableCell>
                    <TableCell className="text-[13px]">{formatCurrency(trans.balance_after)}</TableCell>
                    <TableCell className="text-[13px]">{trans.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>اضافة بنك جديد</DialogTitle><DialogDescription className="sr-only">نموذج اضافة بنك</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-[13px] text-muted-foreground mb-1 block">اسم البنك *</label><Input value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[13px] text-muted-foreground mb-1 block">رقم الحساب</label><Input value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} /></div>
              <div><label className="text-[13px] text-muted-foreground mb-1 block">الفرع</label><Input value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} /></div>
            </div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">الرصيد الافتتاحي</label><Input type="number" value={formData.opening_balance} onChange={e => setFormData({ ...formData, opening_balance: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>الغاء</Button>
            <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700" disabled={!formData.bank_name}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Checks Tab ====================
function ChecksTab() {
  const { state, dispatch, formatCurrency, getContactById } = useAccounting();
  const [filterType, setFilterType] = useState<'all' | 'received' | 'issued'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Derive checks from receipts and payments
  const derivedChecks = useMemo(() => {
    const fromReceipts: Check[] = state.receipts
      .filter(r => r.payment_method === 'check' && r.check_number)
      .map(r => ({
        id: `chk-r-${r.id}`,
        check_number: r.check_number || '',
        check_date: r.check_date || r.receipt_date,
        amount: r.amount,
        check_type: 'received' as CheckType,
        status: 'under_collection' as CheckStatus,
        bank_name: state.banks.find(b => b.id === r.bank_id)?.bank_name || '',
        drawer_name: getContactById(r.contact_id)?.name || '',
        beneficiary_name: 'الشركة',
        contact_id: r.contact_id,
        source_type: 'receipt' as const,
        source_id: r.id,
        treasury_id: r.treasury_id,
        bank_id: r.bank_id,
        notes: r.description,
        status_history: [{ status: 'under_collection' as CheckStatus, date: r.receipt_date, notes: 'تم الاستلام' }],
        created_at: r.created_at,
      }));

    const fromPayments: Check[] = state.payments
      .filter(p => p.payment_method === 'check' && p.check_number)
      .map(p => ({
        id: `chk-p-${p.id}`,
        check_number: p.check_number || '',
        check_date: p.check_date || p.payment_date,
        amount: p.amount,
        check_type: 'issued' as CheckType,
        status: 'pending' as CheckStatus,
        bank_name: state.banks.find(b => b.id === p.bank_id)?.bank_name || '',
        drawer_name: 'الشركة',
        beneficiary_name: getContactById(p.contact_id)?.name || '',
        contact_id: p.contact_id,
        source_type: 'payment' as const,
        source_id: p.id,
        treasury_id: p.treasury_id,
        bank_id: p.bank_id,
        notes: p.description,
        status_history: [{ status: 'pending' as CheckStatus, date: p.payment_date, notes: 'تم اصدار الشيك' }],
        created_at: p.created_at,
      }));

    const stateChecks = state.checks || [];
    const allDerived = [...fromReceipts, ...fromPayments];

    // Merge: use state checks for updated status, derive for those not in state
    const merged = allDerived.map(dc => {
      const sc = stateChecks.find(c => c.id === dc.id);
      return sc || dc;
    });

    return merged;
  }, [state.receipts, state.payments, state.checks, state.banks]);

  const filteredChecks = derivedChecks.filter(c => {
    const matchType = filterType === 'all' || c.check_type === filterType;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchSearch = !searchTerm || c.check_number.includes(searchTerm) || c.drawer_name.includes(searchTerm) || c.beneficiary_name.includes(searchTerm);
    return matchType && matchStatus && matchSearch;
  });

  const totalReceived = derivedChecks.filter(c => c.check_type === 'received').reduce((s, c) => s + c.amount, 0);
  const totalIssued = derivedChecks.filter(c => c.check_type === 'issued').reduce((s, c) => s + c.amount, 0);
  const pendingCount = derivedChecks.filter(c => c.status === 'pending' || c.status === 'under_collection').length;

  const handleChangeStatus = (check: Check) => {
    // Ensure check exists in state
    const inState = (state.checks || []).find(c => c.id === check.id);
    if (!inState) {
      // Add to state first
      dispatch({ type: 'UPDATE_CHECK_STATUS', payload: { check } });
    }
    setSelectedCheck(inState || check);
    setShowStatusDialog(true);
  };

  // Keep selectedCheck synced with state updates
  const selectedCheckSynced = useMemo(() => {
    if (!selectedCheck) return null;
    return (state.checks || []).find(c => c.id === selectedCheck.id) || selectedCheck;
  }, [selectedCheck, state.checks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-[16px] font-semibold">ادارة الشيكات</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <div className="text-[18px] font-bold text-emerald-600">{derivedChecks.filter(c => c.check_type === 'received').length}</div>
          <div className="text-[11px] text-muted-foreground">شيكات مستلمة</div>
          <div className="text-[12px] text-emerald-600">{formatCurrency(totalReceived)} ج</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[18px] font-bold text-red-600">{derivedChecks.filter(c => c.check_type === 'issued').length}</div>
          <div className="text-[11px] text-muted-foreground">شيكات صادرة</div>
          <div className="text-[12px] text-red-600">{formatCurrency(totalIssued)} ج</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[18px] font-bold text-amber-600">{pendingCount}</div>
          <div className="text-[11px] text-muted-foreground">معلقة / تحت التحصيل</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[18px] font-bold text-purple-600">{derivedChecks.filter(c => c.status === 'collected').length}</div>
          <div className="text-[11px] text-muted-foreground">محصلة</div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="بحث برقم الشيك او الاسم..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-[13px]" />
          </div>
          <Select value={filterType} onValueChange={v => setFilterType(v as any)}>
            <SelectTrigger className="w-[140px] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="received">مستلمة</SelectItem>
              <SelectItem value="issued">صادرة</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v)}>
            <SelectTrigger className="w-[160px] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(checkStatusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Checks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>رقم الشيك</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الساحب</TableHead>
              <TableHead>المستفيد</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>البنك</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>إجراء</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredChecks.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">لا توجد شيكات {filterType !== 'all' || filterStatus !== 'all' ? 'بهذه المعايير' : ''}</TableCell></TableRow>
              ) : filteredChecks.map(check => (
                <TableRow key={check.id} className="hover:bg-accent/20">
                  <TableCell className="text-[13px] font-mono">{check.check_number}</TableCell>
                  <TableCell className="text-[13px]">{check.check_date}</TableCell>
                  <TableCell><Badge className={check.check_type === 'received' ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'bg-red-100 text-red-700 text-[10px]'}>{check.check_type === 'received' ? 'مستلم' : 'صادر'}</Badge></TableCell>
                  <TableCell className="text-[13px]">{check.drawer_name}</TableCell>
                  <TableCell className="text-[13px]">{check.beneficiary_name}</TableCell>
                  <TableCell className="text-[13px] font-semibold">{formatCurrency(check.amount)} ج</TableCell>
                  <TableCell className="text-[13px]">{check.bank_name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] gap-1 ${checkStatusColors[check.status]}`}>
                      {checkStatusIcons[check.status]} {checkStatusLabels[check.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 gap-1 px-2"
                      onClick={() => handleChangeStatus(check)}
                    >
                      {statusTransitions[check.status].length === 0 ? (
                        <><History className="w-3 h-3" /> سجل</>
                      ) : (
                        <><RefreshCw className="w-3 h-3" /> تغيير</>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CheckStatusDialog
        check={selectedCheckSynced}
        open={showStatusDialog}
        onClose={() => { setShowStatusDialog(false); setSelectedCheck(null); }}
      />
    </div>
  );
}

// ==================== Transfers Tab ====================
function TransfersTab() {
  const { state, dispatch, formatCurrency } = useAccounting();
  const [formData, setFormData] = useState({ from_id: '', to_id: '', amount: 0, description: '' });
  const [success, setSuccess] = useState(false);

  const allSources = [
    ...state.treasuries.map(t => ({ id: t.id, name: t.name, type: 'treasury' as const, balance: t.current_balance })),
    ...state.banks.map(b => ({ id: b.id, name: b.bank_name, type: 'bank' as const, balance: b.current_balance })),
  ];

  const handleSubmit = () => {
    if (!formData.from_id || !formData.to_id || formData.amount <= 0) return;
    const fromSource = allSources.find(s => s.id === formData.from_id);
    const toSource = allSources.find(s => s.id === formData.to_id);
    dispatch({
      type: 'CREATE_TRANSFER',
      payload: {
        from_type: fromSource?.type || 'treasury', from_id: formData.from_id,
        to_type: toSource?.type || 'bank', to_id: formData.to_id,
        amount: formData.amount, date: new Date().toISOString().split('T')[0],
        description: formData.description || `تحويل من ${fromSource?.name} الى ${toSource?.name}`,
      },
    });
    toast.success('تم التحويل بنجاح وتسجيل القيد المحاسبي');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setFormData({ from_id: '', to_id: '', amount: 0, description: '' });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[16px] font-semibold">التحويلات بين الخزن والبنوك</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allSources.map(source => (
          <Card key={source.id}><CardContent className="p-4 text-center">
            <p className="text-[12px] text-muted-foreground">{source.name}</p>
            <p className="text-[16px] text-blue-700">{formatCurrency(source.balance)} ج</p>
            <p className="text-[10px] text-muted-foreground">{source.type === 'treasury' ? 'خزنة' : 'بنك'}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader><CardTitle className="text-[15px] flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-cyan-600" /> انشاء تحويل جديد</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {success && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-[13px] text-center">تم التحويل بنجاح وتسجيل القيد المحاسبي تلقائيا</div>}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[13px] text-muted-foreground mb-1 block">من</label>
              <Select value={formData.from_id} onValueChange={v => setFormData({ ...formData, from_id: v })}>
                <SelectTrigger><SelectValue placeholder="المصدر" /></SelectTrigger>
                <SelectContent>{allSources.map(s => (<SelectItem key={s.id} value={s.id}>{s.name} ({formatCurrency(s.balance)})</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground mt-6 shrink-0" />
            <div className="flex-1">
              <label className="text-[13px] text-muted-foreground mb-1 block">الى</label>
              <Select value={formData.to_id} onValueChange={v => setFormData({ ...formData, to_id: v })}>
                <SelectTrigger><SelectValue placeholder="الوجهة" /></SelectTrigger>
                <SelectContent>{allSources.filter(s => s.id !== formData.from_id).map(s => (<SelectItem key={s.id} value={s.id}>{s.name} ({formatCurrency(s.balance)})</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div><label className="text-[13px] text-muted-foreground mb-1 block">المبلغ</label><Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} placeholder="0" /></div>
          <div><label className="text-[13px] text-muted-foreground mb-1 block">البيان (اختياري)</label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="وصف التحويل..." /></div>
          <Button onClick={handleSubmit} className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={!formData.from_id || !formData.to_id || formData.amount <= 0 || formData.from_id === formData.to_id}>
            <ArrowLeftRight className="w-4 h-4 ml-2" /> تنفيذ التحويل
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Receipts Tab ====================
function ReceiptsTab() {
  const { state, dispatch, formatCurrency, nextReceiptNumber, getContactById } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    contact_id: '', amount: 0, payment_method: 'cash' as VoucherPaymentMethod,
    treasury_id: 't1', bank_id: '', check_number: '', check_date: '', related_invoice_id: '', description: '',
  });

  const customers = state.contacts.filter(c => c.contact_type === 'customer' || c.contact_type === 'both');

  const handleSubmit = () => {
    const receipt = {
      id: uid(), receipt_number: nextReceiptNumber(), receipt_date: new Date().toISOString().split('T')[0],
      contact_id: formData.contact_id, amount: formData.amount, payment_method: formData.payment_method,
      treasury_id: formData.payment_method === 'cash' ? formData.treasury_id : '',
      bank_id: formData.payment_method !== 'cash' ? formData.bank_id : '',
      check_number: formData.check_number, check_date: formData.check_date,
      related_invoice_id: formData.related_invoice_id,
      description: formData.description || `تحصيل من ${getContactById(formData.contact_id)?.name || ''}`,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'CREATE_RECEIPT', payload: receipt });
    toast.success('تم انشاء سند القبض بنجاح');
    setShowDialog(false);
    setFormData({ contact_id: '', amount: 0, payment_method: 'cash', treasury_id: 't1', bank_id: '', check_number: '', check_date: '', related_invoice_id: '', description: '' });
  };

  const totalReceipts = state.receipts.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">سندات القبض</h2>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4" /> سند قبض جديد</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-[12px] text-muted-foreground">عدد السندات</p><p className="text-[20px]">{state.receipts.length}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-[12px] text-muted-foreground">اجمالي التحصيلات</p><p className="text-[20px] text-emerald-600">{formatCurrency(totalReceipts)} ج</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>رقم السند</TableHead><TableHead>التاريخ</TableHead><TableHead>العميل</TableHead><TableHead>طريقة الدفع</TableHead><TableHead>المبلغ</TableHead><TableHead>البيان</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {state.receipts.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد سندات قبض</TableCell></TableRow>
            ) : [...state.receipts].reverse().map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-[13px]">{r.receipt_number}</TableCell>
                <TableCell className="text-[13px]">{r.receipt_date}</TableCell>
                <TableCell className="text-[13px]">{getContactById(r.contact_id)?.name || '-'}</TableCell>
                <TableCell><Badge className="text-[10px] bg-blue-100 text-blue-700">{{ cash: 'نقدي', check: 'شيك', bank_transfer: 'تحويل بنكي' }[r.payment_method]}</Badge></TableCell>
                <TableCell className="text-[13px] text-emerald-600">{formatCurrency(r.amount)} ج</TableCell>
                <TableCell className="text-[13px]">{r.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>سند قبض جديد - {nextReceiptNumber()}</DialogTitle><DialogDescription className="sr-only">نموذج سند قبض</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-[13px] text-muted-foreground mb-1 block">العميل *</label>
              <Select value={formData.contact_id} onValueChange={v => setFormData({ ...formData, contact_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                <SelectContent>{customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">المبلغ *</label><Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} /></div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">طريقة الدفع</label>
              <Select value={formData.payment_method} onValueChange={v => setFormData({ ...formData, payment_method: v as VoucherPaymentMethod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem><SelectItem value="check">شيك</SelectItem><SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.payment_method === 'cash' && (
              <div><label className="text-[13px] text-muted-foreground mb-1 block">الخزنة</label>
                <Select value={formData.treasury_id} onValueChange={v => setFormData({ ...formData, treasury_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{state.treasuries.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            {formData.payment_method !== 'cash' && (
              <div><label className="text-[13px] text-muted-foreground mb-1 block">البنك</label>
                <Select value={formData.bank_id} onValueChange={v => setFormData({ ...formData, bank_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر البنك" /></SelectTrigger>
                  <SelectContent>{state.banks.map(b => (<SelectItem key={b.id} value={b.id}>{b.bank_name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            {formData.payment_method === 'check' && (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[13px] text-muted-foreground mb-1 block">رقم الشيك</label><Input value={formData.check_number} onChange={e => setFormData({ ...formData, check_number: e.target.value })} /></div>
                <div><label className="text-[13px] text-muted-foreground mb-1 block">تاريخ الشيك</label><Input type="date" value={formData.check_date} onChange={e => setFormData({ ...formData, check_date: e.target.value })} /></div>
              </div>
            )}
            <div><label className="text-[13px] text-muted-foreground mb-1 block">البيان</label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="وصف السند..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>الغاء</Button>
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700" disabled={!formData.contact_id || formData.amount <= 0}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Payments Tab ====================
function PaymentsTab() {
  const { state, dispatch, formatCurrency, nextPaymentNumber, getContactById } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    contact_id: '', amount: 0, payment_method: 'cash' as VoucherPaymentMethod,
    treasury_id: 't1', bank_id: '', check_number: '', check_date: '', related_invoice_id: '', description: '',
  });

  const suppliers = state.contacts.filter(c => c.contact_type === 'supplier' || c.contact_type === 'both');

  const handleSubmit = () => {
    const payment = {
      id: uid(), payment_number: nextPaymentNumber(), payment_date: new Date().toISOString().split('T')[0],
      contact_id: formData.contact_id, amount: formData.amount, payment_method: formData.payment_method,
      treasury_id: formData.payment_method === 'cash' ? formData.treasury_id : '',
      bank_id: formData.payment_method !== 'cash' ? formData.bank_id : '',
      check_number: formData.check_number, check_date: formData.check_date,
      related_invoice_id: formData.related_invoice_id,
      description: formData.description || `سداد الى ${getContactById(formData.contact_id)?.name || ''}`,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'CREATE_PAYMENT', payload: payment });
    toast.success('تم انشاء سند الصرف بنجاح');
    setShowDialog(false);
    setFormData({ contact_id: '', amount: 0, payment_method: 'cash', treasury_id: 't1', bank_id: '', check_number: '', check_date: '', related_invoice_id: '', description: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">سندات الصرف</h2>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4" /> سند صرف جديد</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-[12px] text-muted-foreground">عدد السندات</p><p className="text-[20px]">{state.payments.length}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-[12px] text-muted-foreground">اجمالي المدفوعات</p><p className="text-[20px] text-red-600">{formatCurrency(state.payments.reduce((s, p) => s + p.amount, 0))} ج</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>رقم السند</TableHead><TableHead>التاريخ</TableHead><TableHead>المورد</TableHead><TableHead>طريقة الدفع</TableHead><TableHead>المبلغ</TableHead><TableHead>البيان</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {state.payments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد سندات صرف</TableCell></TableRow>
            ) : [...state.payments].reverse().map(p => (
              <TableRow key={p.id}>
                <TableCell className="text-[13px]">{p.payment_number}</TableCell>
                <TableCell className="text-[13px]">{p.payment_date}</TableCell>
                <TableCell className="text-[13px]">{getContactById(p.contact_id)?.name || '-'}</TableCell>
                <TableCell><Badge className="text-[10px] bg-red-100 text-red-700">{{ cash: 'نقدي', check: 'شيك', bank_transfer: 'تحويل بنكي' }[p.payment_method]}</Badge></TableCell>
                <TableCell className="text-[13px] text-red-600">{formatCurrency(p.amount)} ج</TableCell>
                <TableCell className="text-[13px]">{p.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>سند صرف جديد - {nextPaymentNumber()}</DialogTitle><DialogDescription className="sr-only">نموذج سند صرف</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-[13px] text-muted-foreground mb-1 block">المورد *</label>
              <Select value={formData.contact_id} onValueChange={v => setFormData({ ...formData, contact_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر المورد" /></SelectTrigger>
                <SelectContent>{suppliers.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">المبلغ *</label><Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} /></div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">طريقة الدفع</label>
              <Select value={formData.payment_method} onValueChange={v => setFormData({ ...formData, payment_method: v as VoucherPaymentMethod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem><SelectItem value="check">شيك</SelectItem><SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.payment_method === 'cash' && (
              <div><label className="text-[13px] text-muted-foreground mb-1 block">الخزنة</label>
                <Select value={formData.treasury_id} onValueChange={v => setFormData({ ...formData, treasury_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{state.treasuries.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            {formData.payment_method !== 'cash' && (
              <div><label className="text-[13px] text-muted-foreground mb-1 block">البنك</label>
                <Select value={formData.bank_id} onValueChange={v => setFormData({ ...formData, bank_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر البنك" /></SelectTrigger>
                  <SelectContent>{state.banks.map(b => (<SelectItem key={b.id} value={b.id}>{b.bank_name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            {formData.payment_method === 'check' && (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[13px] text-muted-foreground mb-1 block">رقم الشيك</label><Input value={formData.check_number} onChange={e => setFormData({ ...formData, check_number: e.target.value })} /></div>
                <div><label className="text-[13px] text-muted-foreground mb-1 block">تاريخ الشيك</label><Input type="date" value={formData.check_date} onChange={e => setFormData({ ...formData, check_date: e.target.value })} /></div>
              </div>
            )}
            <div><label className="text-[13px] text-muted-foreground mb-1 block">البيان</label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>الغاء</Button>
            <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700" disabled={!formData.contact_id || formData.amount <= 0}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Expenses Tab ====================
function ExpensesTab() {
  const { state, dispatch, formatCurrency, nextExpenseNumber } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    expense_category_id: '', amount: 0, payment_method: 'cash' as 'cash' | 'bank',
    treasury_id: 't1', bank_id: '', description: '',
  });

  const handleSubmit = () => {
    const category = state.expenseCategories.find(c => c.id === formData.expense_category_id);
    const expense = {
      id: uid(), expense_number: nextExpenseNumber(), expense_date: new Date().toISOString().split('T')[0],
      expense_category_id: formData.expense_category_id, account_id: category?.account_id || '',
      amount: formData.amount, payment_method: formData.payment_method,
      treasury_id: formData.payment_method === 'cash' ? formData.treasury_id : '',
      bank_id: formData.payment_method === 'bank' ? formData.bank_id : '',
      description: formData.description || category?.name || '',
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'CREATE_EXPENSE', payload: expense });
    toast.success('تم تسجيل المصروف بنجاح');
    setShowDialog(false);
    setFormData({ expense_category_id: '', amount: 0, payment_method: 'cash', treasury_id: 't1', bank_id: '', description: '' });
  };

  const getCategoryName = (id: string) => state.expenseCategories.find(c => c.id === id)?.name || '-';
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);

  const expenseByCategory = state.expenseCategories.map(cat => ({
    name: cat.name,
    total: state.expenses.filter(e => e.expense_category_id === cat.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">المصروفات</h2>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4" /> تسجيل مصروف</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-[12px] text-muted-foreground">عدد المصروفات</p><p className="text-[20px]">{state.expenses.length}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-[12px] text-muted-foreground">اجمالي المصروفات</p><p className="text-[20px] text-red-600">{formatCurrency(totalExpenses)} ج</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-[12px] text-muted-foreground">التصنيفات النشطة</p><p className="text-[20px]">{expenseByCategory.length}</p></CardContent></Card>
      </div>

      {expenseByCategory.length > 0 && (
        <Card><CardContent className="p-4">
          <h3 className="text-[14px] mb-3">توزيع المصروفات حسب التصنيف</h3>
          <div className="space-y-2">
            {expenseByCategory.map(cat => (
              <div key={cat.name} className="flex items-center justify-between p-2 bg-accent/30 rounded-lg">
                <span className="text-[13px]">{cat.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, (cat.total / totalExpenses) * 100)}%` }} /></div>
                  <span className="text-[13px] text-purple-700 min-w-[80px] text-left">{formatCurrency(cat.total)} ج</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>الرقم</TableHead><TableHead>التاريخ</TableHead><TableHead>التصنيف</TableHead><TableHead>المبلغ</TableHead><TableHead>طريقة الدفع</TableHead><TableHead>البيان</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {state.expenses.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد مصروفات</TableCell></TableRow>
            ) : [...state.expenses].reverse().map(exp => (
              <TableRow key={exp.id}>
                <TableCell className="text-[13px]">{exp.expense_number}</TableCell>
                <TableCell className="text-[13px]">{exp.expense_date}</TableCell>
                <TableCell className="text-[13px]">{getCategoryName(exp.expense_category_id)}</TableCell>
                <TableCell className="text-[13px] text-red-600">{formatCurrency(exp.amount)} ج</TableCell>
                <TableCell><Badge className="text-[10px] bg-gray-100 text-gray-700">{exp.payment_method === 'cash' ? 'نقدي' : 'بنك'}</Badge></TableCell>
                <TableCell className="text-[13px]">{exp.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>تسجيل مصروف - {nextExpenseNumber()}</DialogTitle><DialogDescription className="sr-only">نموذج مصروف</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-[13px] text-muted-foreground mb-1 block">تصنيف المصروف *</label>
              <Select value={formData.expense_category_id} onValueChange={v => setFormData({ ...formData, expense_category_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                <SelectContent>{state.expenseCategories.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">المبلغ *</label><Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} /></div>
            <div><label className="text-[13px] text-muted-foreground mb-1 block">طريقة الدفع</label>
              <Select value={formData.payment_method} onValueChange={v => setFormData({ ...formData, payment_method: v as 'cash' | 'bank' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="cash">نقدي (خزنة)</SelectItem><SelectItem value="bank">بنك</SelectItem></SelectContent>
              </Select>
            </div>
            {formData.payment_method === 'cash' ? (
              <div><label className="text-[13px] text-muted-foreground mb-1 block">الخزنة</label>
                <Select value={formData.treasury_id} onValueChange={v => setFormData({ ...formData, treasury_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{state.treasuries.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            ) : (
              <div><label className="text-[13px] text-muted-foreground mb-1 block">البنك</label>
                <Select value={formData.bank_id} onValueChange={v => setFormData({ ...formData, bank_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر البنك" /></SelectTrigger>
                  <SelectContent>{state.banks.map(b => (<SelectItem key={b.id} value={b.id}>{b.bank_name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            <div><label className="text-[13px] text-muted-foreground mb-1 block">البيان</label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="وصف المصروف..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>الغاء</Button>
            <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700" disabled={!formData.expense_category_id || formData.amount <= 0}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Cash Flow Tab ====================
const arabicMonths = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const arabicQuarters = ['الأول (يناير-مارس)', 'الثاني (أبريل-يونيو)', 'الثالث (يوليو-سبتمبر)', 'الرابع (أكتوبر-ديسمبر)'];

function CashFlowTab() {
  const { state, formatCurrency } = useAccounting();
  const [periodType, setPeriodType] = useState<'all' | 'monthly' | 'quarterly' | 'yearly'>('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  // Calculate date range
  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (periodType === 'all') return { startDate: '', endDate: '', periodLabel: 'منذ البداية' };
    if (periodType === 'monthly') {
      const s = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const e = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;
      return { startDate: s, endDate: e, periodLabel: `${arabicMonths[selectedMonth - 1]} ${selectedYear}` };
    }
    if (periodType === 'quarterly') {
      const qStart = (selectedQuarter - 1) * 3 + 1;
      const qEnd = qStart + 2;
      const s = `${selectedYear}-${String(qStart).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, qEnd, 0).getDate();
      const e = `${selectedYear}-${String(qEnd).padStart(2, '0')}-${lastDay}`;
      return { startDate: s, endDate: e, periodLabel: `الربع ${arabicQuarters[selectedQuarter - 1]} ${selectedYear}` };
    }
    // yearly
    return { startDate: `${selectedYear}-01-01`, endDate: `${selectedYear}-12-31`, periodLabel: `عام ${selectedYear}` };
  }, [periodType, selectedYear, selectedMonth, selectedQuarter]);

  const inRange = (dateStr: string) => {
    if (!startDate) return true;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Calculate cash flow data
  const cashFlowData = useMemo(() => {
    const openingTreasury = state.treasuries.reduce((s, t) => s + t.opening_balance, 0);
    const openingBank = state.banks.reduce((s, b) => s + b.opening_balance, 0);
    const openingCash = openingTreasury + openingBank;
    const currentTreasury = state.treasuries.reduce((s, t) => s + t.current_balance, 0);
    const currentBank = state.banks.reduce((s, b) => s + b.current_balance, 0);
    const currentCash = currentTreasury + currentBank;

    const salesCashReceived = state.salesInvoices
      .filter(i => (i.payment_type === 'cash' || i.payment_type === 'partial') && inRange(i.invoice_date))
      .reduce((s, i) => s + i.paid_amount, 0);
    const receiptsFromCustomers = state.receipts
      .filter(r => inRange(r.receipt_date))
      .reduce((s, r) => s + r.amount, 0);
    const purchasesCashPaid = state.purchaseInvoices
      .filter(i => (i.payment_type === 'cash' || i.payment_type === 'partial') && inRange(i.invoice_date))
      .reduce((s, i) => s + i.paid_amount, 0);
    const paymentsToSuppliers = state.payments
      .filter(p => inRange(p.payment_date))
      .reduce((s, p) => s + p.amount, 0);
    const expensesPaid = state.expenses
      .filter(e => inRange(e.expense_date))
      .reduce((s, e) => s + e.amount, 0);

    const operatingInflows = salesCashReceived + receiptsFromCustomers;
    const operatingOutflows = purchasesCashPaid + paymentsToSuppliers + expensesPaid;
    const netOperating = operatingInflows - operatingOutflows;
    const netChange = currentCash - openingCash;

    // Monthly breakdown for yearly view
    const monthlyBreakdown = periodType === 'yearly' ? arabicMonths.map((name, i) => {
      const ms = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
      const inf = state.receipts.filter(r => r.receipt_date.startsWith(ms)).reduce((s, r) => s + r.amount, 0)
        + state.salesInvoices.filter(inv => inv.invoice_date.startsWith(ms) && (inv.payment_type === 'cash' || inv.payment_type === 'partial')).reduce((s, inv) => s + inv.paid_amount, 0);
      const out = state.payments.filter(p => p.payment_date.startsWith(ms)).reduce((s, p) => s + p.amount, 0)
        + state.expenses.filter(e => e.expense_date.startsWith(ms)).reduce((s, e) => s + e.amount, 0)
        + state.purchaseInvoices.filter(inv => inv.invoice_date.startsWith(ms) && (inv.payment_type === 'cash' || inv.payment_type === 'partial')).reduce((s, inv) => s + inv.paid_amount, 0);
      return { month: name, inflows: inf, outflows: out };
    }) : [];

    return {
      openingCash, currentCash, currentTreasury, currentBank, netChange,
      operating: {
        inflows: [
          { label: 'مبيعات نقدية', amount: salesCashReceived },
          { label: 'تحصيلات من العملاء', amount: receiptsFromCustomers },
        ],
        outflows: [
          { label: 'مشتريات نقدية', amount: purchasesCashPaid },
          { label: 'مدفوعات للموردين', amount: paymentsToSuppliers },
          { label: 'مصروفات تشغيلية', amount: expensesPaid },
        ],
        totalInflows: operatingInflows,
        totalOutflows: operatingOutflows,
        net: netOperating,
      },
      monthlyBreakdown,
    };
  }, [state, startDate, endDate, periodType, selectedYear]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-[16px] font-semibold">قائمة التدفق النقدي</h2>
        <Badge className="bg-blue-100 text-blue-700 text-[12px] px-3 py-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {periodLabel}
        </Badge>
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] text-muted-foreground shrink-0">تصفية حسب:</span>
            {/* Period Type Buttons */}
            <div className="flex rounded-lg border overflow-hidden">
              {[
                { value: 'all', label: 'الكل' },
                { value: 'monthly', label: 'شهري' },
                { value: 'quarterly', label: 'ربع سنوي' },
                { value: 'yearly', label: 'سنوي' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriodType(opt.value as any)}
                  className={`px-3 py-1.5 text-[12px] transition-colors ${periodType === opt.value ? 'bg-blue-600 text-white' : 'hover:bg-accent/50 text-muted-foreground'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Year selector */}
            {periodType !== 'all' && (
              <div className="flex items-center gap-1">
                <button onClick={() => setSelectedYear(y => y - 1)} className="p-1 rounded hover:bg-accent border">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-[90px] text-[13px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <button onClick={() => setSelectedYear(y => y + 1)} className="p-1 rounded hover:bg-accent border">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Month selector */}
            {periodType === 'monthly' && (
              <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-[130px] text-[13px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {arabicMonths.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {/* Quarter selector */}
            {periodType === 'quarterly' && (
              <Select value={String(selectedQuarter)} onValueChange={v => setSelectedQuarter(Number(v))}>
                <SelectTrigger className="w-[240px] text-[13px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {arabicQuarters.map((q, i) => <SelectItem key={i + 1} value={String(i + 1)}>الربع {q}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/30"><CardContent className="p-4 text-center">
          <p className="text-[12px] text-muted-foreground mb-1">الرصيد الافتتاحي</p>
          <p className="text-[22px] font-bold text-blue-700">{formatCurrency(cashFlowData.openingCash)} ج</p>
        </CardContent></Card>
        <Card className={cashFlowData.operating.net >= 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}><CardContent className="p-4 text-center">
          <p className="text-[12px] text-muted-foreground mb-1">صافي التدفق النقدي</p>
          <p className={`text-[22px] font-bold ${cashFlowData.operating.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {cashFlowData.operating.net >= 0 ? '+' : ''}{formatCurrency(cashFlowData.operating.net)} ج
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">{periodLabel}</p>
        </CardContent></Card>
        <Card className="border-teal-200 bg-teal-50/30"><CardContent className="p-4 text-center">
          <p className="text-[12px] text-muted-foreground mb-1">الرصيد الحالي</p>
          <p className="text-[22px] font-bold text-teal-700">{formatCurrency(cashFlowData.currentCash)} ج</p>
        </CardContent></Card>
      </div>

      {/* Operating Activities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /></div>
            الانشطة التشغيلية
            {periodType !== 'all' && <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-[11px]">{periodLabel}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Inflows */}
            <div>
              <h4 className="text-[13px] font-semibold text-emerald-700 mb-2 flex items-center gap-1"><ArrowUp className="w-3.5 h-3.5" /> التدفقات الداخلة</h4>
              <div className="space-y-1.5 mr-4">
                {cashFlowData.operating.inflows.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-emerald-600 font-medium">+{formatCurrency(item.amount)} ج</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-[13px] pt-1 border-t border-dashed">
                  <span className="font-semibold">اجمالي التدفقات الداخلة</span>
                  <span className="text-emerald-700 font-bold">{formatCurrency(cashFlowData.operating.totalInflows)} ج</span>
                </div>
              </div>
            </div>

            {/* Outflows */}
            <div>
              <h4 className="text-[13px] font-semibold text-red-700 mb-2 flex items-center gap-1"><ArrowDown className="w-3.5 h-3.5" /> التدفقات الخارجة</h4>
              <div className="space-y-1.5 mr-4">
                {cashFlowData.operating.outflows.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-red-600 font-medium">-{formatCurrency(item.amount)} ج</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-[13px] pt-1 border-t border-dashed">
                  <span className="font-semibold">اجمالي التدفقات الخارجة</span>
                  <span className="text-red-700 font-bold">{formatCurrency(cashFlowData.operating.totalOutflows)} ج</span>
                </div>
              </div>
            </div>

            {/* Net */}
            <div className="flex items-center justify-between text-[14px] pt-2 border-t-2 border-double">
              <span className="font-bold">صافي التدفقات التشغيلية</span>
              <span className={`font-bold ${cashFlowData.operating.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {cashFlowData.operating.net >= 0 ? '+' : ''}{formatCurrency(cashFlowData.operating.net)} ج
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly breakdown for yearly view */}
      {periodType === 'yearly' && cashFlowData.monthlyBreakdown.some(m => m.inflows > 0 || m.outflows > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center"><BarChart3 className="w-3.5 h-3.5 text-purple-600" /></div>
              التوزيع الشهري - عام {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cashFlowData.monthlyBreakdown.map((m, i) => {
                const maxVal = Math.max(...cashFlowData.monthlyBreakdown.map(x => Math.max(x.inflows, x.outflows)), 1);
                const net = m.inflows - m.outflows;
                const hasActivity = m.inflows > 0 || m.outflows > 0;
                return (
                  <div key={i} className={`p-2.5 rounded-lg border ${hasActivity ? (net >= 0 ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30') : 'border-border/40 opacity-50'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] font-medium">{m.month}</span>
                      <span className={`text-[12px] font-semibold ${net > 0 ? 'text-emerald-600' : net < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {net === 0 ? 'لا حركة' : `${net > 0 ? '+' : ''}${formatCurrency(net)} ج`}
                      </span>
                    </div>
                    {hasActivity && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-600 w-10 shrink-0">داخلة</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(m.inflows / maxVal) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-emerald-600 w-16 shrink-0 text-left">{formatCurrency(m.inflows)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-red-600 w-10 shrink-0">خارجة</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${(m.outflows / maxVal) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-red-600 w-16 shrink-0 text-left">{formatCurrency(m.outflows)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center"><Banknote className="w-3.5 h-3.5 text-blue-600" /></div>
            توزيع الارصدة النقدية الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="text-[13px] font-semibold text-blue-700 mb-2 flex items-center gap-1"><Landmark className="w-3.5 h-3.5" /> الخزن (الصناديق)</h4>
              <div className="space-y-1.5 mr-4">
                {state.treasuries.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{t.name}</span>
                    <span className="text-blue-600 font-medium">{formatCurrency(t.current_balance)} ج</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-[13px] pt-1 border-t border-dashed">
                  <span className="font-semibold">اجمالي الخزن</span>
                  <span className="text-blue-700 font-bold">{formatCurrency(cashFlowData.currentTreasury)} ج</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-indigo-700 mb-2 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> البنوك</h4>
              <div className="space-y-1.5 mr-4">
                {state.banks.map(b => (
                  <div key={b.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{b.bank_name} - {b.branch}</span>
                    <span className="text-indigo-600 font-medium">{formatCurrency(b.current_balance)} ج</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-[13px] pt-1 border-t border-dashed">
                  <span className="font-semibold">اجمالي البنوك</span>
                  <span className="text-indigo-700 font-bold">{formatCurrency(cashFlowData.currentBank)} ج</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[14px] pt-2 border-t-2 border-double">
              <span className="font-bold">اجمالي الارصدة النقدية</span>
              <span className="font-bold text-teal-700">{formatCurrency(cashFlowData.currentCash)} ج</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
