import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Scale, CircleCheck, AlertCircle } from 'lucide-react';

export function TrialBalancePage() {
  const { state, formatCurrency, getTrialBalance } = useAccounting();

  const trialBalance = getTrialBalance();

  // Calculate totals
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] text-foreground">ميزان المراجعة</h1>
        {isBalanced ? (
          <Badge className="bg-emerald-100 text-emerald-700 text-[12px] gap-1">
            <CircleCheck className="w-3 h-3" />
            متوازن
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-700 text-[12px] gap-1">
            <AlertCircle className="w-3 h-3" />
            غير متوازن
          </Badge>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] text-muted-foreground">إجمالي الأرصدة المدينة</p>
            <p className="text-[20px] text-emerald-600">{formatCurrency(totals.debitBalance)} ج</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] text-muted-foreground">إجمالي الأرصدة الدائنة</p>
            <p className="text-[20px] text-red-600">{formatCurrency(totals.creditBalance)} ج</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] text-muted-foreground">الفرق</p>
            <p className={`text-[20px] ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totals.debitBalance - totals.creditBalance))} ج
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] text-muted-foreground">عدد الحسابات</p>
            <p className="text-[20px]">{trialBalance.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Balance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            ميزان المراجعة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>كود</TableHead>
                <TableHead>الحساب</TableHead>
                <TableHead>رصيد افتتاحي</TableHead>
                <TableHead>إجمالي مدين</TableHead>
                <TableHead>إجمالي دائن</TableHead>
                <TableHead>رصيد مدين</TableHead>
                <TableHead>رصيد دائن</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                      <TableCell className="text-[13px] text-muted-foreground">{row.account_code}</TableCell>
                      <TableCell className="text-[13px]">{row.account_name}</TableCell>
                      <TableCell className="text-[13px]">{row.opening_balance > 0 ? formatCurrency(row.opening_balance) : '-'}</TableCell>
                      <TableCell className="text-[13px] text-emerald-600">{row.total_debit > 0 ? formatCurrency(row.total_debit) : '-'}</TableCell>
                      <TableCell className="text-[13px] text-red-600">{row.total_credit > 0 ? formatCurrency(row.total_credit) : '-'}</TableCell>
                      <TableCell className="text-[13px] text-emerald-700">{absoluteBalance > 0 ? formatCurrency(absoluteBalance) : '-'}</TableCell>
                      <TableCell className="text-[13px] text-red-700">{absoluteBalance < 0 ? formatCurrency(-absoluteBalance) : '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {trialBalance.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="text-[14px]">الإجمالي</TableCell>
                  <TableCell className="text-[14px] text-emerald-700">{formatCurrency(totals.debitBalance)}</TableCell>
                  <TableCell className="text-[14px] text-red-700">{formatCurrency(totals.creditBalance)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}