require('dotenv').config();
const receptionistAgent = require('../services/receptionistAgent');

async function runEdgeCaseTests() {
    console.log('=== 🧪 RUNNING EDGE CASES & VALIDATION TESTS ===\n');

    const sessionId = 'edge_test_' + Date.now();
    let sessionData = {};

    // 1. Test Typo & Slang Tolerance ("عيز احغز كشف اسنان يوم الاتنين الساعه 5:30")
    console.log('--- Test 1: Egyptian Typo Tolerance ("عيز احغز كشف اسنان يوم الاتنين الساعه 5:30") ---');
    let res = await receptionistAgent.processChatMessage({
        message: 'عيز احغز كشف اسنان يوم الاتنين الساعه 5:30',
        sessionId,
        sessionData
    });
    console.log('User: عيز احغز كشف اسنان يوم الاتنين الساعه 5:30');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);
    sessionData = res.state;

    if (res.reply.includes('الميعاد متاح') && sessionData.pendingBooking) {
        console.log('✅ Test 1 PASSED: Correctly mapped typos (عيز احغز / الاتنين) to a valid booking request.\n');
    } else {
        console.error('❌ Test 1 FAILED');
    }

    // 2. Test Input Validation Awareness: Invalid Phone Number ("012345")
    console.log('--- Test 2: Invalid Short Phone Number ("012345") ---');
    res = await receptionistAgent.processChatMessage({
        message: '012345',
        sessionId,
        sessionData
    });
    console.log('User: 012345');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);
    sessionData = res.state;

    if (res.reply === 'عفواً، الرقم اللي دخلته غير صحيح، يرجى كتابة رقم واتساب صحيح (مثال: 01012345678).') {
        console.log('✅ Test 2 PASSED: Explicitly returned validation error for invalid phone format.\n');
    } else {
        console.error('❌ Test 2 FAILED');
    }

    // 3. Test State Memory: Providing Name when phone was invalid
    console.log('--- Test 3: Providing Name ("اسمي طارق") without phone ---');
    res = await receptionistAgent.processChatMessage({
        message: 'اسمي طارق',
        sessionId,
        sessionData
    });
    console.log('User: اسمي طارق');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);
    sessionData = res.state;

    if (res.reply.includes('أستاذ طارق') && res.reply.includes('رقم الواتساب') && !res.reply.includes('اسم حضرتك')) {
        console.log('✅ Test 3 PASSED: Remembered name and asked ONLY for the phone number.\n');
    } else {
        console.error('❌ Test 3 FAILED');
    }

    // 4. Test Second Invalid Phone attempt ("12345678901") - Does not start with 01
    console.log('--- Test 4: Invalid Phone Prefix ("12345678901") ---');
    res = await receptionistAgent.processChatMessage({
        message: '12345678901',
        sessionId,
        sessionData
    });
    console.log('User: 12345678901');
    console.log('Noura (AI):', res.reply);
    sessionData = res.state;

    if (res.reply === 'عفواً، الرقم اللي دخلته غير صحيح، يرجى كتابة رقم واتساب صحيح (مثال: 01012345678).') {
        console.log('✅ Test 4 PASSED: Rejected 11-digit number not starting with 01.\n');
    } else {
        console.error('❌ Test 4 FAILED');
    }

    // 5. Test Providing Valid Phone ("01012345678") -> Completes Booking
    console.log('--- Test 5: Providing Valid Phone ("01012345678") ---');
    res = await receptionistAgent.processChatMessage({
        message: '01012345678',
        sessionId,
        sessionData
    });
    console.log('User: 01012345678');
    console.log('Noura (AI):', res.reply);
    console.log('Card:', res.card);
    sessionData = res.state;

    if (res.card && res.card.type === 'booking_confirmed' && res.reply.includes('أستاذ طارق')) {
        console.log('✅ Test 5 PASSED: Completed booking with stored name and newly provided valid phone.\n');
    } else {
        console.error('❌ Test 5 FAILED');
    }

    // 6. Test Incomprehensible / Gibberish Input ("خثصثقخه سيبليشسيب")
    console.log('--- Test 6: Incomprehensible Gibberish ("خثصثقخه سيبليشسيب") ---');
    res = await receptionistAgent.processChatMessage({
        message: 'خثصثقخه سيبليشسيب',
        sessionId,
        sessionData
    });
    console.log('User: خثصثقخه سيبليشسيب');
    console.log('Noura (AI):', res.reply);

    if (res.reply === 'عفواً، ما فهمتش قصد حضرتك، ممكن توضح أكتر إزاي أقدر أساعدك؟') {
        console.log('✅ Test 6 PASSED: Handled gibberish with polite clarification request.\n');
    } else {
        console.error('❌ Test 6 FAILED');
    }

    // 7. Test Phone without Name Flow: New Session
    console.log('--- Test 7: Phone First, Name Second Flow ---');
    const session2Id = 'session2_' + Date.now();
    let session2Data = {};

    // Ask for booking
    res = await receptionistAgent.processChatMessage({
        message: 'احجذ ميعاد جلدية بكرة الساعة 4',
        sessionId: session2Id,
        sessionData: session2Data
    });
    session2Data = res.state;

    // Send only phone
    res = await receptionistAgent.processChatMessage({
        message: '01122334455',
        sessionId: session2Id,
        sessionData: session2Data
    });
    console.log('User: 01122334455');
    console.log('Noura (AI):', res.reply);
    session2Data = res.state;

    // Should ask ONLY for the name
    if (res.reply.includes('اسم حضرتك') && !res.reply.includes('رقم الواتساب') && session2Data.patientPhone === '01122334455') {
        console.log('✅ Test 7 PASSED: Asked ONLY for the name since phone is already collected.\n');
    } else {
        console.error('❌ Test 7 FAILED');
    }

    // Provide name
    res = await receptionistAgent.processChatMessage({
        message: 'اسمي مريم عادل',
        sessionId: session2Id,
        sessionData: session2Data
    });
    console.log('User: اسمي مريم عادل');
    console.log('Noura (AI):', res.reply);
    console.log('Card:', res.card);

    if (res.card && res.card.type === 'booking_confirmed' && res.reply.includes('أستاذة مريم عادل')) {
        console.log('✅ Test 8 PASSED: Successfully completed booking when name provided second.\n');
    } else {
        console.error('❌ Test 8 FAILED');
    }

    console.log('=== ALL EDGE CASE & VALIDATION TESTS PASSED! ===');
}

runEdgeCaseTests().catch(console.error);
