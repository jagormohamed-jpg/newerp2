import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import {
  Building2, Plus, Pencil, Trash2, CheckCircle2, XCircle,
  MapPin, Phone, GitBranch, Star, Loader2, X, Save
} from 'lucide-react';

interface Branch {
  id: string;
  org_id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
}

const emptyBranch = (): Omit<Branch, 'id' | 'org_id' | 'created_at'> => ({
  name: '',
  code: '',
  address: '',
  city: '',
  phone: '',
  is_main: false,
  is_active: true,
});

export function BranchManagementPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyBranch());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load branches ────────────────────────────────────────
  const loadBranches = async () => {
    if (!orgId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('org_id', orgId)
      .order('is_main', { ascending: false })
      .order('name');
    if (error) {
      toast.error('فشل تحميل الفروع');
    } else {
      setBranches(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadBranches(); }, [orgId]);

  // ── Open modal ───────────────────────────────────────────
  const openAdd = () => {
    setEditingBranch(null);
    setForm(emptyBranch());
    setModalOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditingBranch(b);
    setForm({ name: b.name, code: b.code, address: b.address || '', city: b.city || '', phone: b.phone || '', is_main: b.is_main, is_active: b.is_active });
    setModalOpen(true);
  };

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('اسم الفرع مطلوب'); return; }
    if (!form.code.trim()) { toast.error('كود الفرع مطلوب'); return; }
    if (!orgId) return;

    setSaving(true);
    try {
      if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update({ ...form })
          .eq('id', editingBranch.id);
        if (error) throw error;
        toast.success('تم تحديث الفرع');
      } else {
        const { error } = await supabase
          .from('branches')
          .insert({ ...form, org_id: orgId });
        if (error) throw error;
        toast.success('تم إضافة الفرع');
      }
      setModalOpen(false);
      loadBranches();
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async (b: Branch) => {
    if (b.is_main) { toast.error('لا يمكن حذف الفرع الرئيسي'); return; }
    if (!confirm(`هل أنت متأكد من حذف فرع "${b.name}"؟`)) return;
    setDeletingId(b.id);
    const { error } = await supabase.from('branches').delete().eq('id', b.id);
    if (error) toast.error('فشل حذف الفرع');
    else { toast.success('تم حذف الفرع'); loadBranches(); }
    setDeletingId(null);
  };

  // ── Toggle active ────────────────────────────────────────
  const toggleActive = async (b: Branch) => {
    if (b.is_main) { toast.error('لا يمكن تعطيل الفرع الرئيسي'); return; }
    const { error } = await supabase
      .from('branches')
      .update({ is_active: !b.is_active })
      .eq('id', b.id);
    if (error) toast.error('فشل تحديث الحالة');
    else loadBranches();
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            إدارة الفروع
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {organization?.name} — {branches.length} {branches.length === 1 ? 'فرع' : 'فروع'}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          فرع جديد
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <GitBranch className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">لا توجد فروع بعد</p>
          <button onClick={openAdd} className="mt-3 text-sm text-blue-600 hover:underline">أضف أول فرع</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map(b => (
            <div
              key={b.id}
              className={`relative bg-card border rounded-xl p-5 transition-all ${
                b.is_main ? 'border-blue-400 shadow-sm shadow-blue-100' : 'border-border hover:border-blue-200'
              } ${!b.is_active ? 'opacity-60' : ''}`}
            >
              {/* Main badge */}
              {b.is_main && (
                <span className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                  <Star className="w-3 h-3" /> رئيسي
                </span>
              )}

              {/* Status dot */}
              <span className={`absolute top-3.5 right-3.5 w-2 h-2 rounded-full ${b.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />

              <div className="pt-1">
                <h3 className="text-[15px] font-bold text-foreground">{b.name}</h3>
                <span className="text-[11px] font-mono text-muted-foreground bg-accent px-1.5 py-0.5 rounded">{b.code}</span>
              </div>

              <div className="mt-3 space-y-1 text-[13px] text-muted-foreground">
                {b.city && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {b.city}{b.address ? ` — ${b.address}` : ''}
                  </p>
                )}
                {b.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {b.phone}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => openEdit(b)}
                  className="flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-3.5 h-3.5" /> تعديل
                </button>
                <button
                  onClick={() => toggleActive(b)}
                  disabled={b.is_main}
                  className={`flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-lg transition-colors ${
                    b.is_main ? 'opacity-30 cursor-not-allowed' :
                    b.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {b.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {b.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
                {!b.is_main && (
                  <button
                    onClick={() => handleDelete(b)}
                    disabled={deletingId === b.id}
                    className="flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors mr-auto"
                  >
                    {deletingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border" dir="rtl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-bold text-foreground text-[15px]">
                {editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground block mb-1">اسم الفرع *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="الفرع الرئيسي"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground block mb-1">كود الفرع *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="BR001"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground block mb-1">المدينة</label>
                  <input
                    type="text"
                    value={form.city || ''}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="القاهرة"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground block mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={form.phone || ''}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="010xxxxxxxx"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1">العنوان التفصيلي</label>
                <input
                  type="text"
                  value={form.address || ''}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="شارع ..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">فرع نشط</span>
                </label>
                {!editingBranch?.is_main && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_main}
                      onChange={e => setForm(f => ({ ...f, is_main: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-foreground">فرع رئيسي</span>
                  </label>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingBranch ? 'حفظ التعديلات' : 'إضافة الفرع'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
