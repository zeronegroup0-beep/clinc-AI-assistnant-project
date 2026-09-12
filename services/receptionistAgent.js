const appointmentService = require('./appointmentService');
const { detectGender, getGenderedPhrases, isFeminineName, FEMININE_NAMES, MASCULINE_NAMES } = require('../utils/genderUtils');

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ENGLISH_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Format a Date object as YYYY-MM-DD
 */
function formatDateYYYYMMDD(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format date in natural Egyptian spoken Arabic
 * e.g. "السبت 12 سبتمبر 2026"
 */
function formatSpokenArabicDate(d) {
    const dayName = ARABIC_DAYS[d.getDay()];
    const dateNum = d.getDate();
    const monthName = ARABIC_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName} ${dateNum} ${monthName} ${year}`;
}

/**
 * Dynamic System Prompt generator for Noura
 * Dynamically injects exact current date, time, and relative calendar benchmarks on every call.
 */
function getSystemPrompt(now = new Date()) {
    const todayFormatted = formatDateYYYYMMDD(now);
    const todayDayAr = ARABIC_DAYS[now.getDay()];

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormattedEn = now.toLocaleDateString('en-US', options);

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowFormatted = formatDateYYYYMMDD(tomorrow);
    const tomorrowDayAr = ARABIC_DAYS[tomorrow.getDay()];
    const tomorrowFormattedEn = tomorrow.toLocaleDateString('en-US', options);

    const afterTomorrow = new Date(now);
    afterTomorrow.setDate(now.getDate() + 2);
    const afterTomorrowFormatted = formatDateYYYYMMDD(afterTomorrow);
    const afterTomorrowDayAr = ARABIC_DAYS[afterTomorrow.getDay()];

    const spokenToday = formatSpokenArabicDate(now);

    return `
[SYSTEM CONTEXT - DYNAMIC CURRENT DATE INJECTION]
Today is ${dateFormattedEn} (اليوم هو ${spokenToday})
Today's Date: ${todayFormatted}
Current Local Time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
Tomorrow is ${tomorrowFormattedEn} (بكرة / غداً هو ${tomorrowDayAr} الموافق ${tomorrowFormatted})
Tomorrow's Date ("بكرة" / "غداً"): ${tomorrowFormatted}
Day After Tomorrow ("بعد بكرة"): ${afterTomorrowFormatted} (يوم ${afterTomorrowDayAr})

أنتِ "نورا"، موظفة الاستقبال الطبية الذكية في "سمارت كلينك AI".
تتحدثين باللهجة المصرية الودودة، المهذبة، والصبورة جداً مع كبار السن وجميع المرضى.

قواعد الحوار الصارمة والذاكرة الذكية (Strict State Machine & Guardrails):
1. التوافق اللغوي الصارم مع جنس المريض (Dynamic Gender & Pronoun Agreement):
   - تتبعي جنس المريض (مذكر/مؤنث) بمجرد معرفته من الاسم (مثل "سارة" أو "محمود") أو من سياق الحديث ("عايزة", "حابة", "أستاذة").
   - يجب مطابقة كافة الضمائر والأفعال والصفات مع جنس المريض بدقة ودون أي خلط:
     * للمؤنث: (أهلاً بكِ أستاذة سارة - نورتِ عيادتنا - حابـة تستفسري - تحبـي تحجزي - مشكورَة - يا فندم).
     * للمذكر: (أهلاً بكَ أستاذ محمود - نورتَ عيادتنا - حابب تستفسر - تحب تحجز - مشكور - يا فندم).
   - إياكِ مخاطبة المؤنث بصيغة المذكر أو العكس!

2. حظر السرد العشوائي والتركيز الصارم على الطبيب المطلوب (Strict Entity Filtering):
   - إذا طلب المريض أو سأل عن طبيب محدد (مثل "دكتور أحمد شريف" أو "دكتورة سارة"):
     * يمنع منعاً باتاً سرد قائمة أطباء العيادة بالكامل أو عرض النظرة العامة للعيادة!
     * ركزي حصراً وفقط على الطبيب المطلوب، وتخصصه، ومواعيده المتاحة.

3. التعامل مع تاريخ اليوم ومواعيده المنتهية (Today's Date & Finished Slots Guard):
   - عند طلب المريض الاستفسار أو الحجز "النهاردة":
     * قيّمي المواعيد المتبقية المتاحة اليوم فعلياً بعد الوقت الحالي.
     * إذا كانت مواعيد اليوم قد انتهت أو مرت، وضحي ذلك صراحة وبلباقة:
       "مواعيد النهاردة خلصت أو انتهت، هل تحب أحجز لك في أول يوم عمل قادم وهو..."
     * إياكِ والقفز الصامت للأسبوع القادم بدون إعلام المريض بانتهاء مواعيد اليوم!

4. تثبيت الموعد البديل والانتقال للواتساب (Time Slot Negotiation & Lock-in):
   - عندما يختار المريض ميعاداً بديلاً (مثل "خليها 6" أو "خيلها 6"):
     * قومي بتثبيت وقفل الموعد فوراً والانتقال مباشرة لطلب رقم الواتساب دون إعادة التكرار أو السؤال عن اليوم/الوقت مرة أخرى.

5. حظر استخراج الأسماء من عبارات التحية (Entity Extraction Guard):
   - إياكِ نهائياً اعتبار عبارات التحية أو السؤال عن الحال (مثل "أخبارك ايه" أو "عامل ايه") اسماً للمريض!
   - إذا لم يذكر المريض اسمه صراحة بنمط واضح مثل ("أنا اسمي فلان" أو "معاك فلان")، خاطبيه دائماً بـ "يا فندم" أو "حضرتك".

6. التحقق الصارم من أيام عمل الأطباء (Doctor Working Days Validation):
   - د. أحمد شريف (الأسنان): السبت، الإثنين، الأربعاء فقط! (الأحد، الثلاثاء، الخميس، الجمعة عطلة).
   - د. سارة محمود (الجلدية): الأحد، الثلاثاء، الخميس فقط!
   - د. حسام فتحي (الباطنة): السبت إلى الخميس (الجمعة عطلة).
   - د. مريم نبيل (العيون): الأحد، الثلاثاء، الخميس فقط!
   - إذا طلب المريض موعداً في يوم عطلة الطبيب (مثلاً دكتور أحمد يوم الأحد):
     قولي فوراً وبلطف: "الدكتور مش موجود في اليوم ده، مواعيده المتاحة هي (أيام كذا وكذا)، تحب احجز لك فيهم؟"
   - ممنوع منعاً باتاً اختراع أو فحص مواعيد في يوم عطلة الطبيب!

7. معالجة الأوقات غير الدقيقة والأنصاف (Time Slot Matching & Half-Hour Handling):
   - إذا طلب المريض وقتاً غير متطابق تماماً (مثل "الساعة 6 ونص" بينما المتاح 6 و 7 تماماً):
     طابقي لأقرب موعد ووضحي بلطف: "معلش المتاح الساعة 6 أو 7 تماماً، تحب أحجز لك الساعة 6؟"

8. آلة الحالة لتسلسل الحجز (Conversation Flow State Machine):
   - تتبعي التسلسل الصارم:
     1. تحديد التخصص / الطبيب.
     2. تأكيد اليوم (والتحقق من أيام العمل).
     3. عرض المواعيد المتاحة المحددة.
     4. تثبيت الموعد وطلب رقم الواتساب والاسم للتأكيد.
   - لا تكرري سرد قائمة المواعيد كاملة إذا كان المريض قد تفاوض على وقت محدد أو سأل سؤالاً جانبياً (مثل الأسعار).
`;
}

// Static fallback property for backward compatibility
const SYSTEM_PROMPT = getSystemPrompt(new Date());

function getHonorific(name, gender = null) {
    if (!name) return 'حضرتك';
    const detected = gender || (isFeminineName(name) ? 'female' : 'male');
    const gp = getGenderedPhrases(detected);
    return gp.formatHonorific(name);
}

/**
 * Convert Arabic-Indic numerals (٠-٩) to Western Arabic digits (0-9)
 */
function convertArabicNumerals(str) {
    if (!str) return str;
    const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, d => arabicIndic.indexOf(d));
}

/**
 * Normalize text for typos, slang, and common phonetic substitutions
 */
function normalizeTypoAndSlang(text) {
    if (!text) return '';
    let t = convertArabicNumerals(text.trim());

    t = t.replace(/\bعيز\b/g, 'عايز')
         .replace(/\bعاوز\b/g, 'عايز')
         .replace(/\bعايذ\b/g, 'عايز')
         .replace(/\bاحغز\b/g, 'احجز')
         .replace(/\bاحجذ\b/g, 'احجز')
         .replace(/\bاحقز\b/g, 'احجز')
         .replace(/\bاحجزلي\b/g, 'احجز لي')
         .replace(/\bاحجزلى\b/g, 'احجز لي')
         .replace(/\bخيلها\b/g, 'خليها')
         .replace(/\bخلية\b/g, 'خليه')
         .replace(/\bمعاد\b/g, 'ميعاد')
         .replace(/\bدكتوراه\b/g, 'دكتور')
         .replace(/\bدختور\b/g, 'دكتور')
         .replace(/\bبكرا\b/g, 'بكرة')
         .replace(/\bتلات\b/g, 'الثلاثاء')
         .replace(/\bاربع\b/g, 'الأربعاء')
         .replace(/\bاتنين\b/g, 'الإثنين')
         .replace(/\bإتنين\b/g, 'الإثنين')
         .replace(/\bتنين\b/g, 'الإثنين')
         .replace(/\bبيلعيل\b/g, 'بالليل')
         .replace(/\bبلليل\b/g, 'بالليل')
         .replace(/\bبليل\b/g, 'بالليل')
         .replace(/\bالكسف\b/g, 'الكشف')
         .replace(/\bكسف\b/g, 'كشف');

    return t;
}

/**
 * Check if the user is asking what today's date or day is
 */
function isAskingWhatDayTodayIs(text) {
    if (!text) return false;
    const clean = text.toLowerCase()
        .replace(/[؟?.,!]/g, ' ')
        .replace(/[إأآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ')
        .trim();

    const patterns = [
        'النهارده ايه', 'انهارده ايه', 'اليوم ايه',
        'احنا يوم ايه', 'احنا في يوم ايه', 'احنا في انهي يوم',
        'تاريخ النهارده', 'تاريخ اليوم',
        'النهارده كام', 'انهارده كام', 'كام في الشهر',
        'يوم ايه النهارده', 'يوم ايه انهارده',
        'هو النهارده ايه', 'هو انهارده ايه', 'هو احنا يوم ايه', 'هو اليوم ايه',
        'what day is today', 'what is today', 'today date'
    ];

    return patterns.some(p => clean.includes(p));
}

/**
 * Detect chained relative date terms like "طب بعده؟", "وإيه اخبار اللي بعده؟", "وكمان يومين"
 */
function detectChainedRelativeDate(text) {
    if (!text) return null;
    const clean = text.toLowerCase()
        .replace(/[؟?.,!]/g, ' ')
        .replace(/[إأآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ')
        .trim();

    const plusTwoPatterns = [
        'كمان يومين', 'وكمان يومين', 'طب كمان يومين', 'بعد يومين', 'طب بعد يومين',
        'بعده بيومين', 'بعديه بيومين', 'اللي بعده بيومين', 'الي بعده بيومين',
        'بعدها بيومين', 'بعديها بيومين'
    ];

    const nextDayPatterns = [
        'طب بعده', 'طب بعديه', 'طب بعدها', 'طب بعديها',
        'واللي بعده', 'والي بعده', 'واللي بعديه', 'والي بعديه', 'واللي بعدها', 'واللي بعديها',
        'اللي بعده', 'الي بعده', 'اللي بعديه', 'الي بعديه', 'اللي بعدها', 'الي بعدها',
        'اليوم اللي بعده', 'اليوم الي بعده', 'اليوم اللي بعديه', 'اليوم التالي',
        'تاني يوم', 'طب تاني يوم',
        'اخبار اللي بعده', 'اخبار اللي بعديه', 'اخبار اللي بعدها',
        'بعده', 'بعديه', 'بعدها', 'بعديها'
    ];

    for (const p of plusTwoPatterns) {
        if (clean.includes(p)) return { type: 'plus_two_days', phrase: p };
    }
    for (const p of nextDayPatterns) {
        if (clean.includes(p)) return { type: 'next_day', phrase: p };
    }
    return null;
}

/**
 * Resolves relative dates and day names into exact dates based on the reference date.
 */
function resolveDateFromText(text, referenceDate = new Date()) {
    if (!text) return null;
    const clean = text.toLowerCase();

    // 1. Check for explicit YYYY-MM-DD
    const isoMatch = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        const d = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
        const idx = d.getDay();
        return {
            dateStr: formatDateYYYYMMDD(d),
            dayNameAr: ARABIC_DAYS[idx],
            label: `${ARABIC_DAYS[idx]} (${formatDateYYYYMMDD(d)})`,
            isRelative: false
        };
    }

    // 2. Relative: Today ("النهاردة", "اليوم", "today")
    if (clean.includes('نهاردة') || clean.includes('النهارده') || clean.includes('اليوم') || clean.includes('today')) {
        const d = new Date(referenceDate);
        const idx = d.getDay();
        return {
            dateStr: formatDateYYYYMMDD(d),
            dayNameAr: ARABIC_DAYS[idx],
            label: `اليوم (${ARABIC_DAYS[idx]} ${formatDateYYYYMMDD(d)})`,
            isRelative: true,
            relativeName: 'النهاردة'
        };
    }

    // 3. Relative: Day after tomorrow ("بعد بكرة", "بعد بكرا", "بعد غد")
    if (clean.includes('بعد بكرة') || clean.includes('بعد بكرا') || clean.includes('بعد غد') || clean.includes('بعد غدا')) {
        const d = new Date(referenceDate);
        d.setDate(d.getDate() + 2);
        const idx = d.getDay();
        return {
            dateStr: formatDateYYYYMMDD(d),
            dayNameAr: ARABIC_DAYS[idx],
            label: `بعد غد (${ARABIC_DAYS[idx]} ${formatDateYYYYMMDD(d)})`,
            isRelative: true,
            relativeName: 'بعد بكرة'
        };
    }

    // 4. Relative: Tomorrow ("بكرة", "بكرا", "غدا", "غداً", "tomorrow")
    if (clean.includes('بكرة') || clean.includes('بكرا') || clean.includes('غدا') || clean.includes('غداً') || clean.includes('tomorrow')) {
        const d = new Date(referenceDate);
        d.setDate(d.getDate() + 1);
        const idx = d.getDay();
        return {
            dateStr: formatDateYYYYMMDD(d),
            dayNameAr: ARABIC_DAYS[idx],
            label: `غداً (${ARABIC_DAYS[idx]} ${formatDateYYYYMMDD(d)})`,
            isRelative: true,
            relativeName: 'بكرة'
        };
    }

    // 5. Weekday names: Sunday through Saturday
    const weekdayMap = [
        { idx: 0, ar: 'الأحد', aliases: ['احد', 'أحد', 'sun'] },
        { idx: 1, ar: 'الإثنين', aliases: ['اثنين', 'إثنين', 'اتنين', 'إتنين', 'mon'] },
        { idx: 2, ar: 'الثلاثاء', aliases: ['ثلاث', 'تلات', 'tue'] },
        { idx: 3, ar: 'الأربعاء', aliases: ['اربع', 'أربع', 'wed'] },
        { idx: 4, ar: 'الخميس', aliases: ['خميس', 'thu'] },
        { idx: 5, ar: 'الجمعة', aliases: ['جمع', 'fri'] },
        { idx: 6, ar: 'السبت', aliases: ['سبت', 'sat'] },
    ];

    for (const w of weekdayMap) {
        if (w.aliases.some(alias => clean.includes(alias))) {
            const currentIdx = referenceDate.getDay();
            let diff = w.idx - currentIdx;
            if (diff <= 0) diff += 7; // Next occurrence
            const targetDate = new Date(referenceDate);
            targetDate.setDate(targetDate.getDate() + diff);
            return {
                dateStr: formatDateYYYYMMDD(targetDate),
                dayNameAr: w.ar,
                label: `يوم ${w.ar} (${formatDateYYYYMMDD(targetDate)})`,
                isRelative: false,
                relativeName: `يوم ${w.ar}`
            };
        }
    }

    return null;
}

/**
 * Detect waitlist intent in user message
 */
function isWaitlistIntent(text) {
    if (!text) return false;
    const clean = text.toLowerCase().replace(/[.,!?؟]/g, ' ').trim();
    const waitlistPatterns = [
        'سجل رقمي', 'سجل رقمى', 'سجلني', 'سجلنى', 'قائمة الانتظار', 'قايمة الانتظار',
        'قائمه الانتظار', 'قايمه الانتظار', 'الانتظار', 'انتظار', 'سجلني انتظار',
        'سجلني في الانتظار', 'سجل رقمي أفضل', 'سجل رقمي افضل', 'لا سجل رقمي',
        'حطني في الانتظار', 'بلغوني', 'نبهني', 'بلغني', 'نبهوني', 'خليني في الانتظار'
    ];
    return waitlistPatterns.some(p => clean.includes(p));
}

/**
 * Check if the user is asking an informational question about availability or schedules
 */
function isAvailabilityInquiry(text) {
    const clean = text.toLowerCase();
    return clean.includes('فاضي') || clean.includes('فاضيين') || 
           clean.includes('متاح') || clean.includes('متاحة') ||
           clean.includes('مواعيد') || clean.includes('موعد متاح') ||
           clean.includes('ميعاد متاح') || clean.includes('available') ||
           clean.includes('slots') || clean.includes('جدول') ||
           clean.includes('اوقات') || clean.includes('أوقات') ||
           clean.includes('ساعات') || clean.includes('امتى') ||
           clean.includes('إمتى') || clean.includes('free') ||
           clean.includes('اخبار') || clean.includes('أخبار') ||
           clean.includes('ظروف') || clean.includes('schedule');
}

/**
 * Extract doctor and specialty from text
 * Enforces Strict Entity Priority Rules:
 * - Rule 1 (Explicit Doctor Mention): Explicit doctor name takes absolute priority over procedure keywords.
 * - Rule 2 (Category/Specialty Lock & Service Catalog Lookup First):
 *   Queries structured services catalog first. 'تبييض الأسنان' strictly locked to 'طب الأسنان' (Dr. Ahmed Sherif)
 *   and NEVER routes to 'الجلدية والتجميل' regardless of the word 'ليزر'.
 */
function extractDoctorAndSpecialty(text) {
    if (!text) return null;
    const clean = text.toLowerCase();

    // Prevent mistaking patient introduction names for doctor requests
    const isSelfIntroduction = clean.includes('اسمي') || clean.includes('اسمى') || 
                               clean.includes('معاك') || clean.includes('أنا اسمي') || clean.includes('انا اسمي');

    // Rule 1: Explicit Doctor Mentions (Highest Priority)
    const hasAhmedDoctorTitle = clean.includes('دكتور أحمد') || clean.includes('دكتور احمد') || 
                                clean.includes('د. أحمد') || clean.includes('د. احمد') || 
                                clean.includes('أحمد شريف') || clean.includes('احمد شريف') ||
                                clean.includes('مع د. أحمد') || clean.includes('مع د. احمد') ||
                                clean.includes('مع دكتور أحمد') || clean.includes('مع دكتور احمد');

    const hasSaraDoctorTitle = clean.includes('دكتورة سارة') || clean.includes('دكتوره ساره') || 
                               clean.includes('د. سارة') || clean.includes('د. ساره') || 
                               clean.includes('سارة محمود') || clean.includes('ساره محمود') ||
                               clean.includes('مع دكتورة سارة') || clean.includes('مع د. سارة');

    const hasHossamDoctorTitle = clean.includes('دكتور حسام') || clean.includes('د. حسام') || 
                                 clean.includes('حسام فتحي') || clean.includes('مع دكتور حسام') || 
                                 clean.includes('مع د. حسام');

    const hasMariamDoctorTitle = clean.includes('دكتورة مريم') || clean.includes('دكتوره مريم') || 
                                 clean.includes('د. مريم') || clean.includes('مريم نبيل') || 
                                 clean.includes('مع دكتورة مريم') || clean.includes('مع د. مريم');

    if (hasAhmedDoctorTitle) {
        // Also check if a specific dental service was mentioned to enrich specialty
        const matchedService = appointmentService.lookupService(clean);
        const specialty = (matchedService && matchedService.assigned_doctor_id === 'dr_ahmed')
            ? `${matchedService.category} - ${matchedService.display_name}`
            : 'استشاري طب وجراحة الأسنان';
        return { 
            doctor: 'د. أحمد شريف', 
            specialty,
            serviceName: matchedService ? matchedService.display_name : null,
            category: matchedService ? matchedService.category : 'طب وجراحة الأسنان',
            isServiceCatalogMatch: Boolean(matchedService)
        };
    }
    if (hasSaraDoctorTitle) {
        return { doctor: 'د. سارة محمود', specialty: 'أخصائية الجلدية والتجميل والليزر' };
    }
    if (hasHossamDoctorTitle) {
        return { doctor: 'د. حسام فتحي', specialty: 'استشاري الباطنة والقلب' };
    }
    if (hasMariamDoctorTitle) {
        return { doctor: 'د. مريم نبيل', specialty: 'أخصائية طب وجراحة العيون' };
    }

    // Rule 2: Service Catalog Lookup First
    const matchedService = appointmentService.lookupService(clean);
    if (matchedService) {
        return {
            doctor: matchedService.assigned_doctor_name,
            specialty: `${matchedService.category} - ${matchedService.display_name}`,
            serviceId: matchedService.service_id,
            serviceName: matchedService.display_name,
            category: matchedService.category,
            assignedDoctorId: matchedService.assigned_doctor_id,
            isServiceCatalogMatch: true
        };
    }

    // Specialty / Keyword Lock: Dental / Teeth Whitening Priority
    // 'تبييض الأسنان' strictly locked to 'طب الأسنان'
    if (clean.includes('تبييض') || clean.includes('أسنان') || clean.includes('اسنان') || 
        clean.includes('سنان') || clean.includes('ضرس') || clean.includes('dentist') || 
        clean.includes('teeth') || clean.includes('zoom') || clean.includes('زووم') || clean.includes('زوم')) {
        return { doctor: 'د. أحمد شريف', specialty: 'طب وجراحة الأسنان' };
    }

    // Dermatology & Laser: ONLY if NOT dental and specifically dermatology or hair laser
    if (clean.includes('جلدية') || clean.includes('تجميل') || clean.includes('بشرة') || clean.includes('بشره') ||
        (clean.includes('ليزر') && !clean.includes('أسنان') && !clean.includes('اسنان') && !clean.includes('تبييض'))) {
        return { doctor: 'د. سارة محمود', specialty: 'أخصائية الجلدية والتجميل' };
    }

    // Cardiology / Internal Medicine
    if (clean.includes('باطنة') || clean.includes('باطنه') || clean.includes('قلب') || 
        clean.includes('ضغط') || clean.includes('سكر') || clean.includes('حسام') || clean.includes('hossam')) {
        return { doctor: 'د. حسام فتحي', specialty: 'استشاري الباطنة والقلب' };
    }

    // Ophthalmology
    if (clean.includes('عيون') || clean.includes('رمد') || clean.includes('نظارة') || 
        clean.includes('نظاره') || clean.includes('مريم') || clean.includes('mariam') || clean.includes('ليزك')) {
        return { doctor: 'د. مريم نبيل', specialty: 'أخصائية طب وجراحة العيون' };
    }

    // Contextual doctor mentions without "دكتور" prefix (safeguarded against name introductions)
    if (!isSelfIntroduction) {
        if (clean.includes('سارة') || clean.includes('ساره')) {
            return { doctor: 'د. سارة محمود', specialty: 'أخصائية الجلدية والتجميل' };
        }
        if (clean.includes('أحمد') || clean.includes('احمد')) {
            return { doctor: 'د. أحمد شريف', specialty: 'طب وجراحة الأسنان' };
        }
    }

    return null;
}

/**
 * Extract time slot from text (supports Arabic half/quarter hour fractions and negotiation phrases)
 */
function extractTimeSlot(text) {
    if (!text) return null;
    const clean = text.toLowerCase();

    // Check fractions first
    if (clean.includes('4:30') || clean.includes('اربعة ونصف') || clean.includes('أربعة ونصف') || clean.includes('اربعة ونص') || clean.includes('أربعة ونص') || clean.includes('4 ونص') || clean.includes('4 ونصف')) {
        return '4:30 مساءً';
    }
    if (clean.includes('5:30') || clean.includes('خمسة ونصف') || clean.includes('خمسة ونص') || clean.includes('5 ونص') || clean.includes('5 ونصف')) {
        return '5:30 مساءً';
    }
    if (clean.includes('6:30') || clean.includes('ستة ونصف') || clean.includes('ستة ونص') || clean.includes('6 ونص') || clean.includes('6 ونصف')) {
        return '6:30 مساءً';
    }
    if (clean.includes('7:30') || clean.includes('سبعة ونصف') || clean.includes('سبعة ونص') || clean.includes('7 ونص') || clean.includes('7 ونصف')) {
        return '7:30 مساءً';
    }
    if (clean.includes('2:30') || clean.includes('اتنين ونص') || clean.includes('2 ونص')) {
        return '2:30 مساءً';
    }
    if (clean.includes('8:30') || clean.includes('تمانية ونص') || clean.includes('ثمانية ونص')) {
        return '8:30 مساءً';
    }

    // Direct negotiation patterns: "خليها 6", "خيلها 6", "خليه 6", "خليها 7", "يناسبني 6", "مناسب 6", "على 6", "6"
    // Make sure this is not part of a phone number or multi-digit string (e.g. 010...)
    if (!/\d{3,}/.test(clean)) {
        const negotiationMatch = clean.match(/(?:خليها|خيلها|خليه|خلية|نخليها|خلينا|يناسبني|مناسب|على|علي)?\s*(?:الساعة|الساعه|ساعة|ساعه)?\s*([1-9]|1[0-2])(?!\d)/);
        if (negotiationMatch) {
            const h = parseInt(negotiationMatch[1], 10);
            if (h >= 1 && h <= 10) {
                return `${h}:00 مساءً`;
            }
        }
    }

    // Exact hours
    if (clean.includes('1:00') || clean.includes('الساعة 1') || clean.includes('واحدة')) {
        return '1:00 مساءً';
    }
    if (clean.includes('2:00') || clean.includes('الساعة 2') || clean.includes('اتنين')) {
        return '2:00 مساءً';
    }
    if (clean.includes('3:00') || clean.includes('الساعة 3') || clean.includes('تلاتة') || clean.includes('ثلاثة')) {
        return '3:00 مساءً';
    }
    if (clean.includes('4:00') || clean.includes('الساعة 4') || clean.includes('اربعة') || clean.includes('أربعة')) {
        return '4:00 مساءً';
    }
    if (clean.includes('5:00') || clean.includes('الساعة 5') || clean.includes('خمسة')) {
        return '5:00 مساءً';
    }
    if (clean.includes('6:00') || clean.includes('الساعة 6') || clean.includes('ستة')) {
        return '6:00 مساءً';
    }
    if (clean.includes('7:00') || clean.includes('الساعة 7') || clean.includes('سبعة')) {
        return '7:00 مساءً';
    }
    if (clean.includes('8:00') || clean.includes('الساعة 8') || clean.includes('ثمانية') || clean.includes('تمانية')) {
        return '8:00 مساءً';
    }
    if (clean.includes('9:00') || clean.includes('الساعة 9') || clean.includes('تسعة')) {
        return '9:00 مساءً';
    }
    if (clean.includes('بالليل') || clean.includes('بيلعيل') || (clean.includes('في المساء') && !clean.includes('مساء الخير') && !clean.includes('مساء الورد') && !clean.includes('مساء النور'))) {
        return '7:00 مساءً';
    }
    return null;
}

/**
 * Check if the input is completely incomprehensible gibberish / keyboard mash
 */
function isGibberish(text) {
    if (!text) return true;
    const clean = text.trim();
    if (clean.length < 2) return true;

    if (/^[a-zA-Z\s]{4,}$/.test(clean)) {
        const commonEnglish = ['hello', 'hi', 'booking', 'doctor', 'appointment', 'monday', 'tuesday', 'teeth', 'clinic', 'available', 'tomorrow', 'slots'];
        if (!commonEnglish.some(w => clean.toLowerCase().includes(w))) {
            return true;
        }
    }

    if (/(.)\1{3,}/.test(clean)) {
        if (!clean.includes('هههه') && !clean.includes('هاها')) {
            return true;
        }
    }

    const knownWords = [
        'السلام', 'عليكم', 'مساء', 'صباح', 'الخير', 'عايز', 'عاوز', 'عيز', 'أنا', 'انا', 'اسمي', 'اسمى',
        'حجز', 'احجز', 'كشف', 'أسنان', 'اسنان', 'جلدية', 'باطنة', 'عيون', 'دكتور', 'دكتورة',
        'ميعاد', 'موعد', 'ساعة', 'ساعه', 'الإثنين', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس',
        'الجمعة', 'السبت', 'الأحد', 'الواتساب', 'واتساب', 'رقمي', 'سجلني', 'شكرا', 'تمام', 'ألو', 'الو',
        'بكرة', 'غدا', 'متاح', 'محجوز', 'انتظار', 'بلغوني', 'نبهني', 'تنورنا', 'خدمات', 'أسعار', 'رقم', 'معاك',
        'فاضي', 'فاضيين', 'مواعيد', 'بكام', 'بكم', 'سعر', 'كام', 'بعده', 'بعديه', 'اخبار', 'أخبار'
    ];

    const hasKnownWord = knownWords.some(w => clean.includes(w));
    if (hasKnownWord) return false;

    if (/\d{3,}/.test(clean)) return false;

    return false;
}

/**
 * Detect emergency and critical safety keywords in message (Module 1)
 */
function isEmergencyMessage(text) {
    if (!text) return false;
    const clean = text.toLowerCase()
        .replace(/[إأآ]/g, 'ا')
        .replace(/ة/g, 'ه');
    const emergencyKeywords = [
        'نزيف', 'الم لا يطاق', 'طوارئ', 'طوارىء', 'حاله حرجه',
        'مش قادر استنى', 'مش قادر استنا', 'مش قادره استنى', 'مش قادره استنا',
        'اغماء', 'كسر'
    ];
    return emergencyKeywords.some(kw => clean.includes(kw));
}

/**
 * Extract and validate Egyptian phone number
 * Strict regex: ^01[0-9]{9}$ (11 digits starting with 01)
 */
function analyzePhoneNumber(text) {
    if (!text) return { hasAttempt: false, isValid: false, phone: null };

    const converted = convertArabicNumerals(text);
    const digitMatch = converted.match(/(?:\+?\d[\d\s-]{2,}\d|\d{3,})/);

    if (!digitMatch) {
        return { hasAttempt: false, isValid: false, phone: null };
    }

    const raw = digitMatch[0].replace(/[\s-]/g, '');
    let cleanNumber = raw;
    if (cleanNumber.startsWith('+20')) cleanNumber = '0' + cleanNumber.substring(3);
    else if (cleanNumber.startsWith('0020')) cleanNumber = '0' + cleanNumber.substring(4);
    else if (cleanNumber.startsWith('20') && cleanNumber.length === 12) cleanNumber = '0' + cleanNumber.substring(2);

    const isValid = /^01[0-9]{9}$/.test(cleanNumber);

    if (isValid) {
        return {
            hasAttempt: true,
            isValid: true,
            phone: cleanNumber,
            raw
        };
    }

    return {
        hasAttempt: true,
        isValid: false,
        phone: null,
        raw
    };
}

// Strict blacklist of conversational words, questions, greetings, medical terms, pronouns, verbs
const NAME_BLACKLIST = new Set([
    'أخبار', 'اخبار', 'أخبارك', 'اخبارك', 'أخباره', 'اخباره', 'أخباركم', 'اخباركم',
    'عامل', 'عامله', 'عاملة', 'عاملين',
    'ازي', 'ازيك', 'إزيك', 'ازيكوا', 'ازيكم', 'إزيكم', 'كيفك', 'شلونك', 'شخبارك',
    'تمام', 'الحمدلله', 'الحمد', 'لله', 'كويس', 'كويسة', 'كويسين', 'بخير', 'فل', 'ورد',
    'ايه', 'إيه', 'فين', 'كام', 'ليه', 'ازاي', 'إزاي', 'امتى', 'إمتى', 'مين', 'هل', 'شو', 'شنو',
    'سلام', 'السلام', 'عليكم', 'وعليكم', 'صباح', 'مساء', 'الخير', 'أهلا', 'اهلا', 'أهلاً', 'سهلا', 'سهلاً',
    'مرحبا', 'مرحباً', 'هاي', 'هلو', 'الو', 'ألو',
    'عايز', 'عاوز', 'عاوزه', 'عايزة', 'عايزين', 'عيز', 'محتاج', 'حابب', 'اريد', 'أريد', 'نفسي', 'ممكن',
    'حجز', 'احجز', 'احجزلي', 'احجزلى', 'كشف', 'ميعاد', 'موعد', 'معاد', 'مواعيد', 'ساعة', 'ساعه', 'ساعات', 'وقت', 'أوقات', 'تاريخ', 'يوم', 'أيام',
    'أسنان', 'اسنان', 'جلدية', 'باطنة', 'باطنه', 'عيون', 'دكتور', 'دكتورة', 'دكاترة', 'عيادة', 'طبيب',
    'بكرة', 'بكرا', 'النهاردة', 'النهارده', 'امبارح', 'بعده', 'بعديه', 'بعدها',
    'سعر', 'اسعار', 'أسعار', 'تكلفة', 'بكام', 'بكم', 'فلوس', 'جنيه',
    'رقم', 'رقمي', 'تليفون', 'هاتف', 'موبايل', 'واتساب', 'الواتساب',
    'شكرا', 'شكراً', 'تسلم', 'عفوا', 'عفواً', 'ماشي', 'ماشى', 'اوك', 'اوكي', 'حاضر', 'طيب', 'خلاص',
    'تعبان', 'مريض', 'وجع', 'ألم', 'ضرسي', 'ساني', 'ضرس', 'سنان',
    'حضرتك', 'فندم', 'باشا', 'أستاذ', 'استاذ', 'أستاذة', 'استاذة'
]);

/**
 * Extract patient name from message (Entity Extraction Guard)
 * STRICT RULE: Never extract casual conversational greetings as names.
 */
function extractNameFromMessage(text, isExplicitlyAwaitingName = false) {
    if (!text) return null;
    const clean = text.trim();

    const containsBlacklisted = (phrase) => {
        const words = phrase.split(/\s+/);
        return words.some(w => {
            const raw = w.toLowerCase().replace(/[؟?.,!]/g, '');
            const normalized = raw.replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه');
            return NAME_BLACKLIST.has(raw) || NAME_BLACKLIST.has(normalized);
        });
    };


    // Explicit introduction patterns ONLY
    const explicitPatterns = [
        /(?:اسمي|اسمى)\s+([أ-يa-zA-Z]{2,15}(?:\s+[أ-يa-zA-Z]{2,15})?)/i,
        /(?:أنا|انا)\s+(?:اسمي|اسمى)\s+([أ-يa-zA-Z]{2,15}(?:\s+[أ-يa-zA-Z]{2,15})?)/i,
        /(?:معاك|معك)\s+(?:أستاذ|استاذ|دكتور|باشمهندس|مهندس|مدام|سيدة)?\s*([أ-يa-zA-Z]{2,15}(?:\s+[أ-يa-zA-Z]{2,15})?)/i,
        /(?:الحجز\s+باسم|سجل\s+باسم|باسم)\s+([أ-يa-zA-Z]{2,15}(?:\s+[أ-يa-zA-Z]{2,15})?)/i
    ];

    // Stop words that shouldn't be included as part of the patient's name
    const NAME_STOP_WORDS = new Set([
        'ورقمي', 'ورقمى', 'ورقم', 'وتليفوني', 'وتليفونى', 'رقمي', 'رقمى', 'تليفوني', 'تليفونى', 
        'وعايز', 'وعايزة', 'وعاوز', 'وعاوزة', 'وحابب', 'وحابة', 'وعندي', 'وعندى'
    ]);

    for (const pattern of explicitPatterns) {
        const match = clean.match(pattern);
        if (match && match[1]) {
            let candidate = match[1].trim();
            const words = candidate.split(/\s+/);
            const stopIdx = words.findIndex(w => NAME_STOP_WORDS.has(w.toLowerCase()));
            if (stopIdx !== -1) {
                candidate = words.slice(0, stopIdx).join(' ').trim();
            }
            if (candidate && !containsBlacklisted(candidate) && !/\d/.test(candidate) && candidate.length >= 2) {
                return candidate;
            }
        }
    }

    // ONLY if the bot specifically asked for the name in the immediately preceding turn
    if (isExplicitlyAwaitingName) {
        let candidate = clean;
        const words = candidate.split(/\s+/);
        const stopIdx = words.findIndex(w => NAME_STOP_WORDS.has(w.toLowerCase()));
        if (stopIdx !== -1) {
            candidate = words.slice(0, stopIdx).join(' ').trim();
        }
        const candidateWords = candidate.split(/\s+/).filter(Boolean);
        if (candidateWords.length >= 1 && candidateWords.length <= 3 && !/\d/.test(candidate) && /^[أ-يa-zA-Z\s]{2,30}$/.test(candidate)) {
            return candidate;
        }
        if (candidate && !containsBlacklisted(candidate) && !/\d/.test(candidate) && /^[أ-يa-zA-Z\s]{2,30}$/.test(candidate)) {
            return candidate;
        }
    }

    return null;
}

/**
 * Handle incoming message through the Egyptian Receptionist Dialogue Engine
 */
async function processChatMessage({ message, sessionId, sessionData = {}, currentDate = new Date() }) {
    const rawText = message.trim();
    const normalizedText = normalizeTypoAndSlang(rawText);
    const reasoningSteps = [];
    let state = { ...sessionData };

    // -------------------------------------------------------------
    // MODULE 1: EMERGENCY & CRITICAL SAFETY INTERCEPTOR
    // -------------------------------------------------------------
    if (isEmergencyMessage(rawText) || isEmergencyMessage(normalizedText)) {
        delete state.bookingDraft;
        delete state.pendingBooking;
        delete state.suggestedAlternativeTime;
        delete state.awaitingPhone;
        delete state.awaitingName;
        delete state.awaitingWaitlist;
        delete state.waitlistSlot;
        state.isEmergency = true;
        reasoningSteps.push('تفعيل معترض الطوارئ والحالات الحرجة فوراً ووقف الحجز وتوجيه المريض لأقرب قسم طوارئ');
        return {
            reply: 'يا فندم سلامتك ألف سلامة! الحالات الحادّة والطارئة بتتطلب توجه فوراً لأقرب قسم طوارئ أو مستشفى. يرجى عدم الانتظار للحجز العادي والتوجه فوراً لأقرب مركز طبي.',
            reasoningSteps,
            state
        };
    }

    // -------------------------------------------------------------
    // DYNAMIC GENDER & PRONOUN AGREEMENT TRACKING
    // -------------------------------------------------------------
    state.gender = detectGender({
        text: normalizedText,
        name: state.patientName || state.userName,
        currentGender: state.userGender || state.gender
    });
    state.userGender = state.gender;
    let gp = getGenderedPhrases(state.gender);
    const phoneAnalysis = analyzePhoneNumber(normalizedText);

    // -------------------------------------------------------------
    // 0. DYNAMIC DATE CONTEXT INJECTION (Strict Rule 1)
    // -------------------------------------------------------------
    const currentDayAr = ARABIC_DAYS[currentDate.getDay()];
    const todayFormatted = formatDateYYYYMMDD(currentDate);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormattedEn = currentDate.toLocaleDateString('en-US', options);
    const spokenToday = formatSpokenArabicDate(currentDate);

    reasoningSteps.push(`حقن التاريخ الحالي ديناميكياً: Today is ${dateFormattedEn} (${spokenToday})`);

    // -------------------------------------------------------------
    // 1. DIRECT ANSWER FOR DATE INQUIRIES ("النهاردة إيه؟") (Rule 1)
    // -------------------------------------------------------------
    if (isAskingWhatDayTodayIs(normalizedText)) {
        reasoningSteps.push(`الرد المباشر على استفسار المريض عن يوم وتاريخ اليوم: ${spokenToday}`);

        state.lastDiscussedDate = {
            dateStr: todayFormatted,
            dayNameAr: currentDayAr,
            label: `اليوم (${spokenToday})`,
            relativeName: 'النهاردة'
        };

        const honorificPhrase = state.patientName ? ` يا ${honorific}` : '';
        const reply = `النهاردة ${spokenToday}${honorificPhrase}، تحت أمرك ${gp.toheb} أساعدك في إيه؟`;

        return {
            reply,
            reasoningSteps,
            state
        };
    }

    // -------------------------------------------------------------
    // 2. STATE MEMORY: Check existing collected patient info
    // -------------------------------------------------------------
    const hasNamePreviously = Boolean(state.patientName);

    // Standalone Name Extraction (AWAITING_NAME State)
    if (state.awaitingName) {
        const cleanNoPunct = normalizedText.replace(/[؟?.,!]/g, '').trim();

        // Intercept polite greetings while awaiting name (Module 2)
        const greetingPhrases = [
            'الحمد لله', 'الحمدلله', 'اخبارك ايه', 'أخبارك إيه', 'اخبارك', 'أخبارك',
            'ازيك', 'إزيك', 'تمام', 'عامل ايه', 'عامله ايه', 'كويس', 'كويسة', 'بخير', 'فل', 'ورد',
            'مساء الخير', 'صباح الخير', 'اهلا', 'أهلا', 'أهلاً', 'مرحبا', 'مرحباً', 'سلام عليكم', 'السلام عليكم', 'الو', 'ألو'
        ];
        const isGreetingOnly = greetingPhrases.some(p => cleanNoPunct === p || cleanNoPunct.startsWith(p));
        if (isGreetingOnly) {
            reasoningSteps.push('المريض أرسل تحية أثناء انتظار الاسم: الرد بلباقة وإعادة طلب الاسم دون اعتباره اسماً');
            const reply = `الحمد لله تمام وبخير يا فندم! يشرفني معرفة اسم حضرتك الكريم؟`;
            return { reply, reasoningSteps, state };
        }

        const refusalPhrases = ['مش هقول', 'مش عاوز اقول', 'مش عايز اقول', 'مش هقولك', 'بعدين', 'مش لازم', 'مش دلوقتي', 'لا', 'مش حابب', 'مش حابة', 'سري', 'خاص'];
        const isRefusal = refusalPhrases.some(p => cleanNoPunct === p || cleanNoPunct.startsWith(p));

        if (isRefusal) {
            delete state.awaitingName;
            reasoningSteps.push('المريض فضل عدم ذكر اسمه: تفهم الأمر بلباقة دون تكرار السؤال عن الاسم');
            const reply = `تمام يا فندم ولا يهمك خالص، براحتك تماماً! إزاي أقدر أساعدك النهاردة؟`;
            return { reply, reasoningSteps, state };
        }

        const words = cleanNoPunct.split(/\s+/).filter(Boolean);
        const isNotServiceInquiry = !/^(عايز|عاوز|احجز|حجز|كشف|بكام|سعر|فين|مكان|عايزة|عاوزه|مواعيد|فاضيين)/.test(cleanNoPunct);
        const isNotPhone = !phoneAnalysis.isValid && !/\d{4,}/.test(cleanNoPunct);

        if (words.length >= 1 && words.length <= 3 && isNotServiceInquiry && isNotPhone) {
            const extractedName = words.join(' ');
            state.userName = extractedName;
            state.patientName = extractedName;
            delete state.awaitingName;

            state.gender = detectGender({
                text: normalizedText,
                name: extractedName,
                currentGender: state.gender || state.userGender
            });
            state.userGender = state.gender;
            gp = getGenderedPhrases(state.gender);
            const honorific = gp.formatHonorific(extractedName);
            reasoningSteps.push(`التقاط مباشر للاسم في حالة AWAITING_NAME: ${extractedName} وحفظ userName`);

            if (state.pendingBooking) {
                if (state.patientPhone) {
                    return processChatMessage({ message: '', sessionId, sessionData: state, currentDate });
                }
                state.awaitingPhone = true;
                const reply = `أهلاً بك يا ${honorific}! تم تسجيل اسم حضرتك، ممكن بس رقم الواتساب عشان نأكد الحجز؟`;
                return { reply, reasoningSteps, state };
            }

            if (state.awaitingWaitlist) {
                const docName = state.waitlistSlot?.doctor || 'د. أحمد شريف';
                if (state.patientPhone) {
                    const waitlistResult = await appointmentService.addToWaitlist({
                        patientName: state.patientName,
                        phone: state.patientPhone,
                        doctor: docName,
                        requestedDate: state.waitlistSlot?.date || 'يوم الإثنين',
                        requestedTime: state.waitlistSlot?.time || '4:30 مساءً',
                        notes: 'طلب إخطار فوري عند توفر الموعد'
                    });
                    const reply = `تمام يا ${honorific}، تم تسجل طلبك في قائمة الانتظار لـ ${docName}. أول ما يفضى ميعاد هنتواصل مع حضرتك فوراً على الواتساب.`;
                    delete state.bookingDraft;
                    delete state.waitlistSlot;
                    delete state.awaitingWaitlist;
                    delete state.awaitingPhone;
                    return { reply, reasoningSteps, state, card: { type: 'waitlist_confirmed', waitlistId: waitlistResult.waitlistId, patientName: state.patientName, doctor: docName, phone: state.patientPhone } };
                }
                state.awaitingPhone = true;
                const reply = `تمام يا ${honorific}، يشرفني بس رقم الواتساب عشان نسجل طلبك في قائمة الانتظار لـ ${docName}، وأول ما يفضى ميعاد هنتواصل مع حضرتك فوراً على الواتساب.`;
                return { reply, reasoningSteps, state };
            }

            // Standard transition requested:
            if (state.gender === 'unisex' || !state.gender) {
                // For unisex names (e.g., "نور", "إسلام", "رضا", "عصمت", "جهاد"):
                // DO NOT default to male or female immediately.
                // Use gender-neutral polite honorifics in the initial response:
                // "أهلاً بك يا فندم! نورت عيادتنا، إزاي أقدر أساعدك؟"
                const reply = `أهلاً بك يا فندم! نورت عيادتنا، إزاي أقدر أساعدك؟`;
                return { reply, reasoningSteps, state };
            }

            // "أهلاً بك يا أستاذ/أستاذة [userName]! إزاي أقدر أساعدك النهاردة؟"
            const greetingPrefix = gp.isFemale ? 'أهلاً بكِ أستاذة' : 'أهلاً بك يا أستاذ';
            const reply = `${greetingPrefix} ${extractedName}! إزاي أقدر أساعدك النهاردة؟`;
            return { reply, reasoningSteps, state };
        }
    }

    if (!state.patientName) {
        const extractedName = extractNameFromMessage(normalizedText, Boolean(state.awaitingName));
        if (extractedName) {
            state.userName = extractedName;
            state.patientName = extractedName;
            delete state.awaitingName;
            state.gender = detectGender({
                text: normalizedText,
                name: extractedName,
                currentGender: state.gender || state.userGender
            });
            state.userGender = state.gender;
            gp = getGenderedPhrases(state.gender);
            reasoningSteps.push(`تم التعرف على اسم المريض: ${extractedName} وضبط التذكير والتأنيث (${state.gender}) وحفظه في ذاكرة الجلسة`);
        }
    }

    const honorific = state.patientName ? gp.formatHonorific(state.patientName) : null;
    const isNewNameIntroduction = !hasNamePreviously && Boolean(state.patientName);

    // Phone number analyzed at start of message
    if (phoneAnalysis.isValid) {
        state.patientPhone = phoneAnalysis.phone;
        reasoningSteps.push(`تم التحقق من صحة رقم الواتساب المصري: ${phoneAnalysis.phone}`);
    }

    // -------------------------------------------------------------
    // 3. INPUT VALIDATION AWARENESS: Invalid phone formats
    // -------------------------------------------------------------
    const isExpectingPhone = Boolean(state.pendingBooking || state.awaitingWaitlist || state.awaitingPhone);

    if (phoneAnalysis.hasAttempt && !phoneAnalysis.isValid) {
        reasoningSteps.push(`تنبيه التحقق: الرقم المدخل (${phoneAnalysis.raw}) غير مطابق لصيغة الهواتف المصرية (11 رقماً تبدأ بـ 01)`);
        state.awaitingPhone = true;

        return {
            reply: 'عذراً، رقم المحمول المكتوب غير مكتمل. يرجى كتابة رقم الموبايل المصري المكون من 11 رقم (مثال: 01012345678)',
            reasoningSteps,
            state
        };
    }

    if (isExpectingPhone && !phoneAnalysis.isValid && /^\d{2,10}$/.test(normalizedText.replace(/\s+/g, ''))) {
        reasoningSteps.push('تنبيه التحقق: إدخال رقمي غير صالح (أقل من 11 رقماً)');
        state.awaitingPhone = true;

        return {
            reply: 'عذراً، رقم المحمول المكتوب غير مكتمل. يرجى كتابة رقم الموبايل المصري المكون من 11 رقم (مثال: 01012345678)',
            reasoningSteps,
            state
        };
    }

    // -------------------------------------------------------------
    // 4. COMPLETE PENDING BOOKING (Scenario A)
    // -------------------------------------------------------------
    if (state.pendingBooking) {
        if (state.patientName && state.patientPhone) {
            reasoningSteps.push('اكتملت جميع البيانات المطلوبة (الاسم ورقم الواتساب). استدعاء أداة book_appointment...');
            reasoningSteps.push('تشفير بيانات المريض الحساسة (الاسم ورقم الهاتف) عبر AES-256...');

            const bookingResult = await appointmentService.bookAppointment({
                patientName: state.patientName,
                phone: state.patientPhone,
                doctor: state.pendingBooking.doctor,
                date: state.pendingBooking.date,
                time: state.pendingBooking.time,
                reason: state.pendingBooking.specialty || 'كشف عيادة'
            });

            const reply = `تم تأكيد حجز حضرتك يا ${honorific} بنجاح! ميعادك ${state.pendingBooking.date} الساعة ${state.pendingBooking.time} مع ${state.pendingBooking.doctor}. هنبعت لحضرتك رسالة تأكيد على الواتساب على رقم ${state.patientPhone}. ألف سلامة على حضرتك و${gp.tanawwar} في العيادة!`;

            const card = {
                type: 'booking_confirmed',
                bookingId: bookingResult.bookingId,
                patientName: state.patientName,
                doctor: state.pendingBooking.doctor,
                date: state.pendingBooking.date,
                time: state.pendingBooking.time,
                phone: state.patientPhone
            };

            delete state.pendingBooking;
            delete state.bookingDraft;
            delete state.waitlistSlot;
            delete state.awaitingWaitlist;
            delete state.awaitingPhone;

            return {
                reply,
                reasoningSteps,
                state,
                card
            };
        }

        if (state.patientName && !state.patientPhone) {
            state.awaitingPhone = true;
            return {
                reply: `${gp.ahlanBek} يا ${honorific}، الميعاد متاح. ممكن بس رقم الواتساب الخاص بحضرتك عشان نأكد الحجز؟`,
                reasoningSteps: ['الاسم متوفر في الذاكرة، طلب رقم الواتساب فقط'],
                state
            };
        }

        if (!state.patientName && state.patientPhone) {
            return {
                reply: `تمام يا فندم، يشرفني بس أعرف اسم حضرتك الكريم عشان نأكد الحجز؟`,
                reasoningSteps: ['تم حفظ رقم الواتساب، طلب اسم المريض فقط'],
                state
            };
        }
    }

    // -------------------------------------------------------------
    // 5. WAITLIST INTENT ROUTING (WAITLIST_ENGINE State)
    // -------------------------------------------------------------
    const isWaitlist = isWaitlistIntent(normalizedText);

    if (state.awaitingWaitlist || isWaitlist) {
        if (isWaitlist || (state.awaitingWaitlist && phoneAnalysis.isValid)) {
            const docName = state.waitlistSlot?.doctor || state.bookingDraft?.doctor || 'د. أحمد شريف';
            const reqDate = state.waitlistSlot?.date || state.bookingDraft?.date || 'يوم الإثنين';
            const reqTime = state.waitlistSlot?.time || state.bookingDraft?.time || '4:30 مساءً';

            // Check if phone was provided in current message or in session
            const phoneToUse = phoneAnalysis.isValid ? phoneAnalysis.phone : state.patientPhone;

            if (phoneToUse) {
                state.patientPhone = phoneToUse;
                const displayName = state.userName || state.patientName;
                const userTitle = displayName ? (gp.isFemale ? `أستاذة ${displayName}` : `أستاذ ${displayName}`) : 'فندم';

                reasoningSteps.push(`استدعاء أداة add_to_waitlist لتسجيل المريض في قائمة الانتظار المشفرة لدكتور ${docName}`);
                reasoningSteps.push(`تشغيل مسار تأكيد قائمة الانتظار فوراً (WAITLIST_CONFIRMATION) لدكتور ${docName}`);
                const waitlistResult = await appointmentService.addToWaitlist({
                    patientName: displayName || 'المريض',
                    phone: phoneToUse,
                    doctor: docName,
                    requestedDate: reqDate,
                    requestedTime: reqTime,
                    notes: 'طلب إخطار فوري عند توفر الموعد'
                });

                const reply = `تمام يا ${userTitle}، تم تسجل طلبك في قائمة الانتظار لـ ${docName}. أول ما يفضى ميعاد هنتواصل مع حضرتك فوراً على الواتساب.`;

                const card = {
                    type: 'waitlist_confirmed',
                    waitlistId: waitlistResult.waitlistId,
                    patientName: displayName || 'المريض',
                    doctor: docName,
                    requestedDate: reqDate,
                    requestedTime: reqTime,
                    phone: phoneToUse
                };

                delete state.bookingDraft;
                delete state.waitlistSlot;
                delete state.awaitingWaitlist;
                delete state.awaitingPhone;

                return {
                    reply,
                    reasoningSteps,
                    state,
                    card
                };
            }

            // If phone is not provided yet, ask ONLY for WhatsApp number
            state.awaitingPhone = true;
            state.awaitingWaitlist = true;
            state.waitlistSlot = state.waitlistSlot || {
                doctor: docName,
                date: reqDate,
                time: reqTime
            };

            const displayName = state.userName || state.patientName;
            const userTitle = displayName ? (gp.isFemale ? `أستاذة ${displayName}` : `أستاذ ${displayName}`) : 'فندم';

            reasoningSteps.push(`طلب رقم الواتساب لتسجيل المريض في قائمة الانتظار لدكتور ${docName} دون إعادة عرض المواعيد`);
            const reply = `حاضر من عينيا يا ${userTitle}، ممكن بس رقم الواتساب الخاص بحضرتك عشان نسجلك في قائمة الانتظار الخاصة بدكتور ${docName}، وأول ما يفضى ميعاد نتواصل معاك فوراً؟`;

            return {
                reply,
                reasoningSteps,
                state
            };
        }
    }

    // -------------------------------------------------------------
    // 6. PRICE INQUIRY WITH CONTEXT RETENTION (Context Switcher)
    // -------------------------------------------------------------
    if (normalizedText.includes('بكام') || normalizedText.includes('بكم') || normalizedText.includes('سعر') || 
        normalizedText.includes('أسعار') || normalizedText.includes('اسعار') || normalizedText.includes('الكسف') || 
        normalizedText.includes('تكلفة')) {
        reasoningSteps.push('التعرف على استفسار الأسعار مع الحفاظ على سياق الحوار ومسودة الحجز دون إعادة سرد المواعيد كاملة');
        let priceReply = `أسعار الكشف في عيادتنا:
• كشف الأسنان مع د. أحمد شريف: 350 جنيه
• كشف الجلدية والليزر مع د. سارة محمود: 400 جنيه
• كشف الباطنة والقلب مع د. حسام فتحي: 500 جنيه
• كشف العيون مع د. مريم نبيل: 400 جنيه`;

        if (state.bookingDraft && state.bookingDraft.date && state.bookingDraft.time) {
            priceReply += `\n\nتحب${gp.isFemale ? 'ي' : ''} نكمل حجز ميعاد حضرتك ${state.bookingDraft.date} الساعة ${state.bookingDraft.time}؟`;
        } else if (state.bookingDraft && state.bookingDraft.date) {
            priceReply += `\n\nتحب${gp.isFemale ? 'ي' : ''} نكمل حجز ميعاد حضرتك ${state.bookingDraft.date}؟`;
        } else {
            priceReply += `\n\nتحب${gp.isFemale ? 'ي' : ''} حضرتك نحدد ميعاد كشف في أي تخصص فيهم؟`;
        }

        return {
            reply: priceReply,
            reasoningSteps,
            state
        };
    }

    // Location / Address Inquiry (Context Switcher)
    const lowerText = normalizedText.toLowerCase();
    if (lowerText.includes('عنوان') || lowerText.includes('مكان العيادة') || lowerText.includes('مكانكم') || lowerText.includes('العيادة فين') || lowerText.includes('فين العيادة')) {
        reasoningSteps.push('استرجاع عنوان العيادة مع الحفاظ على سياق الحوار دون إعادة سرد المواعيد كاملة');
        let locReply = 'عنوان عيادتنا: 15 شارع التحرير، الدقي، الجيزة (بجوار محطة مترو الدقي). ولدينا فروع في دمنهور (شارع عبد السلام الشاذلي) والإسكندرية (طريق الجيش، ستانلي). مواعيد العمل يومياً من 1:00 ظهراً إلى 10:00 مساءً ما عدا الجمعة.';
        if (state.bookingDraft && state.bookingDraft.date && state.bookingDraft.time) {
            locReply += `\n\nتحب${gp.isFemale ? 'ي' : ''} نكمل حجز ميعاد حضرتك ${state.bookingDraft.date} الساعة ${state.bookingDraft.time}؟`;
        } else if (state.bookingDraft && state.bookingDraft.date) {
            locReply += `\n\nتحب${gp.isFemale ? 'ي' : ''} نكمل حجز ميعاد حضرتك ${state.bookingDraft.date}؟`;
        } else {
            locReply += `\n\nتحب${gp.isFemale ? 'ي' : ''} حضرتك تحجز${gp.isFemale ? 'ي' : ''} موعد كشف في أي تخصص؟`;
        }
        return {
            reply: locReply,
            reasoningSteps,
            state
        };
    }

    // Insurance Inquiry (Knowledge Base Tool Lookup with context retention - Module 6)
    if (lowerText.includes('تأمين') || lowerText.includes('تامين') || lowerText.includes('تأمينات') ||
        lowerText.includes('كارت التأمين') || lowerText.includes('كارنيه التأمين') || lowerText.includes('متعاقدين') ||
        lowerText.includes('بوبا') || lowerText.includes('اكسا') || lowerText.includes('ميدنت') || lowerText.includes('bupa') || lowerText.includes('axa')) {
        reasoningSteps.push('استرجاع شبكة شركات التأمين الطبي المعتمدة مع الحفاظ على سياق الحوار ومسودة الحجز');
        let insReply = 'عيادتنا متعاقدة مع كبرى شركات التأمين الطبي (مثل: بوبا Bupa، أكسا AXA، ميدنت MedNet، جلوب ميد GlobeMed، كير بلس Care Plus، ونقابات المهندسين والتجاريين والأطباء). بنسبة تغطية بتوصل لـ 100% حسب فئة كارت التأمين الخاص بحضرتك.';
        if (state.bookingDraft && state.bookingDraft.date && state.bookingDraft.time) {
            insReply += `\n\nتحب${gp.isFemale ? 'ي' : ''} نكمل حجز ميعاد حضرتك ${state.bookingDraft.date} الساعة ${state.bookingDraft.time}؟`;
        } else if (state.bookingDraft && state.bookingDraft.date) {
            insReply += `\n\nتحب${gp.isFemale ? 'ي' : ''} نكمل حجز ميعاد حضرتك ${state.bookingDraft.date}؟`;
        } else {
            insReply += `\n\nتحب${gp.isFemale ? 'ي' : ''} حضرتك تحجز${gp.isFemale ? 'ي' : ''} موعد كشف؟`;
        }
        return {
            reply: insReply,
            reasoningSteps,
            state
        };
    }

    // Multi-Branch Handling & Switching (Module 6)
    const isAlexBranch = lowerText.includes('إسكندرية') || lowerText.includes('اسكندرية') || lowerText.includes('إسكندريه') || lowerText.includes('اسكندريه');
    const isDamanhourBranch = lowerText.includes('دمنهور');

    if (isAlexBranch && (isAvailabilityInquiry(lowerText) || lowerText.includes('مواعيد') || lowerText.includes('فرع'))) {
        state.branch_id = 'alex';
        state.branch_name = 'الإسكندرية';
        reasoningSteps.push('استرجاع مواعيد فرع الإسكندرية وتحديث فرع الجلسة');
        let branchReply = 'مواعيد فرع الإسكندرية: د. حسام فتحي (الباطنة والقلب)، د. مريم نبيل (العيون)، ود. أحمد شريف (الأسنان). تحب أحجز لحضرتك ميعاد في فرع الإسكندرية؟';
        return { reply: branchReply, reasoningSteps, state };
    }

    if (isDamanhourBranch) {
        state.branch_id = 'damanhour';
        state.branch_name = 'دمنهور';
        reasoningSteps.push('تحديد أو التبديل إلى فرع دمنهور');
        if (lowerText.includes('اكمل في دمنهور') || lowerText.includes('أكمل في دمنهور') || lowerText.includes('نكمل في دمنهور') || lowerText.includes('طيب اكمل')) {
            const doc = state.bookingDraft?.doctor || 'د. أحمد شريف';
            let reply = `تمام يا ${honorific || 'فندم'}، هنكمل الحجز في فرع دمنهور مع ${doc}. `;
            if (state.bookingDraft?.date && state.bookingDraft?.time) {
                reply += `ميعاد حضرتك ${state.bookingDraft.date} الساعة ${state.bookingDraft.time}. ممكن رقم الواتساب والاسم الكريم للتأكيد؟`;
                state.awaitingPhone = true;
                state.awaitingName = !state.patientName;
            } else if (state.bookingDraft?.date) {
                reply += `تحب${gp.isFemale ? 'ي' : ''} ميعاد الساعة كام فيهم؟`;
            } else {
                reply += `تحب${gp.isFemale ? 'ي' : ''} تحجز${gp.isFemale ? 'ي' : ''} يوم إيه؟`;
            }
            return { reply, reasoningSteps, state };
        }
    }

    // Branch inquiry or Ambiguous Branch Selection
    const isAmbiguousBranchPrompt = (lowerText.includes('فروع') || lowerText.includes('فروعكم') || lowerText.includes('عندكم فروع')) ||
                                    ((lowerText.includes('احجز') || lowerText.includes('حجز')) && !state.branch_id && !state.bookingDraft?.doctor && (lowerText.includes('فرع') || lowerText.includes('انهي فرع') || lowerText.includes('أنهي فرع')));
    if (isAmbiguousBranchPrompt) {
        reasoningSteps.push('سؤال المريض عن الفرع المفضل بين دمنهور والإسكندرية');
        return {
            reply: 'عيادتنا ليها فرعين: فرع دمنهور وفرع الإسكندرية. تحب تحجز في فرع دمنهور ولا فرع الإسكندرية؟',
            reasoningSteps,
            state
        };
    }

    // Casual Greeting / How are you check (Entity Extraction Guard)
    if (lowerText.includes('اخبارك') || lowerText.includes('أخبارك') || lowerText.includes('عامل ايه') || 
        lowerText.includes('ازيك') || lowerText.includes('إزيك') || lowerText.includes('كيفك')) {
        const namePhrase = honorific ? ` يا ${honorific}` : ' يا فندم';
        return {
            reply: `الحمد لله تمام وبخير، تسلم لذوقك وسؤالك${namePhrase}! أنا نورا موظفة الاستقبال في خدمتك، تحب${gp.isFemale ? 'ي' : ''} تستفسر${gp.isFemale ? 'ي' : ''} عن مواعيد كشف أو تحب${gp.isFemale ? 'ي' : ''} تحجز${gp.isFemale ? 'ي' : ''} عند أي دكتور في العيادة؟`,
            reasoningSteps: ['الرد الودود على السؤال عن الحال دون التقاط الكلمات كاسم (Entity Extraction Guard) مع مراعاة التذكير والتأنيث'],
            state
        };
    }

    // -------------------------------------------------------------
    // 7. CONFIRMING SUGGESTED ALTERNATIVE TIME & TIME NEGOTIATION LOCK-IN (Strict Rule 4)
    // -------------------------------------------------------------
    const extractedTime = extractTimeSlot(normalizedText);
    const isAvailabilityAsk = isAvailabilityInquiry(normalizedText);

    if (state.suggestedAlternativeTime) {
        const confirmWords = ['تمام', 'اه', 'أه', 'ايوة', 'ايوه', 'ماشي', 'ماشى', 'اوك', 'اوكي', 'احجز', 'احجزلي', 'موافق', 'خليه', 'خليها', 'خيلها', 'يناسبني', 'مناسب'];
        const cleanSuggestNum = state.suggestedAlternativeTime.replace(/[^0-9:]/g, '');
        const isConfirming = confirmWords.some(w => normalizedText.includes(w)) || 
                             (cleanSuggestNum && normalizedText.includes(cleanSuggestNum)) ||
                             extractedTime;

        if (isConfirming && !isAvailabilityAsk) {
            const confirmedTime = extractedTime || state.suggestedAlternativeTime;
            delete state.suggestedAlternativeTime;
            state.bookingDraft = state.bookingDraft || {};
            state.bookingDraft.time = confirmedTime;

            reasoningSteps.push(`المريض أكد أو اختار الموعد البديل: ${confirmedTime}، قفل الاختيار فوراً`);

            state.pendingBooking = {
                doctor: state.bookingDraft.doctor || 'د. أحمد شريف',
                specialty: state.bookingDraft.specialty || 'طب وجراحة الأسنان',
                date: state.bookingDraft.date,
                time: confirmedTime
            };

            if (state.patientName && state.patientPhone) {
                return processChatMessage({ message: '', sessionId, sessionData: state, currentDate });
            }
            if (state.patientName) {
                state.awaitingPhone = true;
                return {
                    reply: `تمام جداً، تم اختيار وتثبيت ميعاد الساعة ${confirmedTime} يا ${honorific}! ممكن بس رقم الواتساب الخاص بحضرتك عشان نأكد الحجز؟`,
                    reasoningSteps,
                    state
                };
            }
            if (state.patientPhone) {
                state.awaitingName = true;
                return {
                    reply: `تمام جداً، تم اختيار وتثبيت ميعاد الساعة ${confirmedTime} يا فندم! يشرفني بس أعرف اسم حضرتك الكريم عشان نأكد الحجز؟`,
                    reasoningSteps,
                    state
                };
            }
            state.awaitingName = true;
            state.awaitingPhone = true;
            return {
                reply: `تمام جداً، تم اختيار وتثبيت ميعاد الساعة ${confirmedTime} يا فندم! يشرفني بس أعرف اسم حضرتك الكريم ورقم الواتساب عشان نأكد الحجز؟`,
                reasoningSteps,
                state
            };
        }
    }

    // -------------------------------------------------------------
    // 8. CONTEXTUAL CHAIN TRACKING (Rule 2 & 3)
    // Handling "بعده", "واللي بعده", "وكمان يومين" relative to lastDiscussedDate
    // -------------------------------------------------------------
    const chainedRelative = detectChainedRelativeDate(normalizedText);
    const extractedDoc = extractDoctorAndSpecialty(normalizedText);

    let effectiveDate = null;
    let clarificationGreeting = '';

    if (chainedRelative) {
        let baseDate;
        let prevDayName = 'اليوم';
        let prevDayDisplay = 'النهاردة';

        if (state.lastDiscussedDate && state.lastDiscussedDate.dateStr) {
            baseDate = new Date(state.lastDiscussedDate.dateStr + 'T12:00:00');
            prevDayName = state.lastDiscussedDate.dayNameAr || 'اليوم';
            if (state.lastDiscussedDate.relativeName === 'بكرة') {
                prevDayDisplay = 'بكرة';
            } else if (state.lastDiscussedDate.relativeName === 'النهاردة') {
                prevDayDisplay = 'النهاردة';
            } else {
                prevDayDisplay = state.lastDiscussedDate.relativeName || `يوم ${prevDayName}`;
            }
        } else {
            baseDate = new Date(currentDate);
            prevDayName = 'النهاردة';
            prevDayDisplay = 'النهاردة';
        }

        const targetDate = new Date(baseDate);
        if (chainedRelative.type === 'plus_two_days') {
            targetDate.setDate(targetDate.getDate() + 2);
        } else {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const targetDateStr = formatDateYYYYMMDD(targetDate);
        const targetDayAr = ARABIC_DAYS[targetDate.getDay()];
        const targetLabel = `يوم ${targetDayAr} (${targetDateStr})`;

        effectiveDate = {
            dateStr: targetDateStr,
            dayNameAr: targetDayAr,
            label: targetLabel,
            isRelative: true,
            relativeName: `يوم ${targetDayAr}`
        };

        // Elderly-friendly, warm Egyptian clarification (Rule 3)
        if (chainedRelative.type === 'plus_two_days') {
            clarificationGreeting = `قصد حضرتك بعد ${prevDayDisplay} بيومين (يوم ${targetDayAr})؟ تمام، ثواني أجبلك مواعيده...\n`;
        } else {
            clarificationGreeting = `قصد حضرتك يوم ${targetDayAr} اللي بعد ${prevDayDisplay}؟ تمام، ثواني أجبلك مواعيده...\n`;
        }
        reasoningSteps.push(`تتبع السلسلة الزمنية: حساب التاريخ بالنسبة لآخر موعد نوقش (${prevDayDisplay}): الناتج هو ${targetLabel}`);
    } else {
        effectiveDate = resolveDateFromText(normalizedText, currentDate);
        if (effectiveDate && state.lastDiscussedDate && (normalizedText.startsWith('و') || normalizedText.includes('طب'))) {
            clarificationGreeting = `حاضر من عينيا، ثواني أشوف مواعيد ${effectiveDate.label}...\n`;
        }
    }

    // Update draft state if doctor or date or time mentioned
    if (!state.bookingDraft) {
        state.bookingDraft = {};
    }

    if (extractedDoc) {
        state.bookingDraft.doctor = extractedDoc.doctor;
        state.bookingDraft.specialty = extractedDoc.specialty;
        if (extractedDoc.isServiceCatalogMatch) {
            state.bookingDraft.isServiceCatalogMatch = true;
            state.bookingDraft.serviceName = extractedDoc.serviceName;
            state.bookingDraft.category = extractedDoc.category;
            state.bookingDraft.assignedDoctorId = extractedDoc.assignedDoctorId;
        }
    } else if (!state.bookingDraft.doctor) {
        // Default to Dr. Ahmed if teeth are mentioned
        if (lowerText.includes('أسنان') || lowerText.includes('اسنان') || lowerText.includes('ضرس') || lowerText.includes('سنان')) {
            state.bookingDraft.doctor = 'د. أحمد شريف';
            state.bookingDraft.specialty = 'طب وجراحة الأسنان';
        } else if (effectiveDate || extractedTime) {
            state.bookingDraft.doctor = 'د. أحمد شريف';
            state.bookingDraft.specialty = 'طب وجراحة الأسنان';
        }
    }

    // -------------------------------------------------------------
    // 9. DOCTOR WORKING DAYS & TODAY'S FINISHED CHECK (Strict Rule 2 & 3)
    // -------------------------------------------------------------
    if (effectiveDate) {
        const doctorToCheck = state.bookingDraft.doctor || 'د. أحمد شريف';
        const workingDayCheck = await appointmentService.checkAvailability({
            doctor: doctorToCheck,
            date: effectiveDate.label,
            time: null,
            currentDate
        });

        if (workingDayCheck.isDayOff) {
            reasoningSteps.push(`تحقق أيام العمل: الطبيب ${doctorToCheck} في عطلة يوم ${effectiveDate.label}. عرض مواعيده المتاحة بدلاً من فحص المواعيد`);
            delete state.bookingDraft.date;
            delete state.bookingDraft.dateStr;
            return {
                reply: `${doctorToCheck} مش موجود في اليوم ده، مواعيده المتاحة هي (أيام ${workingDayCheck.workingDaysAr})، تحب${gp.isFemale ? 'ي' : ''} أحجز ${gp.lak} فيهم؟`,
                reasoningSteps,
                state
            };
        }

        if (workingDayCheck.isTodayFinished) {
            delete state.bookingDraft.date;
            delete state.bookingDraft.dateStr;
            const nextWork = workingDayCheck.nextWorkingDay;
            const dayName = nextWork ? nextWork.dayNameAr : 'العمل القادم';
            const dateStr = nextWork ? nextWork.dateStr : '';
            reasoningSteps.push(`مواعيد اليوم انتهت بالكامل: عرض أقرب ميعاد متاح للدكتور في أول يوم عمل قادم (يوم ${dayName} الموافق ${dateStr}) دون قفز صامت`);
            return {
                reply: `مواعيد النهاردة انتهت بالكامل يا فندم. أقرب ميعاد متاح للدكتور في أول يوم عمل قادم هو يوم ${dayName} الموافق ${dateStr}.. تحب${gp.isFemale ? 'ي' : ''} أحجز لك${gp.isFemale ? 'ِ' : ''} فيه؟`,
                reasoningSteps,
                state
            };
        }

        // Confirmed working day
        state.bookingDraft.date = effectiveDate.label;
        state.bookingDraft.dateStr = effectiveDate.dateStr;
        state.lastDiscussedDate = {
            dateStr: effectiveDate.dateStr,
            dayNameAr: effectiveDate.dayNameAr,
            label: effectiveDate.label,
            relativeName: effectiveDate.relativeName || `يوم ${effectiveDate.dayNameAr}`
        };

        if (!extractedTime) {
            delete state.bookingDraft.time;
        }
        reasoningSteps.push(`تأكيد يوم عمل صحيح وحفظه في ذاكرة الجلسة: ${effectiveDate.label}`);
    }

    // -------------------------------------------------------------
    // 10. GREETINGS PROTOCOL & STRICT ENTITY FILTERING (Strict Rule 2)
    // -------------------------------------------------------------
    const lower = normalizedText.toLowerCase();
    const hasBookingIntent = lower.includes('احجز') || lower.includes('حجز') || lower.includes('كشف') || 
                             effectiveDate || extractedTime || isAvailabilityAsk || state.bookingDraft.date;

    if (!hasBookingIntent) {
        if (lower.includes('سلام عليكم') || lower.includes('السلام عليكم')) {
            let reply = `وعليكم السلام ورحمة الله وبركاته يا فندم! ${gp.nawwart} عيادتنا.`;
            if (!state.patientName) {
                reply += ' يشرفني أعرف اسم حضرتك الكريم الأول عشان أقدر أساعدك؟';
                state.awaitingName = true;
            } else {
                reply += ` ${gp.ahlanBek} يا ${honorific}، إزاي أقدر أساعدك النهاردة؟`;
            }
            return { reply, reasoningSteps: ['الرد على التحية وفق البروتوكول المصري'], state };
        }

        if (lower.includes('صباح الخير') || lower.includes('صباح الورد') || lower.includes('صباح الفل')) {
            let reply = 'صباح الورد والياسمين يا فندم! يومك سعيد يا رب.';
            if (!state.patientName) {
                reply += ' يشرفني أعرف اسم حضرتك الكريم الأول عشان أقدر أساعدك؟';
                state.awaitingName = true;
            } else {
                reply += ` ${gp.ahlanBek} يا ${honorific}، إزاي أقدر أساعدك؟`;
            }
            return { reply, reasoningSteps: ['الرد على التحية الصباحية'], state };
        }

        if (lower.includes('مساء الخير') || lower.includes('مساء الورد') || lower.includes('مساء النور')) {
            let reply = 'مساء النور والسرور يا فندم! نورتنا والله.';
            if (!state.patientName) {
                reply += ' يشرفني أعرف اسم حضرتك الكريم الأول عشان أقدر أساعدك؟';
                state.awaitingName = true;
            } else {
                reply += ` ${gp.ahlanBek} يا ${honorific}، إزاي أقدر أساعدك؟`;
            }
            return { reply, reasoningSteps: ['الرد على التحية المسائية'], state };
        }

        if (state.patientName && !hasNamePreviously) {
            if (state.gender === 'unisex' || !state.gender) {
                const reply = `أهلاً بك يا فندم! نورت عيادتنا، إزاي أقدر أساعدك؟`;
                return {
                    reply,
                    reasoningSteps: ['الترحيب المحايد بالاسم المشترك (Unisex) لحين وضوح الجنس من سياق الحديث'],
                    state
                };
            }
            const nameSalutation = gp.isFemale ? `${gp.ahlanBek} ${honorific}` : `${gp.ahlanBek} يا ${honorific}`;
            let reply = `${nameSalutation}، ${gp.nawwart} عيادتنا! إزاي أقدر أساعدك النهاردة؟ ${gp.habeb} ${gp.tostafser} عن مواعيد كشف معينة؟`;
            if (state.pendingBooking && !state.patientPhone) {
                reply = `${nameSalutation}، ممكن بس رقم الواتساب الخاص بحضرتك عشان نأكد الحجز؟`;
            }
            return {
                reply,
                reasoningSteps: ['تم حفظ اسم المريض وتخصيص الرد باللقب المناسب وضبط التذكير والتأنيث'],
                state
            };
        }

        // Pure inquiries about clinic doctors / specialties (Strict Entity Filtering)
        if (lower.includes('دكتور') || lower.includes('دكاترة') || lower.includes('تخصصات') || lower.includes('مواعيد العمل') || lower.includes('خدمات')) {
            if (extractedDoc) {
                const docSchedule = appointmentService.findDoctorSchedule(extractedDoc.doctor);
                return {
                    reply: `${docSchedule.name} (${docSchedule.specialty}) مواعيده في العيادة: أيام (${docSchedule.workingDaysAr}) من ${docSchedule.hoursAr}. تحب${gp.isFemale ? 'ي' : ''} حضرتك تحجز${gp.isFemale ? 'ي' : ''} ميعاد في أي يوم فيهم؟`,
                    reasoningSteps: [`استرجاع مواعيد الطبيب المطلوب حصراً (${docSchedule.name}) دون عرض باقي أطباء العيادة (Strict Entity Filtering)`],
                    state
                };
            }

            return {
                reply: `عيادتنا بتوفر نخبة من أفضل الاستشاريين في:
• د. أحمد شريف (طب وجراحة الأسنان) - السبت، الإثنين، الأربعاء (2:00 م - 9:00 م)
• د. سارة محمود (الجلدية والتجميل والليزر) - الأحد، الثلاثاء، الخميس (1:00 م - 8:00 م)
• د. حسام فتحي (أمراض الباطنة والقلب) - السبت إلى الخميس (3:00 م - 10:00 م)
• د. مريم نبيل (طب وجراحة العيون) - الأحد، الثلاثاء، الخميس (4:00 م - 9:00 م)

تقدر تسألني عن المواعيد المتاحة لأي يوم أو دكتور وهفحصها لحضرتك فوراً!`,
                reasoningSteps: ['استرجاع قائمة الأطباء ومواعيد العمل من قاعدة بيانات العيادة'],
                state
            };
        }
    }

    // -------------------------------------------------------------
    // Service Catalog Direct Procedure Routing (Rule 3: Fallback Response Pattern)
    // When a specific service is identified (e.g. Zoom Whitening with Dr. Ahmed Sherif)
    // Fetch and display ONLY the assigned doctor's available slots.
    // Example: "مواعيد د. أحمد شريف (طب الأسنان - تبييض الأسنان بالليزر) المتاحة هي: [Slots]. تحب أحجزلك ميعاد فيهم؟"
    // -------------------------------------------------------------
    const isServiceMatch = (extractedDoc && extractedDoc.isServiceCatalogMatch) || 
                           (state.bookingDraft && state.bookingDraft.isServiceCatalogMatch);

    if (isServiceMatch && !effectiveDate && !extractedTime) {
        const docName = (extractedDoc && extractedDoc.doctor) || state.bookingDraft.doctor || 'د. أحمد شريف';
        const docSchedule = appointmentService.findDoctorSchedule(docName);
        const slotsSummary = appointmentService.getDoctorAvailableSlotsSummary(docSchedule.id);
        const category = (extractedDoc && extractedDoc.category) || state.bookingDraft.category || 'طب الأسنان';
        const serviceName = (extractedDoc && extractedDoc.serviceName) || state.bookingDraft.serviceName || 'تبييض الأسنان بالليزر';
        const specialtyHeader = `${category} - ${serviceName}`;

        const reply = `مواعيد ${docName} (${specialtyHeader}) المتاحة هي: ${slotsSummary}. تحب${gp.isFemale ? 'ي' : ''} أحجزلك ميعاد فيهم؟`;
        return {
            reply,
            reasoningSteps: [
                `استعلام دليل الخدمات أولاً (Service Catalog Lookup First) للخدمة (${serviceName})`,
                `تطبيق قفل التخصص (Category Lock): قفل ${category} حصراً مع ${docName} ومنع التوجيه الخاطئ للجلدية رغم وجود كلمة ليزر`,
                `استرجاع مواعيد الطبيب حصراً وعرضها وفق نمط الاستجابة المطلوب (Fallback Response Pattern)`
            ],
            state,
            suggestedSlots: docSchedule.slotsByDay[docSchedule.workingDayIndices[0]] || []
        };
    }

    // -------------------------------------------------------------
    // 11. CONVERSATION FLOW STATE MACHINE & AVAILABILITY ENGINE
    // Step 1: Identify Service / Doctor
    // Step 2: Confirm Target Date (Validated against working days)
    // Step 3: Show Available Exact Slots OR Match Requested Time
    // Step 4: Lock User Choice & Request Phone Number for Confirmation
    // -------------------------------------------------------------
    const activeDoctor = state.bookingDraft.doctor || 'د. أحمد شريف';
    const activeDateLabel = effectiveDate ? effectiveDate.label : (state.bookingDraft ? state.bookingDraft.date : null);
    const activeTime = extractedTime || (state.bookingDraft ? state.bookingDraft.time : null);

    // Scenario A: Both Target Date and Time are specified / available
    if (activeDateLabel && activeTime) {
        reasoningSteps.push(`فحص توفر الموعد المحدد: الطبيب (${activeDoctor})، التاريخ (${activeDateLabel})، الوقت (${activeTime})`);
        const availCheck = await appointmentService.checkAvailability({
            doctor: activeDoctor,
            date: activeDateLabel,
            time: activeTime,
            currentDate
        });

        // 3.0 Today finished or past slot
        if (availCheck.isPastSlot || availCheck.isTodayFinished) {
            delete state.bookingDraft.time;
            const nextWork = availCheck.nextWorkingDay;
            const dayName = nextWork ? nextWork.dayNameAr : 'العمل القادم';
            const dateStr = nextWork ? nextWork.dateStr : '';
            reasoningSteps.push(`الموعد المطلوب اليوم انتهى: تقديم إشعار واضح وعرض أقرب ميعاد متاح للدكتور في أول يوم عمل قادم (يوم ${dayName} الموافق ${dateStr}) دون قفز صامت`);
            const promptMsg = `مواعيد النهاردة انتهت بالكامل يا فندم. أقرب ميعاد متاح للدكتور في أول يوم عمل قادم هو يوم ${dayName} الموافق ${dateStr}.. تحب${gp.isFemale ? 'ي' : ''} أحجز لك${gp.isFemale ? 'ِ' : ''} فيه؟`;
            return {
                reply: promptMsg,
                reasoningSteps,
                state
            };
        }

        // 3.1 Non-exact / half-hour slot matching (Strict Rule 3)
        if (availCheck.isExactSlot === false) {
            state.suggestedAlternativeTime = availCheck.recommendedSlot;
            reasoningSteps.push(`الوقت المطلوب (${activeTime}) غير دقيق: اقتراح أقرب موعد متاح (${availCheck.recommendedSlot}) وفق القاعدة 3`);

            return {
                reply: availCheck.message,
                reasoningSteps,
                state
            };
        }

        // 3.2 Exact slot but already booked
        if (availCheck.isBooked) {
            state.waitlistSlot = {
                doctor: activeDoctor,
                date: activeDateLabel,
                time: activeTime
            };
            state.awaitingWaitlist = true;
            reasoningSteps.push(`الموعد المطلوب محجوز بالكامل: تقديم المواعيد البديلة وعرض قائمة الانتظار`);

            return {
                reply: `بعتذر لحضرتك جداً، ميعاد ${activeTime} محجوز بالكامل. متاح بدلاً منه: ${availCheck.nearestAvailable?.join(' أو ')}، تحب${gp.isFemale ? 'ي' : ''} أحجز لحضرتك فيهم ولا أسجل رقمك في قائمة الانتظار ونتواصل مع${gp.isFemale ? 'اكِ' : 'اك'} أول ما يفضى؟`,
                suggestedSlots: availCheck.nearestAvailable || [],
                reasoningSteps,
                state
            };
        }

        // 3.3 Exact slot is available! Lock choice -> Step 4
        if (availCheck.available) {
            const confirmedSlotTime = availCheck.requestedTime || activeTime;
            state.bookingDraft.time = confirmedSlotTime;
            state.pendingBooking = {
                doctor: activeDoctor,
                specialty: state.bookingDraft.specialty || 'كشف عيادة',
                date: activeDateLabel,
                time: confirmedSlotTime
            };

            reasoningSteps.push(`الموعد متاح (${confirmedSlotTime}). الانتقال للخطوة 4: قفل الاختيار وطلب بيانات التأكيد`);

            // Check if patient info is complete
            if (state.patientName && state.patientPhone) {
                return processChatMessage({ message: '', sessionId, sessionData: state, currentDate });
            }

            if (state.patientName && !state.patientPhone) {
                state.awaitingPhone = true;
                return {
                    reply: `تمام جداً، تم اختيار وتثبيت ميعاد الساعة ${confirmedSlotTime} (${activeDateLabel}) يا ${honorific}! ممكن بس رقم الواتساب الخاص بحضرتك عشان نأكد الحجز؟`,
                    reasoningSteps,
                    state
                };
            }

            if (!state.patientName && state.patientPhone) {
                state.awaitingName = true;
                return {
                    reply: `تمام جداً، تم اختيار وتثبيت ميعاد الساعة ${confirmedSlotTime} (${activeDateLabel}) يا فندم! يشرفني بس أعرف اسم حضرتك الكريم عشان نأكد الحجز؟`,
                    reasoningSteps,
                    state
                };
            }

            state.awaitingName = true;
            state.awaitingPhone = true;
            return {
                reply: `تمام جداً، تم اختيار وتثبيت ميعاد الساعة ${confirmedSlotTime} (${activeDateLabel}) يا فندم! يشرفني بس أعرف اسم حضرتك الكريم ورقم الواتساب عشان نأكد الحجز فوراً؟`,
                reasoningSteps,
                state
            };
        }
    }

    // Scenario B: Target Date is specified, but NO time specified -> Show Available Exact Slots (Step 3)
    if (activeDateLabel && (!activeTime || isAvailabilityAsk)) {
        reasoningSteps.push(`التنفيذ الفوري لأداة check_availability لعرض المواعيد المتاحة ليوم ${activeDateLabel}`);
        const availCheck = await appointmentService.checkAvailability({
            doctor: activeDoctor,
            date: activeDateLabel,
            time: null,
            currentDate
        });

        if (availCheck.isTodayFinished) {
            delete state.bookingDraft.date;
            delete state.bookingDraft.dateStr;
            const nextWork = availCheck.nextWorkingDay;
            const dayName = nextWork ? nextWork.dayNameAr : 'العمل القادم';
            const dateStr = nextWork ? nextWork.dateStr : '';
            reasoningSteps.push(`مواعيد اليوم انتهت بالكامل: عرض أقرب ميعاد متاح للدكتور في أول يوم عمل قادم (يوم ${dayName} الموافق ${dateStr}) دون قفز صامت`);
            return {
                reply: `مواعيد النهاردة انتهت بالكامل يا فندم. أقرب ميعاد متاح للدكتور في أول يوم عمل قادم هو يوم ${dayName} الموافق ${dateStr}.. تحب${gp.isFemale ? 'ي' : ''} أحجز لك${gp.isFemale ? 'ِ' : ''} فيه؟`,
                reasoningSteps,
                state
            };
        }

        const openSlots = availCheck.availableSlots || [];
        const slotsText = openSlots.map(s => '• ' + s).join('\n');
        const nameSalutation = gp.isFemale ? `${gp.ahlanBek} ${honorific}` : `${gp.ahlanBek} يا ${honorific}`;
        const introGreeting = isNewNameIntroduction ? `${nameSalutation}، ${gp.nawwart} عيادتنا! ` : '';
        let reply;
        if (state.bookingDraft && state.bookingDraft.isServiceCatalogMatch) {
            const specialtyHeader = state.bookingDraft.specialty || 'طب الأسنان - تبييض الأسنان بالليزر';
            reply = `${introGreeting}${clarificationGreeting || ''}مواعيد ${activeDoctor} (${specialtyHeader}) المتاحة هي: ${openSlots.join('، ')}. تحب${gp.isFemale ? 'ي' : ''} أحجزلك ميعاد فيهم؟`;
        } else {
            reply = `${introGreeting}${clarificationGreeting || ''}المواعيد المتاحة مع ${activeDoctor} ${activeDateLabel} هي:\n${slotsText}\n\nتحب${gp.isFemale ? 'ي' : ''} أحجز لحضرتك ميعاد فيهم؟`;
        }

        return {
            reply,
            reasoningSteps,
            state,
            suggestedSlots: openSlots
        };
    }

    // Scenario C: Booking requested but NO target date specified -> Ask for Target Date (Step 2)
    if (hasBookingIntent) {
        if (state.bookingDraft && state.bookingDraft.isServiceCatalogMatch) {
            const docSchedule = appointmentService.findDoctorSchedule(activeDoctor);
            const slotsSummary = appointmentService.getDoctorAvailableSlotsSummary(docSchedule.id);
            const specialtyHeader = state.bookingDraft.specialty || 'طب الأسنان - تبييض الأسنان بالليزر';
            return {
                reply: `مواعيد ${activeDoctor} (${specialtyHeader}) المتاحة هي: ${slotsSummary}. تحب${gp.isFemale ? 'ي' : ''} أحجزلك ميعاد فيهم؟`,
                reasoningSteps: [`عرض مواعيد الطبيب حصراً للخدمة المحددة (${specialtyHeader})`],
                state,
                suggestedSlots: docSchedule.slotsByDay[docSchedule.workingDayIndices[0]] || []
            };
        }

        const docSchedule = appointmentService.findDoctorSchedule(activeDoctor);
        const daysPrompt = docSchedule ? `مواعيد ${activeDoctor} (${docSchedule.specialty}) في العيادة هي (أيام ${docSchedule.workingDaysAr}) من ${docSchedule.hoursAr}. ` : '';
        const nameSalutation = gp.isFemale ? `${gp.ahlanBek} ${honorific}` : `${gp.ahlanBek} يا ${honorific}`;
        const introGreeting = isNewNameIntroduction ? `${nameSalutation}، ${gp.nawwart} عيادتنا! ${gp.habeb} ${gp.tostafser} عن المواعيد؟ ` : '';
        return {
            reply: `${introGreeting}${daysPrompt}تحب${gp.isFemale ? 'ي' : ''} حضرتك تحجز${gp.isFemale ? 'ي' : ''} يوم إيه فيهم؟`,
            reasoningSteps: [`طلب تحديد اليوم المستهدف للتحقق من أيام عمل الطبيب حصراً (${activeDoctor})`],
            state
        };
    }

    // Gibberish
    if (isGibberish(rawText)) {
        return {
            reply: 'عفواً، ما فهمتش قصد حضرتك، ممكن توضح أكتر إزاي أقدر أساعدك؟',
            reasoningSteps: ['طلب التوضيح بسبب نص غير مفهوم'],
            state
        };
    }

    // General fallback
    let fallbackReply = `تحت أمرك يا ${honorific || 'فندم'}، أقدر أساعدك في معرفة المواعيد المتاحة أو حجز موعد كشف مع أي من أطباء العيادة.`;
    if (!state.patientName) {
        fallbackReply = `تحت أمرك يا فندم، يشرفني أعرف اسم حضرتك الكريم الأول عشان أقدر أساعدك بشكل أفضل؟`;
        state.awaitingName = true;
    }

    return {
        reply: fallbackReply,
        reasoningSteps: ['معالجة الاستفسار العام'],
        state
    };
}

module.exports = {
    SYSTEM_PROMPT,
    getSystemPrompt,
    processChatMessage,
    getHonorific,
    analyzePhoneNumber,
    extractNameFromMessage,
    normalizeTypoAndSlang,
    resolveDateFromText,
    isAvailabilityInquiry,
    isWaitlistIntent,
    isAskingWhatDayTodayIs,
    detectChainedRelativeDate,
    isGibberish,
    isEmergencyMessage
};
