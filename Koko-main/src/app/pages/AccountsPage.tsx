import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../components/ui/table';
import {
  Plus, Search, Edit, ChevronDown, ChevronLeft, FolderOpen, FileText,
  BookOpen, BookOpenCheck, ClipboardList, Scale, TrendingUp, TrendingDown,
  FileSearch, CircleCheck, AlertCircle, User, Trash2, ToggleLeft, ToggleRight,
  Download, Printer, Filter
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { Account, AccountType, BalanceType, SourceType } from '../types/accounting';

const uid = () => Math.random().toString(36).substr(2, 9);

const accountTypeLabels: Record<AccountType, string> = {
  assets: 'أصول',
  liabilities: 'خصوم',
  equity: 'حقوق ملكية',
  revenue: 'إيرادات',
  expense: 'مصروفات',
};

const accountTypeColors: Record<AccountType, string> = {
  assets: 'bg-blue-100 text-blue-700',
  liabilities: 'bg-red-100 text-red-700',
  equity: 'bg-purple-100 text-purple-700',
  revenue: 'bg-emerald-100 text-emerald-700',
  expense: 'bg-orange-100 text-orange-700',
};

const sourceTypeLabels: Record<string, string> = {
  sales_invoice: 'فاتورة بيع',
  purchase_invoice: 'فاتورة شراء',
  receipt: 'سند قبض',
  payment: 'سند صرف',
  expense: 'مصروف',
  transfer: 'تحويل',
  opening_balance: 'رصيد افتتاحي',
  manual: 'يدوي',
  sales_return: 'مرتجع بيع',
  purchase_return: 'مرتجع شراء',
};

const sourceTypeColors: Record<string, string> = {
  sales_invoice: 'bg-emerald-100 text-emerald-700',
  purchase_invoice: 'bg-orange-100 text-orange-700',
  receipt: 'bg-blue-100 text-blue-700',
  payment: 'bg-red-100 text-red-700',
  expense: 'bg-purple-100 text-purple-700',
  transfer: 'bg-cyan-100 text-cyan-700',
};

export function AccountsPage() {
  const { state, dispatch, formatCurrency, getAccountBalance, getAccountLedger, getTrialBalance } = useAccounting();
  const [mainTab, setMainTab] = useState('chart');

  // ========== Stats ==========
  const totalAccounts = state.accounts.length;
  const parentAccounts = state.accounts.filter(a => a.is_parent).length;
  const leafAccounts = state.accounts.filter(a => !a.is_parent).length;
  const totalJournalEntries = state.journalEntries.length;
  const activeAccounts = state.accounts.filter(a => a.is_active).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] text-foreground font-bold">الحسابات</h1>
          <p className="text-[12px] text-muted-foreground">إدارة دليل الحسابات والأستاذ العام وقيود اليومية والتقارير المالية</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center">
          <div className="text-[20px] font-bold text-blue-600">{totalAccounts}</div>
          <div className="text-[11px] text-muted-foreground">إجمالي الحسابات</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[20px] font-bold text-amber-600">{parentAccounts}</div>
          <div className="text-[11px] text-muted-foreground">حسابات رئيسية</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[20px] font-bold text-emerald-600">{leafAccounts}</div>
          <div className="text-[11px] text-muted-foreground">حسابات فرعية</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[20px] font-bold text-purple-600">{totalJournalEntries}</div>
          <div className="text-[11px] text-muted-foreground">قيود يومية</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[20px] font-bold text-green-600">{activeAccounts}</div>
          <div className="text-[11px] text-muted-foreground">حسابات نشطة</div>
        </CardContent></Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="chart" className="gap-1.5 text-[12px]"><BookOpen className="w-3.5 h-3.5" /> دليل الحسابات</TabsTrigger>
          <TabsTrigger value="ledger" className="gap-1.5 text-[12px]"><ClipboardList className="w-3.5 h-3.5" /> الأستاذ العام</TabsTrigger>
          <TabsTrigger value="journal" className="gap-1.5 text-[12px]"><BookOpenCheck className="w-3.5 h-3.5" /> قيود اليومية</TabsTrigger>
          <TabsTrigger value="trial" className="gap-1.5 text-[12px]"><Scale className="w-3.5 h-3.5" /> ميزان المراجعة</TabsTrigger>
          <TabsTrigger value="income" className="gap-1.5 text-[12px]"><TrendingUp className="w-3.5 h-3.5" /> قائمة الدخل</TabsTrigger>
          <TabsTrigger value="statement" className="gap-1.5 text-[12px]"><FileSearch className="w-3.5 h-3.5" /> كشف حساب</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="mt-3">
          <ChartOfAccountsTab />
        </TabsContent>
        <TabsContent value="ledger" className="mt-3">
          <GeneralLedgerTab />
        </TabsContent>
        <TabsContent value="journal" className="mt-3">
          <JournalEntriesTab />
        </TabsContent>
        <TabsContent value="trial" className="mt-3">
          <TrialBalanceTab />
        </TabsContent>
        <TabsContent value="income" className="mt-3">
          <IncomeStatementTab />
        </TabsContent>
        <TabsContent value="statement" className="mt-3">
          <AccountStatementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Chart of Accounts Tab ====================
function ChartOfAccountsTab() {
  const { state, dispatch, formatCurrency, getAccountBalance } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(state.accounts.filter(a => a.is_parent).map(a => a.id))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: 'assets' as AccountType,
    parent_id: '',
    is_parent: false,
    opening_balance: 0,
    balance_type: 'debit' as BalanceType,
  });

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedNodes(new Set(state.accounts.filter(a => a.is_parent).map(a => a.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const rootAccounts = state.accounts.filter(a => a.parent_id === null);
  const getChildren = (parentId: string) => state.accounts.filter(a => a.parent_id === parentId);

  const filteredAccounts = searchTerm
    ? state.accounts.filter(a => {
        const matchSearch = a.account_name.includes(searchTerm) || a.account_code.includes(searchTerm);
        const matchType = filterType === 'all' || a.account_type === filterType;
        return matchSearch && matchType;
      })
    : [];

  const openAddAccount = (parentId?: string) => {
    setEditingAccount(null);
    const parent = parentId ? state.accounts.find(a => a.id === parentId) : null;
    setFormData({
      account_code: '',
      account_name: '',
      account_type: parent?.account_type || 'assets',
      parent_id: parentId || '',
      is_parent: false,
      opening_balance: 0,
      balance_type: parent?.balance_type || 'debit',
    });
    setShowDialog(true);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      parent_id: account.parent_id || '',
      is_parent: account.is_parent,
      opening_balance: account.opening_balance,
      balance_type: account.balance_type,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const parentAccount = state.accounts.find(a => a.id === formData.parent_id);

    if (editingAccount) {
      const updated: Account = {
        ...editingAccount,
        account_code: formData.account_code,
        account_name: formData.account_name,
        account_type: parentAccount?.account_type || formData.account_type,
        parent_id: formData.parent_id || null,
        level: parentAccount ? parentAccount.level + 1 : 1,
        is_parent: formData.is_parent,
        opening_balance: formData.opening_balance,
        balance_type: formData.balance_type,
      };
      dispatch({ type: 'UPDATE_ACCOUNT', payload: updated });
      toast.success('تم تعديل الحساب بنجاح');
    } else {
      const newAccount: Account = {
        id: uid(),
        account_code: formData.account_code,
        account_name: formData.account_name,
        account_type: parentAccount?.account_type || formData.account_type,
        parent_id: formData.parent_id || null,
        level: parentAccount ? parentAccount.level + 1 : 1,
        is_parent: formData.is_parent,
        is_active: true,
        opening_balance: formData.opening_balance,
        balance_type: formData.balance_type,
        created_at: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_ACCOUNT', payload: newAccount });
      toast.success('تم إضافة الحساب بنجاح');
    }
    setShowDialog(false);
    setEditingAccount(null);
  };

  const toggleAccountActive = (account: Account) => {
    const updated = { ...account, is_active: !account.is_active };
    dispatch({ type: 'UPDATE_ACCOUNT', payload: updated });
    toast.success(updated.is_active ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب');
  };

  // Check if account has transactions
  const hasMovements = (accountId: string) => {
    return state.journalEntryLines.some(l => l.account_id === accountId);
  };

  const handleExportAccounts = () => {
    const data = state.accounts.map(a => ({
      'كود الحساب': a.account_code,
      'اسم الحساب': a.account_name,
      'نوع الحساب': accountTypeLabels[a.account_type],
      'حساب رئيسي': a.is_parent ? 'نعم' : 'لا',
      'المستوى': a.level,
      'الرصيد الافتتاحي': a.opening_balance,
      'طبيعة الرصيد': a.balance_type === 'debit' ? 'مدين' : 'دائن',
      'الحالة': a.is_active ? 'نشط' : 'غير نشط',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'دليل الحسابات');
    XLSX.writeFile(wb, 'دليل_الحسابات.xlsx');
    toast.success('تم تصدير دليل الحسابات بنجاح');
  };

  const parentAccountsList = state.accounts.filter(a => a.is_parent);

  const renderTree = (account: Account, depth: number = 0): React.ReactNode => {
    const children = getChildren(account.id);
    const isExpanded = expandedNodes.has(account.id);
    const hasChildren = children.length > 0;
    const balance = getAccountBalance(account.id);
    const hasMov = hasMovements(account.id);

    return (
      <div key={account.id}>
        <div
          className={`group flex items-center gap-2 py-2 px-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors text-[13px] ${!account.is_active ? 'opacity-50' : ''}`}
          style={{ paddingRight: `${depth * 24 + 12}px` }}
        >
          <div className="flex items-center gap-2 flex-1" onClick={() => hasChildren && toggleNode(account.id)}>
            {hasChildren ? (
              <button className="w-5 h-5 flex items-center justify-center">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            {account.is_parent ? (
              <FolderOpen className="w-4 h-4 text-amber-500" />
            ) : (
              <FileText className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-muted-foreground ml-2">{account.account_code}</span>
            <span className="flex-1">{account.account_name}</span>
          </div>
          <Badge className={`text-[10px] ${accountTypeColors[account.account_type]}`}>
            {accountTypeLabels[account.account_type]}
          </Badge>
          {!account.is_parent && (balance.debit > 0 || balance.credit > 0 || account.opening_balance > 0) && (
            <span className="text-[12px] text-muted-foreground mr-2">
              {formatCurrency(balance.balance)} ج.م
            </span>
          )}
          {!account.is_active && (
            <Badge className="text-[9px] bg-red-100 text-red-700">موقوف</Badge>
          )}
          {/* Action buttons - show on hover */}
          <div className="hidden group-hover:flex items-center gap-1">
            {account.is_parent && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); openAddAccount(account.id); }}>
                <Plus className="w-3 h-3 text-emerald-600" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); openEditAccount(account); }}>
              <Edit className="w-3 h-3 text-blue-600" />
            </Button>
            {!account.is_parent && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); toggleAccountActive(account); }}>
                {account.is_active ? <ToggleRight className="w-3.5 h-3.5 text-green-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-500" />}
              </Button>
            )}
          </div>
        </div>
        {isExpanded && children.map(child => renderTree(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pr-9 h-8 text-[12px]"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-8 text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="assets">أصول</SelectItem>
              <SelectItem value="liabilities">خصوم</SelectItem>
              <SelectItem value="equity">حقوق ملكية</SelectItem>
              <SelectItem value="revenue">إيرادات</SelectItem>
              <SelectItem value="expense">مصروفات</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={expandAll}>توسيع الكل</Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={collapseAll}>طي الكل</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAccounts} className="gap-1.5 text-[12px] h-8">
            <Download className="w-3.5 h-3.5" />
            تصدير
          </Button>
          <Button onClick={() => openAddAccount()} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-[12px] h-8" size="sm">
            <Plus className="w-3.5 h-3.5" />
            إضافة حساب
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {searchTerm && filteredAccounts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px]">نتائج البحث ({filteredAccounts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {filteredAccounts.map(a => {
              const bal = getAccountBalance(a.id);
              return (
                <div key={a.id} className="group flex items-center gap-3 py-2 px-3 hover:bg-accent/50 rounded-lg text-[13px]">
                  {a.is_parent ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                  <span className="text-muted-foreground">{a.account_code}</span>
                  <span className="flex-1">{a.account_name}</span>
                  <Badge className={`text-[10px] ${accountTypeColors[a.account_type]}`}>{accountTypeLabels[a.account_type]}</Badge>
                  {!a.is_parent && bal.balance !== 0 && (
                    <span className="text-[12px] text-muted-foreground">{formatCurrency(bal.balance)} ج.م</span>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hidden group-hover:flex" onClick={() => openEditAccount(a)}>
                    <Edit className="w-3 h-3 text-blue-600" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {searchTerm && filteredAccounts.length === 0 && (
        <Card><CardContent className="p-6 text-center text-[13px] text-muted-foreground">لا توجد نتائج</CardContent></Card>
      )}

      {/* Tree View */}
      {!searchTerm && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[14px] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                شجرة الحسابات ({state.accounts.length} حساب)
              </CardTitle>
              <div className="flex gap-2">
                {Object.entries(accountTypeLabels).map(([key, label]) => {
                  const count = state.accounts.filter(a => a.account_type === key).length;
                  return (
                    <Badge key={key} className={`text-[10px] ${accountTypeColors[key as AccountType]}`}>
                      {label}: {count}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            {rootAccounts.map(account => renderTree(account))}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Account Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'تعديل حساب' : 'إضافة حساب جديد'}</DialogTitle>
            <DialogDescription className="sr-only">نموذج إضافة/تعديل حساب</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">كود الحساب</label>
                <Input value={formData.account_code} onChange={e => setFormData({ ...formData, account_code: e.target.value })} placeholder="مثال: 1107" />
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">اسم الحساب</label>
                <Input value={formData.account_name} onChange={e => setFormData({ ...formData, account_name: e.target.value })} placeholder="مثال: بنك QNB" />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-muted-foreground mb-1 block">الحساب الأب</label>
              <Select value={formData.parent_id} onValueChange={v => setFormData({ ...formData, parent_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الحساب الأب (اختياري)" /></SelectTrigger>
                <SelectContent>
                  {parentAccountsList.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">نوع الحساب</label>
                <Select value={formData.account_type} onValueChange={v => setFormData({ ...formData, account_type: v as AccountType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assets">أصول</SelectItem>
                    <SelectItem value="liabilities">خصوم</SelectItem>
                    <SelectItem value="equity">حقوق ملكية</SelectItem>
                    <SelectItem value="revenue">إيرادات</SelectItem>
                    <SelectItem value="expense">مصروفات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">طبيعة الرصيد</label>
                <Select value={formData.balance_type} onValueChange={v => setFormData({ ...formData, balance_type: v as BalanceType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">مدين</SelectItem>
                    <SelectItem value="credit">دائن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block">الرصيد الافتتاحي</label>
                <Input type="number" value={formData.opening_balance} onChange={e => setFormData({ ...formData, opening_balance: Number(e.target.value) })} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={formData.is_parent} onChange={e => setFormData({ ...formData, is_parent: e.target.checked })} className="w-4 h-4 rounded" />
                  حساب رئيسي (له حسابات فرعية)
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={!formData.account_code || !formData.account_name}>
              {editingAccount ? 'تعديل' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== General Ledger Tab ====================
function GeneralLedgerTab() {
  const { state, formatCurrency, getAccountBalance, getAccountLedger } = useAccounting();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const allLeafAccounts = state.accounts.filter(a => !a.is_parent && a.is_active);
  const selectedAccount = state.accounts.find(a => a.id === selectedAccountId);
  const ledgerLines = selectedAccountId ? getAccountLedger(selectedAccountId) : [];
  const balance = selectedAccountId ? getAccountBalance(selectedAccountId) : null;

  // Calculate running balance
  let runningBalance = selectedAccount?.opening_balance || 0;
  const isDebitNature = selectedAccount?.balance_type === 'debit';
  const ledgerWithBalance = ledgerLines
    .map(line => {
      const entry = state.journalEntries.find(e => e.id === line.journal_entry_id);
      const entryDate = entry?.entry_date || '';
      if (isDebitNature) {
        runningBalance = runningBalance + line.debit - line.credit;
      } else {
        runningBalance = runningBalance + line.credit - line.debit;
      }
      return {
        ...line,
        entry_date: entryDate,
        entry_number: entry?.entry_number || '',
        source_type: entry?.source_type || '',
        running_balance: runningBalance,
      };
    })
    .filter(line => {
      if (dateFrom && line.entry_date < dateFrom) return false;
      if (dateTo && line.entry_date > dateTo) return false;
      return true;
    });

  const handleExportLedger = () => {
    if (!selectedAccount || ledgerWithBalance.length === 0) return;
    const data = ledgerWithBalance.map(l => ({
      'التاريخ': l.entry_date,
      'رقم القيد': l.entry_number,
      'البيان': l.description,
      'مدين': l.debit || '',
      'دائن': l.credit || '',
      'الرصيد': l.running_balance,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الأستاذ العام');
    XLSX.writeFile(wb, `أستاذ_${selectedAccount.account_name}.xlsx`);
    toast.success('تم تصدير دفتر الأستاذ بنجاح');
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="text-[12px] text-muted-foreground mb-1 block">اختر الحساب</label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="اختر حساب لعرض دفتر الأستاذ" /></SelectTrigger>
                <SelectContent>
                  {allLeafAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">من تاريخ</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-[12px] w-[150px]" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">إلى تاريخ</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-[12px] w-[150px]" />
            </div>
            {selectedAccount && (
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={handleExportLedger}>
                <Download className="w-3 h-3" /> تصدير
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAccount && (
        <>
          {/* Account Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <div className="text-[11px] text-muted-foreground mb-1">الرصيد الافتتاحي</div>
              <div className="text-[16px] font-bold">{formatCurrency(selectedAccount.opening_balance)} ج.م</div>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <div className="text-[11px] text-muted-foreground mb-1">إجمالي المدين</div>
              <div className="text-[16px] font-bold text-emerald-600">{formatCurrency(balance?.debit || 0)} ج.م</div>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <div className="text-[11px] text-muted-foreground mb-1">إجمالي الدائن</div>
              <div className="text-[16px] font-bold text-red-600">{formatCurrency(balance?.credit || 0)} ج.م</div>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <div className="text-[11px] text-muted-foreground mb-1">الرصيد الحالي</div>
              <div className={`text-[16px] font-bold ${(balance?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(balance?.balance || 0)} ج.م
              </div>
            </CardContent></Card>
          </div>

          {/* Ledger Table */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  دفتر أستاذ: {selectedAccount.account_code} - {selectedAccount.account_name}
                </CardTitle>
                <Badge className="text-[11px] bg-blue-100 text-blue-700">
                  {ledgerWithBalance.length} حركة
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[12px]">التاريخ</TableHead>
                    <TableHead className="text-[12px]">رقم القيد</TableHead>
                    <TableHead className="text-[12px]">النوع</TableHead>
                    <TableHead className="text-[12px]">البيان</TableHead>
                    <TableHead className="text-[12px]">مدين</TableHead>
                    <TableHead className="text-[12px]">دائن</TableHead>
                    <TableHead className="text-[12px]">الرصيد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAccount.opening_balance > 0 && (
                    <TableRow className="bg-blue-50/50">
                      <TableCell className="text-[12px]">-</TableCell>
                      <TableCell className="text-[12px]">-</TableCell>
                      <TableCell className="text-[12px]"><Badge className="text-[9px] bg-gray-100 text-gray-600">افتتاحي</Badge></TableCell>
                      <TableCell className="text-[12px]">رصيد افتتاحي</TableCell>
                      <TableCell className="text-[12px] text-emerald-600">{isDebitNature ? formatCurrency(selectedAccount.opening_balance) : ''}</TableCell>
                      <TableCell className="text-[12px] text-red-600">{!isDebitNature ? formatCurrency(selectedAccount.opening_balance) : ''}</TableCell>
                      <TableCell className="text-[12px]">{formatCurrency(selectedAccount.opening_balance)}</TableCell>
                    </TableRow>
                  )}
                  {ledgerWithBalance.length === 0 && selectedAccount.opening_balance === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-[13px]">لا توجد حركات على هذا الحساب</TableCell>
                    </TableRow>
                  ) : (
                    ledgerWithBalance.map(line => (
                      <TableRow key={line.id}>
                        <TableCell className="text-[12px]">{line.entry_date}</TableCell>
                        <TableCell className="text-[12px] text-muted-foreground">{line.entry_number}</TableCell>
                        <TableCell className="text-[12px]">
                          <Badge className={`text-[9px] ${sourceTypeColors[line.source_type] || 'bg-gray-100 text-gray-700'}`}>
                            {sourceTypeLabels[line.source_type] || line.source_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[12px]">{line.description}</TableCell>
                        <TableCell className="text-[12px] text-emerald-600">{line.debit > 0 ? formatCurrency(line.debit) : ''}</TableCell>
                        <TableCell className="text-[12px] text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : ''}</TableCell>
                        <TableCell className="text-[12px]">{formatCurrency(line.running_balance)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {balance && (ledgerWithBalance.length > 0 || selectedAccount.opening_balance > 0) && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="text-[13px]">الإجمالي</TableCell>
                      <TableCell className="text-[13px] text-emerald-700">{formatCurrency(balance.debit + (isDebitNature ? selectedAccount.opening_balance : 0))}</TableCell>
                      <TableCell className="text-[13px] text-red-700">{formatCurrency(balance.credit + (!isDebitNature ? selectedAccount.opening_balance : 0))}</TableCell>
                      <TableCell className="text-[13px] text-blue-700 font-bold">{formatCurrency(balance.balance)} {isDebitNature ? 'م' : 'د'}</TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ==================== Journal Entries Tab ====================
function JournalEntriesTab() {
  const { state, formatCurrency } = useAccounting();
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const toggleEntry = (id: string) => {
    setExpandedEntry(expandedEntry === id ? null : id);
  };

  const entries = useMemo(() => {
    return [...state.journalEntries]
      .reverse()
      .filter(entry => {
        if (filterSource !== 'all' && entry.source_type !== filterSource) return false;
        if (dateFrom && entry.entry_date < dateFrom) return false;
        if (dateTo && entry.entry_date > dateTo) return false;
        return true;
      });
  }, [state.journalEntries, filterSource, dateFrom, dateTo]);

  const totalDebit = entries.reduce((s, e) => s + e.total_debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.total_credit, 0);

  const handleExportJournal = () => {
    const data: Record<string, any>[] = [];
    entries.forEach(entry => {
      const lines = state.journalEntryLines.filter(l => l.journal_entry_id === entry.id);
      lines.forEach(line => {
        data.push({
          'رقم القيد': entry.entry_number,
          'التاريخ': entry.entry_date,
          'النوع': sourceTypeLabels[entry.source_type] || entry.source_type,
          'بيان القيد': entry.description,
          'كود الحساب': line.account_code,
          'اسم الحساب': line.account_name,
          'مدين': line.debit || '',
          'دائن': line.credit || '',
          'بيان السطر': line.description,
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قيود اليومية');
    XLSX.writeFile(wb, 'قيود_اليومية.xlsx');
    toast.success('تم تصدير قيود اليومية بنجاح');
  };

  return (
    <div className="space-y-3">
      {/* Filters & Summary */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">نوع العملية</label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[160px] h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="sales_invoice">فاتورة بيع</SelectItem>
                  <SelectItem value="purchase_invoice">فاتورة شراء</SelectItem>
                  <SelectItem value="receipt">سند قبض</SelectItem>
                  <SelectItem value="payment">سند صرف</SelectItem>
                  <SelectItem value="expense">مصروف</SelectItem>
                  <SelectItem value="transfer">تحويل</SelectItem>
                  <SelectItem value="manual">يدوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">من تاريخ</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-[12px] w-[150px]" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">إلى تاريخ</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-[12px] w-[150px]" />
            </div>
            <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={handleExportJournal}>
              <Download className="w-3 h-3" /> تصدير
            </Button>
          </div>
          <div className="flex items-center gap-6 text-[12px] pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">عدد القيود:</span>
              <Badge className="bg-blue-100 text-blue-700 text-[11px]">{entries.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">إجمالي المدين:</span>
              <span className="text-emerald-600 font-medium">{formatCurrency(totalDebit)} ج.م</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">إجمالي الدائن:</span>
              <span className="text-red-600 font-medium">{formatCurrency(totalCredit)} ج.م</span>
            </div>
            <div className="flex items-center gap-1">
              <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 text-[11px]">جميع القيود متوازنة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries List */}
      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpenCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-[15px] text-muted-foreground">لا توجد قيود</p>
            <p className="text-[13px] text-muted-foreground mt-1">سيتم إنشاء القيود تلقائياً عند إنشاء فواتير أو سندات أو مصروفات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            const lines = state.journalEntryLines.filter(l => l.journal_entry_id === entry.id);
            const isExpanded = expandedEntry === entry.id;
            return (
              <Card key={entry.id} className="overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => toggleEntry(entry.id)}
                >
                  <button className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] text-muted-foreground">{entry.entry_number}</span>
                      <Badge className={`text-[9px] ${sourceTypeColors[entry.source_type] || 'bg-gray-100 text-gray-700'}`}>
                        {sourceTypeLabels[entry.source_type] || entry.source_type}
                      </Badge>
                      <span className="text-[12px]">{entry.description}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{entry.entry_date}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-[12px]">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">مدين</p>
                      <p className="text-emerald-600">{formatCurrency(entry.total_debit)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">دائن</p>
                      <p className="text-red-600">{formatCurrency(entry.total_credit)}</p>
                    </div>
                    {entry.is_balanced && <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-accent/20">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[12px]">كود الحساب</TableHead>
                          <TableHead className="text-[12px]">اسم الحساب</TableHead>
                          <TableHead className="text-[12px]">مدين</TableHead>
                          <TableHead className="text-[12px]">دائن</TableHead>
                          <TableHead className="text-[12px]">البيان</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lines.map(line => (
                          <TableRow key={line.id}>
                            <TableCell className="text-[12px] text-muted-foreground">{line.account_code}</TableCell>
                            <TableCell className="text-[12px]">{line.account_name}</TableCell>
                            <TableCell className="text-[12px] text-emerald-600">{line.debit > 0 ? formatCurrency(line.debit) : ''}</TableCell>
                            <TableCell className="text-[12px] text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : ''}</TableCell>
                            <TableCell className="text-[12px] text-muted-foreground">{line.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Trial Balance Tab ====================
function TrialBalanceTab() {
  const { state, formatCurrency, getTrialBalance } = useAccounting();
  const [filterType, setFilterType] = useState('all');

  const trialBalance = useMemo(() => {
    const tb = getTrialBalance();
    if (filterType === 'all') return tb;
    return tb.filter(row => {
      const account = state.accounts.find(a => a.id === row.account_id);
      return account?.account_type === filterType;
    });
  }, [getTrialBalance, filterType, state.accounts]);

  const totals = trialBalance.reduce(
    (acc, row) => {
      const account = state.accounts.find(a => a.id === row.account_id);
      const isDebitNature = account?.balance_type === 'debit';
      const netBalance = row.opening_balance + row.total_debit - row.total_credit;
      const absoluteBalance = isDebitNature ? netBalance : -netBalance;

      return {
        totalDebit: acc.totalDebit + row.total_debit + (isDebitNature ? row.opening_balance : 0),
        totalCredit: acc.totalCredit + row.total_credit + (!isDebitNature ? row.opening_balance : 0),
        debitBalance: acc.debitBalance + (absoluteBalance > 0 ? absoluteBalance : 0),
        creditBalance: acc.creditBalance + (absoluteBalance < 0 ? -absoluteBalance : 0),
      };
    },
    { totalDebit: 0, totalCredit: 0, debitBalance: 0, creditBalance: 0 }
  );

  const isBalanced = Math.abs(totals.debitBalance - totals.creditBalance) < 0.01;

  const handleExportTrialBalance = () => {
    const data = trialBalance.map(row => {
      const account = state.accounts.find(a => a.id === row.account_id);
      const isDebitNature = account?.balance_type === 'debit';
      const netBalance = row.opening_balance + row.total_debit - row.total_credit;
      const absoluteBalance = isDebitNature ? netBalance : -netBalance;
      return {
        'كود الحساب': row.account_code,
        'اسم الحساب': row.account_name,
        'رصيد افتتاحي': row.opening_balance,
        'إجمالي مدين': row.total_debit,
        'إجمالي دائن': row.total_credit,
        'رصيد مدين': absoluteBalance > 0 ? absoluteBalance : '',
        'رصيد دائن': absoluteBalance < 0 ? -absoluteBalance : '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ميزان المراجعة');
    XLSX.writeFile(wb, 'ميزان_المراجعة.xlsx');
    toast.success('تم تصدير ميزان المراجعة بنجاح');
  };

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground">إجمالي الأرصدة المدينة</p>
          <p className="text-[18px] font-bold text-emerald-600">{formatCurrency(totals.debitBalance)} ج.م</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground">إجمالي الأرصدة الدائنة</p>
          <p className="text-[18px] font-bold text-red-600">{formatCurrency(totals.creditBalance)} ج.م</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground">الفرق</p>
          <p className={`text-[18px] font-bold ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(totals.debitBalance - totals.creditBalance))} ج.م
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground">الحالة</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {isBalanced ? (
              <span className="flex items-center gap-1">
                <CircleCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-[14px] text-emerald-600 font-bold">متوازن</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-[14px] text-red-600 font-bold">غير متوازن</span>
              </span>
            )}
          </div>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-[14px] flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              ميزان المراجعة ({trialBalance.length} حساب)
            </CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="assets">أصول</SelectItem>
                  <SelectItem value="liabilities">خصوم</SelectItem>
                  <SelectItem value="equity">حقوق ملكية</SelectItem>
                  <SelectItem value="revenue">إيرادات</SelectItem>
                  <SelectItem value="expense">مصروفات</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={handleExportTrialBalance}>
                <Download className="w-3 h-3" /> تصدير
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-[12px]">كود</TableHead>
                <TableHead className="text-[12px]">الحساب</TableHead>
                <TableHead className="text-[12px]">النوع</TableHead>
                <TableHead className="text-[12px]">رصيد افتتاحي</TableHead>
                <TableHead className="text-[12px]">إجمالي مدين</TableHead>
                <TableHead className="text-[12px]">إجمالي دائن</TableHead>
                <TableHead className="text-[12px]">رصيد مدين</TableHead>
                <TableHead className="text-[12px]">رصيد دائن</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8 text-[13px]">
                    لا توجد حسابات لعرضها. قم بإنشاء بعض العمليات أولاً.
                  </TableCell>
                </TableRow>
              ) : (
                trialBalance.map(row => {
                  const account = state.accounts.find(a => a.id === row.account_id);
                  const isDebitNature = account?.balance_type === 'debit';
                  const netBalance = row.opening_balance + row.total_debit - row.total_credit;
                  const absoluteBalance = isDebitNature ? netBalance : -netBalance;

                  return (
                    <TableRow key={row.account_id}>
                      <TableCell className="text-[12px] text-muted-foreground">{row.account_code}</TableCell>
                      <TableCell className="text-[12px]">{row.account_name}</TableCell>
                      <TableCell>
                        {account && <Badge className={`text-[9px] ${accountTypeColors[account.account_type]}`}>{accountTypeLabels[account.account_type]}</Badge>}
                      </TableCell>
                      <TableCell className="text-[12px]">{row.opening_balance > 0 ? formatCurrency(row.opening_balance) : '-'}</TableCell>
                      <TableCell className="text-[12px] text-emerald-600">{row.total_debit > 0 ? formatCurrency(row.total_debit) : '-'}</TableCell>
                      <TableCell className="text-[12px] text-red-600">{row.total_credit > 0 ? formatCurrency(row.total_credit) : '-'}</TableCell>
                      <TableCell className="text-[12px] text-emerald-700 font-medium">{absoluteBalance > 0 ? formatCurrency(absoluteBalance) : '-'}</TableCell>
                      <TableCell className="text-[12px] text-red-700 font-medium">{absoluteBalance < 0 ? formatCurrency(-absoluteBalance) : '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {trialBalance.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-[13px]">الإجمالي</TableCell>
                  <TableCell className="text-[13px] text-emerald-700 font-bold">{formatCurrency(totals.debitBalance)}</TableCell>
                  <TableCell className="text-[13px] text-red-700 font-bold">{formatCurrency(totals.creditBalance)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Income Statement Tab ====================
function IncomeStatementTab() {
  const { state, formatCurrency, getAccountBalance } = useAccounting();

  // Revenue accounts
  const revenueAccounts = state.accounts.filter(a => a.account_type === 'revenue' && !a.is_parent && a.is_active);
  const revenueItems = revenueAccounts.map(a => {
    const bal = getAccountBalance(a.id);
    return { name: a.account_name, code: a.account_code, amount: bal.balance };
  }).filter(r => r.amount !== 0);
  const totalRevenue = revenueItems.reduce((sum, r) => sum + r.amount, 0);

  // Expense accounts
  const expenseAccounts = state.accounts.filter(a => a.account_type === 'expense' && !a.is_parent && a.is_active);
  const expenseItems = expenseAccounts.map(a => {
    const bal = getAccountBalance(a.id);
    return { name: a.account_name, code: a.account_code, amount: bal.balance };
  }).filter(e => e.amount !== 0);
  const totalExpenses = expenseItems.reduce((sum, e) => sum + e.amount, 0);

  // Separate COGS
  const cogs = expenseItems.find(e => e.code === '5001');
  const cogsAmount = cogs?.amount || 0;
  const operatingExpenses = expenseItems.filter(e => e.code !== '5001');
  const totalOperatingExpenses = operatingExpenses.reduce((sum, e) => sum + e.amount, 0);

  const grossProfit = totalRevenue - cogsAmount;
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  const handleExportIncome = () => {
    const data: Record<string, any>[] = [];
    data.push({ 'البند': '--- الإيرادات ---', 'المبلغ': '' });
    revenueItems.forEach(item => {
      data.push({ 'البند': item.name, 'المبلغ': item.amount });
    });
    data.push({ 'البند': 'إجمالي الإيرادات', 'المبلغ': totalRevenue });
    data.push({ 'البند': '' });
    if (cogsAmount > 0) {
      data.push({ 'البند': 'تكلفة البضاعة المباعة', 'المبلغ': -cogsAmount });
      data.push({ 'البند': 'مجمل الربح', 'المبلغ': grossProfit });
      data.push({ 'البند': '' });
    }
    data.push({ 'البند': '--- المصروفات التشغيلية ---', 'المبلغ': '' });
    operatingExpenses.forEach(item => {
      data.push({ 'البند': item.name, 'المبلغ': -item.amount });
    });
    data.push({ 'البند': 'إجمالي المصروفات', 'المبلغ': -totalOperatingExpenses });
    data.push({ 'البند': '' });
    data.push({ 'البند': isProfit ? 'صافي الربح' : 'صافي الخسارة', 'المبلغ': netProfit });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قائمة الدخل');
    XLSX.writeFile(wb, 'قائمة_الدخل.xlsx');
    toast.success('تم تصدير قائمة الدخل بنجاح');
  };

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground">إجمالي الإيرادات</p>
          <p className="text-[18px] font-bold text-emerald-600">{formatCurrency(totalRevenue)} ج.م</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground">إجمالي المصروفات</p>
          <p className="text-[18px] font-bold text-red-600">{formatCurrency(totalExpenses)} ج.م</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground">{isProfit ? 'صافي الربح' : 'صافي الخسارة'}</p>
          <p className={`text-[18px] font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(netProfit))} ج.م
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground">هامش الربح</p>
          <p className={`text-[18px] font-bold ${isProfit ? 'text-blue-600' : 'text-red-600'}`}>{profitMargin}%</p>
        </CardContent></Card>
      </div>

      {/* Income Statement */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center border-b pb-4">
          <div className="flex items-center justify-between">
            <div />
            <div>
              <CardTitle className="text-[16px]">قائمة الدخل</CardTitle>
              <p className="text-[12px] text-muted-foreground mt-1">
                عن الفترة المنتهية في {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-[11px] gap-1 h-7" onClick={handleExportIncome}>
              <Download className="w-3 h-3" /> تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Revenue Section */}
          <div>
            <h3 className="text-[14px] text-emerald-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              الإيرادات
            </h3>
            {revenueItems.length === 0 ? (
              <p className="text-[12px] text-muted-foreground mr-6">لا توجد إيرادات</p>
            ) : (
              <div className="space-y-2 mr-6">
                {revenueItems.map(item => (
                  <div key={item.code} className="flex justify-between text-[12px]">
                    <span>{item.name}</span>
                    <span className="text-emerald-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-[13px] mt-3 pt-2 border-t border-dashed mr-6 font-medium">
              <span>إجمالي الإيرادات</span>
              <span className="text-emerald-700">{formatCurrency(totalRevenue)} ج.م</span>
            </div>
          </div>

          {/* COGS */}
          {cogsAmount > 0 && (
            <div>
              <div className="flex justify-between text-[12px] mr-6">
                <span>(-) تكلفة البضاعة المباعة</span>
                <span className="text-red-600">({formatCurrency(cogsAmount)})</span>
              </div>
              <div className="flex justify-between text-[13px] mt-2 pt-2 border-t border-double mr-6 font-medium">
                <span>مجمل الربح</span>
                <span className={grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>{formatCurrency(grossProfit)} ج.م</span>
              </div>
            </div>
          )}

          {/* Operating Expenses */}
          <div>
            <h3 className="text-[14px] text-red-700 mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              المصروفات التشغيلية
            </h3>
            {operatingExpenses.length === 0 ? (
              <p className="text-[12px] text-muted-foreground mr-6">لا توجد مصروفات</p>
            ) : (
              <div className="space-y-2 mr-6">
                {operatingExpenses.map(item => (
                  <div key={item.code} className="flex justify-between text-[12px]">
                    <span>{item.name}</span>
                    <span className="text-red-600">({formatCurrency(item.amount)})</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-[13px] mt-3 pt-2 border-t border-dashed mr-6 font-medium">
              <span>إجمالي المصروفات التشغيلية</span>
              <span className="text-red-700">({formatCurrency(totalOperatingExpenses)}) ج.م</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className={`p-4 rounded-xl ${isProfit ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-medium">
                {isProfit ? 'صافي الربح' : 'صافي الخسارة'}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[20px] font-bold ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(Math.abs(netProfit))} ج.م
                </span>
                {isProfit ? (
                  <CircleCheck className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Account Statement Tab ====================
function AccountStatementTab() {
  const { state, formatCurrency, getAccountBalance, getAccountLedger } = useAccounting();
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [statementMode, setStatementMode] = useState<'contact' | 'account'>('contact');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const selectedContact = state.contacts.find(c => c.id === selectedContactId);
  const selectedContactAccount = selectedContact ? state.accounts.find(a => a.id === selectedContact.account_id) : null;
  const selectedDirectAccount = state.accounts.find(a => a.id === selectedAccountId);

  const targetAccount = statementMode === 'contact' ? selectedContactAccount : selectedDirectAccount;

  const ledgerLines = targetAccount ? getAccountLedger(targetAccount.id) : [];
  const balance = targetAccount ? getAccountBalance(targetAccount.id) : null;

  const isDebitNature = targetAccount?.balance_type === 'debit';
  let runningBalance = targetAccount?.opening_balance || 0;

  const ledgerWithBalance = ledgerLines
    .map(line => {
      const entry = state.journalEntries.find(e => e.id === line.journal_entry_id);
      const entryDate = entry?.entry_date || '';
      if (isDebitNature) {
        runningBalance = runningBalance + line.debit - line.credit;
      } else {
        runningBalance = runningBalance + line.credit - line.debit;
      }
      return {
        ...line,
        entry_date: entryDate,
        entry_description: entry?.description || '',
        source_type: entry?.source_type || '',
        running_balance: runningBalance,
      };
    })
    .filter(line => {
      if (dateFrom && line.entry_date < dateFrom) return false;
      if (dateTo && line.entry_date > dateTo) return false;
      return true;
    });

  const totalDebit = ledgerWithBalance.reduce((s, l) => s + l.debit, 0);
  const totalCredit = ledgerWithBalance.reduce((s, l) => s + l.credit, 0);

  const leafAccounts = state.accounts.filter(a => !a.is_parent && a.is_active);

  const handleExportStatement = () => {
    if (!targetAccount || ledgerWithBalance.length === 0) return;
    const name = statementMode === 'contact' ? selectedContact?.name : targetAccount.account_name;
    const data = ledgerWithBalance.map(l => ({
      'التاريخ': l.entry_date,
      'البيان': l.entry_description || l.description,
      'النوع': sourceTypeLabels[l.source_type] || l.source_type,
      'مدين': l.debit || '',
      'دائن': l.credit || '',
      'الرصيد': l.running_balance,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'كشف حساب');
    XLSX.writeFile(wb, `كشف_حساب_${name}.xlsx`);
    toast.success('تم تصدير كشف الحساب بنجاح');
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Mode Switch */}
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">نوع الكشف</label>
              <Tabs value={statementMode} onValueChange={v => { setStatementMode(v as 'contact' | 'account'); setSelectedContactId(''); setSelectedAccountId(''); }}>
                <TabsList className="h-8">
                  <TabsTrigger value="contact" className="text-[11px] h-7 gap-1"><User className="w-3 h-3" /> عميل/مورد</TabsTrigger>
                  <TabsTrigger value="account" className="text-[11px] h-7 gap-1"><BookOpen className="w-3 h-3" /> حساب</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {statementMode === 'contact' ? (
              <div className="flex-1 min-w-[250px]">
                <label className="text-[12px] text-muted-foreground mb-1 block">اختر العميل / المورد</label>
                <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="اختر جهة الاتصال" /></SelectTrigger>
                  <SelectContent>
                    {state.contacts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.contact_type === 'customer' ? 'عميل' : c.contact_type === 'supplier' ? 'مورد' : 'عميل/مورد'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex-1 min-w-[250px]">
                <label className="text-[12px] text-muted-foreground mb-1 block">اختر الحساب</label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="اختر حساب" /></SelectTrigger>
                  <SelectContent>
                    {leafAccounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">من تاريخ</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-[12px] w-[150px]" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">إلى تاريخ</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-[12px] w-[150px]" />
            </div>
            {targetAccount && (
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={handleExportStatement}>
                <Download className="w-3 h-3" /> تصدير
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Info (for contact mode) */}
      {statementMode === 'contact' && selectedContact && selectedContactAccount && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 text-[12px]">
                <div>
                  <p className="text-muted-foreground text-[11px]">الاسم</p>
                  <p className="font-medium">{selectedContact.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">النوع</p>
                  <Badge className="text-[9px]">
                    {selectedContact.contact_type === 'customer' ? 'عميل' : selectedContact.contact_type === 'supplier' ? 'مورد' : 'عميل/مورد'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">الهاتف</p>
                  <p>{selectedContact.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">الرصيد الافتتاحي</p>
                  <p>{formatCurrency(selectedContactAccount.opening_balance)} ج.م</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">الرصيد الحالي</p>
                  <p className={`text-[15px] font-bold ${(balance?.balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {balance ? formatCurrency(balance.balance) : '0'} ج.م
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Info (for account mode) */}
      {statementMode === 'account' && selectedDirectAccount && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                <div>
                  <p className="text-muted-foreground text-[11px]">الحساب</p>
                  <p className="font-medium">{selectedDirectAccount.account_code} - {selectedDirectAccount.account_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">النوع</p>
                  <Badge className={`text-[9px] ${accountTypeColors[selectedDirectAccount.account_type]}`}>
                    {accountTypeLabels[selectedDirectAccount.account_type]}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">الرصيد الافتتاحي</p>
                  <p>{formatCurrency(selectedDirectAccount.opening_balance)} ج.م</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">الرصيد الحالي</p>
                  <p className={`text-[15px] font-bold ${(balance?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {balance ? formatCurrency(balance.balance) : '0'} ج.م
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statement Table */}
      {targetAccount && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-blue-600" />
              كشف حساب: {statementMode === 'contact' ? selectedContact?.name : `${targetAccount.account_code} - ${targetAccount.account_name}`}
              <Badge className="text-[10px] bg-gray-100 text-gray-700 mr-2">{ledgerWithBalance.length} حركة</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-[12px]">التاريخ</TableHead>
                  <TableHead className="text-[12px]">النوع</TableHead>
                  <TableHead className="text-[12px]">البيان</TableHead>
                  <TableHead className="text-[12px]">مدين</TableHead>
                  <TableHead className="text-[12px]">دائن</TableHead>
                  <TableHead className="text-[12px]">الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Opening Balance */}
                {targetAccount.opening_balance > 0 && (
                  <TableRow className="bg-blue-50/50">
                    <TableCell className="text-[12px]">-</TableCell>
                    <TableCell className="text-[12px]"><Badge className="text-[9px] bg-gray-100 text-gray-600">افتتاحي</Badge></TableCell>
                    <TableCell className="text-[12px]">رصيد سابق</TableCell>
                    <TableCell className="text-[12px] text-emerald-600">{isDebitNature ? formatCurrency(targetAccount.opening_balance) : ''}</TableCell>
                    <TableCell className="text-[12px] text-red-600">{!isDebitNature ? formatCurrency(targetAccount.opening_balance) : ''}</TableCell>
                    <TableCell className="text-[12px]">{formatCurrency(targetAccount.opening_balance)}</TableCell>
                  </TableRow>
                )}
                {ledgerWithBalance.length === 0 && targetAccount.opening_balance === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-[13px]">
                      لا توجد حركات
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerWithBalance.map(line => (
                    <TableRow key={line.id}>
                      <TableCell className="text-[12px]">{line.entry_date}</TableCell>
                      <TableCell className="text-[12px]">
                        <Badge className={`text-[9px] ${sourceTypeColors[line.source_type] || 'bg-gray-100 text-gray-700'}`}>
                          {sourceTypeLabels[line.source_type] || line.source_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[12px]">{line.entry_description || line.description}</TableCell>
                      <TableCell className="text-[12px] text-emerald-600">{line.debit > 0 ? formatCurrency(line.debit) : ''}</TableCell>
                      <TableCell className="text-[12px] text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : ''}</TableCell>
                      <TableCell className="text-[12px] font-medium">{formatCurrency(line.running_balance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {(ledgerWithBalance.length > 0 || targetAccount.opening_balance > 0) && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-[13px]">الإجمالي</TableCell>
                    <TableCell className="text-[13px] text-emerald-700 font-bold">{formatCurrency(totalDebit + (isDebitNature ? targetAccount.opening_balance : 0))}</TableCell>
                    <TableCell className="text-[13px] text-red-700 font-bold">{formatCurrency(totalCredit + (!isDebitNature ? targetAccount.opening_balance : 0))}</TableCell>
                    <TableCell className="text-[13px] text-blue-700 font-bold">{balance ? formatCurrency(balance.balance) : '0'} ج.م</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Balance Summary Card */}
      {statementMode === 'contact' && selectedContact && balance && (
        <Card>
          <CardContent className="p-4">
            <div className={`p-4 rounded-xl text-center ${
              balance.balance > 0
                ? selectedContact.contact_type === 'customer' ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'
                : selectedContact.contact_type === 'customer' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className="text-[12px] text-muted-foreground mb-1">
                {selectedContact.contact_type === 'customer'
                  ? 'الرصيد المستحق على العميل'
                  : selectedContact.contact_type === 'supplier'
                  ? 'الرصيد المستحق للمورد'
                  : 'رصيد الحساب'}
              </p>
              <p className="text-[22px] font-bold">
                {formatCurrency(balance.balance)} ج.م
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
