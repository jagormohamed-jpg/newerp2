import React, { useState, useMemo } from 'react';
import { Clock, Plus, Download, Upload, Save } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import type { HourType } from '../../types/payroll';

export function WorkHoursPage() {
  const { 
    employees, 
    departments,
    workHours,
    settings,
    addWorkHours,
    addBulkWorkHours,
    getWorkHoursByEmployee 
  } = usePayroll();

  const [activeTab, setActiveTab] = useState<'daily' | 'bulk'>('daily');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [clockIn, setClockIn] = useState('08:00');
  const [clockOut, setClockOut] = useState('17:00');
  const [hourType, setHourType] = useState<HourType>('regular');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter to show only hourly workers
  const hourlyWorkers = useMemo(() => {
    return employees.filter(e => e.salary_type === 'hourly' && e.is_active);
  }, [employees]);

  const selectedEmployee = hourlyWorkers.find(e => e.id === selectedEmployeeId);

  // Calculate hours
  const calculateHours = (clockInTime: string, clockOutTime: string): number => {
    const [inHour, inMin] = clockInTime.split(':').map(Number);
    const [outHour, outMin] = clockOutTime.split(':').map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    
    return Math.max(0, (outMinutes - inMinutes) / 60);
  };

  const totalHours = calculateHours(clockIn, clockOut);
  const rate = selectedEmployee 
    ? (hourType === 'overtime' ? selectedEmployee.overtime_rate : selectedEmployee.hourly_rate)
    : 0;
  const amount = totalHours * rate;

  // Get work hours history
  const employeeWorkHours = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return getWorkHoursByEmployee(selectedEmployeeId, startDate, endDate);
  }, [selectedEmployeeId, startDate, endDate, workHours]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || totalHours <= 0) return;

    addWorkHours({
      employee_id: selectedEmployeeId,
      work_date: workDate,
      clock_in: clockIn,
      clock_out: clockOut,
      total_hours: totalHours,
      hour_type: hourType,
      rate,
      amount,
      notes,
    });

    setNotes('');
    alert('تم حفظ ساعات العمل بنجاح');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">ساعات العمل</h1>
          <p className="text-sm text-muted-foreground">تسجيل ساعات عمل العمال بنظام الساعة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-border">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'daily'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            تسجيل يومي
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'bulk'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            تسجيل جماعي / Excel
          </button>
        </div>

        {/* Daily Entry Tab */}
        {activeTab === 'daily' && (
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Employee Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">اختر العامل (بالساعة فقط)</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    required
                  >
                    <option value="">اختر العامل...</option>
                    {hourlyWorkers.map(emp => {
                      const dept = departments.find(d => d.id === emp.department_id);
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} - {dept?.name || 'بدون قسم'} - {emp.hourly_rate} ج.م/ساعة
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">تاريخ العمل</label>
                  <input
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              {selectedEmployee && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                    {selectedEmployee.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">{selectedEmployee.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      كود: {selectedEmployee.employee_code} | عادي: {selectedEmployee.hourly_rate} ج.م/ساعة | إضافي: {selectedEmployee.overtime_rate} ج.م/ساعة
                    </p>
                  </div>
                </div>
              )}

              {/* Time Entry */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">ساعة الحضور</label>
                  <input
                    type="time"
                    value={clockIn}
                    onChange={(e) => setClockIn(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">ساعة الانصراف</label>
                  <input
                    type="time"
                    value={clockOut}
                    onChange={(e) => setClockOut(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">نوع الساعات</label>
                  <select
                    value={hourType}
                    onChange={(e) => setHourType(e.target.value as HourType)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  >
                    <option value="regular">عادي</option>
                    <option value="overtime">إضافي</option>
                  </select>
                </div>
              </div>

              {/* Calculation Display */}
              {selectedEmployee && totalHours > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">إجمالي الساعات</p>
                    <p className="text-lg text-foreground font-medium">{totalHours.toFixed(2)} ساعة</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">السعر/ساعة</p>
                    <p className="text-lg text-foreground font-medium">{rate.toFixed(2)} ج.م</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">النوع</p>
                    <p className="text-lg text-foreground font-medium">
                      {hourType === 'regular' ? 'عادي' : 'إضافي'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
                    <p className="text-lg text-green-700 font-bold">{amount.toFixed(2)} ج.م</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">ملاحظات</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!selectedEmployeeId || totalHours <= 0}
                >
                  <Save className="w-4 h-4" />
                  حفظ ساعات العمل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClockIn('08:00');
                    setClockOut('17:00');
                    setHourType('regular');
                    setNotes('');
                  }}
                  className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  إعادة تعيين
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Entry Tab */}
        {activeTab === 'bulk' && (
          <div className="p-5">
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-50 rounded-full">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg text-foreground mb-2">تسجيل جماعي من Excel</h3>
              <p className="text-sm text-muted-foreground mb-6">
                قم بتنزيل القالب وملء البيانات ثم رفعه مرة أخرى
              </p>
              <div className="flex justify-center gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                  تنزيل قالب Excel
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                  <Upload className="w-4 h-4" />
                  رفع الملف
                </button>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100 max-w-md mx-auto text-right">
                <p className="text-sm text-yellow-900 mb-2">أعمدة القالب المطلوبة:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• كود العامل</li>
                  <li>• التاريخ</li>
                  <li>• ساعة الحضور</li>
                  <li>• ساعة الانصراف</li>
                  <li>• نوع الساعات (عادي/إضافي)</li>
                  <li>• ملاحظات</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {selectedEmployeeId && activeTab === 'daily' && (
        <div className="bg-white rounded-lg border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-lg text-foreground">سجل ساعات العمل</h2>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-lg text-sm"
                placeholder="من تاريخ"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-lg text-sm"
                placeholder="إلى تاريخ"
              />
              <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg hover:bg-muted/30 text-sm">
                <Download className="w-4 h-4" />
                تصدير
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الحضور</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الانصراف</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الساعات</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">النوع</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">السعر</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employeeWorkHours.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      لا توجد ساعات عمل مسجلة لهذا العامل
                    </td>
                  </tr>
                ) : (
                  employeeWorkHours.map(wh => (
                    <tr key={wh.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {new Date(wh.work_date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{wh.clock_in}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{wh.clock_out}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{wh.total_hours.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                          wh.hour_type === 'overtime' 
                            ? 'bg-orange-50 text-orange-700' 
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {wh.hour_type === 'overtime' ? 'إضافي' : 'عادي'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{wh.rate.toFixed(2)} ج.م</td>
                      <td className="px-4 py-3 text-sm text-green-700 font-medium">
                        {wh.amount.toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {employeeWorkHours.length > 0 && (
                <tfoot className="bg-muted/50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm text-foreground font-medium text-right">
                      الإجمالي:
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-bold">
                      {employeeWorkHours.reduce((sum, wh) => sum + wh.total_hours, 0).toFixed(2)} ساعة
                    </td>
                    <td colSpan={2}></td>
                    <td className="px-4 py-3 text-sm text-green-700 font-bold">
                      {employeeWorkHours.reduce((sum, wh) => sum + wh.amount, 0).toLocaleString()} ج.م
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
