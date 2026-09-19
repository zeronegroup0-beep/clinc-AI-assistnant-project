// scratch/test_multi_doctor_parser.js

const DOCTOR_MAP = {
    1: 'dr_ahmed',
    2: 'dr_sara',
    3: 'dr_hossam',
    4: 'dr_mariam'
};

function extractAllMentionedDoctorsEnhanced(text, state = {}) {
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

    // Helper to register doctor at position
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
        // Convert eastern Arabic digits to western
        let normDigits = clean
            .replace(/١/g, '1')
            .replace(/٢/g, '2')
            .replace(/٣/g, '3')
            .replace(/٤/g, '4');

        // Map ordinal & textual numbers
        const ordinalMap = [
            { patterns: ['الاول', 'الاولى', 'الأول', 'الاولاني', 'واحد'], id: 'dr_ahmed' },
            { patterns: ['التاني', 'الثاني', 'التانيه', 'الثانية', 'اتنين', 'اثنين'], id: 'dr_sara' },
            { patterns: ['التالت', 'الثالث', 'التالته', 'الثالثة', 'تلاته', 'تلاتة', 'ثلاثه', 'ثلاثة'], id: 'dr_hossam' },
            { patterns: ['الرابع', 'الرابعه', 'الرابعة', 'اربعه', 'اربعة'], id: 'dr_mariam' }
        ];

        for (const item of ordinalMap) {
            for (const p of item.patterns) {
                const regex = new RegExp(`(^|[\\s،,و])${p}($|[\\s،,و])`, 'g');
                let match;
                while ((match = regex.exec(clean)) !== null) {
                    addDoctor(item.id, match.index);
                }
            }
        }

        // Direct digits: 1, 2, 3, 4 with lookahead / lookbehind
        const digitRegex = /(?<!\d)([1-4])(?!\d)/g;
        let dMatch;
        while ((dMatch = digitRegex.exec(normDigits)) !== null) {
            const digit = parseInt(dMatch[1], 10);
            if (DOCTOR_MAP[digit]) {
                addDoctor(DOCTOR_MAP[digit], dMatch.index);
            }
        }
    }

    doctorPositions.sort((a, b) => a.idx - b.idx);
    return doctorPositions.map(d => d.id);
}

// Test cases
const testCases = [
    { input: "1 و 3", expected: ["dr_ahmed", "dr_hossam"] },
    { input: "1 و 2", expected: ["dr_ahmed", "dr_sara"] },
    { input: "2 و 4", expected: ["dr_sara", "dr_mariam"] },
    { input: "1 و 3 و 4", expected: ["dr_ahmed", "dr_hossam", "dr_mariam"] },
    { input: "الاول والتالت", expected: ["dr_ahmed", "dr_hossam"] },
    { input: "واحد وتلاتة", expected: ["dr_ahmed", "dr_hossam"] },
    { input: "مواعيد د احمد و د سارة ايه ؟", expected: ["dr_ahmed", "dr_sara"] },
    { input: "دكتور حسام ودكتورة مريم", expected: ["dr_hossam", "dr_mariam"] },
    { input: "١ و ٣", expected: ["dr_ahmed", "dr_hossam"] },
    { input: "1, 3", expected: ["dr_ahmed", "dr_hossam"] },
    { input: "1 3", expected: ["dr_ahmed", "dr_hossam"] },
    { input: "أحمد ومصطفى وسارة", expected: ["dr_ahmed", "dr_sara"] },
    { input: "عايز كشف مع دكتور أحمد", expected: ["dr_ahmed"] },
    { input: "2", expected: ["dr_sara"] }
];

console.log("Running Multi-Doctor Extraction Tests:\n");
let passed = 0;
for (const tc of testCases) {
    const result = extractAllMentionedDoctorsEnhanced(tc.input);
    const pass = JSON.stringify(result) === JSON.stringify(tc.expected);
    if (pass) passed++;
    console.log(`[${pass ? '✅' : '❌'}] "${tc.input}" -> ${JSON.stringify(result)} (expected ${JSON.stringify(tc.expected)})`);
}

console.log(`\nSummary: ${passed}/${testCases.length} passed.`);
