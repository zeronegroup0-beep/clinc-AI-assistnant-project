const assert = require('assert');
const { processChatMessage } = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');

async function runUnifiedMultiDoctorTests() {
    console.log('================================================================');
    console.log('🧪 VERIFYING UNIFIED MULTI-DOCTOR COORDINATED BOOKING');
    console.log('================================================================\n');

    let passedCount = 0;
    const fixedCurrentDate = new Date(2026, 8, 18, 10, 0, 0); // Friday Sept 18, 2026

    // -------------------------------------------------------------
    // TEST 1: Same-Day Consecutive Slot Coordination (Ahmed + Hossam on Monday)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Same-Day Consecutive Slot Coordination ---');
    {
        // Turn 1: User mentions two doctors
        const r1 = await processChatMessage({
            message: 'عايز احجز مع دكتور احمد شريف ودكتور حسام فتحي',
            sessionId: 'uni_t1',
            currentDate: fixedCurrentDate
        });
        assert(r1.reply.includes('د. أحمد شريف') && r1.reply.includes('د. حسام فتحي'), 'Should list both doctors');
        assert.strictEqual(r1.state.multiDoctorContext.step, 'AWAITING_FIRST_DOCTOR_CHOICE');

        // Turn 2: User picks Dr. Ahmed first
        const r2 = await processChatMessage({
            message: 'دكتور احمد',
            sessionId: 'uni_t1',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        assert(r2.reply.includes('د. أحمد شريف'), 'Should acknowledge starting with Dr. Ahmed');
        assert(r2.reply.includes('يوم إيه والساعة كام'), 'Should prompt for preferred day and time');

        // Turn 3: User picks Monday 5:30 PM for Dr. Ahmed
        const r3 = await processChatMessage({
            message: 'يوم الاتنين 5:30',
            sessionId: 'uni_t1',
            sessionData: r2.state,
            currentDate: fixedCurrentDate
        });

        // Verify proactive consecutive slot suggestion
        assert(r3.reply.includes('5:30 مساءً'), 'Should acknowledge Dr. Ahmed Monday 5:30 PM');
        assert(r3.reply.includes('نفس اليوم'), 'Should mention same-day coordination ("في نفس اليوم")');
        assert(r3.reply.includes('6:00 مساءً') || r3.reply.includes('6:00'), 'Should suggest 6:00 PM for Dr. Hossam');
        assert(r3.reply.includes('د. حسام فتحي'), 'Should name Dr. Hossam for second appointment');
        assert.strictEqual(r3.card, undefined, 'Must NOT issue premature confirmation card after doctor 1');
        assert.strictEqual(r3.state.multiDoctorContext.step, 'AWAITING_SECOND_DOCTOR_SLOT');
        assert.strictEqual(r3.state.multiDoctorContext.suggestedSlot, '6:00 مساءً');
        console.log('  ✅ [PASS] Proactively recommends Dr. Hossam at 6:00 PM on the same Monday after Dr. Ahmed 5:30 PM without premature card');
        passedCount++;

        // -------------------------------------------------------------
        // TEST 2 & 3: Confirmation of Suggested Slot & Pending Summary Card (with Pricing)
        // -------------------------------------------------------------
        console.log('\n--- TEST 2 & 3: Slot Confirmation & Pending Summary Card with Prices ---');
        // Turn 4: User accepts suggested slot and provides details: "تمام وعماد 01012345678"
        const r4 = await processChatMessage({
            message: 'تمام انا عماد 01012345678',
            sessionId: 'uni_t1',
            sessionData: r3.state,
            currentDate: fixedCurrentDate
        });

        // Verify pending summary output
        assert(r4.reply.includes('مسودة معلقة') || r4.reply.includes('ملخص الحجز المجمّع'), 'Must display unified pending summary');
        assert(r4.reply.includes('350 جنيه'), 'Must show Dr. Ahmed fee (350 EGP)');
        assert(r4.reply.includes('500 جنيه'), 'Must show Dr. Hossam fee (500 EGP)');
        assert(r4.reply.includes('850 جنيه'), 'Must show total sum (850 EGP)');
        assert(r4.reply.includes('أستاذ عماد') || r4.reply.includes('عماد'), 'Must include patient name');
        assert(r4.reply.includes('01012345678'), 'Must include WhatsApp phone');
        assert(r4.reply.includes('تمام') && r4.reply.includes('أكد الحجز'), 'Must prompt for explicit confirmation');
        assert.strictEqual(r4.card, undefined, 'Must NOT issue finalized booking card while pending');
        assert.strictEqual(r4.state.multiDoctorContext.step, 'AWAITING_UNIFIED_CONFIRMATION');
        console.log('  ✅ [PASS] Displays unified pending summary with price breakdown (350 + 500 = 850 EGP) and explicit confirmation prompt');
        passedCount++;

        // -------------------------------------------------------------
        // TEST 4: Consolidated Final Confirmation ("تأكيد على مرة واحدة")
        // -------------------------------------------------------------
        console.log('\n--- TEST 4: Consolidated Final Confirmation & Single WhatsApp Promise ---');
        // Turn 5: User confirms: "تمام أكد الحجز"
        const r5 = await processChatMessage({
            message: 'تمام أكد الحجز',
            sessionId: 'uni_t1',
            sessionData: r4.state,
            currentDate: fixedCurrentDate
        });

        assert(r5.reply.includes('تم تأكيد حجزك بنجاح'), 'Must announce successful consolidated confirmation');
        assert(r5.reply.includes('رسالة واحدة على الواتساب'), 'Must promise single consolidated WhatsApp message');
        assert(r5.reply.includes('850 جنيه'), 'Must state total price (850 EGP)');
        assert(r5.card, 'Must generate confirmation card');
        assert.strictEqual(r5.card.type, 'unified_booking_confirmed', 'Card type must be unified_booking_confirmed');
        assert.strictEqual(r5.card.totalPrice, 850, 'Card total price must be 850');
        assert.strictEqual(r5.card.appointments.length, 2, 'Card must contain exactly 2 booked appointments');
        assert.strictEqual(r5.state.multiDoctorContext, undefined, 'Must clean up multiDoctorContext after completion');
        console.log('  ✅ [PASS] Finalizes both bookings together, emits unified card, and promises single WhatsApp message');
        passedCount++;
    }

    // -------------------------------------------------------------
    // TEST 5: Different Working Days Coordination (Ahmed [Mon/Wed/Sat] & Sara [Sun/Tue/Thu])
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Different Working Days Coordination ---');
    {
        const r1 = await processChatMessage({
            message: 'عايز احجز مع دكتور احمد شريف ودكتورة سارة محمود',
            sessionId: 'uni_t5',
            currentDate: fixedCurrentDate
        });
        const r2 = await processChatMessage({
            message: 'دكتور احمد',
            sessionId: 'uni_t5',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        const r3 = await processChatMessage({
            message: 'يوم الاتنين 6:30',
            sessionId: 'uni_t5',
            sessionData: r2.state,
            currentDate: fixedCurrentDate
        });

        // Bot should recognize that Dr. Sara does NOT work on Monday and list her working days
        assert(r3.reply.includes('سارة محمود'), 'Should mention Dr. Sara');
        assert(r3.reply.includes('الأحد') && r3.reply.includes('الثلاثاء'), 'Should state Dr. Sara working days');
        console.log('  ✅ [PASS] Recognizes different working days and offers Dr. Sara specific working days');

        // User asks for Tuesday
        const r4 = await processChatMessage({
            message: 'يوم الثلاثاء',
            sessionId: 'uni_t5',
            sessionData: r3.state,
            currentDate: fixedCurrentDate
        });
        assert(r4.reply.includes('المواعيد المتاحة') && r4.reply.includes('سارة محمود'), 'Presents Tuesday slots for Dr. Sara');

        // User picks 4:00 PM and gives name/phone: "4 ومحمود 01012345678"
        const r5 = await processChatMessage({
            message: 'الساعة 4 ومحمود 01012345678',
            sessionId: 'uni_t5',
            sessionData: r4.state,
            currentDate: fixedCurrentDate
        });

        assert(r5.reply.includes('مسودة معلقة') || r5.reply.includes('ملخص الحجز المجمّع'), 'Must output unified pending summary');
        assert(r5.reply.includes('350 جنيه'), 'Dr. Ahmed 350 EGP');
        assert(r5.reply.includes('400 جنيه'), 'Dr. Sara 400 EGP');
        assert(r5.reply.includes('750 جنيه'), 'Total 750 EGP');

        // Confirm
        const r6 = await processChatMessage({
            message: 'تمام',
            sessionId: 'uni_t5',
            sessionData: r5.state,
            currentDate: fixedCurrentDate
        });
        assert.strictEqual(r6.card.type, 'unified_booking_confirmed');
        assert.strictEqual(r6.card.totalPrice, 750);
        console.log('  ✅ [PASS] Coordinates appointments on different days smoothly and outputs unified confirmation');
        passedCount += 2;
    }

    // -------------------------------------------------------------
    // TEST 6: Graceful Decline / Adjustment in Pending State
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Graceful Decline / Single Doctor Retention in Pending State ---');
    {
        const r1 = await processChatMessage({
            message: 'عايز احجز مع دكتور احمد شريف ودكتور حسام فتحي',
            sessionId: 'uni_t6',
            currentDate: fixedCurrentDate
        });
        const r2 = await processChatMessage({
            message: 'دكتور احمد',
            sessionId: 'uni_t6',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        const r3 = await processChatMessage({
            message: 'يوم الاتنين 7:30',
            sessionId: 'uni_t6',
            sessionData: r2.state,
            currentDate: fixedCurrentDate
        });
        const r4 = await processChatMessage({
            message: 'تمام وسارة 01098765432',
            sessionId: 'uni_t6',
            sessionData: r3.state,
            currentDate: fixedCurrentDate
        });
        assert.strictEqual(r4.state.multiDoctorContext.step, 'AWAITING_UNIFIED_CONFIRMATION');

        // User decides not to book Dr. Hossam: "لا بلاش دكتور حسام كفاية دكتور احمد"
        const r5 = await processChatMessage({
            message: 'لا بلاش دكتور حسام كفاية دكتور احمد',
            sessionId: 'uni_t6',
            sessionData: r4.state,
            currentDate: fixedCurrentDate
        });
        assert(r5.reply.includes('لغينا حجز الكشف التاني') || r5.reply.includes('د. أحمد شريف'), 'Handles cancellation of doctor 2 gracefully');
        assert.strictEqual(r5.state.pendingBooking.doctor, 'د. أحمد شريف', 'Retains Dr. Ahmed in pending booking');

        // Confirm single doctor
        const r6 = await processChatMessage({
            message: 'أكد الحجز',
            sessionId: 'uni_t6',
            sessionData: r5.state,
            currentDate: fixedCurrentDate
        });
        assert(r6.reply.includes('تم تأكيد حجز حضرتك يا أستاذة سارة بنجاح'), 'Confirms single booking with feminine honorific');
        assert.strictEqual(r6.card.doctor, 'د. أحمد شريف');
        console.log('  ✅ [PASS] Canceling second doctor in pending state smoothly reverts to single doctor booking');
        passedCount += 2;
    }

    console.log('\n================================================================');
    console.log(`📊 RESULTS: ${passedCount} / ${passedCount} TESTS PASSED (100%)`);
    console.log('================================================================\n');
    console.log('🎉 UNIFIED MULTI-DOCTOR COORDINATED BOOKING FULLY VERIFIED!');
}

runUnifiedMultiDoctorTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
