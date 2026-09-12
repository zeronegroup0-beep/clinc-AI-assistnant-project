import { Stethoscope, Sparkles, HeartPulse, UserCheck, Calendar, Award, ArrowLeft, Clock } from 'lucide-react';

export default function DoctorsPage({ onTriggerChat }) {
  const doctors = [
    {
      id: 'ahmed',
      name: 'د. أحمد شريف',
      title: 'استشاري طب وجراحة وتجميل الأسنان',
      degree: 'ماجستير جراحة الفم والأسنان - جامعة القاهرة • زمالة الكلية الملكية للجراحين',
      experience: 'خبرة 14 عاماً',
      schedule: 'السبت، الإثنين، الأربعاء (2:00 م - 9:00 م)',
      specialty: 'الأسنان',
      icon: Stethoscope,
      accent: '#0d9488'
    },
    {
      id: 'sara',
      name: 'د. سارة محمود',
      title: 'أخصائية الأمراض الجلدية والتجميل والليزر',
      degree: 'ماجستير الأمراض الجلدية والتناسلية - جامعة عين شمس • عضو الجمعية المصرية لأطباء الجلدية',
      experience: 'خبرة 10 أعوام',
      schedule: 'الأحد، الثلاثاء، الخميس (1:00 م - 8:00 م)',
      specialty: 'الجلدية',
      icon: Sparkles,
      accent: '#ec4899'
    },
    {
      id: 'hossam',
      name: 'د. حسام فتحي',
      title: 'استشاري أمراض الباطنة والقلب والأوعية الدموية',
      degree: 'دكتوراه أمراض القلب والأوعية الدموية - جامعة الإسكندرية • استشاري بمعهد القلب القومي',
      experience: 'خبرة 18 عاماً',
      schedule: 'السبت إلى الخميس (3:00 م - 10:00 م)',
      specialty: 'الباطنة والقلب',
      icon: HeartPulse,
      accent: '#3b82f6'
    },
    {
      id: 'mariam',
      name: 'د. مريم نبيل',
      title: 'أخصائية طب وجراحة العيون والليزك',
      degree: 'ماجستير طب وجراحة العيون - جامعة القاهرة • عضو الجمعية الرمدية المصرية',
      experience: 'خبرة 9 أعوام',
      schedule: 'الأحد، الثلاثاء، الخميس (4:00 م - 9:00 م)',
      specialty: 'العيون',
      icon: UserCheck,
      accent: '#8b5cf6'
    }
  ];

  return (
    <div className="doctors-container animate-slide-up" dir="rtl">
      <div className="page-header-box">
        <h2>فريق الاستشاريين والأطباء</h2>
        <p>نخبة من أفضل الكفاءات الطبية والأكاديمية لتقديم أعلى مستويات الرعاية الصحية</p>
      </div>

      <div className="doctors-grid">
        {doctors.map((doc) => {
          const Icon = doc.icon;
          return (
            <div key={doc.id} className="doctor-profile-card glass animate-slide-up">
              <div className="doctor-header-row">
                <div className="doc-avatar-circle" style={{ backgroundColor: `${doc.accent}15`, color: doc.accent }}>
                  <Icon size={32} />
                </div>
                <div className="doc-title-meta">
                  <h3>{doc.name}</h3>
                  <p className="doc-subtitle">{doc.title}</p>
                </div>
              </div>

              <div className="doc-degree-box">
                <Award size={16} color="var(--primary-color)" />
                <span>{doc.degree}</span>
              </div>

              <div className="doc-schedule-box">
                <div className="schedule-item">
                  <Clock size={14} />
                  <span><strong>أيام العمل:</strong> {doc.schedule}</span>
                </div>
                <div className="schedule-item">
                  <Calendar size={14} />
                  <span><strong>الخبرة:</strong> {doc.experience}</span>
                </div>
              </div>

              <button
                className="doc-book-cta"
                onClick={() => onTriggerChat && onTriggerChat(`عايز أحجز كشف مع ${doc.name}`)}
              >
                <span>طلب حجز ميعاد مع {doc.name.split(' ')[1]}</span>
                <ArrowLeft size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
