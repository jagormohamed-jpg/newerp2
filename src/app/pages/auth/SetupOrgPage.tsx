import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const businessActivities = [
  { value: 'trading', label: 'تجارة عامة' },
  { value: 'retail', label: 'تجارة تجزئة' },
  { value: 'services', label: 'خدمات' },
  { value: 'manufacturing', label: 'تصنيع' },
  { value: 'contracting', label: 'مقاولات' },
  { value: 'food', label: 'أغذية ومشروبات' },
  { value: 'technology', label: 'تكنولوجيا' },
  { value: 'medical', label: 'طبي وصيدلي' },
  { value: 'education', label: 'تعليم' },
  { value: 'other', label: 'أخرى' },
];

const countries = [
  { value: 'مصر', label: 'مصر', currency: 'EGP' },
  { value: 'السعودية', label: 'السعودية', currency: 'SAR' },
  { value: 'الإمارات', label: 'الإمارات', currency: 'AED' },
  { value: 'الكويت', label: 'الكويت', currency: 'KWD' },
  { value: 'قطر', label: 'قطر', currency: 'QAR' },
  { value: 'البحرين', label: 'البحرين', currency: 'BHD' },
  { value: 'عمان', label: 'عمان', currency: 'OMR' },
  { value: 'الأردن', label: 'الأردن', currency: 'JOD' },
  { value: 'العراق', label: 'العراق', currency: 'IQD' },
  { value: 'ليبيا', label: 'ليبيا', currency: 'LYD' },
];

/**
 * SetupOrgPage: صفحة إنشاء المنظمة بعد التسجيل
 * تظهر عندما يكون المستخدم مسجل لكن بدون منظمة
 */
export function SetupOrgPage() {
  const { createOrganization, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [businessActivity, setBusinessActivity] = useState('trading');
  const [country, setCountry] = useState('مصر');
  const [currency, setCurrency] = useState('EGP');

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') || `company-${Date.now()}`;
  };

  const handleNameChange = (name: string) => {
    setCompanyName(name);
    setCompanySlug(generateSlug(name));
  };

  const handleCountryChange = (c: string) => {
    setCountry(c);
    const found = countries.find(co => co.value === c);
    if (found) setCurrency(found.currency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) { toast.error('يرجى إدخال اسم الشركة'); return; }

    setIsLoading(true);
    const { error } = await createOrganization({
      name: companyName,
      slug: companySlug || generateSlug(companyName),
      business_activity: businessActivity,
      country,
      currency,
      full_name: user?.user_metadata?.full_name || companyName,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('تم إنشاء الشركة بنجاح! 🎉');
      navigate('/app');
    }
  };

  return (
    <div className="auth-page" dir="rtl">
      <div className="auth-container auth-container-small">
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <div className="auth-logo">
              <div className="auth-logo-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" rx="10" fill="url(#logo-grad4)" />
                  <path d="M12 28V16L20 12L28 16V28L20 24L12 28Z" fill="white" fillOpacity="0.9" />
                  <defs><linearGradient id="logo-grad4" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient></defs>
                </svg>
              </div>
              <span className="auth-logo-text">محاسبة Pro</span>
            </div>

            <h1 className="auth-title">أنشئ شركتك</h1>
            <p className="auth-subtitle">أدخل بيانات شركتك لنجهز النظام المحاسبي لك</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label>اسم الشركة</label>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1" /><rect x="4" y="2" width="16" height="20" rx="0" /></svg>
                  <input type="text" value={companyName} onChange={e => handleNameChange(e.target.value)} placeholder="شركة النور للتجارة" />
                </div>
              </div>

              <div className="auth-field-row">
                <div className="auth-field">
                  <label>نوع النشاط</label>
                  <select value={businessActivity} onChange={e => setBusinessActivity(e.target.value)} className="auth-select">
                    {businessActivities.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div className="auth-field">
                  <label>البلد</label>
                  <select value={country} onChange={e => handleCountryChange(e.target.value)} className="auth-select">
                    {countries.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? <><span className="auth-btn-spinner"></span>جاري الإنشاء...</> : 'إنشاء الشركة وبدء العمل 🚀'}
              </button>
            </form>

            <button onClick={signOut} className="auth-link" style={{ display: 'block', textAlign: 'center', marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
              تسجيل خروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
