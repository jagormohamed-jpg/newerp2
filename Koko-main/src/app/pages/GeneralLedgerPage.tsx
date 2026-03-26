import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ClipboardList } from 'lucide-react';

export function GeneralLedgerPage() {
  const { state, formatCurrency, getAccountBalance, getAccountLedger } = useAccounting();
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const leafAccounts = state.accounts.filter(a => !a.is_parent && a.is_active);
  const selectedAccount = state.accounts.find(a => a.id === selectedAccountId);
  const ledgerLines = selectedAccountId ? getAccountLedger(selectedAccountId) : [];
  const balance = selectedAccountId ? getAccountBalance(selectedAccountId) : null;

  // Calculate running balance
  let runningBalance = selectedAccount?.opening_balance || 0;
  const isDebitNature = selectedAccount?.balance_type === 'debit';
  const ledgerWithBalance = ledgerLines.map(line => {
    const entry = state.journalEntries.find(e => e.id === line.journal_entry_id);
    if (isDebitNature) {
      runningBalance = runningBalance + line.debit - line.credit;
    } else {
      runningBalance = runningBalance + line.credit - line.debit;
    }
    return { ...line, entry_date: entry?.entry_date || '', entry_number: entry?.entry_number || '', running_balance: runningBalance };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-[20px] text-foreground">الأستاذ العام</h1>

      <Card>
        <CardContent className="p-4">
          <div className="max-w-md">
            <label className="text-[13px] text-muted-foreground mb-1 block">اختر الحساب</label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger><SelectValue placeholder="اختر حساب لعرض دفتر الأستاذ" /></SelectTrigger>
              <SelectContent>
                {leafAccounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedAccount && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                دفتر أستاذ: {selectedAccount.account_code} - {selectedAccount.account_name}
              </CardTitle>
              {balance && (
                <Badge className="text-[12px] bg-blue-100 text-blue-700">
                  الرصيد: {formatCurrency(balance.balance)} ج
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>التاريخ</TableHead>
                  <TableHead>رقم القيد</TableHead>
                  <TableHead>البيان</TableHead>
                  <TableHead>مدين</TableHead>
                  <TableHead>دائن</TableHead>
                  <TableHead>الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Opening Balance Row */}
                {selectedAccount.opening_balance > 0 && (
                  <TableRow className="bg-blue-50/50">
                    <TableCell className="text-[13px]">-</TableCell>
                    <TableCell className="text-[13px]">-</TableCell>
                    <TableCell className="text-[13px]">رصيد افتتاحي</TableCell>
                    <TableCell className="text-[13px] text-emerald-600">{isDebitNature ? formatCurrency(selectedAccount.opening_balance) : ''}</TableCell>
                    <TableCell className="text-[13px] text-red-600">{!isDebitNature ? formatCurrency(selectedAccount.opening_balance) : ''}</TableCell>
                    <TableCell className="text-[13px]">{formatCurrency(selectedAccount.opening_balance)}</TableCell>
                  </TableRow>
                )}
                {ledgerWithBalance.length === 0 && selectedAccount.opening_balance === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد حركات على هذا الحساب</TableCell>
                  </TableRow>
                ) : (
                  ledgerWithBalance.map(line => (
                    <TableRow key={line.id}>
                      <TableCell className="text-[13px]">{line.entry_date}</TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">{line.entry_number}</TableCell>
                      <TableCell className="text-[13px]">{line.description}</TableCell>
                      <TableCell className="text-[13px] text-emerald-600">{line.debit > 0 ? formatCurrency(line.debit) : ''}</TableCell>
                      <TableCell className="text-[13px] text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : ''}</TableCell>
                      <TableCell className="text-[13px]">{formatCurrency(line.running_balance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {balance && (ledgerWithBalance.length > 0 || selectedAccount.opening_balance > 0) && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-[13px]">الإجمالي</TableCell>
                    <TableCell className="text-[13px] text-emerald-700">{formatCurrency(balance.debit + (isDebitNature ? selectedAccount.opening_balance : 0))}</TableCell>
                    <TableCell className="text-[13px] text-red-700">{formatCurrency(balance.credit + (!isDebitNature ? selectedAccount.opening_balance : 0))}</TableCell>
                    <TableCell className="text-[14px] text-blue-700">{formatCurrency(balance.balance)} {isDebitNature ? 'م' : 'د'}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
