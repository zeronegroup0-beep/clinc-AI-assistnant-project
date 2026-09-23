/**
 * Comprehensive Arabic & Egyptian Names Dictionary & Validator
 * 
 * Accurately distinguishes authentic Arabic/Egyptian patient names from
 * conversational phrases, questions, filler words, or random gibberish.
 */

// Normalization Helper
function normalizeArabic(text) {
    if (!text) return '';
    return text
        .trim()
        .replace(/[\u064B-\u0652]/g, '') // Remove tashkeel/diacritics
        .replace(/[إأآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .toLowerCase();
}

// 1. Authentic Arabic First / Given Names (Male, Female, Muslim, Coptic, Traditional & Modern)
const ARABIC_FIRST_NAMES = [
    // Traditional & Muslim Masculine
    'محمد', 'احمد', 'محمود', 'مصطفي', 'مصطفى', 'علي', 'على', 'عمر', 'عمرو', 'خالد',
    'يوسف', 'ابراهيم', 'طارق', 'شريف', 'حسن', 'حسين', 'ياسر', 'سامح', 'ماجد', 'وائل',
    'هشام', 'تامر', 'هاني', 'عادل', 'عصام', 'ايمن', 'اشرف', 'حسام', 'سامي', 'فادي',
    'شادي', 'اسامة', 'حمزة', 'عماد', 'وليد', 'سعيد', 'رامي', 'علاء', 'بهاء', 'براء',
    'بلال', 'زياد', 'يحيي', 'يحيى', 'صلاح', 'جمال', 'كمال', 'سامر', 'مازن', 'معتز',
    'مروان', 'هيثم', 'حاتم', 'حازم', 'سيف', 'ادهم', 'كرم', 'انس', 'ياسين', 'فارس',
    'عمار', 'كريم', 'صابر', 'سليمان', 'داود', 'هارون', 'موسي', 'موسى', 'عيسي', 'عيسى',
    'يونس', 'ايوب', 'اسماعيل', 'اسحق', 'يعقوب', 'زكريا', 'ادريس', 'شعيب', 'صالح', 'هود',
    'نوح', 'ادم', 'جعفر', 'حميد', 'مجيد', 'رشيد', 'بشير', 'نذير', 'مبارك', 'امين',
    'مأمون', 'مهدي', 'هادي', 'راضي', 'مرتضي', 'مرتضى', 'ضياء', 'بسام', 'باسم', 'قاسم',
    'طلال', 'منصور', 'ناصر', 'منتصر', 'ظافر', 'غالب', 'ماهر', 'فهد', 'صقر', 'ليث',
    'اسد', 'حميدو', 'محروس', 'مبروك', 'شحاته', 'شحاتة', 'سيد', 'شعبان', 'رمضان', 'رجب',
    'شوال', 'عاشور', 'خميس', 'جمعة', 'جمعه', 'صبحي', 'مدحت', 'ممدوح', 'عاطف', 'عزت',
    'فاروق', 'فؤاد', 'وجدي', 'مكرم', 'حسني', 'حلمي', 'فهمي', 'لطفي', 'شفيق', 'توفيق',
    'رفيق', 'صديق', 'مفيد', 'سليم', 'سلمان', 'سالم', 'مسعد', 'سعد', 'سعود', 'سعيدان',
    'غنيم', 'مرزوق', 'رزق', 'جابر', 'جبر', 'جلال', 'بدر', 'هلال',
    'مجدي', 'فتحي', 'حمدي', 'فوزي', 'بدوي', 'صبري', 'يسري', 'بدري', 'شكري', 'رمزي',
    'شوقي', 'مرعي', 'بهجت', 'طلعت', 'ثروت', 'عصمت', 'حكمت', 'رأفت', 'رفعت', 'شوكت',
    'نشأت', 'صفوت', 'جودت', 'مظهر', 'رضوان', 'عثمان', 'حسان', 'سرحان', 'زيدان', 'عمران',
    'نادر', 'باهر', 'زاهر', 'طاهر', 'شاكر', 'ذاكر', 'عامر', 'ناجح', 'فالح', 'سمير',
    'قدري', 'قطب', 'قناوي', 'رفاعي', 'دسوقي', 'بيومي', 'درويش', 'بسيوني', 'بحيري',
    'صاوي', 'شرقاوي', 'طنطاوي', 'أسيوطي', 'صعيدي', 'مصري', 'منير', 'مهاب', 'معوض',

    // Coptic & Christian Egyptian Names
    'مينا', 'جورج', 'بيتر', 'كيرلس', 'ابانوب', 'ريمون', 'بولا', 'شنودة', 'شنوده', 'ماريو',
    'جون', 'مايكل', 'ادوارد', 'مرقص', 'فيكتور', 'ناجي', 'بشاي', 'ملاك', 'باسيلي', 'باسيل',
    'انطون', 'انطونيوس', 'توماس', 'اندرو', 'ساموئيل', 'ديفيد', 'ستيفن', 'فيليب', 'متي', 'متى',
    'لوقا', 'يوحنا', 'يعقوب', 'بطرس', 'بولس', 'طوبيا', 'روفائيل', 'ميخائيل', 'غبريال', 'سوريال',

    // Feminine Given Names
    'سارة', 'ساره', 'مني', 'منى', 'مريم', 'فاطمة', 'فاطمه', 'نورا', 'نوره', 'هدي', 'هدى',
    'ياسمين', 'اية', 'آية', 'مي', 'رنا', 'سلمي', 'سلمى', 'دينا', 'شروق', 'ايمان', 'إيمان',
    'ندي', 'ندى', 'هبة', 'هبه', 'ريهام', 'اسماء', 'أميرة', 'اميره', 'داليا', 'خلود',
    'يمني', 'يمنى', 'ريم', 'تسنيم', 'اسراء', 'إسراء', 'رحمة', 'رحمه', 'نهي', 'نهى',
    'لبني', 'لبنى', 'تقي', 'تقى', 'جني', 'جنى', 'رؤي', 'رؤى', 'بشري', 'بشرى', 'شيماء',
    'وفاء', 'سناء', 'حسناء', 'نجلاء', 'ولاء', 'دعاء', 'هناء', 'رجاء', 'صفاء', 'حبيبة',
    'حبيبه', 'ملك', 'فريدة', 'فريده', 'زينة', 'زينه', 'منة', 'منه', 'منة الله', 'جميلة',
    'جميله', 'كريمة', 'كريمه', 'خديجة', 'خديجه', 'عائشة', 'عائشه', 'هاجر', 'روان', 'رغد',
    'روفيدة', 'روفيده', 'مروة', 'مروه', 'نهال', 'رضوي', 'رضوى', 'نسرين', 'شيرين', 'نادين',
    'كارين', 'سهام', 'الهام', 'إلهام', 'ابتسام', 'احلام', 'أحلام', 'رانيا', 'سها', 'سمر',
    'لمياء', 'نشوي', 'نشوى', 'رشا', 'غادة', 'غاده', 'ميار', 'انجي', 'إنجي', 'ديما',
    'كارولين', 'مارينا', 'كريستين', 'كاترين', 'جوليا', 'ساندرا', 'مونيكا', 'سيلفيا', 'فيرونيكا',
    'ماري', 'كلير', 'ميرفت', 'مديحة', 'مديحه', 'نبيلة', 'نبيله', 'نادية', 'ناديا', 'سميرة',
    'سهير', 'عفاف', 'كوثر', 'انعام', 'احسان', 'امال', 'آمال', 'ماجدة', 'ماجده', 'شادية',
    'صباح', 'فايزة', 'فايزه', 'نجاة', 'نجات', 'سعاد', 'تهاني', 'اماني', 'تهانى', 'امانى',

    // Unisex Names
    'نور', 'اسلام', 'إسلام', 'رضا', 'عصمت', 'جهاد', 'تيسير', 'ميسرة', 'ميسره',
    'شمس', 'وسام', 'اكرام', 'إكرام', 'يسر', 'عزت', 'مدحت', 'حكمت', 'رأفت', 'نشأت'
];

// Normalized Set for O(1) matching
const NORMALIZED_FIRST_NAMES = new Set(ARABIC_FIRST_NAMES.map(normalizeArabic));

// 2. Compound Name Elements
// Words that can follow "عبد"
const ABD_SUFFIXES = new Set([
    'الله', 'الرحمن', 'الرحيم', 'الملك', 'القدوس', 'السلام', 'المؤمن', 'المهيمن',
    'العزيز', 'الجبار', 'المتكبر', 'الخالق', 'البارئ', 'المصور', 'الغفار', 'القهار',
    'الوهاب', 'الرزاق', 'الفتاح', 'العليم', 'القابض', 'الباسط', 'الخافض', 'الرافع',
    'المعز', 'المذل', 'السميع', 'البصير', 'الحكيم', 'العدل', 'اللطيف', 'الخبير',
    'الحليم', 'العظيم', 'الغفور', 'الشكور', 'العلي', 'الكبير', 'الحفيظ', 'المقيت',
    'الحسيب', 'الجليل', 'الكريم', 'الرقيب', 'المجيب', 'الواسع', 'الودود', 'المجيد',
    'الباعث', 'الشهيد', 'الحق', 'الوكيل', 'القوي', 'المتين', 'الولي', 'الحميد',
    'المحصي', 'المبدئ', 'المعيد', 'المحيي', 'المميت', 'الحي', 'القيوم', 'الواجد',
    'الماجد', 'الواحد', 'الاحد', 'الصمد', 'القادر', 'المقتدر', 'المقدم', 'المؤخر',
    'الاول', 'الآخر', 'الاخر', 'الظاهر', 'الباطن', 'الوالي', 'المتعالي', 'البر',
    'التواب', 'المنتقم', 'العفو', 'الرءوف', 'الرؤوف', 'المقسط', 'الجامع', 'الغني',
    'المغني', 'المانع', 'الضار', 'النافع', 'النور', 'الهادي', 'البديع', 'الباقي',
    'الوارث', 'الرشيد', 'الصبور', 'المحسن', 'المنان', 'الرازق', 'الستار', 'النبي',
    'العال', 'ربه', 'الموجود', 'الجواد', 'المعطي', 'الباسط', 'الدايم'
].map(normalizeArabic));

// Religious and compound prefixes/suffixes
const COMPOUND_PREFIXES = new Set(['عبد', 'ابو', 'ام', 'ابن', 'بن']);
const COMPOUND_SUFFIXES = new Set(['الدين', 'الاسلام', 'الهدي', 'الله', 'الرحمن']);

// 3. Common Egyptian Family Names & Surnames
const COMMON_SURNAMES = new Set([
    'الشريف', 'النجار', 'الحداد', 'المصري', 'البدري', 'المحمدي', 'الغزالي', 'الشناوي',
    'الفقي', 'الصاوي', 'القاضي', 'الجوهري', 'الجمل', 'الباز', 'شاهين', 'صقر', 'زكي',
    'رزق', 'غانم', 'سليمان', 'فرج', 'مسعود', 'خليل', 'عطية', 'عثمان', 'مرسي', 'منصور',
    'حبيب', 'كمال', 'عوض', 'عزب', 'سلامة', 'وهبة', 'غالي', 'مكرم', 'جرجس', 'داود',
    'متي', 'حنا', 'اسكندر', 'يونان', 'روفائيل', 'قليني', 'سمعان', 'ساويرس', 'بشارة',
    'فهيم', 'فؤاد', 'نسيم', 'السيد', 'اباظة', 'عاشور', 'بركات', 'درويش', 'الالفى',
    'الابيارى', 'العطار', 'الدسوقي', 'المهدي', 'الصراف', 'حسنين', 'غنيم', 'زهران',
    'عمارة', 'زيدان', 'راضي', 'ابو زيد', 'ابو النور', 'ابو العلا', 'ابو الخير'
].map(normalizeArabic));

// 4. Strict Rejection Blacklist: Verbs, Question Words, Prepositions, Clinic Words
const STRICT_NON_NAME_WORDS = new Set([
    'في', 'من', 'عن', 'مع', 'الي', 'إلى', 'حتي', 'حتى',
    'هل', 'فين', 'ايه', 'إيه', 'ليه', 'كام', 'بكام', 'بكم', 'امتي', 'إمتى', 'مين', 'ازاي', 'إزاي',
    'عايز', 'عاوز', 'عايزة', 'عاوزه', 'عايزين', 'محتاج', 'محتاجة', 'حابب', 'حابة', 'اريد', 'أريد',
    'ممكن', 'لو', 'علشان', 'عشان', 'اصل', 'أصل',
    'انا', 'أنا', 'هو', 'هي', 'هى', 'احنا', 'إحنا', 'انت', 'إنت', 'انتي', 'إنتي', 'حضرتك', 'فندم', 'باشا',
    'دكتور', 'دكتورة', 'دكاترة', 'طبيب', 'طبيبة', 'اطباء', 'أطباء', 'سستر', 'سكرتارية', 'ادارة', 'إدارة',
    'عيادة', 'مركز', 'مستشفي', 'مستشفى', 'فرع', 'فروع', 'دمنهور', 'اسكندرية', 'الإسكندرية', 'القاهرة',
    'كشف', 'حجز', 'احجز', 'احجزلي', 'ميعاد', 'موعد', 'معاد', 'مواعيد', 'ساعة', 'ساعه', 'وقت',
    'النهاردة', 'النهارده', 'بكرة', 'بكرا', 'امبارح', 'بعده',
    'السبت', 'الاحد', 'الأحد', 'الاثنين', 'الإثنين', 'الثلاثاء', 'الاربعاء', 'الأربعاء', 'الخميس', 'الجمعة',
    'اسنان', 'أسنان', 'جلدية', 'باطنة', 'قلب', 'عيون', 'ليزر', 'تجميل',
    'تمام', 'شكرا', 'شكراً', 'تسلم', 'عفوا', 'ماشي', 'ماشى', 'اوك', 'اوكي', 'حاضر', 'طيب', 'خلاص',
    'تعبان', 'مريض', 'وجع', 'الم', 'ألم', 'بنزف', 'بموت', 'ضرسي', 'عندي',
    'مش', 'لا', 'اه', 'أه', 'ايوة', 'ايوه', 'نعم', 'غير', 'بدل'
].map(normalizeArabic));

/**
 * Checks if a single word or pair is a recognized authentic Arabic given name
 */
function isRecognizedFirstName(word, nextWord = null) {
    if (!word) return false;
    const norm = normalizeArabic(word);

    // 1. Compound "عبد الـ..."
    if (norm === 'عبد' && nextWord) {
        const nextNorm = normalizeArabic(nextWord);
        if (ABD_SUFFIXES.has(nextNorm)) return true;
    }

    // 2. Compound "أبو ..."
    if (norm === 'ابو' && nextWord) {
        const nextNorm = normalizeArabic(nextWord);
        if (['بكر', 'زيد', 'الفضل', 'طالب', 'الخير', 'سريع', 'العلا', 'النور'].includes(nextNorm)) return true;
    }

    // 3. Single known first name
    if (NORMALIZED_FIRST_NAMES.has(norm)) return true;

    // 4. Handle "عبدالله", "عبدالرحمن" written without space
    if (norm.startsWith('عبد') && norm.length >= 6) {
        const remainder = norm.replace(/^عبد/, '');
        if (ABD_SUFFIXES.has(remainder) || ABD_SUFFIXES.has('ال' + remainder)) return true;
    }

    return false;
}

/**
 * Validates whether a candidate string is an authentic Arabic patient name (1 to 4 words).
 * Strictly rejects random conversational text, queries, or non-name phrases.
 */
function isValidArabicName(rawCandidate) {
    if (!rawCandidate || typeof rawCandidate !== 'string') return false;
    
    // Clean string from punctuation
    const clean = rawCandidate.replace(/[.,!؟?":()؛-]/g, ' ').trim();
    if (!clean || clean.length < 2) return false;

    // Must consist only of Arabic characters, spaces
    if (!/^[\u0600-\u06FF\s]+$/.test(clean)) return false;

    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length < 1 || words.length > 5) return false;

    // Check for any forbidden conversational / clinic / question word
    for (const w of words) {
        const norm = normalizeArabic(w);
        if (STRICT_NON_NAME_WORDS.has(norm)) {
            return false;
        }
    }

    // Determine if first word is a compound name
    let firstNameLength = 1;
    const firstWordNorm = normalizeArabic(words[0]);

    if ((firstWordNorm === 'عبد' || firstWordNorm === 'ابو' || firstWordNorm === 'ام') && words.length >= 2) {
        if (!isRecognizedFirstName(words[0], words[1])) {
            return false;
        }
        firstNameLength = 2;
    } else {
        if (!isRecognizedFirstName(words[0])) {
            return false;
        }
    }

    // If candidate has only 1 word, it is valid as a first name
    if (words.length <= firstNameLength) {
        return true;
    }

    // For middle and family names (2nd, 3rd, 4th words):
    // In Arabic naming customs, each patronymic is the father's or grandfather's given name
    // or a surname with 'ال' (e.g. "الشريف", "المحمدي")
    let i = firstNameLength;
    while (i < words.length) {
        const currNorm = normalizeArabic(words[i]);
        const nextNorm = (i + 1 < words.length) ? normalizeArabic(words[i + 1]) : null;

        // Check if this part is a compound name (e.g. "محمد عبد الرحمن أحمد")
        if ((currNorm === 'عبد' || currNorm === 'ابو') && nextNorm && isRecognizedFirstName(words[i], words[i + 1])) {
            i += 2;
            continue;
        }

        // Check if it's a recognized given name (fathers/grandfathers name)
        if (NORMALIZED_FIRST_NAMES.has(currNorm)) {
            i++;
            continue;
        }

        // Check if it's a known surname or starts with "ال" (Family name / Nisba)
        if (COMMON_SURNAMES.has(currNorm) || (currNorm.startsWith('ال') && currNorm.length >= 4)) {
            i++;
            continue;
        }

        // Check if ends with "الدين" (e.g. "نور الدين")
        if (currNorm === 'الدين') {
            i++;
            continue;
        }

        // Check if written as merged "عبدالرحمن"
        if (currNorm.startsWith('عبد') && currNorm.length >= 6) {
            i++;
            continue;
        }

        // If an unrecognizable random word appears in the name, reject
        return false;
    }

    return true;
}

module.exports = {
    normalizeArabic,
    isRecognizedFirstName,
    isValidArabicName,
    NORMALIZED_FIRST_NAMES,
    ABD_SUFFIXES,
    COMMON_SURNAMES,
    STRICT_NON_NAME_WORDS
};
