const assert = require('assert');

async function runTests() {
    console.log('🧪 Starting Date Awareness & Availability Query Tests...\n');

    const BASE_URL = 'http://localhost:5000/api/chat';

    // -------------------------------------------------------------
    // Test 1: Relative Date Recognition ("فاضيين بكرة؟") & Direct Tool Execution
    // -------------------------------------------------------------
    console.log('▶ Test 1: Inquiring about tomorrow ("فاضيين بكرة؟")...');
    const res1 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'فاضيين بكرة مع دكتورة سارة؟',
            sessionId: 'test_date_session_1'
        })
    }).then(r => r.json());

    console.log('Reply:\n', res1.reply);
    console.log('Reasoning Steps:', res1.reasoningSteps);

    // Rule 1 Verification: Dynamic Date Injected
    const hasDateInjection = res1.reasoningSteps.some(s => s.includes('حقن التاريخ الحالي ديناميكياً'));
    assert(hasDateInjection, 'Expected dynamic current date injection in reasoning steps');

    // Rule 2 & 3 Verification: Target date resolved without asking "what day", direct check_availability tool execution
    const hasToolExecution = res1.reasoningSteps.some(s => s.includes('التنفيذ الفوري لأداة check_availability'));
    assert(hasToolExecution, 'Expected direct execution of check_availability');
    assert(!res1.reply.includes('يوم إيه'), 'AI must NEVER ask "what day" when user specified "بكرة"');
    assert(res1.suggestedSlots && res1.suggestedSlots.length > 0, 'Expected suggestedSlots to be populated');
    assert(res1.reply.includes('المواعيد المتاحة'), 'Expected reply to list available slots');
    console.log('✅ Test 1 PASSED: Tomorrow resolved and available slots returned directly.\n');

    // -------------------------------------------------------------
    // Test 2: Conversational Flow - Providing Time After Date Inquired
    // -------------------------------------------------------------
    console.log('▶ Test 2: Providing time in next turn ("الساعة 5")...');
    const res2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'الساعة 5',
            sessionId: 'test_date_session_1'
        })
    }).then(r => r.json());

    console.log('Reply:\n', res2.reply);
    console.log('Reasoning Steps:', res2.reasoningSteps);

    // Rule 4 Verification: No repetitive loop asking for day
    assert(!res2.reply.includes('يوم إيه'), 'AI must remember date from previous turn and not ask for day');
    assert(res2.reply.includes('الميعاد متاح') || res2.reply.includes('رقم الواتساب'), 'Expected prompt for WhatsApp to confirm slot');
    console.log('✅ Test 2 PASSED: AI remembered tomorrow\'s date, evaluated 5:00 PM slot, and prompted for phone without looping.\n');

    // -------------------------------------------------------------
    // Test 3: Weekday Recognition & Context Switch ("احجزلي الإثنين", then "الكشف بكام؟")
    // -------------------------------------------------------------
    console.log('▶ Test 3: Weekday inquiry ("احجزلي الإثنين") and price question ("الكشف بكام؟")...');
    const res3 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'احجزلي الإثنين',
            sessionId: 'test_date_session_2'
        })
    }).then(r => r.json());

    console.log('Reply:\n', res3.reply);
    assert(res3.reply.includes('الإثنين'), 'Expected reply to reference calculated Monday');
    assert(!res3.reply.includes('يوم إيه'), 'Must not ask what day when Monday was provided');

    // Follow up with price question
    const res4 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'هو الكشف بكام؟',
            sessionId: 'test_date_session_2'
        })
    }).then(r => r.json());

    console.log('Price Reply:\n', res4.reply);
    assert(res4.reply.includes('350 جنيه') || res4.reply.includes('أسعار'), 'Expected price breakdown');
    assert(res4.reply.includes('الإثنين'), 'Expected AI to maintain draft context for Monday');
    console.log('✅ Test 3 PASSED: Weekday resolved and context retained during price question.\n');

    // -------------------------------------------------------------
    // Test 4: Direct Availability Inquiry in English / Transliteration ("what are the available slots tomorrow?")
    // -------------------------------------------------------------
    console.log('▶ Test 4: English relative query ("what are the available slots tomorrow?")...');
    const res5 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'what are the available slots tomorrow with Dr Sara?',
            sessionId: 'test_date_session_3'
        })
    }).then(r => r.json());

    console.log('Reply:\n', res5.reply);
    assert(res5.suggestedSlots && res5.suggestedSlots.length > 0, 'Expected slots for tomorrow');
    console.log('✅ Test 4 PASSED: English query "tomorrow" resolved directly to tool execution.\n');

    console.log('🎉 ALL 4 DATE-AWARENESS & AVAILABILITY TESTS PASSED PERFECTLY!');
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
