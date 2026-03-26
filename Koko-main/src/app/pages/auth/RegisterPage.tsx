import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router';
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
  { value: 'تونس', label: 'تونس', currency: 'TND' },
  { value: 'المغرب', label: 'المغرب', currency: 'MAD' },
  { value: 'السودان', label: 'السودان', currency: 'SDG' },
];

export function RegisterPage() {
  const { signUp, createOrganization, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: User data
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Company data
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [businessActivity, setBusinessActivity] = useState('trading');
  const [country, setCountry] = useState('مصر');
  const [currency, setCurrency] = useState('EGP');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      || `company-${Date.now()}`;
  };

  const handleCompanyNameChange = (name: string) => {
    setCompanyName(name);
    if (!companySlug || companySlug === generateSlug(companyName)) {
      setCompanySlug(generateSlug(name));
    }
  };

  const handleCountryChange = (c: string) => {
    setCountry(c);
    const found = countries.find(co => co.value === c);
    if (found) setCurrency(found.currency);
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('يرجى إدخال الاسم الكامل'); return; }
    if (!email.trim()) { toast.error('يرجى إدخال البريد الإلكتروني'); return; }
    if (password.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (password !== confirmPassword) { toast.error('كلمة المرور غير متطابقة'); return; }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) { toast.error('يرجى إدخال اسم الشركة'); return; }
    if (!companySlug.trim()) { toast.error('يرجى إدخال رابط الشركة'); return; }

    setIsLoading(true);

    // Step A: Create user
    const { error: signUpError, userId } = await signUp(email, password, fullName);
    if (signUpError) {
      toast.error(signUpError);
      setIsLoading(false);
      return;
    }

    // Step B: Create organization (after a brief delay to let auth settle)
    await new Promise(r => setTimeout(r, 1000));

    const { error: orgError } = await createOrganization({
      name: companyName,
      slug: companySlug,
      business_activity: businessActivity,
      country,
      currency,
      full_name: fullName,
    });

    setIsLoading(false);

    if (orgError) {
      toast.error(orgError);
      return;
    }

    toast.success('تم إنشاء حسابك بنجاح! 🎉');
    navigate('/app');
  };

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
      </div>
    );
  }

  return (
    <div className="auth-page" dir="rtl">
      <div className="auth-container">
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <div className="auth-logo">
              <div className="auth-logo-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" rx="10" fill="url(#logo-grad2)" />
                  <path d="M12 28V16L20 12L28 16V28L20 24L12 28Z" fill="white" fillOpacity="0.9" />
                  <path d="M20 12V24M12 16L28 16" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
                  <defs><linearGradient id="logo-grad2" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient></defs>
                </svg>
              </div>
              <span className="auth-logo-text">محاسبة Pro</span>
            </div>

            {/* Progress */}
            <div className="auth-progress">
              <div className={`auth-progress-step ${step >= 1 ? 'active' : ''}`}>
                <div className="auth-progress-dot">1</div>
                <span>بيانات الحساب</span>
              </div>
              <div className="auth-progress-line"></div>
              <div className={`auth-progress-step ${step >= 2 ? 'active' : ''}`}>
                <div className="auth-progress-dot">2</div>
                <span>بيانات الشركة</span>
              </div>
            </div>

            {step === 1 ? (
              <>
                <h1 className="auth-title">إنشاء حساب جديد</h1>
                <p className="auth-subtitle">ابدأ تجربتك المجانية لمدة 14 يوم</p>

                <form onSubmit={handleStep1} className="auth-form">
                  <div className="auth-field">
                    <label>الاسم الكامل</label>
                    <div className="auth-input-wrapper">
                      <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="محمد أحمد" />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>البريد الإلكتروني</label>
                    <div className="auth-input-wrapper">
                      <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@company.com" dir="ltr" />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>كلمة المرور</label>
                    <div className="auth-input-wrapper">
                      <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>تأكيد كلمة المرور</label>
                    <div className="auth-input-wrapper">
                      <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="أعد كتابة كلمة المرور" dir="ltr" />
                    </div>
                  </div>
                  <button type="submit" className="auth-submit-btn">التالي ←</button>
                </form>
              </>
            ) : (
              <>
                <h1 className="auth-title">بيانات الشركة</h1>
                <p className="auth-subtitle">أخبرنا عن شركتك لنجهز النظام لك</p>

                <form onSubmit={handleStep2} className="auth-form">
                  <div className="auth-field">
                    <label>اسم الشركة</label>
                    <div className="auth-input-wrapper">
                      <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1" /><rect x="4" y="2" width="16" height="20" rx="0" /></svg>
                      <input type="text" value={companyName} onChange={e => handleCompanyNameChange(e.target.value)} placeholder="شركة النور للتجارة" />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>رابط الشركة (slug)</label>
                    <div className="auth-input-wrapper auth-slug-input">
                      <span className="auth-slug-prefix">.mohasaba.pro/</span>
                      <input type="text" value={companySlug} onChange={e => setCompanySlug(e.target.value.replace(/[^a-z0-9-]/g, ''))} placeholder="al-noor" dir="ltr" />
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
                  <div className="auth-field">
                    <label>العملة</label>
                    <input type="text" value={currency} readOnly className="auth-readonly-input" />
                  </div>

                  <div className="auth-btn-group">
                    <button type="button" className="auth-back-btn" onClick={() => setStep(1)}>→ رجوع</button>
                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                      {isLoading ? <><span className="auth-btn-spinner"></span>جاري الإنشاء...</> : 'إنشاء الحساب 🚀'}
                    </button>
                  </div>
                </form>
              </>
            )}

            <p className="auth-footer-text">
              لديك حساب بالفعل؟{' '}
              <Link to="/auth/login" className="auth-link">تسجيل الدخول</Link>
            </p>
          </div>
        </div>

        <div className="auth-visual-section auth-visual-register">
          <div className="auth-visual-content">
            <div className="auth-visual-shapes">
              <div className="auth-shape auth-shape-1"></div>
              <div className="auth-shape auth-shape-2"></div>
              <div className="auth-shape auth-shape-3"></div>
            </div>
            <h2>ابدأ إدارة أعمالك الآن</h2>
            <p>تجربة مجانية 14 يوم — بدون بطاقة ائتمان</p>
            <div className="auth-plan-preview">
              <div className="auth-plan-item">✓ شجرة حسابات كاملة</div>
              <div className="auth-plan-item">✓ فواتير بيع وشراء</div>
              <div className="auth-plan-item">✓ إدارة مخزون</div>
              <div className="auth-plan-item">✓ تقارير مالية</div>
              <div className="auth-plan-item">✓ 3 مستخدمين</div>
              <div className="auth-plan-item">✓ 100 فاتورة/شهر</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
