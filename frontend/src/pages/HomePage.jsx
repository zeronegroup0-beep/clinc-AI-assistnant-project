import { Stethoscope, Calendar, ShieldCheck, HeartPulse, Clock, Sparkles, UserCheck, ArrowLeft, Star, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage({ onTriggerChat }) {
  const specialties = [
    {
      title: 'طب وجراحة الأسنان',
      doctor: 'د. أحمد شريف',
      desc: 'زراعة، تبييض، علاج الجذور، والتقويم بأحدث الأجهزة الرقمية.',
      icon: Stethoscope,
      days: 'السبت، الإثنين، الأربعاء',
      bookingQuery: 'عايز ميعاد كشف أسنان مع د. أحمد شريف'
    },
    {
      title: 'الجلدية والتجميل والليزر',
      doctor: 'د. سارة محمود',
      desc: 'علاجات البشرة، الليزر الطبي، وعلاجات النضارة والفيلر والتقشير.',
      icon: Sparkles,
      days: 'الأحد، الثلاثاء، الخميس',
      bookingQuery: 'عايز ميعاد كشف جلدية مع د. سارة محمود'
    },
    {
      title: 'أمراض الباطنة والقلب',
      doctor: 'د. حسام فتحي',
      desc: 'متابعة أمراض الضغط والسكر، رسم القلب، وتشخيص اضطرابات الجهاز الهضمي.',
      icon: HeartPulse,
      days: 'السبت إلى الخميس',
      bookingQuery: 'عايز ميعاد كشف باطنة مع د. حسام فتحي'
    },
    {
      title: 'طب وجراحة العيون',
      doctor: 'د. مريم نبيل',
      desc: 'فحص قاع العين، قياس النظر، وعمليات تصحيح الإبصار بالليزك.',
      icon: UserCheck,
      days: 'الأحد، الثلاثاء، الخميس',
      bookingQuery: 'عايز ميعاد كشف عيون مع د. مريم نبيل'
    }
  ];

  return (
    <div className="home-container animate-slide-up" dir="rtl">
      {/* Hero Section */}
      <section className="hero-section glass">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>نظام الحجز الذكي المدعوم بالذكاء الاصطناعي</span>
          </div>
          <h1 className="hero-title">
            عيادة <span className="highlight-text">سمارت كلينك</span> المتطورة
          </h1>
          <p className="hero-subtitle">
            تجربة صحية فريدة تجمع بين نخبة من كبار الاستشاريين وأحدث تقنيات الـ AI لحجز وتنظيم مواعيدك بخصوصية تامة عبر موظفة الاستقبال الافتراضية "نورا".
          </p>

          <div className="hero-actions">
            <button 
              className="btn-primary"
              onClick={() => onTriggerChat && onTriggerChat('السلام عليكم، حابب أحجز كشف طبي')}
            >
              <Calendar size={18} />
              <span>احجز كشفك الآن مع نورا</span>
            </button>
            <Link to="/services" className="btn-secondary">
              <span>استكشف الخدمات والأسعار</span>
              <ArrowLeft size={18} />
            </Link>
          </div>

          <div className="hero-stats-row">
            <div className="hero-stat">
              <span className="stat-number">+15,000</span>
              <span className="stat-label">مريض تم علاجهم</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">4.9 ★</span>
              <span className="stat-label">تقييم المرضى</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">تشفير وأمان البيانات (AES-256)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="specialties-section">
        <div className="section-header">
          <h2>التخصصات والعيادات المتاحة</h2>
          <p>اختر العيادة المناسبة وتحدث مع موظفة الاستقبال لتأكيد الموعد فوراً</p>
        </div>

        <div className="specialties-grid">
          {specialties.map((spec, index) => {
            const Icon = spec.icon;
            return (
              <div key={index} className="specialty-card glass animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="spec-icon-box">
                  <Icon size={26} color="var(--primary-color)" />
                </div>
                <h3>{spec.title}</h3>
                <div className="spec-doctor-name">{spec.doctor}</div>
                <p>{spec.desc}</p>
                <div className="spec-days">
                  <Clock size={14} />
                  <span>{spec.days}</span>
                </div>
                <button 
                  className="spec-book-btn"
                  onClick={() => onTriggerChat && onTriggerChat(spec.bookingQuery)}
                >
                  <span>طلب حجز كشف</span>
                  <ArrowLeft size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Value Props */}
      <section className="features-section glass">
        <div className="section-header">
          <h2>لماذا تختار سمارت كلينك؟</h2>
          <p>معايير طبية وتقنية عالمية لراحتك وأمان بياناتك</p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <ShieldCheck size={32} color="#10b981" />
            <h4>حماية وخصوصية تامة</h4>
            <p>تشفير عسكري AES-256 لكافة بياناتك الشخصية وسجلك الطبي لحماية قصوى.</p>
          </div>
          <div className="feature-box">
            <Sparkles size={32} color="#0d9488" />
            <h4>استقبال ذكي 24/7</h4>
            <p>الموظفة الافتراضية "نورا" تجيب على استفساراتك وتحجز مواعيدك في أي وقت بلغة مصرية ودودة.</p>
          </div>
          <div className="feature-box">
            <Phone size={32} color="#3b82f6" />
            <h4>تأكيد ومتابعة عبر الواتساب</h4>
            <p>إشعارات فورية وتنبيهات قائمة الانتظار مباشرة على رقم هاتفك دون أي تأخير.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
