import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  ar: {
    // Navigation
    brandTitle: 'سمارت كلينك AI',
    brandSubtitle: 'العيادة الذكية المتكاملة',
    navHome: 'الرئيسية',
    navDepartments: 'الأقسام والتخصصات',
    navServices: 'الخدمات والأسعار',
    navDoctors: 'فريق الأطباء',
    navSecretary: 'غرفة السكرتارية',
    navAdmin: 'لوحة الإدارة',
    navChatTrigger: 'تحدث مع نورا (الاستقبال)',
    langSwitch: 'English',

    // Hero
    heroBadge: 'نظام الحجز الذكي المعتمد دولياً مع نورا',
    heroTitlePrefix: 'عيادة ',
    heroTitleHighlight: 'سمارت كلينك AI',
    heroTitleSuffix: ' المتطورة',
    heroSubtitle: 'رعاية صحية رقمية بمعايير عالمية تجمع نخبة استشاريي مصر مع مساعد الذكاء الاصطناعي "نورا" لحجز المواعيد الفورية وإدارة العيادات بدقة فائقة.',
    heroBookBtn: 'احجز كشفك الآن مع نورا',
    heroDeptBtn: 'استكشف التخصصات الطبية',

    // Stats
    statPatients: '+18,500',
    statPatientsLabel: 'مريض تم علاجهم',
    statDoctors: '4',
    statDoctorsLabel: 'استشاريين متميزين',
    statSatisfaction: '99.4%',
    statSatisfactionLabel: 'نسبة الرضا عن نورا',
    statAvailability: '24/7',
    statAvailabilityLabel: 'حجز ومتابعة فورية',

    // Accreditations
    accreditationsTitle: 'اعتمادات وتراخيص المستشفى والعيادات',
    accreditationsSubtitle: 'نلتزم بأعلى معايير الجودة والسلامة الصحية المعتمدة محلياً وعالمياً',

    // Branches
    branchesTitle: 'فروعنا المعتمدة وساعات العمل',
    branchesSubtitle: 'اختر الفرع الأقرب لحضرتك لحجز استشارتك مع نخبة الأطباء',

    // Chat Widget
    chatInitGreeting: 'أهلاً بحضرتك في سمارت كلينك! 🌸 أنا "نورا" موظفة الاستقبال الطبية الذكية. إزاي أقدر أساعدك النهاردة؟ تحب تستفسر عن تخصص معين، مواعيد كشف، أو أسعار الخدمات؟',
    chatPlaceholderAI: 'اكتب رسالتك هنا لنورا...',
    chatPlaceholderHuman: 'اكتب رسالتك لموظف الاستقبال...',
    chatHumanBanner: 'أنت تتحدث الآن مع موظف الاستقبال مباشرة',
    chatOnlineStatus: 'متصلة الآن لخدمتك',
    chatPatientLabel: 'المريض:',
    chatBookingCardTitle: 'بطاقة تأكيد الحجز الطبي',
    chatBookingCode: 'كود الحجز:',
    chatAppointmentTime: 'الموعد:',
    chatDoctor: 'الطبيب:',
    chatPhone: 'واتساب:',
    chatConfirmedBadge: 'تم الحجز وتأكيد الواتساب ✓',
    chatWaitlistTitle: 'بطاقة قائمة الانتظار الذكية',
    chatWaitlistBadge: 'أولوية أولى للإخطار الفوري ⚡',
    chatCancelledTitle: 'بطاقة تأكيد إلغاء الحجز',
    chatCancelledBadge: 'تم إلغاء الموعد وتفريغ الخانة بنجاح ✓',
    chatNewConversation: 'محادثة جديدة',
    chatSendTitle: 'إرسال',

    // Assistant / Secretary Page
    secTitle: 'غرفة السكرتارية والمتابعة الحية',
    secSubtitle: 'مراقبة المحادثات الفورية، التدخل البشري الفوري، وإدارة تجربة المرضى',
    secFilterAll: 'جميع المحادثات',
    secFilterTakeover: 'مطلوب تدخل بشري',
    secFilterActive: 'ذكاء اصطناعي (نورا)',
    secTakeoverBtn: 'استلام المحادثة (تدخل بشري)',
    secReturnAIBtn: 'إعادة للذكاء الاصطناعي',
    secSendMessage: 'إرسال رد السكرتارية',
    secPlaceholder: 'اكتب رداً رسمياً للمريض...',
    secNoActiveChat: 'اختر محادثة من القائمة لعرض السجل ومتابعتها'
  },
  en: {
    // Navigation
    brandTitle: 'Smart Clinic AI',
    brandSubtitle: 'Integrated Intelligent Healthcare',
    navHome: 'Home',
    navDepartments: 'Departments',
    navServices: 'Services & Pricing',
    navDoctors: 'Medical Staff',
    navSecretary: 'Secretary Center',
    navAdmin: 'Admin Console',
    navChatTrigger: 'Chat with Nora (Reception)',
    langSwitch: 'العربية',

    // Hero
    heroBadge: 'Internationally Accredited AI Clinic System with Nora',
    heroTitlePrefix: 'The Advanced ',
    heroTitleHighlight: 'Smart Clinic AI',
    heroTitleSuffix: ' Center',
    heroSubtitle: 'A premier digital health experience uniting Egypt’s elite medical consultants with "Nora" AI receptionist for instant slot booking, smart waitlists, and encrypted patient care.',
    heroBookBtn: 'Book Consultation with Nora',
    heroDeptBtn: 'Explore Departments',

    // Stats
    statPatients: '+18,500',
    statPatientsLabel: 'Treated Patients',
    statDoctors: '4',
    statDoctorsLabel: 'Senior Consultants',
    statSatisfaction: '99.4%',
    statSatisfactionLabel: 'Patient Satisfaction',
    statAvailability: '24/7',
    statAvailabilityLabel: 'Instant AI Reception',

    // Accreditations
    accreditationsTitle: 'Official Accreditations & Licenses',
    accreditationsSubtitle: 'Fully committed to the highest domestic and international quality & patient safety standards',

    // Branches
    branchesTitle: 'Our Certified Branches & Timings',
    branchesSubtitle: 'Select your preferred location to reserve your consultation with senior specialists',

    // Chat Widget
    chatInitGreeting: 'Welcome to Smart Clinic! 🌸 I am Nora, your intelligent medical receptionist. How may I assist you today? Feel free to ask about our doctors, clinic schedules, or services.',
    chatPlaceholderAI: 'Type your message to Nora here...',
    chatPlaceholderHuman: 'Type your message to the human receptionist...',
    chatHumanBanner: 'You are now speaking directly with a clinic receptionist',
    chatOnlineStatus: 'Online to assist you',
    chatPatientLabel: 'Patient:',
    chatBookingCardTitle: 'Official Appointment Confirmation',
    chatBookingCode: 'Booking Code:',
    chatAppointmentTime: 'Appointment:',
    chatDoctor: 'Doctor:',
    chatPhone: 'WhatsApp:',
    chatConfirmedBadge: 'Confirmed & WhatsApp Notified ✓',
    chatWaitlistTitle: 'Smart Priority Waitlist Card',
    chatWaitlistBadge: 'Top Priority Instant Notification ⚡',
    chatCancelledTitle: 'Appointment Cancellation Receipt',
    chatCancelledBadge: 'Slot Released Successfully ✓',
    chatNewConversation: 'New Chat',
    chatSendTitle: 'Send',

    // Assistant / Secretary Page
    secTitle: 'Secretary Command & Live Takeover',
    secSubtitle: 'Live conversation monitoring, human agent handover, and real-time patient assistance',
    secFilterAll: 'All Conversations',
    secFilterTakeover: 'Needs Human Attention',
    secFilterActive: 'Automated AI (Nora)',
    secTakeoverBtn: 'Take Over Conversation',
    secReturnAIBtn: 'Handover Back to Nora (AI)',
    secSendMessage: 'Send Official Reply',
    secPlaceholder: 'Type a message to the patient...',
    secNoActiveChat: 'Select a conversation from the left to view transcript and take over'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('ar');
  const dir = 'rtl';

  useEffect(() => {
    localStorage.setItem('smart_clinic_lang', 'ar');
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    document.body.dir = 'rtl';
  }, []);

  const toggleLanguage = () => {};

  const t = (key) => {
    return translations[language]?.[key] || translations['ar']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
