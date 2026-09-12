const receptionistAgent = require('../services/receptionistAgent');
const genderUtils = require('../utils/genderUtils');

async function runTests() {
    console.log('================================================================');
    console.log('🧪 TESTING: Unisex Names & Dynamic Gender Inference Strategy');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    }

    const mockDate = new Date('2026-09-12T10:00:00');

    // ----------------------------------------------------------------
    // TEST 1: Unisex Names Recognition in genderUtils
    // ----------------------------------------------------------------
    console.log('--- TEST 1: Unisex Names Recognition ---');
    const unisexSample = ['نور', 'إسلام', 'رضا', 'عصمت', 'جهاد'];
    for (const name of unisexSample) {
        const detected = genderUtils.detectGender({ name });
        assert(detected === 'unisex', `"${name}" detected as unisex (not male/female immediately)`);
    }

    // ----------------------------------------------------------------
    // TEST 2: Initial Gender-Neutral Response for Unisex Name ("نور")
    // ----------------------------------------------------------------
    console.log('\n--- TEST 2: Initial Gender-Neutral Response for "نور" ---');
    // Turn 1: Greetings
    let t1 = await receptionistAgent.processChatMessage({
        message: 'صباح الخير',
        sessionId: 'test_unisex_1',
        sessionData: {},
        currentDate: mockDate
    });
    assert(t1.state.awaitingName === true, 'Turn 1 sets awaitingName = true');

    // Turn 2: Standalone unisex name "نور"
    let t2 = await receptionistAgent.processChatMessage({
        message: 'نور',
        sessionId: 'test_unisex_1',
        sessionData: t1.state,
        currentDate: mockDate
    });
    assert(t2.state.userName === 'نور', 'userName saved as "نور"');
    assert(t2.state.userGender === 'unisex', 'userGender is unisex');
    assert(t2.reply === 'أهلاً بك يا فندم! نورت عيادتنا، إزاي أقدر أساعدك؟', 'Exact neutral greeting: "أهلاً بك يا فندم! نورت عيادتنا، إزاي أقدر أساعدك؟"');

    // ----------------------------------------------------------------
    // TEST 3: Dynamic Feminine Marker Lock ("عايزة")
    // ----------------------------------------------------------------
    console.log('\n--- TEST 3: Dynamic Feminine Marker ("عايزة") Locks female ---');
    let t3 = await receptionistAgent.processChatMessage({
        message: 'عايزة أكشف أسنان يوم الإثنين',
        sessionId: 'test_unisex_1',
        sessionData: t2.state,
        currentDate: mockDate
    });
    assert(t3.state.userGender === 'female', 'userGender dynamically locked to female');
    assert(t3.state.gender === 'female', 'state.gender is female');
    assert(t3.reply.includes('تحبي'), 'Feminine verb "تحبي" used in slot listing');

    // Turn 4: Selecting time slot -> uses feminine honorific "أستاذة نور"
    let t4 = await receptionistAgent.processChatMessage({
        message: 'الساعة 6:30',
        sessionId: 'test_unisex_1',
        sessionData: t3.state,
        currentDate: mockDate
    });
    assert(t4.reply.includes('أستاذة نور'), 'Addresses patient as "أستاذة نور"');

    // ----------------------------------------------------------------
    // TEST 4: Unisex Name "إسلام" with Masculine Marker ("عايز")
    // ----------------------------------------------------------------
    console.log('\n--- TEST 4: Unisex Name "إسلام" with Masculine Marker ("عايز") ---');
    let e1 = await receptionistAgent.processChatMessage({
        message: 'إسلام',
        sessionId: 'test_unisex_2',
        sessionData: { awaitingName: true },
        currentDate: mockDate
    });
    assert(e1.state.userName === 'إسلام', 'userName saved as "إسلام"');
    assert(e1.state.userGender === 'unisex', 'userGender is unisex initially');
    assert(e1.reply === 'أهلاً بك يا فندم! نورت عيادتنا، إزاي أقدر أساعدك؟', 'Neutral response given initially');

    let e2 = await receptionistAgent.processChatMessage({
        message: 'عايز أحجز كشف أسنان يوم الأربعاء',
        sessionId: 'test_unisex_2',
        sessionData: e1.state,
        currentDate: mockDate
    });
    assert(e2.state.userGender === 'male', 'userGender dynamically locked to male via "عايز"');
    assert(e2.reply.includes('تحب'), 'Masculine verb "تحب" used');

    // ----------------------------------------------------------------
    // TEST 5: Context Clues: "فاضية" (female) vs "فاضي" (male)
    // ----------------------------------------------------------------
    console.log('\n--- TEST 5: Context Clues ("فاضية" vs "فاضي") ---');
    const femaleDetect = genderUtils.detectGender({ text: 'أنا فاضية بكرة' });
    const maleDetect = genderUtils.detectGender({ text: 'أنا فاضي بكرة' });
    assert(femaleDetect === 'female', '"فاضية" detected as female');
    assert(maleDetect === 'male', '"فاضي" detected as male');

    // ----------------------------------------------------------------
    // TEST 6: Context Clues: "ممكن أجيي" (female) vs "ممكن أجي" (male)
    // ----------------------------------------------------------------
    console.log('\n--- TEST 6: Context Clues ("ممكن أجيي" vs "ممكن أجي") ---');
    const fAji = genderUtils.detectGender({ text: 'ممكن أجيي الساعة 5؟' });
    const mAji = genderUtils.detectGender({ text: 'ممكن أجي الساعة 5؟' });
    assert(fAji === 'female', '"ممكن أجيي" detected as female');
    assert(mAji === 'male', '"ممكن أجي" detected as male');

    // ----------------------------------------------------------------
    // TEST 7: Explicit Names Remain Unchanged
    // ----------------------------------------------------------------
    console.log('\n--- TEST 7: Explicit Names Remain Unchanged ---');
    let m1 = await receptionistAgent.processChatMessage({
        message: 'محمود',
        sessionId: 'test_unisex_3',
        sessionData: { awaitingName: true },
        currentDate: mockDate
    });
    assert(m1.state.userGender === 'male', 'Explicit name "محمود" immediately locked as male');
    assert(m1.reply.includes('أستاذ محمود'), 'Greets "أستاذ محمود"');

    let s1 = await receptionistAgent.processChatMessage({
        message: 'سارة',
        sessionId: 'test_unisex_4',
        sessionData: { awaitingName: true },
        currentDate: mockDate
    });
    assert(s1.state.userGender === 'female', 'Explicit name "سارة" immediately locked as female');
    assert(s1.reply.includes('أستاذة سارة'), 'Greets "أستاذة سارة"');

    console.log('\n================================================================');
    console.log(`TEST RESULTS: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
