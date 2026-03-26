import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';

/* ─────────────────────────────────────────── helpers ── */
function Logo() {
  return (
    <div className="lp-nav-logo">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="url(#lp-logo)" />
        <path d="M12 28V16L20 12L28 16V28L20 24L12 28Z" fill="white" fillOpacity="0.92" />
        <path d="M20 12V24M12 16L28 16" stroke="white" strokeWidth="1.5" strokeOpacity="0.45" />
        <defs>
          <linearGradient id="lp-logo" x1="0" y1="0" x2="40" y2="40">
            <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <span>محاسبة Pro</span>
    </div>
  );
}

/* ─────────────────────────────────────────── data ── */
const features = [
  {
    icon: '🧾',
    title: 'فواتير إلكترونية ذكية',
    desc: 'إصدار فواتير البيع والشراء مع قيود محاسبية تلقائية تُنشأ فور الحفظ. دعم كامل لضريبة القيمة المضافة.',
    color: '#6366F1',
  },
  {
    icon: '📚',
    title: 'محاسبة قيد مزدوج',
    desc: 'قيود يومية تلقائية لكل عملية — مبيعات، مشتريات، سندات قبض وصرف، مصروفات، رواتب وتصنيع.',
    color: '#8B5CF6',
  },
  {
    icon: '📦',
    title: 'إدارة مخزون متكاملة',
    desc: 'تتبع المخزون بالمتوسط المرجح، تحويلات بين المخازن، جرد، تلف. تحديث تلقائي عند كل فاتورة.',
    color: '#06B6D4',
  },
  {
    icon: '🏦',
    title: 'خزائن وبنوك',
    desc: 'إدارة كاملة للسيولة: خزائن نقدية، حسابات بنكية، شيكات، تسويات. ميزان دائماً في توازن.',
    color: '#10B981',
  },
  {
    icon: '👷',
    title: 'رواتب وموارد بشرية',
    desc: 'حضور وانصراف، خصومات وإضافات، مسير رواتب شهري مع قيود محاسبية تلقائية.',
    color: '#F59E0B',
  },
  {
    icon: '🏭',
    title: 'تصنيع وإنتاج',
    desc: 'أوامر تصنيع، مراحل إنتاج، سحب مواد خام تلقائي من المخزون، تكاليف مباشرة وغير مباشرة.',
    color: '#EF4444',
  },
  {
    icon: '📊',
    title: 'تقارير مالية متقدمة',
    desc: 'ميزان مراجعة، قائمة دخل، مركز مالي، تدفقات نقدية، تقادم ديون — جميعها في الوقت الفعلي.',
    color: '#EC4899',
  },
  {
    icon: '🏢',
    title: 'شركات وفروع متعددة',
    desc: 'أدر أكثر من شركة وعدد لا محدود من الفروع. تقارير مجمعة أو مفصلة على مستوى الفرع.',
    color: '#3B82F6',
  },
];

const plans = [
  {
    name: 'Starter',
    nameAr: 'البداية',
    price: '149',
    period: 'شهرياً',
    desc: 'مثالي للمشاريع الصغيرة',
    color: '#6366F1',
    features: [
      '3 مستخدمين',
      'فرع واحد',
      '200 فاتورة/شهر',
      'محاسبة كاملة',
      'فواتير بيع وشراء',
      'إدارة مخزون',
      'تقارير أساسية',
      'دعم عبر البريد',
    ],
    notIncluded: ['متعدد الفروع', 'رواتب وموارد بشرية', 'تصنيع وإنتاج'],
    cta: 'ابدأ مجاناً',
    popular: false,
  },
  {
    name: 'Professional',
    nameAr: 'الاحترافي',
    price: '349',
    period: 'شهرياً',
    desc: 'للشركات المتنامية',
    color: '#8B5CF6',
    features: [
      '15 مستخدم',
      '5 فروع',
      'فواتير غير محدودة',
      'محاسبة كاملة',
      'رواتب وموارد بشرية',
      'تصنيع وإنتاج',
      'تقارير متقدمة',
      'دعم أولوية',
    ],
    notIncluded: [],
    cta: 'ابدأ مجاناً',
    popular: true,
  },
  {
    name: 'Enterprise',
    nameAr: 'للمؤسسات',
    price: 'تواصل معنا',
    period: '',
    desc: 'للمؤسسات الكبرى',
    color: '#06B6D4',
    features: [
      'مستخدمون غير محدودون',
      'فروع غير محدودة',
      'كل ميزات Starter + Pro',
      'API مفتوح',
      'تخصيص كامل',
      'SLA مضمون',
      'مدير حساب مخصص',
      'نشر على خوادمك',
    ],
    notIncluded: [],
    cta: 'تواصل معنا',
    popular: false,
  },
];

const testimonials = [
  {
    name: 'أحمد الشحات',
    role: 'مدير مالي - شركة النور للتجارة',
    text: 'وفّر علينا النظام أكثر من 20 ساعة عمل شهرياً. القيود المحاسبية التلقائية دقيقة 100% ولم يحدث أي خطأ في الميزانية منذ التطبيق.',
    avatar: 'أ',
    color: '#6366F1',
  },
  {
    name: 'منى عبدالرحمن',
    role: 'محاسبة - مجموعة الفجر',
    text: 'ميزة متعدد الفروع ممتازة. أقدر أشوف تقرير مجمع لكل فروعنا الخمسة في ثوانٍ. التقارير المالية احترافية جداً.',
    avatar: 'م',
    color: '#8B5CF6',
  },
  {
    name: 'خالد المنصور',
    role: 'صاحب مصنع - صناعات الخليج',
    text: 'وحدة التصنيع رائعة. تتبع مراحل الإنتاج وحساب التكاليف تلقائياً وفّر عليّ محاسباً إضافياً. استثمار ممتاز.',
    avatar: 'خ',
    color: '#10B981',
  },
];

const stats = [
  { value: '5,000+', label: 'شركة تستخدمنا' },
  { value: '2M+', label: 'فاتورة مُعالجة' },
  { value: '99.9%', label: 'وقت التشغيل' },
  { value: '15+', label: 'دولة عربية' },
];

/* ─────────────────────────────────────────── main ── */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp-root" dir="rtl">
      {/* ── NAV ── */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <Logo />
          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">المميزات</a>
            <a href="#pricing" className="lp-nav-link">الأسعار</a>
            <a href="#testimonials" className="lp-nav-link">آراء العملاء</a>
          </div>
          <div className="lp-nav-actions">
            <Link to="/auth/login" className="lp-btn-ghost">تسجيل الدخول</Link>
            <Link to="/auth/register" className="lp-btn-primary-sm">ابدأ مجاناً</Link>
          </div>
          <button
            className="lp-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="القائمة"
          >
            <span /><span /><span />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="lp-mobile-menu">
            <a href="#features" className="lp-mobile-link" onClick={() => setMobileMenuOpen(false)}>المميزات</a>
            <a href="#pricing" className="lp-mobile-link" onClick={() => setMobileMenuOpen(false)}>الأسعار</a>
            <a href="#testimonials" className="lp-mobile-link" onClick={() => setMobileMenuOpen(false)}>آراء العملاء</a>
            <Link to="/auth/login" className="lp-mobile-link" onClick={() => setMobileMenuOpen(false)}>تسجيل الدخول</Link>
            <Link to="/auth/register" className="lp-btn-primary-sm lp-mobile-cta" onClick={() => setMobileMenuOpen(false)}>ابدأ مجاناً</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-orb lp-hero-orb-1" />
          <div className="lp-hero-orb lp-hero-orb-2" />
          <div className="lp-hero-orb lp-hero-orb-3" />
          <div className="lp-hero-grid" />
        </div>
        <div className="lp-container">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            نظام ERP محاسبي سحابي — متاح الآن
          </div>
          <h1 className="lp-hero-title">
            أدر أعمالك بـ<span className="lp-hero-gradient"> دقة محاسبية</span>
            <br />لا مثيل لها
          </h1>
          <p className="lp-hero-subtitle">
            نظام ERP محاسبي متكامل مصمم للشركات العربية. قيود يومية تلقائية، فواتير إلكترونية،
            إدارة مخزون، رواتب وتصنيع — كل شيء في مكان واحد، دائماً في توازن.
          </p>
          <div className="lp-hero-cta">
            <Link to="/auth/register" className="lp-btn-hero-primary">
              ابدأ تجربتك المجانية
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#features" className="lp-btn-hero-ghost">
              اكتشف المميزات
            </a>
          </div>
          <div className="lp-hero-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            تجربة مجانية 14 يوم — بدون بطاقة ائتمان — إلغاء في أي وقت
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="lp-stat-item">
                <div className="lp-stat-value">{s.value}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-badge">المميزات</div>
            <h2 className="lp-section-title">كل ما تحتاجه لإدارة أعمالك</h2>
            <p className="lp-section-sub">
              من الفاتورة إلى القائمة المالية — نظام متكامل يغطي كل جوانب عملك المحاسبي
            </p>
          </div>
          <div className="lp-features-grid">
            {features.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon-wrap" style={{ '--fc': f.color } as React.CSSProperties}>
                  <span className="lp-feature-icon">{f.icon}</span>
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACCOUNTING AUTOMATION HIGHLIGHT ── */}
      <section className="lp-highlight-section">
        <div className="lp-container">
          <div className="lp-highlight-inner">
            <div className="lp-highlight-text">
              <div className="lp-section-badge">الأتمتة المحاسبية</div>
              <h2 className="lp-section-title lp-highlight-title">
                قيود يومية تلقائية<br />لكل عملية
              </h2>
              <p className="lp-section-sub" style={{ textAlign: 'right' }}>
                لا تحتاج إلى إدخال القيود يدوياً أبداً. النظام يُنشئ قيود مزدوجة متوازنة
                تلقائياً عند كل عملية — فواتير، مدفوعات، رواتب، تصنيع.
              </p>
              <ul className="lp-highlight-list">
                {[
                  'فاتورة بيع → حساب العميل مدين / المبيعات دائن',
                  'فاتورة شراء → المشتريات مدين / حساب المورد دائن',
                  'سند قبض → الخزينة مدين / حساب العميل دائن',
                  'تكلفة البضاعة المباعة (COGS) تلقائياً بالمتوسط المرجح',
                  'رواتب → مصروف الرواتب مدين / الخزينة دائن',
                ].map((item) => (
                  <li key={item} className="lp-highlight-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth/register" className="lp-btn-primary-sm" style={{ display: 'inline-flex', marginTop: '24px' }}>
                جرّب المحاسبة التلقائية مجاناً
              </Link>
            </div>
            <div className="lp-highlight-visual">
              <div className="lp-je-card">
                <div className="lp-je-header">
                  <span className="lp-je-badge">قيد تلقائي</span>
                  <span className="lp-je-number">JE-000142</span>
                </div>
                <div className="lp-je-desc">فاتورة مبيعات — شركة النور للتجارة</div>
                <div className="lp-je-table">
                  <div className="lp-je-row lp-je-header-row">
                    <span>الحساب</span><span>مدين</span><span>دائن</span>
                  </div>
                  <div className="lp-je-row">
                    <span>ح/ العملاء</span><span className="lp-je-debit">12,500</span><span>—</span>
                  </div>
                  <div className="lp-je-row">
                    <span>ح/ المبيعات</span><span>—</span><span className="lp-je-credit">11,161</span>
                  </div>
                  <div className="lp-je-row">
                    <span>ح/ ضريبة القيمة المضافة</span><span>—</span><span className="lp-je-credit">1,339</span>
                  </div>
                  <div className="lp-je-row lp-je-cogs-row">
                    <span>ح/ تكلفة البضاعة المباعة</span><span className="lp-je-debit">7,300</span><span>—</span>
                  </div>
                  <div className="lp-je-row lp-je-cogs-row">
                    <span>ح/ مخزون البضاعة</span><span>—</span><span className="lp-je-credit">7,300</span>
                  </div>
                  <div className="lp-je-row lp-je-total-row">
                    <span>الإجمالي</span>
                    <span className="lp-je-debit">19,800</span>
                    <span className="lp-je-credit">19,800</span>
                  </div>
                </div>
                <div className="lp-je-status">
                  <span className="lp-je-balanced">✓ قيد متوازن</span>
                  <span className="lp-je-auto">مُنشأ تلقائياً</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="lp-section lp-pricing-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-badge">الأسعار</div>
            <h2 className="lp-section-title">خطط تناسب كل حجم عمل</h2>
            <p className="lp-section-sub">ابدأ مجاناً لمدة 14 يوم، ثم اختر الخطة المناسبة بدون قيود</p>
          </div>
          <div className="lp-pricing-grid">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`lp-plan-card ${plan.popular ? 'lp-plan-popular' : ''}`}
                style={{ '--plan-color': plan.color } as React.CSSProperties}
              >
                {plan.popular && <div className="lp-plan-badge">الأكثر شيوعاً ⭐</div>}
                <div className="lp-plan-header">
                  <div className="lp-plan-name">{plan.nameAr}</div>
                  <div className="lp-plan-price">
                    {plan.period ? (
                      <>
                        <span className="lp-price-currency">ج.م</span>
                        <span className="lp-price-amount">{plan.price}</span>
                        <span className="lp-price-period">/{plan.period}</span>
                      </>
                    ) : (
                      <span className="lp-price-custom">{plan.price}</span>
                    )}
                  </div>
                  <p className="lp-plan-desc">{plan.desc}</p>
                </div>
                <ul className="lp-plan-features">
                  {plan.features.map((f) => (
                    <li key={f} className="lp-plan-feature lp-plan-feature-yes">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="lp-plan-feature lp-plan-feature-no">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.name === 'Enterprise' ? '#contact' : '/auth/register'}
                  className={`lp-plan-cta ${plan.popular ? 'lp-plan-cta-primary' : 'lp-plan-cta-ghost'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-badge">آراء العملاء</div>
            <h2 className="lp-section-title">يثقون بنا لإدارة أعمالهم</h2>
          </div>
          <div className="lp-testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="lp-testimonial-card">
                <div className="lp-testimonial-quote">"</div>
                <p className="lp-testimonial-text">{t.text}</p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-section">
        <div className="lp-cta-bg">
          <div className="lp-cta-orb lp-cta-orb-1" />
          <div className="lp-cta-orb lp-cta-orb-2" />
        </div>
        <div className="lp-container">
          <div className="lp-cta-inner">
            <h2 className="lp-cta-title">ابدأ رحلتك المحاسبية اليوم</h2>
            <p className="lp-cta-sub">انضم إلى أكثر من 5,000 شركة تُدير أعمالها بثقة واحترافية</p>
            <Link to="/auth/register" className="lp-btn-hero-primary">
              ابدأ مجاناً الآن — بدون بطاقة ائتمان
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <Logo />
              <p className="lp-footer-brand-desc">
                نظام محاسبة سحابي متكامل مصمم للشركات العربية الطموحة
              </p>
            </div>
            <div className="lp-footer-links-group">
              <div className="lp-footer-col">
                <div className="lp-footer-col-title">المنتج</div>
                <a href="#features" className="lp-footer-link">المميزات</a>
                <a href="#pricing" className="lp-footer-link">الأسعار</a>
                <Link to="/auth/register" className="lp-footer-link">التسجيل المجاني</Link>
              </div>
              <div className="lp-footer-col">
                <div className="lp-footer-col-title">الحساب</div>
                <Link to="/auth/login" className="lp-footer-link">تسجيل الدخول</Link>
                <Link to="/auth/register" className="lp-footer-link">إنشاء حساب</Link>
                <Link to="/auth/forgot-password" className="lp-footer-link">نسيت كلمة المرور</Link>
              </div>
              <div className="lp-footer-col">
                <div className="lp-footer-col-title">الدعم</div>
                <a href="#" className="lp-footer-link">مركز المساعدة</a>
                <a href="#" className="lp-footer-link">تواصل معنا</a>
                <a href="#" className="lp-footer-link">سياسة الخصوصية</a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2025 محاسبة Pro — جميع الحقوق محفوظة</span>
            <span>صُنع بـ ❤️ للمحاسبين العرب</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
