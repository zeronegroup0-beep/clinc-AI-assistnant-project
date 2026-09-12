function isGibberish(text) {
    if (!text) return true;
    const clean = text.trim();
    if (clean.length < 2) return true;

    // Check for keyboard mash in English (e.g. asdfghjk, qwertyui, zxcvbnm)
    if (/^[a-zA-Z\s]{4,}$/.test(clean)) {
        const commonEnglish = ['hello', 'hi', 'booking', 'doctor', 'appointment', 'monday', 'tuesday', 'teeth', 'clinic'];
        if (!commonEnglish.some(w => clean.toLowerCase().includes(w))) {
            return true;
        }
    }

    // Repeated characters (e.g. سسسسس, aaaaa, zzzzz)
    if (/(.)\1{3,}/.test(clean) && !clean.includes('هههه') && !clean.includes('هاها')) {
        return true;
    }

    const knownWords = [
        'السلام', 'عليكم', 'مساء', 'صباح', 'الخير', 'عايز', 'عاوز', 'عيز', 'أنا', 'انا', 'اسمي', 'اسمى',
        'حجز', 'احجز', 'كشف', 'أسنان', 'اسنان', 'جلدية', 'باطنة', 'عيون', 'دكتور', 'دكتورة',
        'ميعاد', 'موعد', 'ساعة', 'ساعه', 'الإثنين', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس',
        'الجمعة', 'السبت', 'الأحد', 'الواتساب', 'واتساب', 'رقمي', 'سجلني', 'شكرا', 'تمام', 'ألو', 'الو',
        'بكرة', 'غدا', 'متاح', 'محجوز', 'انتظار', 'بلغوني', 'نبهني', 'تنورنا', 'خدمات', 'أسعار', 'رقم', 'معاك'
    ];

    const hasKnownWord = knownWords.some(w => clean.includes(w));
    if (hasKnownWord) return false;

    // Check if it's numbers or phone
    if (/\d{3,}/.test(clean)) return false;

    // Keyboard rows in Arabic
    const row1 = 'ضصثقفغعهخحجد';
    const row2 = 'شسيبلاتنمكط';
    const row3 = 'ئءؤرىةوزظ';

    // If words are composed of mash characters and no known word
    const words = clean.split(/\s+/);
    let mashWordCount = 0;
    for (const w of words) {
        if (w.length >= 4) {
            // Check if letters are all from top row, or adjacent mash
            const isRowMash = [...w].every(c => row1.includes(c)) || [...w].every(c => row2.includes(c));
            if (isRowMash) {
                mashWordCount++;
            } else if (!knownWords.some(kw => kw.includes(w) || w.includes(kw))) {
                mashWordCount++;
            }
        }
    }

    if (mashWordCount >= 1 && !hasKnownWord) {
        return true;
    }

    return false;
}

console.log('خثصثقخه سيبليشسيب isGibberish:', isGibberish('خثصثقخه سيبليشسيب'));
console.log('asdfghjkl isGibberish:', isGibberish('asdfghjkl'));
console.log('عايز احجز isGibberish:', isGibberish('عايز احجز'));
console.log('السلام عليكم isGibberish:', isGibberish('السلام عليكم'));
