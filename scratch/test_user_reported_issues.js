const { processChatMessage } = require('../services/receptionistAgent');
const assert = require('assert');

async function runTests() {
    console.log('=== TEST 1: Awaiting Name with Intent Phrase ("كنت حابب احجز كشف") ===');
    const res1 = await processChatMessage({
        message: 'كنت حابب احجز كشف',
        sessionId: 'test_name_fix',
        sessionData: { awaitingName: true }
    });
    console.log('Reply 1:\n', res1.reply);
    console.log('PatientName:', res1.state.patientName);
    assert.strictEqual(res1.state.patientName, undefined, 'patientName must NOT be set to intent phrase');
    assert.ok(!res1.reply.includes('أستاذ أستاذ'), 'Must NOT have duplicate "أستاذ أستاذ"');
    assert.ok(res1.reply.includes('نورت عيادتنا سمارت كلينك'), 'Must return standard generic welcome');
    console.log('✅ Test 1 Passed!\n');

    console.log('=== TEST 2: General Monday Schedule Inquiries with "الاتنين" and "الاثنين" ===');
    // Test 2a: with الاتنين
    const res2a = await processChatMessage({
        message: 'كنت حابب اشوف كل مواعيد يوم الاتنين',
        sessionId: 'test_mon_fix_1',
        sessionData: {
            doctor_id: 'dr_ahmed',
            bookingDraft: { doctor: 'د. أحمد شريف' }
        }
    });
    console.log('Reply 2a (الاتنين):\n', res2a.reply);
    assert.ok(!res2a.reply.includes('معلش المتاح'), 'Must NOT reply with non-exact apology');
    assert.ok(res2a.reply.includes('5:30') && res2a.reply.includes('6:30') && res2a.reply.includes('7:30'), 'Must list all available Monday slots');
    console.log('✅ Test 2a Passed!\n');

    // Test 2b: with الاثنين
    const res2b = await processChatMessage({
        message: 'كنت حابب اشوف كل مواعيد يوم الاثنين',
        sessionId: 'test_mon_fix_2',
        sessionData: {
            doctor_id: 'dr_ahmed',
            bookingDraft: { doctor: 'د. أحمد شريف' }
        }
    });
    console.log('Reply 2b (الاثنين):\n', res2b.reply);
    assert.ok(!res2b.reply.includes('معلش المتاح'), 'Must NOT reply with non-exact apology');
    assert.ok(res2b.reply.includes('5:30') && res2b.reply.includes('6:30') && res2b.reply.includes('7:30'), 'Must list all available Monday slots');
    console.log('✅ Test 2b Passed!\n');

    console.log('=== TEST 3: Post-Booking Follow-Up Flow ===');
    // Simulate booking confirmation turn
    const res3_book = await processChatMessage({
        message: '01012345678',
        sessionId: 'test_post_booking',
        sessionData: {
            patientName: 'أحمد محمود',
            pendingBooking: {
                doctor: 'د. أحمد شريف',
                date: 'يوم الإثنين (2026-09-21)',
                time: '6:30 مساءً',
                specialty: 'طب وجراحة الأسنان'
            }
        }
    });
    console.log('Booking Confirmation Reply:\n', res3_book.reply);
    assert.ok(res3_book.reply.includes('تم تأكيد حجز حضرتك'), 'Must confirm appointment');
    assert.ok(res3_book.reply.includes('تحب نحجز لحضرتك كشف تاني'), 'Must ask if user wants another doctor or to conclude session');
    assert.strictEqual(res3_book.state.postBookingFlow?.step, 'AWAITING_ADDITIONAL_DECISION', 'Must set postBookingFlow step');
    console.log('✅ Booking confirmation follow-up question verified!\n');

    // Scenario 3a: User declines additional booking (conclude session)
    const res3_conclude = await processChatMessage({
        message: 'لا شكراً كده تمام كفاية',
        sessionId: 'test_post_booking',
        sessionData: res3_book.state
    });
    console.log('Reply 3a (Conclude Session):\n', res3_conclude.reply);
    assert.ok(res3_conclude.reply.includes('حجز حضرتك مؤكد بالكامل'), 'Must politely conclude session');
    assert.strictEqual(res3_conclude.state.postBookingFlow, undefined, 'postBookingFlow must be cleared');
    console.log('✅ Test 3a Passed (Session Concluded)!\n');

    // Scenario 3b: User wants to add a specific doctor
    const res3_addDoctor = await processChatMessage({
        message: 'عايز احجز مع دكتورة سارة للجلدية',
        sessionId: 'test_post_booking_2',
        sessionData: res3_book.state
    });
    console.log('Reply 3b (Add Dr. Sara):\n', res3_addDoctor.reply);
    assert.ok(res3_addDoctor.reply.includes('سارة') && res3_addDoctor.reply.includes('الجلدية'), 'Must transition to booking Dr. Sara');
    assert.strictEqual(res3_addDoctor.state.bookingDraft.doctor_id, 'dr_sara');
    console.log('✅ Test 3b Passed (Add Doctor)!\n');

    // Scenario 3c: User wants another checkup generically
    const res3_genericAdd = await processChatMessage({
        message: 'اه كنت عايز كشف تاني',
        sessionId: 'test_post_booking_3',
        sessionData: res3_book.state
    });
    console.log('Reply 3c (Generic Add):\n', res3_genericAdd.reply);
    assert.ok(res3_genericAdd.reply.includes('د. سارة') && res3_genericAdd.reply.includes('د. حسام'), 'Must present doctor options');
    console.log('✅ Test 3c Passed (Generic Add)!\n');

    console.log('=== TEST 4: Waitlist Registration Follow-Up Flow (The Exact User Screenshot Case) ===');
    // User provides phone 01010645449 while in awaitingWaitlist
    const res4_waitlist = await processChatMessage({
        message: '01010645449',
        sessionId: 'test_waitlist_case',
        sessionData: {
            awaitingWaitlist: true,
            waitlistSlot: {
                doctor: 'د. أحمد شريف',
                date: 'يوم الإثنين (2026-09-21)',
                time: '4:30 مساءً'
            }
        }
    });
    console.log('Waitlist Reply:\n', res4_waitlist.reply);
    assert.ok(res4_waitlist.reply.includes('01010645449'), 'Must include phone');
    assert.ok(res4_waitlist.reply.includes('قائمة الانتظار'), 'Must include waitlist confirmation');
    assert.ok(res4_waitlist.reply.includes('تحب نحجز لحضرتك كشف تاني'), 'Must ask if user wants to book another doctor or conclude');
    assert.strictEqual(res4_waitlist.state.postBookingFlow?.step, 'AWAITING_ADDITIONAL_DECISION', 'Must set postBookingFlow step');
    assert.strictEqual(res4_waitlist.state.postBookingFlow?.isWaitlist, true, 'isWaitlist must be true');
    console.log('✅ Test 4 Waitlist Confirmation Prompt Verified!\n');

    // Scenario 4a: User declines additional booking after waitlist
    const res4_conclude = await processChatMessage({
        message: 'لا نكتفي بالتسجيل ده شكراً',
        sessionId: 'test_waitlist_case',
        sessionData: res4_waitlist.state
    });
    console.log('Waitlist Conclude Reply:\n', res4_conclude.reply);
    assert.ok(res4_conclude.reply.includes('مسجل بنجاح في قائمة الانتظار'), 'Must acknowledge waitlist in conclusion');
    assert.strictEqual(res4_conclude.state.postBookingFlow, undefined, 'postBookingFlow cleared');
    console.log('✅ Test 4a Passed (Waitlist Conclude)!\n');

    // Scenario 4b: User decides to book another doctor after waitlist
    const res4_anotherDoc = await processChatMessage({
        message: 'تحب نحجز مع دكتورة مريم عيون',
        sessionId: 'test_waitlist_case_2',
        sessionData: res4_waitlist.state
    });
    console.log('Waitlist to Dr. Mariam Reply:\n', res4_anotherDoc.reply);
    assert.ok(res4_anotherDoc.reply.includes('مريم') && res4_anotherDoc.reply.includes('العيون'), 'Must transition to Dr. Mariam');
    assert.strictEqual(res4_anotherDoc.state.bookingDraft.doctor_id, 'dr_mariam');
    console.log('✅ Test 4b Passed (Waitlist to Another Doctor)!\n');

    console.log('🎉 ALL TESTS INCLUDING WAITLIST FOLLOW-UP VERIFIED SUCCESSFULLY!');
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
