import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Scale, TrendingUp, TrendingDown, BookOpen, FileSearch, Search,
  Printer, Download, ChevronRight, ChevronDown, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, Users, Wallet
} from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];
const startOfYear = () => `${new Date().getFullYear()}-01-01`;
const fmt = (n: number, currency = true) =>
  n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (currency ? ' ج.م' : '');

// ============ Main Page ============
export function ReportsModulePage() {
  const [activeTab, setActiveTab] = useState('trial_balance');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] text-foreground font-bold">التقارير المالية</h1>
        <p className="text-[12px] text-muted-foreground">ميزان المراجعة • قائمة الدخل • الميزانية العمومية • اليومية • دفتر الأستاذ • كشف الحساب</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="trial_balance" className="flex items-center gap-1.5 text-[12px]">
            <Scale className="w-4 h-4" /> ميزان المراجعة
          </TabsTrigger>
          <TabsTrigger value="income_statement" className="flex items-center gap-1.5 text-[12px]">
            <TrendingUp className="w-4 h-4" /> قائمة الدخل
          </TabsTrigger>
          <TabsTrigger value="balance_sheet" className="flex items-center gap-1.5 text-[12px]">
            <BarChart3 className="w-4 h-4" /> الميزانية العمومية
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-1.5 text-[12px]">
            <BookOpen className="w-4 h-4" /> اليومية العامة
          </TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-1.5 text-[12px]">
            <FileSearch className="w-4 h-4" /> دفتر الأستاذ
          </TabsTrigger>
          <TabsTrigger value="account_statement" className="flex items-center gap-1.5 text-[12px]">
            <Users className="w-4 h-4" /> كشف الحساب
          </TabsTrigger>
          <TabsTrigger value="contact_statement" className="flex items-center gap-1.5 text-[12px]">
            <Wallet className="w-4 h-4" /> كشف العملاء/الموردين
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trial_balance"><TrialBalanceTab /></TabsContent>
        <TabsContent value="income_statement"><IncomeStatementTab /></TabsContent>
        <TabsContent value="balance_sheet"><BalanceSheetTab /></TabsContent>
        <TabsContent value="journal"><JournalTab /></TabsContent>
        <TabsContent value="ledger"><LedgerTab /></TabsContent>
        <TabsContent value="account_statement"><AccountStatementTab /></TabsContent>
        <TabsContent value="contact_statement"><ContactStatementTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Filter Bar Component ============
function DateRangeFilter({
  from, to, onFromChange, onToChange, onPrint
}: { from: string; to: string; onFromChange: (v: string) => void; onToChange: (v: string) => void; onPrint?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/20 rounded-lg border">
      <div className="flex items-center gap-2">
        <label className="text-[12px] text-muted-foreground whitespace-nowrap">من:</label>
        <Input type="date" value={from} onChange={e => onFromChange(e.target.value)} className="text-[12px] w-36 h-8" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[12px] text-muted-foreground whitespace-nowrap">إلى:</label>
        <Input type="date" value={to} onChange={e => onToChange(e.target.value)} className="text-[12px] w-36 h-8" />
      </div>
      {onPrint && (
        <Button size="sm" variant="outline" onClick={onPrint} className="gap-1.5 text-[12px] h-8 mr-auto">
          <Printer className="w-3.5 h-3.5" /> طباعة
        </Button>
      )}
    </div>
  );
}

// ============ Trial Balance Tab ============
function TrialBalanceTab() {
  const { state, formatCurrency, getTrialBalance } = useAccounting();
  const [search, setSearch] = useState('');
  const [showZero, setShowZero] = useState(false);
  const [expandLevel, setExpandLevel] = useState<1 | 2 | 3 | 4>(4);

  const trialBalance = useMemo(() => getTrialBalance(), [state.journalEntryLines, state.accounts]);

  const filtered = useMemo(() => {
    return trialBalance
      .filter(row => {
        if (!showZero && row.total_debit === 0 && row.total_credit === 0 && row.opening_balance === 0) return false;
        if (search && !row.account_name.includes(search) && !row.account_code.includes(search)) return false;
        return true;
      })
      .filter(row => {
        const account = state.accounts.find(a => a.id === row.account_id);
        return (account?.level || 1) <= expandLevel;
      });
  }, [trialBalance, search, showZero, expandLevel]);

  const totals = useMemo(() => ({
    debit: filtered.reduce((s, r) => s + r.total_debit, 0),
    credit: filtered.reduce((s, r) => s + r.total_credit, 0),
    balance: filtered.reduce((s, r) => s + r.balance, 0),
  }), [filtered]);

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground mb-1">إجمالي المدين</div>
          <div className="text-[14px] font-bold text-blue-700">{formatCurrency(totals.debit)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground mb-1">إجمالي الدائن</div>
          <div className="text-[14px] font-bold text-purple-700">{formatCurrency(totals.credit)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground mb-1">حالة الميزان</div>
          <Badge className={`text-[11px] ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isBalanced ? '✅ متوازن' : '⚠️ غير متوازن'}
          </Badge>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground mb-1">عدد الحسابات</div>
          <div className="text-[14px] font-bold">{filtered.length}</div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم أو كود الحساب..." className="pr-9 text-[12px] h-8" />
        </div>
        <div className="flex items-center gap-1 text-[12px]">
          <label className="text-muted-foreground">مستوى التفصيل:</label>
          {([1, 2, 3, 4] as (1 | 2 | 3 | 4)[]).map(l => (
            <button key={l} onClick={() => setExpandLevel(l)}
              className={`px-2.5 py-1 rounded border text-[11px] transition-colors ${expandLevel === l ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
            >{l}</button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
          <input type="checkbox" checked={showZero} onChange={e => setShowZero(e.target.checked)} className="w-3.5 h-3.5" />
          إظهار الأرصدة الصفرية
        </label>
        <Button size="sm" variant="outline" className="gap-1.5 text-[12px] h-8">
          <Printer className="w-3.5 h-3.5" /> طباعة
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[12px] w-24">الكود</TableHead>
                <TableHead className="text-[12px]">اسم الحساب</TableHead>
                <TableHead className="text-[12px] text-center">الرصيد الافتتاحي</TableHead>
                <TableHead className="text-[12px] text-center">مدين</TableHead>
                <TableHead className="text-[12px] text-center">دائن</TableHead>
                <TableHead className="text-[12px] text-center">الرصيد</TableHead>
                <TableHead className="text-[12px] text-center">طبيعة الرصيد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => {
                const account = state.accounts.find(a => a.id === row.account_id);
                const level = account?.level || 1;
                const isParent = account?.is_parent;
                const netBalance = row.balance + row.opening_balance;
                const balanceNature = netBalance >= 0 ? 'مدين' : 'دائن';
                return (
                  <TableRow key={row.account_id} className={isParent ? 'bg-muted/20 font-medium' : ''}>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{row.account_code}</TableCell>
                    <TableCell className={`text-[12px] ${level === 1 ? 'font-bold text-foreground' : level === 2 ? 'font-medium pr-3' : level === 3 ? 'pr-6' : 'pr-9 text-muted-foreground'}`}>
                      {level > 1 && <span className="text-muted-foreground ml-1">{'↳'.repeat(level - 1)}</span>}
                      {row.account_name}
                    </TableCell>
                    <TableCell className="text-[11px] text-center">
                      {row.opening_balance !== 0 ? formatCurrency(Math.abs(row.opening_balance)) : '-'}
                    </TableCell>
                    <TableCell className="text-[11px] text-center text-blue-700">
                      {row.total_debit > 0 ? formatCurrency(row.total_debit) : '-'}
                    </TableCell>
                    <TableCell className="text-[11px] text-center text-purple-700">
                      {row.total_credit > 0 ? formatCurrency(row.total_credit) : '-'}
                    </TableCell>
                    <TableCell className="text-[11px] text-center font-medium">
                      {Math.abs(netBalance) > 0 ? formatCurrency(Math.abs(netBalance)) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {Math.abs(netBalance) > 0.01 && (
                        <Badge className={`text-[10px] ${netBalance >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {balanceNature}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Totals Row */}
              <TableRow className="bg-muted/40 border-t-2 border-border">
                <TableCell colSpan={2} className="text-[12px] font-bold">الإجمالي</TableCell>
                <TableCell className="text-[12px] text-center font-bold">-</TableCell>
                <TableCell className="text-[12px] text-center font-bold text-blue-700">{formatCurrency(totals.debit)}</TableCell>
                <TableCell className="text-[12px] text-center font-bold text-purple-700">{formatCurrency(totals.credit)}</TableCell>
                <TableCell className="text-[12px] text-center font-bold">{formatCurrency(Math.abs(totals.balance))}</TableCell>
                <TableCell className="text-center">
                  <Badge className={`text-[10px] ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isBalanced ? 'متوازن' : 'غير متوازن'}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ============ Income Statement Tab ============
function IncomeStatementTab() {
  const { state, formatCurrency, getTrialBalance } = useAccounting();
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(today());

  const trialBalance = useMemo(() => getTrialBalance(), [state.journalEntryLines, state.accounts]);

  // Get revenues and expenses from accounts + invoices
  const revenues = useMemo(() => {
    return trialBalance
      .filter(row => {
        const account = state.accounts.find(a => a.id === row.account_id);
        return account?.account_type === 'revenue' && !account.is_parent;
      })
      .map(row => ({
        ...row,
        amount: Math.abs(row.total_credit - row.total_debit + row.opening_balance),
      }));
  }, [trialBalance]);

  const expenses = useMemo(() => {
    return trialBalance
      .filter(row => {
        const account = state.accounts.find(a => a.id === row.account_id);
        return account?.account_type === 'expense' && !account.is_parent;
      })
      .map(row => ({
        ...row,
        amount: Math.abs(row.total_debit - row.total_credit + row.opening_balance),
      }));
  }, [trialBalance]);

  // Also count from new invoice module
  const newSales = (state.invoices || []).filter(inv => inv.invoice_type === 'sales').reduce((s, inv) => s + inv.total_amount, 0);
  const newPurchases = (state.invoices || []).filter(inv => inv.invoice_type === 'purchase').reduce((s, inv) => s + inv.total_amount, 0);
  const newReturns = (state.invoices || []).filter(inv => inv.invoice_type === 'sales_return').reduce((s, inv) => s + inv.total_amount, 0);

  const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0) + newSales - newReturns;
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0) + newPurchases;
  const grossProfit = newSales - newReturns - newPurchases;
  const netProfit = totalRevenues - totalExpenses;
  const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0;

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-green-200 bg-green-50">
          <div className="text-[11px] text-green-700 mb-1">��جمالي الإيرادات</div>
          <div className="text-[15px] font-bold text-green-800">{formatCurrency(totalRevenues)}</div>
        </Card>
        <Card className="p-3 border-red-200 bg-red-50">
          <div className="text-[11px] text-red-700 mb-1">إجمالي المصروفات</div>
          <div className="text-[15px] font-bold text-red-800">{formatCurrency(totalExpenses)}</div>
        </Card>
        <Card className={`p-3 border ${netProfit >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'}`}>
          <div className={`text-[11px] mb-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
            {netProfit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}
          </div>
          <div className={`text-[15px] font-bold ${netProfit >= 0 ? 'text-emerald-800' : 'text-orange-800'}`}>
            {formatCurrency(Math.abs(netProfit))}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground mb-1">هامش الربح</div>
          <div className={`text-[15px] font-bold ${profitMargin >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {profitMargin.toFixed(1)}%
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Revenues */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] flex items-center gap-2 text-green-700">
              <ArrowUpRight className="w-4 h-4" /> الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="text-[11px]">البيان</TableHead>
                  <TableHead className="text-[11px] text-center">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* New invoice revenues */}
                {newSales > 0 && (
                  <TableRow>
                    <TableCell className="text-[12px]">إيرادات مبيعات (فواتير بيع)</TableCell>
                    <TableCell className="text-[12px] text-center text-green-700">{formatCurrency(newSales)}</TableCell>
                  </TableRow>
                )}
                {newReturns > 0 && (
                  <TableRow>
                    <TableCell className="text-[12px] text-red-600">(-) مرتجعات المبيعات</TableCell>
                    <TableCell className="text-[12px] text-center text-red-600">({formatCurrency(newReturns)})</TableCell>
                  </TableRow>
                )}
                {revenues.map(r => (
                  <TableRow key={r.account_id}>
                    <TableCell className="text-[12px]">{r.account_name}</TableCell>
                    <TableCell className="text-[12px] text-center text-green-700">{formatCurrency(r.amount)}</TableCell>
                  </TableRow>
                ))}
                {revenues.length === 0 && newSales === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-[12px] text-muted-foreground py-6">لا توجد إيرادات</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-green-50 border-t-2">
                  <TableCell className="text-[12px] font-bold text-green-800">إجمالي الإيرادات</TableCell>
                  <TableCell className="text-[12px] font-bold text-center text-green-800">{formatCurrency(totalRevenues)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] flex items-center gap-2 text-red-700">
              <ArrowDownRight className="w-4 h-4" /> المصروفات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-red-50">
                  <TableHead className="text-[11px]">البيان</TableHead>
                  <TableHead className="text-[11px] text-center">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newPurchases > 0 && (
                  <TableRow>
                    <TableCell className="text-[12px]">تكلفة المشتريات</TableCell>
                    <TableCell className="text-[12px] text-center text-red-700">{formatCurrency(newPurchases)}</TableCell>
                  </TableRow>
                )}
                {expenses.map(r => (
                  <TableRow key={r.account_id}>
                    <TableCell className="text-[12px]">{r.account_name}</TableCell>
                    <TableCell className="text-[12px] text-center text-red-700">{formatCurrency(r.amount)}</TableCell>
                  </TableRow>
                ))}
                {expenses.length === 0 && newPurchases === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-[12px] text-muted-foreground py-6">لا توجد مصروفات</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-red-50 border-t-2">
                  <TableCell className="text-[12px] font-bold text-red-800">إجمالي المصروفات</TableCell>
                  <TableCell className="text-[12px] font-bold text-center text-red-800">{formatCurrency(totalExpenses)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Net Result */}
      <Card className={`p-4 ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-[13px] font-medium ${netProfit >= 0 ? 'text-emerald-800' : 'text-orange-800'}`}>
              {netProfit >= 0 ? '📈 صافي الربح للفترة' : '📉 صافي الخسارة للفترة'}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">من {from} إلى {to}</div>
          </div>
          <div className={`text-[22px] font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
            {formatCurrency(Math.abs(netProfit))}
          </div>
        </div>
        {/* Breakdown bar */}
        {totalRevenues > 0 && (
          <div className="mt-3">
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
              <div className="bg-red-400 transition-all" style={{ width: `${Math.min((totalExpenses / totalRevenues) * 100, 100)}%` }} />
              <div className="bg-emerald-400 flex-1 transition-all" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>مصروفات {((totalExpenses / totalRevenues) * 100).toFixed(0)}%</span>
              <span>ربح {profitMargin.toFixed(0)}%</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ Balance Sheet Tab ============
function BalanceSheetTab() {
  const { state, formatCurrency, getTrialBalance } = useAccounting();
  const [asOfDate, setAsOfDate] = useState(today());

  const trialBalance = useMemo(() => getTrialBalance(), [state.journalEntryLines, state.accounts]);

  const getAccountsByType = (type: string) => {
    return trialBalance
      .filter(row => {
        const account = state.accounts.find(a => a.id === row.account_id);
        return account?.account_type === type && !account.is_parent;
      })
      .map(row => ({
        ...row,
        netBalance: row.opening_balance + row.balance,
      }));
  };

  const assets = getAccountsByType('assets');
  const liabilities = getAccountsByType('liabilities');
  const equity = getAccountsByType('equity');

  // Include treasury and bank balances
  const treasuryBalance = state.treasuries.reduce((s, t) => s + t.current_balance, 0);
  const bankBalance = state.banks.reduce((s, b) => s + b.current_balance, 0);
  const inventoryValue = state.itemStock.reduce((s, st) => s + (st.quantity * st.average_cost), 0);

  const totalAssets = assets.reduce((s, r) => s + Math.abs(r.netBalance), 0) + treasuryBalance + bankBalance + inventoryValue;
  const totalLiabilities = liabilities.reduce((s, r) => s + Math.abs(r.netBalance), 0);
  const totalEquity = equity.reduce((s, r) => s + Math.abs(r.netBalance), 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

  const SectionTable = ({ title, rows, total, colorClass, extraRows = [] }: {
    title: string; rows: typeof assets; total: number; colorClass: string;
    extraRows?: { name: string; amount: number }[];
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={`text-[14px] ${colorClass}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">الحساب</TableHead>
              <TableHead className="text-[11px] text-center">المبلغ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extraRows.map(row => (
              <TableRow key={row.name}>
                <TableCell className="text-[12px]">{row.name}</TableCell>
                <TableCell className="text-[12px] text-center font-medium">{formatCurrency(row.amount)}</TableCell>
              </TableRow>
            ))}
            {rows.filter(r => Math.abs(r.netBalance) > 0).map(row => (
              <TableRow key={row.account_id}>
                <TableCell className="text-[12px]">{row.account_name}</TableCell>
                <TableCell className="text-[12px] text-center font-medium">{formatCurrency(Math.abs(row.netBalance))}</TableCell>
              </TableRow>
            ))}
            {rows.filter(r => Math.abs(r.netBalance) > 0).length === 0 && extraRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-[12px] text-muted-foreground py-4">لا توجد بيانات</TableCell>
              </TableRow>
            )}
            <TableRow className="bg-muted/30 border-t-2">
              <TableCell className={`text-[12px] font-bold ${colorClass}`}>الإجمالي</TableCell>
              <TableCell className={`text-[12px] font-bold text-center ${colorClass}`}>{formatCurrency(total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Date filter */}
      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border">
        <label className="text-[12px] text-muted-foreground">كما في تاريخ:</label>
        <Input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="text-[12px] w-36 h-8" />
        <Badge className={`mr-auto text-[11px] ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isBalanced ? '✅ الميزانية متوازنة' : '⚠️ الميزانية غير متوازنة'}
        </Badge>
        <Button size="sm" variant="outline" className="gap-1.5 text-[12px] h-8">
          <Printer className="w-3.5 h-3.5" /> طباعة
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border-blue-200 bg-blue-50">
          <div className="text-[11px] text-blue-700 mb-1">إجمالي الأصول</div>
          <div className="text-[15px] font-bold text-blue-800">{formatCurrency(totalAssets)}</div>
        </Card>
        <Card className="p-3 border-red-200 bg-red-50">
          <div className="text-[11px] text-red-700 mb-1">إجمالي الالتزامات</div>
          <div className="text-[15px] font-bold text-red-800">{formatCurrency(totalLiabilities)}</div>
        </Card>
        <Card className="p-3 border-emerald-200 bg-emerald-50">
          <div className="text-[11px] text-emerald-700 mb-1">حقوق الملكية</div>
          <div className="text-[15px] font-bold text-emerald-800">{formatCurrency(totalEquity)}</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Assets */}
        <SectionTable
          title="🏦 الأصول (Assets)"
          rows={assets}
          total={totalAssets}
          colorClass="text-blue-700"
          extraRows={[
            ...(treasuryBalance > 0 ? [{ name: 'نقدية في الصندوق (خزائن)', amount: treasuryBalance }] : []),
            ...(bankBalance > 0 ? [{ name: 'نقدية في البنوك', amount: bankBalance }] : []),
            ...(inventoryValue > 0 ? [{ name: 'قيمة المخزون', amount: inventoryValue }] : []),
          ]}
        />

        {/* Liabilities + Equity */}
        <div className="space-y-4">
          <SectionTable
            title="💳 الالتزامات (Liabilities)"
            rows={liabilities}
            total={totalLiabilities}
            colorClass="text-red-700"
          />
          <SectionTable
            title="💰 حقوق الملكية (Equity)"
            rows={equity}
            total={totalEquity}
            colorClass="text-emerald-700"
          />
          <Card className={`p-3 ${isBalanced ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-[13px] font-bold ${isBalanced ? 'text-green-800' : 'text-orange-800'}`}>
                إجمالي الالتزامات + حقوق الملكية
              </span>
              <span className={`text-[15px] font-bold ${isBalanced ? 'text-green-800' : 'text-orange-800'}`}>
                {formatCurrency(totalLiabilitiesAndEquity)}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============ General Journal Tab ============
function JournalTab() {
  const { state, formatCurrency } = useAccounting();
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return state.journalEntries.filter(e => {
      const matchDate = (!from || e.entry_date >= from) && (!to || e.entry_date <= to);
      const matchSearch = !search || e.entry_number.includes(search) || e.description.includes(search);
      return matchDate && matchSearch;
    }).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }, [state.journalEntries, from, to, search]);

  const totalDebit = filtered.reduce((s, e) => s + e.total_debit, 0);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في القيود..." className="pr-9 text-[12px] h-8" />
        </div>
        <div className="text-[12px] text-muted-foreground bg-accent px-3 py-1.5 rounded-md">
          {filtered.length} قيد | إجمالي: {formatCurrency(totalDebit)}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[11px] w-6"></TableHead>
                <TableHead className="text-[11px] w-28">رقم القيد</TableHead>
                <TableHead className="text-[11px] w-28">التاريخ</TableHead>
                <TableHead className="text-[11px]">البيان</TableHead>
                <TableHead className="text-[11px] text-center">إجمالي مدين</TableHead>
                <TableHead className="text-[11px] text-center">متوازن</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[12px] text-muted-foreground py-10">لا توجد قيود محاسبية</TableCell>
                </TableRow>
              ) : (
                filtered.flatMap(entry => {
                  const lines = state.journalEntryLines.filter(l => l.journal_entry_id === entry.id);
                  const isOpen = expanded[entry.id];
                  const rows: React.ReactElement[] = [
                    <TableRow
                      key={`${entry.id}-row`}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setExpanded(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                    >
                      <TableCell className="text-center">
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="text-[12px] font-medium text-blue-700">{entry.entry_number}</TableCell>
                      <TableCell className="text-[12px]">{entry.entry_date}</TableCell>
                      <TableCell className="text-[12px]">{entry.description}</TableCell>
                      <TableCell className="text-[12px] text-center font-medium">{formatCurrency(entry.total_debit)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[10px] ${entry.is_balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {entry.is_balanced ? '✅' : '❌'}
                        </Badge>
                      </TableCell>
                    </TableRow>,
                  ];
                  if (isOpen) {
                    rows.push(
                      <TableRow key={`${entry.id}-detail`}>
                        <TableCell colSpan={6} className="p-0 bg-muted/10">
                          <div className="px-8 py-2">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-[10px]">الحساب</TableHead>
                                  <TableHead className="text-[10px]">البيان</TableHead>
                                  <TableHead className="text-[10px] text-center">مدين</TableHead>
                                  <TableHead className="text-[10px] text-center">دائن</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {lines.map(line => (
                                  <TableRow key={line.id}>
                                    <TableCell className="text-[11px]">
                                      <span className="text-muted-foreground ml-1">{line.account_code}</span>
                                      {line.account_name}
                                    </TableCell>
                                    <TableCell className="text-[11px] text-muted-foreground">{line.description}</TableCell>
                                    <TableCell className="text-[11px] text-center text-blue-700">
                                      {line.debit > 0 ? formatCurrency(line.debit) : ''}
                                    </TableCell>
                                    <TableCell className="text-[11px] text-center text-purple-700">
                                      {line.credit > 0 ? formatCurrency(line.credit) : ''}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-muted/20 border-t">
                                  <TableCell colSpan={2} className="text-[11px] font-medium">الإجمالي</TableCell>
                                  <TableCell className="text-[11px] font-medium text-center text-blue-700">{formatCurrency(entry.total_debit)}</TableCell>
                                  <TableCell className="text-[11px] font-medium text-center text-purple-700">{formatCurrency(entry.total_credit)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return rows;
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ============ General Ledger Tab ============
function LedgerTab() {
  const { state, formatCurrency, getAccountLedger } = useAccounting();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState('');

  const leafAccounts = state.accounts.filter(a => !a.is_parent && a.is_active);

  const filteredAccounts = leafAccounts.filter(a =>
    !search || a.account_name.includes(search) || a.account_code.includes(search)
  );

  const selectedAccount = state.accounts.find(a => a.id === selectedAccountId);

  const lines = useMemo(() => {
    if (!selectedAccountId) return [];
    return getAccountLedger(selectedAccountId).filter(l => {
      const entry = state.journalEntries.find(e => e.id === l.journal_entry_id);
      if (!entry) return true;
      return (!from || entry.entry_date >= from) && (!to || entry.entry_date <= to);
    });
  }, [selectedAccountId, from, to, state.journalEntryLines]);

  // Running balance
  const linesWithBalance = useMemo(() => {
    const openingBalance = selectedAccount?.opening_balance || 0;
    let balance = openingBalance;
    return lines.map(line => {
      balance += line.debit - line.credit;
      return { ...line, runningBalance: balance };
    });
  }, [lines, selectedAccount]);

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const finalBalance = (selectedAccount?.opening_balance || 0) + totalDebit - totalCredit;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        {/* Account selector */}
        <div className="md:col-span-1 space-y-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن حساب..." className="pr-8 text-[12px] h-8" />
          </div>
          <Card className="max-h-64 overflow-y-auto">
            {filteredAccounts.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAccountId(a.id)}
                className={`w-full text-right px-3 py-2 text-[12px] hover:bg-accent transition-colors flex items-center justify-between ${selectedAccountId === a.id ? 'bg-primary/10 text-primary' : ''}`}
              >
                <span>{a.account_name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{a.account_code}</span>
              </button>
            ))}
          </Card>
        </div>

        {/* Ledger content */}
        <div className="md:col-span-2 space-y-3">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

          {!selectedAccountId ? (
            <Card className="p-10 text-center">
              <FileSearch className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">اختر حساباً من القائمة لعرض حركاته</p>
            </Card>
          ) : (
            <>
              {/* Account summary */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-2.5">
                  <div className="text-[10px] text-muted-foreground">رصيد افتتاحي</div>
                  <div className="text-[13px] font-bold">{formatCurrency(selectedAccount?.opening_balance || 0)}</div>
                </Card>
                <Card className="p-2.5">
                  <div className="text-[10px] text-muted-foreground">حركة (مدين - دائن)</div>
                  <div className="text-[13px] font-bold">{formatCurrency(totalDebit - totalCredit)}</div>
                </Card>
                <Card className={`p-2.5 ${finalBalance >= 0 ? 'bg-blue-50' : 'bg-purple-50'}`}>
                  <div className="text-[10px] text-muted-foreground">الرصيد الختامي</div>
                  <div className={`text-[13px] font-bold ${finalBalance >= 0 ? 'text-blue-700' : 'text-purple-700'}`}>
                    {formatCurrency(Math.abs(finalBalance))} {finalBalance >= 0 ? 'مدين' : 'دائن'}
                  </div>
                </Card>
              </div>

              <Card>
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/30">
                      <TableRow>
                        <TableHead className="text-[10px]">رقم القيد</TableHead>
                        <TableHead className="text-[10px]">البيان</TableHead>
                        <TableHead className="text-[10px] text-center">مدين</TableHead>
                        <TableHead className="text-[10px] text-center">دائن</TableHead>
                        <TableHead className="text-[10px] text-center">الرصيد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Opening balance row */}
                      <TableRow className="bg-slate-50">
                        <TableCell className="text-[11px] text-muted-foreground italic">-</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground italic">رصيد مرحل</TableCell>
                        <TableCell className="text-[11px] text-center text-muted-foreground">-</TableCell>
                        <TableCell className="text-[11px] text-center text-muted-foreground">-</TableCell>
                        <TableCell className="text-[11px] text-center font-medium">{formatCurrency(selectedAccount?.opening_balance || 0)}</TableCell>
                      </TableRow>
                      {linesWithBalance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-[12px] text-muted-foreground py-6">لا توجد حركات في هذه الفترة</TableCell>
                        </TableRow>
                      ) : (
                        linesWithBalance.map(line => (
                          <TableRow key={line.id}>
                            <TableCell className="text-[11px] font-mono text-blue-700">
                              {state.journalEntries.find(e => e.id === line.journal_entry_id)?.entry_number || '-'}
                            </TableCell>
                            <TableCell className="text-[11px]">{line.description}</TableCell>
                            <TableCell className="text-[11px] text-center text-blue-700">
                              {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                            </TableCell>
                            <TableCell className="text-[11px] text-center text-purple-700">
                              {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                            </TableCell>
                            <TableCell className={`text-[11px] text-center font-medium ${line.runningBalance >= 0 ? 'text-blue-700' : 'text-purple-700'}`}>
                              {formatCurrency(Math.abs(line.runningBalance))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {/* Totals */}
                      <TableRow className="bg-muted/30 border-t-2">
                        <TableCell colSpan={2} className="text-[11px] font-bold">الإجمالي</TableCell>
                        <TableCell className="text-[11px] text-center font-bold text-blue-700">{formatCurrency(totalDebit)}</TableCell>
                        <TableCell className="text-[11px] text-center font-bold text-purple-700">{formatCurrency(totalCredit)}</TableCell>
                        <TableCell className={`text-[11px] text-center font-bold ${finalBalance >= 0 ? 'text-blue-700' : 'text-purple-700'}`}>
                          {formatCurrency(Math.abs(finalBalance))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Account Statement Tab ============
function AccountStatementTab() {
  const { state, formatCurrency, getAccountLedger } = useAccounting();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState('');

  const allAccounts = state.accounts.filter(a => a.is_active);
  const filteredAccounts = allAccounts.filter(a =>
    !search || a.account_name.includes(search) || a.account_code.includes(search)
  );

  const selectedAccount = state.accounts.find(a => a.id === selectedAccountId);
  const lines = useMemo(() => {
    if (!selectedAccountId) return [];
    return getAccountLedger(selectedAccountId).filter(l => {
      const entry = state.journalEntries.find(e => e.id === l.journal_entry_id);
      if (!entry) return true;
      return (!from || entry.entry_date >= from) && (!to || entry.entry_date <= to);
    });
  }, [selectedAccountId, from, to, state.journalEntryLines]);

  let runningBal = selectedAccount?.opening_balance || 0;
  const linesWithBal = lines.map(l => {
    runningBal += l.debit - l.credit;
    return { ...l, runningBalance: runningBal };
  });

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const closingBalance = (selectedAccount?.opening_balance || 0) + totalDebit - totalCredit;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <div className="space-y-2">
          <div className="text-[12px] font-medium text-muted-foreground">اختر الحساب</div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="pr-8 text-[12px] h-8" />
          </div>
          <Card className="max-h-80 overflow-y-auto">
            {filteredAccounts.map(a => (
              <button key={a.id} onClick={() => setSelectedAccountId(a.id)}
                className={`w-full text-right px-3 py-2 text-[11px] hover:bg-accent flex justify-between items-center ${selectedAccountId === a.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
              >
                <span>{a.account_name}</span>
                <span className="text-[10px] text-muted-foreground">{a.account_code}</span>
              </button>
            ))}
          </Card>
        </div>

        <div className="md:col-span-3 space-y-3">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onPrint={() => window.print()} />

          {!selectedAccountId ? (
            <Card className="p-10 text-center">
              <FileSearch className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">اختر حساباً لعرض كشف الحساب</p>
            </Card>
          ) : (
            <>
              {/* Header info */}
              <Card className="p-3 bg-muted/20">
                <div className="flex flex-wrap gap-4 text-[12px]">
                  <div><span className="text-muted-foreground">الحساب: </span><span className="font-medium">{selectedAccount?.account_name}</span></div>
                  <div><span className="text-muted-foreground">الكود: </span><span className="font-mono">{selectedAccount?.account_code}</span></div>
                  <div><span className="text-muted-foreground">النوع: </span><span>{selectedAccount?.account_type}</span></div>
                  <div><span className="text-muted-foreground">الرصيد الافتتاحي: </span><span className="font-medium">{formatCurrency(selectedAccount?.opening_balance || 0)}</span></div>
                </div>
              </Card>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'رصيد أول المدة', value: selectedAccount?.opening_balance || 0, color: 'text-muted-foreground' },
                  { label: 'إجمالي المدين', value: totalDebit, color: 'text-blue-700' },
                  { label: 'إجمالي الدائن', value: totalCredit, color: 'text-purple-700' },
                  { label: 'الرصيد الختامي', value: closingBalance, color: closingBalance >= 0 ? 'text-blue-700' : 'text-red-700' },
                ].map(item => (
                  <Card key={item.label} className="p-2.5">
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                    <div className={`text-[12px] font-bold ${item.color}`}>{formatCurrency(Math.abs(item.value))}</div>
                  </Card>
                ))}
              </div>

              <Card>
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-[11px] w-28">رقم القيد</TableHead>
                        <TableHead className="text-[11px]">البيان</TableHead>
                        <TableHead className="text-[11px] text-center w-28">مدين</TableHead>
                        <TableHead className="text-[11px] text-center w-28">دائن</TableHead>
                        <TableHead className="text-[11px] text-center w-28">الرصيد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-slate-50">
                        <TableCell className="text-[11px] text-muted-foreground italic" colSpan={2}>رصيد مرحل</TableCell>
                        <TableCell className="text-[11px] text-center">-</TableCell>
                        <TableCell className="text-[11px] text-center">-</TableCell>
                        <TableCell className="text-[11px] text-center font-medium">{formatCurrency(selectedAccount?.opening_balance || 0)}</TableCell>
                      </TableRow>
                      {linesWithBal.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-[12px] text-muted-foreground py-6">لا توجد حركات</TableCell>
                        </TableRow>
                      ) : (
                        linesWithBal.map(line => (
                          <TableRow key={line.id} className="hover:bg-accent/30">
                            <TableCell className="text-[11px] font-mono text-blue-600">
                              {state.journalEntries.find(e => e.id === line.journal_entry_id)?.entry_number || '-'}
                            </TableCell>
                            <TableCell className="text-[11px]">{line.description}</TableCell>
                            <TableCell className="text-[11px] text-center text-blue-700">
                              {line.debit > 0 ? formatCurrency(line.debit) : <Minus className="w-3 h-3 text-muted-foreground mx-auto" />}
                            </TableCell>
                            <TableCell className="text-[11px] text-center text-purple-700">
                              {line.credit > 0 ? formatCurrency(line.credit) : <Minus className="w-3 h-3 text-muted-foreground mx-auto" />}
                            </TableCell>
                            <TableCell className={`text-[11px] text-center font-medium ${line.runningBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                              {formatCurrency(Math.abs(line.runningBalance))}
                              <span className="text-[9px] ml-1">{line.runningBalance >= 0 ? 'م' : 'د'}</span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="bg-muted/30 border-t-2">
                        <TableCell colSpan={2} className="text-[11px] font-bold">الإجمالي</TableCell>
                        <TableCell className="text-[11px] font-bold text-center text-blue-700">{formatCurrency(totalDebit)}</TableCell>
                        <TableCell className="text-[11px] font-bold text-center text-purple-700">{formatCurrency(totalCredit)}</TableCell>
                        <TableCell className={`text-[11px] font-bold text-center ${closingBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          {formatCurrency(Math.abs(closingBalance))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Contact Statement Tab ============
function ContactStatementTab() {
  const { state, formatCurrency } = useAccounting();
  const [contactType, setContactType] = useState<'customer' | 'supplier'>('customer');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState('');

  const contacts = state.contacts.filter(c =>
    (c.contact_type === contactType || c.contact_type === 'both') &&
    (!search || c.name.includes(search) || c.phone.includes(search))
  );

  const selectedContact = state.contacts.find(c => c.id === selectedContactId);

  // Get invoices for this contact
  const contactInvoices = useMemo(() => {
    if (!selectedContactId) return [];
    const allInvoices = state.invoices || [];
    const salesInvoices = state.salesInvoices || [];
    const purchases = state.purchaseInvoices || [];

    const newInvoices = allInvoices.filter(inv =>
      inv.contact_id === selectedContactId &&
      (!from || inv.invoice_date >= from) &&
      (!to || inv.invoice_date <= to)
    );

    return newInvoices;
  }, [selectedContactId, from, to, state.invoices]);

  // Get journal entries related to contact
  const contactLines = useMemo(() => {
    if (!selectedContactId || !selectedContact?.account_id) return [];
    return state.journalEntryLines.filter(l => l.contact_id === selectedContactId);
  }, [selectedContactId, state.journalEntryLines]);

  // Build statement from invoices
  const totalInvoiced = contactInvoices.reduce((s, inv) => {
    const isSales = inv.invoice_type === 'sales' || inv.invoice_type === 'purchase_return';
    return s + (isSales ? inv.total_amount : -inv.total_amount);
  }, 0);

  const totalPaid = contactInvoices.reduce((s, inv) => s + inv.paid_amount, 0);
  const totalRemaining = contactInvoices.reduce((s, inv) => s + inv.remaining_amount, 0);

  const openingBalance = selectedContact?.opening_balance || 0;
  const closingBalance = openingBalance + (contactType === 'customer' ? totalRemaining : -totalPaid);

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        <button onClick={() => setContactType('customer')}
          className={`flex-1 py-2 rounded-lg border text-[13px] font-medium transition-colors ${contactType === 'customer' ? 'bg-blue-600 text-white border-blue-600' : 'border-border hover:bg-accent'}`}
        >
          👥 كشف حساب العملاء
        </button>
        <button onClick={() => setContactType('supplier')}
          className={`flex-1 py-2 rounded-lg border text-[13px] font-medium transition-colors ${contactType === 'supplier' ? 'bg-purple-600 text-white border-purple-600' : 'border-border hover:bg-accent'}`}
        >
          🏭 كشف حساب الموردين
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {/* Contact list */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="pr-8 text-[12px] h-8" />
          </div>
          <Card className="max-h-[70vh] overflow-y-auto">
            {contacts.map(c => {
              const cInvoices = (state.invoices || []).filter(inv => inv.contact_id === c.id);
              const cRemaining = cInvoices.reduce((s, inv) => s + inv.remaining_amount, 0) + c.opening_balance;
              return (
                <button key={c.id} onClick={() => setSelectedContactId(c.id)}
                  className={`w-full text-right px-3 py-2.5 text-[12px] hover:bg-accent border-b border-border/50 last:border-0 flex items-center justify-between gap-2 ${selectedContactId === c.id ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground">{c.phone}</div>
                  </div>
                  {cRemaining > 0 && (
                    <Badge className="text-[9px] bg-red-100 text-red-700">{formatCurrency(cRemaining)}</Badge>
                  )}
                </button>
              );
            })}
            {contacts.length === 0 && (
              <div className="p-4 text-center text-[12px] text-muted-foreground">لا توجد نتائج</div>
            )}
          </Card>
        </div>

        {/* Statement */}
        <div className="md:col-span-3 space-y-3">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onPrint={() => window.print()} />

          {!selectedContactId ? (
            <Card className="p-10 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">اختر {contactType === 'customer' ? 'عميل' : 'مورد'} لعرض كشف حسابه</p>
            </Card>
          ) : (
            <>
              {/* Contact info */}
              <Card className="p-3 bg-muted/20">
                <div className="flex flex-wrap gap-4 text-[12px]">
                  <div><span className="text-muted-foreground">الاسم: </span><span className="font-medium">{selectedContact?.name}</span></div>
                  <div><span className="text-muted-foreground">الهاتف: </span><span>{selectedContact?.phone}</span></div>
                  {selectedContact?.address && <div><span className="text-muted-foreground">العنوان: </span><span>{selectedContact.address}</span></div>}
                  <div><span className="text-muted-foreground">رصيد افتتاحي: </span><span className="font-medium">{formatCurrency(openingBalance)}</span></div>
                </div>
              </Card>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-2">
                <Card className="p-2.5">
                  <div className="text-[10px] text-muted-foreground">عدد الفواتير</div>
                  <div className="text-[14px] font-bold">{contactInvoices.length}</div>
                </Card>
                <Card className="p-2.5 bg-blue-50">
                  <div className="text-[10px] text-blue-700">إجمالي الفواتير</div>
                  <div className="text-[12px] font-bold text-blue-800">{formatCurrency(totalInvoiced)}</div>
                </Card>
                <Card className="p-2.5 bg-green-50">
                  <div className="text-[10px] text-green-700">المحصل / المدفوع</div>
                  <div className="text-[12px] font-bold text-green-800">{formatCurrency(totalPaid)}</div>
                </Card>
                <Card className="p-2.5 bg-red-50">
                  <div className="text-[10px] text-red-700">المتبقي</div>
                  <div className="text-[12px] font-bold text-red-800">{formatCurrency(totalRemaining + openingBalance)}</div>
                </Card>
              </div>

              {/* Invoices Table */}
              <Card>
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-[11px]">رقم الفاتورة</TableHead>
                        <TableHead className="text-[11px]">التاريخ</TableHead>
                        <TableHead className="text-[11px]">النوع</TableHead>
                        <TableHead className="text-[11px] text-center">المبلغ</TableHead>
                        <TableHead className="text-[11px] text-center">المدفوع</TableHead>
                        <TableHead className="text-[11px] text-center">المتبقي</TableHead>
                        <TableHead className="text-[11px] text-center">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Opening balance row */}
                      {openingBalance > 0 && (
                        <TableRow className="bg-slate-50">
                          <TableCell colSpan={3} className="text-[11px] text-muted-foreground italic">رصيد أول المدة</TableCell>
                          <TableCell className="text-[11px] text-center font-medium">{formatCurrency(openingBalance)}</TableCell>
                          <TableCell className="text-[11px] text-center">-</TableCell>
                          <TableCell className="text-[11px] text-center text-red-600 font-medium">{formatCurrency(openingBalance)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                      {contactInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-[12px] text-muted-foreground py-8">لا توجد فواتير في هذه الفترة</TableCell>
                        </TableRow>
                      ) : (
                        contactInvoices.map(inv => {
                          const typeLabels: Record<string, string> = {
                            sales: 'بيع', purchase: 'شراء', sales_return: 'مرتجع بيع',
                            purchase_return: 'مرتجع شراء', inventory_count: 'جرد', damages: 'هوالك',
                          };
                          const statusColors: Record<string, string> = {
                            paid: 'bg-green-100 text-green-700', partial: 'bg-amber-100 text-amber-700',
                            pending: 'bg-yellow-100 text-yellow-700', received: 'bg-blue-100 text-blue-700',
                            credit: 'bg-orange-100 text-orange-700', cancelled: 'bg-red-100 text-red-700',
                          };
                          return (
                            <TableRow key={inv.id} className="hover:bg-accent/30">
                              <TableCell className="text-[11px] font-medium text-blue-700">{inv.invoice_number}</TableCell>
                              <TableCell className="text-[11px]">{inv.invoice_date}</TableCell>
                              <TableCell className="text-[11px]">
                                <Badge className="text-[9px] bg-slate-100 text-slate-700">{typeLabels[inv.invoice_type] || inv.invoice_type}</Badge>
                              </TableCell>
                              <TableCell className="text-[11px] text-center font-medium">{formatCurrency(inv.total_amount)}</TableCell>
                              <TableCell className="text-[11px] text-center text-green-700">{formatCurrency(inv.paid_amount)}</TableCell>
                              <TableCell className="text-[11px] text-center text-red-700">{formatCurrency(inv.remaining_amount)}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={`text-[9px] ${statusColors[inv.invoice_status] || 'bg-gray-100 text-gray-700'}`}>
                                  {inv.invoice_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                      {/* Totals */}
                      {contactInvoices.length > 0 && (
                        <TableRow className="bg-muted/30 border-t-2">
                          <TableCell colSpan={3} className="text-[11px] font-bold">الإجمالي</TableCell>
                          <TableCell className="text-[11px] font-bold text-center">{formatCurrency(totalInvoiced)}</TableCell>
                          <TableCell className="text-[11px] font-bold text-center text-green-700">{formatCurrency(totalPaid)}</TableCell>
                          <TableCell className="text-[11px] font-bold text-center text-red-700">{formatCurrency(totalRemaining + openingBalance)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
