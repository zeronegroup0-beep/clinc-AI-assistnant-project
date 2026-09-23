const appointmentService = require('../services/appointmentService');
const receptionistAgent = require('../services/receptionistAgent');

async function testAll() {
    console.log('=== TESTING NEW CLINIC AI FEATURES ===\n');

    let passed = 0;
    let total = 0;

    function assert(name, condition, extra = '') {
        total++;
        if (condition) {
            console.log(`✅ PASS: ${name}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${name} ${extra}`);
        }
    }

    // 1. Blacklist Test
    console.log('--- 1. Testing Blacklist Words ---');
    const blacklist = appointmentService.getBlacklist();
    assert('Normal words not in blacklist', 
        !blacklist.includes('عايز') && 
        !blacklist.includes('كشف') && 
        !blacklist.includes('اسنان') && 
        !blacklist.includes('ازيك') && 
        !blacklist.includes('دكتور'),
        `Blacklist contains unexpected words`
    );
    assert('Real abuse is detected', 
        appointmentService.isWordBlacklisted('حمار'),
        'Abuse should be detected'
    );
    assert('Normal inquiry is clean', 
        !appointmentService.isWordBlacklisted('عايز احجز كشف اسنان مع دكتور احمد'),
        'Normal clinic query should be clean'
    );

    // 2. 5-Digit Pure Numeric Booking Code Test
    console.log('\n--- 2. Testing 5-Digit Booking Code ---');
    const bookingCode = appointmentService.generateBookingId();
    assert('Booking code is exactly 5 digits', /^\d{5}$/.test(bookingCode), `Got ${bookingCode}`);

    // Create a real appointment and cancel it with 5-digit code
    const sampleDate = '2026-10-15';
    const sampleTime = '04:00 مساءً';
    const appt = await appointmentService.bookAppointment({
        doctor: 'د. أحمد شريف',
        date: sampleDate,
        time: sampleTime,
        patientName: 'أحمد محمود فؤاد',
        phone: '01012345678'
    });
    assert('Appointment booked with 5-digit code', /^\d{5}$/.test(appt.bookingId), `Got ${appt.bookingId}`);

    const cancelResult1 = await appointmentService.cancelAppointment({
        bookingId: appt.bookingId
    });
    assert('Cancelled using pure 5-digit code', cancelResult1.success, JSON.stringify(cancelResult1));

    // Book another and cancel with SC- prefix
    const appt2 = await appointmentService.bookAppointment({
        doctor: 'د. أحمد شريف',
        date: sampleDate,
        time: sampleTime,
        patientName: 'أحمد محمود فؤاد',
        phone: '01012345678'
    });
    const cancelResult2 = await appointmentService.cancelAppointment({
        bookingId: `SC-${appt2.bookingId}`
    });
    assert('Cancelled using SC- prefixed code', cancelResult2.success, JSON.stringify(cancelResult2));

    // 3. Strict Triple-Name Enforcement Test
    console.log('\n--- 3. Testing Strict Triple-Name Enforcement ---');
    // Simulate booking flow reaching AWAITING_NAME
    const sessionStateAwaitingName = {
        step: 'AWAITING_NAME',
        awaitingName: true,
        pendingBooking: {
            doctor: 'د. أحمد شريف',
            date: '2026-10-15',
            time: '04:00 مساءً'
        }
    };

    // Single name test
    const singleNameRes = await receptionistAgent.processChatMessage({
        message: 'محمود',
        sessionId: 'test_name_1',
        sessionData: { ...sessionStateAwaitingName }
    });
    assert('Single name rejected', 
        singleNameRes.state.awaitingName === true && 
        (singleNameRes.reply.includes('الثلاثي') || singleNameRes.reply.includes('3 كلمات')),
        singleNameRes.reply
    );

    // Double name test
    const doubleNameRes = await receptionistAgent.processChatMessage({
        message: 'سارة حسن',
        sessionId: 'test_name_2',
        sessionData: { ...sessionStateAwaitingName }
    });
    assert('Double name rejected', 
        doubleNameRes.state.awaitingName === true && 
        (doubleNameRes.reply.includes('الثلاثي') || doubleNameRes.reply.includes('3 كلمات')),
        doubleNameRes.reply
    );

    // Triple name test
    const tripleNameRes = await receptionistAgent.processChatMessage({
        message: 'محمود حسن علي',
        sessionId: 'test_name_3',
        sessionData: { ...sessionStateAwaitingName }
    });
    assert('Triple name accepted and asks for phone', 
        tripleNameRes.state.patientName === 'محمود حسن علي' &&
        (tripleNameRes.state.step === 'AWAITING_PHONE' || tripleNameRes.state.awaitingPhone === true),
        JSON.stringify(tripleNameRes.state)
    );

    // 4. Natural Time & Day Resolution Test
    console.log('\n--- 4. Testing Time and Day Resolution ---');
    
    // Test bare "4" when slots are ['04:00 مساءً', '05:00 مساءً']
    const slots = ['04:00 مساءً', '05:00 مساءً', '06:00 مساءً', '07:00 مساءً'];
    const resolvedSlotBare4 = receptionistAgent.resolveSlotFromSelection('4', slots);
    assert('"4" resolves to 04:00 مساءً (NOT index 4/07:00)', resolvedSlotBare4 === '04:00 مساءً', `Got ${resolvedSlotBare4}`);

    const resolvedSlot4Half = receptionistAgent.resolveSlotFromSelection('4 ونص', ['04:00 مساءً', '04:30 مساءً', '05:00 مساءً']);
    assert('"4 ونص" resolves to 04:30 مساءً', resolvedSlot4Half === '04:30 مساءً', `Got ${resolvedSlot4Half}`);

    const extractedTime4 = receptionistAgent.extractTimeSlot('عايز الساعة 4');
    assert('extractTimeSlot extracts 4:00 مساءً from "الساعة 4"', extractedTime4 === '4:00 مساءً' || extractedTime4 === '04:00 مساءً', `Got ${extractedTime4}`);

    const extractedTimeSun4 = receptionistAgent.extractTimeSlot('الحد 4');
    assert('extractTimeSlot extracts 4:00 مساءً from "الحد 4"', extractedTimeSun4 === '4:00 مساءً' || extractedTimeSun4 === '04:00 مساءً', `Got ${extractedTimeSun4}`);

    const extractedTimeSun4EN = receptionistAgent.extractTimeSlot('Sunday 4');
    assert('extractTimeSlot extracts 4:00 مساءً from "Sunday 4"', extractedTimeSun4EN === '4:00 مساءً' || extractedTimeSun4EN === '04:00 مساءً', `Got ${extractedTimeSun4EN}`);

    // 5. Human Takeover Test
    console.log('\n--- 5. Testing Human Takeover Request ---');
    const takeoverRes = await receptionistAgent.processChatMessage({
        message: 'عايز اكلم حد من السكرتارية ضروري',
        sessionId: 'test_takeover_1',
        sessionData: {}
    });
    assert('Takeover requested in state', takeoverRes.state.takeoverRequested === true, JSON.stringify(takeoverRes.state));
    assert('Takeover reply offers human agent handover', takeoverRes.reply.includes('موظف الاستقبال') || takeoverRes.reply.includes('السكرتارية'), takeoverRes.reply);

    // 6. English Interaction Test
    console.log('\n--- 6. Testing English Interaction ---');
    const englishGreetingRes = await receptionistAgent.processChatMessage({
        message: 'Hello, what services do you offer?',
        sessionId: 'test_en_1',
        sessionData: {}
    });
    assert('English greeting handled in English', /Smart Clinic|consultant|service/i.test(englishGreetingRes.reply), englishGreetingRes.reply);

    console.log(`\n========================================`);
    console.log(`NEW FEATURES VERIFICATION: ${passed}/${total} TESTS PASSED`);
    console.log(`========================================`);

    process.exit(passed === total ? 0 : 1);
}

testAll().catch(err => {
    console.error(err);
    process.exit(1);
});
