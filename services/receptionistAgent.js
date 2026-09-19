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
 * Standardizes Arabic characters (Alef variants, Hamzas, diacritics, extra spaces)
 */
function normalizeTypoAndSlang(text) {
    if (!text) return '';
    let t = convertArabicNumerals(text.trim());

    // Remove diacritics (tashkeel) and tatweel
    t = t.replace(/[\u064B-\u065F\u0640]/g, '');

    // Standardize Alef variants and Hamzas: [إأآٱ] -> ا
    t = t.replace(/[إأآٱ]/g, 'ا');

    // Standardize multi-word phrases first
    t = t.replace(/(^|[\s،,.؟?!])كنت\s+(?:عايز|عاوز|محتاج|حابب)($|[\s،,.؟?!])/g, '$1عايز$2')
         .replace(/(^|[\s،,.؟?!])احجزلي($|[\s،,.؟?!])/g, '$1احجز لي$2')
         .replace(/(^|[\s،,.؟?!])احجزلى($|[\s،,.؟?!])/g, '$1احجز لي$2');

    const wordReplacements = {
        'عيز': 'عايز',
        'عاوز': 'عايز',
        'محتاج': 'عايز',
        'حابب': 'عايز',
        'عايذ': 'عايز',
        'عايزة': 'عايز',
        'عايزه': 'عايز',
        'عاوزة': 'عايز',
        'عاوزه': 'عايز',
        'محتاجة': 'عايز',
        'محتاجه': 'عايز',
        'حابة': 'عايز',
        'حابه': 'عايز',
        'احغز': 'احجز',
        'احجذ': 'احجز',
        'احقز': 'احجز',
        'خيلها': 'خليها',
        'خلية': 'خليه',
        'معاد': 'ميعاد',
        'دكتوراه': 'دكتور',
        'دختور': 'دكتور',
        'بكرا': 'بكرة',
        'تلات': 'الثلاثاء',
        'اربع': 'الأربعاء',
        'اتنين': 'الإثنين',
        'تنين': 'الإثنين',
        'بيلعيل': 'بالليل',
        'بلليل': 'بالليل',
        'بليل': 'بالليل',
        'الكسف': 'الكشف',
        'كسف': 'كشف',
        'سنان': 'اسنان'
    };

    const tokens = t.split(/([\s،,.؟?!]+)/);
    for (let i = 0; i < tokens.length; i++) {
        if (wordReplacements[tokens[i]]) {
            tokens[i] = wordReplacements[tokens[i]];
        }
    }
    t = tokens.join('');

    // Clean extra whitespace
    t = t.replace(/\s+/g, ' ');

    return t;
}

const UNIVERSAL_GENERIC_BOOKING_REPLY = `أهلاً بك! نورت عيادتنا سمارت كلينك 🌸
عشان أقدر أساعدك بأدق ميعاد، تحب تكشف في أي تخصص أو مع أي دكتور من استشاريينا؟

• د. أحمد شريف (طب وجراحة الأسنان)
• د. سارة محمود (الجلدية والتجميل والليزر)
• د. حسام فتحي (أمراض الباطنة والقلب)
• د. مريم نبيل (طب وجراحة العيون)`;

function getUniversalGenericBookingReply(gp = {}, honorific = null, isNewNameIntroduction = false, isMidConversation = false) {
    const verb = gp.isFemale ? 'تحبي تكشفي' : 'تحب تكشف';
    if (isMidConversation) {
        const title = honorific ? ` يا ${honorific}` : ' يا فندم';
        return `تمام${title}! عشان أقدر أساعدك بأدق ميعاد، ${verb} في أي تخصص أو مع أي دكتور من استشاريينا؟\n\n• د. أحمد شريف (طب وجراحة الأسنان)\n• د. سارة محمود (الجلدية والتجميل والليزر)\n• د. حسام فتحي (أمراض الباطنة والقلب)\n• د. مريم نبيل (طب وجراحة العيون)`;
    }
    if (!honorific && !gp.isFemale) {
        return UNIVERSAL_GENERIC_BOOKING_REPLY;
    }
    let greeting = 'أهلاً بك! نورت عيادتنا سمارت كلينك 🌸';
    if (isNewNameIntroduction && honorific) {
        greeting = gp.isFemale
            ? `أهلاً بكِ يا ${honorific}! نورتِ عيادتنا سمارت كلينك 🌸`
            : `أهلاً بك يا ${honorific}! نورت عيادتنا سمارت كلينك 🌸`;
    }
    return `${greeting}\nعشان أقدر أساعدك بأدق ميعاد، ${verb} في أي تخصص أو مع أي دكتور من استشاريينا؟\n\n• د. أحمد شريف (طب وجراحة الأسنان)\n• د. سارة محمود (الجلدية والتجميل والليزر)\n• د. حسام فتحي (أمراض الباطنة والقلب)\n• د. مريم نبيل (طب وجراحة العيون)`;
}

/**
 * Resolve slot selection when user responds with an ordinal, index, or slot number (e.g. "3", "1", "2", "التالت", "الميعاد التالت", "رقم 3")
 */
function resolveSlotFromSelection(text, state = {}) {
    if (!text || !state.presentedSlots || !Array.isArray(state.presentedSlots) || state.presentedSlots.length === 0) {
        return null;
    }
    const clean = text.toLowerCase()
        .replace(/[\u064B-\u065F\u0640]/g, '')
        .replace(/[إأآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[؟?.,!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // If user explicitly stated an hour with "الساعة" or ":", prefer explicit time matching
    if (/(?:الساعة|الساعه|ساعة|ساعه)\s*\d+|:\d{2}/.test(clean)) {
        return null;
    }

    const slots = state.presentedSlots;
    let targetIndex = null;

    if (/^(?:1|١|الاول|الأول|اول ميعاد|أول ميعاد|الميعاد الاول|الميعاد الأول|رقم 1|رقم ١|واحد|الاولاني)$/.test(clean) ||
        /(?:اخترت|اختار|احجز|عايز|عاوز|هاخد|تناسبني|يناسبني)\s*(?:الميعاد\s+)?(?:الاول|الأول|رقم\s*1|رقم\s*١)/.test(clean)) {
        targetIndex = 0;
    } else if (/^(?:2|٢|التاني|الثاني|تاني ميعاد|ثاني ميعاد|الميعاد التاني|الميعاد الثاني|رقم 2|رقم ٢|اتنين|اثنين)$/.test(clean) ||
        /(?:اخترت|اختار|احجز|عايز|عاوز|هاخد|تناسبني|يناسبني)\s*(?:الميعاد\s+)?(?:التاني|الثاني|رقم\s*2|رقم\s*٢)/.test(clean)) {
        targetIndex = 1;
    } else if (/^(?:3|٣|التالت|الثالث|تالت ميعاد|ثالث ميعاد|الميعاد التالت|الميعاد الثالث|رقم 3|رقم ٣|تلاتة|ثلاثة)$/.test(clean) ||
        /(?:اخترت|اختار|احجز|عايز|عاوز|هاخد|تناسبني|يناسبني)\s*(?:الميعاد\s+)?(?:التالت|الثالث|رقم\s*3|رقم\s*٣)/.test(clean)) {
        targetIndex = 2;
    } else if (/^(?:4|٤|الرابع|رابع ميعاد|الميعاد الرابع|رقم 4|رقم ٤|اربعة|أربعة)$/.test(clean) ||
        /(?:اخترت|اختار|احجز|عايز|عاوز|هاخد|تناسبني|يناسبني)\s*(?:الميعاد\s+)?(?:الرابع|رقم\s*4|رقم\s*٤)/.test(clean)) {
        targetIndex = 3;
    } else if (/^(?:5|٥|الخامس|خامس ميعاد|الميعاد الخامس|رقم 5|رقم ٥|خمسة)$/.test(clean) ||
        /(?:اخترت|اختار|احجز|عايز|عاوز|هاخد|تناسبني|يناسبني)\s*(?:الميعاد\s+)?(?:الخامس|رقم\s*5|رقم\s*٥)/.test(clean)) {
        targetIndex = 4;
    } else if (/^(?:الاخير|الأخير|اخر ميعاد|آخر ميعاد|الميعاد الاخير|الميعاد الأخير)$/.test(clean)) {
        targetIndex = slots.length - 1;
    } else {
        const singleNumMatch = clean.match(/^(?:رقم\s*)?([1-9]|1[0-2])$/);
        if (singleNumMatch) {
            targetIndex = parseInt(singleNumMatch[1], 10) - 1;
        }
    }

    if (targetIndex !== null) {
        if (targetIndex >= 0 && targetIndex < slots.length) {
            return slots[targetIndex];
        } else {
            return {
                isOutOfRange: true,
                requestedNumber: targetIndex + 1,
                totalAvailable: slots.length,
                availableSlots: slots
            };
        }
    }

    return null;
}

/**
 * Check if the conversation context is actively awaiting doctor selection by number/name
 */
function isDoctorSelectionAwaited(state = {}) {
    if (state.awaitingDoctorSelection) return true;
    if (state.multiDoctorContext && (state.multiDoctorContext.step === 'AWAITING_FIRST_DOCTOR_CHOICE' || state.multiDoctorContext.step === 'AWAITING_ADDITIONAL_DECISION')) {
        return true;
    }
    if (state.history && Array.isArray(state.history) && state.history.length > 0) {
        const lastBot = [...state.history].reverse().find(m => m.sender === 'bot' || m.role === 'assistant');
        if (lastBot && lastBot.text) {
            const t = lastBot.text;
            if (t.includes('مع أي دكتور من استشاريينا') || 
                t.includes('في أي تخصص أو مع أي دكتور') ||
                t.includes('تختار بالاسم أو برقم الدكتور') ||
                t.includes('تحب نبدأ نحجز لحضرتك مع مين الأول') ||
                t.includes('تحب تكشف في أي تخصص') ||
                t.includes('تحب تضيف حجز تاني مع استشاري تاني') ||
                t.includes('عيادتنا بتوفر نخبة من أفضل الاستشاريين')) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Extract doctor by number or ordinal selection (e.g. "1", "2", "3", "4", "رقم 2", "التاني", "الثاني")
 */
function extractDoctorFromNumberOrOrdinal(text, state = {}) {
    if (!text) return null;
    const clean = text.trim().toLowerCase()
        .replace(/[\u064B-\u065F\u0640]/g, '')
        .replace(/[إأآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[؟?.,!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const doctorMap = {
        '1': 'dr_ahmed',
        '١': 'dr_ahmed',
        'الاول': 'dr_ahmed',
        'الأول': 'dr_ahmed',
        'واحد': 'dr_ahmed',
        'رقم 1': 'dr_ahmed',
        'رقم ١': 'dr_ahmed',
        'دكتور 1': 'dr_ahmed',
        'دكتور ١': 'dr_ahmed',
        'الاختيار الاول': 'dr_ahmed',
        'الاختيار الأول': 'dr_ahmed',
        'الخيار الاول': 'dr_ahmed',
        'الخيار الأول': 'dr_ahmed',

        '2': 'dr_sara',
        '٢': 'dr_sara',
        'التاني': 'dr_sara',
        'الثاني': 'dr_sara',
        'اتنين': 'dr_sara',
        'اثنين': 'dr_sara',
        'رقم 2': 'dr_sara',
        'رقم ٢': 'dr_sara',
        'دكتور 2': 'dr_sara',
        'دكتور ٢': 'dr_sara',
        'دكتوره 2': 'dr_sara',
        'دكتوره ٢': 'dr_sara',
        'الاختيار التاني': 'dr_sara',
        'الاختيار الثاني': 'dr_sara',
        'الخيار التاني': 'dr_sara',
        'الخيار الثاني': 'dr_sara',

        '3': 'dr_hossam',
        '٣': 'dr_hossam',
        'التالت': 'dr_hossam',
        'الثالث': 'dr_hossam',
        'تلاتة': 'dr_hossam',
        'ثلاثة': 'dr_hossam',
        'تلاته': 'dr_hossam',
        'ثلاثه': 'dr_hossam',
        'رقم 3': 'dr_hossam',
        'رقم ٣': 'dr_hossam',
        'دكتور 3': 'dr_hossam',
        'دكتور ٣': 'dr_hossam',
        'الاختيار التالت': 'dr_hossam',
        'الاختيار الثالث': 'dr_hossam',
        'الخيار التالت': 'dr_hossam',
        'الخيار الثالث': 'dr_hossam',

        '4': 'dr_mariam',
        '٤': 'dr_mariam',
        'الرابع': 'dr_mariam',
        'اربعة': 'dr_mariam',
        'أربعة': 'dr_mariam',
        'اربعه': 'dr_mariam',
        'أربعه': 'dr_mariam',
        'رقم 4': 'dr_mariam',
        'رقم ٤': 'dr_mariam',
        'دكتور 4': 'dr_mariam',
        'دكتور ٤': 'dr_mariam',
        'دكتوره 4': 'dr_mariam',
        'دكتوره ٤': 'dr_mariam',
        'الاختيار الرابع': 'dr_mariam',
        'الخيار الرابع': 'dr_mariam'
    };

    const isBareNumberOrOrdinal = /^[1-4١-٤]$/.test(clean) || 
        ['الاول', 'الأول', 'واحد', 'التاني', 'الثاني', 'اتنين', 'اثنين', 'التالت', 'الثالث', 'تلاتة', 'ثلاثة', 'تلاته', 'ثلاثه', 'الرابع', 'اربعة', 'أربعة', 'اربعه', 'أربعه'].includes(clean);

    if (doctorMap[clean]) {
        // If it's a bare number/ordinal and doctor selection is NOT awaited in conversation, DO NOT match doctor!
        if (isBareNumberOrOrdinal && !isDoctorSelectionAwaited(state)) {
            return null;
        }

        // If state already has an active doctor AND a selected date and is expecting a time,
        // don't confuse a raw number with a doctor unless prefixed with doctor/number keywords
        if (state.bookingDraft && state.bookingDraft.doctor && state.bookingDraft.date && !clean.includes('دكتور') && !clean.includes('رقم') && !clean.includes('خيار')) {
            return null;
        }
        return doctorMap[clean];
    }

    const prefixMatch = clean.match(/^(?:عايز|عاوز|حابب|محتاج|احجز|احجزلي|احجز لي|مع|اختار|اختيار|رقم|دكتور|دكتوره)\s+([1-4١-٤]|الاول|الأول|التاني|الثاني|التالت|الثالث|الرابع|واحد|اتنين|اثنين|تلاتة|ثلاثة|تلاته|ثلاثه|اربعة|أربعة)$/);
    if (prefixMatch && doctorMap[prefixMatch[1]]) {
        return doctorMap[prefixMatch[1]];
    }

    return null;
}

const DOCTOR_NUM_MAP = {
    1: 'dr_ahmed',
    2: 'dr_sara',
    3: 'dr_hossam',
    4: 'dr_mariam'
};

/**
 * Extract all distinct mentioned doctors from text preserving their order of appearance
 * Supports:
 * - Direct doctor names & specialties
 * - Numeric selections: "1 و 3", "2 و 4", "1 3", "1, 3", "١ و ٣"
 * - Ordinals and Arabic numbers: "الاول والتالت", "واحد وتلاتة"
 */
function extractAllMentionedDoctors(text, state = {}) {
    if (!text) return [];
    const clean = text.toLowerCase()
        .replace(/[\u064B-\u065F\u0640]/g, '')
        .replace(/[إأآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[؟?.,!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const isSelfIntro = clean.includes('اسمي') || clean.includes('اسمى') || clean.includes('معاك') || clean.includes('انا اسمي');
    const isDentalLaser = clean.includes('تبييض') || clean.includes('اسنان') || clean.includes('سنان') || clean.includes('احمد');

    const doctorPositions = [];

    function addDoctor(docId, idx) {
        if (idx !== -1 && idx !== Infinity) {
            const existing = doctorPositions.find(d => d.id === docId);
            if (!existing) {
                doctorPositions.push({ id: docId, idx });
            } else if (idx < existing.idx) {
                existing.idx = idx;
            }
        }
    }

    // 1. Text names & specialties
    // Dr. Ahmed Sherif (Dentistry)
    const ahmedKeywords = ['دكتور احمد', 'د احمد', 'د. احمد', 'احمد شريف', 'اسنان', 'سنان'];
    if (!isSelfIntro) ahmedKeywords.push('احمد');
    for (const kw of ahmedKeywords) {
        const idx = clean.indexOf(kw);
        if (idx !== -1) {
            addDoctor('dr_ahmed', idx);
            break;
        }
    }

    // Dr. Sara Mahmoud (Dermatology & Laser)
    const saraKeywords = ['دكتوره ساره', 'د ساره', 'د. ساره', 'ساره محمود', 'جلديه', 'تجميل'];
    if (!isDentalLaser) saraKeywords.push('ليزر');
    if (!isSelfIntro) saraKeywords.push('ساره');
    for (const kw of saraKeywords) {
        const idx = clean.indexOf(kw);
        if (idx !== -1) {
            addDoctor('dr_sara', idx);
            break;
        }
    }

    // Dr. Hossam Fathi (Cardiology & Internal)
    const hossamKeywords = ['دكتور حسام', 'د حسام', 'د. حسام', 'حسام فتحي', 'باطنه', 'قلب'];
    if (!isSelfIntro) hossamKeywords.push('حسام');
    for (const kw of hossamKeywords) {
        const idx = clean.indexOf(kw);
        if (idx !== -1) {
            addDoctor('dr_hossam', idx);
            break;
        }
    }

    // Dr. Mariam Nabil (Ophthalmology)
    const mariamKeywords = ['دكتوره مريم', 'د مريم', 'د. مريم', 'مريم نبيل', 'عيون', 'رمد'];
    if (!isSelfIntro) mariamKeywords.push('مريم');
    for (const kw of mariamKeywords) {
        const idx = clean.indexOf(kw);
        if (idx !== -1) {
            addDoctor('dr_mariam', idx);
            break;
        }
    }

    // 2. Numeric and ordinal patterns
    // Safeguard: don't parse numbers as doctors if state already has locked doctor and date and is awaiting a time slot
    const isAwaitingSlotTime = Boolean(
        state.bookingDraft && state.bookingDraft.doctor && state.bookingDraft.date &&
        !state.multiDoctorContext &&
        !clean.includes('دكتور') && !clean.includes('رقم') && !clean.includes('خيار') && !clean.includes('اختيار')
    );

    if (!isAwaitingSlotTime && !clean.includes('في الشهر') && !clean.includes('من الشهر')) {
        let normDigits = clean
            .replace(/١/g, '1')
            .replace(/٢/g, '2')
            .replace(/٣/g, '3')
            .replace(/٤/g, '4');

        // Ignore numbers that are part of time expressions (e.g. "الساعة 2", "ساعة 3", "2:30", "على 2") or day expressions ("يوم الأحد 1", "الحد 1")
        let cleanForNumbers = normDigits
            .replace(/(?:الساعة|الساعه|ساعة|ساعه|ع\s+الساعة|ع\s+الساعه|علي|على)\s*[1-9](?::[0-9]{2})?/g, ' ')
            .replace(/(?:يوم|الحد|الأحد|الاحد|السبت|الإثنين|الاتنين|الثلاثاء|التلات|الأربعاء|الاربع|الخميس|الجمعة)\s+[1-9]/g, ' ');

        const ordinalMap = [
            { patterns: ['الاول', 'الاولى', 'الأول', 'الاولاني', 'واحد'], id: 'dr_ahmed' },
            { patterns: ['التاني', 'الثاني', 'التانيه', 'الثانية', 'اتنين', 'اثنين'], id: 'dr_sara' },
            { patterns: ['التالت', 'الثالث', 'التالته', 'الثالثة', 'تلاته', 'تلاتة', 'ثلاثه', 'ثلاثة'], id: 'dr_hossam' },
            { patterns: ['الرابع', 'الرابعه', 'الرابعة', 'اربعه', 'اربعة'], id: 'dr_mariam' }
        ];

        const isMultiChoiceSyntax = /(?:[1-4١-٤]|الاول|الأول|التاني|الثاني|التالت|الثالث|الرابع|واحد|اتنين|اثنين|تلاتة|ثلاثة|اربعة|أربعة)\s*(?:و|,|،)\s*(?:[1-4١-٤]|الاول|الأول|التاني|الثاني|التالت|الثالث|الرابع|واحد|اتنين|اثنين|تلاتة|ثلاثة|اربعة|أربعة)/.test(cleanForNumbers);

        for (const item of ordinalMap) {
            for (const p of item.patterns) {
                const regex = new RegExp(`(^|[\\s،,و])${p}($|[\\s،,و])`, 'g');
                let match;
                while ((match = regex.exec(cleanForNumbers)) !== null) {
                    const prefixBefore = cleanForNumbers.slice(0, match.index).trim();
                    const hasExplicitPrefix = /(?:دكتور|دكتوره|د\.|رقم|اختيار|خيار|مع|احجز|عايز|عاوز|و)$/.test(prefixBefore);
                    if (hasExplicitPrefix || isDoctorSelectionAwaited(state) || isMultiChoiceSyntax) {
                        addDoctor(item.id, match.index);
                    }
                }
            }
        }

        const digitRegex = /(?<!\d)([1-4])(?!\d)/g;
        let dMatch;
        while ((dMatch = digitRegex.exec(cleanForNumbers)) !== null) {
            const digit = parseInt(dMatch[1], 10);
            const prefixBeforeDigit = cleanForNumbers.slice(0, dMatch.index).trim();
            const hasExplicitPrefix = /(?:دكتور|دكتوره|د\.|رقم|اختيار|خيار|مع|احجز|عايز|عاوز|و)$/.test(prefixBeforeDigit);
            if (DOCTOR_NUM_MAP[digit] && (hasExplicitPrefix || isDoctorSelectionAwaited(state) || isMultiChoiceSyntax)) {
                addDoctor(DOCTOR_NUM_MAP[digit], dMatch.index);
            }
        }
    }

    doctorPositions.sort((a, b) => a.idx - b.idx);
    return doctorPositions.map(d => d.id);
}

const DOCTOR_PRICES = {
    'dr_ahmed': 350,
    'dr_sara': 400,
    'dr_hossam': 500,
    'dr_mariam': 400
};

/**
 * Helper to parse a time slot string into minutes from midnight
 */
function parseSlotMinutes(slotStr) {
    if (!slotStr) return null;
    const clean = slotStr.replace(/مساءً|م|صباحاً|ص/g, '').trim();
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] ? parseInt(parts[1], 10) : 0;
    if (h < 12) h += 12;
    return h * 60 + m;
}

/**
 * Smart appointment coordination: finds the best consecutive slot for second doctor on the same day
 */
async function findBestConsecutiveSlot({ firstDoctorTime, firstDoctorDateStr, firstDoctorDateLabel, secondDoctorId, currentDate }) {
    const secondDoc = appointmentService.DOCTORS_SCHEDULE[secondDoctorId];
    if (!secondDoc) return { sameDayAvailable: false };

    const availCheck = await appointmentService.checkAvailability({
        doctor: secondDoc.name,
        date: firstDoctorDateLabel || firstDoctorDateStr,
        time: null,
        currentDate
    });

    if (availCheck.isDayOff) {
        return { sameDayAvailable: false, workingDaysAr: secondDoc.workingDaysAr };
    }

    const availableSlots = availCheck.availableSlots || [];
    const firstMins = parseSlotMinutes(firstDoctorTime);

    // Find slots after firstDoctorTime (at least 20 mins later to allow comfortable transition)
    const candidates = availableSlots
        .map(s => ({ slot: s, mins: parseSlotMinutes(s) }))
        .filter(x => x.mins !== null && (x.mins - firstMins) >= 20)
        .sort((a, b) => a.mins - b.mins);

    if (candidates.length > 0) {
        return {
            sameDayAvailable: true,
            recommendedSlot: candidates[0].slot,
            otherSlots: candidates.slice(1).map(c => c.slot)
        };
    }

    return {
        sameDayAvailable: true,
        noConsecutiveSlot: true,
        allDaySlots: availableSlots
    };
}

/**
 * Helper to present the unified pending summary for multiple doctors before final confirmation
 */
function presentUnifiedPendingSummary({ state, gp = {}, honorific = null, reasoningSteps = [], currentDate }) {
    state.multiDoctorContext.step = 'AWAITING_UNIFIED_CONFIRMATION';
    state.awaitingBookingConfirmation = true;

    // Check if patient info is missing
    if (!state.patientName || !state.patientPhone) {
        if (!state.patientName && !state.patientPhone) {
            state.awaitingName = true;
            state.awaitingPhone = true;
            return {
                reply: `تمام جداً! تم تنسيق ميعادين الكشف بنجاح. يشرفني بس أعرف اسم حضرتك الكريم ورقم الواتساب عشان أجهّز لحضرتك ملخص الحجز للتأكيد؟`,
                reasoningSteps,
                state
            };
        } else if (!state.patientName) {
            state.awaitingName = true;
            return {
                reply: `تمام جداً! تم تنسيق ميعادين الكشف بنجاح. يشرفني بس أعرف اسم حضرتك الكريم عشان أجهّز لحضرتك ملخص الحجز للتأكيد؟`,
                reasoningSteps,
                state
            };
        } else if (!state.patientPhone) {
            state.awaitingPhone = true;
            return {
                reply: `تمام جداً يا ${honorific || 'فندم'}! تم تنسيق ميعادين الكشف بنجاح. ممكن بس رقم الواتساب الخاص بحضرتك عشان أجهّز لحضرتك ملخص الحجز للتأكيد؟`,
                reasoningSteps,
                state
            };
        }
    }

    const d1 = state.multiDoctorContext.drafts[0];
    const d2 = state.multiDoctorContext.drafts[1];
    const totalPrice = (d1?.price || 0) + (d2?.price || 0);

    const nameDisplay = honorific ? (honorific.startsWith('أستاذ') || honorific.startsWith('دكتورة') ? honorific : `أستاذ/ة ${honorific}`) : (state.patientName || 'فندم');

    const reply = `تمام يا ${honorific || 'فندم'}! تم تجهيز تفاصيل الحجزين كمسودة معلقة (Pending):

📋 ملخص الحجز المجمّع:
1️⃣ ${d1.doctor} (${d1.departmentTitle || d1.specialty}) - ${d1.date} الساعة ${d1.time} (${d1.price} جنيه)
2️⃣ ${d2.doctor} (${d2.departmentTitle || d2.specialty}) - ${d2.date} الساعة ${d2.time} (${d2.price} جنيه)
💰 إجمالي رسوم الكشفين: ${totalPrice} جنيه
👤 الاسم: ${nameDisplay} | 📱 الواتساب: ${state.patientPhone}

لتأكيد الحجزين معاً، برجاء كتابة (تمام) أو (أكد الحجز)، وهنبعت لحضرتك رسالة التأكيد فوراً عبر الواتساب 🌸`;

    reasoningSteps.push('المسار المتعدد: عرض ملخص الحجوزات المجمعة بحالة معلقة (Pending) وطلب تأكيد المريض الموحد');

    return {
        reply,
        reasoningSteps,
        state
    };
}

/**
 * Format structured schedule details for multiple doctors in order
 */
function formatMultiDoctorSchedules(doctorIds, gp = {}) {
    const lines = ['مواعيد الاستشاريين المطلوبين في العيادة:\n'];
    for (const docId of doctorIds) {
        const doc = appointmentService.DOCTORS_SCHEDULE[docId];
        if (!doc) continue;
        const deptTitle = doc.departmentTitle || doc.department || doc.specialty;
        const pronoun = (docId === 'dr_sara' || docId === 'dr_mariam') ? 'مواعيدها' : 'مواعيده';
        lines.push(`• ${doc.name} (${deptTitle}):\n  ${pronoun} في العيادة أيام (${doc.workingDaysAr}) من ${doc.hoursAr}.\n`);
    }
    const docNames = doctorIds.map(id => appointmentService.DOCTORS_SCHEDULE[id]?.name).filter(Boolean);
    const optionsText = docNames.length === 2 ? `(${docNames[0]} ولا ${docNames[1]}؟)` : `(${docNames.join(' ولا ')})`;
    lines.push(`تحب نبدأ نحجز لحضرتك مع مين الأول يا فندم؟ ${optionsText}\n(ممكن تختار بالاسم أو برقم الدكتور)`);
    return lines.join('\n');
}

/**
 * Resolve user's chosen doctor when in multi-doctor selection step
 */
function resolveChosenDoctorFromMultiContext(text, multiContext, state = {}) {
    if (!text || !multiContext || !multiContext.selectedDoctors || multiContext.selectedDoctors.length === 0) {
        return null;
    }
    const clean = text.trim().toLowerCase()
        .replace(/[\u064B-\u065F\u0640]/g, '')
        .replace(/[إأآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[؟?.,!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const candidates = multiContext.selectedDoctors;

    // 1. Ordinals relative to options or numbers
    if (clean.includes('الاول') || clean.includes('الأول') || clean === '1' || clean === '١' || clean.includes('خيار اول') || clean.includes('اختيار اول') || clean.includes('واحد')) {
        if (candidates.includes('dr_ahmed')) return 'dr_ahmed';
        return candidates[0];
    }
    if (clean.includes('التاني') || clean.includes('الثاني') || clean.includes('خيار تاني') || clean.includes('اختيار تاني') || clean.includes('اتنين')) {
        if (candidates.length > 1) return candidates[1];
    }
    if (clean.includes('التالت') || clean.includes('الثالث') || clean.includes('تلاته') || clean.includes('تلاتة')) {
        if (candidates.includes('dr_hossam')) return 'dr_hossam';
        if (candidates.length > 2) return candidates[2];
    }
    if (clean.includes('الرابع') || clean.includes('اربعه') || clean.includes('اربعة')) {
        if (candidates.includes('dr_mariam')) return 'dr_mariam';
        if (candidates.length > 3) return candidates[3];
    }

    // 2. Direct absolute digits
    if (clean === '2' || clean === '٢') {
        if (candidates.includes('dr_sara')) return 'dr_sara';
        if (candidates.length > 1) return candidates[1];
    }
    if (clean === '3' || clean === '٣') {
        if (candidates.includes('dr_hossam')) return 'dr_hossam';
        if (candidates.length > 2) return candidates[2];
    }
    if (clean === '4' || clean === '٤') {
        if (candidates.includes('dr_mariam')) return 'dr_mariam';
        if (candidates.length > 3) return candidates[3];
    }

    // 3. Match candidate by name or specialty keywords
    for (const docId of candidates) {
        if (docId === 'dr_ahmed' && (clean.includes('احمد') || clean.includes('اسنان'))) return 'dr_ahmed';
        if (docId === 'dr_sara' && (clean.includes('ساره') || clean.includes('جلديه') || clean.includes('ليزر'))) return 'dr_sara';
        if (docId === 'dr_hossam' && (clean.includes('حسام') || clean.includes('باطنه') || clean.includes('قلب'))) return 'dr_hossam';
        if (docId === 'dr_mariam' && (clean.includes('مريم') || clean.includes('عيون') || clean.includes('رمد'))) return 'dr_mariam';
    }

    return null;
}

/**
 * Universal Generic Booking Regex / Intent Check
 * Checks if the message has generic booking intent keywords:
 * ["احجز", "ميعاد", "جلسة", "كشف", "استشارة", "فاضيين", "مواعيد"]
 * AND does NOT explicitly contain any doctor name OR specialty:
 * NOT ["أحمد", "شريف", "سارة", "محمود", "حسام", "فتحي", "مريم", "نبيل", "أسنان", "جلدية", "ليزر", "باطنة", "قلب", "عيون"]
 */
function isUniversalGenericBookingIntent(text, state = {}) {
    if (!text) return false;
    const clean = text.toLowerCase()
        .replace(/[\u064B-\u065F\u0640]/g, '')
        .replace(/[إأآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[؟?.,!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // 0. If user specifically selected a doctor by number or ordinal ("1", "2", "3", "4", "رقم 2", "التاني")
    if (extractDoctorFromNumberOrOrdinal(clean, state)) return false;
    if (extractAllMentionedDoctors(clean, state).length > 0) return false;

    // 1. Generic keywords check
    const genericKeywords = ['احجز', 'حجز', 'ميعاد', 'موعد', 'جلسه', 'جلسة', 'كشف', 'استشاره', 'استشارة', 'فاضيين', 'فاضي', 'مواعيد'];
    const hasGenericKeyword = genericKeywords.some(kw => clean.includes(kw));
    if (!hasGenericKeyword) return false;

    // 2. Doctor and Specialty exclusion keywords
    const docAndSpecialtyKeywords = [
        'احمد', 'أحمد', 'شريف', 'ساره', 'سارة', 'محمود', 'حسام', 'فتحي', 'مريم', 'نبيل',
        'اسنان', 'أسنان', 'سنان', 'ضرس', 'تبييض',
        'جلديه', 'جلدية', 'ليزر', 'بشره', 'بشرة', 'فيلر', 'بوتوكس',
        'باطنه', 'باطنة', 'قلب', 'ضغط', 'سكر',
        'عيون', 'رمد', 'نظاره', 'نظارة', 'ليزك'
    ];
    const hasDoctorOrSpecialty = docAndSpecialtyKeywords.some(kw => clean.includes(kw));
    if (hasDoctorOrSpecialty) return false;

    // 3. Exclude specific informational queries
    const isPrice = clean.includes('بكام') || clean.includes('بكم') || clean.includes('سعر') || clean.includes('اسعار') || clean.includes('تكلفه');
    if (isPrice) return false;

    const isLocation = clean.includes('عنوان') || clean.includes('مكان') || clean.includes('فين');
    if (isLocation) return false;

    const isInsurance = clean.includes('تامين') || clean.includes('بوبا') || clean.includes('اكسا') || clean.includes('ميدنت');
    if (isInsurance) return false;

    const isBranch = (clean.includes('فرع') || clean.includes('فروع')) && !clean.includes('احجز');
    if (isBranch) return false;

    // 4. If user already has an active doctor locked in booking draft from previous turns,
    // only short-circuit if they are resetting or starting a fresh generic booking
    const hasActiveDoctorInState = Boolean((state.bookingDraft && state.bookingDraft.doctor) || state.doctor_id);
    if (hasActiveDoctorInState) {
        return false;
    }

    return true;
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
        { idx: 0, ar: 'الأحد', aliases: ['احد', 'أحد', 'الحد', 'الاحد', 'الأحد', 'sun'] },
        { idx: 1, ar: 'الإثنين', aliases: ['اثنين', 'إثنين', 'اتنين', 'إتنين', 'التنين', 'الاتنين', 'mon'] },
        { idx: 2, ar: 'الثلاثاء', aliases: ['ثلاث', 'تلات', 'التلات', 'الثلاثاء', 'الثلاثا', 'tue'] },
        { idx: 3, ar: 'الأربعاء', aliases: ['اربع', 'أربع', 'الاربع', 'الأربع', 'الأربعاء', 'الاربعاء', 'wed'] },
        { idx: 4, ar: 'الخميس', aliases: ['خميس', 'الخميس', 'thu'] },
        { idx: 5, ar: 'الجمعة', aliases: ['جمع', 'الجمعة', 'جمعه', 'الجمعه', 'fri'] },
        { idx: 6, ar: 'السبت', aliases: ['سبت', 'السبت', 'sat'] },
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
    if (!text) return false;
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
           clean.includes('ظروف') || clean.includes('schedule') ||
           clean.includes('اشوف') || clean.includes('نشوف') ||
           clean.includes('اعرف') || clean.includes('نعرف') ||
           clean.includes('كل مواعيد') || clean.includes('مواعيد يوم');
}

/**
 * Helper to construct doctor entity with standardized IDs and department
 */
function buildDoctorEntity(doctorId, matchedService = null) {
    const docSchedule = appointmentService.DOCTORS_SCHEDULE[doctorId];
    if (!docSchedule) return null;

    const isCatalogMatch = Boolean(matchedService && matchedService.assigned_doctor_id === doctorId);
    const specialty = isCatalogMatch
        ? `${matchedService.category} - ${matchedService.display_name}`
        : docSchedule.specialty;

    return {
        doctor: docSchedule.name,
        doctor_id: docSchedule.doctor_id,
        specialty_id: isCatalogMatch ? matchedService.service_id : docSchedule.specialty_id,
        department: docSchedule.department,
        departmentTitle: docSchedule.departmentTitle,
        specialty,
        category: isCatalogMatch ? matchedService.category : docSchedule.category,
        serviceName: isCatalogMatch ? matchedService.display_name : null,
        assignedDoctorId: docSchedule.doctor_id,
        isServiceCatalogMatch: isCatalogMatch
    };
}

/**
 * Extract doctor and specialty from text
 * Enforces Strict Entity Priority Rules:
 * - Rule 1 (Explicit Doctor Mention): Explicit doctor name takes absolute priority over procedure keywords.
 * - Rule 2 (Category/Specialty Lock & Service Catalog Lookup First):
 *   Queries structured services catalog first. 'تبييض الأسنان' strictly locked to 'طب الأسنان' (Dr. Ahmed Sherif)
 *   and NEVER routes to 'الجلدية والتجميل' regardless of the word 'ليزر'.
 */
function extractDoctorAndSpecialty(text, state = {}) {
    if (!text) return null;
    const clean = text.toLowerCase();

    // Prevent mistaking patient introduction names for doctor requests
    const isSelfIntroduction = clean.includes('اسمي') || clean.includes('اسمى') || 
                               clean.includes('معاك') || clean.includes('أنا اسمي') || clean.includes('انا اسمي');

    // Rule 0: Number or Ordinal Doctor Selection (e.g. "1", "2", "3", "4", "رقم 2", "التاني", "الثاني")
    const numericDocId = extractDoctorFromNumberOrOrdinal(clean, state);
    if (numericDocId) {
        return buildDoctorEntity(numericDocId);
    }

    // Rule 1: Explicit Doctor Mentions (Highest Priority)
    const hasAhmedDoctorTitle = clean.includes('دكتور أحمد') || clean.includes('دكتور احمد') || 
                                clean.includes('د. أحمد') || clean.includes('د. احمد') || 
                                clean.includes('د أحمد') || clean.includes('د احمد') || 
                                clean.includes('أحمد شريف') || clean.includes('احمد شريف') ||
                                clean.includes('مع د. أحمد') || clean.includes('مع د. احمد') ||
                                clean.includes('مع دكتور أحمد') || clean.includes('مع دكتور احمد');

    const hasSaraDoctorTitle = clean.includes('دكتورة سارة') || clean.includes('دكتوره ساره') || 
                               clean.includes('د. سارة') || clean.includes('د. ساره') || 
                               clean.includes('د سارة') || clean.includes('د ساره') || 
                               clean.includes('سارة محمود') || clean.includes('ساره محمود') ||
                               clean.includes('مع دكتورة سارة') || clean.includes('مع د. سارة');

    const hasHossamDoctorTitle = clean.includes('دكتور حسام') || clean.includes('د. حسام') || 
                                 clean.includes('د حسام') || clean.includes('حسام فتحي') || 
                                 clean.includes('مع دكتور حسام') || clean.includes('مع د. حسام');

    const hasMariamDoctorTitle = clean.includes('دكتورة مريم') || clean.includes('دكتوره مريم') || 
                                 clean.includes('د. مريم') || clean.includes('د مريم') || 
                                 clean.includes('مريم نبيل') || 
                                 clean.includes('مع دكتورة مريم') || clean.includes('مع د. مريم');

    if (hasAhmedDoctorTitle) {
        const matchedService = appointmentService.lookupService(clean);
        return buildDoctorEntity('dr_ahmed', matchedService);
    }
    if (hasSaraDoctorTitle) {
        const matchedService = appointmentService.lookupService(clean);
        return buildDoctorEntity('dr_sara', matchedService);
    }
    if (hasHossamDoctorTitle) {
        const matchedService = appointmentService.lookupService(clean);
        return buildDoctorEntity('dr_hossam', matchedService);
    }
    if (hasMariamDoctorTitle) {
        const matchedService = appointmentService.lookupService(clean);
        return buildDoctorEntity('dr_mariam', matchedService);
    }

    // Rule 2: Service Catalog Lookup First
    const matchedService = appointmentService.lookupService(clean);
    if (matchedService && matchedService.assigned_doctor_id) {
        return buildDoctorEntity(matchedService.assigned_doctor_id, matchedService);
    }

    // Specialty / Keyword Lock: Dental / Teeth Whitening Priority
    // 'تبييض الأسنان' strictly locked to 'طب الأسنان'
    if (clean.includes('تبييض') || clean.includes('أسنان') || clean.includes('اسنان') || 
        clean.includes('سنان') || clean.includes('ضرس') || clean.includes('dentist') || 
        clean.includes('teeth') || clean.includes('zoom') || clean.includes('زووم') || clean.includes('زوم')) {
        return buildDoctorEntity('dr_ahmed', matchedService);
    }

    // Dermatology & Laser: ONLY if NOT dental and specifically dermatology or hair laser
    if (clean.includes('جلدية') || clean.includes('تجميل') || clean.includes('بشرة') || clean.includes('بشره') ||
        (clean.includes('ليزر') && !clean.includes('أسنان') && !clean.includes('اسنان') && !clean.includes('تبييض'))) {
        return buildDoctorEntity('dr_sara', matchedService);
    }

    // Cardiology / Internal Medicine
    if (clean.includes('باطنة') || clean.includes('باطنه') || clean.includes('قلب') || 
        clean.includes('ضغط') || clean.includes('سكر') || clean.includes('حسام') || clean.includes('hossam')) {
        return buildDoctorEntity('dr_hossam', matchedService);
    }

    // Ophthalmology
    if (clean.includes('عيون') || clean.includes('رمد') || clean.includes('نظارة') || 
        clean.includes('نظاره') || clean.includes('مريم') || clean.includes('mariam') || clean.includes('ليزك')) {
        return buildDoctorEntity('dr_mariam', matchedService);
    }

    // Contextual doctor mentions without "دكتور" prefix (safeguarded against name introductions)
    if (!isSelfIntroduction) {
        if (clean.includes('سارة') || clean.includes('ساره')) {
            return buildDoctorEntity('dr_sara');
        }
        if (clean.includes('أحمد') || clean.includes('احمد')) {
            return buildDoctorEntity('dr_ahmed');
        }
    }

    return null;
}

/**
 * Extract time slot from text (supports Arabic half/quarter hour fractions and negotiation phrases)
 */
function extractTimeSlot(text, state = {}) {
    if (!text) return null;
    const clean = text.toLowerCase().trim();

    // If user is selecting an option from presented slots, don't parse bare digit as fixed time
    const hasPresentedSlots = Boolean(state && state.presentedSlots && state.presentedSlots.length > 0);

    // If message contains day name followed by a standalone single digit without an explicit time marker (e.g. "يوم الأحد 1" or "يوم الحد 1")
    const isDayWithTrailingDigit = /(?:يوم|الحد|الأحد|الاحد|السبت|الإثنين|الاتنين|الثلاثاء|التلات|الأربعاء|الاربع|الخميس|الجمعة)\s+[1-9]$/i.test(clean) &&
                                   !/(?:الساعة|الساعه|ساعة|ساعه|:\d{2}|م$|مساء|صباح)/i.test(clean);

    // 0. If user is asking for general day schedule / all appointments on a day,
    // they are NOT requesting a specific time unless an explicit hour is stated
    const isGeneralDayScheduleAsk = /(?:اشوف|نشوف|اعرف|نعرف|سرد|قائمة|قايمة|جدول|عرض|كل|جميع)\s+(?:كل\s+)?(?:المواعيد|مواعيد)/i.test(clean) ||
                                    /(?:المواعيد|مواعيد)\s+(?:المتاحة|كلها|يوم)/i.test(clean);
    const hasExplicitTimeMarker = /(?:الساعة|الساعه|ساعة|ساعه)\s*(?:\d+|واحدة|اتنين|تلاتة|ثلاثة|اربعة|أربعة|خمسة|ستة|سبعة|تمانية|ثمانية|تسعة|عشرة)|:\d{2}|\d+\s*(?:ونص|ونصف)/i.test(clean);
    if (isGeneralDayScheduleAsk && !hasExplicitTimeMarker) {
        return null;
    }

    // Protect day names and relative days from false-positive hour extraction (e.g. "الاتنين" contains "اتنين", "يوم التلات")
    let cleanForTime = clean
        .replace(/ال[إا]تنين/g, ' ')
        .replace(/ال[إا]ثنين/g, ' ')
        .replace(/يوم\s+[أ-ي]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Check fractions first
    if (cleanForTime.includes('4:30') || cleanForTime.includes('اربعة ونصف') || cleanForTime.includes('أربعة ونصف') || cleanForTime.includes('اربعة ونص') || cleanForTime.includes('أربعة ونص') || cleanForTime.includes('4 ونص') || cleanForTime.includes('4 ونصف')) {
        return '4:30 مساءً';
    }
    if (cleanForTime.includes('5:30') || cleanForTime.includes('خمسة ونصف') || cleanForTime.includes('خمسة ونص') || cleanForTime.includes('5 ونص') || cleanForTime.includes('5 ونصف')) {
        return '5:30 مساءً';
    }
    if (cleanForTime.includes('6:30') || cleanForTime.includes('ستة ونصف') || cleanForTime.includes('ستة ونص') || cleanForTime.includes('6 ونص') || cleanForTime.includes('6 ونصف')) {
        return '6:30 مساءً';
    }
    if (cleanForTime.includes('7:30') || cleanForTime.includes('سبعة ونصف') || cleanForTime.includes('سبعة ونص') || cleanForTime.includes('7 ونص') || cleanForTime.includes('7 ونصف')) {
        return '7:30 مساءً';
    }
    if (cleanForTime.includes('2:30') || cleanForTime.includes('اتنين ونص') || cleanForTime.includes('2 ونص') || cleanForTime.includes('اتنين ونصف')) {
        return '2:30 مساءً';
    }
    if (cleanForTime.includes('8:30') || cleanForTime.includes('تمانية ونص') || cleanForTime.includes('ثمانية ونص') || cleanForTime.includes('8 ونص')) {
        return '8:30 مساءً';
    }

    // Direct negotiation patterns: "خليها 6", "خيلها 6", "خليه 6", "خليها 7", "يناسبني 6", "مناسب 6", "على 6"
    // Make sure this is not part of a phone number or multi-digit string (e.g. 010...)
    if (!/\d{3,}/.test(cleanForTime)) {
        const negotiationMatch = cleanForTime.match(/(?:خليها|خيلها|خليه|خلية|نخليها|خلينا|يناسبني|مناسب|على|علي)\s*(?:الساعة|الساعه|ساعة|ساعه)?\s*([1-9]|1[0-2])(?!\d)/);
        if (negotiationMatch) {
            const h = parseInt(negotiationMatch[1], 10);
            if (h >= 1 && h <= 10) {
                return `${h}:00 مساءً`;
            }
        }
    }

    const hasTimeContext = Boolean(
        (state.bookingDraft && (state.bookingDraft.date || state.bookingDraft.doctor)) ||
        (state.multiDoctorContext && state.multiDoctorContext.step === 'AWAITING_SECOND_DOCTOR_SLOT')
    );
    const allowBareDigit = !hasPresentedSlots && !isDayWithTrailingDigit && hasTimeContext;

    // Exact hours
    if (cleanForTime.includes('1:00') || /(?:الساعة|الساعه|ساعة|ساعه|على|علي|خليها|خليه|يناسبني|مناسب)\s*(?:1|واحدة)/.test(cleanForTime) || (allowBareDigit && (cleanForTime === 'واحدة' || cleanForTime === '1'))) {
        return '1:00 مساءً';
    }
    if (cleanForTime.includes('2:00') || /(?:الساعة|الساعه|ساعة|ساعه|على|علي|خليها|خليه|يناسبني|مناسب)\s*(?:2|اتنين|اثنين)/.test(cleanForTime) || (allowBareDigit && (cleanForTime === 'اتنين' || cleanForTime === '2'))) {
        return '2:00 مساءً';
    }
    if (cleanForTime.includes('3:00') || /(?:الساعة|الساعه|ساعة|ساعه|على|علي|خليها|خليه|يناسبني|مناسب)\s*(?:3|تلاتة|ثلاثة)/.test(cleanForTime) || (allowBareDigit && (cleanForTime === 'تلاتة' || cleanForTime === '3'))) {
        return '3:00 مساءً';
    }
    if (cleanForTime.includes('4:00') || /(?:الساعة|الساعه|ساعة|ساعه|على|علي|خليها|خليه|يناسبني|مناسب)\s*(?:4|اربعة|أربعة)/.test(cleanForTime) || (allowBareDigit && (cleanForTime === 'اربعة' || cleanForTime === '4'))) {
        return '4:00 مساءً';
    }
    if (cleanForTime.includes('5:00') || /(?:الساعة|الساعه|ساعة|ساعه|على|علي|خليها|خليه|يناسبني|مناسب)\s*(?:5|خمسة)/.test(cleanForTime) || (allowBareDigit && (cleanForTime === 'خمسة' || cleanForTime === '5'))) {
        return '5:00 مساءً';
    }
    if (cleanForTime.includes('6:00') || /(?:الساعة|الساعه|ساعة|ساعه|على|علي|خليها|خليه|يناسبني|مناسب)\s*(?:6|ستة)/.test(cleanForTime) || (allowBareDigit && (cleanForTime === 'ستة' || cleanForTime === '6'))) {
        return '6:00 مساءً';
    }
    if (cleanForTime.includes('7:00') || /(?:الساعة|الساعه|ساعة|ساعه|على|علي|خليها|خليه|يناسبني|مناسب)\s*(?:7|سبعة)/.test(cleanForTime) || (allowBareDigit && (cleanForTime === 'سبعة' || cleanForTime === '7'))) {
        return '7:00 مساءً';
    }
    if (cleanForTime.includes('8:00') || /(?:الساعة|الساعه|ساعة|ساعه|على|علي|خليها|خليه|يناسبني|مناسب)\s*(?:8|تمانية|ثمانية)/.test(cleanForTime) || (allowBareDigit && (cleanForTime === 'تمانية' || cleanForTime === '8'))) {
        return '8:00 مساءً';
    }
    if (cleanForTime.includes('9:00') || /(?:الساعة|الساعه|ساعة|ساعه|على|علي|خليها|خليه|يناسبني|مناسب)\s*(?:9|تسعة)/.test(cleanForTime) || (allowBareDigit && (cleanForTime === 'تسعة' || cleanForTime === '9'))) {
        return '9:00 مساءً';
    }
    if (cleanForTime.includes('بالليل') || cleanForTime.includes('بيلعيل') || (cleanForTime.includes('في المساء') && !cleanForTime.includes('مساء الخير') && !cleanForTime.includes('مساء الورد') && !cleanForTime.includes('مساء النور'))) {
        return '7:00 مساءً';
    }
    return null;
}

/**
 * Check if the input is completely incomprehensible gibberish / keyboard mash
 */
function isGibberish(text) {
    if (!text) return false;
    const clean = text.trim();
    if (clean.length < 3) return false;

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
        'ميعاد', 'موعد', 'ساعة', 'ساعه', 'يوم', 'الإثنين', 'الاثنين', 'الاتنين', 'التنين', 'الثلاثاء', 'التلات', 'الأربعاء', 'الاربع', 'الخميس',
        'الجمعة', 'الجمعه', 'السبت', 'الأحد', 'الاحد', 'الحد', 'احد', 'الواتساب', 'واتساب', 'رقمي', 'سجلني', 'شكرا', 'تمام', 'ألو', 'الو',
        'الاول', 'الأول', 'الاولاني', 'التاني', 'الثاني', 'التانية', 'الثانية', 'التالت', 'الثالث', 'التالتة', 'الثالثة', 'الرابع', 'الخامس', 'الاخير', 'الأخير', 'واحد', 'اتنين', 'تلاتة', 'ثلاثة',
        'بكرة', 'غدا', 'متاح', 'محجوز', 'انتظار', 'بلغوني', 'نبهني', 'تنورنا', 'خدمات', 'أسعار', 'رقم', 'معاك',
        'فاضي', 'فاضيين', 'مواعيد', 'بكام', 'بكم', 'سعر', 'كام', 'بعده', 'بعديه', 'اخبار', 'أخبار',
        'عنوان', 'مكان', 'فين', 'فرع', 'فروع', 'دمنهور', 'اسكندرية', 'الإسكندرية', 'تأمين', 'تامين', 'بوبا', 'اكسا'
    ];

    const hasKnownWord = knownWords.some(w => clean.includes(w));
    if (hasKnownWord) return false;

    if (/\d{3,}/.test(clean)) return false;

    // Keyboard rows in Arabic
    const row1 = 'ضصثقفغعهخحجد';
    const row2 = 'شسيبلاتنمكط';
    const row3 = 'ئءؤرىةوزظ';

    // If words are composed of mash characters and no known word
    const words = clean.split(/\s+/).filter(Boolean);
    let mashWordCount = 0;
    for (const w of words) {
        if (w.length >= 4) {
            const isRowMash = [...w].every(c => row1.includes(c)) || [...w].every(c => row2.includes(c)) || [...w].every(c => row3.includes(c));
            if (isRowMash) {
                mashWordCount++;
            }
        }
    }

    if (mashWordCount >= 1 && !hasKnownWord) {
        return true;
    }

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

    // Only flag as phone attempt if it has phone-like indicators
    const isPhoneLike = cleanNumber.startsWith('01') || cleanNumber.startsWith('+20') || cleanNumber.startsWith('0020') || cleanNumber.length >= 7;

    return {
        hasAttempt: isPhoneLike,
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
    'عايز', 'عاوز', 'عاوزه', 'عايزة', 'عايزين', 'عيز', 'محتاج', 'محتاجة', 'حابب', 'حابة', 'حابه', 'اريد', 'أريد', 'نفسي', 'ممكن',
    'كنت', 'كنت عايز', 'كنت حابب',
    'حجز', 'احجز', 'احجزلي', 'احجزلى', 'كشف', 'ميعاد', 'موعد', 'معاد', 'مواعيد', 'ساعة', 'ساعه', 'ساعات', 'وقت', 'أوقات', 'تاريخ', 'يوم', 'أيام',
    'اشوف', 'نشوف', 'اعرف', 'نعرف', 'استشارة', 'استشاره', 'جلسة', 'جلسه',
    'أسنان', 'اسنان', 'جلدية', 'جلديه', 'باطنة', 'باطنه', 'عيون', 'دكتور', 'دكتورة', 'دكتوره', 'دكاترة', 'عيادة', 'عياده', 'طبيب',
    'بكرة', 'بكرا', 'النهاردة', 'النهارده', 'امبارح', 'بعده', 'بعديه', 'بعدها',
    'سعر', 'اسعار', 'أسعار', 'تكلفة', 'تكلفه', 'بكام', 'بكم', 'فلوس', 'جنيه',
    'رقم', 'رقمي', 'تليفون', 'هاتف', 'موبايل', 'واتساب', 'الواتساب',
    'شكرا', 'شكراً', 'تسلم', 'عفوا', 'عفواً', 'ماشي', 'ماشى', 'اوك', 'اوكي', 'حاضر', 'طيب', 'خلاص',
    'تعبان', 'مريض', 'وجع', 'ألم', 'ضرسي', 'ساني', 'ضرس', 'سنان',
    'حضرتك', 'فندم', 'باشا', 'أستاذ', 'استاذ', 'أستاذة', 'استاذة',
    'مش', 'غير', 'لا', 'اه', 'نعم', 'ايوة', 'ايوه', 'كل'
]);

function containsBlacklistedNameWord(phrase) {
    if (!phrase) return false;
    const words = phrase.split(/\s+/);
    return words.some(w => {
        const raw = w.toLowerCase().replace(/[؟?.,!]/g, '');
        const normalized = raw.replace(/[إأآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
        return NAME_BLACKLIST.has(raw) || NAME_BLACKLIST.has(normalized);
    });
}

/**
 * Extract patient name from message (Entity Extraction Guard)
 * STRICT RULE: Never extract casual conversational greetings or booking intents as names.
 */
function extractNameFromMessage(text, isExplicitlyAwaitingName = false) {
    if (!text) return null;
    const clean = text.trim();

    // Strip negated name statements like "اسمي مش سارة" or "مش اسمي سارة"
    let effectiveClean = clean
        .replace(/(?:اسمي|اسمى)\s+مش\s+[^\n،,.]+/gi, '')
        .replace(/مش\s+(?:اسمي|اسمى)\s+[^\n،,.]+/gi, '')
        .replace(/(?:اسمي|اسمى)\s+غير\s+[^\n،,.]+/gi, '')
        .replace(/(?:01\d{9}|\+?201\d{9}|\b\d{11}\b)/g, '')
        .trim();

    // Explicit introduction patterns ONLY (allows 1 to 4 words name)
    const explicitPatterns = [
        /(?:اسمي|اسمى)\s+([أ-يa-zA-Z]{2,15}(?:\s+[أ-يa-zA-Z]{2,15}){0,3})/i,
        /(?:أنا|انا)\s+(?:اسمي|اسمى)?\s*([أ-يa-zA-Z]{2,15}(?:\s+[أ-يa-zA-Z]{2,15}){0,3})/i,
        /(?:معاك|معك)\s+(?:أستاذ|استاذ|دكتور|باشمهندس|مهندس|مدام|سيدة)?\s*([أ-يa-zA-Z]{2,15}(?:\s+[أ-يa-zA-Z]{2,15}){0,3})/i,
        /(?:الحجز\s+باسم|سجل\s+باسم|باسم)\s+([أ-يa-zA-Z]{2,15}(?:\s+[أ-يa-zA-Z]{2,15}){0,3})/i
    ];

    const hasPhoneInMessage = /(?:01\d{9}|\+?201\d{9}|\b\d{11}\b)/.test(clean);
    if (hasPhoneInMessage) {
        let nameCandidate = effectiveClean
            .replace(/(?:الساعة|الساعه)\s*\d+/gi, '')
            .replace(/:\d{2}/g, '')
            .replace(/^(?:تمام|اه|أه|ايوة|ايوه|ماشي|ماشى|اوك|اوكي|موافق|أكد|اكد|سجل|احجز|و)\s+/gi, '')
            .replace(/^(?:تمام|اه|أه|ايوة|ايوه|ماشي|ماشى|اوك|اوكي|موافق|أكد|اكد|سجل|احجز|و)\s+/gi, '')
            .trim();
        if (nameCandidate.startsWith('و')) nameCandidate = nameCandidate.slice(1).trim();
        const candidateWords = nameCandidate.split(/\s+/).filter(Boolean);
        if (candidateWords.length >= 1 && candidateWords.length <= 3) {
            const hasBookingOrIntent = /(?:عايز|عاوز|احجز|حجز|كشف|بكام|سعر|فين|مكان|عايزة|عاوزه|مواعيد|فاضيين|ميعاد|موعد|دكتور|دكتورة|تخصص|اشوف|اعرف|استشارة|جلسة|اسنان|جلدية|باطنة|عيون|كنت|حابب|حابة)/i.test(nameCandidate);
            if (!hasBookingOrIntent && !containsBlacklistedNameWord(nameCandidate) && !/\d/.test(nameCandidate) && nameCandidate.length >= 2) {
                return nameCandidate;
            }
        }
    }

    // Stop words that shouldn't be included as part of the patient's name
    const NAME_STOP_WORDS = new Set([
        'ورقمي', 'ورقمى', 'ورقم', 'وتليفوني', 'وتليفونى', 'رقمي', 'رقمى', 'تليفوني', 'تليفونى', 
        'وعايز', 'وعايزة', 'وعاوز', 'وعاوزة', 'وحابب', 'وحابة', 'وعندي', 'وعندى', 'مش', 'لا', 'غير',
        'كشف', 'حجز', 'احجز', 'كنت'
    ]);

    for (const pattern of explicitPatterns) {
        const match = effectiveClean.match(pattern);
        if (match && match[1]) {
            let candidate = match[1].trim();
            const words = candidate.split(/\s+/);
            const stopIdx = words.findIndex(w => NAME_STOP_WORDS.has(w.toLowerCase()));
            if (stopIdx !== -1) {
                candidate = words.slice(0, stopIdx).join(' ').trim();
            }
            const hasBookingOrIntent = /(?:عايز|عاوز|احجز|حجز|كشف|بكام|سعر|فين|مكان|عايزة|عاوزه|مواعيد|فاضيين|ميعاد|موعد|دكتور|دكتورة|تخصص|اشوف|اعرف|استشارة|جلسة|اسنان|جلدية|باطنة|عيون|كنت|حابب|حابة)/i.test(candidate);
            if (candidate && !containsBlacklistedNameWord(candidate) && !hasBookingOrIntent && !/\d/.test(candidate) && candidate.length >= 2) {
                return candidate;
            }
        }
    }

    // ONLY if the bot specifically asked for the name in the immediately preceding turn
    if (isExplicitlyAwaitingName) {
        let candidate = effectiveClean;
        const words = candidate.split(/\s+/);
        const stopIdx = words.findIndex(w => NAME_STOP_WORDS.has(w.toLowerCase()));
        if (stopIdx !== -1) {
            candidate = words.slice(0, stopIdx).join(' ').trim();
        }
        const hasBookingOrIntent = /(?:عايز|عاوز|احجز|حجز|كشف|بكام|سعر|فين|مكان|عايزة|عاوزه|مواعيد|فاضيين|ميعاد|موعد|دكتور|دكتورة|تخصص|اشوف|اعرف|استشارة|جلسة|اسنان|جلدية|باطنة|عيون|كنت|حابب|حابة)/i.test(candidate);
        if (hasBookingOrIntent) {
            return null;
        }
        const candidateWords = candidate.split(/\s+/).filter(Boolean);
        if (candidateWords.length >= 1 && candidateWords.length <= 4 && !containsBlacklistedNameWord(candidate) && !/\d/.test(candidate) && /^[أ-يa-zA-Z\s]{2,40}$/.test(candidate)) {
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
    // MODULE 1.5: INCOMPREHENSIBLE GIBBERISH / KEYBOARD MASH GUARD
    // -------------------------------------------------------------
    if (!state.awaitingName && !state.awaitingPhone && isGibberish(rawText)) {
        reasoningSteps.push('طلب التوضيح بسبب نص غير مفهوم / كتابة عشوائية دون اختلاق حجز');
        return {
            reply: 'عفواً، ما فهمتش قصد حضرتك، ممكن توضح أكتر إزاي أقدر أساعدك؟',
            reasoningSteps,
            state
        };
    }

    // -------------------------------------------------------------
    // DYNAMIC GENDER & PRONOUN AGREEMENT TRACKING
    // -------------------------------------------------------------
    state.gender = detectGender({
        text: rawText,
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
        const hasBookingOrIntent = /(?:عايز|عاوز|احجز|حجز|كشف|بكام|سعر|فين|مكان|عايزة|عاوزه|مواعيد|فاضيين|ميعاد|موعد|دكتور|دكتورة|تخصص|اشوف|اعرف|استشارة|جلسة|اسنان|جلدية|باطنة|عيون|كنت|حابب|حابة|خدمات|تأمين|تامين|فرع)/i.test(cleanNoPunct);
        const isNotPhone = !phoneAnalysis.isValid && !/\d{4,}/.test(cleanNoPunct);

        if (hasBookingOrIntent) {
            delete state.awaitingName;
        } else if (words.length >= 1 && words.length <= 4 && isNotPhone && !containsBlacklistedNameWord(cleanNoPunct)) {
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

            if (state.multiDoctorContext && state.multiDoctorContext.step === 'AWAITING_UNIFIED_CONFIRMATION') {
                delete state.awaitingName;
                if (!state.patientPhone) {
                    state.awaitingPhone = true;
                    const reply = `أهلاً بك يا ${honorific}! تم تسجيل اسم حضرتك، ممكن بس رقم الواتساب عشان أجهّز لحضرتك ملخص الحجز للتأكيد؟`;
                    return { reply, reasoningSteps, state };
                }
                return presentUnifiedPendingSummary({ state, gp, honorific, reasoningSteps, currentDate });
            }

            if (state.pendingBooking) {
                if (state.patientPhone) {
                    return processChatMessage({ message: '', sessionId, sessionData: state, currentDate });
                }
                state.awaitingPhone = true;
                const reply = `أهلاً بك يا ${honorific}! تم تسجيل اسم حضرتك، ممكن بس رقم الواتساب عشان نأكد الحجز؟`;
                return { reply, reasoningSteps, state };
            }

            if (state.awaitingWaitlist) {
                const docName = state.waitlistSlot?.doctor || state.bookingDraft?.doctor;
                if (!docName) {
                    return {
                        reply: UNIVERSAL_GENERIC_BOOKING_REPLY,
                        reasoningSteps: ['حظر استدعاء أداة قائمة الانتظار لعدم تحديد الطبيب'],
                        state
                    };
                }
                if (state.patientPhone) {
                    const waitlistResult = await appointmentService.addToWaitlist({
                        patientName: state.patientName,
                        phone: state.patientPhone,
                        doctor: docName,
                        requestedDate: state.waitlistSlot?.date || 'يوم الإثنين',
                        requestedTime: state.waitlistSlot?.time || '4:30 مساءً',
                        notes: 'طلب إخطار فوري عند توفر الموعد'
                    });
                    let reply;
                    if (state.multiDoctorContext && state.multiDoctorContext.remainingDoctors && state.multiDoctorContext.remainingDoctors.length > 0) {
                        const nextDocId = state.multiDoctorContext.remainingDoctors[0];
                        const nextDoc = appointmentService.DOCTORS_SCHEDULE[nextDocId];
                        const nextDeptTitle = nextDoc ? (nextDoc.departmentTitle || nextDoc.department || nextDoc.specialty) : '';
                        state.multiDoctorContext.step = 'AWAITING_NEXT_DOCTOR_DECISION';

                        reply = `تمام يا ${honorific}، تم تسجيل طلبك بالرقم (${state.patientPhone}) في قائمة الانتظار لـ ${docName}. أول ما يفضى ميعاد هنتواصل مع حضرتك فوراً على الواتساب. 🌸\n\nوبالنسبة لـ ${nextDoc.name} (${nextDeptTitle})، تحب نحدد ميعاد كشفه دلوقتي؟`;
                    } else {
                        reply = `تمام يا ${honorific}، تم تسجيل طلبك بالرقم (${state.patientPhone}) في قائمة الانتظار لـ ${docName}. أول ما يفضى ميعاد هنتواصل مع حضرتك فوراً على الواتساب. 🌸\n\nتحب${gp.isFemale ? 'ي' : ''} نحجز لحضرتك كشف تاني مع أي دكتور أو تخصص تاني في العيادة، ولا نكتفي بالتسجيل ده؟`;

                        state.postBookingFlow = {
                            step: 'AWAITING_ADDITIONAL_DECISION',
                            lastDoctor: docName,
                            isWaitlist: true
                        };
                    }

                    delete state.bookingDraft;
                    delete state.waitlistSlot;
                    delete state.awaitingWaitlist;
                    delete state.awaitingPhone;
                    state.sessionState = 'WAITLIST_CONFIRMATION';
                    state.status = 'WAITLIST_CONFIRMATION';
                    state.step = 'WAITLIST_CONFIRMATION';
                    return { reply, reasoningSteps, state, card: { type: 'waitlist_confirmed', waitlistId: waitlistResult.waitlistId, patientName: state.patientName, doctor: docName, phone: state.patientPhone } };
                }
                state.awaitingPhone = true;
                state.sessionState = 'WAITLIST_AWAITING_PHONE';
                state.status = 'WAITLIST_AWAITING_PHONE';
                state.step = 'WAITLIST_AWAITING_PHONE';
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

    const isNameCorrection = normalizedText.includes('اسمي مش') || 
                             normalizedText.includes('اسمى مش') ||
                             normalizedText.includes('مش اسمي') || 
                             normalizedText.includes('مش اسمى') ||
                             normalizedText.includes('غيرت اسمي') || 
                             normalizedText.includes('غيرت اسمى') || 
                             normalizedText.includes('تعديل الاسم') || 
                             normalizedText.includes('تصحيح الاسم') || 
                             normalizedText.includes('الاسم الصحيح') || 
                             normalizedText.includes('الاسم الصح') ||
                             normalizedText.includes('الاسم غلط');

    if (!state.patientName || isNameCorrection) {
        const extractedName = extractNameFromMessage(rawText, Boolean(state.awaitingName)) || extractNameFromMessage(normalizedText, Boolean(state.awaitingName));
        if (extractedName) {
            state.userName = extractedName;
            state.patientName = extractedName;
            delete state.awaitingName;
            if (isFeminineName(extractedName)) {
                state.gender = 'female';
            } else if (MASCULINE_NAMES.has(extractedName)) {
                state.gender = 'male';
            } else {
                state.gender = detectGender({
                    text: rawText,
                    name: extractedName,
                    currentGender: state.gender || state.userGender
                });
            }
            state.userGender = state.gender;
            gp = getGenderedPhrases(state.gender);
            reasoningSteps.push(`تم ${isNameCorrection ? 'تصحيح' : 'التعرف على'} اسم المريض: ${extractedName} وضبط التذكير والتأنيث (${state.gender}) وحفظه في ذاكرة الجلسة`);
        }
    }

    const honorific = state.patientName ? gp.formatHonorific(state.patientName) : null;
    const isNewNameIntroduction = !hasNamePreviously && Boolean(state.patientName);

    // Phone number analyzed at start of message
    if (phoneAnalysis.isValid) {
        state.patientPhone = phoneAnalysis.phone;
        delete state.awaitingPhone;
        reasoningSteps.push(`تم التحقق من صحة رقم الواتساب المصري: ${phoneAnalysis.phone}`);

        if (state.multiDoctorContext && state.multiDoctorContext.step === 'AWAITING_UNIFIED_CONFIRMATION') {
            if (state.patientName) {
                delete state.awaitingName;
                return presentUnifiedPendingSummary({ state, gp, honorific, reasoningSteps, currentDate });
            } else {
                state.awaitingName = true;
                return {
                    reply: `تمام جداً، تم تسجيل رقم الواتساب (${phoneAnalysis.phone}). يشرفني بس معرفة اسم حضرتك الكريم عشان أجهّز ملخص الحجز للتأكيد؟`,
                    reasoningSteps,
                    state
                };
            }
        }
    }

    // Entity Correction acknowledgment
    if (isNameCorrection && state.patientName) {
        reasoningSteps.push(`تصحيح بيانات المريض: تعديل الاسم إلى "${state.patientName}"`);
        const newHonorific = gp.formatHonorific(state.patientName);
        let corrReply = `تمام يا ${newHonorific}، تم تعديل البيانات وتسجيل اسم حضرتك`;
        if (state.patientPhone) {
            corrReply += ` ورقم الواتساب (${state.patientPhone})`;
        }
        corrReply += ' بنجاح! ';

        if (state.bookingDraft?.doctor) {
            if (state.bookingDraft.date && state.bookingDraft.time) {
                corrReply += `تحب${gp.isFemale ? 'ي' : ''} نأكد حجز ميعاد حضرتك ${state.bookingDraft.date} الساعة ${state.bookingDraft.time} مع ${state.bookingDraft.doctor}؟`;
            } else if (state.bookingDraft.date) {
                corrReply += `تحب${gp.isFemale ? 'ي' : ''} ميعاد الساعة كام لكشف ${state.bookingDraft.specialty || state.bookingDraft.doctor} ${state.bookingDraft.date}؟`;
            } else {
                corrReply += `تحب${gp.isFemale ? 'ي' : ''} تحجز${gp.isFemale ? 'ي' : ''} يوم إيه مع ${state.bookingDraft.doctor}؟`;
            }
        } else {
            corrReply += `إزاي أقدر أساعدك النهاردة؟`;
        }

        return {
            reply: corrReply,
            reasoningSteps,
            state
        };
    }

    // -------------------------------------------------------------
    // MODULE 1.6: UNIVERSAL GENERIC BOOKING INTENT INTERCEPTOR (Pre-LLM / Pre-Tool Short-Circuit)
    // -------------------------------------------------------------
    if (!isNameCorrection && !phoneAnalysis.hasAttempt && isUniversalGenericBookingIntent(normalizedText, state)) {
        delete state.awaitingName;
        delete state.awaitingPhone;
        state.awaitingDoctorSelection = true;
        reasoningSteps.push('معترض النوايا العامة الفوري (Universal Generic Intent Interceptor): رصد نية حجز عامة دون تحديد الطبيب أو التخصص صراحة. التوقف الفوري دون استدعاء أي أداة أو LLM.');
        const effectiveDate = resolveDateFromText(normalizedText, currentDate);
        if (effectiveDate) {
            state.bookingDraft = state.bookingDraft || {};
            state.bookingDraft.date = effectiveDate.label;
            state.bookingDraft.dateStr = effectiveDate.dateStr;
        }
        const isMidConversation = Boolean(
            state.userName || state.patientName || state.patientPhone ||
            (state.history && state.history.length > 0) ||
            state.postBookingFlow || state.multiDoctorContext
        );
        return {
            reply: getUniversalGenericBookingReply(gp, honorific, isNewNameIntroduction, isMidConversation),
            reasoningSteps,
            state
        };
    }

    // -------------------------------------------------------------
    // MODULE 1.7.1: MULTI-DOCTOR STATE HANDLER (Chained Flow)
    // -------------------------------------------------------------
    if (state.multiDoctorContext && state.multiDoctorContext.step === 'AWAITING_FIRST_DOCTOR_CHOICE') {
        const chosenDoctorId = resolveChosenDoctorFromMultiContext(normalizedText, state.multiDoctorContext, state);
        if (chosenDoctorId) {
            const doc = appointmentService.DOCTORS_SCHEDULE[chosenDoctorId];
            if (doc) {
                state.doctor_id = chosenDoctorId;
                state.specialty_id = doc.specialty_id;
                state.bookingDraft = {
                    doctor: doc.name,
                    specialty: doc.specialty,
                    doctor_id: chosenDoctorId
                };
                state.multiDoctorContext.activeDoctor = chosenDoctorId;
                state.multiDoctorContext.remainingDoctors = state.multiDoctorContext.remainingDoctors.filter(id => id !== chosenDoctorId);
                state.multiDoctorContext.step = 'BOOKING_ACTIVE_DOCTOR';

                reasoningSteps.push(`المسار المتعدد: تم اختيار الطبيب الأول (${doc.name}) بنجاح`);

                const effectiveDate = resolveDateFromText(normalizedText, currentDate);
                const extractedTime = extractTimeSlot(normalizedText, state);

                if (!effectiveDate && !extractedTime) {
                    const pronoun = (chosenDoctorId === 'dr_sara' || chosenDoctorId === 'dr_mariam') ? 'مواعيدها' : 'مواعيده';
                    const icon = chosenDoctorId === 'dr_ahmed' ? '🦷' : chosenDoctorId === 'dr_sara' ? '🌸' : chosenDoctorId === 'dr_hossam' ? '🩺' : '👁️';
                    return {
                        reply: `تمام جداً! هنبدأ بحجز ${doc.name} (${doc.departmentTitle || doc.department}) ${icon}\n${pronoun} في العيادة أيام (${doc.workingDaysAr}) من ${doc.hoursAr}.\n\nتحب${gp.isFemale ? 'ي' : ''} نحجز لحضرتك يوم إيه والساعة كام؟`,
                        reasoningSteps,
                        state
                    };
                }
            }
        }
    }

    if (state.multiDoctorContext && (state.multiDoctorContext.step === 'AWAITING_SECOND_DOCTOR_SLOT' || state.multiDoctorContext.step === 'AWAITING_NEXT_DOCTOR_DECISION')) {
        const cleanLower = normalizedText.toLowerCase();

        const isWantsDifferentDoctor = cleanLower.includes('دكتور تاني') || cleanLower.includes('دكتور ثاني') ||
                                       cleanLower.includes('حد تاني') || cleanLower.includes('تخصص تاني') ||
                                       cleanLower.includes('تخصص ثاني') || cleanLower.includes('طبيب تاني') ||
                                       cleanLower.includes('غير الدكتور') || cleanLower.includes('دكتور مختلف') ||
                                       cleanLower.includes('مش عايز دكتور') || cleanLower.includes('مش عاوز دكتور') ||
                                       cleanLower.includes('كنت عايز دكتور') || cleanLower.includes('كنت عاوز دكتور') ||
                                       cleanLower.includes('تغيير الدكتور') || cleanLower.includes('اغير الدكتور') ||
                                       cleanLower.includes('أغير الدكتور');

        if (isWantsDifferentDoctor) {
            reasoningSteps.push('المسار المتعدد: المريض يرغب في اختيار طبيب أو تخصص آخر بدلاً من المقترح.');
            delete state.multiDoctorContext;
            delete state.bookingDraft;
            state.doctor_id = null;
            state.specialty_id = null;
            const patientGreeting = honorific ? ` يا ${honorific}` : ' يا فندم';
            const verb = gp.isFemale ? 'تحبي تكشفي' : 'تحب تكشف';
            return {
                reply: `تمام جداً${patientGreeting}! ولا يهمك خالص، ${verb} مع مين من استشاريينا أو في أي تخصص؟\n\n• د. سارة محمود (الجلدية والتجميل والليزر)\n• د. مريم نبيل (طب وجراحة العيون)\n• د. أحمد شريف (طب وجراحة الأسنان)\n• د. حسام فتحي (أمراض الباطنة والقلب)`,
                reasoningSteps,
                state
            };
        }

        const isSkipOrDecline = cleanLower.includes('لا خلاص') || cleanLower.includes('مش دلوقتي') ||
                                cleanLower.includes('مش دلوقت') || cleanLower.includes('كفاية') ||
                                cleanLower.includes('كفايه') || cleanLower.includes('لا شكرا') ||
                                cleanLower.includes('لا شكراً') || cleanLower.includes('مش عايز') ||
                                cleanLower.includes('مش عاوز') || cleanLower.includes('بعدين') ||
                                cleanLower.includes('الاول بس') || cleanLower.includes('الأول بس') ||
                                (cleanLower.startsWith('لا') && !cleanLower.includes('يوم') && !cleanLower.includes('الساعة') && !cleanLower.includes('دكتور') && !cleanLower.includes('طبيب') && !cleanLower.includes('تاني') && !cleanLower.includes('ثاني'));

        if (isSkipOrDecline) {
            reasoningSteps.push('المسار المتعدد: العميل فضّل الاكتفاء بالحجز الأول وتأجيل حجز الطبيب الآخر.');
            if (state.multiDoctorContext.drafts && state.multiDoctorContext.drafts.length > 0) {
                const firstDraft = state.multiDoctorContext.drafts[0];
                delete state.multiDoctorContext;
                state.pendingBooking = {
                    doctor: firstDraft.doctor,
                    specialty: firstDraft.specialty,
                    date: firstDraft.date,
                    time: firstDraft.time
                };
                state.bookingDraft = {
                    doctor: firstDraft.doctor,
                    specialty: firstDraft.specialty,
                    date: firstDraft.date,
                    time: firstDraft.time
                };
                return processChatMessage({ message: 'أكد الحجز', sessionId, sessionData: state, currentDate });
            }
            delete state.multiDoctorContext;
            const patientGreeting = honorific ? ` يا ${honorific}` : ' يا فندم';
            return {
                reply: `العفو${patientGreeting}! تم حفظ رغبتك، وفي انتظار تشريفك في العيادة. لو حبيت تحجز مع باقي الاستشاريين في أي وقت تاني إحنا في خدمتك دائماً 🌸`,
                reasoningSteps,
                state
            };
        }

        // Check if user confirmed the suggested slot
        const confirmWords = ['تمام', 'اه', 'أه', 'ايوة', 'ايوه', 'ماشي', 'ماشى', 'اوك', 'اوكي', 'احجز', 'احجزلي', 'احجزها', 'موافق', 'أكد', 'اكد', 'يناسبني', 'مناسب', 'اعتمد'];
        const cleanSuggestDigits = state.multiDoctorContext.suggestedSlot ? state.multiDoctorContext.suggestedSlot.replace(/[^0-9:]/g, '') : null;
        const isConfirmingSuggested = Boolean(
            state.multiDoctorContext.suggestedSlot &&
            (confirmWords.some(w => cleanLower.includes(w)) || 
             (cleanSuggestDigits && cleanLower.includes(cleanSuggestDigits)) ||
             phoneAnalysis.isValid)
        );

        let chosenSecondTime = null;
        let chosenSecondDate = state.multiDoctorContext.suggestedDateLabel;
        let chosenSecondDateStr = state.multiDoctorContext.suggestedDateStr;

        if (isConfirmingSuggested) {
            chosenSecondTime = state.multiDoctorContext.suggestedSlot;
        } else {
            const extractedTime = extractTimeSlot(normalizedText, state);
            const effectiveDate = resolveDateFromText(normalizedText, currentDate);
            if (extractedTime) {
                chosenSecondTime = extractedTime;
            }
            if (effectiveDate) {
                chosenSecondDate = effectiveDate.label;
                chosenSecondDateStr = effectiveDate.dateStr;
            }

            if (effectiveDate && !chosenSecondTime) {
                const secondDocId = state.multiDoctorContext.activeDoctor || (state.multiDoctorContext.remainingDoctors && state.multiDoctorContext.remainingDoctors[0]);
                const secondDoc = appointmentService.DOCTORS_SCHEDULE[secondDocId];
                if (secondDoc) {
                    const availCheck = await appointmentService.checkAvailability({
                        doctor: secondDoc.name,
                        date: effectiveDate.label,
                        time: null,
                        currentDate
                    });
                    if (availCheck.isDayOff) {
                        return {
                            reply: `${secondDoc.name} مش موجود${secondDocId === 'dr_sara' || secondDocId === 'dr_mariam' ? 'ة' : ''} يوم ${effectiveDate.label}. مواعيد عمل${secondDocId === 'dr_sara' || secondDocId === 'dr_mariam' ? 'ها' : 'ه'} في العيادة هي (${secondDoc.workingDaysAr}). تحب نختار يوم تاني؟`,
                            reasoningSteps,
                            state
                        };
                    }
                    state.multiDoctorContext.suggestedDateLabel = effectiveDate.label;
                    state.multiDoctorContext.suggestedDateStr = effectiveDate.dateStr;
                    const openSlots = availCheck.availableSlots || [];
                    return {
                        reply: `المواعيد المتاحة لـ ${secondDoc.name} يوم ${effectiveDate.label} هي:\n${openSlots.map(s => '• ' + s).join('\n')}\n\nتحب نختار أي ميعاد فيهم؟`,
                        suggestedSlots: openSlots,
                        reasoningSteps,
                        state
                    };
                }
            }
        }

        if (chosenSecondTime && chosenSecondDate) {
            const secondDocId = state.multiDoctorContext.activeDoctor || (state.multiDoctorContext.remainingDoctors && state.multiDoctorContext.remainingDoctors[0]);
            const secondDoc = appointmentService.DOCTORS_SCHEDULE[secondDocId];
            const secondPrice = DOCTOR_PRICES[secondDocId] || 400;

            state.multiDoctorContext.drafts = state.multiDoctorContext.drafts || [];
            state.multiDoctorContext.drafts.push({
                doctorId: secondDocId,
                doctor: secondDoc.name,
                specialty: secondDoc.specialty,
                departmentTitle: secondDoc.departmentTitle || secondDoc.department,
                date: chosenSecondDate,
                dateStr: chosenSecondDateStr,
                time: chosenSecondTime,
                price: secondPrice
            });

            delete state.multiDoctorContext.suggestedSlot;
            delete state.multiDoctorContext.suggestedDateLabel;
            delete state.multiDoctorContext.suggestedDateStr;

            return presentUnifiedPendingSummary({ state, gp, honorific, reasoningSteps, currentDate });
        }

        const mentionedDocs = extractAllMentionedDoctors(normalizedText, state);
        let nextDocId = null;
        if (mentionedDocs.length > 0) {
            nextDocId = mentionedDocs[0];
        } else if (state.multiDoctorContext.remainingDoctors && state.multiDoctorContext.remainingDoctors.length > 0) {
            nextDocId = state.multiDoctorContext.remainingDoctors[0];
        }

        if (nextDocId) {
            const doc = appointmentService.DOCTORS_SCHEDULE[nextDocId];
            if (doc) {
                state.doctor_id = nextDocId;
                state.specialty_id = doc.specialty_id;
                state.bookingDraft = {
                    doctor: doc.name,
                    specialty: doc.specialty,
                    doctor_id: nextDocId
                };
                state.multiDoctorContext.activeDoctor = nextDocId;
                state.multiDoctorContext.remainingDoctors = state.multiDoctorContext.remainingDoctors.filter(id => id !== nextDocId);
                state.multiDoctorContext.step = 'BOOKING_ACTIVE_DOCTOR';

                reasoningSteps.push(`المسار المتعدد: الانتقال لحجز الطبيب التالي (${doc.name})`);

                const effectiveDate = resolveDateFromText(normalizedText, currentDate);
                const extractedTime = extractTimeSlot(normalizedText, state);

                if (!effectiveDate && !extractedTime) {
                    const pronoun = (nextDocId === 'dr_sara' || nextDocId === 'dr_mariam') ? 'مواعيدها' : 'مواعيده';
                    const icon = nextDocId === 'dr_ahmed' ? '🦷' : nextDocId === 'dr_sara' ? '🌸' : nextDocId === 'dr_hossam' ? '🩺' : '👁️';
                    return {
                        reply: `تمام جداً! ${doc.name} (${doc.departmentTitle || doc.department}) ${icon}\n${pronoun} في العيادة أيام (${doc.workingDaysAr}) من ${doc.hoursAr}.\n\nتحب${gp.isFemale ? 'ي' : ''} نحجز لحضرتك يوم إيه والساعة كام؟`,
                        reasoningSteps,
                        state
                    };
                }
            }
        }
    }

    // -------------------------------------------------------------
    // MODULE 1.7.2: POST-BOOKING ADDITIONAL DOCTOR / SESSION WRAP-UP
    // -------------------------------------------------------------
    if (state.postBookingFlow && state.postBookingFlow.step === 'AWAITING_ADDITIONAL_DECISION') {
        const cleanLower = normalizedText.toLowerCase();
        const isDeclineOrConclude = cleanLower.includes('لا خلاص') || cleanLower.includes('مش دلوقتي') ||
                                    cleanLower.includes('مش دلوقت') || cleanLower.includes('كفاية') ||
                                    cleanLower.includes('كفايه') || cleanLower.includes('لا شكرا') ||
                                    cleanLower.includes('لا شكراً') || cleanLower.includes('مش عايز') ||
                                    cleanLower.includes('مش عاوز') || cleanLower.includes('بعدين') ||
                                    cleanLower.includes('نكتفي') || cleanLower.includes('كده تمام') ||
                                    cleanLower.includes('تمام كده') || cleanLower.includes('شكرا') ||
                                    cleanLower.includes('شكراً') || cleanLower === 'لا' ||
                                    (cleanLower.startsWith('لا') && !cleanLower.includes('دكتور') && !cleanLower.includes('كشف'));

        if (isDeclineOrConclude) {
            reasoningSteps.push('إنهاء جلسة الحجز بطلب المريض وتأكيد سلامته');
            const patientGreeting = honorific ? ` يا ${honorific}` : ' يا فندم';
            const closeReply = state.postBookingFlow?.isWaitlist
                ? `العفو${patientGreeting}! كده طلبك مسجل بنجاح في قائمة الانتظار، وأول ما يتوفر ميعاد هنتواصل مع حضرتك فوراً على الواتساب. نورتنا في العيادة ولو احتجت أي استفسار إحنا في خدمتك دائماً 🌸`
                : `العفو${patientGreeting}! كده حجز حضرتك مؤكد بالكامل ونورتنا في العيادة. لو احتجت أي حجز أو استفسار في أي وقت تاني إحنا في خدمتك دائماً 🌸`;
            delete state.postBookingFlow;
            return {
                reply: closeReply,
                reasoningSteps,
                state
            };
        }

        // Check if user specified a doctor or specialty
        const nextDoc = extractDoctorAndSpecialty(normalizedText, state);
        if (nextDoc) {
            delete state.postBookingFlow;
            delete state.bookingDraft;
            delete state.pendingBooking;
            delete state.suggestedAlternativeTime;
            state.doctor_id = nextDoc.doctor_id;
            state.specialty_id = nextDoc.specialty_id;
            state.bookingDraft = {
                doctor_id: nextDoc.doctor_id,
                specialty_id: nextDoc.specialty_id,
                doctor: nextDoc.doctor,
                specialty: nextDoc.specialty,
                department: nextDoc.department,
                departmentTitle: nextDoc.departmentTitle
            };
            reasoningSteps.push(`إضافة كشف إضافي: المريض اختار ${nextDoc.doctor} (${nextDoc.specialty})`);
            const docSchedule = appointmentService.DOCTORS_SCHEDULE[nextDoc.doctor_id];
            const pronoun = (nextDoc.doctor_id === 'dr_sara' || nextDoc.doctor_id === 'dr_mariam') ? 'مواعيدها' : 'مواعيده';
            const icon = nextDoc.doctor_id === 'dr_ahmed' ? '🦷' : nextDoc.doctor_id === 'dr_sara' ? '🌸' : nextDoc.doctor_id === 'dr_hossam' ? '🩺' : '👁️';
            const reply = `تنورنا يا فندم! هنبدأ حجز الكشف الثاني مع ${nextDoc.doctor} (${nextDoc.departmentTitle || nextDoc.department}) ${icon}\n${pronoun} في العيادة أيام (${docSchedule.workingDaysAr}) من ${docSchedule.hoursAr}.\n\nتحب${gp.isFemale ? 'ي' : ''} نحجز لحضرتك يوم إيه والساعة كام؟`;
            return { reply, reasoningSteps, state };
        }

        const isAffirmativeGeneric = cleanLower.includes('اه') || cleanLower.includes('ايوة') || cleanLower.includes('ايوه') ||
                                     cleanLower.includes('عايز') || cleanLower.includes('عاوز') || cleanLower.includes('حابب') ||
                                     cleanLower.includes('كشف تاني') || cleanLower.includes('دكتور تاني') || cleanLower.includes('احجز تاني');
        if (isAffirmativeGeneric) {
            reasoningSteps.push('رغبة المريض في إضافة كشف ثانٍ دون تحديد: عرض الاستشاريين المتاحين');
            delete state.postBookingFlow;
            delete state.bookingDraft;
            delete state.doctor_id;
            delete state.specialty_id;
            const reply = `يشرفنا جداً يا ${honorific || 'فندم'}! تحب${gp.isFemale ? 'ي' : ''} تكشف${gp.isFemale ? 'ي' : ''} في أي تخصص أو مع أي دكتور من استشاريينا؟\n\n• د. سارة محمود (الجلدية والتجميل والليزر)\n• د. حسام فتحي (أمراض الباطنة والقلب)\n• د. مريم نبيل (طب وجراحة العيون)\n• د. أحمد شريف (طب وجراحة الأسنان)`;
            return { reply, reasoningSteps, state };
        }
        delete state.postBookingFlow;
    }

    // -------------------------------------------------------------
    // MODULE 1.7: MULTI-DOCTOR INQUIRY INTERCEPTOR
    // Handles requests comparing or asking for multiple doctors' schedules
    // (e.g. "مواعيد د احمد و د سارة ايه ؟" or "1 و 3")
    // -------------------------------------------------------------
    const multiDoctors = extractAllMentionedDoctors(normalizedText, state);
    const lowerTextForSwitch = normalizedText.toLowerCase();
    const isExplicitDoctorSwitch = lowerTextForSwitch.includes('غيرت رأيي') || lowerTextForSwitch.includes('غيرت رايي') ||
                                  lowerTextForSwitch.includes('هحول') || lowerTextForSwitch.includes('احول') ||
                                  lowerTextForSwitch.includes('مش عايز') || lowerTextForSwitch.includes('مش عاوز') ||
                                  lowerTextForSwitch.includes('بدل');
    const isDeclineOrCancel = lowerTextForSwitch.includes('بلاش') || lowerTextForSwitch.includes('الغي') || lowerTextForSwitch.includes('كفاية') || lowerTextForSwitch.includes('كفايه');
    const isAlreadyInActiveMultiFlow = Boolean(state.multiDoctorContext && state.multiDoctorContext.step);

    if (multiDoctors.length > 1 && !isExplicitDoctorSwitch && !isNameCorrection && !phoneAnalysis.hasAttempt && !isDeclineOrCancel && !isAlreadyInActiveMultiFlow) {
        reasoningSteps.push(`استفسار متعدد عن الأطباء: رصد ${multiDoctors.length} أطباء (${multiDoctors.join(', ')}). تقديم مواعيد كل طبيب وتجهيز مسار الحجز المتعدد.`);
        
        state.multiDoctorContext = {
            selectedDoctors: multiDoctors,
            remainingDoctors: [...multiDoctors],
            activeDoctor: null,
            step: 'AWAITING_FIRST_DOCTOR_CHOICE',
            bookedAppointments: []
        };
        delete state.doctor_id;
        delete state.specialty_id;
        delete state.bookingDraft;
        delete state.pendingBooking;

        return {
            reply: formatMultiDoctorSchedules(multiDoctors, gp),
            reasoningSteps,
            state
        };
    }

    // 3. INPUT VALIDATION AWARENESS: Invalid phone formats
    // -------------------------------------------------------------
    const isExpectingPhone = Boolean(state.pendingBooking || state.awaitingWaitlist || state.awaitingPhone);

    if (phoneAnalysis.hasAttempt && !phoneAnalysis.isValid) {
        reasoningSteps.push(`تنبيه التحقق: الرقم المدخل (${phoneAnalysis.raw}) غير مطابق لصيغة الهواتف المصرية (11 رقماً تبدأ بـ 01)`);
        state.awaitingPhone = true;
        if (state.awaitingWaitlist) {
            state.sessionState = 'WAITLIST_AWAITING_PHONE';
            state.status = 'WAITLIST_AWAITING_PHONE';
            state.step = 'WAITLIST_AWAITING_PHONE';
        }

        return {
            reply: 'عذراً، رقم المحمول المكتوب غير مكتمل. يرجى كتابة رقم الموبايل المصري المكون من 11 رقم (مثال: 01012345678)',
            reasoningSteps,
            state
        };
    }

    if (isExpectingPhone && !phoneAnalysis.isValid && /^\d{2,10}$/.test(normalizedText.replace(/\s+/g, ''))) {
        reasoningSteps.push('تنبيه التحقق: إدخال رقمي غير صالح (أقل من 11 رقماً)');
        state.awaitingPhone = true;
        if (state.awaitingWaitlist) {
            state.sessionState = 'WAITLIST_AWAITING_PHONE';
            state.status = 'WAITLIST_AWAITING_PHONE';
            state.step = 'WAITLIST_AWAITING_PHONE';
        }

        return {
            reply: 'عذراً، رقم المحمول المكتوب غير مكتمل. يرجى كتابة رقم الموبايل المصري المكون من 11 رقم (مثال: 01012345678)',
            reasoningSteps,
            state
        };
    }

    // -------------------------------------------------------------
    // 4.0 UNIFIED MULTI-DOCTOR BOOKING CONFIRMATION ("الحجز على مرة واحدة")
    // -------------------------------------------------------------
    if (state.multiDoctorContext && state.multiDoctorContext.step === 'AWAITING_UNIFIED_CONFIRMATION') {
        const confirmWords = ['تمام', 'اه', 'أه', 'ايوة', 'ايوه', 'ماشي', 'ماشى', 'اوك', 'اوكي', 'احجز', 'احجزلي', 'احجزهم', 'موافق', 'أكد', 'اكد', 'خليه', 'خليها', 'يناسبني', 'مناسب', 'سجلني', 'اعتمد'];
        const cleanLower = normalizedText.toLowerCase();
        const isConfirming = confirmWords.some(w => cleanLower.includes(w));
        const isDeclining = cleanLower.includes('لا') || cleanLower.includes('مش عايز') || cleanLower.includes('غير') || cleanLower.includes('بلاش') || cleanLower.includes('الغ');

        if (isConfirming && !isDeclining) {
            delete state.awaitingBookingConfirmation;
            reasoningSteps.push('تأكيد صريح وموحد من المريض على جميع الحجوزات المعلقة. إتمام حجز المواعيد معاً');

            const drafts = state.multiDoctorContext.drafts || [];
            const bookedResults = [];

            for (const draft of drafts) {
                const bRes = await appointmentService.bookAppointment({
                    patientName: state.patientName,
                    phone: state.patientPhone,
                    doctor: draft.doctor,
                    date: draft.date,
                    time: draft.time,
                    reason: draft.specialty || 'كشف عيادة'
                });
                bookedResults.push({
                    bookingId: bRes.bookingId,
                    doctor: draft.doctor,
                    specialty: draft.specialty,
                    departmentTitle: draft.departmentTitle || draft.specialty,
                    date: draft.date,
                    time: draft.time,
                    price: draft.price
                });
            }

            const totalPrice = bookedResults.reduce((sum, b) => sum + (b.price || 0), 0);
            const d1 = bookedResults[0];
            const d2 = bookedResults[1];

            const unifiedCard = {
                type: 'unified_booking_confirmed',
                patientName: state.patientName,
                phone: state.patientPhone,
                totalPrice,
                appointments: bookedResults
            };

            const isSameDay = d1 && d2 && (d1.date === d2.date);
            let appointmentsText = '';
            if (d1 && d2) {
                if (isSameDay) {
                    appointmentsText = `• الميعاد الأول: ${d1.doctor} (${d1.departmentTitle}) الساعة ${d1.time}.\n• الميعاد الثاني: ${d2.doctor} (${d2.departmentTitle}) الساعة ${d2.time} في نفس اليوم (${d1.date}).`;
                } else {
                    appointmentsText = `• الميعاد الأول: ${d1.doctor} (${d1.departmentTitle}) يوم ${d1.date} الساعة ${d1.time}.\n• الميعاد الثاني: ${d2.doctor} (${d2.departmentTitle}) يوم ${d2.date} الساعة ${d2.time}.`;
                }
            } else if (d1) {
                appointmentsText = `• الميعاد: ${d1.doctor} (${d1.departmentTitle}) يوم ${d1.date} الساعة ${d1.time}.`;
            }

            const reply = `تم تأكيد حجزك بنجاح يا ${honorific || 'فندم'}! 🎉\n\n${appointmentsText}\n💰 إجمالي الكشفين: ${totalPrice} جنيه\n📱 هنبعت لحضرتك تفاصيل الحجزين كاملة في رسالة واحدة على الواتساب على رقم ${state.patientPhone}.\n\nألف سلامة على حضرتك و${gp.tanawwar} في العيادة! 🌸\n\nتحب${gp.isFemale ? 'ي' : ''} تستفسر${gp.isFemale ? 'ي' : ''} عن أي حاجة تانية تخص زيارتك؟`;

            state.postBookingFlow = {
                step: 'AWAITING_ADDITIONAL_DECISION',
                lastDoctor: d2 ? d2.doctor : (d1 ? d1.doctor : '')
            };

            delete state.multiDoctorContext;
            delete state.pendingBooking;
            delete state.bookingDraft;
            delete state.doctor_id;
            delete state.specialty_id;
            delete state.waitlistSlot;
            delete state.awaitingWaitlist;
            delete state.awaitingPhone;

            return {
                reply,
                reasoningSteps,
                state,
                card: unifiedCard
            };
        } else if (isDeclining) {
            delete state.awaitingBookingConfirmation;
            delete state.pendingBooking;
            if (state.bookingDraft) delete state.bookingDraft.time;

            const isDecliningSecondOnly = cleanLower.includes('التاني') || cleanLower.includes('الثاني') ||
                                          cleanLower.includes('بلاش دكتور') || cleanLower.includes('مش عايز دكتور') ||
                                          cleanLower.includes('بلاش') || cleanLower.includes('الغي دكتور') ||
                                          cleanLower.includes('الاول بس') || cleanLower.includes('الأول بس') ||
                                          cleanLower.includes('كفاية دكتور') || cleanLower.includes('كفايه دكتور');

            if (isDecliningSecondOnly && state.multiDoctorContext.drafts && state.multiDoctorContext.drafts.length > 0) {
                const firstDraft = state.multiDoctorContext.drafts[0];
                delete state.multiDoctorContext;
                state.pendingBooking = {
                    doctor: firstDraft.doctor,
                    specialty: firstDraft.specialty,
                    date: firstDraft.date,
                    time: firstDraft.time
                };
                state.awaitingBookingConfirmation = true;
                reasoningSteps.push('المريض ألغى الحجز الثاني ويريد تأكيد الحجز الأول فقط');
                return {
                    reply: `تمام يا ${honorific || 'فندم'}، لغينا حجز الكشف التاني. تحب نأكد حجز حضرتك مع ${firstDraft.doctor} يوم ${firstDraft.date} الساعة ${firstDraft.time}؟`,
                    reasoningSteps,
                    state
                };
            }

            delete state.multiDoctorContext;
            const verb = gp.isFemale ? 'تحبي' : 'تحب';
            return {
                reply: `تمام يا ${honorific || 'فندم'} ولا يهمك خالص، لغينا مسودة الحجز. ${verb} نختار مواعيد تانية تناسب حضرتك؟`,
                reasoningSteps,
                state
            };
        }
    }

    // -------------------------------------------------------------
    // 4. COMPLETE PENDING BOOKING (Scenario A)
    // -------------------------------------------------------------
    if (state.awaitingBookingConfirmation && state.pendingBooking) {
        const confirmWords = ['تمام', 'اه', 'أه', 'ايوة', 'ايوه', 'ماشي', 'ماشى', 'اوك', 'اوكي', 'احجز', 'احجزلي', 'موافق', 'أكد', 'اكد', 'خليه', 'خليها', 'خيلها', 'يناسبني', 'مناسب', 'سجلني'];
        const cleanLower = normalizedText.toLowerCase();
        const isConfirming = confirmWords.some(w => cleanLower.includes(w));
        const isDeclining = cleanLower.includes('لا') || cleanLower.includes('مش عايز') || cleanLower.includes('غير') || cleanLower.includes('ميعاد تاني') || cleanLower.includes('موعد تاني');

        if (isConfirming && !isDeclining) {
            delete state.awaitingBookingConfirmation;
            reasoningSteps.push('تأكيد صريح من المريض على تفاصيل الحجز بعد سؤاله. إتمام الحجز فوراً');
        } else if (isDeclining) {
            delete state.awaitingBookingConfirmation;
            delete state.pendingBooking;
            if (state.bookingDraft) delete state.bookingDraft.time;
            const verb = gp.isFemale ? 'تحبي' : 'تحب';
            return {
                reply: `تمام يا ${honorific || 'فندم'} ولا يهمك خالص! ${verb} نختار ميعاد تاني يناسب حضرتك؟`,
                reasoningSteps,
                state
            };
        } else {
            delete state.awaitingBookingConfirmation;
            delete state.pendingBooking;
            if (state.bookingDraft) delete state.bookingDraft.time;
        }
    }

    if (state.pendingBooking && !state.awaitingBookingConfirmation) {
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

            const card = {
                type: 'booking_confirmed',
                bookingId: bookingResult.bookingId,
                patientName: state.patientName,
                doctor: state.pendingBooking.doctor,
                date: state.pendingBooking.date,
                time: state.pendingBooking.time,
                phone: state.patientPhone
            };

            const reply = `تم تأكيد حجز حضرتك يا ${honorific} بنجاح! ميعادك ${state.pendingBooking.date} الساعة ${state.pendingBooking.time} مع ${state.pendingBooking.doctor}. هنبعت لحضرتك رسالة تأكيد على الواتساب على رقم ${state.patientPhone}. ألف سلامة على حضرتك و${gp.tanawwar} في العيادة! 🌸\n\nتحب${gp.isFemale ? 'ي' : ''} نحجز لحضرتك كشف تاني مع أي دكتور أو تخصص تاني، ولا نكتفي بالحجز ده؟`;

            state.postBookingFlow = {
                step: 'AWAITING_ADDITIONAL_DECISION',
                lastDoctor: state.pendingBooking.doctor
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
            const docName = state.waitlistSlot?.doctor || state.bookingDraft?.doctor;
            if (!docName) {
                return {
                    reply: UNIVERSAL_GENERIC_BOOKING_REPLY,
                    reasoningSteps: ['حظر استدعاء أداة قائمة الانتظار لعدم تحديد الطبيب'],
                    state
                };
            }
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

                let reply;
                if (state.multiDoctorContext && state.multiDoctorContext.remainingDoctors && state.multiDoctorContext.remainingDoctors.length > 0) {
                    const nextDocId = state.multiDoctorContext.remainingDoctors[0];
                    const nextDoc = appointmentService.DOCTORS_SCHEDULE[nextDocId];
                    const nextDeptTitle = nextDoc ? (nextDoc.departmentTitle || nextDoc.department || nextDoc.specialty) : '';
                    state.multiDoctorContext.step = 'AWAITING_NEXT_DOCTOR_DECISION';

                    reply = `تمام يا ${userTitle}، تم تسجيل طلبك بالرقم (${phoneToUse}) في قائمة الانتظار لـ ${docName}. أول ما يفضى ميعاد هنتواصل مع حضرتك فوراً على الواتساب. 🌸\n\nوبالنسبة لـ ${nextDoc.name} (${nextDeptTitle})، تحب نحدد ميعاد كشفه دلوقتي؟`;
                } else {
                    reply = `تمام يا ${userTitle}، تم تسجيل طلبك بالرقم (${phoneToUse}) في قائمة الانتظار لـ ${docName}. أول ما يفضى ميعاد هنتواصل مع حضرتك فوراً على الواتساب. 🌸\n\nتحب${gp.isFemale ? 'ي' : ''} نحجز لحضرتك كشف تاني مع أي دكتور أو تخصص تاني في العيادة، ولا نكتفي بالتسجيل ده؟`;

                    state.postBookingFlow = {
                        step: 'AWAITING_ADDITIONAL_DECISION',
                        lastDoctor: docName,
                        isWaitlist: true
                    };
                }

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

                state.sessionState = 'WAITLIST_CONFIRMATION';
                state.status = 'WAITLIST_CONFIRMATION';
                state.step = 'WAITLIST_CONFIRMATION';

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
            state.sessionState = 'WAITLIST_AWAITING_PHONE';
            state.status = 'WAITLIST_AWAITING_PHONE';
            state.step = 'WAITLIST_AWAITING_PHONE';
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

    const extractedDoc = extractDoctorAndSpecialty(normalizedText, state);

    // Multi-Branch Handling & Switching (Module 6)
    const isAlexBranch = lowerText.includes('إسكندرية') || lowerText.includes('اسكندرية') || lowerText.includes('إسكندريه') || lowerText.includes('اسكندريه');
    const isDamanhourBranch = lowerText.includes('دمنهور');

    if (isAlexBranch) {
        state.branch_id = 'alex';
        state.branch_name = 'الإسكندرية';
    }
    if (isDamanhourBranch) {
        state.branch_id = 'damanhour';
        state.branch_name = 'دمنهور';
    }

    if (!extractedDoc?.doctor && isAlexBranch && (isAvailabilityInquiry(lowerText) || lowerText.includes('مواعيد') || lowerText.includes('فرع'))) {
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


    const slotSelection = resolveSlotFromSelection(normalizedText, state);
    if (slotSelection && slotSelection.isOutOfRange) {
        reasoningSteps.push(`المريض اختار رقم ميعاد غير متاح (${slotSelection.requestedNumber}). عدد المواعيد المتاحة: ${slotSelection.totalAvailable}`);
        return {
            reply: `عفواً يا فندم، المتاح لحضرتك ${slotSelection.totalAvailable} مواعيد فقط:\n${slotSelection.availableSlots.map(s => '• ' + s).join('\n')}\n\nتحب${gp.isFemale ? 'ي' : ''} تختار${gp.isFemale ? 'ي' : ''} أي ميعاد فيهم؟`,
            reasoningSteps,
            state
        };
    }
    const selectedSlotTime = (typeof slotSelection === 'string') ? slotSelection : null;
    const extractedTime = selectedSlotTime || extractTimeSlot(normalizedText, state);
    if (selectedSlotTime) {
        reasoningSteps.push(`التعرف على اختيار الموعد برقم الترتيب: تم اختيار الموعد (${selectedSlotTime}) من القائمة المعروضة`);
        delete state.presentedSlots;
    }
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
                doctor: state.bookingDraft.doctor,
                specialty: state.bookingDraft.specialty,
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

    // -------------------------------------------------------------
    // DOCTOR / SPECIALTY SWITCHING STATE UPDATE ENGINE
    // Rule 1: Reset both doctor_id AND specialty_id simultaneously in session memory.
    // Rule 2: Ensure response templates dynamically fetch the correct department title.
    // -------------------------------------------------------------
    const currentDoctorId = state.doctor_id || 
                           (state.bookingDraft && state.bookingDraft.doctor_id) || 
                           (state.bookingDraft && state.bookingDraft.doctor ? appointmentService.findDoctorSchedule(state.bookingDraft.doctor)?.id : null);
    const currentSpecialtyId = state.specialty_id || (state.bookingDraft && state.bookingDraft.specialty_id);

    const isExplicitChangeOfMind = lowerText.includes('غيرت رأيي') || lowerText.includes('غيرت رايي') ||
                                   lowerText.includes('تغيير الدكتور') || lowerText.includes('تغيير التخصص') ||
                                   lowerText.includes('عايز اغير') || lowerText.includes('عايز أغير') ||
                                   lowerText.includes('عاوز اغير') || lowerText.includes('عاوز أغير') ||
                                   lowerText.includes('مش عايز دكتور') || lowerText.includes('مش عاوز دكتور') ||
                                   lowerText.includes('بلاش دكتور') || lowerText.includes('دكتور تاني') ||
                                   lowerText.includes('دكتور ثاني') || lowerText.includes('تخصص تاني') ||
                                   lowerText.includes('تخصص ثاني') || lowerText.includes('ابدل') || lowerText.includes('أبدل') ||
                                   lowerText.includes('هحول') || lowerText.includes('احول') || lowerText.includes('حول');

    const isDoctorOrSpecialtySwitch = Boolean(
        (extractedDoc && currentDoctorId && extractedDoc.doctor_id !== currentDoctorId) ||
        (extractedDoc && currentSpecialtyId && extractedDoc.specialty_id !== currentSpecialtyId) ||
        (isExplicitChangeOfMind && (currentDoctorId || currentSpecialtyId || state.bookingDraft?.doctor))
    );

    if (isDoctorOrSpecialtySwitch) {
        reasoningSteps.push('تحديث حالة تغيير الطبيب/التخصص (Doctor/Specialty Switch): تصفير doctor_id و specialty_id بالتزامن في ذاكرة الجلسة وإلغاء البيانات العالقة للطبيب السابق.');
        // Requirement 1: Reset both doctor_id AND specialty_id simultaneously in session memory
        state.doctor_id = null;
        state.specialty_id = null;

        // Clear previous doctor-specific booking draft memory
        if (state.bookingDraft) {
            delete state.bookingDraft.doctor_id;
            delete state.bookingDraft.specialty_id;
            delete state.bookingDraft.doctor;
            delete state.bookingDraft.specialty;
            delete state.bookingDraft.department;
            delete state.bookingDraft.departmentTitle;
            delete state.bookingDraft.category;
            delete state.bookingDraft.serviceName;
            delete state.bookingDraft.isServiceCatalogMatch;
            delete state.bookingDraft.assignedDoctorId;
            delete state.bookingDraft.date;
            delete state.bookingDraft.dateStr;
            delete state.bookingDraft.time;
        }
        delete state.pendingBooking;
        delete state.suggestedAlternativeTime;
        delete state.waitlistSlot;
        delete state.awaitingWaitlist;
        delete state.lastDiscussedDate;

        if (isExplicitChangeOfMind && !extractedDoc) {
            return {
                reply: `تمام يا فندم ولا يهمك خالص! تحب${gp.isFemale ? 'ي' : ''} تحجز${gp.isFemale ? 'ي' : ''} مع دكتور مين أو في أي تخصص؟ متاح عندنا: د. أحمد شريف (الأسنان)، د. سارة محمود (الجلدية والليزر)، د. حسام فتحي (الباطنة والقلب)، ود. مريم نبيل (العيون).`,
                reasoningSteps,
                state
            };
        }
    }

    // Update draft state if doctor or date or time mentioned
    if (!state.bookingDraft) {
        state.bookingDraft = {};
    }

    if (extractedDoc) {
        state.doctor_id = extractedDoc.doctor_id;
        state.specialty_id = extractedDoc.specialty_id;
        state.bookingDraft.doctor_id = extractedDoc.doctor_id;
        state.bookingDraft.specialty_id = extractedDoc.specialty_id;
        state.bookingDraft.doctor = extractedDoc.doctor;
        state.bookingDraft.specialty = extractedDoc.specialty;
        state.bookingDraft.department = extractedDoc.department;
        state.bookingDraft.departmentTitle = extractedDoc.departmentTitle;
        delete state.awaitingDoctorSelection;
        if (extractedDoc.isServiceCatalogMatch) {
            state.bookingDraft.isServiceCatalogMatch = true;
            state.bookingDraft.serviceName = extractedDoc.serviceName;
            state.bookingDraft.category = extractedDoc.category;
            state.bookingDraft.assignedDoctorId = extractedDoc.assignedDoctorId;
        }
    } else if (!state.bookingDraft.doctor) {
        // Default to Dr. Ahmed ONLY if teeth are mentioned
        if (lowerText.includes('أسنان') || lowerText.includes('اسنان') || lowerText.includes('ضرس') || lowerText.includes('سنان')) {
            state.doctor_id = 'dr_ahmed';
            state.specialty_id = 'dentistry';
            state.bookingDraft.doctor_id = 'dr_ahmed';
            state.bookingDraft.specialty_id = 'dentistry';
            state.bookingDraft.doctor = 'د. أحمد شريف';
            state.bookingDraft.specialty = 'طب وجراحة الأسنان';
            state.bookingDraft.department = 'طب وجراحة الأسنان';
            state.bookingDraft.departmentTitle = 'الأسنان';
        }
    }

    // -------------------------------------------------------------
    // 9. DOCTOR WORKING DAYS & TODAY'S FINISHED CHECK (Strict Rule 2 & 3)
    // -------------------------------------------------------------
    const activeDoctorCandidate = (extractedDoc && extractedDoc.doctor) || (state.bookingDraft && state.bookingDraft.doctor);
    if (effectiveDate && activeDoctorCandidate) {
        const workingDayCheck = await appointmentService.checkAvailability({
            doctor: activeDoctorCandidate,
            date: effectiveDate.label,
            time: null,
            currentDate
        });

        if (workingDayCheck.isDayOff) {
            reasoningSteps.push(`تحقق أيام العمل: الطبيب ${activeDoctorCandidate} في عطلة يوم ${effectiveDate.label}. عرض مواعيده المتاحة بدلاً من فحص المواعيد`);
            delete state.bookingDraft.date;
            delete state.bookingDraft.dateStr;
            return {
                reply: `${activeDoctorCandidate} مش موجود في اليوم ده، مواعيده المتاحة هي (أيام ${workingDayCheck.workingDaysAr})، تحب${gp.isFemale ? 'ي' : ''} أحجز ${gp.lak} فيهم؟`,
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
                             lower.includes('عايز') || lower.includes('عاوز') || lower.includes('محتاج') ||
                             lower.includes('حول') || lower.includes('هحول') || lower.includes('غيرت') ||
                             Boolean(extractedDoc?.doctor || extractedDoc?.specialty) ||
                             Boolean(isDoctorOrSpecialtySwitch) ||
                             Boolean(effectiveDate) || Boolean(extractedTime) || Boolean(isAvailabilityAsk) || 
                             Boolean(state.bookingDraft?.date) ||
                             Boolean(state.bookingDraft?.doctor) ||
                             Boolean(isDoctorSelectionAwaited(state) && extractDoctorFromNumberOrOrdinal(rawText, state));

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

            state.awaitingDoctorSelection = true;
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

        // Unclear input, gibberish, or bare single digits/punctuation without booking context
        if (isGibberish(rawText) || /^[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?؟~`]{1,2}$/.test(rawText.trim())) {
            return {
                reply: 'عفواً، ما فهمتش قصد حضرتك، ممكن توضح أكتر إزاي أقدر أساعدك؟',
                reasoningSteps: ['طلب التوضيح بسبب نص غير مفهوم أو رقم مجرد دون سياق حجز مسبق'],
                state
            };
        }

        // General fallback inquiry
        let fallbackReply = `تحت أمرك يا ${honorific || 'فندم'}، أقدر أساعدك في معرفة المواعيد المتاحة أو حجز موعد كشف مع أي من أطباء العيادة.`;
        if (!state.patientName) {
            fallbackReply = `تحت أمرك يا فندم، يشرفني أعرف اسم حضرتك الكريم الأول عشان أقدر أساعدك بشكل أفضل؟`;
            state.awaitingName = true;
        }

        return {
            reply: fallbackReply,
            reasoningSteps: ['معالجة الاستفسار العام غير المرتبط بحجز مباشر'],
            state
        };
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
        const docName = (extractedDoc && extractedDoc.doctor) || (state.bookingDraft && state.bookingDraft.doctor);
        if (docName) {
            const docSchedule = appointmentService.findDoctorSchedule(docName);
            if (docSchedule) {
                const slotsSummary = appointmentService.getDoctorAvailableSlotsSummary(docSchedule.id);
                const deptTitle = docSchedule.departmentTitle || docSchedule.department || 'العيادة';

                let specialtyHeader = deptTitle;
                if (extractedDoc && extractedDoc.assignedDoctorId === docSchedule.id && extractedDoc.serviceName) {
                    specialtyHeader = (extractedDoc.serviceName === 'كشف باطنة وقلب' || extractedDoc.serviceName === 'كشف عيون وفحص نظر' || extractedDoc.serviceName === 'كشف أسنان' || extractedDoc.serviceName === 'كشف جلدية')
                        ? deptTitle
                        : `${extractedDoc.category} - ${extractedDoc.serviceName}`;
                } else if (state.bookingDraft && state.bookingDraft.assignedDoctorId === docSchedule.id && state.bookingDraft.serviceName) {
                    specialtyHeader = (state.bookingDraft.serviceName === 'كشف باطنة وقلب' || state.bookingDraft.serviceName === 'كشف عيون وفحص نظر' || state.bookingDraft.serviceName === 'كشف أسنان' || state.bookingDraft.serviceName === 'كشف جلدية')
                        ? deptTitle
                        : `${state.bookingDraft.category} - ${state.bookingDraft.serviceName}`;
                }

                const reply = `مواعيد ${docName} (${specialtyHeader}) المتاحة هي: ${slotsSummary}. تحب${gp.isFemale ? 'ي' : ''} أحجزلك ميعاد فيهم؟`;
                return {
                    reply,
                    reasoningSteps: [
                        `استعلام دليل الخدمات أولاً (Service Catalog Lookup First) للخدمة (${specialtyHeader})`,
                        `تطبيق قفل التخصص (Category Lock): قفل ${specialtyHeader} حصراً مع ${docName}`,
                        `استرجاع مواعيد الطبيب حصراً وعرضها وفق نمط الاستجابة المطلوب (Fallback Response Pattern)`
                    ],
                    state,
                    suggestedSlots: docSchedule.slotsByDay[docSchedule.workingDayIndices[0]] || []
                };
            }
        }
    }

    // -------------------------------------------------------------
    // 11. CONVERSATION FLOW STATE MACHINE & AVAILABILITY ENGINE
    // MANDATORY RULE: STRICT SLOT FILLING & CLARIFICATION
    // Rule 1: NEVER assume or default to any doctor, specialty, or branch if user does not explicitly state it.
    // Rule 2: If user expresses generic booking intent, STOP immediately. Do NOT list slots.
    // Rule 3: Only invoke slot-fetching tools when specialty or doctor is explicitly provided.
    // -------------------------------------------------------------
    const activeDoctor = (extractedDoc && extractedDoc.doctor) || (state.bookingDraft && state.bookingDraft.doctor);

    if (!activeDoctor) {
        reasoningSteps.push('قاعدة إلزامية (Strict Slot Filling): لم يتم تحديد التخصص أو الطبيب صراحة. التوقف الفوري عن جلب المواعيد وسؤال المريض عن التخصص المطلوب.');

        if (effectiveDate) {
            state.bookingDraft = state.bookingDraft || {};
            state.bookingDraft.date = effectiveDate.label;
            state.bookingDraft.dateStr = effectiveDate.dateStr;
        }

        const isMidConversation = Boolean(
            state.userName || state.patientName || state.patientPhone ||
            (state.history && state.history.length > 0) ||
            state.postBookingFlow || state.multiDoctorContext
        );
        state.awaitingDoctorSelection = true;
        return {
            reply: getUniversalGenericBookingReply(gp, honorific, isNewNameIntroduction, isMidConversation),
            reasoningSteps,
            state
        };
    }

    const activeDateLabel = effectiveDate ? effectiveDate.label : (state.bookingDraft ? state.bookingDraft.date : null);
    const activeTime = (isAvailabilityAsk && !extractedTime) ? null : (extractedTime || (state.bookingDraft ? state.bookingDraft.time : null));

    // Scenario A: Both Target Date and Time are specified / available (even if phrased as an availability check like "مش متاح 4:30؟")
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
            state.presentedSlots = availCheck.nearestAvailable || [];
            reasoningSteps.push(`الموعد المطلوب محجوز بالكامل: تقديم المواعيد البديلة وعرض قائمة الانتظار`);

            const slotsText = availCheck.nearestAvailable && availCheck.nearestAvailable.length > 0
                ? availCheck.nearestAvailable.join(' أو ')
                : 'مواعيد بديلة';

            return {
                reply: `نعتذر لحضرتك جداً، ميعاد الساعة ${activeTime} محجوز بالفعل. متاح بدلاً منه: ${slotsText}.. تحب${gp.isFemale ? 'ي' : ''} أحجز لحضرتك فيهم ولا أسجل رقم الواتساب في قائمة الانتظار ونتواصل مع${gp.isFemale ? 'اكِ' : 'اك'} أول ما يفضى؟`,
                suggestedSlots: availCheck.nearestAvailable || [],
                reasoningSteps,
                state
            };
        }

        // 3.3 Exact slot is available! Lock choice -> Step 4
        if (availCheck.available) {
            const confirmedSlotTime = availCheck.requestedTime || activeTime;
            if (state.bookingDraft) state.bookingDraft.time = confirmedSlotTime;

            // MULTI-DOCTOR COORDINATION INTERCEPTOR ("الحجز على مرة واحدة")
            if (state.multiDoctorContext) {
                const doc1Id = state.multiDoctorContext.activeDoctor || state.doctor_id || 'dr_ahmed';
                const doc1Obj = appointmentService.DOCTORS_SCHEDULE[doc1Id] || { name: activeDoctor, specialty: state.bookingDraft?.specialty };
                const doc1Price = DOCTOR_PRICES[doc1Id] || 350;
                const doc1TargetDateStr = effectiveDate ? effectiveDate.dateStr : (state.bookingDraft && state.bookingDraft.dateStr);

                state.multiDoctorContext.drafts = state.multiDoctorContext.drafts || [];
                const draftData = {
                    doctorId: doc1Id,
                    doctor: doc1Obj.name || activeDoctor,
                    specialty: doc1Obj.specialty || (state.bookingDraft && state.bookingDraft.specialty) || 'كشف عيادة',
                    departmentTitle: doc1Obj.departmentTitle || doc1Obj.department || doc1Obj.specialty,
                    date: activeDateLabel,
                    dateStr: doc1TargetDateStr,
                    time: confirmedSlotTime,
                    price: doc1Price
                };

                const existingDraftIdx = state.multiDoctorContext.drafts.findIndex(d => d.doctorId === doc1Id);
                if (existingDraftIdx >= 0) {
                    state.multiDoctorContext.drafts[existingDraftIdx] = draftData;
                } else {
                    state.multiDoctorContext.drafts.push(draftData);
                }

                if (state.multiDoctorContext.remainingDoctors && state.multiDoctorContext.remainingDoctors.length > 0) {
                    const nextDocId = state.multiDoctorContext.remainingDoctors[0];
                    const nextDoc = appointmentService.DOCTORS_SCHEDULE[nextDocId];

                    const consecutiveRes = await findBestConsecutiveSlot({
                        firstDoctorTime: confirmedSlotTime,
                        firstDoctorDateStr: doc1TargetDateStr,
                        firstDoctorDateLabel: activeDateLabel,
                        secondDoctorId: nextDocId,
                        currentDate
                    });

                    state.multiDoctorContext.step = 'AWAITING_SECOND_DOCTOR_SLOT';
                    state.multiDoctorContext.activeDoctor = nextDocId;
                    state.multiDoctorContext.remainingDoctors = state.multiDoctorContext.remainingDoctors.filter(id => id !== nextDocId);

                    delete state.bookingDraft;
                    delete state.pendingBooking;
                    delete state.suggestedAlternativeTime;

                    const patientGreeting = honorific ? ` يا ${honorific}` : ' يا فندم';
                    const doc1Icon = doc1Id === 'dr_ahmed' ? ' 🦷' : doc1Id === 'dr_sara' ? ' 🌸' : doc1Id === 'dr_hossam' ? ' 🩺' : ' 👁️';

                    if (consecutiveRes.sameDayAvailable && consecutiveRes.recommendedSlot) {
                        state.multiDoctorContext.suggestedSlot = consecutiveRes.recommendedSlot;
                        state.multiDoctorContext.suggestedDateLabel = activeDateLabel;
                        state.multiDoctorContext.suggestedDateStr = doc1TargetDateStr;

                        reasoningSteps.push(`المسار المتعدد: رصد إمكانية التنسيق المتتالي في نفس اليوم للطبيب الثاني (${nextDoc.name}) عند الساعة ${consecutiveRes.recommendedSlot}`);

                        const reply = `تمام جداً${patientGreeting}! تم اختيار ميعاد ${doc1Obj.name} يوم ${activeDateLabel} الساعة ${confirmedSlotTime}.${doc1Icon}\n\nوعشان تخلص كشوفاتك كلها في نفس اليوم وما تضطرش تنزل مرتين، أقترح على حضرتك ميعاد مناسب جداً بعدها على طول مع ${nextDoc.name} (${nextDoc.departmentTitle || nextDoc.specialty}) الساعة ${consecutiveRes.recommendedSlot} في نفس اليوم.\n\nتحب نعتمد الميعاد ده للكشف التاني؟`;

                        return {
                            reply,
                            suggestedSlots: [consecutiveRes.recommendedSlot, ...(consecutiveRes.otherSlots || [])],
                            reasoningSteps,
                            state
                        };
                    } else if (consecutiveRes.sameDayAvailable && consecutiveRes.allDaySlots && consecutiveRes.allDaySlots.length > 0) {
                        reasoningSteps.push(`المسار المتعدد: الطبيب الثاني يعمل في نفس اليوم لكن لا توجد مواعيد تالية مباشرة`);
                        const slotsText = consecutiveRes.allDaySlots.join(' أو ');
                        const reply = `تمام جداً${patientGreeting}! تم اختيار ميعاد ${doc1Obj.name} يوم ${activeDateLabel} الساعة ${confirmedSlotTime}.${doc1Icon}\n\nبالنسبة لـ ${nextDoc.name} (${nextDoc.departmentTitle || nextDoc.specialty})، متاح له في نفس اليوم المواعيد دي: ${slotsText}.\nتحب نختار ميعاد منهم؟`;
                        return {
                            reply,
                            suggestedSlots: consecutiveRes.allDaySlots,
                            reasoningSteps,
                            state
                        };
                    } else {
                        // Different working days
                        reasoningSteps.push(`المسار المتعدد: الأطباء في أيام عمل مختلفة. عرض مواعيد الطبيب الثاني (${nextDoc.name})`);
                        const verb = gp.isFemale ? 'تحبي ننسق' : 'تحب ننسق';
                        const reply = `تمام جداً${patientGreeting}! تم اختيار ميعاد ${doc1Obj.name} يوم ${activeDateLabel} الساعة ${confirmedSlotTime}.${doc1Icon}\n\nوبالنسبة لـ ${nextDoc.name} (${nextDoc.departmentTitle || nextDoc.specialty})، مواعيد عملها في العيادة أيام (${consecutiveRes.workingDaysAr || nextDoc.workingDaysAr}).\n${verb} ميعاد كشفها في أي يوم يناسب حضرتك؟`;
                        return {
                            reply,
                            reasoningSteps,
                            state
                        };
                    }
                } else {
                    delete state.bookingDraft;
                    delete state.pendingBooking;
                    return presentUnifiedPendingSummary({ state, gp, honorific, reasoningSteps, currentDate });
                }
            }

            state.pendingBooking = {
                doctor: activeDoctor,
                specialty: (state.bookingDraft && state.bookingDraft.specialty) || 'كشف عيادة',
                date: activeDateLabel,
                time: confirmedSlotTime
            };

            reasoningSteps.push(`الموعد متاح (${confirmedSlotTime}). الانتقال للخطوة 4: قفل الاختيار وطلب بيانات التأكيد`);

            // Check if patient info is complete
            if (state.patientName && state.patientPhone) {
                const userExplicitlyWantsToBookNow = /(?:احجزلي|احجز لي|أكد الحجز|اكد الحجز|ثبت الحجز|سجل الحجز)/.test(normalizedText);
                if (!userExplicitlyWantsToBookNow) {
                    state.awaitingBookingConfirmation = true;
                    return {
                        reply: `ميعاد الساعة ${confirmedSlotTime} (${activeDateLabel}) متاح مع ${activeDoctor}! تحب${gp.isFemale ? 'ي' : ''} نأكد حجز حضرتك بنفس البيانات المسجلة باسم ${honorific} ورقم الواتساب (${state.patientPhone})؟`,
                        reasoningSteps,
                        state
                    };
                }
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
    if (activeDateLabel && !activeTime) {
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
        state.presentedSlots = openSlots;
        const slotsText = openSlots.map(s => '• ' + s).join('\n');
        const nameSalutation = gp.isFemale ? `${gp.ahlanBek} ${honorific}` : `${gp.ahlanBek} يا ${honorific}`;
        const introGreeting = isNewNameIntroduction ? `${nameSalutation}، ${gp.nawwart} عيادتنا! ` : '';
        let reply;
        if (state.bookingDraft && state.bookingDraft.isServiceCatalogMatch) {
            const docSchedule = appointmentService.findDoctorSchedule(activeDoctor);
            const deptTitle = docSchedule.departmentTitle || docSchedule.department || 'العيادة';
            let specialtyHeader = deptTitle;
            if (state.bookingDraft.assignedDoctorId === docSchedule.id && state.bookingDraft.serviceName) {
                specialtyHeader = (state.bookingDraft.serviceName === 'كشف باطنة وقلب' || state.bookingDraft.serviceName === 'كشف عيون وفحص نظر' || state.bookingDraft.serviceName === 'كشف أسنان' || state.bookingDraft.serviceName === 'كشف جلدية')
                    ? deptTitle
                    : `${state.bookingDraft.category} - ${state.bookingDraft.serviceName}`;
            }
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
            const deptTitle = docSchedule.departmentTitle || docSchedule.department || 'العيادة';
            let specialtyHeader = deptTitle;
            if (state.bookingDraft.assignedDoctorId === docSchedule.id && state.bookingDraft.serviceName) {
                specialtyHeader = (state.bookingDraft.serviceName === 'كشف باطنة وقلب' || state.bookingDraft.serviceName === 'كشف عيون وفحص نظر' || state.bookingDraft.serviceName === 'كشف أسنان' || state.bookingDraft.serviceName === 'كشف جلدية')
                    ? deptTitle
                    : `${state.bookingDraft.category} - ${state.bookingDraft.serviceName}`;
            }
            return {
                reply: `مواعيد ${activeDoctor} (${specialtyHeader}) المتاحة هي: ${slotsSummary}. تحب${gp.isFemale ? 'ي' : ''} أحجزلك ميعاد فيهم؟`,
                reasoningSteps: [`عرض مواعيد الطبيب حصراً للخدمة المحددة (${specialtyHeader})`],
                state,
                suggestedSlots: docSchedule.slotsByDay[docSchedule.workingDayIndices[0]] || []
            };
        }

        const docSchedule = appointmentService.findDoctorSchedule(activeDoctor);
        const deptTitle = docSchedule ? (docSchedule.departmentTitle || docSchedule.department || docSchedule.specialty) : '';
        const daysPrompt = docSchedule ? `مواعيد ${activeDoctor} (${deptTitle}) في العيادة هي (أيام ${docSchedule.workingDaysAr}) من ${docSchedule.hoursAr}. ` : '';
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
