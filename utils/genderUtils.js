/**
 * Gender and Grammatical Agreement Utility for Egyptian Receptionist (Nora)
 */

const FEMININE_NAMES = new Set([
    'سارة', 'ساره', 'منى', 'مني', 'مريم', 'فاطمة', 'فاطمه', 'نورا', 'نوره', 'هدى', 'هدي',
    'ياسمين', 'آية', 'اية', 'مي', 'رنا', 'سلمى', 'سلمي', 'دينا', 'شروق', 'إيمان', 'ايمان',
    'ندى', 'ندي', 'هبة', 'هبه', 'ريهام', 'أسماء', 'اسماء', 'أميرة', 'اميره', 'داليا',
    'خلود', 'يمنى', 'ريم', 'تسنيم', 'إسراء', 'اسراء', 'رحمة', 'رحمه', 'نهى', 'نهي',
    'لبنى', 'لبني', 'تقى', 'تقي', 'جنى', 'جني', 'رؤى', 'رؤي', 'بشرى', 'بشري',
    'شيماء', 'وفاء', 'سناء', 'حسناء', 'نجلاء', 'ولاء', 'دعاء', 'هناء', 'رجاء',
    'حبيبة', 'حبيبه', 'ملك', 'فريدة', 'فريده', 'زينة', 'زينه', 'منة', 'منه',
    'جميلة', 'جميله', 'كريمة', 'كريمه', 'خديجة', 'خديجه', 'عائشة', 'عائشه',
    'هاجر', 'روان', 'رغد', 'روفيدة', 'روفيده', 'مروة', 'مروه', 'نهال', 'رضوى', 'رضوي',
    'نسرين', 'شيرين', 'نادين', 'كارين', 'سهام', 'إلهام', 'الهام', 'ابتسام', 'أحلام', 'احلام'
]);

const MASCULINE_NAMES = new Set([
    'محمود', 'أحمد', 'احمد', 'محمد', 'كريم', 'علي', 'على', 'عمر', 'خالد', 'يوسف',
    'مصطفى', 'مصطفي', 'إبراهيم', 'ابراهيم', 'طارق', 'شريف', 'عمرو', 'حسن', 'حسين',
    'ياسر', 'سامح', 'ماجد', 'وائل', 'هشام', 'تامر', 'هاني', 'هاني', 'عادل', 'عصام',
    'أيمن', 'ايمن', 'أشرف', 'اشرف', 'حسام', 'سامي', 'سامي', 'فادي', 'شادي'
]);

const UNISEX_NAMES = new Set([
    'نور', 'إسلام', 'اسلام', 'رضا', 'عصمت', 'جهاد', 'تيسير', 'صباح', 'ميسرة', 'ميسره',
    'شمس', 'وسام', 'إكرام', 'اكرام', 'صفاء', 'رجاء', 'يسر', 'ضياء', 'إحسان', 'احسان'
]);

/**
 * Check if a name is typically unisex / ambiguous in Egyptian Arabic
 */
function isUnisexName(name) {
    if (!name) return false;
    const clean = name.trim();
    const firstWord = clean.split(/\s+/)[0];
    return UNISEX_NAMES.has(firstWord) || UNISEX_NAMES.has(clean);
}

/**
 * Check if a name is typically feminine in Arabic
 */
function isFeminineName(name) {
    if (!name) return false;
    const clean = name.trim();
    const firstWord = clean.split(/\s+/)[0];

    if (isUnisexName(clean)) {
        return false;
    }

    if (FEMININE_NAMES.has(firstWord) || FEMININE_NAMES.has(clean)) {
        return true;
    }

    // Typical feminine endings
    if (firstWord.endsWith('ة') || firstWord.endsWith('ه')) {
        // Exclude common masculine exceptions ending in ه or ة like طه, حمزة, أسامة
        const masculineExceptions = ['حمزة', 'حمزه', 'أسامة', 'اسامة', 'اسامه', 'طلحة', 'طلحه', 'عبيدة', 'عبيده', 'عكرمة', 'عكرمه', 'قتادة', 'قتاده', 'طه'];
        if (!masculineExceptions.includes(firstWord)) {
            return true;
        }
    }

    if (firstWord.endsWith('اء') && firstWord.length >= 4) {
        // Exclude masculine like براء, علاء, بهاء
        const masculineExceptions = ['علاء', 'بهاء', 'براء', 'ضياء'];
        if (!masculineExceptions.includes(firstWord)) {
            return true;
        }
    }

    if (firstWord.endsWith('ى') || firstWord.endsWith('ي')) {
        const feminineAlifMaqsura = ['هدى', 'منى', 'سلمى', 'ندى', 'لبنى', 'نهى', 'تقى', 'جنى', 'رؤى', 'بشرى', 'يمنى', 'ضحى'];
        if (feminineAlifMaqsura.includes(firstWord)) {
            return true;
        }
    }

    return false;
}

/**
 * Detect user's grammatical gender from message context and extracted name
 */
function detectGender({ text = '', name = null, currentGender = null }) {
    if (currentGender === 'female' || currentGender === 'male') {
        // Once locked to female or male, retain for the entire session!
        return currentGender;
    }

    const cleanText = text.toLowerCase();

    // 1. Passive Monitoring: Context Clues for Feminine Markers
    const hasFeminineMarker = (
        cleanText.includes('عايزة') || cleanText.includes('عاوزة') || 
        cleanText.includes('عايزه') || cleanText.includes('عاوزه') || 
        cleanText.includes('محتاجة') || cleanText.includes('محتاجه') || 
        cleanText.includes('فاضية') || cleanText.includes('فاضيه') || 
        cleanText.includes('فاضيتلك') || cleanText.includes('فاضيالك') ||
        cleanText.includes('ممكن أجيي') || cleanText.includes('ممكن اجيي') || 
        cleanText.includes('حابة') || cleanText.includes('حابه') || 
        cleanText.includes('تعبانة') || cleanText.includes('تعبانه') || 
        cleanText.includes('مريضة') || cleanText.includes('مريضه') || 
        cleanText.includes('مدام') || cleanText.includes('أستاذة') || 
        cleanText.includes('استاذة') || cleanText.includes('دكتورة')
    );
    if (hasFeminineMarker) {
        return 'female';
    }

    // 2. Passive Monitoring: Context Clues for Masculine Markers
    const hasMasculineMarker = (
        cleanText.includes('عايز') || cleanText.includes('عاوز') || 
        cleanText.includes('عيز') || cleanText.includes('محتاج') || 
        cleanText.includes('فاضي') || cleanText.includes('فاضيلك') ||
        cleanText.includes('ممكن أجي') || cleanText.includes('ممكن اجي') || 
        cleanText.includes('حابب') || cleanText.includes('تعبان') || 
        cleanText.includes('مريض') || cleanText.includes('أستاذ') || 
        cleanText.includes('استاذ') || cleanText.includes('باشمهندس') || 
        cleanText.includes('مهندس') || cleanText.includes('دكتور')
    );
    if (hasMasculineMarker) {
        return 'male';
    }

    // 3. Name check (if provided)
    if (name) {
        if (isUnisexName(name)) {
            return 'unisex'; // DO NOT default immediately to male or female!
        }
        if (isFeminineName(name)) {
            return 'female';
        }
        const firstWord = name.trim().split(/\s+/)[0];
        if (MASCULINE_NAMES.has(firstWord)) {
            return 'male';
        }
    }

    if (currentGender === 'unisex') {
        return 'unisex';
    }

    return null; // Undetermined / neutral
}

/**
 * Generate grammatical phrases matching the user's gender dynamically
 */
function getGenderedPhrases(gender = null) {
    const isFemale = gender === 'female';
    const isNeutral = !gender || gender === 'unisex';

    return {
        gender: gender || 'unisex',
        isFemale,
        isNeutral,
        // Greetings & Welcome
        ahlanBek: isFemale ? 'أهلاً بكِ' : 'أهلاً بك',
        nawwart: isFemale ? 'نورتِ' : 'نورت',
        tanawwar: isFemale ? 'تنورينا' : 'تنورنا',
        // Inquiries & Desires
        habeb: isFemale ? 'حابة' : 'حابب',
        tostafser: isFemale ? 'تستفسري' : 'تستفسر',
        toheb: isFemale ? 'تحبي' : 'تحب',
        tahjez: isFemale ? 'تحجزي' : 'تحجز',
        lak: isFemale ? 'لكِ' : 'لك',
        mashkoor: isFemale ? 'مشكورة' : 'مشكور',
        yaFandem: 'يا فندم',
        // Honorific generator
        formatHonorific: (name) => {
            if (!name) return 'حضرتك';
            const clean = name.trim();
            if (isNeutral) {
                return clean;
            }
            if (isFemale) {
                if (clean.startsWith('أستاذة') || clean.startsWith('استاذة') || clean.startsWith('مدام') || clean.startsWith('دكتورة')) {
                    return clean;
                }
                return `أستاذة ${clean}`;
            } else {
                if (clean.startsWith('أستاذ') || clean.startsWith('استاذ') || clean.startsWith('باشمهندس') || clean.startsWith('دكتور')) {
                    return clean;
                }
                return `أستاذ ${clean}`;
            }
        }
    };
}

module.exports = {
    detectGender,
    isFeminineName,
    isUnisexName,
    getGenderedPhrases,
    FEMININE_NAMES,
    MASCULINE_NAMES,
    UNISEX_NAMES
};

