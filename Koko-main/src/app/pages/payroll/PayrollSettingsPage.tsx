import React, { useState } from 'react';
import { Save, Download, Plus, Trash2, Calendar } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import type { PayPeriodType, Holiday } from '../../types/payroll';

export function PayrollSettingsPage() {
  const { settings, holidays, updateSettings, addHoliday, deleteHoliday } = usePayroll();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    holiday_date: '',
    name: '',
    is_paid: true,
  });

  const handleSaveSettings = () => {
    updateSettings(localSettings);
    alert('تم حفظ الإعدادات بنجاح');
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.holiday_date || !holidayForm.name) return;

    addHoliday(holidayForm);
    setHolidayForm({ holiday_date: '', name: '', is_paid: true });
    setShowHolidayForm(false);
  };

  const daysOfWeek = [
    { value: 0, label: 'الأحد' },
    { value: 1, label: 'الاثنين' },
    { value: 2, label: 'الثلاثاء' },
    { value: 3, label: 'الأربعاء' },
    { value: 4, label: 'الخميس' },
    { value: 5, label: 'الجمعة' },
    { value: 6, label: 'السبت' },
  ];

  const toggleWeeklyOffDay = (day: number) => {
    const current = localSettings.weekly_off_days;
    if (current.includes(day)) {
      setLocalSettings(prev => ({
        ...prev,
        weekly_off_days: current.filter(d => d !== day),
      }));
    } else {
      setLocalSettings(prev => ({
        ...prev,
        weekly_off_days: [...current, day],
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">إعدادات المرتبات</h1>
          <p className="text-sm text-muted-foreground">تكوين النظام وضبط الإعدادات العامة</p>
        </div>
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          حفظ الإعدادات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg border border-border p-5">
            <h2 className="text-lg text-foreground mb-4 pb-3 border-b border-border">الإعدادات العامة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-foreground mb-2">نوع فترة الراتب</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    localSettings.pay_period_type === 'weekly' ? 'border-blue-500 bg-blue-50' : 'border-border hover:bg-muted'
                  }`}>
                    <input
                      type="radio"
                      name="pay_period_type"
                      value="weekly"
                      checked={localSettings.pay_period_type === 'weekly'}
                      onChange={() => setLocalSettings(prev => ({ ...prev, pay_period_type: 'weekly' }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">أسبوعي</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    localSettings.pay_period_type === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-border hover:bg-muted'
                  }`}>
                    <input
                      type="radio"
                      name="pay_period_type"
                      value="monthly"
                      checked={localSettings.pay_period_type === 'monthly'}
                      onChange={() => setLocalSettings(prev => ({ ...prev, pay_period_type: 'monthly' }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">شهري</span>
                  </label>
                </div>
              </div>

              {localSettings.pay_period_type === 'weekly' && (
                <div>
                  <label className="block text-sm text-foreground mb-1.5">يوم بداية الأسبوع</label>
                  <select
                    value={localSettings.week_start_day}
                    onChange={e => setLocalSettings(prev => ({ ...prev, week_start_day: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {localSettings.pay_period_type === 'monthly' && (
                <div>
                  <label className="block text-sm text-foreground mb-1.5">يوم بداية الشهر المحاسبي</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={localSettings.month_start_day}
                    onChange={e => setLocalSettings(prev => ({ ...prev, month_start_day: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-foreground mb-1.5">أيام العمل الأسبوعية</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={localSettings.working_days_per_week}
                    onChange={e => setLocalSettings(prev => ({ ...prev, working_days_per_week: parseInt(e.target.value) || 6 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">أيام العمل الشهرية</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={localSettings.working_days_per_month}
                    onChange={e => setLocalSettings(prev => ({ ...prev, working_days_per_month: parseInt(e.target.value) || 26 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-1.5">رمز العملة</label>
                <input
                  type="text"
                  value={localSettings.currency_symbol}
                  onChange={e => setLocalSettings(prev => ({ ...prev, currency_symbol: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Weekly Off Days */}
          <div className="bg-white rounded-lg border border-border p-5">
            <h2 className="text-lg text-foreground mb-4 pb-3 border-b border-border">أيام العطلة الأسبوعية</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleWeeklyOffDay(day.value)}
                    className={`p-3 rounded-lg border transition-colors text-xs ${
                      localSettings.weekly_off_days.includes(day.value)
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="weekly_off_paid"
                  checked={localSettings.weekly_off_paid}
                  onChange={e => setLocalSettings(prev => ({ ...prev, weekly_off_paid: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-border rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="weekly_off_paid" className="text-sm text-foreground">
                  أيام العطلة الأسبوعية مدفوعة الأجر
                </label>
              </div>
            </div>
          </div>

          {/* Overtime Settings */}
          <div className="bg-white rounded-lg border border-border p-5">
            <h2 className="text-lg text-foreground mb-4 pb-3 border-b border-border">إعدادات الساعات الإضافية</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-foreground mb-1.5">معامل الساعات الإضافية</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.overtime_multiplier}
                  onChange={e => setLocalSettings(prev => ({ ...prev, overtime_multiplier: parseFloat(e.target.value) || 1.5 }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">مثال: 1.5 يعني ساعة ونصف</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-foreground mb-1.5">الحد الأقصى للساعات الإضافية (أسبوعياً)</label>
                  <input
                    type="number"
                    value={localSettings.max_overtime_hours_per_week}
                    onChange={e => setLocalSettings(prev => ({ ...prev, max_overtime_hours_per_week: parseInt(e.target.value) || 12 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">الحد الأقصى للساعات الإضافية (شهرياً)</label>
                  <input
                    type="number"
                    value={localSettings.max_overtime_hours_per_month}
                    onChange={e => setLocalSettings(prev => ({ ...prev, max_overtime_hours_per_month: parseInt(e.target.value) || 48 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="require_overtime_approval"
                  checked={localSettings.require_overtime_approval}
                  onChange={e => setLocalSettings(prev => ({ ...prev, require_overtime_approval: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-border rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="require_overtime_approval" className="text-sm text-foreground">
                  تتطلب الساعات الإضافية موافقة مسبقة
                </label>
              </div>
            </div>
          </div>

          {/* Advance Settings */}
          <div className="bg-white rounded-lg border border-border p-5">
            <h2 className="text-lg text-foreground mb-4 pb-3 border-b border-border">إعدادات السلف</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-foreground mb-1.5">الحد الأقصى للسلفة (مبلغ ثابت)</label>
                  <input
                    type="number"
                    value={localSettings.max_advance_amount}
                    onChange={e => setLocalSettings(prev => ({ ...prev, max_advance_amount: parseFloat(e.target.value) || 10000 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">الحد الأقصى (مضاعف الراتب)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={localSettings.max_advance_salary_multiple}
                    onChange={e => setLocalSettings(prev => ({ ...prev, max_advance_salary_multiple: parseFloat(e.target.value) || 3 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-1.5">نسبة القسط الافتراضية من الراتب (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={localSettings.default_installment_percentage}
                  onChange={e => setLocalSettings(prev => ({ ...prev, default_installment_percentage: parseInt(e.target.value) || 25 }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-foreground mb-1.5">الحد الأدنى للراتب المتبقي بعد الخصم (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localSettings.minimum_remaining_salary_percentage}
                  onChange={e => setLocalSettings(prev => ({ ...prev, minimum_remaining_salary_percentage: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_deduct_advances"
                  checked={localSettings.auto_deduct_advances}
                  onChange={e => setLocalSettings(prev => ({ ...prev, auto_deduct_advances: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-border rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="auto_deduct_advances" className="text-sm text-foreground">
                  خصم أقساط السلف تلقائياً من الراتب
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Holidays Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-border p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h2 className="text-lg text-foreground">العطل الرسمية</h2>
              <button
                onClick={() => setShowHolidayForm(!showHolidayForm)}
                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showHolidayForm && (
              <form onSubmit={handleAddHoliday} className="space-y-3 mb-4 pb-4 border-b border-border">
                <div>
                  <label className="block text-xs text-foreground mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={holidayForm.holiday_date}
                    onChange={e => setHolidayForm(prev => ({ ...prev, holiday_date: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-foreground mb-1">اسم العطلة</label>
                  <input
                    type="text"
                    value={holidayForm.name}
                    onChange={e => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="holiday_paid"
                    checked={holidayForm.is_paid}
                    onChange={e => setHolidayForm(prev => ({ ...prev, is_paid: e.target.checked }))}
                    className="w-3 h-3 text-blue-600 border-border rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="holiday_paid" className="text-xs text-foreground">
                    عطلة مدفوعة
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHolidayForm(false)}
                    className="px-3 py-1.5 border border-border rounded text-xs hover:bg-muted transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {holidays.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">لا توجد عطل رسمية</p>
              ) : (
                holidays
                  .sort((a, b) => b.holiday_date.localeCompare(a.holiday_date))
                  .map(holiday => (
                    <div
                      key={holiday.id}
                      className="flex items-start justify-between p-2 border border-border rounded-lg hover:bg-muted/30 group"
                    >
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-foreground font-medium">{holiday.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(holiday.holiday_date).toLocaleDateString('ar-EG')}
                          </p>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs mt-1 ${
                            holiday.is_paid ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                          }`}>
                            {holiday.is_paid ? 'مدفوعة' : 'غير مدفوعة'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteHoliday(holiday.id)}
                        className="p-1 rounded hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <button className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-xs">
                <Download className="w-3.5 h-3.5" />
                تحميل قالب Excel للعطل
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
