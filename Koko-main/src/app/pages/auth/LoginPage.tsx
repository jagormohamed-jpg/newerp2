import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';

export function LoginPage() {
  const { signIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/app');
    }
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
        {/* Left side - Form */}
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <div className="auth-logo">
              <div className="auth-logo-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
                  <path d="M12 28V16L20 12L28 16V28L20 24L12 28Z" fill="white" fillOpacity="0.9" />
                  <path d="M20 12V24M12 16L28 16" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
                  <defs>
                    <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
                      <stop stopColor="#6366F1" />
                      <stop offset="1" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="auth-logo-text">محاسبة Pro</span>
            </div>
            <h1 className="auth-title">مرحباً بعودتك</h1>
            <p className="auth-subtitle">سجّل دخولك للوصول إلى لوحة التحكم</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label>البريد الإلكتروني</label>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@company.com"
                    autoComplete="email"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field-header">
                  <label>كلمة المرور</label>
                  <Link to="/auth/forgot-password" className="auth-link">نسيت كلمة المرور؟</Link>
                </div>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <><span className="auth-btn-spinner"></span>جاري تسجيل الدخول...</>
                ) : 'تسجيل الدخول'}
              </button>
            </form>

            <p className="auth-footer-text">
              ليس لديك حساب؟{' '}
              <Link to="/auth/register" className="auth-link">إنشاء حساب جديد</Link>
            </p>
          </div>
        </div>

        {/* Right side - Visual */}
        <div className="auth-visual-section">
          <div className="auth-visual-content">
            <div className="auth-visual-shapes">
              <div className="auth-shape auth-shape-1"></div>
              <div className="auth-shape auth-shape-2"></div>
              <div className="auth-shape auth-shape-3"></div>
            </div>
            <h2>نظام محاسبة سحابي متكامل</h2>
            <p>إدارة حساباتك، فواتيرك، ومخزونك من أي مكان</p>
            <div className="auth-features-grid">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">📊</div>
                <span>تقارير مالية</span>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">🧾</div>
                <span>فواتير إلكترونية</span>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">📦</div>
                <span>إدارة المخزون</span>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">👥</div>
                <span>إدارة الموظفين</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
