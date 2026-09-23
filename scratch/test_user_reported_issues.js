const receptionistAgent = require('../services/receptionistAgent');

async function verifyAllIssues() {
    console.log('=== VERIFYING USER REPORTED ISSUES & NEW PROTOCOLS ===\n');
    let passCount = 0;
    let failCount = 0;

    function check(testName, condition, details = '') {
        if (condition) {
            console.log(`✅ PASS: ${testName}`);
            passCount++;
        } else {
            console.error(`❌ FAIL: ${testName}`);
            if (details) console.error(`   Details: ${details}`);
            failCount++;
        }
    }

    // --- ISSUE 1: The screenshot bug with repeated words "مع حد مع حد من السكرتارية او الادارة" ---
    console.log('--- 1. Testing Secretary Takeover on Repeated Words ---');
    const takeoverMsg = 'كنت عايز اتواصل مع حد مع حد من السكرتارية او الادارة لو سمحت';
    const res1 = await receptionistAgent.processChatMessage({
        message: takeoverMsg,
        sessionId: 'test_user_bug_1',
        sessionData: {}
    });

    check(
        'Takeover triggered for "مع حد مع حد من السكرتارية او الادارة"',
        res1.state?.takeoverRequested === true || res1.state?.humanTakeover === true,
        JSON.stringify(res1.state)
    );

    check(
        'Zero collision with Dr. Hossam Fathy (Diabetes/Cardiology)',
        !res1.reply.includes('حسام') && !res1.reply.includes('الباطنة') && !res1.reply.includes('السكري'),
        `Got reply: ${res1.reply}`
    );

    check(
        'Reply confirms connecting to secretary / management',
        res1.reply.includes('السكرتارية') || res1.reply.includes('الإدارة') || res1.reply.includes('موظف الاستقبال'),
        `Got reply: ${res1.reply}`
    );

    // --- ISSUE 2: Initial Greeting without demanding patient name ---
    console.log('\n--- 2. Testing Non-Mandatory Name on Initial Greetings ---');
    const greetings = [
        'سلام عليكم',
        'السلام عليكم ورحمة الله',
        'صباح الخير',
        'مساء الخير',
        'Hello'
    ];

    for (const g of greetings) {
        const resG = await receptionistAgent.processChatMessage({
            message: g,
            sessionId: `test_greeting_${encodeURIComponent(g)}`,
            sessionData: {}
        });

        check(
            `Greeting "${g}" does NOT demand name upfront`,
            !resG.reply.includes('يشرفني أعرف اسم حضرتك') && !resG.reply.includes('May I please have your name'),
            resG.reply
        );

        check(
            `Greeting "${g}" does NOT set awaitingName`,
            resG.state?.awaitingName !== true,
            JSON.stringify(resG.state)
        );
    }

    // --- ISSUE 3: General inquiries without demanding name ---
    console.log('\n--- 3. General inquiries without demanding name ---');
    const docInquiryRes = await receptionistAgent.processChatMessage({
        message: 'عندكم دكاترة إيه في العيادة؟',
        sessionId: 'test_inquiry_docs',
        sessionData: {}
    });
    check(
        'Doctor inquiry returns doctors without demanding name',
        docInquiryRes.reply.includes('أحمد شريف') && !docInquiryRes.reply.includes('يشرفني أعرف اسم حضرتك'),
        docInquiryRes.reply
    );

    const priceInquiryRes = await receptionistAgent.processChatMessage({
        message: 'بكام كشف الأسنان؟',
        sessionId: 'test_inquiry_price',
        sessionData: {}
    });
    check(
        'Price inquiry answers directly without demanding name',
        priceInquiryRes.reply.includes('250') || priceInquiryRes.reply.includes('الأسنان'),
        priceInquiryRes.reply
    );

    // --- ISSUE 4: Name requested only when confirming booking ---
    console.log('\n--- 4. Full Booking Flow (Name requested at confirmation) ---');
    let bookingState = {};
    
    // Step 1: Request appointment slot
    const bookStep1 = await receptionistAgent.processChatMessage({
        message: 'عايز أحجز كشف أسنان مع دكتور أحمد شريف يوم السبت الساعة 5:00 مساءً',
        sessionId: 'test_booking_flow_1',
        sessionData: bookingState
    });
    bookingState = bookStep1.state;

    check(
        'Booking step 1 sets awaitingName when slot is picked',
        bookingState.awaitingName === true,
        JSON.stringify(bookingState)
    );

    check(
        'Booking step 1 asks for triple name for file registration',
        bookStep1.reply.includes('اسم حضرتك') || bookStep1.reply.includes('الثلاثي'),
        bookStep1.reply
    );

    // Step 2: Patient sends incomplete name (1 word)
    const bookStep2 = await receptionistAgent.processChatMessage({
        message: 'محمود',
        sessionId: 'test_booking_flow_1',
        sessionData: bookingState
    });
    bookingState = bookStep2.state;

    check(
        'Incomplete single name rejected for booking file',
        bookingState.awaitingName === true && (bookStep2.reply.includes('الثلاثي') || bookStep2.reply.includes('3 كلمات')),
        bookStep2.reply
    );

    // Step 3: Patient sends full triple name
    const bookStep3 = await receptionistAgent.processChatMessage({
        message: 'محمود شريف حسن',
        sessionId: 'test_booking_flow_1',
        sessionData: bookingState
    });
    bookingState = bookStep3.state;

    check(
        'Triple name accepted and awaitingName cleared',
        bookingState.patientName === 'محمود شريف حسن' && !bookingState.awaitingName,
        JSON.stringify(bookingState)
    );

    check(
        'Prompted for WhatsApp phone number',
        bookingState.awaitingPhone === true,
        bookStep3.reply
    );

    // Step 4: Patient provides phone number
    const bookStep4 = await receptionistAgent.processChatMessage({
        message: '01012345678',
        sessionId: 'test_booking_flow_1',
        sessionData: bookingState
    });
    bookingState = bookStep4.state;

    check(
        'Appointment booked with 5-digit booking code',
        /\b\d{5}\b/.test(bookStep4.reply) || Boolean(bookingState.bookingId),
        bookStep4.reply
    );

    console.log(`\n========================================`);
    console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================`);

    process.exit(failCount === 0 ? 0 : 1);
}

verifyAllIssues().catch(err => {
    console.error(err);
    process.exit(1);
});
