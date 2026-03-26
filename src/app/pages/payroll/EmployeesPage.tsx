import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Power, FileText, Search, Download, Upload, User } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import type { Employee, SalaryType } from '../../types/payroll';

export function EmployeesPage() {
  const { 
    employees, 
    departments, 
    addEmployee, 
    updateEmployee,
    getEmployeeAdvanceBalance 
  } = usePayroll();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSalaryType, setFilterSalaryType] = useState<SalaryType | ''>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    id_number: '',
    photo_url: '',
    department_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary_type: 'production' as SalaryType,
    price_per_piece: 0,
    hourly_rate: 0,
    overtime_rate: 0,
    daily_wage: 0,
    notes: '',
    is_active: true,
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !filterDepartment || emp.department_id === filterDepartment;
      const matchesSalaryType = !filterSalaryType || emp.salary_type === filterSalaryType;
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'active' && emp.is_active) ||
        (filterStatus === 'inactive' && !emp.is_active);
      
      return matchesSearch && matchesDepartment && matchesSalaryType && matchesStatus;
    });
  }, [employees, searchTerm, filterDepartment, filterSalaryType, filterStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.department_id) return;

    if (editingId) {
      updateEmployee(editingId, formData);
    } else {
      addEmployee(formData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      address: '',
      id_number: '',
      photo_url: '',
      department_id: '',
      hire_date: new Date().toISOString().split('T')[0],
      salary_type: 'production',
      price_per_piece: 0,
      hourly_rate: 0,
      overtime_rate: 0,
      daily_wage: 0,
      notes: '',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (emp: Employee) => {
    setFormData({
      full_name: emp.full_name,
      phone: emp.phone,
      address: emp.address,
      id_number: emp.id_number,
      photo_url: emp.photo_url,
      department_id: emp.department_id,
      hire_date: emp.hire_date,
      salary_type: emp.salary_type,
      price_per_piece: emp.price_per_piece,
      hourly_rate: emp.hourly_rate,
      overtime_rate: emp.overtime_rate,
      daily_wage: emp.daily_wage,
      notes: emp.notes,
      is_active: emp.is_active,
    });
    setEditingId(emp.id);
    setShowForm(true);
  };

  const getSalaryTypeLabel = (type: SalaryType) => {
    const labels: Record<SalaryType, string> = {
      production: 'إنتاج',
      hourly: 'بالساعة',
      daily: 'يومية',
    };
    return labels[type];
  };

  const getSalaryTypeColor = (type: SalaryType) => {
    const colors: Record<SalaryType, string> = {
      production: 'bg-orange-50 text-orange-700',
      hourly: 'bg-blue-50 text-blue-700',
      daily: 'bg-green-50 text-green-700',
    };
    return colors[type];
  };

  const getSalaryRate = (emp: Employee) => {
    switch (emp.salary_type) {
      case 'production':
        return `${emp.price_per_piece} ج.م/قط��ة`;
      case 'hourly':
        return `${emp.hourly_rate} ج.م/ساعة`;
      case 'daily':
        return `${emp.daily_wage} ج.م/يوم`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">العمال</h1>
          <p className="text-sm text-muted-foreground">إدارة بيانات العمال ومعلوماتهم</p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
            title="استيراد من Excel"
          >
            <Upload className="w-4 h-4" />
            استيراد
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
            title="تصدير إلى Excel"
          >
            <Download className="w-4 h-4" />
            تصدير
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            عامل جديد
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو الكود..."
              className="w-full pr-9 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <select
            value={filterDepartment}
            onChange={e => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">كل الأقسام</option>
            {departments.filter(d => d.is_active).map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          <select
            value={filterSalaryType}
            onChange={e => setFilterSalaryType(e.target.value as SalaryType | '')}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">كل الأنواع</option>
            <option value="production">إنتاج</option>
            <option value="hourly">بالساعة</option>
            <option value="daily">يومية</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>

          <div className="text-sm text-muted-foreground flex items-center">
            النتائج: {filteredEmployees.length}
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">الكود</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">الاسم</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">القسم</th>
                <th className="px-4 py-3 text-center text-xs text-muted-foreground">نوع الراتب</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">السعر</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">رصيد السلف</th>
                <th className="px-4 py-3 text-center text-xs text-muted-foreground">الحالة</th>
                <th className="px-4 py-3 text-center text-xs text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {employees.length === 0 
                      ? 'لا يوجد عمال بعد. ابدأ بإضافة عامل جديد'
                      : 'لا توجد نتائج تطابق البحث'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const department = departments.find(d => d.id === emp.department_id);
                  const advanceBalance = getEmployeeAdvanceBalance(emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {emp.employee_code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-foreground font-medium">{emp.full_name}</p>
                            <p className="text-xs text-muted-foreground">{emp.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {department?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getSalaryTypeColor(emp.salary_type)}`}>
                          {getSalaryTypeLabel(emp.salary_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {getSalaryRate(emp)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {advanceBalance > 0 ? (
                          <span className="text-red-600 font-medium">
                            {advanceBalance.toLocaleString()} ج.م
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                            emp.is_active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {emp.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                            title="كشف حساب"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateEmployee(emp.id, { is_active: !emp.is_active })}
                            className={`p-1.5 rounded-lg transition-colors ${
                              emp.is_active
                                ? 'hover:bg-red-50 text-red-600'
                                : 'hover:bg-green-50 text-green-600'
                            }`}
                            title={emp.is_active ? 'تعطيل' : 'تفعيل'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full my-8">
            <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg text-foreground">
                {editingId ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-5">
                {/* Personal Info */}
                <div>
                  <h3 className="text-sm text-foreground font-medium mb-3 pb-2 border-b border-border">
                    البيانات الشخصية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-foreground mb-1.5">
                        الاسم الكامل <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-foreground mb-1.5">رقم الهاتف</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-foreground mb-1.5">الرقم القومي</label>
                      <input
                        type="text"
                        value={formData.id_number}
                        onChange={e => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-foreground mb-1.5">العنوان</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Work Info */}
                <div>
                  <h3 className="text-sm text-foreground font-medium mb-3 pb-2 border-b border-border">
                    بيانات العمل
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-foreground mb-1.5">
                        القسم <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.department_id}
                        onChange={e => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="">اختر القسم</option>
                        {departments.filter(d => d.is_active).map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-foreground mb-1.5">تاريخ التعيين</label>
                      <input
                        type="date"
                        value={formData.hire_date}
                        onChange={e => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-foreground mb-2">
                        نوع الراتب <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.salary_type === 'production' ? 'border-orange-500 bg-orange-50' : 'border-border hover:bg-muted'
                        }`}>
                          <input
                            type="radio"
                            name="salary_type"
                            value="production"
                            checked={formData.salary_type === 'production'}
                            onChange={e => setFormData(prev => ({ ...prev, salary_type: e.target.value as SalaryType }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">إنتاج</span>
                        </label>

                        <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.salary_type === 'hourly' ? 'border-blue-500 bg-blue-50' : 'border-border hover:bg-muted'
                        }`}>
                          <input
                            type="radio"
                            name="salary_type"
                            value="hourly"
                            checked={formData.salary_type === 'hourly'}
                            onChange={e => setFormData(prev => ({ ...prev, salary_type: e.target.value as SalaryType }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">بالساعة</span>
                        </label>

                        <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.salary_type === 'daily' ? 'border-green-500 bg-green-50' : 'border-border hover:bg-muted'
                        }`}>
                          <input
                            type="radio"
                            name="salary_type"
                            value="daily"
                            checked={formData.salary_type === 'daily'}
                            onChange={e => setFormData(prev => ({ ...prev, salary_type: e.target.value as SalaryType }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">يومية</span>
                        </label>
                      </div>
                    </div>

                    {/* Conditional fields based on salary type */}
                    {formData.salary_type === 'production' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm text-foreground mb-1.5">سعر القطعة (ج.م)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price_per_piece}
                          onChange={e => setFormData(prev => ({ ...prev, price_per_piece: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    )}

                    {formData.salary_type === 'hourly' && (
                      <>
                        <div>
                          <label className="block text-sm text-foreground mb-1.5">سعر الساعة العادية (ج.م)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.hourly_rate}
                            onChange={e => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-foreground mb-1.5">سعر الساعة الإضافية (ج.م)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.overtime_rate}
                            onChange={e => setFormData(prev => ({ ...prev, overtime_rate: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </>
                    )}

                    {formData.salary_type === 'daily' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm text-foreground mb-1.5">الأجر اليومي (ج.م)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.daily_wage}
                          onChange={e => setFormData(prev => ({ ...prev, daily_wage: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes & Status */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm text-foreground mb-1.5">ملاحظات</label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="emp_active"
                      checked={formData.is_active}
                      onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="emp_active" className="text-sm text-foreground">
                      عامل نشط
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {editingId ? 'حفظ التعديلات' : 'إضافة العامل'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}