import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ChevronDown, ChevronLeft, BookOpenCheck, CircleCheck } from 'lucide-react';

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

export function JournalEntriesPage() {
  const { state, formatCurrency } = useAccounting();
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const toggleEntry = (id: string) => {
    setExpandedEntry(expandedEntry === id ? null : id);
  };

  const entries = [...state.journalEntries].reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] text-foreground">قيود اليومية (تلقائي)</h1>
        <Badge className="bg-blue-100 text-blue-700 text-[12px]">
          <BookOpenCheck className="w-3 h-3 ml-1" />
          {state.journalEntries.length} قيد
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">إجمالي المدين:</span>
              <span className="text-emerald-600">{formatCurrency(state.journalEntries.reduce((s, e) => s + e.total_debit, 0))} ج</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">إجمالي الدائن:</span>
              <span className="text-red-600">{formatCurrency(state.journalEntries.reduce((s, e) => s + e.total_credit, 0))} ج</span>
            </div>
            <div className="flex items-center gap-2">
              <CircleCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">جميع القيود متوازنة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpenCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-[15px] text-muted-foreground">لا توجد قيود بعد</p>
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
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => toggleEntry(entry.id)}
                >
                  <button className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[13px] text-muted-foreground">{entry.entry_number}</span>
                      <Badge className={`text-[10px] ${sourceTypeColors[entry.source_type] || 'bg-gray-100 text-gray-700'}`}>
                        {sourceTypeLabels[entry.source_type] || entry.source_type}
                      </Badge>
                      <span className="text-[13px]">{entry.description}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{entry.entry_date}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-[13px]">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">مدين</p>
                      <p className="text-emerald-600">{formatCurrency(entry.total_debit)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">دائن</p>
                      <p className="text-red-600">{formatCurrency(entry.total_credit)}</p>
                    </div>
                    {entry.is_balanced && <CircleCheck className="w-4 h-4 text-emerald-500" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-accent/20">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>كود الحساب</TableHead>
                          <TableHead>اسم الحساب</TableHead>
                          <TableHead>مدين</TableHead>
                          <TableHead>دائن</TableHead>
                          <TableHead>البيان</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lines.map(line => (
                          <TableRow key={line.id}>
                            <TableCell className="text-[13px] text-muted-foreground">{line.account_code}</TableCell>
                            <TableCell className="text-[13px]">{line.account_name}</TableCell>
                            <TableCell className="text-[13px] text-emerald-600">{line.debit > 0 ? formatCurrency(line.debit) : ''}</TableCell>
                            <TableCell className="text-[13px] text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : ''}</TableCell>
                            <TableCell className="text-[13px] text-muted-foreground">{line.description}</TableCell>
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