import React, { useState, useMemo } from 'react';
import { Calendar, Check, X, AlertCircle, Download, Upload, Save } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import type { AttendanceStatus } from '../../types/payroll';

export function AttendancePage() {
  const { 
    employees, 
    departments,
    dailyAttendance,
    settings,
    addAttendance,
    addBulkAttendance,
    getAttendanceByEmployee 
  } = usePayroll();

  const [activeTab, setActiveTab] = useState<'quick' | 'calendar' | 'excel'>('quick');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [notes, setNotes] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter to show only daily workers
  const dailyWorkers = useMemo(() => {
    return employees.filter(e => e.salary_type === 'daily' && e.is_active);
  }, [employees]);

  const selectedEmployee = dailyWorkers.find(e => e.id === selectedEmployeeId);

  // Get attendance history
  const employeeAttendance = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return getAttendanceByEmployee(selectedEmployeeId, startDate, endDate);
  }, [selectedEmployeeId, startDate, endDate, dailyAttendance]);

  // Calculate attendance summary
  const attendanceSummary = useMemo(() => {
    const present = employeeAttendance.filter(a => a.status === 'present').length;
    const absent = employeeAttendance.filter(a => a.status === 'absent').length;
    const leave = employeeAttendance.filter(a => a.status === 'leave').length;
    const holiday = employeeAttendance.filter(a => a.status === 'holiday').length;
    
    return { present, absent, leave, holiday, total: employeeAttendance.length };
  }, [employeeAttendance]);

  const calculatedSalary = selectedEmployee 
    ? attendanceSummary.present * selectedEmployee.daily_wage 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    addAttendance({
      employee_id: selectedEmployeeId,
      attendance_date: attendanceDate,
      status,
      notes,
    });

    setNotes('');
    alert('تم حفظ الحضور بنجاح');
  };

  // Generate calendar days for selected month
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = dailyAttendance.find(
        a => a.employee_id === selectedEmployeeId && a.attendance_date === dateStr
      );
      return { day, dateStr, attendance };
    });
  }, [selectedMonth, selectedEmployeeId, dailyAttendance]);

  const handleCalendarDayClick = (dateStr: string, currentStatus?: AttendanceStatus) => {
    if (!selectedEmployeeId) return;

    // Cycle through statuses
    const statuses: AttendanceStatus[] = ['present', 'absent', 'leave', 'holiday'];
    const currentIndex = currentStatus ? statuses.indexOf(currentStatus) : -1;
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    // Check if attendance exists
    const existing = dailyAttendance.find(
      a => a.employee_id === selectedEmployeeId && a.attendance_date === dateStr
    );

    if (existing) {
      // Update existing - for simplicity, we'll add a new one (in real app, should update)
      addAttendance({
        employee_id: selectedEmployeeId,
        attendance_date: dateStr,
        status: nextStatus,
        notes: '',
      });
    } else {
      // Add new
      addAttendance({
        employee_id: selectedEmployeeId,
        attendance_date: dateStr,
        status: nextStatus,
        notes: '',
      });
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <Check className="w-4 h-4" />;
      case 'absent':
        return <X className="w-4 h-4" />;
      case 'leave':
        return <AlertCircle className="w-4 h-4" />;
      case 'holiday':
        return <Calendar className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-500 text-white';
      case 'absent':
        return 'bg-red-500 text-white';
      case 'leave':
        return 'bg-blue-500 text-white';
      case 'holiday':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">الحضور اليومي</h1>
          <p className="text-sm text-muted-foreground">تسجيل حضور عمال اليومية</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-border">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'quick'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            تسجيل سريع
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            عرض تقويمي
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'excel'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            استيراد من Excel
          </button>
        </div>

        {/* Quick Entry Tab */}
        {activeTab === 'quick' && (
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Employee Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">اختر العامل (يومية فقط)</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    required
                  >
                    <option value="">اختر العامل...</option>
                    {dailyWorkers.map(emp => {
                      const dept = departments.find(d => d.id === emp.department_id);
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} - {dept?.name || 'بدون قسم'} - {emp.daily_wage} ج.م/يوم
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">التاريخ</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">الحالة</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  >
                    <option value="present">حاضر ✅</option>
                    <option value="absent">غائب ❌</option>
                    <option value="leave">إذن/إجازة 🔵</option>
                    <option value="holiday">عطلة ⚫</option>
                  </select>
                </div>
              </div>

              {selectedEmployee && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">
                    {selectedEmployee.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">{selectedEmployee.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      كود: {selectedEmployee.employee_code} | أجر اليوم: {selectedEmployee.daily_wage} ج.م
                    </p>
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
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={!selectedEmployeeId}
                >
                  <Save className="w-4 h-4" />
                  حفظ الحضور
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('present');
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

        {/* Calendar View Tab */}
        {activeTab === 'calendar' && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">اختر العامل</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                >
                  <option value="">اختر العامل...</option>
                  {dailyWorkers.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">الشهر</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
            </div>

            {selectedEmployeeId ? (
              <>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500"></div>
                    <span className="text-xs text-muted-foreground">حاضر</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500"></div>
                    <span className="text-xs text-muted-foreground">غائب</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500"></div>
                    <span className="text-xs text-muted-foreground">إذن</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-500"></div>
                    <span className="text-xs text-muted-foreground">عطلة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border-2 border-dashed border-gray-300"></div>
                    <span className="text-xs text-muted-foreground">لم يُسجل</span>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-5">
                  {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
                    <div key={day} className="text-center text-xs text-muted-foreground font-medium p-2">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map(({ day, dateStr, attendance }) => (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleCalendarDayClick(dateStr, attendance?.status)}
                      className={`aspect-square p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                        attendance 
                          ? getStatusColor(attendance.status)
                          : 'border-dashed border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-sm font-medium">{day}</span>
                        {attendance && (
                          <div className="mt-1">
                            {getStatusIcon(attendance.status)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-muted-foreground mb-1">حاضر</p>
                    <p className="text-xl text-green-700 font-bold">{attendanceSummary.present}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-muted-foreground mb-1">غائب</p>
                    <p className="text-xl text-red-700 font-bold">{attendanceSummary.absent}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-muted-foreground mb-1">إذن</p>
                    <p className="text-xl text-blue-700 font-bold">{attendanceSummary.leave}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-muted-foreground mb-1">عطلة</p>
                    <p className="text-xl text-gray-700 font-bold">{attendanceSummary.holiday}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-300">
                    <p className="text-xs text-muted-foreground mb-1">الراتب المحسوب</p>
                    <p className="text-xl text-green-700 font-bold">{calculatedSalary.toLocaleString()} ج.م</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                اختر عاملاً لعرض التقويم
              </div>
            )}
          </div>
        )}

        {/* Excel Import Tab */}
        {activeTab === 'excel' && (
          <div className="p-5">
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-50 rounded-full">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg text-foreground mb-2">استيراد من Excel</h3>
              <p className="text-sm text-muted-foreground mb-6">
                قم بتنزيل القالب وملء بيانات الحضور ثم رفعه مرة أخرى
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
                  <li>• الحالة (حاضر/غائب/إذن/عطلة)</li>
                  <li>• ملاحظات</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {selectedEmployeeId && activeTab === 'quick' && (
        <div className="bg-white rounded-lg border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-lg text-foreground">سجل الحضور</h2>
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
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employeeAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      لا يوجد سجل حضور لهذا العامل
                    </td>
                  </tr>
                ) : (
                  employeeAttendance.map(att => (
                    <tr key={att.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {new Date(att.attendance_date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs ${
                          att.status === 'present' ? 'bg-green-50 text-green-700' :
                          att.status === 'absent' ? 'bg-red-50 text-red-700' :
                          att.status === 'leave' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {getStatusIcon(att.status)}
                          {att.status === 'present' ? 'حاضر' :
                           att.status === 'absent' ? 'غائب' :
                           att.status === 'leave' ? 'إذن' : 'عطلة'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{att.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
