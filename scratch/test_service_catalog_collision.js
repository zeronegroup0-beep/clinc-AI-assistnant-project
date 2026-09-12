const { processChatMessage } = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');

async function testServiceCatalogCollision() {
    console.log('Testing Service Catalog Routing & Keyword Collision Guard...\n');

    let allPassed = true;

    // Test 1: Service Catalog Lookup First & Category Lock
    // User asks for "جلسة تبييض الأسنان بالليزر (Zoom)"
    console.log('--- Test 1: "جلسة تبييض الأسنان بالليزر (Zoom)" ---');
    const res1 = await processChatMessage({
        message: 'جلسة تبييض الأسنان بالليزر (Zoom)',
        sessionId: 'test_session_1',
        sessionData: {}
    });

    console.log('Response:', res1.reply);
    console.log('Doctor in state:', res1.state.bookingDraft?.doctor);
    console.log('Specialty in state:', res1.state.bookingDraft?.specialty);

    const hasDrAhmed = res1.reply.includes('د. أحمد شريف');
    const hasTeethCategory = res1.reply.includes('طب الأسنان');
    const hasWhitening = res1.reply.includes('تبييض الأسنان بالليزر');
    const hasPatternPrefix = res1.reply.startsWith('مواعيد د. أحمد شريف (طب الأسنان - تبييض الأسنان بالليزر) المتاحة هي:');
    const hasPatternSuffix = res1.reply.includes('تحب أحجزلك ميعاد فيهم؟');
    const noDrSara = !res1.reply.includes('سارة محمود') && !res1.reply.includes('الجلدية');

    if (hasDrAhmed && hasTeethCategory && hasWhitening && hasPatternPrefix && hasPatternSuffix && noDrSara) {
        console.log('✅ Test 1 PASSED: Correctly routed to Dr. Ahmed, matched Zoom Whitening, obeyed Fallback Response Pattern, and locked category away from Dermatology.\n');
    } else {
        console.error('❌ Test 1 FAILED:', { hasDrAhmed, hasTeethCategory, hasWhitening, hasPatternPrefix, hasPatternSuffix, noDrSara });
        allPassed = false;
    }

    // Test 2: Rule 1 - Explicit Doctor Mention over Procedure Keyword
    // "عايز كشف مع د. أحمد شريف جلسة ليزر"
    console.log('--- Test 2: Explicit Doctor Mention ("عايز كشف مع د. أحمد شريف جلسة ليزر") ---');
    const res2 = await processChatMessage({
        message: 'عايز كشف مع د. أحمد شريف جلسة ليزر',
        sessionId: 'test_session_2',
        sessionData: {}
    });

    console.log('Response:', res2.reply);
    console.log('Doctor in state:', res2.state.bookingDraft?.doctor);

    const rule1Passed = res2.reply.includes('د. أحمد شريف') && !res2.reply.includes('سارة محمود');
    if (rule1Passed) {
        console.log('✅ Test 2 PASSED: Explicit doctor mention locked to Dr. Ahmed Sherif despite "ليزر".\n');
    } else {
        console.error('❌ Test 2 FAILED');
        allPassed = false;
    }

    // Test 3: Fallback Response Pattern with Specific Day
    // "عايز جلسة تبييض الأسنان بالليزر (Zoom) يوم الإثنين"
    console.log('--- Test 3: Service Catalog with Specified Day ("عايز جلسة تبييض الأسنان بالليزر (Zoom) يوم الإثنين") ---');
    const res3 = await processChatMessage({
        message: 'عايز جلسة تبييض الأسنان بالليزر (Zoom) يوم الإثنين',
        sessionId: 'test_session_3',
        sessionData: {}
    });

    console.log('Response:', res3.reply);
    const daySlotsPassed = res3.reply.includes('مواعيد د. أحمد شريف (طب الأسنان - تبييض الأسنان بالليزر) المتاحة هي: 5:30 مساءً') && 
                           res3.reply.includes('تحب أحجزلك ميعاد فيهم؟');
    if (daySlotsPassed) {
        console.log('✅ Test 3 PASSED: Correctly formatted day slots with fallback response pattern.\n');
    } else {
        console.error('❌ Test 3 FAILED:', res3.reply);
        allPassed = false;
    }

    // Test 4: Dermatology Laser Hair Removal
    // "عايز جلسة إزالة الشعر بالليزر"
    console.log('--- Test 4: Dermatology Laser Hair Removal ("عايز جلسة إزالة الشعر بالليزر") ---');
    const res4 = await processChatMessage({
        message: 'عايز جلسة إزالة الشعر بالليزر',
        sessionId: 'test_session_4',
        sessionData: {}
    });

    console.log('Response:', res4.reply);
    const laserHairPassed = res4.reply.includes('د. سارة محمود') && res4.reply.includes('الجلدية والتجميل') && !res4.reply.includes('د. أحمد شريف');
    if (laserHairPassed) {
        console.log('✅ Test 4 PASSED: Laser hair removal routed properly to Dr. Sara.\n');
    } else {
        console.error('❌ Test 4 FAILED:', res4.reply);
        allPassed = false;
    }

    // Test 5: Gender Agreement on Service Pattern
    // Female patient asks for Zoom whitening
    console.log('--- Test 5: Female Gender Agreement with Fallback Pattern ---');
    const res5 = await processChatMessage({
        message: 'أنا سارة وعايزة جلسة تبييض الأسنان بالليزر (Zoom)',
        sessionId: 'test_session_5',
        sessionData: {}
    });

    console.log('Response:', res5.reply);
    const femalePassed = res5.reply.includes('تحبي أحجزلك ميعاد فيهم؟');
    if (femalePassed) {
        console.log('✅ Test 5 PASSED: Female pronoun agreement ("تحبي") applied to fallback pattern.\n');
    } else {
        console.error('❌ Test 5 FAILED:', res5.reply);
        allPassed = false;
    }

    if (allPassed) {
        console.log('🎉 ALL SERVICE CATALOG TESTS PASSED PERFECTLY!');
    } else {
        console.error('💥 SOME TESTS FAILED');
        process.exit(1);
    }
}

testServiceCatalogCollision().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
