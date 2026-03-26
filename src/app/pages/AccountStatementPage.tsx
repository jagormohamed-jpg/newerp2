import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { FileSearch, User } from 'lucide-react';

export function AccountStatementPage() {
  const { state, formatCurrency, getAccountBalance, getAccountLedger } = useAccounting();
  const [selectedContactId, setSelectedContactId] = useState('');

  const selectedContact = state.contacts.find(c => c.id === selectedContactId);
  const selectedAccount = selectedContact ? state.accounts.find(a => a.id === selectedContact.account_id) : null;

  const ledgerLines = selectedAccount ? getAccountLedger(selectedAccount.id) : [];
  const balance = selectedAccount ? getAccountBalance(selectedAccount.id) : null;

  const isDebitNature = selectedAccount?.balance_type === 'debit';
  let runningBalance = selectedAccount?.opening_balance || 0;

  const ledgerWithBalance = ledgerLines.map(line => {
    const entry = state.journalEntries.find(e => e.id === line.journal_entry_id);
    if (isDebitNature) {
      runningBalance = runningBalance + line.debit - line.credit;
    } else {
      runningBalance = runningBalance + line.credit - line.debit;
    }
    return {
      ...line,
      entry_date: entry?.entry_date || '',
      entry_description: entry?.description || '',
      running_balance: runningBalance,
    };
  });

  const totalDebit = ledgerLines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = ledgerLines.reduce((s, l) => s + l.credit, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-[20px] text-foreground">كشف حساب عميل / مورد</h1>

      <Card>
        <CardContent className="p-4">
          <div className="max-w-md">
            <label className="text-[13px] text-muted-foreground mb-1 block">اختر العميل / المورد</label>
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger><SelectValue placeholder="اختر جهة الاتصال" /></SelectTrigger>
              <SelectContent>
                {state.contacts.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.contact_type === 'customer' ? 'عميل' : c.contact_type === 'supplier' ? 'مورد' : 'عميل/مورد'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedContact && selectedAccount && (
        <>
          {/* Contact Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                  <div>
                    <p className="text-muted-foreground">الاسم</p>
                    <p>{selectedContact.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">النوع</p>
                    <Badge className="text-[10px]">
                      {selectedContact.contact_type === 'customer' ? 'عميل' : selectedContact.contact_type === 'supplier' ? 'مورد' : 'عميل/مورد'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الهاتف</p>
                    <p>{selectedContact.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الرصيد الحالي</p>
                    <p className={`text-[16px] ${balance && balance.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {balance ? formatCurrency(balance.balance) : '0'} ج
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statement Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-blue-600" />
                كشف حساب: {selectedContact.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>التاريخ</TableHead>
                    <TableHead>البيان</TableHead>
                    <TableHead>مدين</TableHead>
                    <TableHead>دائن</TableHead>
                    <TableHead>الرصيد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening Balance */}
                  {selectedAccount.opening_balance > 0 && (
                    <TableRow className="bg-blue-50/50">
                      <TableCell className="text-[13px]">-</TableCell>
                      <TableCell className="text-[13px]">رصيد سابق</TableCell>
                      <TableCell className="text-[13px]">{isDebitNature ? formatCurrency(selectedAccount.opening_balance) : ''}</TableCell>
                      <TableCell className="text-[13px]">{!isDebitNature ? formatCurrency(selectedAccount.opening_balance) : ''}</TableCell>
                      <TableCell className="text-[13px]">{formatCurrency(selectedAccount.opening_balance)}</TableCell>
                    </TableRow>
                  )}
                  {ledgerWithBalance.length === 0 && selectedAccount.opening_balance === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        لا توجد حركات لهذا العميل/المورد
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerWithBalance.map(line => (
                      <TableRow key={line.id}>
                        <TableCell className="text-[13px]">{line.entry_date}</TableCell>
                        <TableCell className="text-[13px]">{line.entry_description || line.description}</TableCell>
                        <TableCell className="text-[13px] text-emerald-600">{line.debit > 0 ? formatCurrency(line.debit) : ''}</TableCell>
                        <TableCell className="text-[13px] text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : ''}</TableCell>
                        <TableCell className="text-[13px]">{formatCurrency(line.running_balance)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {(ledgerWithBalance.length > 0 || selectedAccount.opening_balance > 0) && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="text-[14px]">الإجمالي</TableCell>
                      <TableCell className="text-[14px] text-emerald-700">{formatCurrency(totalDebit + (isDebitNature ? selectedAccount.opening_balance : 0))}</TableCell>
                      <TableCell className="text-[14px] text-red-700">{formatCurrency(totalCredit + (!isDebitNature ? selectedAccount.opening_balance : 0))}</TableCell>
                      <TableCell className="text-[14px] text-blue-700">{balance ? formatCurrency(balance.balance) : '0'} ج</TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </CardContent>
          </Card>

          {/* Balance Summary */}
          <Card>
            <CardContent className="p-4">
              <div className={`p-4 rounded-xl text-center ${
                balance && balance.balance > 0
                  ? selectedContact.contact_type === 'customer' ? 'bg-red-50' : 'bg-emerald-50'
                  : selectedContact.contact_type === 'customer' ? 'bg-emerald-50' : 'bg-red-50'
              }`}>
                <p className="text-[13px] text-muted-foreground mb-1">
                  {selectedContact.contact_type === 'customer'
                    ? 'الرصيد المستحق على العميل'
                    : 'الرصيد المستحق للمورد'}
                </p>
                <p className="text-[24px]">
                  {balance ? formatCurrency(balance.balance) : '0'} ج
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
