import React, { useState } from 'react';
import { Plus, Edit2, Power, Users } from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import type { Department } from '../../types/payroll';

export function DepartmentsPage() {
  const { departments, employees, addDepartment, updateDepartment, getEmployeesByDepartment } = usePayroll();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEmployeesList, setShowEmployeesList] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      updateDepartment(editingId, formData);
    } else {
      addDepartment(formData);
    }

    setFormData({ name: '', description: '', is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (dept: Department) => {
    setFormData({
      name: dept.name,
      description: dept.description,
      is_active: dept.is_active,
    });
    setEditingId(dept.id);
    setShowForm(true);
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    updateDepartment(id, { is_active: !currentStatus });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-1">الأقسام</h1>
          <p className="text-sm text-muted-foreground">إدارة أقسام العمل وتنظيم العمال</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: '', description: '', is_active: true });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          قسم جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Departments List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-border">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg text-foreground">قائمة الأقسام</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs text-muted-foreground">اسم القسم</th>
                    <th className="px-4 py-3 text-right text-xs text-muted-foreground">الوصف</th>
                    <th className="px-4 py-3 text-center text-xs text-muted-foreground">عدد العمال</th>
                    <th className="px-4 py-3 text-center text-xs text-muted-foreground">الحالة</th>
                    <th className="px-4 py-3 text-center text-xs text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        لا توجد أقسام بعد. ابدأ بإضافة قسم جديد
                      </td>
                    </tr>
                  ) : (
                    departments.map(dept => {
                      const workerCount = getEmployeesByDepartment(dept.id).length;
                      return (
                        <tr key={dept.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm text-foreground font-medium">
                            {dept.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {dept.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setShowEmployeesList(dept.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm"
                            >
                              <Users className="w-3.5 h-3.5" />
                              {workerCount}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                                dept.is_active
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {dept.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(dept)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                title="تعديل"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(dept.id, dept.is_active)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  dept.is_active
                                    ? 'hover:bg-red-50 text-red-600'
                                    : 'hover:bg-green-50 text-green-600'
                                }`}
                                title={dept.is_active ? 'تعطيل' : 'تفعيل'}
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
        </div>

        {/* Form */}
        <div className="lg:col-span-1">
          {showForm && (
            <div className="bg-white rounded-lg border border-border p-5 sticky top-6">
              <h2 className="text-lg text-foreground mb-4">
                {editingId ? 'تعديل القسم' : 'قسم جديد'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground mb-1.5">
                    اسم القسم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="أدخل اسم القسم"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-1.5">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    rows={3}
                    placeholder="وصف اختياري للقسم"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-border rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-foreground">
                    قسم نشط
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {editingId ? 'حفظ التعديلات' : 'إضافة القسم'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ name: '', description: '', is_active: true });
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Employees Modal */}
      {showEmployeesList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg text-foreground">
                عمال قسم {departments.find(d => d.id === showEmployeesList)?.name}
              </h2>
              <button
                onClick={() => setShowEmployeesList(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {getEmployeesByDepartment(showEmployeesList).length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  لا يوجد عمال في هذا القسم
                </p>
              ) : (
                <div className="space-y-2">
                  {getEmployeesByDepartment(showEmployeesList).map(emp => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30"
                    >
                      <div>
                        <p className="text-sm text-foreground font-medium">{emp.full_name}</p>
                        <p className="text-xs text-muted-foreground">{emp.employee_code}</p>
                      </div>
                      <div className="text-left">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                            emp.salary_type === 'production'
                              ? 'bg-orange-50 text-orange-700'
                              : emp.salary_type === 'hourly'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {emp.salary_type === 'production'
                            ? 'إنتاج'
                            : emp.salary_type === 'hourly'
                            ? 'بالساعة'
                            : 'يومية'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
