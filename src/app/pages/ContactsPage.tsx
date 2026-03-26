import React, { useState, useRef, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import {
  Plus, Users, Search, Edit, Trash2, Ban, Download, Upload, MoreVertical,
  FileSpreadsheet, Eye, EyeOff, FolderOpen, Tag, FileText, X, Check, AlertTriangle,
  ChevronDown, UserCheck, UserX, List, LayoutGrid
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { Contact, ContactType, ContactGroup, PriceList, PriceListItem, Account } from '../types/accounting';

const uid = () => Math.random().toString(36).substr(2, 9);

export function ContactsPage() {
  const { state, dispatch, formatCurrency, getAccountBalance, getAccountLedger } = useAccounting();
  const [mainTab, setMainTab] = useState('contacts');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Contact Form
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    contact_type: 'customer' as ContactType,
    name: '', phone: '', phone2: '', email: '', address: '',
    tax_number: '', credit_limit: 0, opening_balance: 0, notes: '',
    group_id: '', price_list_id: '',
  });

  // Group Form
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', contact_type: 'all' as ContactType | 'all' });

  // Price List Form
  const [showPriceListDialog, setShowPriceListDialog] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [priceListForm, setPriceListForm] = useState({
    name: '', contact_type: 'customer' as 'customer' | 'supplier', description: '',
    items: [] as PriceListItem[],
  });

  // Statement Dialog
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [statementType, setStatementType] = useState<'detailed' | 'summary'>('summary');

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const contactGroups = state.contactGroups || [];
  const priceLists = state.priceLists || [];

  // Check if contact has transactions
  const hasTransactions = (contactId: string) => {
    const hasSales = state.salesInvoices.some(i => i.contact_id === contactId);
    const hasPurchases = state.purchaseInvoices.some(i => i.contact_id === contactId);
    const hasReceipts = state.receipts.some(r => r.contact_id === contactId);
    const hasPayments = state.payments.some(p => p.contact_id === contactId);
    const hasJournal = state.journalEntryLines.some(l => l.contact_id === contactId);
    return hasSales || hasPurchases || hasReceipts || hasPayments || hasJournal;
  };

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return state.contacts.filter(c => {
      const matchType = activeTab === 'all' || c.contact_type === activeTab || (activeTab === 'both' && c.contact_type === 'both');
      const matchSearch = !searchTerm || c.name.includes(searchTerm) || c.phone.includes(searchTerm) || c.email.includes(searchTerm);
      const matchActive = showActiveOnly ? c.is_active : true;
      const matchGroup = selectedGroup === 'all' || (c.group_id || '') === selectedGroup;
      return matchType && matchSearch && matchActive && matchGroup;
    });
  }, [state.contacts, activeTab, searchTerm, showActiveOnly, selectedGroup]);

  // Stats
  const totalCustomers = state.contacts.filter(c => c.contact_type === 'customer' || c.contact_type === 'both').length;
  const totalSuppliers = state.contacts.filter(c => c.contact_type === 'supplier' || c.contact_type === 'both').length;
  const activeContacts = state.contacts.filter(c => c.is_active).length;
  const inactiveContacts = state.contacts.filter(c => !c.is_active).length;

  // ========== Contact CRUD ==========
  const resetContactForm = () => {
    setFormData({ contact_type: 'customer', name: '', phone: '', phone2: '', email: '', address: '', tax_number: '', credit_limit: 0, opening_balance: 0, notes: '', group_id: '', price_list_id: '' });
    setEditingContact(null);
  };

  const openAddContact = () => {
    resetContactForm();
    setShowContactDialog(true);
  };

  const openEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      contact_type: contact.contact_type,
      name: contact.name,
      phone: contact.phone,
      phone2: contact.phone2,
      email: contact.email,
      address: contact.address,
      tax_number: contact.tax_number,
      credit_limit: contact.credit_limit,
      opening_balance: contact.opening_balance,
      notes: contact.notes,
      group_id: contact.group_id || '',
      price_list_id: contact.price_list_id || '',
    });
    setShowContactDialog(true);
  };

  const handleSaveContact = () => {
    if (editingContact) {
      const updated: Contact = { ...editingContact, ...formData };
      dispatch({ type: 'UPDATE_CONTACT', payload: updated });
      toast.success('تم تعديل جهة الاتصال بنجاح');
    } else {
      const contactId = uid();
      const accountId = uid();
      const isCustomer = formData.contact_type === 'customer' || formData.contact_type === 'both';
      const parentAccountId = isCustomer ? 'a7' : 'l3';
      const existingChildren = state.accounts.filter(a => a.parent_id === parentAccountId);
      const nextCode = isCustomer
        ? `1105-${String(existingChildren.length + 1).padStart(3, '0')}`
        : `2101-${String(existingChildren.length + 1).padStart(3, '0')}`;

      const newAccount: Account = {
        id: accountId, account_code: nextCode, account_name: formData.name,
        account_type: isCustomer ? 'assets' : 'liabilities',
        parent_id: parentAccountId, level: 4, is_parent: false, is_active: true,
        opening_balance: formData.opening_balance,
        balance_type: isCustomer ? 'debit' : 'credit',
        created_at: new Date().toISOString(),
      };

      const newContact: Contact = {
        id: contactId, ...formData, account_id: accountId, is_active: true,
        created_at: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_CONTACT', payload: { contact: newContact, account: newAccount } });
      toast.success('تم إضافة جهة الاتصال بنجاح');
    }
    setShowContactDialog(false);
    resetContactForm();
  };

  const handleDeleteOrDeactivate = (contact: Contact) => {
    if (hasTransactions(contact.id)) {
      // Deactivate
      dispatch({ type: 'UPDATE_CONTACT', payload: { ...contact, is_active: false } });
      toast.success('تم إيقاف جهة الاتصال (لديها معاملات سابقة)');
    } else {
      setContactToDelete(contact);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (contactToDelete) {
      dispatch({ type: 'DELETE_CONTACT', payload: contactToDelete.id });
      toast.success('تم حذف جهة الاتصال نهائياً');
    }
    setShowDeleteConfirm(false);
    setContactToDelete(null);
  };

  const activateContact = (contact: Contact) => {
    dispatch({ type: 'UPDATE_CONTACT', payload: { ...contact, is_active: true } });
    toast.success('تم تفعيل جهة الاتصال');
  };

  // ========== Excel Import/Export ==========
  const handleExport = () => {
    const data = filteredContacts.map(c => ({
      'الاسم': c.name,
      'النوع': c.contact_type === 'customer' ? 'عميل' : c.contact_type === 'supplier' ? 'مورد' : 'عميل ومورد',
      'الهاتف': c.phone,
      'هاتف إضافي': c.phone2,
      'البريد الإلكتروني': c.email,
      'العنوان': c.address,
      'الرقم الضريبي': c.tax_number,
      'حد الائتمان': c.credit_limit,
      'الرصيد الافتتاحي': c.opening_balance,
      'ملاحظات': c.notes,
      'الحالة': c.is_active ? 'نشط' : 'غير نشط',
      'المجموعة': contactGroups.find(g => g.id === c.group_id)?.name || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'جهات الاتصال');
    XLSX.writeFile(wb, 'جهات_الاتصال.xlsx');
    toast.success('تم تصدير البيانات بنجاح');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName]);

        const newContacts: Contact[] = [];
        const newAccounts: Account[] = [];
        let counter = state.contacts.length;

        rows.forEach((row) => {
          const name = row['الاسم'] || row['name'] || '';
          if (!name) return;

          const typeStr = row['النوع'] || row['type'] || 'عميل';
          let contact_type: ContactType = 'customer';
          if (typeStr === 'مورد' || typeStr === 'supplier') contact_type = 'supplier';
          else if (typeStr === 'عميل ومورد' || typeStr === 'both') contact_type = 'both';

          const contactId = uid();
          const accountId = uid();
          counter++;
          const isCustomer = contact_type === 'customer' || contact_type === 'both';
          const parentAccountId = isCustomer ? 'a7' : 'l3';
          const existingChildren = state.accounts.filter(a => a.parent_id === parentAccountId).length + newAccounts.filter(a => a.parent_id === parentAccountId).length;
          const nextCode = isCustomer
            ? `1105-${String(existingChildren + 1).padStart(3, '0')}`
            : `2101-${String(existingChildren + 1).padStart(3, '0')}`;

          newAccounts.push({
            id: accountId, account_code: nextCode, account_name: name,
            account_type: isCustomer ? 'assets' : 'liabilities',
            parent_id: parentAccountId, level: 4, is_parent: false, is_active: true,
            opening_balance: Number(row['الرصيد الافتتاحي'] || row['opening_balance'] || 0),
            balance_type: isCustomer ? 'debit' : 'credit',
            created_at: new Date().toISOString(),
          });

          newContacts.push({
            id: contactId, contact_type, name,
            phone: String(row['الهاتف'] || row['phone'] || ''),
            phone2: String(row['هاتف إضافي'] || row['phone2'] || ''),
            email: String(row['البريد الإلكتروني'] || row['email'] || ''),
            address: String(row['العنوان'] || row['address'] || ''),
            tax_number: String(row['الرقم الضريبي'] || row['tax_number'] || ''),
            credit_limit: Number(row['حد الائتمان'] || row['credit_limit'] || 0),
            account_id: accountId,
            opening_balance: Number(row['الرصيد الافتتاحي'] || row['opening_balance'] || 0),
            notes: String(row['ملاحظات'] || row['notes'] || ''),
            is_active: true, group_id: '', price_list_id: '',
            created_at: new Date().toISOString(),
          });
        });

        if (newContacts.length > 0) {
          dispatch({ type: 'BULK_ADD_CONTACTS', payload: { contacts: newContacts, accounts: newAccounts } });
          toast.success(`تم استيراد ${newContacts.length} جهة اتصال بنجاح`);
        } else {
          toast.error('لم يتم العثور على بيانات صالحة في الملف');
        }
      } catch (err) {
        console.log('Import error:', err);
        toast.error('حدث خطأ أثناء استيراد الملف');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ========== Groups ==========
  const openAddGroup = () => {
    setEditingGroup(null);
    setGroupForm({ name: '', description: '', contact_type: 'all' });
    setShowGroupDialog(true);
  };

  const openEditGroup = (group: ContactGroup) => {
    setEditingGroup(group);
    setGroupForm({ name: group.name, description: group.description, contact_type: group.contact_type });
    setShowGroupDialog(true);
  };

  const handleSaveGroup = () => {
    if (editingGroup) {
      dispatch({ type: 'UPDATE_CONTACT_GROUP', payload: { ...editingGroup, ...groupForm } });
      toast.success('تم تعديل المجموعة');
    } else {
      dispatch({
        type: 'ADD_CONTACT_GROUP', payload: {
          id: uid(), ...groupForm, created_at: new Date().toISOString(),
        }
      });
      toast.success('تم إضافة المجموعة');
    }
    setShowGroupDialog(false);
  };

  const deleteGroup = (id: string) => {
    dispatch({ type: 'DELETE_CONTACT_GROUP', payload: id });
    toast.success('تم حذف المجموعة');
  };

  // ========== Price Lists ==========
  const openAddPriceList = () => {
    setEditingPriceList(null);
    setPriceListForm({ name: '', contact_type: 'customer', description: '', items: [] });
    setShowPriceListDialog(true);
  };

  const openEditPriceList = (pl: PriceList) => {
    setEditingPriceList(pl);
    setPriceListForm({ name: pl.name, contact_type: pl.contact_type, description: pl.description, items: [...pl.items] });
    setShowPriceListDialog(true);
  };

  const handleSavePriceList = () => {
    if (editingPriceList) {
      dispatch({ type: 'UPDATE_PRICE_LIST', payload: { ...editingPriceList, ...priceListForm } });
      toast.success('تم تعديل قائمة الأسعار');
    } else {
      dispatch({
        type: 'ADD_PRICE_LIST', payload: {
          id: uid(), ...priceListForm, is_active: true, created_at: new Date().toISOString(),
        }
      });
      toast.success('تم إضافة قائمة الأسعار');
    }
    setShowPriceListDialog(false);
  };

  const addPriceListItem = () => {
    setPriceListForm({ ...priceListForm, items: [...priceListForm.items, { item_id: '', price: 0 }] });
  };

  const removePriceListItem = (idx: number) => {
    setPriceListForm({ ...priceListForm, items: priceListForm.items.filter((_, i) => i !== idx) });
  };

  const updatePriceListItem = (idx: number, field: 'item_id' | 'price', value: string | number) => {
    const updated = [...priceListForm.items];
    updated[idx] = { ...updated[idx], [field]: value };
    setPriceListForm({ ...priceListForm, items: updated });
  };

  // ========== Statement ==========
  const openStatement = (contact: Contact) => {
    setSelectedContact(contact);
    setStatementType('summary');
    setShowStatementDialog(true);
  };

  const getContactStatement = (contact: Contact) => {
    const account = state.accounts.find(a => a.id === contact.account_id);
    if (!account) return { entries: [], totalDebit: 0, totalCredit: 0, balance: 0, openingBalance: 0 };

    const ledgerLines = getAccountLedger(contact.account_id);
    const entries = ledgerLines.map(line => {
      const je = state.journalEntries.find(e => e.id === line.journal_entry_id);
      return { ...line, date: je?.entry_date || '', entryDescription: je?.description || '', source_type: je?.source_type || '', source_id: je?.source_id || '' };
    });

    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    const openingBalance = account.opening_balance;
    const isDebitNature = account.balance_type === 'debit';
    const balance = isDebitNature ? openingBalance + totalDebit - totalCredit : openingBalance + totalCredit - totalDebit;

    return { entries, totalDebit, totalCredit, balance, openingBalance };
  };

  const getDetailedStatement = (contact: Contact) => {
    const salesInvs = state.salesInvoices.filter(i => i.contact_id === contact.id);
    const purchaseInvs = state.purchaseInvoices.filter(i => i.contact_id === contact.id);
    const receipts = state.receipts.filter(r => r.contact_id === contact.id);
    const payments = state.payments.filter(p => p.contact_id === contact.id);

    type DetailRow = { date: string; type: string; ref: string; description: string; items?: { name: string; qty: number; price: number; total: number }[]; debit: number; credit: number };
    const rows: DetailRow[] = [];

    salesInvs.forEach(inv => {
      const items = state.salesInvoiceItems.filter(i => i.invoice_id === inv.id).map(i => ({
        name: i.item_name, qty: i.quantity, price: i.unit_price, total: i.total,
      }));
      rows.push({ date: inv.invoice_date, type: 'فاتورة بيع', ref: inv.invoice_number, description: inv.notes, items, debit: inv.total_amount, credit: 0 });
    });

    purchaseInvs.forEach(inv => {
      const items = state.purchaseInvoiceItems.filter(i => i.invoice_id === inv.id).map(i => ({
        name: i.item_name, qty: i.quantity, price: i.unit_price, total: i.total,
      }));
      rows.push({ date: inv.invoice_date, type: 'فاتورة شراء', ref: inv.invoice_number, description: inv.notes, items, debit: 0, credit: inv.total_amount });
    });

    receipts.forEach(r => {
      rows.push({ date: r.receipt_date, type: 'سند قبض', ref: r.receipt_number, description: r.description, debit: 0, credit: r.amount });
    });

    payments.forEach(p => {
      rows.push({ date: p.payment_date, type: 'سند صرف', ref: p.payment_number, description: p.description, debit: p.amount, credit: 0 });
    });

    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
  };

  const typeLabel = (t: ContactType) => t === 'customer' ? 'عميل' : t === 'supplier' ? 'مورد' : 'عميل ومورد';
  const typeColor = (t: ContactType) => t === 'customer' ? 'bg-blue-100 text-blue-700' : t === 'supplier' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] text-foreground font-bold">جهات الاتصال</h1>
          <p className="text-[12px] text-muted-foreground">إدارة العملاء والموردين والمجموعات وقوائم الأسعار</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 text-[12px]">
            <Upload className="w-3.5 h-3.5" />
            استيراد Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 text-[12px]">
            <Download className="w-3.5 h-3.5" />
            تصدير Excel
          </Button>
          <Button onClick={openAddContact} className="gap-2 bg-blue-600 hover:bg-blue-700 text-[12px]" size="sm">
            <Plus className="w-3.5 h-3.5" />
            إضافة جهة اتصال
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <div className="text-[20px] font-bold text-blue-600">{totalCustomers}</div>
          <div className="text-[11px] text-muted-foreground">عملاء</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[20px] font-bold text-orange-600">{totalSuppliers}</div>
          <div className="text-[11px] text-muted-foreground">موردين</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[20px] font-bold text-green-600">{activeContacts}</div>
          <div className="text-[11px] text-muted-foreground">نشطين</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-[20px] font-bold text-red-500">{inactiveContacts}</div>
          <div className="text-[11px] text-muted-foreground">غير نشطين</div>
        </CardContent></Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="contacts" className="gap-2 text-[12px]"><Users className="w-3.5 h-3.5" /> جهات الاتصال</TabsTrigger>
          <TabsTrigger value="groups" className="gap-2 text-[12px]"><FolderOpen className="w-3.5 h-3.5" /> المجموعات</TabsTrigger>
          <TabsTrigger value="pricelists" className="gap-2 text-[12px]"><Tag className="w-3.5 h-3.5" /> قوائم الأسعار</TabsTrigger>
        </TabsList>

        {/* ==================== Contacts Tab ==================== */}
        <TabsContent value="contacts" className="space-y-3 mt-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-[11px] h-7">الكل ({state.contacts.length})</TabsTrigger>
                <TabsTrigger value="customer" className="text-[11px] h-7">العملاء</TabsTrigger>
                <TabsTrigger value="supplier" className="text-[11px] h-7">الموردين</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="بحث بالاسم أو الهاتف أو البريد..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-9 h-8 text-[12px]" />
            </div>

            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-[150px] h-8 text-[12px]"><SelectValue placeholder="المجموعة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المجموعات</SelectItem>
                {contactGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button variant={showActiveOnly ? 'default' : 'outline'} size="sm" className="h-8 text-[11px] gap-1" onClick={() => setShowActiveOnly(!showActiveOnly)}>
              {showActiveOnly ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showActiveOnly ? 'النشطين فقط' : 'الكل'}
            </Button>
          </div>

          {/* Contact Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px]">الاسم</TableHead>
                    <TableHead className="text-[12px]">النوع</TableHead>
                    <TableHead className="text-[12px]">الهاتف</TableHead>
                    <TableHead className="text-[12px] hidden md:table-cell">المجموعة</TableHead>
                    <TableHead className="text-[12px] hidden lg:table-cell">العنوان</TableHead>
                    <TableHead className="text-[12px]">الرصيد</TableHead>
                    <TableHead className="text-[12px]">الحالة</TableHead>
                    <TableHead className="text-[12px] w-[60px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map(contact => {
                    const balance = getAccountBalance(contact.account_id);
                    const group = contactGroups.find(g => g.id === contact.group_id);
                    return (
                      <TableRow key={contact.id} className={!contact.is_active ? 'opacity-50' : ''}>
                        <TableCell className="text-[12px] font-medium">{contact.name}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${typeColor(contact.contact_type)}`}>{typeLabel(contact.contact_type)}</Badge></TableCell>
                        <TableCell className="text-[12px]">{contact.phone}</TableCell>
                        <TableCell className="text-[12px] hidden md:table-cell">{group?.name || '-'}</TableCell>
                        <TableCell className="text-[12px] hidden lg:table-cell max-w-[150px] truncate">{contact.address || '-'}</TableCell>
                        <TableCell className="text-[12px] font-medium">
                          <span className={balance.balance > 0 ? 'text-green-600' : balance.balance < 0 ? 'text-red-600' : ''}>
                            {formatCurrency(balance.balance)} ج.م
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${contact.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {contact.is_active ? 'نشط' : 'موقوف'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical className="w-3.5 h-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEditContact(contact)} className="gap-2 text-[12px]">
                                <Edit className="w-3.5 h-3.5" /> تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openStatement(contact)} className="gap-2 text-[12px]">
                                <FileText className="w-3.5 h-3.5" /> كشف حساب
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {contact.is_active ? (
                                <DropdownMenuItem onClick={() => handleDeleteOrDeactivate(contact)} className="gap-2 text-[12px] text-red-600">
                                  {hasTransactions(contact.id) ? <Ban className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                  {hasTransactions(contact.id) ? 'إيقاف' : 'حذف'}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => activateContact(contact)} className="gap-2 text-[12px] text-green-600">
                                  <Check className="w-3.5 h-3.5" /> تفعيل
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredContacts.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8 text-[13px]">لا توجد جهات اتصال</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Groups Tab ==================== */}
        <TabsContent value="groups" className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <h2 className="text-[15px] font-bold">مجموعات جهات الاتصال</h2>
            <Button onClick={openAddGroup} className="gap-2 bg-blue-600 hover:bg-blue-700 text-[12px]" size="sm">
              <Plus className="w-3.5 h-3.5" /> إضافة مجموعة
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contactGroups.map(group => {
              const count = state.contacts.filter(c => c.group_id === group.id).length;
              return (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[14px] font-bold">{group.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">{group.description || 'بدون وصف'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="text-[10px] bg-gray-100 text-gray-700">
                            {group.contact_type === 'all' ? 'الكل' : group.contact_type === 'customer' ? 'عملاء' : group.contact_type === 'supplier' ? 'موردين' : 'عملاء وموردين'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{count} جهة اتصال</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditGroup(group)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteGroup(group.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {contactGroups.length === 0 && (
              <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground text-[13px]">
                لا توجد مجموعات - أضف مجموعة لتنظيم جهات الاتصال
              </CardContent></Card>
            )}
          </div>
        </TabsContent>

        {/* ==================== Price Lists Tab ==================== */}
        <TabsContent value="pricelists" className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <h2 className="text-[15px] font-bold">قوائم الأسعار</h2>
            <Button onClick={openAddPriceList} className="gap-2 bg-blue-600 hover:bg-blue-700 text-[12px]" size="sm">
              <Plus className="w-3.5 h-3.5" /> إضافة قائمة أسعار
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {priceLists.map(pl => {
              const linkedContacts = state.contacts.filter(c => c.price_list_id === pl.id).length;
              return (
                <Card key={pl.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[14px] font-bold">{pl.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">{pl.description || 'بدون وصف'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-[10px] ${pl.contact_type === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {pl.contact_type === 'customer' ? 'بيع' : 'شراء'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{pl.items.length} صنف</span>
                          <span className="text-[11px] text-muted-foreground">{linkedContacts} جهة اتصال</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditPriceList(pl)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { dispatch({ type: 'DELETE_PRICE_LIST', payload: pl.id }); toast.success('تم حذف قائمة الأسعار'); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {priceLists.length === 0 && (
              <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground text-[13px]">
                لا توجد قوائم أسعار - أضف قائمة لتخصيص أسعار لكل عميل أو مورد
              </CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ==================== Contact Dialog ==================== */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingContact ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال'}</DialogTitle>
            <DialogDescription className="sr-only">نموذج جهة اتصال</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">النوع</label>
              <Select value={formData.contact_type} onValueChange={v => setFormData({ ...formData, contact_type: v as ContactType })}>
                <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">عميل</SelectItem>
                  <SelectItem value="supplier">مورد</SelectItem>
                  <SelectItem value="both">عميل ومورد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">الاسم *</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="اسم العميل / المورد" className="h-8 text-[12px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">الهاتف</label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-8 text-[12px]" />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">هاتف إضافي</label>
                <Input value={formData.phone2} onChange={e => setFormData({ ...formData, phone2: e.target.value })} className="h-8 text-[12px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">البريد الإلكتروني</label>
                <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-8 text-[12px]" />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">الرقم الضريبي</label>
                <Input value={formData.tax_number} onChange={e => setFormData({ ...formData, tax_number: e.target.value })} className="h-8 text-[12px]" />
              </div>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">العنوان</label>
              <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="h-8 text-[12px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">المجموعة</label>
                <Select value={formData.group_id || 'none'} onValueChange={v => setFormData({ ...formData, group_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="بدون مجموعة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مجموعة</SelectItem>
                    {contactGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">قائمة الأسعار</label>
                <Select value={formData.price_list_id || 'none'} onValueChange={v => setFormData({ ...formData, price_list_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="بدون قائمة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون قائمة</SelectItem>
                    {priceLists.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">الرصيد الافتتاحي</label>
                <Input type="number" value={formData.opening_balance} onChange={e => setFormData({ ...formData, opening_balance: Number(e.target.value) })} className="h-8 text-[12px]" disabled={!!editingContact} />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">حد الائتمان</label>
                <Input type="number" value={formData.credit_limit} onChange={e => setFormData({ ...formData, credit_limit: Number(e.target.value) })} className="h-8 text-[12px]" />
              </div>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">ملاحظات</label>
              <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="text-[12px] min-h-[60px]" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowContactDialog(false)} size="sm">إلغاء</Button>
            <Button onClick={handleSaveContact} className="bg-blue-600 hover:bg-blue-700" size="sm" disabled={!formData.name}>
              {editingContact ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Group Dialog ==================== */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingGroup ? 'تعديل المجموعة' : 'إضافة مجموعة'}</DialogTitle>
            <DialogDescription className="sr-only">نموذج مجموعة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">اسم المجموعة *</label>
              <Input value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} className="h-8 text-[12px]" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">نوع جهات الاتصال</label>
              <Select value={groupForm.contact_type} onValueChange={v => setGroupForm({ ...groupForm, contact_type: v as any })}>
                <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="customer">عملاء</SelectItem>
                  <SelectItem value="supplier">موردين</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">وصف</label>
              <Textarea value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} className="text-[12px] min-h-[60px]" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGroupDialog(false)} size="sm">إلغاء</Button>
            <Button onClick={handleSaveGroup} className="bg-blue-600 hover:bg-blue-700" size="sm" disabled={!groupForm.name}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Price List Dialog ==================== */}
      <Dialog open={showPriceListDialog} onOpenChange={setShowPriceListDialog}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingPriceList ? 'تعديل قائمة الأسعار' : 'إضافة قائمة أسعار'}</DialogTitle>
            <DialogDescription className="sr-only">نموذج قائمة أسعار</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">اسم القائمة *</label>
                <Input value={priceListForm.name} onChange={e => setPriceListForm({ ...priceListForm, name: e.target.value })} className="h-8 text-[12px]" />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">النوع</label>
                <Select value={priceListForm.contact_type} onValueChange={v => setPriceListForm({ ...priceListForm, contact_type: v as any })}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">قائمة بيع</SelectItem>
                    <SelectItem value="supplier">قائمة شراء</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">وصف</label>
              <Input value={priceListForm.description} onChange={e => setPriceListForm({ ...priceListForm, description: e.target.value })} className="h-8 text-[12px]" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-medium">الأصناف والأسعار</label>
                <Button variant="outline" size="sm" onClick={addPriceListItem} className="h-7 text-[11px] gap-1">
                  <Plus className="w-3 h-3" /> إضافة صنف
                </Button>
              </div>
              {priceListForm.items.length > 0 ? (
                <div className="space-y-2 border rounded-lg p-2">
                  {priceListForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Select value={item.item_id} onValueChange={v => updatePriceListItem(idx, 'item_id', v)}>
                        <SelectTrigger className="flex-1 h-8 text-[12px]"><SelectValue placeholder="اختر صنف" /></SelectTrigger>
                        <SelectContent>
                          {state.items.filter(i => i.is_active).map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.item_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" value={item.price} onChange={e => updatePriceListItem(idx, 'price', Number(e.target.value))} className="w-32 h-8 text-[12px]" placeholder="السعر" />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => removePriceListItem(idx)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-3 border rounded-lg">لم يتم إضافة أصناف بعد</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPriceListDialog(false)} size="sm">إلغاء</Button>
            <Button onClick={handleSavePriceList} className="bg-blue-600 hover:bg-blue-700" size="sm" disabled={!priceListForm.name}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Statement Dialog ==================== */}
      <Dialog open={showStatementDialog} onOpenChange={setShowStatementDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">كشف حساب - {selectedContact?.name}</DialogTitle>
            <DialogDescription className="sr-only">كشف حساب جهة الاتصال</DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-3">
              {/* Statement Type Toggle */}
              <div className="flex items-center gap-2">
                <Tabs value={statementType} onValueChange={v => setStatementType(v as any)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="summary" className="text-[11px] h-7 gap-1"><List className="w-3 h-3" /> مختصر</TabsTrigger>
                    <TabsTrigger value="detailed" className="text-[11px] h-7 gap-1"><LayoutGrid className="w-3 h-3" /> تفصيلي بالأصناف</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="mr-auto flex items-center gap-3">
                  <div className="text-[11px]">
                    <span className="text-muted-foreground">النوع: </span>
                    <Badge className={`text-[10px] ${typeColor(selectedContact.contact_type)}`}>{typeLabel(selectedContact.contact_type)}</Badge>
                  </div>
                </div>
              </div>

              {/* Summary info */}
              {(() => {
                const stmt = getContactStatement(selectedContact);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Card><CardContent className="p-2 text-center">
                      <div className="text-[10px] text-muted-foreground">الرصيد الافتتاحي</div>
                      <div className="text-[14px] font-bold">{formatCurrency(stmt.openingBalance)}</div>
                    </CardContent></Card>
                    <Card><CardContent className="p-2 text-center">
                      <div className="text-[10px] text-muted-foreground">إجمالي مدين</div>
                      <div className="text-[14px] font-bold text-green-600">{formatCurrency(stmt.totalDebit)}</div>
                    </CardContent></Card>
                    <Card><CardContent className="p-2 text-center">
                      <div className="text-[10px] text-muted-foreground">إجمالي دائن</div>
                      <div className="text-[14px] font-bold text-red-600">{formatCurrency(stmt.totalCredit)}</div>
                    </CardContent></Card>
                    <Card><CardContent className="p-2 text-center">
                      <div className="text-[10px] text-muted-foreground">الرصيد الحالي</div>
                      <div className={`text-[14px] font-bold ${stmt.balance > 0 ? 'text-green-600' : stmt.balance < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(stmt.balance)} ج.م
                      </div>
                    </CardContent></Card>
                  </div>
                );
              })()}

              {/* Statement Table */}
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                {statementType === 'summary' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] sticky top-0 bg-background">التاريخ</TableHead>
                        <TableHead className="text-[11px] sticky top-0 bg-background">البيان</TableHead>
                        <TableHead className="text-[11px] sticky top-0 bg-background">مدين</TableHead>
                        <TableHead className="text-[11px] sticky top-0 bg-background">دائن</TableHead>
                        <TableHead className="text-[11px] sticky top-0 bg-background">الرصيد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const stmt = getContactStatement(selectedContact);
                        const account = state.accounts.find(a => a.id === selectedContact.account_id);
                        let runningBalance = account?.opening_balance || 0;
                        const isDebitNature = account?.balance_type === 'debit';

                        return (
                          <>
                            <TableRow className="bg-gray-50">
                              <TableCell className="text-[11px]">-</TableCell>
                              <TableCell className="text-[11px] font-medium">رصيد افتتاحي</TableCell>
                              <TableCell className="text-[11px]">-</TableCell>
                              <TableCell className="text-[11px]">-</TableCell>
                              <TableCell className="text-[11px] font-medium">{formatCurrency(runningBalance)}</TableCell>
                            </TableRow>
                            {stmt.entries.map((entry, idx) => {
                              runningBalance = isDebitNature
                                ? runningBalance + entry.debit - entry.credit
                                : runningBalance + entry.credit - entry.debit;
                              return (
                                <TableRow key={idx}>
                                  <TableCell className="text-[11px]">{entry.date}</TableCell>
                                  <TableCell className="text-[11px]">{entry.description || entry.entryDescription}</TableCell>
                                  <TableCell className="text-[11px]">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                                  <TableCell className="text-[11px]">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                                  <TableCell className={`text-[11px] font-medium ${runningBalance > 0 ? 'text-green-600' : runningBalance < 0 ? 'text-red-600' : ''}`}>
                                    {formatCurrency(runningBalance)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </>
                        );
                      })()}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] sticky top-0 bg-background">التاريخ</TableHead>
                        <TableHead className="text-[11px] sticky top-0 bg-background">النوع</TableHead>
                        <TableHead className="text-[11px] sticky top-0 bg-background">المرجع</TableHead>
                        <TableHead className="text-[11px] sticky top-0 bg-background">الأصناف</TableHead>
                        <TableHead className="text-[11px] sticky top-0 bg-background">مدين</TableHead>
                        <TableHead className="text-[11px] sticky top-0 bg-background">دائن</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const rows = getDetailedStatement(selectedContact);
                        if (rows.length === 0) return (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-[12px]">لا توجد حركات</TableCell></TableRow>
                        );
                        return rows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-[11px]">{row.date}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${row.type.includes('بيع') ? 'bg-blue-100 text-blue-700' : row.type.includes('شراء') ? 'bg-orange-100 text-orange-700' : row.type.includes('قبض') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {row.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[11px]">{row.ref}</TableCell>
                            <TableCell className="text-[11px]">
                              {row.items && row.items.length > 0 ? (
                                <div className="space-y-0.5">
                                  {row.items.map((item, i) => (
                                    <div key={i} className="text-[10px] bg-gray-50 rounded px-1.5 py-0.5">
                                      {item.name} ({item.qty} x {formatCurrency(item.price)} = {formatCurrency(item.total)})
                                    </div>
                                  ))}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-[11px] text-green-600">{row.debit > 0 ? formatCurrency(row.debit) : '-'}</TableCell>
                            <TableCell className="text-[11px] text-red-600">{row.credit > 0 ? formatCurrency(row.credit) : '-'}</TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Confirm Dialog ==================== */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[15px] flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> تأكيد الحذف
            </DialogTitle>
            <DialogDescription className="text-[12px]">
              هل أنت متأكد من حذف جهة الاتصال "{contactToDelete?.name}" نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} size="sm">إلغاء</Button>
            <Button variant="destructive" onClick={confirmDelete} size="sm">حذف نهائي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
