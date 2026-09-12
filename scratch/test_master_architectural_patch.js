/**
 * Dedicated Test Runner for Master Architectural Patch: Nora AI Receptionist
 * Verifies all 6 architectural modules:
 * 1. Module 1: Emergency & Critical Safety Interceptor
 * 2. Module 2: Standalone Entity & Phone Extraction Guards
 * 3. Module 3: Dynamic Gender & Unisex Name Resolution
 * 4. Module 4: Service Catalog Lookup & Anti-Collision Routing
 * 5. Module 5: Dynamic Date Calculations & Waitlist Engine
 * 6. Module 6: Multi-Branch & Knowledge Base Integration
 */

const { processChatMessage, isEmergencyMessage, analyzePhoneNumber } = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`  ✅ [PASS] ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ [FAIL] ${message}`);
    }
}

async function runMasterPatchTests() {
    console.log('================================================================');
    console.log('🧪 RUNNING MASTER ARCHITECTURAL PATCH VERIFICATION BENCH');
    console.log('================================================================\n');

    // -------------------------------------------------------------
    // MODULE 1: EMERGENCY & CRITICAL SAFETY INTERCEPTOR
    // -------------------------------------------------------------
    console.log('--- MODULE 1: Emergency Interceptor ---');
    const emergencyInputs = [
        'نزيف حاد',
        'عندي ألم لا يطاق مش قادر أستنى',
        'دي حالة حرجة وطوارئ',
        'حاسس بإغماء ومش قادر اتنفس',
        'في كسر في ضرسي وبيوجعني جدا'
    ];

    for (const msg of emergencyInputs) {
        assert(isEmergencyMessage(msg), `isEmergencyMessage detects: "${msg}"`);
    }

    const emRes = await processChatMessage({
        message: 'عندي نزيف حاد وألم لا يطاق',
        sessionId: 'em-1',
        sessionData: { bookingDraft: { doctor: 'د. أحمد شريف', date: 'الإثنين' } }
    });
    assert(emRes.state.isEmergency === true, 'State flagged as isEmergency');
    assert(!emRes.state.bookingDraft, 'Active bookingDraft was purged on emergency');
    assert(emRes.reply.includes('يا فندم سلامتك ألف سلامة!'), 'Returns mandatory emergency greeting');
    assert(emRes.reply.includes('قسم طوارئ أو مستشفى'), 'Directs patient immediately to emergency');

    // -------------------------------------------------------------
    // MODULE 2: STANDALONE ENTITY & PHONE EXTRACTION GUARDS
    // -------------------------------------------------------------
    console.log('\n--- MODULE 2: Standalone Entity & Phone Extraction Guards ---');
    // Greeting guard while in AWAITING_NAME
    const greetRes = await processChatMessage({
        message: 'الحمد لله أخبارك إيه',
        sessionId: 'greet-1',
        sessionData: { awaitingName: true }
    });
    assert(greetRes.reply.includes('الحمد لله تمام وبخير يا فندم! يشرفني معرفة اسم حضرتك الكريم؟'), 'Greeting in awaitingName re-prompts for name without saving greeting as name');
    assert(!greetRes.state.patientName, 'Greeting was NOT saved as patient name');
    assert(greetRes.state.awaitingName === true, 'Remains in awaitingName state');

    // Standalone name acceptance
    const nameRes = await processChatMessage({
        message: 'محمود السيد',
        sessionId: 'greet-1',
        sessionData: greetRes.state
    });
    assert(nameRes.state.userName === 'محمود السيد', '1-to-3 word noun input saved as userName');
    assert(nameRes.reply.includes('أستاذ محمود السيد'), 'Polite honorific prefix generated');

    // Strict 11-digit Egyptian phone regex: ^01[0-9]{9}$
    const invalidPhone = analyzePhoneNumber('0101234');
    assert(invalidPhone.hasAttempt === true && invalidPhone.isValid === false, '0101234 flagged as invalid attempt');

    const validPhone = analyzePhoneNumber('01012345678');
    assert(validPhone.isValid === true && validPhone.phone === '01012345678', '01012345678 accepted as valid');

    const phoneFailRes = await processChatMessage({
        message: '0101234',
        sessionId: 'ph-1',
        sessionData: { awaitingPhone: true, pendingBooking: { doctor: 'د. أحمد شريف', date: 'الإثنين', time: '5:30 مساءً' } }
    });
    assert(phoneFailRes.reply.includes('عذراً، رقم المحمول المكتوب غير مكتمل. يرجى كتابة رقم الموبايل المصري المكون من 11 رقم (مثال: 01012345678)'), 'Mandatory incomplete phone error message returned');

    // -------------------------------------------------------------
    // MODULE 3: DYNAMIC GENDER & UNISEX NAME RESOLUTION
    // -------------------------------------------------------------
    console.log('\n--- MODULE 3: Dynamic Gender & Unisex Name Resolution ---');
    // Unisex name initial neutral greeting
    const unisexRes = await processChatMessage({
        message: 'نور',
        sessionId: 'uni-1',
        sessionData: { awaitingName: true }
    });
    assert(unisexRes.reply.includes('أهلاً بك يا فندم! نورت عيادتنا، إزاي أقدر أساعدك؟'), 'Unisex name receives neutral polite welcome');
    assert(unisexRes.state.userGender === 'unisex', 'userGender starts as unisex');

    // Dynamic gender locking via context clues (فاضيلك vs فاضيتلك)
    const mascLockRes = await processChatMessage({
        message: 'أنا فاضيلك يوم السبت',
        sessionId: 'uni-1',
        sessionData: unisexRes.state
    });
    assert(mascLockRes.state.userGender === 'male', 'فاضيلك locks userGender to male');
    assert(mascLockRes.reply.includes('تحب'), 'Uses masculine verbs (تحب)');

    const femLockRes = await processChatMessage({
        message: 'أنا إسلام وفاضيتلك بكرة',
        sessionId: 'uni-2',
        sessionData: { awaitingName: true }
    });
    assert(femLockRes.state.userGender === 'female', 'فاضيتلك locks userGender to female');

    // -------------------------------------------------------------
    // MODULE 4: SERVICE CATALOG LOOKUP & ANTI-COLLISION ROUTING
    // -------------------------------------------------------------
    console.log('\n--- MODULE 4: Service Catalog Lookup & Anti-Collision ---');
    const serviceRes = await processChatMessage({
        message: 'جلسة تبييض الأسنان بالليزر (Zoom)',
        sessionId: 'srv-1',
        sessionData: {}
    });
    assert(serviceRes.state.bookingDraft.doctor === 'د. أحمد شريف', 'Whitening with laser routes exclusively to Dr. Ahmed Sherif');
    assert(!serviceRes.reply.includes('سارة محمود'), 'Laser whitening never routes to Dr. Sara (Dermatology)');
    assert(serviceRes.reply.includes('طب الأسنان'), 'Category lock strictly applied to Dental');

    // Explicit doctor priority
    const explicitDocRes = await processChatMessage({
        message: 'عايز كشف مع د. أحمد شريف جلسة ليزر',
        sessionId: 'srv-2',
        sessionData: {}
    });
    assert(explicitDocRes.state.bookingDraft.doctor === 'د. أحمد شريف', 'Explicit doctor name takes absolute priority over keywords');

    // -------------------------------------------------------------
    // MODULE 5: DYNAMIC DATE CALCULATIONS & WAITLIST ENGINE
    // -------------------------------------------------------------
    console.log('\n--- MODULE 5: Dynamic Date Calculations & Waitlist Engine ---');
    // Past slot / finished today message
    const todayPastRes = await processChatMessage({
        message: 'عايز كشف النهاردة الساعة 2:00 م مع دكتور أحمد',
        sessionId: 'date-1',
        sessionData: {},
        currentDate: new Date('2026-09-12T20:00:00') // 8:00 PM (Saturday)
    });
    assert(todayPastRes.reply.includes('مواعيد النهاردة انتهت بالكامل يا فندم'), 'Notice of finished today slots');
    assert(todayPastRes.reply.includes('أقرب ميعاد متاح للدكتور'), 'Next available day presented without silent jump');
    assert(todayPastRes.reply.includes('تحب أحجز لك فيه؟'), 'Offers booking on next available working day');

    // Waitlist intent routing without slot redisplay
    const waitlistPromptRes = await processChatMessage({
        message: 'سجلني في قائمة الانتظار',
        sessionId: 'wt-1',
        sessionData: { bookingDraft: { doctor: 'د. أحمد شريف', date: 'الإثنين', time: '4:30 مساءً' } }
    });
    assert(waitlistPromptRes.state.awaitingPhone === true, 'Awaiting phone for waitlist registration');
    assert(!waitlistPromptRes.reply.includes('• 5:30 مساءً'), 'Slots are NOT redisplayed when waitlist chosen');

    const waitlistConfirmRes = await processChatMessage({
        message: '01011223344',
        sessionId: 'wt-1',
        sessionData: waitlistPromptRes.state
    });
    assert(waitlistConfirmRes.reply.includes('تم تسجل طلبك في قائمة الانتظار لـ د. أحمد شريف'), 'Mandatory waitlist confirmation phrase');
    assert(waitlistConfirmRes.reply.includes('على الواتساب'), 'Promises WhatsApp notification');

    // -------------------------------------------------------------
    // MODULE 6: MULTI-BRANCH & KNOWLEDGE BASE INTEGRATION
    // -------------------------------------------------------------
    console.log('\n--- MODULE 6: Multi-Branch & Knowledge Base Integration ---');
    // Branch disambiguation
    const branchPromptRes = await processChatMessage({
        message: 'عندكم فروع ايه؟',
        sessionId: 'br-1',
        sessionData: {}
    });
    assert(branchPromptRes.reply.includes('فرع دمنهور وفرع الإسكندرية'), 'Lists both branches');
    assert(branchPromptRes.reply.includes('تحب تحجز في فرع دمنهور ولا فرع الإسكندرية؟'), 'Prompts patient for preferred branch');

    // Alex branch schedule
    const alexRes = await processChatMessage({
        message: 'ممكن أعرف مواعيد فرع الإسكندرية؟',
        sessionId: 'br-2',
        sessionData: {}
    });
    assert(alexRes.state.branch_id === 'alex', 'Session branch_id updated to alex');
    assert(alexRes.reply.includes('د. حسام فتحي') && alexRes.reply.includes('د. مريم نبيل'), 'Lists Alex branch doctors');

    // Switching back to Damanhour
    const switchRes = await processChatMessage({
        message: 'طيب أكمل في دمنهور',
        sessionId: 'br-2',
        sessionData: alexRes.state
    });
    assert(switchRes.state.branch_id === 'damanhour', 'Session branch_id switched to damanhour');

    // Knowledge Base Insurance with booking retention
    const insRes = await processChatMessage({
        message: 'هل متعاقدين مع شركات التأمين؟',
        sessionId: 'kb-1',
        sessionData: { bookingDraft: { doctor: 'د. أحمد شريف', date: 'يوم الأربعاء', time: '6:00 مساءً' } }
    });
    assert(insRes.reply.includes('بوبا Bupa') && insRes.reply.includes('أكسا AXA'), 'Returns accepted insurance providers');
    assert(insRes.reply.includes('نكمل حجز ميعاد حضرتك يوم الأربعاء الساعة 6:00 مساءً'), 'Retains active bookingDraft and prompts to continue');

    console.log('\n================================================================');
    console.log(`📊 RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
        console.log('🎉 ALL MASTER ARCHITECTURAL PATCH TESTS PASSED 100%!');
        process.exit(0);
    } else {
        console.error('❌ SOME TESTS FAILED');
        process.exit(1);
    }
}

runMasterPatchTests().catch(err => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
});
