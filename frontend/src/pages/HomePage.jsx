import { Stethoscope, Calendar, ShieldCheck, HeartPulse, Clock, Sparkles, UserCheck, ArrowLeft, ArrowRight, Star, Phone, Award, MapPin, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage({ onTriggerChat }) {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const specialties = [
    {
      title: isAr ? 'طب وجراحة الأسنان' : 'Dentistry & Oral Surgery',
      doctor: isAr ? 'د. أحمد شريف' : 'Dr. Ahmed Sherif',
      desc: isAr 
        ? 'زراعة، تبييض زووم الرقمي، علاج الجذور، والتقويم بأحدث التجهيزات الألمانية.'
        : 'German dental implants, Zoom 4 digital whitening, root canal and orthodontics.',
      icon: Stethoscope,
      days: isAr ? 'السبت، الإثنين، الأربعاء (2:00 م - 9:00 م)' : 'Sat, Mon, Wed (2:00 PM - 9:00 PM)',
      bookingQuery: isAr ? 'عايز ميعاد كشف أسنان مع د. أحمد شريف' : 'I want to book a dental appointment with Dr. Ahmed Sherif'
    },
    {
      title: isAr ? 'الجلدية والتجميل والليزر' : 'Dermatology, Laser & Aesthetics',
      doctor: isAr ? 'د. سارة محمود' : 'Dr. Sarah Mahmoud',
      desc: isAr 
        ? 'علاجات البشرة، الليزر الطبي كانديلا، وعلاجات النضارة والفيلر والتقشير الكيميائي.'
        : 'Candela medical lasers, botox & filler rejuvenation, and chemical peeling.',
      icon: Sparkles,
      days: isAr ? 'الأحد، الثلاثاء، الخميس (1:00 م - 8:00 م)' : 'Sun, Tue, Thu (1:00 PM - 8:00 PM)',
      bookingQuery: isAr ? 'عايز ميعاد كشف جلدية مع د. سارة محمود' : 'I want to book a dermatology appointment with Dr. Sarah Mahmoud'
    },
    {
      title: isAr ? 'أمراض الباطنة والقلب' : 'Internal Medicine & Cardiology',
      doctor: isAr ? 'د. حسام فتحي' : 'Dr. Hossam Fathy',
      desc: isAr 
        ? 'متابعة أمراض الضغط والسكر، رسم القلب الرقمي، وتشخيص اضطرابات الجهاز الهضمي.'
        : 'Longitudinal hypertension & diabetes care, 12-lead ECG, and digestive checkups.',
      icon: HeartPulse,
      days: isAr ? 'السبت إلى الخميس (3:00 م - 10:00 م)' : 'Sat to Thu (3:00 PM - 10:00 PM)',
      bookingQuery: isAr ? 'عايز ميعاد كشف باطنة مع د. حسام فتحي' : 'I want to book an internal medicine appointment with Dr. Hossam Fathy'
    },
    {
      title: isAr ? 'طب وجراحة العيون' : 'Ophthalmology & Refractive Surgery',
      doctor: isAr ? 'د. مريم نبيل' : 'Dr. Maryam Nabil',
      desc: isAr 
        ? 'فحص قاع العين، قياس النظر الرقمي، وعمليات تصحيح الإبصار بالفيمتو ليزك.'
        : 'Digital eye refraction, dilated diabetic fundus scans, and Femto-LASIK care.',
      icon: UserCheck,
      days: isAr ? 'الأحد، الثلاثاء، الخميس (4:00 م - 9:00 م)' : 'Sun, Tue, Thu (4:00 PM - 9:00 PM)',
      bookingQuery: isAr ? 'عايز ميعاد كشف عيون مع د. مريم نبيل' : 'I want to book an eye exam with Dr. Maryam Nabil'
    }
  ];

  const accreditations = [
    {
      title: isAr ? 'شهادة الجودة العالمية ISO 9001' : 'ISO 9001:2015 International Quality',
      issuer: isAr ? 'المنظمة الدولية للمعايير - سويسرا' : 'International Organization for Standardization - Geneva',
      desc: isAr 
        ? 'التزام تام بأعلى معايير إدارة الرعاية الصحية وضمان جودة الخدمات الطبية الرقمية.'
        : 'Total adherence to international clinical governance and healthcare quality assurance.',
      badge: 'ISO 9001:2015'
    },
    {
      title: isAr ? 'الاعتماد الدولي للرعاية الطبية JCI' : 'JCI Healthcare Accreditation',
      issuer: isAr ? 'Joint Commission International' : 'Joint Commission International - USA',
      desc: isAr 
        ? 'مطابقة بروتوكولات سلامة المرضى، مكافحة العدوى، والتعقيم الرقمي المعتمد عالمياً.'
        : 'Compliance with patient safety international protocols, infection control, and sterile practices.',
      badge: 'JCI Accredited'
    },
    {
      title: isAr ? 'ترخيص وزارة الصحة المصرية' : 'Egyptian Ministry of Health License',
      issuer: isAr ? 'وزارة الصحة والسكان - قطاع العلاج الحر' : 'Egyptian Ministry of Health - License 84192/G',
      desc: isAr 
        ? 'ترخيص تشغيل رسمي معتمد برقم 84192/ج وفق أحدث الاشتراطات واللوائح الصحية المصرية.'
        : 'Official government operating license #84192/G following modern medical sanitary standards.',
      badge: isAr ? 'ترخيص حكومي رسمي' : 'Official MOH License'
    }
  ];

  const branches = [
    {
      name: isAr ? 'فرع دمنهور (الرئيسي)' : 'Damanhour (Main Branch)',
      city: isAr ? 'دمنهور - البحيرة' : 'Damanhour - Beheira',
      address: isAr 
        ? 'شارع عبد السلام الشاذلي، برج النخبة الطبي (أمام البنك الأهلي المصري)، الدور الثالث'
        : 'Abdel Salam El Shazly St, Al Nokba Medical Tower, 3rd Floor',
      phone: '045-3312900 / 01012345678',
      doctors: isAr ? 'د. أحمد شريف (الأسنان) • د. سارة محمود (الجلدية)' : 'Dr. Ahmed Sherif (Dental) • Dr. Sarah Mahmoud (Derma)',
      hours: isAr ? 'السبت إلى الخميس من 1:00 م إلى 10:00 م' : 'Sat to Thu: 1:00 PM - 10:00 PM'
    },
    {
      name: isAr ? 'فرع الإسكندرية (ستانلي)' : 'Alexandria (Stanley Branch)',
      city: isAr ? 'ستانلي - الإسكندرية' : 'Stanley - Alexandria',
      address: isAr 
        ? 'طريق الجيش (الكورنيش)، عمارات قصر البحر، بجوار كوبري ستانلي، الدور الثاني'
        : 'Army Road (Corniche), Qasr El Bahr Towers, next to Stanley Bridge, 2nd Floor',
      phone: '03-5498800 / 01098765432',
      doctors: isAr ? 'د. حسام فتحي (الباطنة والقلب) • د. مريم نبيل (العيون) • د. أحمد شريف' : 'Dr. Hossam Fathy (Internal) • Dr. Maryam Nabil (Ophthalmology)',
      hours: isAr ? 'السبت إلى الخميس من 2:00 م إلى 10:00 م' : 'Sat to Thu: 2:00 PM - 10:00 PM'
    }
  ];

  return (
    <div className="home-container animate-slide-up">
      {/* Hero Section */}
      <section className="hero-section glass">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>{t('heroBadge')}</span>
          </div>
          <h1 className="hero-title">
            {t('heroTitlePrefix')}<span className="highlight-text">{t('heroTitleHighlight')}</span>{t('heroTitleSuffix')}
          </h1>
          <p className="hero-subtitle">
            {t('heroSubtitle')}
          </p>

          <div className="hero-actions">
            <button 
              className="btn-primary"
              onClick={() => onTriggerChat && onTriggerChat(isAr ? 'السلام عليكم، حابب أحجز كشف طبي' : 'Hello, I would like to book a medical appointment')}
            >
              <Calendar size={18} />
              <span>{t('heroBookBtn')}</span>
            </button>
            <Link to="/departments" className="btn-secondary">
              <span>{t('heroDeptBtn')}</span>
              <ArrowIcon size={18} />
            </Link>
          </div>

          <div className="hero-stats-row">
            <div className="hero-stat">
              <span className="stat-number">{t('statPatients')}</span>
              <span className="stat-label">{t('statPatientsLabel')}</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">4.9 ★</span>
              <span className="stat-label">{isAr ? 'تقييم رضا المرضى' : 'Patient Satisfaction'}</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">{isAr ? 'تشفير وأمان البيانات (AES-256)' : 'Encrypted & Safe (AES-256)'}</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{isAr ? '3 اعتمادات' : '3 Accreditations'}</span>
              <span className="stat-label">{isAr ? 'دولية ومحلية معتمدة' : 'Official Certifications'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="specialties-section">
        <div className="section-header">
          <h2>{isAr ? 'التخصصات والعيادات المتاحة' : 'Specialized Medical Clinics'}</h2>
          <p>{isAr ? 'اختر العيادة المناسبة وتحدث مع موظفة الاستقبال "نورا" لحجز ميعادك أو الحجز المتعدد بسهولة' : 'Select a department and chat with Nora for direct single or multi-doctor appointments'}</p>
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
                  <span>{isAr ? 'طلب حجز كشف' : 'Book Consultation'}</span>
                  <ArrowIcon size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Official Accreditations & Certifications */}
      <section className="accreditations-section" style={{ margin: '3rem 0' }}>
        <div className="section-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Award size={16} />
            <span>{isAr ? 'اعتمادات الجودة والمعايير العالمية' : 'Certified Standards & Quality'}</span>
          </div>
          <h2>{t('accreditationsTitle')}</h2>
          <p>{t('accreditationsSubtitle')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {accreditations.map((acc, i) => (
            <div key={i} className="glass" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.25)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#10b981' }}>
                  <ShieldCheck size={26} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', background: '#10b981', color: '#fff', borderRadius: '6px' }}>
                  {acc.badge}
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{acc.title}</h3>
              <div style={{ fontSize: '0.85rem', color: '#0d9488', fontWeight: 600, marginBottom: '0.75rem' }}>{acc.issuer}</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{acc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clinic Branches & Locations */}
      <section className="branches-section" style={{ margin: '3rem 0' }}>
        <div className="section-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <MapPin size={16} />
            <span>{isAr ? 'فروعنا في خدمتك دائماً' : 'Certified Branch Network'}</span>
          </div>
          <h2>{t('branchesTitle')}</h2>
          <p>{t('branchesSubtitle')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {branches.map((branch, idx) => (
            <div key={idx} className="glass" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#3b82f6' }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{branch.name}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600 }}>{branch.city}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{isAr ? 'العنوان التفصيلي:' : 'Address:'}</strong> {branch.address}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{isAr ? 'الأطباء المتواجدون:' : 'Consultants:'}</strong> {branch.doctors}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{isAr ? 'مواعيد العمل:' : 'Hours:'}</strong> {branch.hours}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, marginTop: '0.5rem' }}>
                  <Phone size={16} />
                  <span>{branch.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Value Props */}
      <section className="features-section glass">
        <div className="section-header">
          <h2>{isAr ? 'لماذا تختار سمارت كلينك AI؟' : 'Why Choose Smart Clinic AI?'}</h2>
          <p>{isAr ? 'معايير طبية وتقنية فائقة لراحتك وسرعة رعايتك الصحية' : 'Elevated medical and technical excellence designed around your comfort'}</p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <ShieldCheck size={32} color="#10b981" />
            <h4>{isAr ? 'حماية وخصوصية تامة (AES-256)' : 'Enterprise Privacy (AES-256)'}</h4>
            <p>{isAr ? 'تشفير عسكري لاسمك، رقمك وسجلك الطبي لمنع أي تسريب أو انتهاك لخصوصيتك.' : 'Military-grade encryption securing your identity, telephone, and health records.'}</p>
          </div>
          <div className="feature-box">
            <Sparkles size={32} color="#0d9488" />
            <h4>{isAr ? 'استقبال ذكي وسريع 24/7' : '24/7 Intelligent AI Reception'}</h4>
            <p>{isAr ? 'الموظفة الافتراضية "نورا" متوفرة في أي ثانية، وتتكيف مع حالتك واستعجالك بدقة فائقة.' : 'AI receptionist Nora is on-duty round the clock, adapting flexibly to your inquiries.'}</p>
          </div>
          <div className="feature-box">
            <Phone size={32} color="#3b82f6" />
            <h4>{isAr ? 'تأكيد فوري وتذكير واتساب' : 'Instant Confirmation & WhatsApp Alerts'}</h4>
            <p>{isAr ? 'كود حجز خماسي نقي، تأكيد فوري لنفس اليوم، وتذكير واتساب آلي قبل ميعادك.' : 'Clean 5-digit booking code, instantaneous slot reservation, and timely WhatsApp reminders.'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
