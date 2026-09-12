const assert = require('assert');

async function runTests() {
    console.log('🧪 Starting Strict State Machine & Conversational Guardrails Tests...\n');

    const BASE_URL = 'http://localhost:5000/api/chat';

    // -------------------------------------------------------------
    // Test 1: Name Extraction Guard (Casual chat vs Real Name)
    // -------------------------------------------------------------
    console.log('▶ Test 1.1: Sending casual greeting ("أخبارك ايه")...');
    const sessionId1 = 'test_guardrails_name_' + Date.now();
    const res1 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'أخبارك ايه',
            sessionId: sessionId1
        })
    }).then(r => r.json());

    console.log('Reply 1.1:\n', res1.reply);
    assert(!res1.reply.includes('أخبارك ايه'), 'AI must NOT mistake "أخبارك ايه" for a person\'s name');
    assert(!res1.reply.includes('يا أخبارك'), 'AI must NOT address the user as "يا أخبارك"');
    assert(res1.reply.includes('الحمد لله') || res1.reply.includes('يا فندم') || res1.reply.includes('أهلاً'), 'Expected a natural polite response');
    console.log('✅ Test 1.1 PASSED: "أخبارك ايه" was NOT captured as a name.\n');

    console.log('▶ Test 1.2: Explicit Name Provision ("معاك كريم" / "أنا اسمي كريم")...');
    const res1b = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'أنا اسمي كريم',
            sessionId: sessionId1
        })
    }).then(r => r.json());

    console.log('Reply 1.2:\n', res1b.reply);
    assert(res1b.reply.includes('كريم'), 'AI must recognize the explicit name "كريم"');
    console.log('✅ Test 1.2 PASSED: Explicit name successfully recognized.\n');

    // -------------------------------------------------------------
    // Test 2: Doctor Schedule & Working Days Validation (Off-Day Defense)
    // -------------------------------------------------------------
    console.log('▶ Test 2: Inquiring for Dr. Ahmed on Sunday (Dr. Ahmed only works Sat, Mon, Wed)...');
    const sessionId2 = 'test_guardrails_offday_' + Date.now();
    const res2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'عايز أحجز كشف مع دكتور أحمد يوم الأحد الجاي',
            sessionId: sessionId2
        })
    }).then(r => r.json());

    console.log('Reply 2:\n', res2.reply);
    assert(res2.reply.includes('مش موجود') || res2.reply.includes('مش متاح') || res2.reply.includes('إجازة'), 'Expected off-day clarification message');
    assert(res2.reply.includes('السبت') || res2.reply.includes('الإثنين') || res2.reply.includes('الأربعاء'), 'Expected AI to mention available working days');
    // Ensure AI did NOT invent available slots for Sunday
    const hasSundaySlots = res2.suggestedSlots && res2.suggestedSlots.length > 0;
    assert(!hasSundaySlots, 'AI must NOT invent slots for a doctor\'s day off');
    console.log('✅ Test 2 PASSED: Doctor off-day correctly validated and working days presented.\n');

    // -------------------------------------------------------------
    // Test 3: Time Slot Matching & Half-Hour Handling
    // -------------------------------------------------------------
    console.log('▶ Test 3: Inquiring for Dr. Ahmed on Wednesday at 6:30 PM ("الساعة 6 ونص")...');
    const sessionId3 = 'test_guardrails_halfhour_' + Date.now();
    const res3 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'عايز أحجز مع دكتور أحمد يوم الأربعاء الساعة 6 ونص مساءً',
            sessionId: sessionId3
        })
    }).then(r => r.json());

    console.log('Reply 3:\n', res3.reply);
    // Nearest slots on Wed for Dr. Ahmed are 6:00 PM and 7:00 PM
    assert(res3.reply.includes('6') && res3.reply.includes('7'), 'Expected response to mention the closest slots (6 and 7)');
    assert(res3.reply.includes('معلش المتاح') || res3.reply.includes('أقرب') || res3.reply.includes('تماماً'), 'Expected non-exact slot polite clarification');
    console.log('✅ Test 3 PASSED: Half-hour non-exact slot matched to closest slots with intelligent suggestion.\n');

    // -------------------------------------------------------------
    // Test 4: Flow State Machine: Confirming Suggested Slot & Booking
    // -------------------------------------------------------------
    console.log('▶ Test 4.1: Confirming the suggested 6:00 PM slot ("تمام يناسبني الساعة 6")...');
    const res4a = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'تمام يناسبني الساعة 6',
            sessionId: sessionId3
        })
    }).then(r => r.json());

    console.log('Reply 4.1:\n', res4a.reply);
    assert(res4a.reply.includes('رقم') || res4a.reply.includes('الواتساب') || res4a.reply.includes('تليفون'), 'Expected prompt for phone number to lock appointment');
    console.log('✅ Test 4.1 PASSED: Choice locked and phone number requested.\n');

    console.log('▶ Test 4.2: Providing valid phone number ("01012345678")...');
    const res4b = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'رقمي 01012345678',
            sessionId: sessionId3
        })
    }).then(r => r.json());

    console.log('Reply 4.2:\n', res4b.reply);
    assert(res4b.reply.includes('تم') || res4b.reply.includes('تأكيد') || res4b.reply.includes('حجز'), 'Expected booking confirmation');
    console.log('✅ Test 4.2 PASSED: Appointment successfully confirmed with phone number.\n');

    // -------------------------------------------------------------
    // Test 5: Side Question during Booking without Slot Repeating
    // -------------------------------------------------------------
    console.log('▶ Test 5: Inquiring slots first, then asking price side question ("الكشف بكام؟")...');
    const sessionId5 = 'test_guardrails_sidequestion_' + Date.now();
    const res5a = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'فاضيين يوم الإثنين مع دكتور أحمد؟',
            sessionId: sessionId5
        })
    }).then(r => r.json());

    console.log('Reply 5.1 (Slots shown):\n', res5a.reply);
    assert(res5a.suggestedSlots && res5a.suggestedSlots.length > 0, 'Slots should be shown initially');

    const res5b = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'هو الكشف بكام؟',
            sessionId: sessionId5
        })
    }).then(r => r.json());

    console.log('Reply 5.2 (Side question):\n', res5b.reply);
    assert(res5b.reply.includes('300') || res5b.reply.includes('جنيه'), 'Expected price information');
    // Verify it doesn't just regurgitate the raw list of all 4 slots in the side question reply
    const hasRedundantFullSlotDump = res5b.suggestedSlots && res5b.suggestedSlots.length > 0;
    assert(!hasRedundantFullSlotDump, 'Side question should NOT re-dump slot buttons/list redundantly');
    console.log('✅ Test 5 PASSED: Side question answered cleanly without repeating the full slot list.\n');

    console.log('🎉 ALL 5 CRITICAL GUARDRAIL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
});
