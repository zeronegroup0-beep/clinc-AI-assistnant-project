import { Stethoscope, Sparkles, HeartPulse, UserCheck, Check, Clock, ArrowLeft } from 'lucide-react';

export default function ServicesPage({ onTriggerChat }) {
  const services = [
    {
      id: 'dent-1',
      category: 'طب الأسنان',
      name: 'كشف واستشارة أسنان شاملة',
      doctor: 'د. أحمد شريف',
      price: '350 ج.م',
      duration: '30 دقيقة',
      features: ['فحص بالأشعة الرقمية', 'خطة علاجية مخصصة', 'تنظيف جير وقائي']
    },
    {
      id: 'dent-2',
      category: 'طب الأسنان',
      name: 'جلسة تبييض الأسنان بالليزر (Zoom)',
      doctor: 'د. أحمد شريف',
      price: '1,800 ج.م',
      duration: '45 دقيقة',
      features: ['تفتيح حتى 8 درجات', 'حماية اللثة الحساسة', 'نتائج فورية بنفس الجلسة']
    },
    {
      id: 'derma-1',
      category: 'الجلدية والتجميل',
      name: 'كشف وتشخيص أمراض الجلدية',
      doctor: 'د. سارة محمود',
      price: '400 ج.م',
      duration: '30 دقيقة',
      features: ['فحص بالميكروسكوب الجلدي', 'علاج حب الشباب والآثار', 'برنامج عناية متكامل']
    },
    {
      id: 'derma-2',
      category: 'الجلدية والتجميل',
      name: 'جلسة نضارة وترطيب البشرة (HydraFacial)',
      doctor: 'د. سارة محمود',
      price: '950 ج.م',
      duration: '45 دقيقة',
      features: ['تنظيف عميق للمسامات', 'سيروم حمض الهيالورونيك', 'إشراقة ونضارة فورية']
    },
    {
      id: 'cardio-1',
      category: 'الباطنة والقلب',
      name: 'كشف باطنة ورسم قلب كهربائي (ECG)',
      doctor: 'د. حسام فتحي',
      price: '500 ج.م',
      duration: '40 دقيقة',
      features: ['تخطيط قلب كامل', 'قياس ومتابعة الضغط والسكر', 'فحص وظائف حيوية']
    },
    {
      id: 'eye-1',
      category: 'العيون والرمد',
      name: 'فحص قاع العين وقياس ضغط العين',
      doctor: 'د. مريم نبيل',
      price: '400 ج.م',
      duration: '30 دقيقة',
      features: ['فحص المصباح الشقي المجهري', 'تحديد مقاسات النظارة والعدسات', 'فحص الشبكية']
    }
  ];

  return (
    <div className="services-container animate-slide-up" dir="rtl">
      <div className="page-header-box">
        <h2>قائمة الخدمات الطبية والأسعار</h2>
        <p>أسعار شفافة وخدمات استشارية متكاملة تحت إشراف نخبة الأطباء</p>
      </div>

      <div className="services-grid">
        {services.map((srv) => (
          <div key={srv.id} className="service-card glass animate-slide-up">
            <div className="service-badge">{srv.category}</div>
            <h3 className="service-name">{srv.name}</h3>
            <div className="service-doctor">{srv.doctor}</div>

            <div className="service-pricing-row">
              <span className="service-price">{srv.price}</span>
              <span className="service-duration">
                <Clock size={14} />
                {srv.duration}
              </span>
            </div>

            <ul className="service-features-list">
              {srv.features.map((f, i) => (
                <li key={i}>
                  <Check size={14} color="#10b981" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              className="service-book-btn"
              onClick={() => onTriggerChat && onTriggerChat(`عايز أحجز خدمة "${srv.name}" مع ${srv.doctor}`)}
            >
              <span>طلب حجز الخدمة عبر نورا</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
