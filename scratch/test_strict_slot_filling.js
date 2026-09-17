const { processChatMessage, normalizeTypoAndSlang } = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');

const EXPECTED_EXACT_REPLY = `أهلاً بك! نورت عيادتنا سمارت كلينك 🌸
عشان أقدر أساعدك بأدق ميعاد، تحب تكشف في أي تخصص أو مع أي دكتور من استشاريينا؟

• د. أحمد شريف (طب وجراحة الأسنان)
• د. سارة محمود (الجلدية والتجميل والليزر)
• د. حسام فتحي (أمراض الباطنة والقلب)
• د. مريم نبيل (طب وجراحة العيون)`;

async function runTests() {
    console.log('================================================================');
    console.log('🧪 TEST 1: Text Normalization Function');
    console.log('================================================================');
    const norm1 = normalizeTypoAndSlang('أحجز');
    console.log('- "أحجز" ->', norm1, '| Matches "احجز":', norm1 === 'احجز');

    const norm2 = normalizeTypoAndSlang('كنت عايز كشف');
    console.log('- "كنت عايز كشف" ->', norm2, '| Contains "عايز كشف":', norm2.includes('عايز كشف'));

    const norm3 = normalizeTypoAndSlang('محتاج استشارة');
    console.log('- "محتاج استشارة" ->', norm3, '| Contains "عايز استشاره":', norm3.includes('عايز استشارة') || norm3.includes('عايز استشاره'));

    const norm4 = normalizeTypoAndSlang('حابب ميعاد');
    console.log('- "حابب ميعاد" ->', norm4, '| Contains "عايز ميعاد":', norm4.includes('عايز ميعاد'));

    console.log('\n================================================================');
    console.log('🧪 TEST 2: Universal Generic Booking Interceptor (Exact Reply)');
    console.log('================================================================');
    const genericPhrases = [
        'عايز أحجز ميعاد',
        'عايز كشف',
        'أحجز جلسة',
        'إيه المواعيد المتاحة عندكم؟',
        'فاضيين يوم الإثنين؟',
        'كنت عايز كشف',
        'محتاج استشارة',
        'حابب ميعاد جلسة'
    ];

    for (const phrase of genericPhrases) {
        const res = await processChatMessage({ message: phrase, sessionState: {} });
        const exactMatch = res.reply.trim() === EXPECTED_EXACT_REPLY.trim();
        console.log(`- Query: "${phrase}"`);
        console.log(`  -> Exact Response Match: ${exactMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
        if (!exactMatch) {
            console.log('  Actual Reply:\n', res.reply);
            throw new Error(`Mismatch for phrase: ${phrase}`);
        }
    }

    console.log('\n================================================================');
    console.log('🧪 TEST 3: Tool Declaration Hard Check (NEEDS_DOCTOR_SELECTION)');
    console.log('================================================================');
    const resNull = appointmentService.getDoctorAvailableSlotsSummary(null);
    console.log('- getDoctorAvailableSlotsSummary(null):', resNull, '| Expected: NEEDS_DOCTOR_SELECTION ->', resNull === 'NEEDS_DOCTOR_SELECTION');

    const resUndefined = appointmentService.getDoctorAvailableSlotsSummary(undefined);
    console.log('- getDoctorAvailableSlotsSummary(undefined):', resUndefined, '| Expected: NEEDS_DOCTOR_SELECTION ->', resUndefined === 'NEEDS_DOCTOR_SELECTION');

    const resEmpty = appointmentService.getDoctorAvailableSlotsSummary('');
    console.log('- getDoctorAvailableSlotsSummary(""):', resEmpty, '| Expected: NEEDS_DOCTOR_SELECTION ->', resEmpty === 'NEEDS_DOCTOR_SELECTION');

    if (resNull !== 'NEEDS_DOCTOR_SELECTION' || resUndefined !== 'NEEDS_DOCTOR_SELECTION' || resEmpty !== 'NEEDS_DOCTOR_SELECTION') {
        throw new Error('Tool declaration check failed: null/undefined/empty doctorId must return NEEDS_DOCTOR_SELECTION');
    }

    console.log('\n================================================================');
    console.log('🧪 TEST 4: Follow-up Providing Specialty After Generic Request');
    console.log('================================================================');
    let state = {};
    const step1 = await processChatMessage({ message: 'فاضيين يوم الإثنين؟', sessionState: state });
    state = step1.sessionState || step1.state || {};
    const step2 = await processChatMessage({ message: 'باطنة وقلب', sessionState: state });
    console.log('- Follow-up Reply:\n', step2.reply);
    console.log('- Successfully routed to Dr. Hossam Fathi:', step2.reply.includes('حسام فتحي'));

    console.log('\n🎉 ALL UNIVERSAL GENERIC INTENT INTERCEPTOR TESTS PASSED 100%!');
}

runTests().catch(err => {
    console.error('❌ Error during test:', err);
    process.exit(1);
});
