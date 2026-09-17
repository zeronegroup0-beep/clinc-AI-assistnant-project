const receptionistAgent = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');

async function runTests() {
    console.log('================================================================');
    console.log('🧪 TESTING: Standalone Name Extraction & Waitlist Intent Routing');
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
    // TEST 1: Standalone Name "محمود" in AWAITING_NAME State
    // ----------------------------------------------------------------
    console.log('--- TEST 1: Standalone Name "محمود" ---');
    // Turn 1: Bot asks for name
    let t1 = await receptionistAgent.processChatMessage({
        message: 'صباح الخير',
        sessionId: 'test_name_1',
        sessionData: {},
        currentDate: mockDate
    });
    assert(t1.state.awaitingName === true, 'Turn 1 sets awaitingName = true');

    // Turn 2: User responds with standalone name "محمود"
    let t2 = await receptionistAgent.processChatMessage({
        message: 'محمود',
        sessionId: 'test_name_1',
        sessionData: t1.state,
        currentDate: mockDate
    });
    assert(t2.state.userName === 'محمود', 'userName saved as "محمود"');
    assert(t2.state.patientName === 'محمود', 'patientName saved as "محمود"');
    assert(!t2.state.awaitingName, 'awaitingName cleared');
    assert(t2.reply.includes('أستاذ محمود'), 'Reply includes "أستاذ محمود"');
    assert(t2.reply.includes('إزاي أقدر أساعدك النهاردة'), 'Reply transitions to: إزاي أقدر أساعدك النهاردة');

    // ----------------------------------------------------------------
    // TEST 2: Standalone Name "علي حسام" (2 words)
    // ----------------------------------------------------------------
    console.log('\n--- TEST 2: Standalone Name "علي حسام" ---');
    let t3 = await receptionistAgent.processChatMessage({
        message: 'علي حسام',
        sessionId: 'test_name_2',
        sessionData: { awaitingName: true },
        currentDate: mockDate
    });
    assert(t3.state.userName === 'علي حسام', 'userName saved as "علي حسام"');
    assert(!t3.state.awaitingName, 'awaitingName cleared');
    assert(t3.reply.includes('أستاذ علي حسام'), 'Reply includes "أستاذ علي حسام"');

    // ----------------------------------------------------------------
    // TEST 3: Standalone Female Name "سارة"
    // ----------------------------------------------------------------
    console.log('\n--- TEST 3: Standalone Female Name "سارة" ---');
    let t4 = await receptionistAgent.processChatMessage({
        message: 'سارة',
        sessionId: 'test_name_3',
        sessionData: { awaitingName: true },
        currentDate: mockDate
    });
    assert(t4.state.userName === 'سارة', 'userName saved as "سارة"');
    assert(t4.state.gender === 'female', 'gender detected as female');
    assert(t4.reply.includes('أستاذة سارة'), 'Reply includes feminine honorific "أستاذة سارة"');

    // ----------------------------------------------------------------
    // TEST 4: Standalone Name "نور" (Previously blacklisted)
    // ----------------------------------------------------------------
    console.log('\n--- TEST 4: Standalone Name "نور" ---');
    let t5 = await receptionistAgent.processChatMessage({
        message: 'نور',
        sessionId: 'test_name_4',
        sessionData: { awaitingName: true },
        currentDate: mockDate
    });
    assert(t5.state.userName === 'نور', 'userName saved as "نور"');
    assert(!t5.state.awaitingName, 'awaitingName cleared');
    assert(t5.reply.includes('نور'), 'Reply includes "نور"');

    // ----------------------------------------------------------------
    // TEST 5: Standalone Name "نور احمد"
    // ----------------------------------------------------------------
    console.log('\n--- TEST 5: Standalone Name "نور احمد" ---');
    let t6 = await receptionistAgent.processChatMessage({
        message: 'نور احمد',
        sessionId: 'test_name_5',
        sessionData: { awaitingName: true },
        currentDate: mockDate
    });
    assert(t6.state.userName === 'نور احمد', 'userName saved as "نور احمد"');
    assert(!t6.state.awaitingName, 'awaitingName cleared');

    // ----------------------------------------------------------------
    // TEST 6: Refusal "مش هقول"
    // ----------------------------------------------------------------
    console.log('\n--- TEST 6: Refusal "مش هقول" ---');
    let t7 = await receptionistAgent.processChatMessage({
        message: 'مش هقول',
        sessionId: 'test_name_6',
        sessionData: { awaitingName: true },
        currentDate: mockDate
    });
    assert(!t7.state.userName, 'userName is not set on refusal');
    assert(!t7.state.awaitingName, 'awaitingName cleared on refusal');
    assert(!t7.reply.includes('اسم حضرتك'), 'Does not re-ask for the name');
    assert(t7.reply.includes('براحتك تماماً'), 'Polite refusal response given');

    // ----------------------------------------------------------------
    // TEST 7: Waitlist Intent Routing (With Phone in Same Turn)
    // ----------------------------------------------------------------
    console.log('\n--- TEST 7: Waitlist Intent Routing (Immediate Phone) ---');
    // Mon 4:30 PM is pre-booked
    let w1 = await receptionistAgent.processChatMessage({
        message: 'عايز أحجز مع دكتور أحمد يوم الإثنين الساعة 4:30 مساءً',
        sessionId: 'test_wl_1',
        sessionData: { userName: 'محمود', patientName: 'محمود', gender: 'male' },
        currentDate: mockDate
    });
    assert(w1.state.awaitingWaitlist === true, 'Collided slot sets awaitingWaitlist = true');
    assert(w1.reply.includes('قائمة الانتظار'), 'Bot offers waitlist option');

    // User chooses waitlist with phone:
    let w2 = await receptionistAgent.processChatMessage({
        message: 'سجلني في قائمة الانتظار ورقمي 01011223344',
        sessionId: 'test_wl_1',
        sessionData: w1.state,
        currentDate: mockDate
    });
    assert(w2.reply.includes('تسجيل طلبك بالرقم (01011223344) في قائمة الانتظار'), 'Reply has exact confirmation with phone echo');
    assert(w2.state.sessionState === 'WAITLIST_CONFIRMATION', 'Transitions to WAITLIST_CONFIRMATION');
    assert(w2.reply.includes('دكتور د. أحمد شريف') || w2.reply.includes('د. أحمد شريف'), 'Reply mentions doctor name');
    assert(w2.reply.includes('أستاذ محمود'), 'Reply addresses user as أستاذ محمود');
    assert(w2.reply.includes('أول ما يفضى ميعاد هنتواصل مع حضرتك فوراً على الواتساب'), 'Polite wrap-up offered');
    assert(!w2.reply.includes('• 5:30 مساءً'), 'Strictly forbidden from re-displaying time slots');

    // ----------------------------------------------------------------
    // TEST 8: Waitlist Intent Routing ("لا سجل رقمي أفضل" - No Phone Yet)
    // ----------------------------------------------------------------
    console.log('\n--- TEST 8: Waitlist Intent Routing (Two-Turn Flow: Intent then Phone) ---');
    let w3 = await receptionistAgent.processChatMessage({
        message: 'عايز أحجز مع دكتور أحمد يوم الإثنين الساعة 4:30 مساءً',
        sessionId: 'test_wl_2',
        sessionData: { userName: 'سارة', patientName: 'سارة', gender: 'female' },
        currentDate: mockDate
    });

    // User chooses waitlist without providing phone in this message:
    let w4 = await receptionistAgent.processChatMessage({
        message: 'لا سجل رقمي أفضل',
        sessionId: 'test_wl_2',
        sessionData: w3.state,
        currentDate: mockDate
    });
    assert(w4.state.awaitingWaitlist === true, 'Remains in awaitingWaitlist state');
    assert(w4.state.awaitingPhone === true, 'Sets awaitingPhone = true');
    assert(w4.state.sessionState === 'WAITLIST_AWAITING_PHONE', 'Sets sessionState = WAITLIST_AWAITING_PHONE');
    assert(w4.reply.includes('رقم الواتساب'), 'Prompts for WhatsApp phone number');
    assert(!w4.reply.includes('• 5:30 مساءً'), 'Strictly forbidden from re-displaying doctor time slots');

    // User sends phone in next turn:
    let w5 = await receptionistAgent.processChatMessage({
        message: '01099887766',
        sessionId: 'test_wl_2',
        sessionData: w4.state,
        currentDate: mockDate
    });
    assert(w5.reply.includes('تسجيل طلبك بالرقم (01099887766) في قائمة الانتظار'), 'Reply confirms waitlist with phone echo');
    assert(w5.state.sessionState === 'WAITLIST_CONFIRMATION', 'Transitions to WAITLIST_CONFIRMATION');
    assert(w5.reply.includes('أستاذة سارة'), 'Feminine honorific used: أستاذة سارة');
    assert(w5.reply.includes('أول ما يفضى ميعاد هنتواصل مع حضرتك فوراً على الواتساب'), 'Polite wrap-up offered');
    assert(!w5.reply.includes('• 5:30 مساءً'), 'Strictly forbidden from re-displaying doctor time slots');

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
