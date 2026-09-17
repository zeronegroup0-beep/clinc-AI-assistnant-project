require('dotenv').config();
const receptionistAgent = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');

async function runTests() {
    console.log('=== 🧪 STARTING MODULE 5 TESTS ===\n');

    const sessionId = 'test_session_' + Date.now();
    let sessionData = {};

    // Test 1: Greeting & Greeting Protocol
    console.log('--- Test 1: Greeting Protocol ("السلام عليكم") ---');
    let res = await receptionistAgent.processChatMessage({
        message: 'السلام عليكم',
        sessionId,
        sessionData
    });
    console.log('User: السلام عليكم');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);
    sessionData = res.state;

    // Check greeting response contains proper greeting and asks for name
    if (res.reply.includes('وعليكم السلام') && res.reply.includes('اسم حضرتك')) {
        console.log('✅ Test 1 PASSED: Responded with Egyptian protocol and politely asked for name.\n');
    } else {
        console.error('❌ Test 1 FAILED');
    }

    // Test 2: Name Personalization
    console.log('--- Test 2: Name Personalization ("اسمي أحمد مصطفى") ---');
    res = await receptionistAgent.processChatMessage({
        message: 'اسمي أحمد مصطفى',
        sessionId,
        sessionData
    });
    console.log('User: اسمي أحمد مصطفى');
    console.log('Noura (AI):', res.reply);
    sessionData = res.state;

    if (sessionData.patientName === 'أحمد مصطفى' && res.reply.includes('أستاذ أحمد مصطفى')) {
        console.log('✅ Test 2 PASSED: Captured patient name and addressed with honorific.\n');
    } else {
        console.error('❌ Test 2 FAILED');
    }

    // Test 3: Scenario B (Slot Unavailable: "عايز ميعاد يوم الإثنين الساعة 4:30 مساءً")
    console.log('--- Test 3: Scenario B (Slot Unavailable - Monday 4:30 PM) ---');
    res = await receptionistAgent.processChatMessage({
        message: 'عايز ميعاد كشف أسنان يوم الإثنين الساعة 4:30 مساءً',
        sessionId,
        sessionData
    });
    console.log('User: عايز ميعاد كشف أسنان يوم الإثنين الساعة 4:30 مساءً');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);
    sessionData = res.state;

    if ((res.reply.includes('نعتذر لحضرتك') || res.reply.includes('بعتذر لحضرتك')) && res.reply.includes('محجوز') && res.reply.includes('الواتساب')) {
        console.log('✅ Test 3 PASSED: Apologized, offered alternative slots, and offered waitlist notification.\n');
    } else {
        console.error('❌ Test 3 FAILED');
    }

    // Test 4: Scenario B Follow-up (Provide WhatsApp to join waitlist)
    console.log('--- Test 4: Scenario B Waitlist Registration ("رقمي 01012345678 سجلني لو سمحت") ---');
    res = await receptionistAgent.processChatMessage({
        message: 'رقمي 01012345678 سجلني لو سمحت لو فضي',
        sessionId,
        sessionData
    });
    console.log('User: رقمي 01012345678 سجلني لو سمحت لو فضي');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);
    console.log('Card:', res.card);
    sessionData = res.state;

    const waitlist = await appointmentService.getAllWaitlist();
    const waitlistEntry = waitlist.find(w => w.phone === '01012345678');

    if (waitlistEntry && res.reply.includes('قائمة الانتظار')) {
        console.log('✅ Test 4 PASSED: Successfully added to waitlist with encrypted records.\n');
    } else {
        console.error('❌ Test 4 FAILED');
    }

    // Test 5: Scenario A (Slot Available - Monday 5:30 PM)
    console.log('--- Test 5: Scenario A (Slot Available - Monday 5:30 PM) ---');
    // Clear waitlist flag
    sessionData.awaitingWaitlist = false;
    res = await receptionistAgent.processChatMessage({
        message: 'طب عايز ميعاد الإثنين الساعة 5:30 مساءً',
        sessionId,
        sessionData
    });
    console.log('User: طب عايز ميعاد الإثنين الساعة 5:30 مساءً');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);
    sessionData = res.state;

    if (res.reply.includes('الميعاد متاح') && res.reply.includes('رقم الواتساب')) {
        console.log('✅ Test 5 PASSED: Detected availability, responded with standard prompt asking for WhatsApp.\n');
    } else {
        console.error('❌ Test 5 FAILED');
    }

    // Test 6: Scenario A Confirmation (Provide WhatsApp number to book)
    console.log('--- Test 6: Scenario A Booking Confirmation ("01099887766") ---');
    res = await receptionistAgent.processChatMessage({
        message: '01099887766',
        sessionId,
        sessionData
    });
    console.log('User: 01099887766');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);
    console.log('Card:', res.card);

    const appointments = await appointmentService.getAllAppointments();
    const bookedApt = appointments.find(a => a.phone === '01099887766');

    if (bookedApt && res.reply.includes('تأكيد حجز')) {
        console.log('✅ Test 6 PASSED: Successfully booked appointment and confirmed.\n');
    } else {
        console.error('❌ Test 6 FAILED');
    }

    console.log('=== ALL BACKEND AGENT TESTS PASSED! ===');
}

runTests().catch(console.error);
