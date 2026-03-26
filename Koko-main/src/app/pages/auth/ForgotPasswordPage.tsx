import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('يرجى إدخال البريد الإلكتروني'); return; }
    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);
    if (error) {
      toast.error(error);
    } else {
      setIsSent(true);
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور');
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
                  <rect width="40" height="40" rx="10" fill="url(#logo-grad3)" />
                  <path d="M12 28V16L20 12L28 16V28L20 24L12 28Z" fill="white" fillOpacity="0.9" />
                  <defs><linearGradient id="logo-grad3" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient></defs>
                </svg>
              </div>
              <span className="auth-logo-text">محاسبة Pro</span>
            </div>

            {isSent ? (
              <div className="auth-success-msg">
                <div className="auth-success-icon">✉️</div>
                <h1 className="auth-title">تم الإرسال!</h1>
                <p className="auth-subtitle">
                  تم إرسال رابط إعادة تعيين كلمة المرور إلى<br />
                  <strong dir="ltr">{email}</strong>
                </p>
                <p className="auth-hint">تحقق من صندوق الوارد أو مجلد البريد المزعج</p>
                <Link to="/auth/login" className="auth-submit-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 24 }}>
                  العودة لتسجيل الدخول
                </Link>
              </div>
            ) : (
              <>
                <h1 className="auth-title">نسيت كلمة المرور؟</h1>
                <p className="auth-subtitle">أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيينها</p>

                <form onSubmit={handleSubmit} className="auth-form">
                  <div className="auth-field">
                    <label>البريد الإلكتروني</label>
                    <div className="auth-input-wrapper">
                      <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@company.com" dir="ltr" />
                    </div>
                  </div>
                  <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                    {isLoading ? <><span className="auth-btn-spinner"></span>جاري الإرسال...</> : 'إرسال رابط إعادة التعيين'}
                  </button>
                </form>
              </>
            )}

            <p className="auth-footer-text">
              <Link to="/auth/login" className="auth-link">← العودة لتسجيل الدخول</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
