import { useState } from 'react';
import { 
  Stethoscope, Sparkles, HeartPulse, Eye, Calendar, Clock, 
  CheckCircle2, DollarSign, ArrowRight, ArrowLeft, ShieldCheck, 
  MapPin, Star, Phone, Award
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DepartmentsPage({ onTriggerChat }) {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [activeTab, setActiveTab] = useState('all');

  const departments = [
    {
      id: 'dental',
      category: 'dental',
      title: isAr ? 'قسم طب وجراحة الفم والأسنان' : 'Dentistry & Oral Surgery',
      doctor: isAr ? 'د. أحمد شريف' : 'Dr. Ahmed Sherif',
      doctorRole: isAr ? 'استشاري أول جراحة وتجميل الأسنان' : 'Senior Consultant of Cosmetic Dentistry',
      price: isAr ? '250 ج.م' : '250 EGP',
      icon: Stethoscope,
      accentColor: '#0d9488',
      branch: isAr ? 'فرع دمنهور والإسكندرية' : 'Damanhour & Alexandria Branches',
      schedule: isAr ? 'السبت، الإثنين، الأربعاء (2:00 م - 9:00 م)' : 'Sat, Mon, Wed (2:00 PM - 9:00 PM)',
      overview: isAr
        ? 'يقدم القسم رعاية سنية متكاملة وفق أحدث البرتوكولات العالمية، مع وحدة تعقيم جراحي رقمي ثلاثي وفريق مدرب للتعامل مع الحالات الحرجة والتجميلية بدقة وأمان تام.'
        : 'Offering comprehensive dental care aligned with global standards, featuring a 3-stage digital sterilization unit and specialized cosmetic restorations.',
      procedures: isAr
        ? [
            'علاج الجذور المجهري (Root Canal) في جلسة واحدة',
            'تبييض الأسنان الرقمي Zoom 4 المتطور',
            'زراعة الأسنان الفورية بالغرسات الألمانية المعتمدة',
            'تقويم الأسنان الشفاف والمعدني للأطفال والبالغين',
            'ابتسامة هوليود الرقمية وتيجان الزيركون والبورسلين'
          ]
        : [
            'Microscopic single-session root canal treatment',
            'Advanced Philips Zoom 4 digital whitening',
            'Immediate German titanium dental implants',
            'Clear aligners and metal orthodontics',
            'Digital Hollywood Smile & Zirconia crowns'
          ],
      bookingQuery: isAr 
        ? 'عايز ميعاد كشف أسنان مع د. أحمد شريف' 
        : 'I would like to book a dental consultation with Dr. Ahmed Sherif'
    },
    {
      id: 'derma',
      category: 'derma',
      title: isAr ? 'قسم الجلدية، الليزر وتجميل البشرة' : 'Dermatology, Laser & Aesthetics',
      doctor: isAr ? 'د. سارة محمود' : 'Dr. Sarah Mahmoud',
      doctorRole: isAr ? 'استشارية الأمراض الجلدية والليزر التجميلي' : 'Consultant of Dermatology & Aesthetic Lasers',
      price: isAr ? '300 ج.م' : '300 EGP',
      icon: Sparkles,
      accentColor: '#ec4899',
      branch: isAr ? 'فرع دمنهور (الرئيسي)' : 'Damanhour Main Branch',
      schedule: isAr ? 'الأحد، الثلاثاء، الخميس (1:00 م - 8:00 م)' : 'Sun, Tue, Thu (1:00 PM - 8:00 PM)',
      overview: isAr
        ? 'مجهز بأحدث أجهزة الليزر الطبي كانديلا والهايفو المعتمدة من الـ FDA، لعلاج كافة الأمراض الجلدية وحقن الفيلر والبوتوكس وجلسات النضارة بأعلى درجات الأمان.'
        : 'Equipped with FDA-cleared Candela GentleLase and HIFU devices for dermatological therapies, botox, dermal fillers, and radiant skin rejuvenation.',
      procedures: isAr
        ? [
            'جلسات إزالة الشعر بالليزر كانديلا برو المزود بالتبريد',
            'حقن البوتوكس للتجاعيد وفرط التعرق والفيلر الفرنسي',
            'جلسات الهيدرافيشل الملكي وتنظيف البشرة العميق',
            'التقشير الكيميائي والبارد لعلاج الكلف والتصبغات',
            'بروتوكولات علاج حب الشباب والندبات بالليزر المجزأ'
          ]
        : [
            'Candela GentleLase Pro laser hair removal with cooling',
            'FDA-approved Botox for wrinkles & French dermal fillers',
            'Royal HydraFacial & deep medical skin cleansing',
            'Chemical & cold peeling for hyperpigmentation and melasma',
            'Fractional laser protocols for acne scar resurfacing'
          ],
      bookingQuery: isAr 
        ? 'عايز ميعاد كشف جلدية مع د. سارة محمود' 
        : 'I would like to book a dermatology appointment with Dr. Sarah Mahmoud'
    },
    {
      id: 'internal',
      category: 'internal',
      title: isAr ? 'قسم أمراض الباطنة العامة والقلب' : 'Internal Medicine & Cardiology',
      doctor: isAr ? 'د. حسام فتحي' : 'Dr. Hossam Fathy',
      doctorRole: isAr ? 'استشاري أول أمراض الباطنة والقلب والأوعية' : 'Senior Consultant of Internal Medicine & Cardiology',
      price: isAr ? '280 ج.م' : '280 EGP',
      icon: HeartPulse,
      accentColor: '#3b82f6',
      branch: isAr ? 'فرع الإسكندرية (ستانلي)' : 'Alexandria Stanley Branch',
      schedule: isAr ? 'السبت إلى الخميس (3:00 م - 10:00 م)' : 'Sat to Thu (3:00 PM - 10:00 PM)',
      overview: isAr
        ? 'تشخيص متقدم وعناية حثيثة بمصابي ارتفاع ضغط الدم والسكري، مع أجهزة رسم قلب رقمية فورية وفحوصات دورية للوقاية من مضاعفات الأوعية الدموية والجهاز الهضمي.'
        : 'Advanced diagnostics and longitudinal care for hypertension, diabetes, and cardiovascular wellness, equipped with 12-lead digital ECG.',
      procedures: isAr
        ? [
            'تخطيط ورسم القلب الكهربائي الرقمي الفوري (12-Lead ECG)',
            'برنامج المتابعة الشاملة لمرضى السكري والضغط العصبي',
            'تشخيص اضطرابات الجهاز الهضمي والقولون العصبي وجرثومة المعدة',
            'الفحص السريري الدوري الشامل لكبار السن والرياضيين',
            'استشارات وظائف الكبد والكلى والدهون الثلاثية'
          ]
        : [
            'Instant 12-lead digital electrocardiogram (ECG)',
            'Comprehensive glycemic & hypertensive control protocols',
            'Gastrointestinal, IBS, and H. pylori diagnostic evaluations',
            'Complete executive wellness exams for seniors and athletes',
            'Metabolic syndrome, lipid profile, and renal checkups'
          ],
      bookingQuery: isAr 
        ? 'عايز ميعاد كشف باطنة مع د. حسام فتحي' 
        : 'I would like to book an internal medicine appointment with Dr. Hossam Fathy'
    },
    {
      id: 'eye',
      category: 'eye',
      title: isAr ? 'قسم طب وجراحة العيون والليزر' : 'Ophthalmology & Laser Eye Surgery',
      doctor: isAr ? 'د. مريم نبيل' : 'Dr. Maryam Nabil',
      doctorRole: isAr ? 'استشارية طب وجراحة العيون وتصحيح الإبصار' : 'Consultant Ophthalmologist & Refractive Surgeon',
      price: isAr ? '260 ج.م' : '260 EGP',
      icon: Eye,
      accentColor: '#8b5cf6',
      branch: isAr ? 'فرع الإسكندرية (ستانلي)' : 'Alexandria Stanley Branch',
      schedule: isAr ? 'الأحد، الثلاثاء، الخميس (4:00 م - 9:00 م)' : 'Sun, Tue, Thu (4:00 PM - 9:00 PM)',
      overview: isAr
        ? 'عيادة تخصصية دقيقة لفحص النظر بأحدث الأجهزة الرقمية، ومتابعة اعتلال الشبكية السكري، وتقديم استشارات تصحيح عيوب الإبصار بالفيمتو ليزك وسطحية الليزر.'
        : 'Precision eye clinic utilizing digital autorefractors, diabetic retinopathy imaging, and comprehensive Femto-LASIK candidate evaluations.',
      procedures: isAr
        ? [
            'فحص قياس حدة النظر الرقمي وضغط العين غير التلامسي',
            'فحص قاع العين المجهري الموسّع لمتابعة السكري',
            'الفحص الطبوغرافي لقرنية العين لمرشحي الليزك والفيمتو',
            'تشخيص وعلاج جفاف العين المزمن والحساسية الموسمية',
            'متابعة حالات المياه البيضاء وضغط العين (الجلوكوما)'
          ]
        : [
            'Digital visual acuity and non-contact intraocular tonometry',
            'Dilated fundus photography for diabetic eye evaluation',
            'Corneal topography screening for LASIK & PRK candidates',
            'Dry eye syndrome therapy and ocular allergy management',
            'Cataract evaluation and glaucoma monitoring'
          ],
      bookingQuery: isAr 
        ? 'عايز ميعاد كشف عيون مع د. مريم نبيل' 
        : 'I would like to book an ophthalmology appointment with Dr. Maryam Nabil'
    }
  ];

  const filteredDepts = activeTab === 'all' 
    ? departments 
    : departments.filter(d => d.category === activeTab);

  return (
    <div className="departments-page animate-slide-up" style={{ padding: '2rem 1rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="glass" style={{ padding: '2.5rem 2rem', borderRadius: '24px', textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
          <Award size={16} />
          <span>{isAr ? 'الأقسام الطبية المعتمدة - ترخيص وزارة الصحة 84192/ج' : 'Certified Medical Departments - Egyptian MOH License 84192/G'}</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
          {isAr ? 'التخصصات والأقسام الطبية المتكاملة' : 'Integrated Medical Departments & Specialties'}
        </h1>
        <p style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7' }}>
          {isAr 
            ? 'تضم عيادات سمارت كلينك نخبة من الأقسام التخصصية المجهزة بأحدث التقنيات الأوروبية وفريق طبي حاصل على أعلى الدرجات العلمية لتقديم رعاية صحية تليق بكم.'
            : 'Smart Clinic features fully certified specialized divisions equipped with cutting-edge medical equipment and senior healthcare consultants.'}
        </p>

        {/* Multi-Doctor Booking Action */}
        <div style={{ marginTop: '1.8rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn-primary"
            onClick={() => onTriggerChat && onTriggerChat(isAr ? 'عايز استفسر عن تخصصات العيادة والمواعيد' : 'I want to inquire about clinic specialties and available slots')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 1.8rem' }}
          >
            <Sparkles size={18} />
            <span>{isAr ? 'تحدث مع نورا لاختيار التخصص المناسب' : 'Ask Nora to Match Your Specialty'}</span>
          </button>
          <button 
            className="btn-secondary"
            onClick={() => onTriggerChat && onTriggerChat(isAr ? 'عايز احجز كشف في كذا تخصص مع بعض' : 'I would like to book a multi-department consultation')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 1.8rem', background: '#fff', border: '1px solid var(--card-border)' }}
          >
            <Calendar size={18} />
            <span>{isAr ? 'حجز موحد لأكثر من عيادة (سلة الكشوفات)' : 'Multi-Doctor Combined Booking Cart'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: isAr ? 'جميع الأقسام' : 'All Departments' },
          { id: 'dental', label: isAr ? 'طب الأسنان' : 'Dentistry' },
          { id: 'derma', label: isAr ? 'الجلدية والليزر' : 'Dermatology' },
          { id: 'internal', label: isAr ? 'الباطنة والقلب' : 'Internal & Heart' },
          { id: 'eye', label: isAr ? 'جراحة العيون' : 'Ophthalmology' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '50px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === tab.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.8)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-main)',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Department Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        {filteredDepts.map(dept => {
          const DeptIcon = dept.icon;
          return (
            <div 
              key={dept.id} 
              className="glass"
              style={{
                borderRadius: '20px',
                padding: '1.8rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                borderTop: `4px solid ${dept.accentColor}`
              }}
            >
              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '14px', 
                      background: `${dept.accentColor}18`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: dept.accentColor
                    }}>
                      <DeptIcon size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{dept.title}</h3>
                      <span style={{ fontSize: '0.85rem', color: dept.accentColor, fontWeight: 700 }}>{dept.doctor}</span>
                    </div>
                  </div>
                  <span style={{ 
                    background: 'var(--primary-light)', 
                    color: 'var(--primary-hover)', 
                    padding: '0.3rem 0.7rem', 
                    borderRadius: '8px', 
                    fontSize: '0.9rem', 
                    fontWeight: 800 
                  }}>
                    {dept.price}
                  </span>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.2rem' }}>
                  {dept.overview}
                </p>

                {/* Location and Schedule */}
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1.2rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                    <MapPin size={15} color="var(--primary-color)" />
                    <strong>{dept.branch}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Clock size={15} color="var(--accent-amber)" />
                    <span>{dept.schedule}</span>
                  </div>
                </div>

                {/* Procedures List */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.6rem' }}>
                    {isAr ? 'أبرز الإجراءات والخدمات المتاحة:' : 'Key Clinical Procedures & Therapies:'}
                  </span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {dept.procedures.map((proc, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                        <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
                        <span>{proc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                className="btn-primary"
                onClick={() => onTriggerChat && onTriggerChat(dept.bookingQuery)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px'
                }}
              >
                <span>{isAr ? 'حجز موعد كشف فوري' : 'Book Consultation Slot'}</span>
                <ArrowIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
