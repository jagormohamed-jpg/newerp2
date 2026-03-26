import { useState } from 'react';
import { useManufacturing } from '../../context/ManufacturingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Separator } from '../../components/ui/separator';
import {
  Settings, Shield, DollarSign, Package, Warehouse, CircleCheck, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export function ManufacturingSettingsPage() {
  const { settings, updateSettings } = useManufacturing();
  const [localSettings, setLocalSettings] = useState({ ...settings });

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  const handleReset = () => {
    setLocalSettings({ ...settings });
    toast.info('تم إعادة تعيين الإعدادات');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-[22px] text-foreground" style={{ fontWeight: 700 }}>إعدادات التصنيع</h1>
        <p className="text-[13px] text-muted-foreground mt-1">ضبط إعدادات مديول التصنيع والإنتاج</p>
      </div>

      {/* Inventory Settings */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-blue-600" />
            إعدادات المخزون والإنتاج
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px]" style={{ fontWeight: 500 }}>السماح بالإنتاج بدون مخزون المرحلة السابقة</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                إذا تم تعطيله، لن يتمكن العامل من الإنتاج إلا إذا كان مخزون المرحلة السابقة كافياً
              </p>
            </div>
            <Switch
              checked={localSettings.allow_production_without_previous_stock}
              onCheckedChange={v => setLocalSettings(prev => ({ ...prev, allow_production_without_previous_stock: v }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px]" style={{ fontWeight: 500 }}>السماح بالمخزون السلبي</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                إذا تم تعطيله، لن يتم خصم المواد إذا لم يكن هناك رصيد كافٍ
              </p>
            </div>
            <Switch
              checked={localSettings.allow_negative_inventory}
              onCheckedChange={v => setLocalSettings(prev => ({ ...prev, allow_negative_inventory: v }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px]" style={{ fontWeight: 500 }}>تحديث التكلفة تلقائياً عند حفظ الفاتورة</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                يتم إعادة حساب تكلفة المنتج تلقائياً بعد كل فاتورة إنتاج
              </p>
            </div>
            <Switch
              checked={localSettings.auto_update_cost_on_invoice}
              onCheckedChange={v => setLocalSettings(prev => ({ ...prev, auto_update_cost_on_invoice: v }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Wage Allocation */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            إعدادات تخصيص الأجور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-[13px] mb-2" style={{ fontWeight: 500 }}>وضع تخصيص الأجور</p>
            <Select
              value={localSettings.wage_allocation_mode}
              onValueChange={v => setLocalSettings(prev => ({ ...prev, wage_allocation_mode: v as 'realtime' | 'end_of_period' }))}
            >
              <SelectTrigger className="w-full max-w-sm text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">في الوقت الفعلي (بعد كل فاتورة)</SelectItem>
                <SelectItem value="end_of_period">نهاية الفترة (شهري/أسبوعي)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              {localSettings.wage_allocation_mode === 'realtime'
                ? 'يتم تخصيص تكلفة العمالة لكل منتج فور تسجيل فاتورة الإنتاج'
                : 'يتم حساب تخصيص تكلفة العمالة في نهاية كل فترة (أكثر دقة)'}
            </p>
          </div>

          <Separator />

          <div>
            <p className="text-[13px] mb-2" style={{ fontWeight: 500 }}>طريقة حساب التكلفة</p>
            <Select
              value={localSettings.cost_calculation_method}
              onValueChange={v => setLocalSettings(prev => ({ ...prev, cost_calculation_method: v as 'weighted_average' | 'fifo' | 'lifo' }))}
            >
              <SelectTrigger className="w-full max-w-sm text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weighted_average">المتوسط المرجح</SelectItem>
                <SelectItem value="fifo">الوارد أولاً صادر أولاً (FIFO)</SelectItem>
                <SelectItem value="lifo">الوارد أخيراً صادر أولاً (LIFO)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Default Values */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-600" />
            القيم الافتراضية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-[13px] mb-2" style={{ fontWeight: 500 }}>نسبة الهدر الافتراضية (%)</p>
            <Input
              type="number"
              value={localSettings.default_waste_percentage}
              onChange={e => setLocalSettings(prev => ({ ...prev, default_waste_percentage: +e.target.value }))}
              className="text-[12px] w-full max-w-sm"
              min={0}
              max={100}
              step={0.5}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              يتم تطبيق هذه النسبة تلقائياً عند إضافة مكون جديد لمرحلة إنتاج
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] text-blue-800" style={{ fontWeight: 600 }}>سياسة عدم الحذف</p>
              <p className="text-[11px] text-blue-600 mt-1">
                لا يمكن حذف أي فاتورة إنتاج. إذا كان هناك خطأ، يتم إنشاء عملية عكسية لضمان سلامة البيانات المحاسبية.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] text-amber-800" style={{ fontWeight: 600 }}>تنبيه مهم</p>
              <p className="text-[11px] text-amber-600 mt-1">
                تغيير إعدادات تخصيص الأجور أو طريقة حساب التكلفة لن يؤثر على الفواتير السابقة.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Buttons */}
      <div className="flex items-center gap-3 pt-2 pb-8">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-[12px] gap-1.5">
          <CircleCheck className="w-4 h-4" /> حفظ الإعدادات
        </Button>
        <Button onClick={handleReset} variant="outline" className="text-[12px]">
          إعادة تعيين
        </Button>
      </div>
    </div>
  );
}
