const { processChatMessage } = require('../services/receptionistAgent');

async function runTests() {
    console.log('=== STARTING CRITICAL PATCH VERIFICATION ===\n');
    let totalTests = 0;
    let passedTests = 0;

    function assert(condition, message) {
        totalTests++;
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passedTests++;
        } else {
            console.error(`❌ FAIL: ${message}`);
        }
    }

    const refDate = new Date(2026, 8, 12, 10, 0); // Saturday 12-09-2026 at 10:00 AM

    // -------------------------------------------------------------
    // TEST 1: Female Dynamic Gender & Pronoun Agreement
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Female Gender Alignment ---');
    const fTurn1 = await processChatMessage({
        message: 'أنا اسمي سارة حسن وعايزة استفسر عن المواعيد',
        sessionId: 'sess_female_1',
        sessionData: {},
        currentDate: refDate
    });

    assert(fTurn1.state.gender === 'female', 'Session state records gender as female');
    assert(fTurn1.state.patientName === 'سارة حسن', 'Patient name extracted as سارة حسن');
    assert(fTurn1.reply.includes('أستاذة سارة حسن'), 'Addressed as أستاذة سارة حسن');
    assert(fTurn1.reply.includes('نورتِ'), 'Feminine greeting: نورتِ');
    assert(fTurn1.reply.includes('حابة تستفسري'), 'Feminine inquiry: حابة تستفسري');
    assert(fTurn1.reply.includes('تحبي') && fTurn1.reply.includes('تحجزي'), 'Feminine verbs: تحبي تحجزي');
    assert(!fTurn1.reply.includes('أستاذ سارة'), 'No masculine honorific with feminine name');
    assert(!fTurn1.reply.includes('حابب تستفسر'), 'No masculine verb with feminine name');

    // -------------------------------------------------------------
    // TEST 2: Male Dynamic Gender & Pronoun Agreement
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Male Gender Alignment ---');
    const mTurn1 = await processChatMessage({
        message: 'معاك أستاذ محمود وعايز احجز',
        sessionId: 'sess_male_1',
        sessionData: {},
        currentDate: refDate
    });

    assert(mTurn1.state.gender === 'male', 'Session state records gender as male');
    assert(mTurn1.state.patientName === 'محمود', 'Patient name extracted as محمود');
    assert(mTurn1.reply.includes('أستاذ محمود'), 'Addressed as أستاذ محمود');
    assert(mTurn1.reply.includes('نورت'), 'Masculine greeting: نورت');
    assert(mTurn1.reply.includes('تحب') || mTurn1.reply.includes('حابب'), 'Masculine verb: تحب / حابب');
    assert(!mTurn1.reply.includes('أستاذة محمود'), 'No feminine honorific with male name');
    assert(!mTurn1.reply.includes('نورتِ'), 'No feminine suffix for male');

    // -------------------------------------------------------------
    // TEST 3: Strict Entity Filtering (No More "Full Menu" Dumping)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Strict Entity Filtering ---');
    const filterTurn1 = await processChatMessage({
        message: 'مواعيد دكتور أحمد شريف إيه؟',
        sessionId: 'sess_filter_1',
        sessionData: {},
        currentDate: refDate
    });

    assert(filterTurn1.reply.includes('د. أحمد شريف'), 'Includes requested Dr. Ahmed');
    assert(!filterTurn1.reply.includes('سارة محمود'), 'Does NOT dump Dr. Sara');
    assert(!filterTurn1.reply.includes('حسام فتحي'), 'Does NOT dump Dr. Hossam');
    assert(!filterTurn1.reply.includes('مريم نبيل'), 'Does NOT dump Dr. Mariam');

    // General menu inquiry CAN dump all 4
    const generalTurn = await processChatMessage({
        message: 'مين دكاترة العيادة والتخصصات؟',
        sessionId: 'sess_general_1',
        sessionData: {},
        currentDate: refDate
    });
    assert(generalTurn.reply.includes('أحمد شريف') && generalTurn.reply.includes('سارة محمود'), 'General inquiry shows all doctors');

    // -------------------------------------------------------------
    // TEST 4: Today's Date Handling & Finished Slots Guard
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Today Finished Slots Guard ---');
    // Simulate Saturday night at 23:00 (11:00 PM) - all Saturday slots finished
    const lateNightDate = new Date(2026, 8, 12, 23, 0); 

    const finishedTurn = await processChatMessage({
        message: 'فاضيين النهاردة مع دكتور أحمد؟',
        sessionId: 'sess_today_finished_1',
        sessionData: {},
        currentDate: lateNightDate
    });

    assert(finishedTurn.reply.includes('مواعيد النهاردة خلصت أو انتهت'), 'States that today slots are finished');
    assert(finishedTurn.reply.includes('أول يوم عمل قادم وهو يوم الإثنين (2026-09-14)'), 'Offers Monday 2026-09-14 as next working day without silent jump');

    // Past slot today at 17:00 (5:00 PM) asking for 4:00 PM
    const afternoonDate = new Date(2026, 8, 12, 17, 0); // 5:00 PM
    const pastSlotTurn = await processChatMessage({
        message: 'عايز أحجز مع دكتور أحمد النهاردة الساعة 4:00 مساءً',
        sessionId: 'sess_past_slot_1',
        sessionData: {},
        currentDate: afternoonDate
    });
    assert(pastSlotTurn.reply.includes('انتهى') || pastSlotTurn.reply.includes('خلصت'), 'Warns that requested time today has passed');
    assert(pastSlotTurn.reply.includes('أول يوم عمل قادم'), 'Offers next working day');

    // -------------------------------------------------------------
    // TEST 5: Time Slot Negotiation & Lock-in ("خيلها 6")
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Negotiation & Lock-in ("خيلها 6") ---');
    // Turn 1: Ask for Dr. Ahmed on Wednesday
    const negTurn1 = await processChatMessage({
        message: 'فاضيين يوم الأربعاء مع دكتور أحمد؟',
        sessionId: 'sess_neg_1',
        sessionData: {},
        currentDate: refDate
    });
    assert(negTurn1.suggestedSlots && negTurn1.suggestedSlots.length > 0, 'Offers Wednesday slots');

    // Turn 2: User responds with typo negotiation "خيلها 6"
    const negTurn2 = await processChatMessage({
        message: 'خيلها 6',
        sessionId: 'sess_neg_1',
        sessionData: negTurn1.state,
        currentDate: refDate
    });

    assert(negTurn2.state.bookingDraft && negTurn2.state.bookingDraft.time && negTurn2.state.bookingDraft.time.includes('6:00'), 'Locks 6:00 PM into booking draft');
    assert(negTurn2.state.pendingBooking && negTurn2.state.pendingBooking.time && negTurn2.state.pendingBooking.time.includes('6:00'), 'Sets pendingBooking with 6:00 PM');
    assert(negTurn2.reply.includes('الواتساب'), 'Smoothly transitions to asking for WhatsApp number');
    assert(!negTurn2.reply.includes('تحب حضرتك تحجز يوم إيه'), 'Does NOT loop back to asking for day');

    // Turn 3: User provides phone and name
    const negTurn3 = await processChatMessage({
        message: 'اسمي كريم ورقمي 01012345678',
        sessionId: 'sess_neg_1',
        sessionData: negTurn2.state,
        currentDate: refDate
    });
    assert(negTurn3.card && negTurn3.card.type === 'booking_confirmed', 'Booking confirmed successfully');
    assert(negTurn3.card.patientName === 'كريم', 'Name extracted cleanly without ورقمي');
    assert(negTurn3.reply.includes('تنورنا في العيادة'), 'Masculine closing: تنورنا في العيادة');

    // -------------------------------------------------------------
    // TEST 6: Female Negotiation & Full Confirmation Flow
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Female Negotiation & Full Flow ---');
    // Turn 1: Female introduction & day
    const fFlowTurn1 = await processChatMessage({
        message: 'أنا اسمي سارة حسن وعايزة ميعاد مع دكتور أحمد يوم الأربعاء',
        sessionId: 'sess_flow_f',
        sessionData: {},
        currentDate: refDate
    });
    assert(fFlowTurn1.state.gender === 'female', 'Flow recognizes female gender');

    // Turn 2: Pick 5 with negotiation (since 6 was booked by Karim in Test 5)
    const fFlowTurn2 = await processChatMessage({
        message: 'خليها 5',
        sessionId: 'sess_flow_f',
        sessionData: fFlowTurn1.state,
        currentDate: refDate
    });
    assert(fFlowTurn2.reply.includes('أستاذة سارة حسن'), 'Keeps feminine honorific in negotiation turn');
    assert(fFlowTurn2.reply.includes('الواتساب'), 'Transitions to WhatsApp number prompt');

    // Turn 3: Provide phone
    const fFlowTurn3 = await processChatMessage({
        message: '01099887766',
        sessionId: 'sess_flow_f',
        sessionData: fFlowTurn2.state,
        currentDate: refDate
    });
    assert(fFlowTurn3.card && fFlowTurn3.card.type === 'booking_confirmed', 'Female booking confirmed');
    assert(fFlowTurn3.reply.includes('تنورينا في العيادة'), 'Feminine closing: تنورينا في العيادة');

    console.log(`\n=== RESULTS: ${passedTests} / ${totalTests} TESTS PASSED ===`);
    if (passedTests === totalTests) {
        console.log('🎉 ALL CRITICAL PATCH TESTS PASSED PERFECTLY!\n');
    } else {
        console.error('⚠️ SOME TESTS FAILED!\n');
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal error in tests:', err);
    process.exit(1);
});
