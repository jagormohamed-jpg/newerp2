import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ChevronDown, ChevronLeft, Plus, FolderOpen, FileText, Search } from 'lucide-react';
import type { Account, AccountType, BalanceType } from '../types/accounting';

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

export function ChartOfAccountsPage() {
  const { state, dispatch, formatCurrency, getAccountBalance } = useAccounting();
  const [showDialog, setShowDialog] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(state.accounts.filter(a => a.is_parent).map(a => a.id)));
  const [searchTerm, setSearchTerm] = useState('');
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

  const rootAccounts = state.accounts.filter(a => a.parent_id === null);
  const getChildren = (parentId: string) => state.accounts.filter(a => a.parent_id === parentId);

  const filteredAccounts = searchTerm
    ? state.accounts.filter(a => a.account_name.includes(searchTerm) || a.account_code.includes(searchTerm))
    : [];

  const renderTree = (account: Account, depth: number = 0): React.ReactNode => {
    const children = getChildren(account.id);
    const isExpanded = expandedNodes.has(account.id);
    const hasChildren = children.length > 0;
    const balance = getAccountBalance(account.id);

    return (
      <div key={account.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors text-[13px]`}
          style={{ paddingRight: `${depth * 24 + 12}px` }}
          onClick={() => hasChildren && toggleNode(account.id)}
        >
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
          <Badge className={`text-[10px] ${accountTypeColors[account.account_type]}`}>
            {accountTypeLabels[account.account_type]}
          </Badge>
          {!account.is_parent && (balance.debit > 0 || balance.credit > 0 || account.opening_balance > 0) && (
            <span className="text-[12px] text-muted-foreground mr-2">
              {formatCurrency(balance.balance)} ج
            </span>
          )}
        </div>
        {isExpanded && children.map(child => renderTree(child, depth + 1))}
      </div>
    );
  };

  const handleSubmit = () => {
    const parentAccount = state.accounts.find(a => a.id === formData.parent_id);
    const newAccount: Account = {
      id: Math.random().toString(36).substr(2, 9),
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
    setShowDialog(false);
    setFormData({ account_code: '', account_name: '', account_type: 'assets', parent_id: '', is_parent: false, opening_balance: 0, balance_type: 'debit' });
  };

  const parentAccounts = state.accounts.filter(a => a.is_parent);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-[20px] text-foreground">دليل الحسابات</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          إضافة حساب
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchTerm && filteredAccounts.length > 0 && (
        <Card>
          <CardContent className="p-3">
            {filteredAccounts.map(a => (
              <div key={a.id} className="flex items-center gap-3 py-2 px-3 hover:bg-accent/50 rounded-lg text-[13px]">
                {a.is_parent ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                <span className="text-muted-foreground">{a.account_code}</span>
                <span className="flex-1">{a.account_name}</span>
                <Badge className={`text-[10px] ${accountTypeColors[a.account_type]}`}>{accountTypeLabels[a.account_type]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tree */}
      {!searchTerm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">شجرة الحسابات ({state.accounts.length} حساب)</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {rootAccounts.map(account => renderTree(account))}
          </CardContent>
        </Card>
      )}

      {/* Add Account Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة حساب جديد</DialogTitle>
            <DialogDescription className="sr-only">نموذج إضافة حساب جديد</DialogDescription>
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
                  {parentAccounts.map(a => (
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
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={!formData.account_code || !formData.account_name}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}