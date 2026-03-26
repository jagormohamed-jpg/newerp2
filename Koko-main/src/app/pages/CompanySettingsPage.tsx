import React, { useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  Building2, Globe, Phone, Mail, MapPin, FileText, DollarSign,
  Settings, Package, Factory, Users, CircleCheck, Save, RefreshCcw,
  Percent, Calendar, Shield, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessActivity, CurrencyCode } from '../types/company';
import { BUSINESS_ACTIVITIES, CURRENCIES } from '../types/company';

export function CompanySettingsPage() {
  const { company, updateCompany, isSaving, lastSaved } = useCompany();
  const [activeTab, setActiveTab] = useState('basic');

  const handleSave = () => {
    toast.success('تم حفظ إعدادات الشركة بنجاح');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] text-foreground">إعدادات الشركة</h1>
          <p className="text-[12px] text-muted-foreground">
            تهيئة النظام ليناسب نشاطك التجاري وبيانات شركتك
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-[12px] text-green-600 flex items-center gap-1">
              <CircleCheck className="w-3.5 h-3.5" />
              آخر حفظ: {lastSaved.toLocaleTimeString('ar-EG')}
            </span>
          )}
          <Button onClick={handleSave} size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="basic" className="flex items-center gap-1.5 text-[12px]">
            <Building2 className="w-4 h-4" /> بيانات الشركة
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5 text-[12px]">
            <Zap className="w-4 h-4" /> النشاط التجاري
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-1.5 text-[12px]">
            <DollarSign className="w-4 h-4" /> الإعدادات المالية
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-1.5 text-[12px]">
            <Settings className="w-4 h-4" /> الوحدات والخصائص
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-1.5 text-[12px]">
            <FileText className="w-4 h-4" /> إعدادات الفواتير
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                البيانات الأساسية للشركة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">اسم الشركة (عربي) *</label>
                  <Input
                    value={company.name}
                    onChange={e => updateCompany({ name: e.target.value })}
                    placeholder="شركتي للتجارة"
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">Company Name (English)</label>
                  <Input
                    value={company.name_en}
                    onChange={e => updateCompany({ name_en: e.target.value })}
                    placeholder="My Trading Company"
                    className="text-[13px]"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">
                    <Shield className="w-3.5 h-3.5 inline ml-1" />
                    الرقم الضريبي
                  </label>
                  <Input
                    value={company.tax_number}
                    onChange={e => updateCompany({ tax_number: e.target.value })}
                    placeholder="123456789"
                    className="text-[13px]"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">رقم السجل التجاري</label>
                  <Input
                    value={company.commercial_register}
                    onChange={e => updateCompany({ commercial_register: e.target.value })}
                    placeholder="رقم السجل التجاري"
                    className="text-[13px]"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                بيانات التواصل والعنوان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">
                    <Phone className="w-3.5 h-3.5 inline ml-1" />
                    رقم الهاتف الرئيسي
                  </label>
                  <Input value={company.phone} onChange={e => updateCompany({ phone: e.target.value })} placeholder="01xxxxxxxxx" className="text-[13px]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">رقم الهاتف الثاني</label>
                  <Input value={company.phone2} onChange={e => updateCompany({ phone2: e.target.value })} placeholder="01xxxxxxxxx" className="text-[13px]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">
                    <Mail className="w-3.5 h-3.5 inline ml-1" />
                    البريد الإلكتروني
                  </label>
                  <Input value={company.email} onChange={e => updateCompany({ email: e.target.value })} placeholder="info@company.com" className="text-[13px]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">
                    <Globe className="w-3.5 h-3.5 inline ml-1" />
                    الموقع الإلكتروني
                  </label>
                  <Input value={company.website} onChange={e => updateCompany({ website: e.target.value })} placeholder="www.company.com" className="text-[13px]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">المدينة</label>
                  <Input value={company.city} onChange={e => updateCompany({ city: e.target.value })} placeholder="القاهرة" className="text-[13px]" />
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">الدولة</label>
                  <Input value={company.country} onChange={e => updateCompany({ country: e.target.value })} placeholder="مصر" className="text-[13px]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[12px] text-muted-foreground mb-1.5">العنوان التفصيلي</label>
                  <Input value={company.address} onChange={e => updateCompany({ address: e.target.value })} placeholder="العنوان الكامل للشركة" className="text-[13px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Activity Tab */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                النشاط التجاري
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[12px] text-muted-foreground mb-4">
                اختر النشاط التجاري الرئيسي لشركتك. سيحدد هذا الخيار الوحدات والميزات المناسبة لنشاطك.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.entries(BUSINESS_ACTIVITIES) as [BusinessActivity, typeof BUSINESS_ACTIVITIES[BusinessActivity]][]).map(([key, activity]) => (
                  <button
                    key={key}
                    onClick={() => updateCompany({ business_activity: key })}
                    className={`p-4 rounded-xl border-2 text-right transition-all hover:shadow-md ${
                      company.business_activity === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border bg-card hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{activity.icon}</span>
                      {company.business_activity === key && (
                        <CircleCheck className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="text-[14px] text-foreground mb-1">{activity.label}</div>
                    <div className="text-[11px] text-muted-foreground">{activity.description}</div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {activity.enabledModules.slice(0, 3).map(m => (
                        <span key={m} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {m === 'accounts' ? 'حسابات' : m === 'inventory' ? 'مخازن' : m === 'manufacturing' ? 'تصنيع' : m === 'payroll' ? 'رواتب' : m === 'invoices' ? 'فواتير' : m === 'treasury' ? 'خزينة' : m}
                        </span>
                      ))}
                      {activity.enabledModules.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{activity.enabledModules.length - 3}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended setup based on activity */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{BUSINESS_ACTIVITIES[company.business_activity].icon}</span>
                <div>
                  <h3 className="text-[14px] text-blue-800 mb-1">
                    النشاط المختار: {BUSINESS_ACTIVITIES[company.business_activity].label}
                  </h3>
                  <p className="text-[12px] text-blue-700 mb-2">
                    {BUSINESS_ACTIVITIES[company.business_activity].description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] text-blue-700">الوحدات المقترحة:</span>
                    {BUSINESS_ACTIVITIES[company.business_activity].enabledModules.map(m => (
                      <Badge key={m} className="text-[10px] bg-blue-100 text-blue-700 border-blue-200">
                        {m === 'accounts' ? 'الحسابات' : m === 'contacts' ? 'جهات الاتصال' : m === 'inventory' ? 'المخازن' : m === 'manufacturing' ? 'التصنيع' : m === 'payroll' ? 'الرواتب' : m === 'invoices' ? 'الفواتير' : m === 'treasury' ? 'الخزينة' : m === 'reports' ? 'التقارير' : m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Settings Tab */}
        <TabsContent value="financial" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                العملة والإعدادات المالية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">العملة الرئيسية</label>
                  <select
                    value={company.currency}
                    onChange={e => updateCompany({ currency: e.target.value as CurrencyCode })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px] bg-background"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.arabicName} ({c.code}) - {c.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">عدد المنازل العشرية</label>
                  <select
                    value={company.decimal_places}
                    onChange={e => updateCompany({ decimal_places: Number(e.target.value) as 0 | 2 | 3 })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px] bg-background"
                  >
                    <option value={0}>بدون كسور (0)</option>
                    <option value={2}>منزلتان عشريتان (0.00)</option>
                    <option value={3}>ثلاث منازل عشرية (0.000)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline ml-1" />
                    بداية السنة المالية
                  </label>
                  <select
                    value={company.fiscal_year_start}
                    onChange={e => updateCompany({ fiscal_year_start: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px] bg-background"
                  >
                    <option value="01-01">1 يناير</option>
                    <option value="04-01">1 أبريل</option>
                    <option value="07-01">1 يوليو</option>
                    <option value="10-01">1 أكتوبر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">المنطقة الزمنية</label>
                  <select
                    value={company.timezone}
                    onChange={e => updateCompany({ timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px] bg-background"
                  >
                    <option value="Africa/Cairo">القاهرة (UTC+2/+3)</option>
                    <option value="Asia/Riyadh">الرياض (UTC+3)</option>
                    <option value="Asia/Dubai">دبي (UTC+4)</option>
                    <option value="Asia/Kuwait">الكويت (UTC+3)</option>
                    <option value="Asia/Qatar">الدوحة (UTC+3)</option>
                    <option value="Asia/Muscat">مسقط (UTC+4)</option>
                    <option value="Asia/Bahrain">البحرين (UTC+3)</option>
                    <option value="Asia/Amman">عمّان (UTC+2/+3)</option>
                    <option value="Africa/Tripoli">طرابلس (UTC+2)</option>
                    <option value="Africa/Tunis">تونس (UTC+1)</option>
                    <option value="Africa/Casablanca">الدار البيضاء (UTC+1)</option>
                  </select>
                </div>
              </div>

              {/* VAT Settings */}
              <div className="border-t border-border pt-4">
                <h3 className="text-[13px] text-foreground mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-600" />
                  إعدادات ضريبة القيمة المضافة
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => updateCompany({ enable_vat: !company.enable_vat })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${company.enable_vat ? 'bg-blue-600' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${company.enable_vat ? '-translate-x-6' : '-translate-x-1'}`} />
                  </button>
                  <span className="text-[13px]">تفعيل ضريبة القيمة المضافة</span>
                </div>
                {company.enable_vat && (
                  <div className="w-48">
                    <label className="block text-[12px] text-muted-foreground mb-1.5">نسبة الضريبة %</label>
                    <Input
                      type="number"
                      value={company.vat_rate}
                      onChange={e => updateCompany({ vat_rate: Number(e.target.value) })}
                      min={0}
                      max={30}
                      step={0.5}
                      className="text-[13px]"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features / Modules Tab */}
        <TabsContent value="features" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-600" />
                الوحدات والخصائص
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[12px] text-muted-foreground mb-4">
                قم بتفعيل أو تعطيل الوحدات والخصائص بما يتناسب مع احتياجات نشاطك التجاري
              </p>
              <div className="space-y-3">
                {[
                  {
                    key: 'enable_inventory' as const,
                    label: 'مديول المخازن والأصناف',
                    description: 'إدارة المخزون وتتبع الأصناف والكميات',
                    icon: <Package className="w-4 h-4 text-orange-600" />,
                  },
                  {
                    key: 'enable_manufacturing' as const,
                    label: 'مديول التصنيع',
                    description: 'إدارة خطوط الإنتاج ومراحل التصنيع والتكاليف',
                    icon: <Factory className="w-4 h-4 text-indigo-600" />,
                  },
                  {
                    key: 'enable_payroll' as const,
                    label: 'مديول الرواتب والموظفين',
                    description: 'إدارة الموظفين والرواتب والحضور والانصراف',
                    icon: <Users className="w-4 h-4 text-pink-600" />,
                  },
                  {
                    key: 'enable_multi_warehouse' as const,
                    label: 'تعدد المخازن',
                    description: 'إدارة أكثر من مخزن ونقل البضاعة بينها',
                    icon: <Package className="w-4 h-4 text-teal-600" />,
                  },
                  {
                    key: 'enable_multi_currency' as const,
                    label: 'تعدد العملات',
                    description: 'التعامل بأكثر من عملة وتحويل الأسعار تلقائياً',
                    icon: <DollarSign className="w-4 h-4 text-green-600" />,
                  },
                  {
                    key: 'enable_discount' as const,
                    label: 'نظام الخصومات',
                    description: 'إتاحة الخصم على الفواتير والأصناف',
                    icon: <Percent className="w-4 h-4 text-amber-600" />,
                  },
                  {
                    key: 'enable_costing' as const,
                    label: 'حساب التكاليف',
                    description: 'تتبع تكاليف الإنتاج وحساب هامش الربح',
                    icon: <DollarSign className="w-4 h-4 text-blue-600" />,
                  },
                ].map(feature => (
                  <div
                    key={feature.key}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      company[feature.key] ? 'border-blue-200 bg-blue-50' : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${company[feature.key] ? 'bg-blue-100' : 'bg-muted'}`}>
                        {feature.icon}
                      </div>
                      <div>
                        <div className="text-[13px] text-foreground">{feature.label}</div>
                        <div className="text-[11px] text-muted-foreground">{feature.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateCompany({ [feature.key]: !company[feature.key] })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${company[feature.key] ? 'bg-blue-600' : 'bg-muted-foreground/30'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${company[feature.key] ? '-translate-x-6' : '-translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Settings Tab */}
        <TabsContent value="invoice" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                إعدادات الفواتير والطباعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-[12px] text-muted-foreground mb-1.5">نص رأس الفاتورة</label>
                <textarea
                  value={company.invoice_header_notes}
                  onChange={e => updateCompany({ invoice_header_notes: e.target.value })}
                  rows={2}
                  placeholder="ملاحظات تظهر في أعلى الفاتورة..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px] resize-none bg-background"
                />
              </div>
              <div>
                <label className="block text-[12px] text-muted-foreground mb-1.5">نص تذييل الفاتورة</label>
                <textarea
                  value={company.invoice_footer}
                  onChange={e => updateCompany({ invoice_footer: e.target.value })}
                  rows={2}
                  placeholder="نص يظهر في أسفل الفاتورة..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px] resize-none bg-background"
                />
              </div>

              {/* Preview */}
              <div className="border border-dashed border-border rounded-xl p-4 bg-accent/20">
                <p className="text-[11px] text-muted-foreground mb-3 text-center">معاينة الفاتورة</p>
                <div className="bg-white border border-border rounded-lg p-4 max-w-sm mx-auto">
                  <div className="text-center mb-4 pb-3 border-b border-gray-100">
                    <div className="text-[15px] text-foreground">{company.name}</div>
                    {company.tax_number && <div className="text-[11px] text-muted-foreground">الرقم الضريبي: {company.tax_number}</div>}
                    {company.phone && <div className="text-[11px] text-muted-foreground">{company.phone}</div>}
                    {company.address && <div className="text-[11px] text-muted-foreground">{company.address}</div>}
                    {company.invoice_header_notes && (
                      <div className="text-[11px] text-blue-600 mt-1">{company.invoice_header_notes}</div>
                    )}
                  </div>
                  <div className="text-center text-[12px] text-muted-foreground py-4">[محتوى الفاتورة]</div>
                  {company.invoice_footer && (
                    <div className="text-center text-[11px] text-muted-foreground border-t border-gray-100 pt-3 mt-3">
                      {company.invoice_footer}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
